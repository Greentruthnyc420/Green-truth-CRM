import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getAllShifts, getSales, getUserActivations, markWagesPaidWithHistory, getRepPaymentHistory } from '../../../services/firestoreService';
import { Users, Trophy, TrendingUp, Clock, Award, CheckCircle, AlertTriangle, PowerOff, Briefcase, Store, DollarSign, Wallet, Loader2 } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getCurrentPayPeriod, calculateHourlyRate, calculateReimbursement } from '../../../services/compensationService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminTeam() {
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [salesAmbassadors, setSalesAmbassadors] = useState([]);
    const [brandPartners, setBrandPartners] = useState([]);
    const [dispensaryPartners, setDispensaryPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [payingRep, setPayingRep] = useState(null); // Track which rep is being paid
    const payPeriod = getCurrentPayPeriod();

    useEffect(() => {
        async function loadTeamData() {
            setLoading(true);
            try {
                // Fetch all data for computation
                const [users, shifts, sales, integrationsSnapshot] = await Promise.all([
                    getAllUsers(),
                    getAllShifts(),
                    getSales(),
                    getDocs(collection(db, 'brand_integrations'))
                ]);

                const integrationsData = {};
                integrationsSnapshot.forEach(doc => {
                    integrationsData[doc.id] = doc.data();
                });

                // FALLBACK: If users table is empty, extract team members from activations/sales
                let effectiveUsers = users;
                if (!users || users.length === 0) {
                    console.log('Users table empty - extracting team from activations/sales data');
                    const extractedUsers = new Map();

                    // Extract from activations (reps who have done shifts)
                    shifts.forEach(shift => {
                        const repId = shift.repId || shift.userId || shift.rep_id;
                        const repName = shift.repName || shift.rep_name || 'Unknown Rep';
                        if (repId && !extractedUsers.has(repId)) {
                            extractedUsers.set(repId, {
                                id: repId,
                                email: repId.includes('@') ? repId : `${repId}@greentruth.local`,
                                name: repName,
                                role: 'rep',
                                profileInfo: { firstName: repName.split(' ')[0], lastName: repName.split(' ').slice(1).join(' ') }
                            });
                        }
                    });

                    // Extract from sales (reps who have logged sales)
                    sales.forEach(sale => {
                        const repId = sale.userId || sale.repId || sale.rep_id;
                        if (repId && !extractedUsers.has(repId)) {
                            extractedUsers.set(repId, {
                                id: repId,
                                email: repId.includes('@') ? repId : `${repId}@greentruth.local`,
                                name: sale.repName || 'Sales Rep',
                                role: 'rep',
                                profileInfo: { firstName: 'Sales', lastName: 'Rep' }
                            });
                        }
                    });

                    // Add demo admin user (Omar)
                    extractedUsers.set('admin-dev', {
                        id: 'admin-dev',
                        email: 'omar@thegreentruthhq.com',
                        name: 'Omar Elsayed',
                        role: 'admin', // Admin won't show in rep section but good to have
                        profileInfo: { firstName: 'Omar', lastName: 'Elsayed' }
                    });

                    effectiveUsers = Array.from(extractedUsers.values());
                    console.log('Extracted', effectiveUsers.length, 'users from activity data');
                }

                // --- 3-Way Split Logic ---
                // 1. Sales Ambassadors: role === 'rep' OR role === 'admin' (for visibility)
                const ambassadors = effectiveUsers.filter(u => u.role === 'rep' || u.role === 'admin');

                // 2. Brand Partners: ONLY role === 'brand' (strict filter)
                const brands = effectiveUsers.filter(u => u.role === 'brand');

                // 3. Dispensary Partners: role === 'dispensary', 'lead', or 'sale'
                // This captures clients who have logged in via the dispensary portal
                const dispensaries = effectiveUsers.filter(u =>
                    u.role === 'dispensary' || u.role === 'lead' || u.role === 'sale'
                );


                // Calculate stats for ambassadors ONLY
                const ambassadorStats = ambassadors.map(user => {
                    const userShifts = shifts.filter(s => (s.userId === user.id) || (s.repId === user.id) || (s.rep_id === user.id));
                    const userSales = sales.filter(s => (s.userId === user.id) || (s.repId === user.id));

                    const totalHours = userShifts.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || parseFloat(s.total_hours) || 0), 0);
                    const totalSalesAmount = userSales.reduce((sum, s) => sum + (parseFloat(s.amount) || parseFloat(s.totalAmount) || 0), 0);
                    const totalCommission = userSales.reduce((sum, s) => sum + (parseFloat(s.commissionEarned) || ((parseFloat(s.amount) || 0) * 0.02)), 0);
                    const integration = integrationsData[user.id];

                    // Calculate pending wages from activations/shifts
                    // Pending = status is NOT 'rep_paid'
                    const pendingActivations = userShifts.filter(s => s.status !== 'rep_paid');
                    const hourlyRate = calculateHourlyRate(0); // Use base rate for now, could fetch actual count later

                    let pendingWages = 0;
                    pendingActivations.forEach(a => {
                        const hours = parseFloat(a.hoursWorked) || 0;
                        pendingWages += hours * hourlyRate;
                        pendingWages += calculateReimbursement(
                            parseFloat(a.milesTraveled),
                            parseFloat(a.tollAmount),
                            a.hasVehicle
                        );
                    });

                    return {
                        ...user,
                        totalHours,
                        totalSalesAmount,
                        totalCommission,
                        saleCount: userSales.length,
                        shiftCount: userShifts.length,
                        pendingWages,
                        pendingActivations: pendingActivations.map(a => ({ id: a.id })),
                        integration: {
                            connected: !!integration?.mondayApiToken,
                            lastSyncTimestamp: integration?.lastSync?.timestamp?.toDate(),
                            hasErrors: integration?.lastSync ? !integration.lastSync.success : false,
                        }
                    };
                });

                const sortedAmbassadors = ambassadorStats.sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);

                setSalesAmbassadors(sortedAmbassadors);
                setBrandPartners(brands);
                setDispensaryPartners(dispensaries);

            } catch (error) {
                console.error("Failed to load team data", error);
            } finally {
                setLoading(false);
            }
        }
        loadTeamData();
    }, []);

    const topPerformer = salesAmbassadors[0];

    return (
        <div className="space-y-8 pb-20">
            <header>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Users className="text-brand-600" />
                    Team & Partners
                </h1>
                <p style={{ color: 'var(--text-tertiary)' }}>Manage ambassadors, brand partners, and dispensary clients.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <>
                    {/* --- SECTION 1: SALES AMBASSADORS --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <TrendingUp className="text-teal-500" />
                            Sales Ambassadors
                        </h2>

                        {topPerformer && topPerformer.totalSalesAmount > 0 && (
                            <div className="bg-gradient-to-r from-brand-600 to-teal-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                        <Trophy size={40} className="text-yellow-300" />
                                    </div>
                                    <div>
                                        <h3 className="text-brand-100 font-bold uppercase tracking-wider text-xs mb-1">Top Performer</h3>
                                        <p className="text-3xl font-bold">{topPerformer.profileInfo?.firstName || topPerformer.name || topPerformer.email}</p>
                                        <p className="text-brand-100 mt-1 flex items-center gap-2">
                                            <Award size={16} />
                                            ${topPerformer.totalSalesAmount.toLocaleString()} Total Sales
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                            </div>
                        )}

                        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Ambassador Roster</h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{salesAmbassadors.length} Active</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Ambassador</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Status</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Sales</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Hours</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Commission</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-right" style={{ color: 'var(--text-tertiary)' }}>Pending Wages</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {salesAmbassadors.map((member, idx) => (
                                            <tr key={member.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                                            {(member.email?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{member.profileInfo ? `${member.profileInfo.firstName} ${member.profileInfo.lastName || ''}` : (member.name || member.email?.split('@')[0] || 'Unknown User')}</p>
                                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.email || 'No Email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {member.integration.connected ? (
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle size={16} className="text-emerald-500" />
                                                            <span className="text-xs font-bold text-emerald-600">Active</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-slate-300">
                                                            <PowerOff size={16} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    ${member.totalSalesAmount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right" style={{ color: 'var(--text-secondary)' }}>
                                                    {member.totalHours.toFixed(1)}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-emerald-600">
                                                    ${member.totalCommission.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`font-bold ${member.pendingWages > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                                                        ${(member.pendingWages || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {member.pendingWages > 0 && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (!window.confirm(`Pay ${member.profileInfo?.firstName || member.name || 'this rep'} $${member.pendingWages?.toFixed(2)} for ${member.pendingActivations?.length || 0} activations?\n\nPeriod: ${payPeriod.label}`)) return;
                                                                    setPayingRep(member.id);
                                                                    try {
                                                                        await markWagesPaidWithHistory(
                                                                            member.id,
                                                                            member.profileInfo?.firstName || member.name || 'Unknown',
                                                                            member.pendingActivations?.map(a => a.id) || [],
                                                                            member.pendingWages,
                                                                            payPeriod.label,
                                                                            currentUser?.uid
                                                                        );
                                                                        showNotification(`Paid $${member.pendingWages?.toFixed(2)} to ${member.profileInfo?.firstName || 'rep'}`, 'success');
                                                                        // Update state instead of full page reload to preserve auth
                                                                        setSalesAmbassadors(prev => prev.map(m =>
                                                                            m.id === member.id
                                                                                ? { ...m, pendingWages: 0, pendingActivations: [] }
                                                                                : m
                                                                        ));
                                                                    } catch (error) {
                                                                        console.error('Payment failed:', error);
                                                                        showNotification('Payment failed: ' + error.message, 'error');
                                                                    } finally {
                                                                        setPayingRep(null);
                                                                    }
                                                                }}
                                                                disabled={payingRep === member.id}
                                                                className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                                                            >
                                                                {payingRep === member.id ? <Loader2 size={12} className="animate-spin" /> : <Wallet size={12} />}
                                                                Pay Wages
                                                            </button>
                                                        )}
                                                        <Link to={`/admin/team/${member.id}`} className="text-xs text-brand-600 hover:text-brand-800 font-bold hover:underline">View</Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {salesAmbassadors.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No ambassadors yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 2: BRAND PARTNERS --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Briefcase className="text-indigo-500" />
                            Brand Partners
                        </h2>
                        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Partner Brands</h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{brandPartners.length} Partners</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Partner Entity</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Contact</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Setup</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {brandPartners.map(partner => (
                                            <tr key={partner.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                            {(partner.name?.[0] || partner.email?.[0] || 'B').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{partner.name || 'Brand Partner'}</p>
                                                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Owner</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {partner.email}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link to={`/admin/team/${partner.id}`} className="text-xs px-3 py-1.5 rounded-lg font-bold transition-colors" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Manage</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {brandPartners.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No brand partners found.</p>}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 3: DISPENSARY PARTNERS (NEW) --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Store className="text-purple-500" />
                            Dispensary Clients
                        </h2>
                        <div className="themed-card rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                                <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Registered Dispensaries</h3>
                                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{dispensaryPartners.length} Clients</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Dispensary</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Location</th>
                                            <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-center" style={{ color: 'var(--text-tertiary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dispensaryPartners.map(partner => (
                                            <tr key={partner.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                            {(partner.name?.[0] || 'D').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{partner.dispensaryName || partner.name || 'Unnamed Dispensary'}</p>
                                                            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{partner.licenseNumber || 'No License'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {partner.address || 'Unknown Location'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link to={`/admin/team/${partner.id}`} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-bold transition-colors">View Profile</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {dispensaryPartners.length === 0 && <p className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>No dispensary clients registered yet.</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
