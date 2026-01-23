import React, { useState, useEffect } from 'react';
import { Medal, Award, TrendingUp, DollarSign, Users, Crown } from 'lucide-react';

import { getSalesRepsWithPoints, getLeads, getSales } from '../services/firestoreService';
import { getCurrentQuarterLabel } from '../services/compensationService';
import KingCropHeader from '../components/KingCropHeader';

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLeaderboard() {
            try {
                // Fetch real points from users table
                const [repsWithPoints, leads, sales] = await Promise.all([
                    getSalesRepsWithPoints(),
                    getLeads(),
                    getSales()
                ]);

                // Build stats for each rep
                const stats = repsWithPoints.map(rep => {
                    // Count leads assigned to this rep
                    const repLeads = leads.filter(l =>
                        l.repAssigned?.toLowerCase().includes(rep.name.toLowerCase()) ||
                        l.assignedAmbassadorId === rep.id
                    );

                    // Count sales by this rep
                    const repSales = sales.filter(s =>
                        s.repId === rep.id ||
                        s.userId === rep.id ||
                        s.repName?.toLowerCase().includes(rep.name.toLowerCase())
                    );

                    const leadsCount = repLeads.length;
                    const salesCount = repSales.length;
                    const revenue = repSales.reduce((sum, s) => sum + parseFloat(s.totalAmount || s.amount || 0), 0);

                    return {
                        id: rep.id,
                        name: rep.name,
                        email: rep.email,
                        score: rep.currentMonthPoints, // Use REAL points from database
                        lifetimeScore: rep.lifetimePoints,
                        salesCount,
                        leadsCount,
                        revenue
                    };
                });

                // Sort by current month points (high to low)
                stats.sort((a, b) => b.score - a.score);

                setLeaderboard(stats);
            } catch (error) {
                console.error("Error loading leaderboard:", error);
            } finally {
                setLoading(false);
            }
        }

        loadLeaderboard();
    }, []);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown className="text-yellow-500 fill-yellow-100" size={32} />;
        if (index === 1) return <Medal className="text-slate-400 fill-slate-100" size={28} />;
        if (index === 2) return <Medal className="text-amber-600 fill-amber-100" size={28} />;
        return <span className="text-slate-400 font-bold text-lg">#{index + 1}</span>;
    };

    const getRowStyle = (index) => {
        if (index === 0) return "bg-yellow-50/50 border-yellow-100";
        if (index === 1) return "bg-slate-50/50 border-slate-100";
        if (index === 2) return "bg-orange-50/30 border-orange-100";
        return "bg-white border-slate-50";
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <KingCropHeader />
                <p className="text-slate-400 font-bold tracking-widest text-sm uppercase mt-2">
                    Season: {getCurrentQuarterLabel()}
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading the tank...</div>
            ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No sales reps found. Add some leads to start earning points!</div>
            ) : (
                <div className="grid gap-4">
                    {leaderboard.map((rep, index) => (
                        <div
                            key={rep.id || index}
                            className={`relative p-6 rounded-2xl border-2 transition-transform hover:scale-[1.01] ${getRowStyle(index)} shadow-sm`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                            {rep.name}
                                            {index === 0 && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full border border-yellow-200">Current Leader</span>}
                                        </h3>
                                        <div className="flex gap-4 mt-1 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Award size={14} />
                                                {rep.salesCount} Sales (5pts)
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {rep.leadsCount} Leads (1pt)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-3xl font-black text-brand-600">
                                        {rep.score.toFixed(2)} <span className="text-sm font-medium text-slate-400">pts</span>
                                    </div>
                                    <div className="text-sm font-semibold text-emerald-600 flex items-center justify-end gap-1 mt-1">
                                        <TrendingUp size={14} />
                                        ${rep.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
