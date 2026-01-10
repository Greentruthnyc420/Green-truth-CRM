import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getAllShifts, getSales } from '../../../services/firestoreService';
import { Users, Trophy, TrendingUp, Clock, Award } from 'lucide-react';

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
                const [users, shifts, sales] = await Promise.all([
                    getAllUsers(),
                    getAllShifts(),
                    getSales()
                ]);

                const memberStats = users.map(user => {
                    const userShifts = shifts.filter(s => s.userId === user.id);
                    const userSales = sales.filter(s => s.userId === user.id);

                    const totalHours = userShifts.reduce((sum, s) => sum + (parseFloat(s.hoursWorked) || 0), 0);
                    const totalSalesAmount = userSales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
                    const totalCommission = userSales.reduce((sum, s) => sum + (parseFloat(s.commissionEarned) || 0), 0);

                    return {
                        ...user,
                        totalHours,
                        totalSalesAmount,
                        totalCommission,
                        saleCount: userSales.length
                    };
                });

                // Categorize users by role
                const reps = memberStats.filter(user => user.role === 'rep');
                const brands = memberStats.filter(user => user.role === 'brand');
                const dispensaries = memberStats.filter(user => user.role === 'dispensary');

                // Sort Sales Ambassadors by sales
                const sortedReps = reps.sort((a, b) => b.totalSalesAmount - a.totalSalesAmount);

                setSalesAmbassadors(sortedReps);
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

    // Top Performer Logic (from Sales Ambassadors)
    const topPerformer = salesAmbassadors[0];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-brand-600" />
                    Team Management
                </h1>
                <p className="text-slate-500">Manage ambassadors and view performance leaderboards.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <>
                    {/* Leaderboard Highlight */}
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
                            {/* Decorative background circle */}
                            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        </div>
                    )}

                    {/* Sales Ambassadors Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700">Sales Ambassadors</h2>
                            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{salesAmbassadors.length} Members</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Ambassador</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Sales</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hours Worked</th>
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
                                                    {idx < 3 && member.totalSalesAmount > 0 && (
                                                        <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">
                                                            #{idx + 1}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right font-medium text-slate-700">${member.totalSalesAmount.toLocaleString()}</td>
                                            <td className="py-4 px-6 text-right text-slate-500">{member.totalHours.toFixed(1)} hrs</td>
                                            <td className="py-4 px-6 text-right font-medium text-emerald-600">${member.totalCommission.toFixed(2)}</td>
                                            <td className="py-4 px-6 text-center">
                                                <Link to={`/admin/team/${member.id}`} className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline">View Profile</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Brand Partners Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700">Brand Partners</h2>
                            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{brandPartners.length} Members</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand Name</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Email</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {brandPartners.map(partner => (
                                        <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-800">{partner.profileInfo?.brandName || partner.name || 'N/A'}</td>
                                            <td className="py-4 px-6 text-slate-500">{partner.email}</td>
                                            <td className="py-4 px-6 text-center">
                                                <Link to={`/admin/team/${partner.id}`} className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline">View Profile</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Dispensary Partners Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-700">Dispensary Partners</h2>
                            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{dispensaryPartners.length} Members</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Dispensary Name</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Email</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dispensaryPartners.map(partner => (
                                        <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6 font-medium text-slate-800">{partner.profileInfo?.dispensaryName || partner.name || 'N/A'}</td>
                                            <td className="py-4 px-6 text-slate-500">{partner.email}</td>
                                            <td className="py-4 px-6 text-center">
                                                <Link to={`/admin/team/${partner.id}`} className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline">View Profile</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
