import { supabase } from './supabaseClient';

/**
 * Ensures 3-decimal precision for all point calculations.
 * Example: 1.5025 -> 1.503
 */
export const roundToThree = (num) => {
    return Math.round((num + Number.EPSILON) * 1000) / 1000;
};

/**
 * Calculates points for an order based on revenue and brand history.
 * - Revenue: 1 point per $100 (3 decimal precision)
 * - Re-order: 3.000 pts per brand (if previously purchased)
 * - New Placement: 5.000 pts per brand (if NOT previously purchased)
 */
export const calculateOrderPoints = (orderAmount, orderBrandIds, storePurchasedBrandIds = []) => {
    // 1. Revenue Calculation: 1 pt per $100
    const revenuePoints = roundToThree(orderAmount / 100);

    // 2. Brand Logic
    let brandPoints = 0;
    orderBrandIds.forEach(brandId => {
        if (storePurchasedBrandIds.includes(brandId)) {
            brandPoints += 3.000;
        } else {
            brandPoints += 5.000;
        }
    });

    return {
        revenuePoints,
        brandPoints: roundToThree(brandPoints),
        totalPoints: roundToThree(revenuePoints + brandPoints)
    };
};

/**
 * Awards 1.000 point to a rep for a new lead.
 */
export const awardLeadPoints = async (userId, leadId) => {
    try {
        const points = 1.000;

        // 1. RPC Call to atomic increment (safer) OR Fetch-Update (easier for now)
        // Let's use Fetch-Update for simplicity in prototype, or simple SQL increment if possible.
        // Supabase doesn't have a simple 'increment' helper in JS client without RPC.
        // We will fetch current, add, update.

        const { data: user, error: fetchError } = await supabase.from('users').select('lifetime_points, current_month_points').eq('id', userId).single();
        if (fetchError) throw fetchError;

        const newLifetime = roundToThree((user.lifetime_points || 0) + points);
        const newMonth = roundToThree((user.current_month_points || 0) + points);

        // Update User
        const { error: updateError } = await supabase.from('users').update({
            lifetime_points: newLifetime,
            current_month_points: newMonth,
            updated_at: new Date().toISOString()
        }).eq('id', userId);

        if (updateError) throw updateError;

        // Log History
        const { error: historyError } = await supabase.from('points_history').insert([{
            user_id: userId,
            action: 'new_lead',
            reference_id: leadId,
            points_earned: points,
            breakdown: { base: points },
            created_at: new Date().toISOString()
        }]);

        if (historyError) console.warn("Failed to log points history", historyError);

        return points;
    } catch (error) {
        console.error("Error awarding lead points:", error);
        throw error;
    }
};

/**
 * Orchestrates the points awarding for a sale/order.
 */
export const awardOrderPoints = async (userId, dispensaryId, orderAmount, orderBrandIds) => {
    try {
        // 1. Fetch Store History (Leads table has 'active_brands' which acts as purchase history?)
        // Or do we track purchase history more granularly?
        // In migration, we mapped 'active_brands' to leads. Let's use that.

        const { data: lead, error: leadError } = await supabase.from('leads').select('active_brands').eq('id', dispensaryId).single();
        if (leadError) throw leadError;

        const purchasedBrandIds = lead.active_brands || [];

        // 2. Calculate
        const breakdown = calculateOrderPoints(orderAmount, orderBrandIds, purchasedBrandIds);

        // 3. Update User Totals
        const { data: user, error: userError } = await supabase.from('users').select('lifetime_points, current_month_points').eq('id', userId).single();
        if (userError) throw userError;

        const newLifetime = roundToThree((user.lifetime_points || 0) + breakdown.totalPoints);
        const newMonth = roundToThree((user.current_month_points || 0) + breakdown.totalPoints);

        await supabase.from('users').update({
            lifetime_points: newLifetime,
            current_month_points: newMonth,
            updated_at: new Date().toISOString()
        }).eq('id', userId);

        // 4. Update Store History (add new brands to active_brands)
        // Union logic
        const updatedBrands = [...new Set([...purchasedBrandIds, ...orderBrandIds])];
        await supabase.from('leads').update({
            active_brands: updatedBrands,
            last_sale_date: new Date().toISOString(),
            last_sale_amount: orderAmount
            // Note: Schema might not have last_sale_amount, check later.
        }).eq('id', dispensaryId);

        // 5. Log History
        await supabase.from('points_history').insert([{
            user_id: userId,
            reference_id: dispensaryId, // or Sale ID? Usually Sale ID but we might not have it passed here easily if called pre-sale. 
            // The previous function didn't take saleId. We'll use dispensaryId for now or update signature.
            action: 'sale_order',
            points_earned: breakdown.totalPoints,
            breakdown: {
                revenuePoints: breakdown.revenuePoints,
                brandPoints: breakdown.brandPoints
            },
            created_at: new Date().toISOString()
        }]);

        return breakdown;
    } catch (error) {
        console.error("Error awarding order points:", error);
        throw error;
    }
};
