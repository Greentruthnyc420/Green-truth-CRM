import React, { useState, useEffect } from 'react';
import { ShoppingBag, Package, Clock, CheckCircle2, ArrowRight, Star, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getLeads, getUserProfile, getSales } from '../../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../services/supabaseClient';

import { exportToDutchie, exportToBlaze, exportToCova, exportToBioTrack, exportToLeafLogix, exportMetrcReady, exportGeneric } from '../../utils/csvExporters';

export default function DispensaryDashboard() {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSampleRequest, setShowSampleRequest] = useState(false);
    const navigate = useNavigate();

    // Export Handlers
    const handleExport = (order, format) => {
        // Prepare items with correct data structure expected by exporters
        const products = (order.items || []).map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            brandName: item.brandName || 'Unknown',
            category: item.category || 'Flower', // Fallback
            metrcTag: item.metrcTag || '',
            riid: item.riid || item.id,
            description: item.description || ''
        }));

        const brandName = order.brands ? Object.keys(order.brands).join(', ') : 'Mixed';

        switch (format) {
            case 'dutchie': exportToDutchie(products, brandName); break;
            case 'blaze': exportToBlaze(products, brandName); break;
            case 'cova': exportToCova(products, brandName); break;
            case 'biotrack': exportToBioTrack(products); break;
            case 'leaflogix': exportToLeafLogix(products); break;
            case 'metrc': exportMetrcReady(products); break;
            case 'generic': exportGeneric(products, order.id); break;
            default: exportGeneric(products, order.id);
        }
    };

    useEffect(() => {
        async function load() {
            if (currentUser) {
                const p = await getUserProfile(currentUser.uid);
                setProfile(p);
                // Fetch orders for this dispensary
                try {
                    const allSales = await getSales();
                    // Filter by dispensary name or ID (robust check)
                    // In a real app with Firestore index, we would use a query.
                    // Here we filter client-side for prototype speed.
                    const myOrders = allSales.filter(sale => {
                        const nameMatches = sale.dispensaryName === p.dispensaryName || sale.dispensaryName === currentUser.displayName;
                        const idMatches = sale.dispensaryId === currentUser.uid;
                        return nameMatches || idMatches;
                    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

                    setActiveOrders(myOrders);
                } catch (err) {
                    console.error("Failed to load orders", err);
                }
            }
            setLoading(false);
        }
        load();
    }, [currentUser]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Hello, {profile?.dispensaryName || 'Dispensary'}!
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Welcome to your ordering portal.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowSampleRequest(true)}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95"
                    >
                        <Gift size={20} /> Request Samples
                    </button>
                    <button
                        onClick={() => navigate('/dispensary/marketplace')}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    >
                        <ShoppingBag size={20} /> Browse Products
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<Package className="text-blue-600" />} label="Recent Orders" value="0" color="blue" />
                <StatCard icon={<Star className="text-amber-500" />} label="Favorite Brands" value="--" color="amber" />
                <StatCard icon={<Clock className="text-indigo-600" />} label="Avg Delivery" color="indigo" value="48h" />
            </div>

            {/* Recent Activity / Order List */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-lg">Active Orders</h3>
                    <button
                        onClick={() => navigate('/dispensary/marketplace')}
                        className="text-sm font-bold text-emerald-600 hover:underline"
                    >
                        View History
                    </button>
                </div>

                {activeOrders.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Clock size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No active orders yet.</p>
                        <button
                            onClick={() => navigate('/dispensary/marketplace')}
                            className="mt-4 px-6 py-2 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {activeOrders.map(order => (
                            <div key={order.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${order.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                                            order.status === 'Completed' || order.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                            {order.status || 'Processing'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {new Date(order.createdAt || order.date).toLocaleDateString()} • {Object.keys(order.brands || {}).join(', ') || 'Various Brands'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">${(parseFloat(order.totalAmount || order.amount) || 0).toFixed(2)}</p>
                                    <p className="text-xs text-slate-400 mb-2">{order.items?.length || Object.values(order.brands || {}).reduce((sum, b) => sum + Object.keys(b).length, 0)} Items</p>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <select
                                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold outline-none border-none cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleExport(order, e.target.value);
                                                    e.target.value = ''; // Reset
                                                }
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Export CSV...</option>
                                            <option value="generic">Download CSV (Generic)</option>
                                            <option value="dutchie">For Dutchie</option>
                                            <option value="blaze">For Blaze</option>
                                            <option value="cova">For Cova</option>
                                            <option value="biotrack">For BioTrack</option>
                                            <option value="leaflogix">For LeafLogix</option>
                                            <option value="metrc">Metrc Format</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sample Request Modal */}
            {showSampleRequest && (
                <SampleRequestModal
                    onClose={() => setShowSampleRequest(false)}
                    profile={profile}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg shadow-slate-200/40 flex items-center gap-4 transition-transform hover:scale-[1.02]">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-50 flex items-center justify-center shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        </div>
    </div>
);

// Sample Request Modal Component
const SampleRequestModal = ({ onClose, profile, currentUser }) => {
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { showNotification } = useNotification();

    const availableBrands = [
        '🍯 Honey King',
        'Bud Cracker Boulevard',
        'Canna Dots',
        'Space Poppers!',
        'Smoothie Bar',
        'Waferz NY',
        'Pines'
    ];

    const handleBrandToggle = (brand) => {
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedBrands.length === 0) {
            showNotification('Please select at least one brand', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('sample_requests').insert([{
                dispensary_id: profile?.dispensaryId || currentUser.uid,
                dispensary_name: profile?.dispensaryName || 'Unknown Dispensary',
                requested_brands: selectedBrands,
                notes: notes || null,
                status: 'Pending',
                created_at: new Date().toISOString(),
                license_number: profile?.licenseNumber || '',
                address: profile?.address || ''
            }]);

            if (error) throw error;

            showNotification('Sample request submitted successfully!', 'success');
            onClose();
        } catch (error) {
            console.error('Error submitting sample request:', error);
            showNotification('Failed to submit request', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Request Product Samples</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">Select Brands</label>
                        <div className="grid grid-cols-2 gap-3">
                            {availableBrands.map(brand => (
                                <label
                                    key={brand}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedBrands.includes(brand)
                                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                                        : 'border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => handleBrandToggle(brand)}
                                    />
                                    <span className="font-medium text-sm">{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Additional Notes (Optional)</label>
                        <textarea
                            className="w-full p-4 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none"
                            rows="4"
                            placeholder="Any specific products or notes for the brands..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || selectedBrands.length === 0}
                            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
