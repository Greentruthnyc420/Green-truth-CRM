import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, DollarSign, Percent, Package, CreditCard, Gift, Loader, Check, X, Layers, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useAuth, ADMIN_EMAILS } from '../../contexts/AuthContext';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { getDealRules, createDealRule, updateDealRule, deleteDealRule, DEAL_RULE_TYPES, DISCOUNT_TYPES } from '../../services/dealService';
import { useNotification } from '../../contexts/NotificationContext';

export default function BrandDeals() {
    const { currentUser } = useAuth();
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();
    const [searchParams] = useSearchParams();

    // Check if admin is accessing via query param
    const adminBrandId = searchParams.get('admin_brand');
    const isAdminAccess = adminBrandId && currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());

    // Get brandId from admin override, brandUser (for brand portal), or currentUser (for admin)
    const brandId = isAdminAccess ? adminBrandId : (brandUser?.brandId || currentUser?.brandId);
    const brandDisplayName = isAdminAccess ? adminBrandId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : (brandUser?.brandName || 'Your Brand');

    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        ruleType: 'bulk_discount',
        minQuantity: '',
        minOrderValue: '',
        discountType: 'percentage',
        discountValue: '',
        isActive: true,
        tiers: [] // For tiered COD discounts
    });

    // Default JUSBUD-style tiers
    const defaultTiers = [
        { minCases: 1, maxCases: 2, discountPercent: 10 },
        { minCases: 3, maxCases: 5, discountPercent: 15 },
        { minCases: 6, maxCases: null, discountPercent: 20 }
    ];

    useEffect(() => {
        loadDeals();
    }, [brandId]);

    const loadDeals = async () => {
        if (!brandId) return;
        setLoading(true);
        try {
            const data = await getDealRules(brandId);
            setDeals(data);
        } catch (error) {
            console.error('Error loading deals:', error);
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const dealData = {
                brandId: brandId,
                name: formData.name,
                description: formData.description,
                ruleType: formData.ruleType,
                minQuantity: formData.minQuantity ? parseInt(formData.minQuantity) : null,
                minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
                discountType: formData.discountType,
                discountValue: formData.ruleType === 'tiered_cod_discount' ? 0 : parseFloat(formData.discountValue || 0),
                isActive: formData.isActive,
                createdBy: currentUser?.uid || brandUser?.uid
            };

            // Add tiers for tiered COD discount
            if (formData.ruleType === 'tiered_cod_discount' && formData.tiers.length > 0) {
                dealData.tiers = formData.tiers;
            }

            if (editingDeal) {
                await updateDealRule(editingDeal.id, dealData);
                showNotification('Deal updated successfully!', 'success');
            } else {
                await createDealRule(dealData);
                showNotification('Deal created successfully!', 'success');
            }

            setShowModal(false);
            resetForm();
            loadDeals();
        } catch (error) {
            showNotification('Error saving deal. Please try again.', 'error');
        }

        setSaving(false);
    };

    const handleEdit = (deal) => {
        setEditingDeal(deal);
        // Parse tiers from JSON if stored as string
        let parsedTiers = [];
        if (deal.tiers) {
            parsedTiers = typeof deal.tiers === 'string' ? JSON.parse(deal.tiers) : deal.tiers;
        }
        setFormData({
            name: deal.name || '',
            description: deal.description || '',
            ruleType: deal.rule_type,
            minQuantity: deal.min_quantity || '',
            minOrderValue: deal.min_order_value || '',
            discountType: deal.discount_type,
            discountValue: deal.discount_value,
            isActive: deal.is_active,
            tiers: parsedTiers
        });
        setShowModal(true);
    };

    const handleDelete = async (dealId) => {
        if (!confirm('Are you sure you want to delete this deal?')) return;
        try {
            await deleteDealRule(dealId);
            showNotification('Deal deleted successfully!', 'success');
            loadDeals();
        } catch (error) {
            showNotification('Error deleting deal.', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            ruleType: 'bulk_discount',
            minQuantity: '',
            minOrderValue: '',
            discountType: 'percentage',
            discountValue: '',
            isActive: true,
            tiers: []
        });
        setEditingDeal(null);
    };

    const addTier = () => {
        const lastTier = formData.tiers[formData.tiers.length - 1];
        const newMinCases = lastTier ? (lastTier.maxCases || lastTier.minCases) + 1 : 1;
        setFormData({
            ...formData,
            tiers: [...formData.tiers, { minCases: newMinCases, maxCases: null, discountPercent: 5 }]
        });
    };

    const updateTier = (index, field, value) => {
        const updatedTiers = [...formData.tiers];
        updatedTiers[index] = { ...updatedTiers[index], [field]: value === '' ? null : Number(value) };
        setFormData({ ...formData, tiers: updatedTiers });
    };

    const removeTier = (index) => {
        setFormData({ ...formData, tiers: formData.tiers.filter((_, i) => i !== index) });
    };

    const loadDefaultTiers = () => {
        setFormData({ ...formData, tiers: [...defaultTiers] });
    };

    const getRuleIcon = (type) => {
        switch (type) {
            case 'bulk_discount': return <Package size={18} />;
            case 'cod_discount': return <CreditCard size={18} />;
            case 'tiered_cod_discount': return <Layers size={18} />;
            case 'first_order': return <Gift size={18} />;
            default: return <DollarSign size={18} />;
        }
    };

    // Format tiers for display
    const formatTiers = (tiers) => {
        if (!tiers || tiers.length === 0) return null;
        const parsed = typeof tiers === 'string' ? JSON.parse(tiers) : tiers;
        return parsed.map((tier, idx) => (
            <div key={idx} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {tier.minCases}-{tier.maxCases || '+'} cases: <span style={{ color: 'var(--accent-primary)' }}>{tier.discountPercent}% off</span>
            </div>
        ));
    };

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
            {/* Admin Access Banner */}
            {isAdminAccess && (
                <div className="mb-4 p-3 rounded-xl flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white' }}>
                    <div className="flex items-center gap-3">
                        <a href="/admin/brands" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <ArrowLeft size={18} />
                        </a>
                        <div>
                            <p className="text-sm opacity-80">Admin Access</p>
                            <p className="font-bold">Managing Deals for {brandDisplayName}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {isAdminAccess ? `${brandDisplayName} - Deal Rules` : 'Deal Rules'}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Configure discounts for bulk orders, COD, and special promotions
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
                    style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                >
                    <Plus size={18} />
                    Add Deal
                </button>
            </div>

            {/* Deals Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
                </div>
            ) : deals.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                    <DollarSign size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                    <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No deals configured</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                        Create your first deal to offer discounts to dispensaries
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                    >
                        Create First Deal
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deals.map(deal => (
                        <div
                            key={deal.id}
                            className="p-6 rounded-2xl transition-all hover:shadow-lg"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)', opacity: deal.is_active ? 1 : 0.5 }}
                                    >
                                        {getRuleIcon(deal.rule_type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{deal.name}</h3>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full ${deal.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                                        >
                                            {deal.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(deal)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deal.id)}
                                        className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                {deal.description || DEAL_RULE_TYPES.find(t => t.value === deal.rule_type)?.description}
                            </p>

                            {/* Tiered discount display */}
                            {deal.rule_type === 'tiered_cod_discount' && deal.tiers ? (
                                <div className="pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                    <span className="text-sm mb-2 block" style={{ color: 'var(--text-tertiary)' }}>COD Tiers:</span>
                                    <div className="space-y-1">
                                        {formatTiers(deal.tiers)}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Discount:</span>
                                    <span className="text-lg font-bold" style={{ color: 'var(--accent-primary)' }}>
                                        {deal.discount_type === 'percentage' ? `${deal.discount_value}%` : `$${deal.discount_value}`}
                                    </span>
                                </div>
                            )}

                            {(deal.min_order_value || deal.min_quantity) && (
                                <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    {deal.min_order_value && `Min. order: $${deal.min_order_value}`}
                                    {deal.min_quantity && `Min. quantity: ${deal.min_quantity} units`}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div
                        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: 'var(--bg-card)' }}
                    >
                        <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                {editingDeal ? 'Edit Deal' : 'Create New Deal'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Deal Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 rounded-lg outline-none focus:ring-2"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="e.g., Bulk Order 5% Off"
                                />
                            </div>

                            {/* Rule Type */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                    Deal Type
                                </label>
                                <select
                                    value={formData.ruleType}
                                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg outline-none"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-primary)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {DEAL_RULE_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Conditions */}
                            {formData.ruleType === 'bulk_discount' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            Min Order Value ($)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.minOrderValue}
                                            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg outline-none"
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder="e.g., 2000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            Min Quantity
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.minQuantity}
                                            onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg outline-none"
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder="e.g., 50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Tiered COD Discount Editor */}
                            {formData.ruleType === 'tiered_cod_discount' && (
                                <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            Discount Tiers (by case quantity)
                                        </label>
                                        <div className="flex gap-2">
                                            {formData.tiers.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={loadDefaultTiers}
                                                    className="text-xs px-2 py-1 rounded-lg"
                                                    style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                                                >
                                                    Load JUSBUD Template
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={addTier}
                                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                            >
                                                <Plus size={12} /> Add Tier
                                            </button>
                                        </div>
                                    </div>

                                    {formData.tiers.length === 0 ? (
                                        <p className="text-xs text-center py-4" style={{ color: 'var(--text-tertiary)' }}>
                                            No tiers configured. Click "Load JUSBUD Template" or add tiers manually.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {formData.tiers.map((tier, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                                        <div>
                                                            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Min Cases</label>
                                                            <input
                                                                type="number"
                                                                value={tier.minCases}
                                                                onChange={(e) => updateTier(idx, 'minCases', e.target.value)}
                                                                className="w-full px-2 py-1 rounded text-sm"
                                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                                min="1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Max Cases</label>
                                                            <input
                                                                type="number"
                                                                value={tier.maxCases || ''}
                                                                onChange={(e) => updateTier(idx, 'maxCases', e.target.value)}
                                                                className="w-full px-2 py-1 rounded text-sm"
                                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                                placeholder="∞"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Discount %</label>
                                                            <input
                                                                type="number"
                                                                value={tier.discountPercent}
                                                                onChange={(e) => updateTier(idx, 'discountPercent', e.target.value)}
                                                                className="w-full px-2 py-1 rounded text-sm"
                                                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                                                min="0"
                                                                max="100"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTier(idx)}
                                                        className="p-1 hover:bg-red-50 rounded"
                                                    >
                                                        <X size={14} className="text-red-500" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                                        💡 Tiers are applied based on total cases ordered. Leave "Max Cases" empty for unlimited.
                                    </p>
                                </div>
                            )}

                            {/* Discount - hidden for tiered COD discount */}
                            {formData.ruleType !== 'tiered_cod_discount' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            Discount Type
                                        </label>
                                        <select
                                            value={formData.discountType}
                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg outline-none"
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                        >
                                            {DISCOUNT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                            Discount Value
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discountValue}
                                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                            required
                                            className="w-full px-4 py-2 rounded-lg outline-none"
                                            style={{
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border-primary)',
                                                color: 'var(--text-primary)'
                                            }}
                                            placeholder={formData.discountType === 'percentage' ? '10' : '50'}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-12 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {formData.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="px-4 py-2 rounded-lg font-medium"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                    style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                                >
                                    {saving ? <Loader size={16} className="animate-spin" /> : <Check size={16} />}
                                    {editingDeal ? 'Save Changes' : 'Create Deal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
