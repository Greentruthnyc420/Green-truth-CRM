import React, { useState, useEffect } from 'react';
import {
    Tag, Plus, Percent, DollarSign, Clock, Package, Flame, Zap,
    Calendar, ChevronDown, X, Edit2, Pause, Play, Trash2, BarChart3,
    Filter, Search, AlertCircle, CheckCircle, TrendingUp
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { notifySalesRepsNewDeal } from '../../services/notificationService';


// Flash sale duration presets
const DURATION_PRESETS = [
    { label: '24 Hours', value: 24, unit: 'hours' },
    { label: '48 Hours', value: 48, unit: 'hours' },
    { label: '1 Week', value: 7, unit: 'days' },
    { label: '2 Weeks', value: 14, unit: 'days' },
    { label: '1 Month', value: 30, unit: 'days' },
    { label: '1 Quarter', value: 90, unit: 'days' },
    { label: 'Custom', value: 'custom', unit: 'custom' }
];

const DEAL_TYPES = [
    { id: 'percentage', label: 'Percentage Off', icon: Percent, color: '#10b981', description: 'e.g., 10% off all products' },
    { id: 'fixed_amount', label: 'Fixed Amount Off', icon: DollarSign, color: '#3b82f6', description: 'e.g., $5 off per unit' },
    { id: 'tiered', label: 'Volume/Tiered', icon: TrendingUp, color: '#8b5cf6', description: 'Discounts increase with quantity' },
    { id: 'bundle', label: 'Bundle Deal', icon: Package, color: '#f59e0b', description: 'Buy X, Get Y free/discounted' },
    { id: 'clearance', label: 'Clearance', icon: Flame, color: '#ef4444', description: 'For expiring/excess inventory' },
    { id: 'flash_sale', label: 'Flash Sale', icon: Zap, color: '#ec4899', description: 'Limited time offers with countdown' }
];

const TARGET_TYPES = [
    { id: 'brand', label: 'All Products', description: 'Apply to entire brand catalog' },
    { id: 'category', label: 'Category', description: 'Apply to specific product category' },
    { id: 'product', label: 'Single Product', description: 'Apply to one specific product' },
    { id: 'products', label: 'Multiple Products', description: 'Select multiple products' }
];

const CATEGORIES = ['Vape', 'Pre-Roll', 'Edible', 'Concentrate', 'Flower', 'Accessories', 'Other'];

const BADGE_COLORS = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
];

export default function BrandDeals() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingDeal, setEditingDeal] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, expired, paused
    const [searchTerm, setSearchTerm] = useState('');

    // Get brand ID from localStorage or context
    const brandId = localStorage.getItem('brandId') || 'demo-brand';

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('brand_id', brandId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDealStatus = async (dealId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('deals')
                .update({ is_active: !currentStatus })
                .eq('id', dealId);

            if (error) throw error;
            fetchDeals();
        } catch (error) {
            console.error('Error toggling deal:', error);
        }
    };

    const deleteDeal = async (dealId) => {
        if (!confirm('Are you sure you want to delete this deal?')) return;

        try {
            const { error } = await supabase
                .from('deals')
                .delete()
                .eq('id', dealId);

            if (error) throw error;
            fetchDeals();
        } catch (error) {
            console.error('Error deleting deal:', error);
        }
    };

    const filteredDeals = deals.filter(deal => {
        const matchesSearch = deal.name.toLowerCase().includes(searchTerm.toLowerCase());
        const now = new Date();
        const isExpired = deal.expires_at && new Date(deal.expires_at) < now;

        switch (filter) {
            case 'active': return matchesSearch && deal.is_active && !isExpired;
            case 'expired': return matchesSearch && isExpired;
            case 'paused': return matchesSearch && !deal.is_active;
            default: return matchesSearch;
        }
    });

    const getDealTypeInfo = (type) => DEAL_TYPES.find(t => t.id === type) || DEAL_TYPES[0];

    const formatExpiration = (expiresAt) => {
        if (!expiresAt) return 'No expiration';
        const date = new Date(expiresAt);
        const now = new Date();
        const diff = date - now;

        if (diff < 0) return 'Expired';
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h left`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d left`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Tag className="w-7 h-7 text-emerald-400" />
                        Deals & Promotions
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Create targeted deals for your products
                    </p>
                </div>
                <button
                    onClick={() => { setEditingDeal(null); setShowCreateModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                >
                    <Plus className="w-5 h-5" />
                    Create Deal
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Active Deals', value: deals.filter(d => d.is_active).length, icon: CheckCircle, color: '#10b981' },
                    { label: 'Total Uses', value: deals.reduce((sum, d) => sum + (d.current_uses || 0), 0), icon: BarChart3, color: '#3b82f6' },
                    { label: 'Expiring Soon', value: deals.filter(d => d.expires_at && new Date(d.expires_at) - new Date() < 86400000 * 3).length, icon: Clock, color: '#f59e0b' },
                    { label: 'Flash Sales', value: deals.filter(d => d.deal_type === 'flash_sale' && d.is_active).length, icon: Zap, color: '#ec4899' }
                ].map((stat, idx) => (
                    <div key={idx} className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: `${stat.color}20` }}>
                                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search deals..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'active', 'paused', 'expired'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${filter === f ? 'ring-2 ring-emerald-500' : ''}`}
                            style={{
                                background: filter === f ? 'var(--bg-card)' : 'var(--bg-secondary)',
                                color: filter === f ? '#10b981' : 'var(--text-secondary)'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Deals Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
            ) : filteredDeals.length === 0 ? (
                <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                    <Tag className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                    <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No deals found</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Create your first deal to attract more orders</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 px-5 py-2 rounded-xl font-medium"
                        style={{ background: '#10b981', color: 'white' }}
                    >
                        Create Deal
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDeals.map((deal) => {
                        const typeInfo = getDealTypeInfo(deal.deal_type);
                        const isExpired = deal.expires_at && new Date(deal.expires_at) < new Date();

                        return (
                            <div
                                key={deal.id}
                                className={`rounded-xl p-4 transition-all hover:scale-[1.02] ${!deal.is_active || isExpired ? 'opacity-60' : ''}`}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                            >
                                {/* Header with badge */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="p-2 rounded-lg"
                                            style={{ background: `${typeInfo.color}20` }}
                                        >
                                            <typeInfo.icon className="w-5 h-5" style={{ color: typeInfo.color }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{deal.name}</h3>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{typeInfo.label}</p>
                                        </div>
                                    </div>
                                    {deal.badge_text && (
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-bold"
                                            style={{ background: deal.badge_color || '#10b981', color: 'white' }}
                                        >
                                            {deal.badge_text}
                                        </span>
                                    )}
                                </div>

                                {/* Deal details */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Target:</span>
                                        <span className="font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                                            {deal.target_type === 'brand' ? 'All Products' : deal.target_category || deal.target_type}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Discount:</span>
                                        <span className="font-bold" style={{ color: '#10b981' }}>
                                            {deal.discount_percent ? `${deal.discount_percent}%` : deal.discount_amount ? `$${deal.discount_amount}` : 'Tiered'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Expires:</span>
                                        <span className={`font-medium ${isExpired ? 'text-red-400' : ''}`} style={{ color: isExpired ? '#ef4444' : 'var(--text-secondary)' }}>
                                            {formatExpiration(deal.expires_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span style={{ color: 'var(--text-tertiary)' }}>Uses:</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {deal.current_uses || 0}{deal.max_uses ? ` / ${deal.max_uses}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                                    <button
                                        onClick={() => toggleDealStatus(deal.id, deal.is_active)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                                        style={{
                                            background: deal.is_active ? 'rgba(251, 191, 36, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                            color: deal.is_active ? '#f59e0b' : '#10b981'
                                        }}
                                    >
                                        {deal.is_active ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Resume</>}
                                    </button>
                                    <button
                                        onClick={() => { setEditingDeal(deal); setShowCreateModal(true); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button
                                        onClick={() => deleteDeal(deal.id)}
                                        className="p-2 rounded-lg transition-all hover:opacity-80"
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <CreateDealModal
                    deal={editingDeal}
                    brandId={brandId}
                    onClose={() => { setShowCreateModal(false); setEditingDeal(null); }}
                    onSave={() => { fetchDeals(); setShowCreateModal(false); setEditingDeal(null); }}
                />
            )}
        </div>
    );
}

// Create Deal Modal Component
function CreateDealModal({ deal, brandId, onClose, onSave }) {
    const isEditing = !!deal;

    const [formData, setFormData] = useState({
        name: deal?.name || '',
        description: deal?.description || '',
        deal_type: deal?.deal_type || 'percentage',
        target_type: deal?.target_type || 'brand',
        target_category: deal?.target_category || '',
        target_product_ids: deal?.target_product_ids || [],
        discount_percent: deal?.discount_percent || '',
        discount_amount: deal?.discount_amount || '',
        tiered_discounts: deal?.tiered_discounts || [{ min_qty: 3, discount: 10 }],
        bundle_config: deal?.bundle_config || { buy_qty: 3, get_qty: 1, get_discount: 100 },
        starts_at: deal?.starts_at ? new Date(deal.starts_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        expires_at: deal?.expires_at ? new Date(deal.expires_at).toISOString().slice(0, 16) : '',
        min_order_qty: deal?.min_order_qty || 1,
        max_uses: deal?.max_uses || '',
        badge_text: deal?.badge_text || '',
        badge_color: deal?.badge_color || '#10b981',
        show_countdown: deal?.show_countdown || false,
        is_active: deal?.is_active ?? true
    });

    const [durationPreset, setDurationPreset] = useState('custom');
    const [customDays, setCustomDays] = useState(7);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    const handleDurationChange = (preset) => {
        setDurationPreset(preset.value);
        if (preset.value !== 'custom') {
            const now = new Date();
            const hours = preset.unit === 'hours' ? preset.value : preset.value * 24;
            now.setHours(now.getHours() + hours);
            setFormData(prev => ({ ...prev, expires_at: now.toISOString().slice(0, 16) }));
        }
    };

    const handleCustomDuration = (days) => {
        setCustomDays(days);
        const now = new Date();
        now.setDate(now.getDate() + parseInt(days));
        setFormData(prev => ({ ...prev, expires_at: now.toISOString().slice(0, 16) }));
    };

    const addTier = () => {
        setFormData(prev => ({
            ...prev,
            tiered_discounts: [...(prev.tiered_discounts || []), { min_qty: 1, discount: 5 }]
        }));
    };

    const removeTier = (idx) => {
        setFormData(prev => ({
            ...prev,
            tiered_discounts: prev.tiered_discounts.filter((_, i) => i !== idx)
        }));
    };

    const updateTier = (idx, field, value) => {
        setFormData(prev => ({
            ...prev,
            tiered_discounts: prev.tiered_discounts.map((tier, i) =>
                i === idx ? { ...tier, [field]: parseFloat(value) || 0 } : tier
            )
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                brand_id: brandId,
                name: formData.name,
                description: formData.description,
                deal_type: formData.deal_type,
                target_type: formData.target_type,
                target_category: formData.target_type === 'category' ? formData.target_category : null,
                target_product_ids: formData.target_type === 'products' ? formData.target_product_ids : null,
                discount_percent: ['percentage', 'clearance', 'flash_sale'].includes(formData.deal_type) ? parseFloat(formData.discount_percent) || null : null,
                discount_amount: formData.deal_type === 'fixed_amount' ? parseFloat(formData.discount_amount) || null : null,
                tiered_discounts: formData.deal_type === 'tiered' ? formData.tiered_discounts : null,
                bundle_config: formData.deal_type === 'bundle' ? formData.bundle_config : null,
                starts_at: formData.starts_at || new Date().toISOString(),
                expires_at: formData.expires_at || null,
                min_order_qty: parseInt(formData.min_order_qty) || 1,
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                badge_text: formData.badge_text || null,
                badge_color: formData.badge_color,
                show_countdown: formData.deal_type === 'flash_sale' ? true : formData.show_countdown,
                is_active: formData.is_active,
                created_by: localStorage.getItem('userEmail') || 'brand-user'
            };

            if (isEditing) {
                const { error } = await supabase.from('deals').update(payload).eq('id', deal.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('deals').insert([payload]);
                if (error) throw error;

                // Notify sales reps about the new deal
                try {
                    await notifySalesRepsNewDeal(brandName, formData.name);
                } catch (notifyError) {
                    console.warn('Failed to send deal notification:', notifyError);
                }
            }

            onSave();
        } catch (error) {
            console.error('Error saving deal:', error);
            alert('Failed to save deal: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const selectedType = DEAL_TYPES.find(t => t.id === formData.deal_type);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
            >
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {isEditing ? 'Edit Deal' : 'Create New Deal'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
                        <X className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Step 1: Deal Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Deal Type
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {DEAL_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setFormData(prev => ({ ...prev, deal_type: type.id }))}
                                    className={`p-3 rounded-xl text-left transition-all ${formData.deal_type === type.id ? 'ring-2' : ''}`}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        ringColor: type.color
                                    }}
                                >
                                    <type.icon className="w-5 h-5 mb-2" style={{ color: type.color }} />
                                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{type.label}</p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{type.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Deal Name & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Deal Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g., Spring Sale 20% Off"
                                className="w-full px-4 py-2.5 rounded-xl text-sm"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Badge Text
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.badge_text}
                                    onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value.toUpperCase() }))}
                                    placeholder="e.g., FLASH SALE"
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                                <div className="flex gap-1">
                                    {BADGE_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setFormData(prev => ({ ...prev, badge_color: color }))}
                                            className={`w-8 h-8 rounded-lg ${formData.badge_color === color ? 'ring-2 ring-white' : ''}`}
                                            style={{ background: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Target Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Apply To
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TARGET_TYPES.map((target) => (
                                <button
                                    key={target.id}
                                    onClick={() => setFormData(prev => ({ ...prev, target_type: target.id }))}
                                    className={`px-4 py-2 rounded-xl text-sm transition-all ${formData.target_type === target.id ? 'ring-2 ring-emerald-500' : ''}`}
                                    style={{
                                        background: formData.target_type === target.id ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
                                        color: formData.target_type === target.id ? '#10b981' : 'var(--text-secondary)'
                                    }}
                                >
                                    {target.label}
                                </button>
                            ))}
                        </div>
                        {formData.target_type === 'category' && (
                            <select
                                value={formData.target_category}
                                onChange={(e) => setFormData(prev => ({ ...prev, target_category: e.target.value }))}
                                className="mt-3 w-full px-4 py-2.5 rounded-xl text-sm"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">Select category...</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Discount Value - Based on deal type */}
                    {['percentage', 'clearance', 'flash_sale'].includes(formData.deal_type) && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Discount Percentage
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={formData.discount_percent}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                                    placeholder="10"
                                    min="0"
                                    max="100"
                                    className="w-32 px-4 py-2.5 rounded-xl text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>%</span>
                            </div>
                        </div>
                    )}

                    {formData.deal_type === 'fixed_amount' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Discount Amount
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-bold" style={{ color: 'var(--text-tertiary)' }}>$</span>
                                <input
                                    type="number"
                                    value={formData.discount_amount}
                                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                                    placeholder="5.00"
                                    min="0"
                                    step="0.01"
                                    className="w-32 px-4 py-2.5 rounded-xl text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>off per unit</span>
                            </div>
                        </div>
                    )}

                    {formData.deal_type === 'tiered' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Tiered Discounts
                            </label>
                            <div className="space-y-2">
                                {(formData.tiered_discounts || []).map((tier, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Min</span>
                                        <input
                                            type="number"
                                            value={tier.min_qty}
                                            onChange={(e) => updateTier(idx, 'min_qty', e.target.value)}
                                            className="w-20 px-3 py-2 rounded-lg text-sm"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>cases →</span>
                                        <input
                                            type="number"
                                            value={tier.discount}
                                            onChange={(e) => updateTier(idx, 'discount', e.target.value)}
                                            className="w-20 px-3 py-2 rounded-lg text-sm"
                                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                        />
                                        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>% off</span>
                                        {formData.tiered_discounts.length > 1 && (
                                            <button onClick={() => removeTier(idx)} className="p-1 text-red-400 hover:bg-red-400/10 rounded">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addTier} className="text-sm text-emerald-400 hover:underline">
                                    + Add Tier
                                </button>
                            </div>
                        </div>
                    )}

                    {formData.deal_type === 'bundle' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Bundle Configuration
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Buy</span>
                                <input
                                    type="number"
                                    value={formData.bundle_config.buy_qty}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        bundle_config: { ...prev.bundle_config, buy_qty: parseInt(e.target.value) || 0 }
                                    }))}
                                    className="w-16 px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Get</span>
                                <input
                                    type="number"
                                    value={formData.bundle_config.get_qty}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        bundle_config: { ...prev.bundle_config, get_qty: parseInt(e.target.value) || 0 }
                                    }))}
                                    className="w-16 px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>at</span>
                                <input
                                    type="number"
                                    value={formData.bundle_config.get_discount}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        bundle_config: { ...prev.bundle_config, get_discount: parseInt(e.target.value) || 0 }
                                    }))}
                                    className="w-16 px-3 py-2 rounded-lg text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>% off</span>
                            </div>
                        </div>
                    )}

                    {/* Flash Sale Duration */}
                    {formData.deal_type === 'flash_sale' && (
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Flash Sale Duration
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {DURATION_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => handleDurationChange(preset)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${durationPreset === preset.value ? 'ring-2 ring-pink-500' : ''}`}
                                        style={{
                                            background: durationPreset === preset.value ? 'rgba(236, 72, 153, 0.1)' : 'var(--bg-secondary)',
                                            color: durationPreset === preset.value ? '#ec4899' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            {durationPreset === 'custom' && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={customDays}
                                        onChange={(e) => handleCustomDuration(e.target.value)}
                                        min="1"
                                        max="365"
                                        className="w-24 px-4 py-2 rounded-xl text-sm"
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                    />
                                    <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>days</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Expiration for non-flash sales */}
                    {formData.deal_type !== 'flash_sale' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    Expiration (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Min Order & Max Uses */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Minimum Order Qty
                            </label>
                            <input
                                type="number"
                                value={formData.min_order_qty}
                                onChange={(e) => setFormData(prev => ({ ...prev, min_order_qty: e.target.value }))}
                                min="1"
                                className="w-full px-4 py-2.5 rounded-xl text-sm"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                Max Uses (Leave empty for unlimited)
                            </label>
                            <input
                                type="number"
                                value={formData.max_uses}
                                onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                                placeholder="Unlimited"
                                min="1"
                                className="w-full px-4 py-2.5 rounded-xl text-sm"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-medium"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !formData.name}
                        className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                {isEditing ? 'Update Deal' : 'Create Deal'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
