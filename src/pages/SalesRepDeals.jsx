import React, { useState, useEffect } from 'react';
import { Tag, Percent, Calendar, Package, Clock, Zap, Gift, Search, Filter, Loader } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export default function SalesRepDeals() {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchDeals();
    }, []);

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*, brands(name)')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (error) {
            console.error('Error fetching deals:', error);
            showNotification('Failed to load deals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getDealTypeIcon = (type) => {
        switch (type) {
            case 'flash_sale': return <Zap size={16} className="text-yellow-500" />;
            case 'bulk_discount': return <Package size={16} className="text-blue-500" />;
            case 'limited_time': return <Clock size={16} className="text-purple-500" />;
            case 'free_product': return <Gift size={16} className="text-green-500" />;
            default: return <Percent size={16} className="text-orange-500" />;
        }
    };

    const getDealTypeBadge = (type) => {
        const colors = {
            flash_sale: 'bg-yellow-100 text-yellow-700',
            bulk_discount: 'bg-blue-100 text-blue-700',
            limited_time: 'bg-purple-100 text-purple-700',
            free_product: 'bg-green-100 text-green-700',
            percentage: 'bg-orange-100 text-orange-700'
        };
        const labels = {
            flash_sale: 'Flash Sale',
            bulk_discount: 'Bulk Discount',
            limited_time: 'Limited Time',
            free_product: 'Free Product',
            percentage: 'Percentage Off'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${colors[type] || colors.percentage}`}>
                {getDealTypeIcon(type)}
                {labels[type] || 'Discount'}
            </span>
        );
    };

    const isExpiringSoon = (date) => {
        if (!date) return false;
        const expiry = new Date(date);
        const now = new Date();
        const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
        return daysLeft <= 3 && daysLeft > 0;
    };

    const filteredDeals = deals
        .filter(d => filter === 'all' || d.deal_type === filter)
        .filter(d =>
            (d.title?.toLowerCase().includes(search.toLowerCase())) ||
            (d.brands?.name?.toLowerCase().includes(search.toLowerCase()))
        );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader size={32} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Tag className="text-brand-600" /> Brand Deals & Promotions
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Active promotions from brands to help close sales
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Search deals or brands..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl outline-none"
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-primary)',
                            color: 'var(--text-primary)'
                        }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'percentage', 'bulk_discount', 'flash_sale', 'limited_time', 'free_product'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${filter === f ? 'bg-brand-600 text-white' : ''
                                }`}
                            style={filter !== f ? {
                                background: 'var(--bg-card)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-primary)'
                            } : {}}
                        >
                            {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>

            {/* Deals Grid */}
            {filteredDeals.length === 0 ? (
                <div className="text-center py-16 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                    <Tag size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No active deals found</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Check back later for new promotions</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDeals.map((deal) => (
                        <div
                            key={deal.id}
                            className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
                        >
                            {/* Header */}
                            <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                <div className="flex items-start justify-between mb-2">
                                    {getDealTypeBadge(deal.deal_type)}
                                    {isExpiringSoon(deal.expires_at) && (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 animate-pulse">
                                            EXPIRING SOON
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                                    {deal.title || 'Special Deal'}
                                </h3>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {deal.description || 'Contact brand for details'}
                                </p>
                            </div>

                            {/* Details */}
                            <div className="p-4" style={{ background: 'var(--bg-secondary)' }}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                                        Brand
                                    </span>
                                    <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                                        {deal.brands?.name || 'Unknown Brand'}
                                    </span>
                                </div>

                                {deal.discount_value && (
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                                            Discount
                                        </span>
                                        <span className="text-2xl font-black text-green-600">
                                            {deal.discount_type === 'percentage' ? `${deal.discount_value}%` : `$${deal.discount_value}`}
                                        </span>
                                    </div>
                                )}

                                {deal.min_order_amount && (
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold uppercase" style={{ color: 'var(--text-tertiary)' }}>
                                            Min Order
                                        </span>
                                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                            ${deal.min_order_amount}
                                        </span>
                                    </div>
                                )}

                                {deal.expires_at && (
                                    <div className="flex items-center gap-2 text-xs pt-3" style={{ borderTop: '1px solid var(--border-primary)', color: 'var(--text-tertiary)' }}>
                                        <Calendar size={12} />
                                        Expires: {new Date(deal.expires_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'var(--bg-tertiary)' }}>
                                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                    Uses: {deal.current_uses || 0}{deal.max_uses ? `/${deal.max_uses}` : ''}
                                </span>
                                {deal.promo_code && (
                                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-white">
                                        {deal.promo_code}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
