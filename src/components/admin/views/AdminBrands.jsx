import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, Filter, Edit2, Trash2, Eye, X, ChevronRight,
    DollarSign, Calendar, Users, Building2, Phone, Mail, FileText,
    TrendingUp, CheckCircle, AlertCircle, Key, Copy
} from 'lucide-react';
import { getAllActivations, getSales, getAllBrandProfiles } from '../../../services/firestoreService';
import { useNotification } from '../../../contexts/NotificationContext';
import { calculateAgencyShiftCost } from '../../../utils/pricing';

// Default brands for initial data
const DEFAULT_BRANDS = [
    { id: 'honey-king', name: '🍯 Honey King', status: 'active', contacts: [{ name: 'Brand Contact', email: 'contact@honeyking.com', phone: '555-0101', role: 'Primary' }], contractStart: '2024-01-01', commissionRate: 5 },
    { id: 'bud-cracker', name: 'Bud Cracker Boulevard', status: 'active', contacts: [], contractStart: '2024-02-15', commissionRate: 5 },
    { id: 'canna-dots', name: 'Canna Dots', status: 'active', contacts: [], contractStart: '2024-03-01', commissionRate: 5 },
    { id: 'space-poppers', name: 'Space Poppers', status: 'active', contacts: [], contractStart: '2024-01-20', commissionRate: 5 },
    { id: 'smoothie-bar', name: 'Smoothie Bar', status: 'active', contacts: [], contractStart: '2024-04-01', commissionRate: 5 },
    { id: 'waferz', name: 'Waferz NY', status: 'active', contacts: [], contractStart: '2024-05-01', commissionRate: 5 },
    { id: 'pines', name: 'Pines', status: 'active', contacts: [], contractStart: '2024-06-01', commissionRate: 5 },
    { id: 'flx-extracts', name: 'FLX Extracts', status: 'active', contacts: [], contractStart: '2024-01-01', commissionRate: 5 },
    { id: 'budcracker-nyc', name: 'Budcracker NYC', status: 'inactive', contacts: [], contractStart: '2023-06-01', commissionRate: 5 }
];

export default function AdminBrands() {
    const [brands, setBrands] = useState([]);
    const [brandStats, setBrandStats] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { showNotification } = useNotification();

    // New brand form state
    const [newBrand, setNewBrand] = useState({
        name: '',
        status: 'active',
        commissionRate: 5,
        contractStart: new Date().toISOString().split('T')[0],
        contacts: [],
        loginEmail: '',
        tempPassword: ''
    });

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        setLoading(true);
        try {
            // Load brands from localStorage or use defaults
            const savedBrands = localStorage.getItem('adminBrands');
            const brandList = savedBrands ? JSON.parse(savedBrands) : DEFAULT_BRANDS;
            setBrands(brandList);

            // Load stats for each brand
            const [allActivations, allSales] = await Promise.all([
                getAllActivations(),
                getSales()
            ]);

            const stats = {};
            brandList.forEach(brand => {
                const brandActivations = allActivations.filter(a =>
                    (a.brandName || a.brand_name || a.brand || '').toLowerCase().includes(brand.name.toLowerCase().replace(/[^a-z]/g, ''))
                );
                const brandSales = allSales.filter(s =>
                    (s.brandName || s.brand_name || '').toLowerCase().includes(brand.name.toLowerCase().replace(/[^a-z]/g, ''))
                );

                const activationRevenue = brandActivations.reduce((acc, a) => {
                    const fee = parseFloat(a.activationFee) || parseFloat(a.activation_fee) || calculateAgencyShiftCost({
                        hoursWorked: a.hoursWorked || a.total_hours || 0,
                        region: a.region || 'NYC',
                        milesTraveled: a.milesTraveled || a.miles_traveled || 0,
                        tollAmount: a.tollAmount || a.toll_amount || 0
                    });
                    return acc + fee;
                }, 0);

                const salesRevenue = brandSales.reduce((acc, s) => acc + (parseFloat(s.amount) || 0) * 0.05, 0);

                stats[brand.id] = {
                    activations: brandActivations.length,
                    activationRevenue,
                    salesRevenue,
                    totalRevenue: activationRevenue + salesRevenue
                };
            });
            setBrandStats(stats);
        } catch (error) {
            console.error('Error loading brands:', error);
            showNotification('Failed to load brand data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const saveBrands = (updatedBrands) => {
        localStorage.setItem('adminBrands', JSON.stringify(updatedBrands));
        setBrands(updatedBrands);
    };

    const handleAddBrand = () => {
        if (!newBrand.name.trim()) {
            showNotification('Brand name is required', 'error');
            return;
        }

        const brand = {
            ...newBrand,
            id: newBrand.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            contacts: newBrand.loginEmail ? [{ name: 'Primary Contact', email: newBrand.loginEmail, phone: '', role: 'Primary' }] : [],
            loginEmail: newBrand.loginEmail,
            tempPassword: newBrand.tempPassword || generateTempPassword(),
            inviteSent: false
        };

        const updated = [...brands, brand];
        saveBrands(updated);
        setIsAddModalOpen(false);
        setNewBrand({ name: '', status: 'active', commissionRate: 5, contractStart: new Date().toISOString().split('T')[0], contacts: [], loginEmail: '', tempPassword: '' });
        showNotification('Brand added successfully', 'success');
    };

    const generateTempPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleUpdateCommissionRate = (newRate) => {
        if (!selectedBrand) return;
        const updated = brands.map(b =>
            b.id === selectedBrand.id ? { ...b, commissionRate: newRate } : b
        );
        saveBrands(updated);
        setSelectedBrand({ ...selectedBrand, commissionRate: newRate });
    };

    const handleSendInvite = async (brand) => {
        // Copy credentials to clipboard and mark as sent
        const credentials = `Brand Portal Login\n\nURL: ${window.location.origin}/brand/login\nEmail: ${brand.loginEmail}\nTemporary Password: ${brand.tempPassword}\n\nPlease change your password after first login.`;

        try {
            await navigator.clipboard.writeText(credentials);
            const updated = brands.map(b =>
                b.id === brand.id ? { ...b, inviteSent: true } : b
            );
            saveBrands(updated);
            if (selectedBrand?.id === brand.id) {
                setSelectedBrand({ ...selectedBrand, inviteSent: true });
            }
            showNotification('Credentials copied to clipboard! Send to brand contact.', 'success');
        } catch (err) {
            showNotification('Failed to copy credentials', 'error');
        }
    };

    const handleRemoveBrand = (brandId) => {
        if (!confirm('Are you sure you want to remove this brand partnership?')) return;
        const updated = brands.filter(b => b.id !== brandId);
        saveBrands(updated);
        setSelectedBrand(null);
        setIsDetailOpen(false);
        showNotification('Brand removed', 'success');
    };

    const handleToggleStatus = (brandId) => {
        const updated = brands.map(b =>
            b.id === brandId ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b
        );
        saveBrands(updated);
        if (selectedBrand?.id === brandId) {
            setSelectedBrand({ ...selectedBrand, status: selectedBrand.status === 'active' ? 'inactive' : 'active' });
        }
    };

    const handleAddContact = () => {
        if (!selectedBrand) return;
        const newContact = { name: '', email: '', phone: '', role: 'Primary' };
        const updated = brands.map(b =>
            b.id === selectedBrand.id ? { ...b, contacts: [...(b.contacts || []), newContact] } : b
        );
        saveBrands(updated);
        setSelectedBrand({ ...selectedBrand, contacts: [...(selectedBrand.contacts || []), newContact] });
    };

    const handleUpdateContact = (index, field, value) => {
        if (!selectedBrand) return;
        const updatedContacts = [...(selectedBrand.contacts || [])];
        updatedContacts[index] = { ...updatedContacts[index], [field]: value };

        const updated = brands.map(b =>
            b.id === selectedBrand.id ? { ...b, contacts: updatedContacts } : b
        );
        saveBrands(updated);
        setSelectedBrand({ ...selectedBrand, contacts: updatedContacts });
    };

    const handleRemoveContact = (index) => {
        if (!selectedBrand) return;
        const updatedContacts = (selectedBrand.contacts || []).filter((_, i) => i !== index);

        const updated = brands.map(b =>
            b.id === selectedBrand.id ? { ...b, contacts: updatedContacts } : b
        );
        saveBrands(updated);
        setSelectedBrand({ ...selectedBrand, contacts: updatedContacts });
    };

    const filteredBrands = brands.filter(brand => {
        const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || brand.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Brand Management</h1>
                    <p className="text-slate-500 text-sm">Manage partner brands, contracts, and contacts</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors font-medium"
                >
                    <Plus size={20} />
                    Add Brand
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-slate-500 text-sm">Total Brands</p>
                    <p className="text-2xl font-bold text-slate-900">{brands.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-emerald-100">
                    <p className="text-emerald-600 text-sm">Active Partners</p>
                    <p className="text-2xl font-bold text-emerald-700">{brands.filter(b => b.status === 'active').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-purple-100">
                    <p className="text-purple-600 text-sm">Total Activation Revenue</p>
                    <p className="text-2xl font-bold text-purple-700">
                        ${Object.values(brandStats).reduce((acc, s) => acc + (s.activationRevenue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-100">
                    <p className="text-blue-600 text-sm">Total Sales Commission</p>
                    <p className="text-2xl font-bold text-blue-700">
                        ${Object.values(brandStats).reduce((acc, s) => acc + (s.salesRevenue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search brands..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'inactive'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filterStatus === status
                                ? 'bg-slate-800 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Brand Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBrands.map(brand => {
                    const stats = brandStats[brand.id] || { activations: 0, activationRevenue: 0, salesRevenue: 0, totalRevenue: 0 };
                    return (
                        <div
                            key={brand.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-brand-200 transition-all cursor-pointer"
                            onClick={() => { setSelectedBrand(brand); setIsDetailOpen(true); }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900">{brand.name}</h3>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase ${brand.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {brand.status}
                                    </span>
                                </div>
                                <ChevronRight className="text-slate-300" size={20} />
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-400">Activations</p>
                                    <p className="font-bold text-slate-700">{stats.activations}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Revenue</p>
                                    <p className="font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <Users size={14} />
                                    {(brand.contacts || []).length} contacts
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(brand.id); }}
                                        className={`p-1.5 rounded-lg transition-colors ${brand.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveBrand(brand.id); }}
                                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredBrands.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No brands found matching your criteria.</p>
                </div>
            )}

            {/* Add Brand Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Add New Brand</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name *</label>
                                <input
                                    type="text"
                                    value={newBrand.name}
                                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    placeholder="Enter brand name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contract Start Date</label>
                                <input
                                    type="date"
                                    value={newBrand.contractStart}
                                    onChange={(e) => setNewBrand({ ...newBrand, contractStart: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Commission Rate (%)</label>
                                <input
                                    type="number"
                                    value={newBrand.commissionRate}
                                    onChange={(e) => setNewBrand({ ...newBrand, commissionRate: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={newBrand.status}
                                    onChange={(e) => setNewBrand({ ...newBrand, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Brand Portal Access Section */}
                            <div className="border-t border-slate-200 pt-4 mt-4">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <Key size={16} /> Brand Portal Access
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Brand Login Email</label>
                                        <input
                                            type="email"
                                            value={newBrand.loginEmail}
                                            onChange={(e) => setNewBrand({ ...newBrand, loginEmail: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                                            placeholder="brand@company.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newBrand.tempPassword}
                                                onChange={(e) => setNewBrand({ ...newBrand, tempPassword: e.target.value })}
                                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                                                placeholder="Auto-generated if empty"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setNewBrand({ ...newBrand, tempPassword: generateTempPassword() })}
                                                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">Leave empty to auto-generate. Share with brand to create their account.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddBrand}
                                    className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
                                >
                                    Add Brand
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Brand Detail Drawer */}
            {isDetailOpen && selectedBrand && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
                    <div className="bg-white w-full max-w-lg h-full overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-bold text-slate-900">{selectedBrand.name}</h2>
                            <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status & Actions */}
                            <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${selectedBrand.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {selectedBrand.status === 'active' ? '✓ Active Partner' : 'Inactive'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(selectedBrand.id)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedBrand.status === 'active'
                                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                            }`}
                                    >
                                        {selectedBrand.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => handleRemoveBrand(selectedBrand.id)}
                                        className="px-3 py-1 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {/* Contract Details */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <FileText size={18} /> Contract Details
                                </h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-400">Contract Start</p>
                                        <p className="font-medium text-slate-700">{selectedBrand.contractStart || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 mb-1">Commission Rate</p>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={selectedBrand.commissionRate || 5}
                                                onChange={(e) => handleUpdateCommissionRate(parseFloat(e.target.value) || 0)}
                                                className="w-16 px-2 py-1 border border-slate-200 rounded text-center font-bold text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                            />
                                            <span className="text-slate-600 font-medium">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Brand Portal Access */}
                            {selectedBrand.loginEmail && (
                                <div className="bg-purple-50 rounded-xl p-4">
                                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <Key size={18} /> Brand Portal Access
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Email:</span>
                                            <span className="font-mono text-slate-700">{selectedBrand.loginEmail}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Temp Password:</span>
                                            <span className="font-mono text-slate-700">{selectedBrand.tempPassword || 'Not set'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Invite Status:</span>
                                            <span className={`font-medium ${selectedBrand.inviteSent ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                {selectedBrand.inviteSent ? '✓ Sent' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSendInvite(selectedBrand)}
                                        className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                    >
                                        <Copy size={16} />
                                        {selectedBrand.inviteSent ? 'Copy Credentials Again' : 'Copy & Send Invite'}
                                    </button>
                                </div>
                            )}

                            {/* Revenue Stats */}
                            <div className="bg-gradient-to-br from-brand-50 to-purple-50 rounded-xl p-4">
                                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                                    <TrendingUp size={18} /> Revenue & Activity
                                </h3>
                                {(() => {
                                    const stats = brandStats[selectedBrand.id] || { activations: 0, activationRevenue: 0, salesRevenue: 0, totalRevenue: 0 };
                                    return (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/80 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs">Activations</p>
                                                <p className="text-2xl font-bold text-slate-800">{stats.activations}</p>
                                            </div>
                                            <div className="bg-white/80 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs">Activation Revenue</p>
                                                <p className="text-2xl font-bold text-purple-600">${stats.activationRevenue.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white/80 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs">Sales Commission</p>
                                                <p className="text-2xl font-bold text-blue-600">${stats.salesRevenue.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white/80 rounded-lg p-3">
                                                <p className="text-slate-400 text-xs">Total Revenue</p>
                                                <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Contacts */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <Users size={18} /> Contacts
                                    </h3>
                                    <button
                                        onClick={handleAddContact}
                                        className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus size={16} /> Add Contact
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(selectedBrand.contacts || []).map((contact, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3">
                                            <div className="flex items-start justify-between mb-2">
                                                <input
                                                    type="text"
                                                    value={contact.name}
                                                    onChange={(e) => handleUpdateContact(idx, 'name', e.target.value)}
                                                    placeholder="Contact Name"
                                                    className="font-medium text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-brand-500 focus:outline-none"
                                                />
                                                <button
                                                    onClick={() => handleRemoveContact(idx)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-slate-400" />
                                                    <input
                                                        type="email"
                                                        value={contact.email}
                                                        onChange={(e) => handleUpdateContact(idx, 'email', e.target.value)}
                                                        placeholder="Email"
                                                        className="flex-1 text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-brand-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    <input
                                                        type="tel"
                                                        value={contact.phone}
                                                        onChange={(e) => handleUpdateContact(idx, 'phone', e.target.value)}
                                                        placeholder="Phone"
                                                        className="flex-1 text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-brand-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <select
                                                value={contact.role}
                                                onChange={(e) => handleUpdateContact(idx, 'role', e.target.value)}
                                                className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1"
                                            >
                                                <option value="Primary">Primary</option>
                                                <option value="Sales">Sales</option>
                                                <option value="Support">Support</option>
                                                <option value="Billing">Billing</option>
                                            </select>
                                        </div>
                                    ))}
                                    {(selectedBrand.contacts || []).length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-4">No contacts added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
