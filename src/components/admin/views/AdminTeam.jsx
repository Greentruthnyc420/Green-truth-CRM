import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllUsers, getAllShifts, getSales } from '../../../services/firestoreService';
<<<<<<< HEAD
import { Users, Trophy, TrendingUp, Clock, Award, CheckCircle, AlertTriangle, PowerOff } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
=======
import { Users, Trophy, TrendingUp, Award, Briefcase } from 'lucide-react';
>>>>>>> origin/refactor-admin-team-page-12879250814436465303

export default function AdminTeam() {
    const [salesAmbassadors, setSalesAmbassadors] = useState([]);
    const [brandPartners, setBrandPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadTeamData() {
            setLoading(true);
            try {
<<<<<<< HEAD
                // Fetch all data for computation
                const [users, shifts, sales, integrationsSnapshot] = await Promise.all([
=======
                const [users, shifts, sales] = await Promise.all([
>>>>>>> origin/refactor-admin-team-page-12879250814436465303
                    getAllUsers(),
                    getAllShifts(),
                    getSales(),
                    getDocs(collection(db, 'brand_integrations'))
                ]);

<<<<<<< HEAD
                const integrationsData = {};
                integrationsSnapshot.forEach(doc => {
                    integrationsData[doc.id] = doc.data();
                });
=======
                const ambassadors = users.filter(u => u.role === 'rep');
                const partners = users.filter(u => u.role !== 'rep');
>>>>>>> origin/refactor-admin-team-page-12879250814436465303

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
                setBrandPartners(partners);

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
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-brand-600" />
                    Team Management
                </h1>
                <p className="text-slate-500">Manage ambassadors, brand partners, and view performance.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                </div>
            ) : (
                <>
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
                                <h3 className="font-bold text-slate-700">All Ambassadors</h3>
                                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{salesAmbassadors.length} Members</span>
                            </div>

<<<<<<< HEAD
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Ambassador</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Monday.com Status</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Sales</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hours Worked</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Commission</th>
                                        <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {teamMembers.map((member, idx) => (
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
                                            <td className="py-4 px-6">
                                                {member.integration.connected ? (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle size={16} className="text-emerald-500" />
                                                        <div>
                                                            <span className="font-bold text-sm text-emerald-600">Connected</span>
                                                            <p className="text-xs text-slate-400">
                                                                Last sync: {member.integration.lastSyncTimestamp ? member.integration.lastSyncTimestamp.toLocaleDateString() : 'N/A'}
                                                                {member.integration.hasErrors && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <PowerOff size={16} />
                                                        <span className="text-sm font-medium">Not Connected</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right font-medium text-slate-700">
                                                ${member.totalSalesAmount.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-right text-slate-500">
                                                {member.totalHours.toFixed(1)} hrs
                                            </td>
                                            <td className="py-4 px-6 text-right font-medium text-emerald-600">
                                                ${member.totalCommission.toFixed(2)}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <Link
                                                    to={`/admin/team/${member.id}`}
                                                    className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                                                >
                                                    View Profile
                                                </Link>
                                            </td>
=======
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Ambassador</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Sales</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hours Worked</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Commission</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
>>>>>>> origin/refactor-admin-team-page-12879250814436465303
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
                                                <td className="py-4 px-6 text-right font-medium text-slate-700">
                                                    ${member.totalSalesAmount.toLocaleString()}
                                                </td>
                                                <td className="py-4 px-6 text-right text-slate-500">
                                                    {member.totalHours.toFixed(1)} hrs
                                                </td>
                                                <td className="py-4 px-6 text-right font-medium text-emerald-600">
                                                    ${member.totalCommission.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link
                                                        to={`/admin/team/${member.id}`}
                                                        className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                                                    >
                                                        View Profile
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {salesAmbassadors.length === 0 && (
                                    <p className="text-center text-slate-500 py-8">No sales ambassadors found.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                           <Briefcase className="text-indigo-500" />
                           Brand Partners
                        </h2>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">All Brand Partners</h3>
                                <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{brandPartners.length} Members</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Partner</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                            <th className="py-3 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Actions</th>
                                        </tr>
                                    </thead>
                                     <tbody className="divide-y divide-slate-50">
                                        {brandPartners.map(partner => (
                                            <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-4 px-6">
                                                     <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                            {(partner.email?.[0] || 'U').toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{partner.profileInfo ? `${partner.profileInfo.firstName} ${partner.profileInfo.lastName || ''}` : (partner.name || partner.email?.split('@')[0] || 'Unknown User')}</p>
                                                            <p className="text-xs text-slate-400">{partner.email || 'No Email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                                        {partner.role || 'Partner'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <Link
                                                        to={`/admin/team/${partner.id}`}
                                                        className="text-xs text-brand-600 hover:text-brand-800 font-medium hover:underline"
                                                    >
                                                        View Profile
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {brandPartners.length === 0 && (
                                     <p className="text-center text-slate-500 py-8">No brand partners found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
