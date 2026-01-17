import React, { useEffect, useState } from 'react';
import { getUserShifts, getSales, deleteActivation, deleteSale } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, DollarSign, CheckCircle, Trash2, ShoppingBag } from 'lucide-react';

export default function History() {
    const { currentUser } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('shifts'); // 'shifts' or 'sales'

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [shiftsData, salesData] = await Promise.all([
                getUserShifts(currentUser.uid), // Actually calls getUserActivations
                getSales() // Need to filter by user on client side or update logic
            ]);
            setShifts(shiftsData.sort((a, b) => new Date(b.date) - new Date(a.date)));

            // Filter sales for current user
            const mySales = salesData.filter(s => s.userId === currentUser.uid).sort((a, b) => new Date(b.date) - new Date(a.date));
            setSales(mySales);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteActivation = async (id) => {
        if (!confirm("Are you sure you want to delete this activation? This cannot be undone.")) return;
        const success = await deleteActivation(id);
        if (success) {
            setShifts(prev => prev.filter(s => s.id !== id));
            alert("Activation deleted.");
        } else {
            alert("Failed to delete activation.");
        }
    };

    const handleDeleteSale = async (id) => {
        if (!confirm("Are you sure you want to delete this sale log? This cannot be undone.")) return;
        const success = await deleteSale(id);
        if (success) {
            setSales(prev => prev.filter(s => s.id !== id));
            alert("Sale log deleted.");
        } else {
            alert("Failed to delete sale.");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading history...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">History</h1>
                    <p className="text-slate-500">Track your past work and sales.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setView('shifts')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'shifts' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Activations
                    </button>
                    <button
                        onClick={() => setView('sales')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'sales' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Sales Log
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {view === 'shifts' ? (
                    shifts.length > 0 ? shifts.map((shift) => {
                        // Safe date formatting
                        let displayDate = 'Date not recorded';
                        try {
                            const dateObj = shift.date instanceof Date ? shift.date : new Date(shift.date);
                            if (!isNaN(dateObj.getTime())) {
                                displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                            }
                        } catch (e) {
                            console.warn('Invalid date:', shift.date);
                        }

                        return (
                            <div key={shift.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative group">

                                {/* Delete Button (Top Right) */}
                                <button
                                    onClick={() => handleDeleteActivation(shift.id)}
                                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Activation"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${shift.status === 'paid' ? 'bg-brand-100 text-brand-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {shift.status === 'paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-slate-800">
                                                {shift.brandName || shift.brand || 'Unknown Brand'}
                                            </h3>
                                            <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${shift.status === 'paid' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {shift.status || 'pending'}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-600 mb-1">
                                            📍 {shift.dispensaryName || 'Store Visit'}
                                        </div>
                                        <div className="text-sm text-slate-500 mb-2">
                                            📅 {displayDate}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {shift.hoursWorked || '—'} hrs</span>
                                            <span className="flex items-center gap-1"><MapPin size={14} /> {shift.milesTraveled || 0} mi</span>
                                            {parseFloat(shift.tollAmount) > 0 && <span className="flex items-center gap-1"><DollarSign size={14} /> ${shift.tollAmount} Tolls</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : <p className="text-slate-400 text-center py-8">No activation history found.</p>
                ) : (
                    sales.length > 0 ? sales.map((sale) => (
                        <div key={sale.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative group">

                            <button
                                onClick={() => handleDeleteSale(sale.id)}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Sale"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold shrink-0">
                                    <ShoppingBag size={24} />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-slate-800">
                                            {new Date(sale.date).toLocaleDateString()}
                                        </h3>
                                        <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                            Sold
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-700 mb-1">{sale.dispensaryName}</div>
                                    <div className="text-sm text-slate-500">
                                        Total: <span className="font-bold text-slate-900">${sale.totalAmount}</span>
                                        <span className="mx-2">•</span>
                                        Comm: <span className="font-bold text-emerald-600">${parseFloat(sale.commissionEarned || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : <p className="text-slate-400 text-center py-8">No sales history found.</p>
                )}
            </div>
        </div>
    );
}
