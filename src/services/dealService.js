import { supabase } from './supabaseClient';

/**
 * Deal Rules Service
 * Handles CRUD operations for brand-specific deals and discounts
 */

// =============================================================================
// FETCH DEAL RULES
// =============================================================================

/**
 * Get all active deal rules for a specific brand
 * @param {string} brandId - The brand ID
 * @returns {Promise<Array>} - Active deal rules
 */
export async function getDealRules(brandId = null) {
    let query = supabase
        .from('deal_rules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (brandId) {
        query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching deal rules:', error);
        return [];
    }

    return data || [];
}

/**
 * Get all deal rules (including inactive) for admin view
 * @param {string} brandId - Optional brand filter
 * @returns {Promise<Array>}
 */
export async function getAllDealRules(brandId = null) {
    let query = supabase
        .from('deal_rules')
        .select('*')
        .order('created_at', { ascending: false });

    if (brandId) {
        query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching all deal rules:', error);
        return [];
    }

    return data || [];
}

// =============================================================================
// CREATE / UPDATE / DELETE DEAL RULES
// =============================================================================

/**
 * Create a new deal rule
 * @param {Object} rule - Deal rule object
 * @returns {Promise<Object|null>}
 */
export async function createDealRule(rule) {
    const insertData = {
        brand_id: rule.brandId,
        rule_type: rule.ruleType,
        name: rule.name,
        description: rule.description,
        min_quantity: rule.minQuantity || null,
        min_order_value: rule.minOrderValue || null,
        discount_type: rule.discountType || 'percentage',
        discount_value: rule.discountValue || 0,
        is_active: rule.isActive !== false,
        applies_to: rule.appliesTo || 'all_products',
        product_ids: rule.productIds || null,
        category: rule.category || null,
        created_by: rule.createdBy
    };

    // Add tiers for tiered discounts
    if (rule.tiers) {
        insertData.tiers = JSON.stringify(rule.tiers);
    }

    // Add discount_meta for BOGO, threshold bonus, etc.
    if (rule.discountMeta) {
        insertData.discount_meta = JSON.stringify(rule.discountMeta);
    }

    const { data, error } = await supabase
        .from('deal_rules')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Error creating deal rule:', error);
        throw error;
    }

    return data;
}


/**
 * Update an existing deal rule
 * @param {string} id - Deal rule ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>}
 */
export async function updateDealRule(id, updates) {
    const updateData = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.ruleType !== undefined) updateData.rule_type = updates.ruleType;
    if (updates.minQuantity !== undefined) updateData.min_quantity = updates.minQuantity;
    if (updates.minOrderValue !== undefined) updateData.min_order_value = updates.minOrderValue;
    if (updates.discountType !== undefined) updateData.discount_type = updates.discountType;
    if (updates.discountValue !== undefined) updateData.discount_value = updates.discountValue;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.appliesTo !== undefined) updateData.applies_to = updates.appliesTo;
    if (updates.productIds !== undefined) updateData.product_ids = updates.productIds;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.tiers !== undefined) updateData.tiers = JSON.stringify(updates.tiers);
    if (updates.discountMeta !== undefined) updateData.discount_meta = JSON.stringify(updates.discountMeta);

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from('deal_rules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating deal rule:', error);
        throw error;
    }

    return data;
}


/**
 * Delete a deal rule (soft delete by deactivating)
 * @param {string} id - Deal rule ID
 * @returns {Promise<boolean>}
 */
export async function deleteDealRule(id) {
    const { error } = await supabase
        .from('deal_rules')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error deleting deal rule:', error);
        throw error;
    }

    return true;
}

// =============================================================================
// CALCULATE APPLICABLE DEALS
// =============================================================================

/**
 * Calculate which deals apply to a cart and return total discount
 * @param {Array} cartItems - Array of cart items with { productId, brandId, quantity, price, caseSize }
 * @param {string} paymentMethod - 'cod' | 'invoice' | 'credit'
 * @returns {Promise<Object>} - { appliedDeals: Array, totalDiscount: number, finalTotal: number }
 */
export async function calculateApplicableDeals(cartItems, paymentMethod = 'invoice') {
    // Get unique brand IDs from cart
    const brandIds = [...new Set(cartItems.map(item => item.brandId))];

    // Fetch all active deal rules for these brands
    const allRules = [];
    for (const brandId of brandIds) {
        const rules = await getDealRules(brandId);
        allRules.push(...rules);
    }

    // Also fetch global rules (no brand_id)
    const globalRules = await getDealRules(null);
    allRules.push(...globalRules.filter(r => !r.brand_id));

    // Calculate cart totals
    const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalCases = cartItems.reduce((sum, item) => {
        const caseSize = item.caseSize || 1;
        return sum + Math.ceil(item.quantity / caseSize);
    }, 0);

    const appliedDeals = [];
    let totalDiscount = 0;

    for (const rule of allRules) {
        let applies = false;
        let discountAmount = 0;

        // Check rule type and conditions
        switch (rule.rule_type) {
            case 'bulk_discount':
                if (rule.min_order_value && cartTotal >= rule.min_order_value) {
                    applies = true;
                } else if (rule.min_quantity && totalQuantity >= rule.min_quantity) {
                    applies = true;
                }
                break;

            case 'cod_discount':
                if (paymentMethod === 'cod') {
                    applies = true;
                }
                break;

            case 'tiered_cod_discount':
            case 'tiered_volume':
                // Handle tiered discounts (both COD-specific and general volume)
                if ((rule.rule_type === 'tiered_cod_discount' && paymentMethod !== 'cod')) {
                    break; // COD tier requires COD payment
                }

                if (rule.tiers) {
                    const tiers = typeof rule.tiers === 'string' ? JSON.parse(rule.tiers) : rule.tiers;
                    const sortedTiers = [...tiers].sort((a, b) => a.minCases - b.minCases);
                    let applicableTier = null;

                    for (const tier of sortedTiers) {
                        if (totalCases >= tier.minCases) {
                            if (!tier.maxCases || totalCases <= tier.maxCases) {
                                applicableTier = tier;
                            }
                        }
                    }

                    // Use highest tier if above all
                    if (!applicableTier && sortedTiers.length > 0 && totalCases >= sortedTiers[sortedTiers.length - 1].minCases) {
                        applicableTier = sortedTiers[sortedTiers.length - 1];
                    }

                    if (applicableTier) {
                        applies = true;
                        // Check if tier has per-case discount or percentage
                        if (applicableTier.perCaseDiscount) {
                            discountAmount = totalCases * applicableTier.perCaseDiscount;
                        } else if (applicableTier.discountPercent) {
                            discountAmount = cartTotal * (applicableTier.discountPercent / 100);
                        }
                        rule._tierApplied = applicableTier;
                    }
                }
                break;

            case 'first_order':
                // Would need to check if this is customer's first order
                // For now, skip this type
                break;

            case 'category_discount':
                // Check if any items match the category
                const categoryItems = cartItems.filter(item => item.category === rule.category);
                if (categoryItems.length > 0) {
                    applies = true;
                }
                break;

            case 'bogo':
                // Buy X Get Y Free
                const discountMeta = rule.discount_meta ?
                    (typeof rule.discount_meta === 'string' ? JSON.parse(rule.discount_meta) : rule.discount_meta) : {};
                const buyQty = discountMeta.buyQuantity || 4;
                const freeQty = discountMeta.freeQuantity || 1;

                if (totalCases >= buyQty) {
                    applies = true;
                    // Calculate free items value (use average item price)
                    const avgPrice = cartTotal / totalCases;
                    const freeSets = Math.floor(totalCases / (buyQty + freeQty));
                    discountAmount = freeSets * freeQty * avgPrice;
                }
                break;

            case 'threshold_bonus':
                // Credit/bonus for orders over threshold
                const thresholdMeta = rule.discount_meta ?
                    (typeof rule.discount_meta === 'string' ? JSON.parse(rule.discount_meta) : rule.discount_meta) : {};
                const threshold = thresholdMeta.thresholdAmount || rule.min_order_value || 0;

                if (cartTotal >= threshold) {
                    applies = true;
                    // thresholdMeta.bonusType can be 'credit', 'free_shipping', 'percentage'
                    if (thresholdMeta.bonusType === 'credit' || thresholdMeta.bonusType === 'fixed') {
                        discountAmount = thresholdMeta.bonusValue || rule.discount_value || 0;
                    } else if (thresholdMeta.bonusType === 'percentage') {
                        discountAmount = cartTotal * ((thresholdMeta.bonusValue || rule.discount_value || 0) / 100);
                    }
                }
                break;
        }

        // If the discount wasn't calculated in the switch, calculate based on discount_type
        if (applies && discountAmount === 0) {
            switch (rule.discount_type) {
                case 'percentage':
                    discountAmount = cartTotal * (rule.discount_value / 100);
                    break;
                case 'fixed':
                    discountAmount = rule.discount_value;
                    break;
                case 'per_unit':
                    discountAmount = totalQuantity * rule.discount_value;
                    break;
                case 'per_case':
                    discountAmount = totalCases * rule.discount_value;
                    break;
                // tiered types are handled in the switch above
            }
        }

        if (applies && discountAmount > 0) {
            appliedDeals.push({
                id: rule.id,
                name: rule.name,
                type: rule.rule_type,
                discountType: rule.discount_type,
                discountValue: rule.discount_value,
                discountAmount: discountAmount,
                tierApplied: rule._tierApplied || null
            });

            totalDiscount += discountAmount;
        }
    }

    return {
        appliedDeals,
        totalDiscount: Math.min(totalDiscount, cartTotal), // Can't discount more than cart total
        originalTotal: cartTotal,
        finalTotal: Math.max(0, cartTotal - totalDiscount)
    };
}


// =============================================================================
// DEAL RULE TYPES
// =============================================================================

export const DEAL_RULE_TYPES = [
    { value: 'bulk_discount', label: 'Bulk Discount', description: 'Discount for orders over a certain value or quantity' },
    { value: 'cod_discount', label: 'Cash on Delivery', description: 'Flat discount for paying cash on delivery' },
    { value: 'tiered_cod_discount', label: 'Tiered COD Discount', description: 'Case-based tiered discounts for COD orders' },
    { value: 'tiered_volume', label: 'Tiered Volume Discount', description: 'Percentage discount tiers based on case quantity' },
    { value: 'first_order', label: 'First Order', description: 'Discount for first-time customers' },
    { value: 'category_discount', label: 'Category Discount', description: 'Discount on specific product categories' },
    { value: 'bogo', label: 'Buy X Get Y Free', description: 'Buy a certain quantity and get free items' },
    { value: 'threshold_bonus', label: 'Threshold Bonus', description: 'Free credit or bonus for orders over a threshold' }
];

export const DISCOUNT_TYPES = [
    { value: 'percentage', label: 'Percentage (%)', example: '10% off', description: 'Discount as percent of order' },
    { value: 'fixed', label: 'Fixed Amount ($)', example: '$50 off', description: 'Flat dollar discount' },
    { value: 'per_unit', label: 'Per Unit ($)', example: '$2 off per unit', description: 'Dollar off per unit ordered' },
    { value: 'per_case', label: 'Per Case ($)', example: '$20 off per case', description: 'Dollar off per case ordered' },
    { value: 'tiered_percentage', label: 'Tiered Percentage', example: '5+ cases = 10%', description: 'Percentage scales with volume' },
    { value: 'tiered_per_case', label: 'Tiered $ Per Case', example: '5+ cases = $10/case off', description: 'Per-case discount scales with volume' }
];

export const APPLIES_TO_OPTIONS = [
    { value: 'all_products', label: 'All Products' },
    { value: 'category', label: 'Specific Category' },
    { value: 'specific_products', label: 'Specific Products' }
];


/**
 * Calculate tiered discount based on total cases ordered
 * @param {number} totalCases - Total cases in cart
 * @param {Array} tiers - Discount tiers [{minCases, maxCases, discountPercent}]
 * @returns {number} - Discount percentage to apply
 */
export function calculateTieredDiscount(totalCases, tiers) {
    if (!tiers || tiers.length === 0) return 0;

    // Sort tiers by minCases ascending
    const sortedTiers = [...tiers].sort((a, b) => a.minCases - b.minCases);

    // Find applicable tier
    for (let i = sortedTiers.length - 1; i >= 0; i--) {
        const tier = sortedTiers[i];
        if (totalCases >= tier.minCases) {
            // Check if within max (if specified)
            if (!tier.maxCases || totalCases <= tier.maxCases) {
                return tier.discountPercent;
            }
            // If above max of this tier, check next higher tier
            if (i < sortedTiers.length - 1) {
                continue;
            }
            // Use highest tier if above all
            return tier.discountPercent;
        }
    }

    return 0;
}

