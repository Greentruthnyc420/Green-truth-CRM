import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Clock, TrendingUp, Award, PartyPopper, CheckCircle, Wallet, Banknote } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getMyDispensaries, getSales, getUserActivations } from '../services/firestoreService';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import {
    calculateHourlyRate,
    calculateTotalLifetimeBonuses,
    calculateRepCommission,
    calculateReimbursement,
    getMilestoneBonus,
    OWNER_EMAIL
} from '../services/compensationService';
import RepSignupLink from '../components/RepSignupLink';

const StatCard = ({ title, value, subtext, icon: IconComponent, trend, highlight, secondaryValue }) => (
    <div className={`themed-card p-6 rounded-xl ${highlight ? 'ring-4' : ''} shadow-sm hover:shadow-md transition-all`}
        style={highlight ? { borderColor: 'var(--accent-primary)', boxShadow: 'var(--glow-accent)' } : {}}
    >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-lg" style={{ background: 'var(--accent-primary)', opacity: highlight ? 1 : 0.2 }}>
                <IconComponent size={24} style={{ color: highlight ? 'var(--text-inverse)' : 'var(--accent-primary)' }} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--accent-primary)' }}>
                    <TrendingUp size={14} />
                    {trend}
                </div>
            )}
        </div>
        <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
        <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
        {secondaryValue && (
            <div className="text-sm font-medium mb-1" style={{ color: 'var(--success)' }}>{secondaryValue}</div>
        )}
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{subtext}</p>
    </div>
);

const MilestoneOverlay = ({ message, onClose }) => {
    useEffect(() => {
        // Play celebration sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Fanfare
        audio.volume = 0.5;
        audio.play().catch(e => console.log("Audio play failed (user interaction needed)", e));

        const timer = setTimeout(onClose, 10000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn p-4">
            <div className="themed-card p-8 md:p-12 rounded-3xl text-center w-full max-w-3xl transform animate-bounce-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-300 animate-pulse" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-7xl mb-6 animate-bounce">🎊 🏆 🎊</div>
                    <h1 className="text-3xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-purple-600 to-brand-600 bg-300% animate-gradient mb-6 drop-shadow-sm leading-tight whitespace-nowrap">
                        CONGRATULATIONS!
                    </h1>
                    <p className="text-xl md:text-3xl text-slate-700 font-bold mb-10 leading-relaxed">
                        {message}
                    </p>
                    <button
                        onClick={onClose}
                        className="bg-brand-600 text-white px-10 py-4 rounded-full text-lg font-bold hover:bg-brand-700 hover:scale-105 transition-all shadow-xl hover:shadow-brand-300/50"
                    >
                        Awesome! Let's Go! 🚀
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Dashboard() {
    const { currentUser } = useAuth();
    const [storeCount, setStoreCount] = useState(0);
    const [hourlyRate, setHourlyRate] = useState(20);
    const [totalCommission, setTotalCommission] = useState(0);
    const [paidCommission, setPaidCommission] = useState(0);
    const [pendingWages, setPendingWages] = useState(0);
    const [paidWages, setPaidWages] = useState(0);
    const [estimatedPay, setEstimatedPay] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [milestoneMessage, setMilestoneMessage] = useState(null);
    const [showMilestoneParams, setShowMilestoneParams] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // Fetch Data using real User ID
                const userId = currentUser.uid;
                const dispensaries = await getMyDispensaries(userId);
                const allSales = await getSales();
                const sales = allSales.filter(s => s.userId === userId);
                const activations = await getUserActivations(userId);

                // 1. Store Count & Hourly Rate
                const count = dispensaries.length;
                setStoreCount(count);

                const rate = calculateHourlyRate(count, currentUser?.email);
                setHourlyRate(rate);

                // 2. Commission tracking (Paid vs Pending)
                // Pending = status is 'pending' or 'completed' (not collected yet)
                // Collected but unpaid = status is 'collected'
                // Paid = status is 'paid'
                const pendingSales = sales.filter(s => s.status !== 'paid' && s.status !== 'collected');
                const collectedUnpaidSales = sales.filter(s => s.status === 'collected');
                const paidSales = sales.filter(s => s.status === 'paid');

                const pendingSalesAmount = pendingSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                const collectedUnpaidAmount = collectedUnpaidSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                const paidSalesAmount = paidSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

                // Rep commission = 2% of sales
                const pendingComm = calculateRepCommission(pendingSalesAmount + collectedUnpaidAmount);
                const paidComm = calculateRepCommission(paidSalesAmount);

                setTotalCommission(pendingComm);
                setPaidCommission(paidComm);

                // 3. Activation Wages Tracking (Pending vs Paid)
                // Pending wages = status is NOT 'rep_paid'
                // Paid wages = status is 'rep_paid'
                const pendingActivations = activations.filter(a => a.status !== 'rep_paid');
                const paidActivations = activations.filter(a => a.status === 'rep_paid');

                const calculateActivationWages = (activationList) => {
                    let totalWages = 0;
                    let totalReimbursements = 0;
                    activationList.forEach(a => {
                        const hours = parseFloat(a.hoursWorked) || 0;
                        totalWages += hours * rate;
                        totalReimbursements += calculateReimbursement(
                            parseFloat(a.milesTraveled),
                            parseFloat(a.tollAmount),
                            a.hasVehicle
                        );
                    });
                    return totalWages + totalReimbursements;
                };

                const pendingWagesTotal = calculateActivationWages(pendingActivations);
                const paidWagesTotal = calculateActivationWages(paidActivations);

                setPendingWages(pendingWagesTotal);
                setPaidWages(paidWagesTotal);

                // Grand Total = Pending Wages + Unpaid Commissions (what they're still owed)
                const grandTotal = pendingWagesTotal + pendingComm;
                setEstimatedPay(grandTotal);

                // 4. Payment History (Recent paid items)
                const paidItems = [
                    ...paidActivations.map(a => ({
                        type: 'wages',
                        name: a.dispensaryName || 'Activation',
                        amount: (parseFloat(a.hoursWorked) || 0) * rate + calculateReimbursement(
                            parseFloat(a.milesTraveled),
                            parseFloat(a.tollAmount),
                            a.hasVehicle
                        ),
                        date: a.updatedAt || a.date
                    })),
                    ...paidSales.map(s => ({
                        type: 'commission',
                        name: s.dispensaryName || 'Sale',
                        amount: calculateRepCommission(parseFloat(s.amount) || 0),
                        date: s.updatedAt || s.date
                    }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

                setPaymentHistory(paidItems);

                // 5. Milestone Check (Animation)
                const currentMilestone = Math.floor(count / 10) * 10;

                if (currentMilestone > 0) {
                    const storageKey = `milestone_celebrated_${userId}`;
                    const lastCelebratedMilestone = parseInt(localStorage.getItem(storageKey) || '0', 10);

                    if (currentMilestone > lastCelebratedMilestone) {
                        const currentBonus = getMilestoneBonus(currentMilestone);

                        triggerConfetti();
                        setMilestoneMessage(`🎉 Congrats! You hit ${currentMilestone} stores! $${currentBonus || currentMilestone * 10} bonus unlocked!`);
                        setShowMilestoneParams({ count: currentMilestone, bonus: currentBonus || currentMilestone * 10 });

                        localStorage.setItem(storageKey, currentMilestone.toString());
                    }
                }

                // 6. Recent Activity (Top 5 Sales)
                const recentSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                setRecentActivity(recentSales);

            } catch (e) {
                console.error("Dashboard load failed", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentUser]);

    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    return (
        <div className="space-y-6">
            {showMilestoneParams && (
                <MilestoneOverlay
                    message={`You hit ${showMilestoneParams.count} stores! $${showMilestoneParams.bonus} bonus unlocked!`}
                    onClose={() => setShowMilestoneParams(null)}
                />
            )}

            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back, {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0].charAt(0).toUpperCase() + currentUser.email.split('@')[0].slice(1) : 'Ambassador')}!</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Here's your compensation breakdown.</p>
                {milestoneMessage && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-brand-100 via-white to-brand-100 border border-brand-200 text-brand-800 rounded-xl flex items-center justify-between gap-3 shadow-md animate-slideIn">
                        <div className="flex items-center gap-3">
                            <PartyPopper size={24} className="text-brand-600 animate-bounce" />
                            <span className="font-bold text-lg">{milestoneMessage}</span>
                        </div>
                        <button
                            onClick={() => setMilestoneMessage(null)}
                            className="p-1 hover:bg-brand-200 rounded-full transition-colors text-brand-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Lifetime Paid Section */}
            {(paidWages > 0 || paidCommission > 0) && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <CheckCircle size={24} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-700 font-medium">Total Paid to You</p>
                            <p className="text-2xl font-bold text-emerald-800">${(paidWages + paidCommission).toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="text-right text-sm text-emerald-600">
                        <p>Wages: ${paidWages.toFixed(2)}</p>
                        <p>Commissions: ${paidCommission.toFixed(2)}</p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/app/payouts/wages" className="block">
                    <StatCard
                        title="Pending Wages"
                        value={`$${pendingWages.toFixed(2)}`}
                        subtext="Activation wages awaiting payment"
                        icon={Wallet}
                        highlight={true}
                        secondaryValue={paidWages > 0 ? `✓ $${paidWages.toFixed(2)} paid` : null}
                    />
                </Link>
                <Link to="/app/payouts/commissions" className="block">
                    <StatCard
                        title="Unpaid Commissions"
                        value={`$${totalCommission.toFixed(2)}`}
                        subtext="Pending sales commissions (2%)"
                        icon={DollarSign}
                        secondaryValue={paidCommission > 0 ? `✓ $${paidCommission.toFixed(2)} paid` : null}
                    />
                </Link>
                <StatCard
                    title="Hourly Rate"
                    value={`$${hourlyRate.toFixed(2)} / hr`}
                    subtext={currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()
                        ? 'Flat Rate (No Bonus Structure)'
                        : `Base: $20. Boost: +$${(hourlyRate - 20).toFixed(0)}/hr`}
                    icon={TrendingUp}
                />
                <Link to="/app/accounts/active" className="block">
                    <StatCard
                        title="Active Dispensaries"
                        value={storeCount}
                        subtext="100 Stores = $1000 Bonus + $30/hr Rate"
                        icon={Award}
                    />
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="themed-card rounded-xl p-6 shadow-lg flex justify-between items-center"
                    style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }}>
                    <div>
                        <h2 className="text-xl font-bold mb-1">Manage Your Territory</h2>
                        <p className="text-brand-100 text-sm">Track activations and purchase history for your doors.</p>
                    </div>
                    <Link
                        to="/app/my-dispensaries"
                        className="px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-inverse)' }}
                    >
                        View My Doors
                    </Link>
                </div>
                <RepSignupLink />
            </div>

            {/* Payment History Section */}
            {
                paymentHistory.length > 0 && (
                    <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                            <div className="flex items-center gap-2">
                                <Banknote size={20} style={{ color: 'var(--success)' }} />
                                <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Payments</h2>
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>Paid to You</span>
                        </div>
                        <div style={{ borderColor: 'var(--border-primary)' }}>
                            {paymentHistory.map((item, index) => (
                                <div key={index} className="p-4 transition-colors flex items-center justify-between"
                                    style={{ borderBottom: index < paymentHistory.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm`}
                                            style={{
                                                background: item.type === 'wages' ? 'var(--accent-secondary)' : 'var(--accent-tertiary)',
                                                color: 'var(--text-inverse)',
                                                opacity: 0.8
                                            }}>
                                            {item.type === 'wages' ? <Clock size={18} /> : <DollarSign size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                                            <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{item.type} Payment</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold" style={{ color: 'var(--success)' }}>+${item.amount.toFixed(2)}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{getRelativeTime(item.date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Recent Activity Section */}
            <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Recent Activity</h2>
                    <button className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>View All</button>
                </div>
                <div>
                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            No recent activity found. Log a sale to see it here!
                        </div>
                    ) : (
                        recentActivity.map((sale, index) => (
                            <div key={index} className="p-4 transition-colors flex items-center justify-between"
                                style={{ borderBottom: index < recentActivity.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                        style={{ background: 'var(--info)', color: 'var(--text-inverse)', opacity: 0.8 }}>
                                        {(sale.dispensaryName || 'Dispensary').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{sale.dispensaryName || 'Unknown Dispensary'}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sale Recorded • <span className="font-medium" style={{
                                            color: sale.status === 'paid' ? 'var(--success)' :
                                                sale.status === 'collected' ? 'var(--info)' : 'var(--warning)'
                                        }}>{sale.status === 'paid' ? 'Paid' : sale.status === 'collected' ? 'Collected' : 'Pending'}</span></p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(sale.amount).toFixed(2)}</p>
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{getRelativeTime(sale.date)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div >
    );
}

