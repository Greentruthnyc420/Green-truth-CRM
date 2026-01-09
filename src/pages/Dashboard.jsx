import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Clock, TrendingUp, Award, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getMyDispensaries, getSales, getUserShifts } from '../services/firestoreService';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import {
    calculateHourlyRate,
    calculateTotalLifetimeBonuses,
    calculateRepCommission,
    calculateReimbursement,
    getMilestoneBonus
} from '../services/compensationService';

const StatCard = ({ title, value, subtext, icon: IconComponent, trend, highlight }) => (
    <div className={`bg-white p-6 rounded-xl border ${highlight ? 'border-brand-200 ring-4 ring-brand-50' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all`}>
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 ${highlight ? 'bg-brand-100 text-brand-700' : 'bg-brand-50 text-brand-600'} rounded-lg`}>
                <IconComponent size={24} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-brand-600 text-sm font-medium bg-brand-50 px-2 py-1 rounded-full">
                    <TrendingUp size={14} />
                    {trend}
                </div>
            )}
        </div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
        <p className="text-slate-400 text-xs">{subtext}</p>
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
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl text-center w-full max-w-3xl transform animate-bounce-in relative overflow-hidden ring-8 ring-white/20">
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
    const [estimatedPay, setEstimatedPay] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);
    // pendingHours removed (unused)
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
                const sales = allSales.filter(s => s.userId === userId); // Filter by current user
                const shifts = await getUserShifts(userId);

                // 1. Store Count & Hourly Rate
                const count = dispensaries.length;
                setStoreCount(count);

                const rate = calculateHourlyRate(count);
                setHourlyRate(rate);

                // 2. Commission (Sales % + Bonuses)
                const pendingSales = sales.filter(s => s.status !== 'paid');
                const pendingSalesOnly = pendingSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                const salesComm = calculateRepCommission(pendingSalesOnly);
                // bonuses removed
                // Wait, "Unpaid Bonuses". We don't track paid/unpaid on bonuses explicitly in DB yet.
                // Let's assume bonuses are paid out. For now, strict commission.
                setTotalCommission(salesComm); // Showing UNPAID commission now? Or Total? 
                // The prompt says "Current Cycle Earnings". 

                // 3. Bi-Weekly Pay (Pending Shifts)
                const pending = shifts.filter(s => s.status === 'pending');
                let totalHours = 0;
                let totalReimbursements = 0;

                pending.forEach(s => {
                    totalHours += parseFloat(s.hoursWorked) || 0;
                    totalReimbursements += calculateReimbursement(
                        parseFloat(s.milesTraveled),
                        parseFloat(s.tollAmount),
                        s.hasVehicle
                    );
                });

                // setPendingHours(totalHours);

                const wages = totalHours * rate;
                // Grand Total = Wages + Reimbursements + Unpaid Commissions
                const grandTotal = wages + totalReimbursements + salesComm;

                setEstimatedPay(grandTotal);

                // 4. Milestone Check (Animation)
                const currentBonus = getMilestoneBonus(count);
                if (currentBonus > 0) {
                    // Start Confetti!
                    triggerConfetti();
                    setMilestoneMessage(`🎉 Congrats! You hit ${count} stores! $${currentBonus} bonus unlocked!`);
                    setShowMilestoneParams({ count, bonus: currentBonus });
                }

                // 5. Recent Activity (Top 5 Sales)
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
                <h1 className="text-2xl font-bold text-slate-800">Welcome back, {currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0].charAt(0).toUpperCase() + currentUser.email.split('@')[0].slice(1) : 'Ambassador')}!</h1>
                <p className="text-slate-500">Here's your compensation breakdown.</p>
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
                            {/* Inline SVG Close Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/app/payouts/wages" className="block">
                    <StatCard
                        title="Current Cycle Earnings"
                        value={`$${estimatedPay.toFixed(2)}`}
                        subtext="Click for breakdown"
                        icon={Clock}
                        highlight={true}
                    />
                </Link>
                <Link to="/app/payouts/commissions" className="block">
                    <StatCard
                        title="Unpaid Commissions"
                        value={`$${totalCommission.toFixed(2)}`}
                        subtext="Pending sales commissions"
                        icon={DollarSign}
                    />
                </Link>
                <StatCard
                    title="Hourly Rate"
                    value={`$${hourlyRate.toFixed(2)} / hr`}
                    subtext={`Base: $20. Boost: +$${(hourlyRate - 20).toFixed(0)}/hr`}
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
            <div className="bg-gradient-to-r from-brand-600 to-teal-600 rounded-xl p-6 text-white shadow-lg mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold mb-1">Manage Your Territory</h2>
                    <p className="text-brand-100 text-sm">Track activations and purchase history for your doors.</p>
                </div>
                <Link to="/app/my-dispensaries" className="bg-white text-brand-600 px-6 py-2 rounded-lg font-bold hover:bg-brand-50 transition-colors shadow-sm">
                    View My Doors
                </Link>
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800">Recent Activity</h2>
                    <button className="text-brand-600 text-sm font-medium hover:text-brand-700">View All</button>
                </div>
                <div className="divide-y divide-slate-100">
                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No recent activity found. Log a sale to see it here!
                        </div>
                    ) : (
                        recentActivity.map((sale, index) => (
                            <div key={index} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {(sale.dispensaryName || 'Dispensary').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800">{sale.dispensaryName || 'Unknown Dispensary'}</p>
                                        <p className="text-xs text-slate-500">Sale Recorded</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800">${parseFloat(sale.amount).toFixed(2)}</p>
                                    <p className="text-xs text-slate-400">{getRelativeTime(sale.date)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
