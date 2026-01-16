import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyDispensaries } from '../services/firestoreService';
import { isStoreActive } from '../services/compensationService';
import { Loader, ArrowLeft, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ActiveAccounts() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState([]);

    useEffect(() => {
        async function load() {
            if (!currentUser) return;
            try {
                const myStores = await getMyDispensaries(currentUser.uid);

                const processed = myStores
                    .filter(store => isStoreActive(store)) // Only show currently active using new rule
                    .map(store => {
                        const brands = store.activeBrands || [];
                        const hasSpacePoppers = brands.some(b => b.toLowerCase().includes('space'));
                        const hasOthers = brands.some(b => !b.toLowerCase().includes('space'));

                        let status = "Active (Standard)";

                        // Calculate logic for display
                        if (!hasOthers && hasSpacePoppers) {
                            // Space Poppers Only
                            const firstSale = store.firstSaleDate ? (store.firstSaleDate.toDate ? store.firstSaleDate.toDate() : new Date(store.firstSaleDate)) : new Date(store.createdAt?.toDate());
                            const expiryDate = new Date(firstSale);
                            expiryDate.setMonth(expiryDate.getMonth() + 9);

                            const now = new Date();
                            const diffTime = expiryDate - now;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays > 0) {
                                const months = Math.floor(diffDays / 30);
                                status = `Active (Expires in ${months} mo)`;
                            } else {
                                status = "In Grace Period"; // Should be filtered out by isStoreActive but safe to keep
                            }
                        }

                        return {
                            id: store.id,
                            name: store.name,
                            brands: brands.join(', ') || 'Unknown Brands',
                            status
                        };
                    });

                setAccounts(processed);
            } catch (e) {
                console.error("Failed to load active accounts", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentUser]);

    return (
        <div className="max-w-5xl mx-auto pb-12">
            <div className="mb-8">
                <Link to="/app" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                        <Award size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Active Commission Accounts</h1>
                        <p className="text-slate-500">Stores currently generating commission & hourly boosts.</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <Loader className="animate-spin mx-auto text-brand-500" />
                </div>
            ) : accounts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No active accounts found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Store Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Brands Carried</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Commission Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {accounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{acc.name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex flex-wrap gap-1">
                                            {acc.brands.split(', ').map(b => (
                                                <span key={b} className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                                                    {b}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit ${acc.status.includes('Expires') ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {acc.status.includes('Expires') ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                                            {acc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to="/app/history" className="text-brand-600 font-bold hover:underline">View History</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
