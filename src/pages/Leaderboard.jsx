import React, { useState, useEffect } from 'react';
import { Medal, Award, TrendingUp, DollarSign, Users, Crown } from 'lucide-react';

import { getLeads } from '../services/firestoreService';
import { calculateRepScore, getCurrentQuarterLabel } from '../services/compensationService';
import KingCropHeader from '../components/KingCropHeader';

// Fallback Mock Data for immediate testing/visualization
const MOCK_LEADS = [
    { id: 1, businessName: "Green Life", repAssigned: "Omar Elsayed", status: "Sale", potentialValue: 5000 },
    { id: 2, businessName: "Nature's Cure", repAssigned: "Omar Elsayed", status: "New", potentialValue: 1200 },
    { id: 3, businessName: "Urban Leaf", repAssigned: "Sarah Jenkins", status: "Sale", potentialValue: 8000 },
    { id: 4, businessName: "Wellness Center", repAssigned: "Sarah Jenkins", status: "Sale", potentialValue: 3500 },
    { id: 5, businessName: "The Apothecary", repAssigned: "Sarah Jenkins", status: "New", potentialValue: 2000 },
    { id: 6, businessName: "Healing Hands", repAssigned: "Mike Ross", status: "New", potentialValue: 1500 },
    { id: 7, businessName: "City Greens", repAssigned: "Mike Ross", status: "New", potentialValue: 1000 },
    { id: 8, businessName: "Pure Relief", repAssigned: "Jessica Pearson", status: "Sale", potentialValue: 12000 },
    { id: 9, businessName: "Herbal Haven", repAssigned: "Omar Elsayed", status: "Sale", potentialValue: 4500 },
    { id: 10, businessName: "Cloud 9", repAssigned: "Unknown", status: "New", potentialValue: 500 }
];

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadLeaderboard() {
            try {
                const allLeads = await getLeads();

                // Group by Rep
                const repGroups = {}; // { 'Rep Name': [lead1, lead2] }

                allLeads.forEach(lead => {
                    const rep = lead.repAssigned || "Unassigned";
                    if (!repGroups[rep]) repGroups[rep] = [];
                    repGroups[rep].push(lead);
                });

                // Calculate Stats
                const stats = Object.keys(repGroups).map(repName => {
                    const leads = repGroups[repName];
                    const score = calculateRepScore(leads);

                    // Auxiliary stats for UI
                    const salesCount = leads.filter(l => l.status === 'Sold' || l.status === 'Sale').length;
                    const leadsCount = leads.filter(l => l.status !== 'Sold' && l.status !== 'Sale').length;
                    const totalRevenue = leads.reduce((sum, l) => {
                        return sum + (parseFloat(l.amount || l.potentialValue || 0));
                    }, 0);

                    return {
                        name: repName,
                        score,
                        salesCount,
                        leadsCount,
                        revenue: totalRevenue // Total Lifetime Revenue for sorting/display if needed
                    };
                });

                // Sort by Score (High to Low)
                stats.sort((a, b) => b.score - a.score);

                setLeaderboard(stats);
            } catch (error) {
                console.error("Error loading leaderboard:", error);
                // Fallback to mock if db fails entirely
                // setLeaderboard(processMockData(MOCK_LEADS)); 
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
            ) : (
                <div className="grid gap-4">
                    {leaderboard.map((rep, index) => (
                        <div
                            key={index}
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
