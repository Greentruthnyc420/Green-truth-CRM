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

                    // Calculate new sales vs reorders
                    // Group sales by dispensary to determine first-time vs repeat
                    const salesByDispensary = {};
                    repSales.forEach(sale => {
                        const dispensaryKey = (sale.dispensaryName || sale.dispensaryId || '').toLowerCase();
                        if (!salesByDispensary[dispensaryKey]) {
                            salesByDispensary[dispensaryKey] = [];
                        }
                        salesByDispensary[dispensaryKey].push(sale);
                    });

                    // Count new sales (first sale per dispensary) and reorders (subsequent sales)
                    let newSalesCount = 0;
                    let reordersCount = 0;
                    Object.values(salesByDispensary).forEach(dispensarySales => {
                        // Sort by date to determine which is first
                        dispensarySales.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
                        dispensarySales.forEach((sale, index) => {
                            if (index === 0) {
                                newSalesCount++;
                            } else {
                                reordersCount++;
                            }
                        });
                    });

                    // Calculate points: Lead=1pt + New Sale=5pt + Reorder=3pt + Revenue=1pt/$100
                    const leadPoints = leadsCount * 1;        // 1 point per lead
                    const newSalePoints = newSalesCount * 5;  // 5 points per new sale
                    const reorderPoints = reordersCount * 3;  // 3 points per reorder
                    const revenuePoints = revenue / 100;      // 1 point per $100 sold
                    const calculatedPoints = leadPoints + newSalePoints + reorderPoints + revenuePoints;

                    return {
                        id: rep.id,
                        name: rep.name,
                        email: rep.email,
                        // Use calculated points from all sources
                        score: calculatedPoints,
                        lifetimeScore: rep.lifetimePoints || calculatedPoints,
                        salesCount,
                        leadsCount,
                        newSalesCount,
                        reordersCount,
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
        if (index === 0) return <Crown className="text-yellow-500 fill-yellow-500/20" size={32} />;
        if (index === 1) return <Medal className="text-slate-400 fill-slate-400/20" size={28} />;
        if (index === 2) return <Medal className="text-amber-600 fill-amber-600/20" size={28} />;
        return <span style={{ color: 'var(--text-tertiary)' }} className="font-bold text-lg">#{index + 1}</span>;
    };

    // Use inline styles with CSS variables for theme compatibility
    const getRowStyle = (index) => {
        if (index === 0) return {
            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))',
            borderColor: 'rgba(234, 179, 8, 0.3)'
        };
        if (index === 1) return {
            background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.05))',
            borderColor: 'rgba(148, 163, 184, 0.3)'
        };
        if (index === 2) return {
            background: 'linear-gradient(135deg, rgba(194, 65, 12, 0.15), rgba(194, 65, 12, 0.05))',
            borderColor: 'rgba(194, 65, 12, 0.3)'
        };
        return {
            background: 'var(--bg-card)',
            borderColor: 'var(--border-primary)'
        };
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <KingCropHeader />
                <p style={{ color: 'var(--text-tertiary)' }} className="font-bold tracking-widest text-sm uppercase mt-2">
                    Season: {getCurrentQuarterLabel()}
                </p>
            </div>

            {loading ? (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>Loading the tank...</div>
            ) : leaderboard.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>No sales reps found. Add some leads to start earning points!</div>
            ) : (
                <div className="grid gap-4">
                    {leaderboard.map((rep, index) => (
                        <div
                            key={rep.id || index}
                            className="relative p-6 rounded-2xl border-2 transition-transform hover:scale-[1.01] shadow-sm"
                            style={getRowStyle(index)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                            {rep.name}
                                            {index === 0 && (
                                                <span className="px-2 py-0.5 text-xs rounded-full border"
                                                    style={{
                                                        background: 'rgba(234, 179, 8, 0.2)',
                                                        color: 'rgb(202, 138, 4)',
                                                        borderColor: 'rgba(234, 179, 8, 0.3)'
                                                    }}>
                                                    Current Leader
                                                </span>
                                            )}
                                        </h3>
                                        <div className="flex gap-4 mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            <span className="flex items-center gap-1">
                                                <Award size={14} />
                                                {rep.newSalesCount || 0} New (5pts)
                                            </span>
                                            <span className="flex items-center gap-1">
                                                🔄 {rep.reordersCount || 0} Reorders (3pts)
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={14} />
                                                {rep.leadsCount} Leads (1pt)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-3xl font-black" style={{ color: 'var(--accent-primary)' }}>
                                        {rep.score.toFixed(2)} <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>pts</span>
                                    </div>
                                    <div className="text-sm font-semibold flex items-center justify-end gap-1 mt-1" style={{ color: 'rgb(16, 185, 129)' }}>
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

