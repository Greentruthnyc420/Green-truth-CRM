import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getAllShifts, getSales } from '../../../services/firestoreService';
import { Users, Trophy, TrendingUp, Clock, Award, CheckCircle, AlertTriangle, PowerOff, Briefcase, Store } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminTeam() {
    const [salesAmbassadors, setSalesAmbassadors] = useState([]);
    const [brandPartners, setBrandPartners] = useState([]);
    const [dispensaryPartners, setDispensaryPartners] = useState([]);
    const [loading, setLoading] = useState(true);

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

                // --- 3-Way Split Logic ---
                // 1. Sales Ambassadors: role === 'rep'
                const ambassadors = users.filter(u => u.role === 'rep');

                // 2. Brand Partners: ONLY role === 'brand' (strict filter)
                const brands = users.filter(u => u.role === 'brand');

                // 3. Dispensary Partners: role === 'dispensary', 'lead', or 'sale'
                // This captures clients who have logged in via the dispensary portal
                const dispensaries = users.filter(u =>
                    u.role === 'dispensary' || u.role === 'lead' || u.role === 'sale'
                );


                // Calculate stats for ambassadors ONLY
                const ambassadorStats = ambassadors.map(user => {
                    const userShifts = shifts.filter(s => s.userId === user.id);
                    const userSales = sales.filter(s => s.userId === user.id);

                    const totalHours = userShifts.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || 0), 0);
                    const totalSalesAmount = userSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                    const totalCommission = userSales.reduce((sum, s) => sum + (parseFloat(s.commissionEarned) || 0), 0);
                    const integration = integrationsData[user.id];

                    return {
                        ...user,
                        totalHours,
                        totalSalesAmount,
                        totalCommission,
                        saleCount: userSales.length,
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
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-brand-600" />
                    Team & Partners
                </h1>
                <p className="text-slate-500">Manage ambassadors, brand partners, and dispensary clients.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <>
                    {/* --- SECTION 1: SALES AMBASSADORS --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
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

                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Ambassador Roster</h3>
                                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{salesAmbassadors.length} Active</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Ambassador</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Sales</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hours</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Commission</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {salesAmbassadors.map((member, idx) => (
                                            <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                            {(member.email?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{member.profileInfo ? `${member.profileInfo.firstName} ${member.profileInfo.lastName || ''}` : (member.name || member.email?.split('@')[0] || 'Unknown User')}</p>
                                                            <p className="text-xs text-slate-400">{member.email || 'No Email'}</p>
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
                                                <td className="py-4 px-6 text-right font-medium text-slate-700">
                                                    ${member.totalSalesAmount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right text-slate-500">
                                                    {member.totalHours.toFixed(1)}
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-emerald-600">
                                                    ${member.totalCommission.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link to={`/admin/team/${member.id}`} className="text-xs text-brand-600 hover:text-brand-800 font-bold hover:underline">View</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {salesAmbassadors.length === 0 && <p className="text-center text-slate-500 py-8">No ambassadors yet.</p>}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 2: BRAND PARTNERS --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                            <Briefcase className="text-indigo-500" />
                            Brand Partners
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Partner Brands</h3>
                                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{brandPartners.length} Partners</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Partner Entity</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Setup</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {brandPartners.map(partner => (
                                            <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                            {(partner.name?.[0] || partner.email?.[0] || 'B').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{partner.name || 'Brand Partner'}</p>
                                                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">Owner</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-500">
                                                    {partner.email}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link to={`/admin/team/${partner.id}`} className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors">Manage</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {brandPartners.length === 0 && <p className="text-center text-slate-500 py-8">No brand partners found.</p>}
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION 3: DISPENSARY PARTNERS (NEW) --- */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                            <Store className="text-purple-500" />
                            Dispensary Clients
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Registered Dispensaries</h3>
                                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{dispensaryPartners.length} Clients</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Dispensary</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {dispensaryPartners.map(partner => (
                                            <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
                                                            {(partner.name?.[0] || 'D').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{partner.dispensaryName || partner.name || 'Unnamed Dispensary'}</p>
                                                            <span className="text-[10px] text-slate-400">{partner.licenseNumber || 'No License'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-500">
                                                    {partner.address || 'Unknown Location'}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link to={`/admin/team/${partner.id}`} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-bold transition-colors">View Profile</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {dispensaryPartners.length === 0 && <p className="text-center text-slate-500 py-8">No dispensary clients registered yet.</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
