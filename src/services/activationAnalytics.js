import { supabase } from './supabaseClient';
import { differenceInDays, subDays, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

/**
 * Activation ROI Engine
 * Calculates the 'sales lift' and revenue impact of store activations (pop-ups, etc.)
 */

export async function calculate_activation_lift(activationId) {
    try {
        // 1. Get Activation Details
        const { data: activation, error: actError } = await supabase
            .from('activations')
            .select('*')
            .eq('activation_id', activationId)
            .single();

        if (actError || !activation) throw new Error("Activation not found");

        const { brand_id, dispensary_id, date_of_activation } = activation;
        const activationDate = new Date(date_of_activation);

        // 2. Define Intervals (30 days pre and 30 days post)
        const preStart = subDays(activationDate, 30);
        const preEnd = subDays(activationDate, 1);
        const postStart = addDays(activationDate, 1);
        const postEnd = addDays(activationDate, 30);

        // 3. Fetch Sales for this Brand @ this Dispensary
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('*')
            .eq('dispensary_name', (await getDispensaryName(dispensary_id))); // Need to resolve dispensary name

        if (salesError) throw salesError;

        // Filter sales for the specific brand and time periods
        const brandSales = sales.filter(s =>
            s.items?.some(item => item.brandId === brand_id)
        );

        const preSales = brandSales.filter(s => {
            const saleDate = new Date(s.created_at);
            return isWithinInterval(saleDate, { start: startOfDay(preStart), end: endOfDay(preEnd) });
        });

        const postSales = brandSales.filter(s => {
            const saleDate = new Date(s.created_at);
            return isWithinInterval(saleDate, { start: startOfDay(postStart), end: endOfDay(postEnd) });
        });

        // 4. Calculate Baselines
        const preTotal = preSales.reduce((sum, s) => sum + extractBrandAmount(s, brand_id), 0);
        const postTotal = postSales.reduce((sum, s) => sum + extractBrandAmount(s, brand_id), 0);

        const baselineDaily = preTotal / 30;
        const postDaily = postTotal / 30;

        // 5. Calculate Lift
        let lift = 0;
        if (baselineDaily > 0) {
            lift = ((postDaily - baselineDaily) / baselineDaily) * 100;
        } else if (postDaily > 0) {
            lift = 100; // 100% lift if previously 0
        }

        return {
            activationId,
            baselineRevenue: preTotal,
            impactRevenue: postTotal,
            liftPercentage: Math.round(lift * 100) / 100,
            attributedRevenue: postTotal - preTotal > 0 ? postTotal - preTotal : 0,
            totalPostActivationRevenue: postTotal,
            period: '30 Days'
        };

    } catch (error) {
        console.error("ROI calculation failed:", error);
        return null;
    }
}

// Helper to get dispensary name from ID (using leads table)
async function getDispensaryName(dispensaryId) {
    if (!dispensaryId) return null;
    const { data } = await supabase.from('leads').select('dispensary_name').eq('id', dispensaryId).single();
    return data?.dispensary_name;
}

// Helper to extract amount for a specific brand from a sale
function extractBrandAmount(sale, brandId) {
    if (!sale.items) return 0;
    return sale.items
        .filter(item => item.brandId === brandId)
        .reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity) || 0), 0);
}
