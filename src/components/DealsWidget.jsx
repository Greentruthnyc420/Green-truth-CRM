import React, { useState, useEffect } from 'react';
import { Tag, Percent, DollarSign, Gift, Zap, Clock, ChevronDown, ChevronUp, Package, TrendingUp, Award } from 'lucide-react';
import { getDealRules, DEAL_RULE_TYPES, getTimeRemaining } from '../services/dealService';
import { supabase } from '../services/supabaseClient';

/**
 * DealsWidget - Displays all available deals for dispensaries
 * Shows deals from all brands with criteria to meet them
 */
export default function DealsWidget({ className = '' }) {
    const [deals, setDeals] = useState([]);
    const [brands, setBrands] = useState({});
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        async function loadDeals() {
            try {
                // Fetch all active deals (no brand filter = all brands)
                const allDeals = await getDealRules(null);

                // Get unique brand IDs
                const brandIds = [...new Set(allDeals.filter(d => d.brand_id).map(d => d.brand_id))];

                // Fetch brand names
                if (brandIds.length > 0) {
                    const { data: brandData } = await supabase
                        .from('admin_brands')
                        .select('id, brand_name')
                        .in('id', brandIds);

                    const brandMap = {};
                    (brandData || []).forEach(b => {
                        brandMap[b.id] = b.brand_name;
                    });
                    setBrands(brandMap);
                }

                setDeals(allDeals);
            } catch (error) {
                console.error('Error loading deals:', error);
            } finally {
                setLoading(false);
            }
        }
        loadDeals();
    }, []);

    const getIconForType = (ruleType) => {
        switch (ruleType) {
            case 'cod_discount':
            case 'tiered_cod_discount':
                return <DollarSign size={16} className="text-green-500" />;
            case 'bulk_discount':
            case 'tiered_volume':
                return <TrendingUp size={16} className="text-blue-500" />;
            case 'first_order':
                return <Gift size={16} className="text-purple-500" />;
            case 'bogo':
                return <Package size={16} className="text-orange-500" />;
            case 'flash_sale':
                return <Zap size={16} className="text-yellow-500" />;
            case 'threshold_bonus':
                return <Award size={16} className="text-pink-500" />;
            default:
                return <Percent size={16} className="text-emerald-500" />;
        }
    };

    const formatCriteria = (deal) => {
        const criteria = [];

        if (deal.min_order_value) {
            criteria.push(`Min order: $${deal.min_order_value}`);
        }
        if (deal.min_quantity) {
            criteria.push(`Min qty: ${deal.min_quantity} units`);
        }
        if (deal.rule_type === 'cod_discount' || deal.rule_type === 'tiered_cod_discount') {
            criteria.push('Pay with cash on delivery');
        }
        if (deal.rule_type === 'first_order') {
            criteria.push('First order only');
        }
        if (deal.rule_type === 'bogo') {
            const meta = deal.discount_meta ?
                (typeof deal.discount_meta === 'string' ? JSON.parse(deal.discount_meta) : deal.discount_meta) : {};
            criteria.push(`Buy ${meta.buyQuantity || 4}+ cases`);
        }
        if (deal.tiers) {
            const tiers = typeof deal.tiers === 'string' ? JSON.parse(deal.tiers) : deal.tiers;
            if (tiers.length > 0) {
                const minCases = Math.min(...tiers.map(t => t.minCases));
                criteria.push(`${minCases}+ cases`);
            }
        }

        return criteria.length > 0 ? criteria : ['Available on all orders'];
    };

    const formatDiscount = (deal) => {
        if (deal.discount_type === 'percentage') {
            return `${deal.discount_value}% OFF`;
        } else if (deal.discount_type === 'fixed') {
            return `$${deal.discount_value} OFF`;
        } else if (deal.discount_type === 'per_case') {
            return `$${deal.discount_value}/case OFF`;
        } else if (deal.discount_type === 'per_unit') {
            return `$${deal.discount_value}/unit OFF`;
        } else if (deal.tiers) {
            const tiers = typeof deal.tiers === 'string' ? JSON.parse(deal.tiers) : deal.tiers;
            if (tiers.length > 0) {
                const maxDiscount = Math.max(...tiers.map(t => t.discountPercent || t.perCaseDiscount || 0));
                if (tiers[0].discountPercent) {
                    return `Up to ${maxDiscount}% OFF`;
                } else {
                    return `Up to $${maxDiscount}/case OFF`;
                }
            }
        }
        return 'Special Offer';
    };

    if (loading) {
        return (
            <div className={`p-4 rounded-2xl animate-pulse ${className}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
                <div className="h-6 w-32 rounded mb-3" style={{ background: 'var(--bg-secondary)' }} />
                <div className="space-y-2">
                    <div className="h-16 rounded-xl" style={{ background: 'var(--bg-secondary)' }} />
                    <div className="h-16 rounded-xl" style={{ background: 'var(--bg-secondary)' }} />
                </div>
            </div>
        );
    }

    if (deals.length === 0) {
        return null; // Don't show if no deals
    }

    return (
        <div
            className={`rounded-2xl overflow-hidden ${className}`}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.05))' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                        <Tag className="text-emerald-500" size={20} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Available Deals</h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{deals.length} active offers</p>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={20} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-tertiary)' }} />}
            </button>

            {/* Deals List */}
            {isExpanded && (
                <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                    {deals.map((deal) => {
                        const timeRemaining = getTimeRemaining(deal.expires_at);
                        return (
                            <div
                                key={deal.id}
                                className="p-3 rounded-xl transition-all hover:scale-[1.01]"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        {getIconForType(deal.rule_type)}
                                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                                            {deal.name}
                                        </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                        {formatDiscount(deal)}
                                    </span>
                                </div>

                                {/* Brand Name */}
                                {deal.brand_id && brands[deal.brand_id] && (
                                    <p className="text-xs mb-1" style={{ color: 'var(--accent-primary)' }}>
                                        🏷️ {brands[deal.brand_id]}
                                    </p>
                                )}

                                {/* Description */}
                                {deal.description && (
                                    <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                                        {deal.description}
                                    </p>
                                )}

                                {/* Criteria */}
                                <div className="flex flex-wrap gap-1">
                                    {formatCriteria(deal).map((criteria, idx) => (
                                        <span
                                            key={idx}
                                            className="text-[10px] px-2 py-0.5 rounded-full"
                                            style={{ background: 'var(--bg-card)', color: 'var(--text-tertiary)' }}
                                        >
                                            {criteria}
                                        </span>
                                    ))}
                                </div>

                                {/* Expiration */}
                                {timeRemaining && !timeRemaining.expired && (
                                    <div className={`flex items-center gap-1 mt-2 text-[10px] ${timeRemaining.urgent ? 'text-red-500' : ''}`} style={{ color: timeRemaining.urgent ? undefined : 'var(--text-tertiary)' }}>
                                        <Clock size={10} />
                                        <span>Ends in {timeRemaining.text}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
