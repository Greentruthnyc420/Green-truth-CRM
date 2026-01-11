import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MapPin, CheckCircle, Package, Phone, Navigation } from 'lucide-react';
import { getSales, updateSale } from '../../services/firestoreService';

export default function DriverDashboard() {
    const navigate = useNavigate();
    const [driver, setDriver] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = localStorage.getItem('driver_session');
        if (!session) {
            navigate('/driver/login');
            return;
        }
        setDriver(JSON.parse(session));
    }, [navigate]);

    useEffect(() => {
        if (!driver) return;
        fetchDeliveries();
    }, [driver]);

    const fetchDeliveries = async () => {
        setLoading(true);
        try {
            const allSales = await getSales();
            // Filter: Status is 'fulfilled' (Active) or 'delivered' (Completed Today?)
            // And matches driver ID
            // Using loose comparison for IDs just in case (string vs int)
            const myDeliveries = allSales.filter(sale =>
                (sale.status === 'fulfilled' || sale.status === 'delivered') &&
                sale.shipmentDetails?.driver?.id == driver.id
            );

            // Sort: Fulfilled first, then Delivered
            myDeliveries.sort((a, b) => {
                if (a.status === b.status) return 0;
                return a.status === 'fulfilled' ? -1 : 1;
            });

            setDeliveries(myDeliveries);
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkDelivered = async (orderId) => {
        if (!window.confirm("Confirm delivery completion?")) return;

        try {
            // Update to delivered
            await updateSale(orderId, {
                status: 'delivered',
                deliveredAt: new Date().toISOString() // We could add GPS coords here later
            });

            // Optimistic update
            setDeliveries(prev => prev.map(d =>
                d.id === orderId
                    ? { ...d, status: 'delivered', deliveredAt: new Date().toISOString() }
                    : d
            ));
        } catch (error) {
            alert("Failed to update status. Check connection.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('driver_session');
        navigate('/driver/login');
    };

    const openMap = (address) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    };

    if (!driver) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <div className="bg-brand-600 text-white p-6 rounded-b-3xl shadow-lg sticky top-0 z-10">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">My Route</h1>
                    <button onClick={handleLogout} className="p-2 bg-brand-500 rounded-full hover:bg-brand-400"><LogOut size={18} /></button>
                </div>
                <div className="flex items-center gap-3 opacity-90">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                        {driver.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-bold">{driver.name}</p>
                        <p className="text-xs opacity-75">{driver.license}</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-4 -mt-2">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">Loading Route...</div>
                ) : deliveries.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 shadow-sm mt-4">
                        <CheckCircle size={48} className="mx-auto text-slate-200 mb-2" />
                        <p>No active deliveries.</p>
                    </div>
                ) : (
                    deliveries.map(order => (
                        <div key={order.id} className={`bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden ${order.status === 'delivered' ? 'opacity-60' : ''}`}>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-slate-800 text-lg">{order.dispensaryName || order.dispensary}</h3>
                                    {order.status === 'fulfilled' ? (
                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Active</span>
                                    ) : (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Done</span>
                                    )}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <button
                                        onClick={() => openMap(order.shipmentDetails?.route || order.address || '')}
                                        className="text-slate-600 text-sm flex items-start gap-2 hover:text-brand-600 active:text-brand-700 text-left w-full"
                                    >
                                        <MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />
                                        <span>{order.shipmentDetails?.route || "View Address on Map"}</span> {/* Assuming route might contain address or we pull from lead/order */}
                                    </button>
                                    <div className="text-slate-500 text-sm flex items-center gap-2">
                                        <Package size={16} className="shrink-0 text-slate-400" />
                                        <span>{order.items.length} Items (Batch: {order.items[0]?.batchNumber || 'N/A'})</span>
                                    </div>
                                </div>

                                {order.status === 'fulfilled' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openMap(order.shipmentDetails?.route || order.address || '')}
                                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 active:bg-slate-300 flex items-center justify-center gap-2"
                                        >
                                            <Navigation size={18} /> Navigate
                                        </button>
                                        <button
                                            onClick={() => handleMarkDelivered(order.id)}
                                            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 active:bg-emerald-800 flex items-center justify-center gap-2 shadow-emerald-200 shadow-md"
                                        >
                                            <CheckCircle size={18} /> Delivered
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
