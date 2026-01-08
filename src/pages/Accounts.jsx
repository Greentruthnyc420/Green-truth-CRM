import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllAccounts, deleteLead, updateLead } from '../services/firestoreService';
import { Search, Loader, Building2, User, CheckCircle, Pencil, Trash2, X, Save, AlertTriangle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import DispensaryDetailsModal from '../components/DispensaryDetailsModal';

const ADMIN_EMAILS = ['omar@thegreentruthnyc.com', 'realtest@test.com', 'omar@gmail.com'];

export default function Accounts() {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');

    // Drawer State (For Editing)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null); // Used for editing
    const [saving, setSaving] = useState(false);

    // Details Modal State
    const [viewAccount, setViewAccount] = useState(null); // Used for viewing details

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '' });

    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

    useEffect(() => {
        async function load() {
            if (currentUser) {
                const data = await getAllAccounts(currentUser.uid, isAdmin);
                setAccounts(data);
            }
            setLoading(false);
        }
        load();
    }, [currentUser, isAdmin]);

    const handleRowClick = (acc) => {
        // Open details modal
        setViewAccount(acc);
    };

    const handleEditClick = (acc) => {
        // From table action or details modal
        setSelectedAccount({ ...acc });
        setIsDrawerOpen(true);
        // If coming from details view, we can keep it open or close it. 
        // Standard UX: Close details, open edit.
        setViewAccount(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateLead(selectedAccount.id, selectedAccount);
            setAccounts(prev => prev.map(a => a.id === selectedAccount.id ? selectedAccount : a));
            setIsDrawerOpen(false);
            // Could add toast here
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (acc, e) => {
        e.stopPropagation(); // Prevent opening details
        setDeleteModal({ open: true, id: acc.id, name: acc.dispensaryName });
    };

    const confirmDelete = async () => {
        const idToDelete = deleteModal.id;
        // Optimistic Update
        setDeleteModal({ open: false, id: null, name: '' });
        setAccounts(prev => prev.filter(a => a.id !== idToDelete));

        // Background Delete
        await deleteLead(idToDelete);
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesSearch = (acc.dispensaryName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (acc.repAssigned || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ||
            (filter === 'sold' && acc.status === 'Sold') ||
            (filter === 'new' && acc.status !== 'Sold');
        return matchesSearch && matchesFilter;
    });

    const getDaysSince = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = dateStr.toDate ? dateStr.toDate() : new Date(dateStr);
        const diff = new Date() - date;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="max-w-6xl mx-auto pb-12 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="text-brand-600" /> Master Account View
                    </h1>
                    <p className="text-slate-500">
                        {isAdmin ? 'System-wide account visibility' : 'Available accounts and territories'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search names or reps..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:border-brand-500 bg-white"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="sold">Sold Clients</option>
                        <option value="new">New Leads</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">
                    <Loader size={32} className="animate-spin mx-auto mb-2" />
                    Loading accounts...
                </div>
            ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500">No accounts found matching your criteria.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-visible">
                    <div className="overflow-x-visible">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Store Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner (Rep)</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Age</th>
                                    {isAdmin && <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                <AnimatePresence>
                                    {filteredAccounts.map((acc, i) => (
                                        <motion.tr
                                            key={acc.id || i}
                                            className="hover:bg-slate-50 transition-colors group relative cursor-pointer"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
                                            layout
                                            onClick={() => handleRowClick(acc)}
                                        >
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {acc.dispensaryName}
                                            </td>
                                            <td className="px-6 py-4">
                                                {acc.priority === 'High' ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-tighter">High</span>
                                                ) : acc.priority === 'Low' ? (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tighter">Low</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-500 border border-blue-100 uppercase tracking-tighter">Normal</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {acc.status === 'Sold' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs">
                                                        <CheckCircle size={12} /> Sold
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                                                        New Lead
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 flex items-center gap-2 text-slate-600">
                                                <User size={16} className="text-slate-400" />
                                                {acc.repAssigned || 'Unassigned'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500 font-mono">
                                                {getDaysSince(acc.createdAt || acc.meetingDate)}d
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => { e.stopPropagation(); handleEditClick(acc); }}
                                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-brand-600 hover:border-brand-200 shadow-sm"
                                                            title="Edit Account"
                                                        >
                                                            <Pencil size={16} />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => handleDeleteClick(acc, e)}
                                                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-red-600 hover:border-red-200 shadow-sm"
                                                            title="Delete Account"
                                                        >
                                                            <Trash2 size={16} />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            )}
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DETAILS MODAL */}
            <DispensaryDetailsModal
                isOpen={!!viewAccount}
                onClose={() => setViewAccount(null)}
                dispensary={viewAccount}
                isAdmin={isAdmin}
                onEdit={handleEditClick}
            />

            {/* EDIT DRAWER */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        />
                        {/* Drawer Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 p-6 overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">Edit Account</h2>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        value={selectedAccount?.dispensaryName || ''}
                                        onChange={e => setSelectedAccount({ ...selectedAccount, dispensaryName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                                        value={selectedAccount?.status || 'New'}
                                        onChange={e => setSelectedAccount({ ...selectedAccount, status: e.target.value })}
                                    >
                                        <option value="New">New Lead</option>
                                        <option value="Sold">Sold Client</option>
                                        <option value="Lost">Lost / Archive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                                        value={selectedAccount?.priority || 'Normal'}
                                        onChange={e => setSelectedAccount({ ...selectedAccount, priority: e.target.value })}
                                    >
                                        <option value="High">High</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Rep</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-brand-500 focus:border-brand-500 outline-none"
                                        value={selectedAccount?.repAssigned || ''}
                                        onChange={e => setSelectedAccount({ ...selectedAccount, repAssigned: e.target.value })}
                                        placeholder="Rep Name (e.g. Omar Elsayed)"
                                    />
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                                    >
                                        {saving ? <Loader className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {deleteModal.open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-slate-200"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Delete Account?</h3>
                                <p className="text-slate-500">
                                    Are you sure you want to permanently delete <b className="text-slate-800">{deleteModal.name}</b>? This action cannot be undone.
                                </p>

                                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                                    <button
                                        onClick={() => setDeleteModal({ open: false, id: null, name: '' })}
                                        className="py-3 px-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="py-3 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
