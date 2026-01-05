import { getSales as getAllSales, getAllShifts } from './firestoreService';

/**
 * Calculate brand-specific financial metrics
 * @param {string} brandId - The brand's unique ID
 * @param {string} brandName - The brand's display name
 * @returns {Promise<Object>} Financial metrics including revenue, commission, activation costs, orders
 */
export async function calculateBrandMetrics(brandId, brandName) {
    try {
        const [allSales, allShifts] = await Promise.all([
            getAllSales(),
            getAllShifts()
        ]);

        // 1. Calculate Revenue & 5% Commission
        let totalRevenue = 0;
        let pendingCount = 0;
        let pendingRevenue = 0;
        let totalOrders = 0;
        const productSalesMap = {};

        allSales.forEach(sale => {
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];

            if (brandItems.length > 0) {
                const saleRevenue = brandItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                totalRevenue += saleRevenue;
                totalOrders++;

                if (sale.status === 'pending') {
                    pendingCount++;
                    pendingRevenue += saleRevenue;
                }

                // Track product sales
                brandItems.forEach(item => {
                    productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
                });
            }
        });

        // Calculate Top Selling Product
        let topProduct = 'N/A';
        let maxSold = 0;
        Object.entries(productSalesMap).forEach(([name, qty]) => {
            if (qty > maxSold) {
                maxSold = qty;
                topProduct = name;
            }
        });

        // Calculate AOV
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const commissionOwed = totalRevenue * 0.05;

        // Pricing Sheet Configuration
        const PRICING_TIERS = {
            'NYC': { 2: 120, 3: 160, 4: 200, 5: 240 },
            'LI': { 2: 140, 3: 180, 4: 220, 5: 260 },
            'UPSTATE': { 2: 160, 3: 200, 4: 240, 5: 280 }
        };

        const calculateAgencyShiftCost = (shift) => {
            const duration = Math.max(2, Math.round(parseFloat(shift.hoursWorked) || 0));
            const regionRaw = (shift.region || 'NYC').toUpperCase();

            // Normalize region
            let region = 'NYC';
            if (regionRaw.includes('LI') || regionRaw.includes('DOWNSTATE') || regionRaw.includes('WESTCHESTER')) region = 'LI';
            if (regionRaw.includes('UPSTATE')) region = 'UPSTATE';

            const tiers = PRICING_TIERS[region] || PRICING_TIERS['NYC'];

            // Base Fee Calculation
            let baseFee = 0;
            if (duration <= 2) baseFee = tiers[2];
            else if (duration <= 3) baseFee = tiers[3];
            else if (duration <= 4) baseFee = tiers[4];
            else if (duration <= 5) baseFee = tiers[5];
            else {
                const extraHours = duration - 5;
                baseFee = tiers[5] + (extraHours * 40);
            }

            // Agency Mileage Rate: $0.70/mile
            const mileageCost = (parseFloat(shift.milesTraveled) || 0) * 0.70;

            // Tolls (At Cost)
            const tollsCost = parseFloat(shift.tollAmount) || 0;

            return baseFee + mileageCost + tollsCost;
        };

        // 2. Calculate Activation Costs with Agency Pricing
        let totalActivationCost = 0;

        allShifts.forEach(shift => {
            if (shift.brand === brandName || (shift.brand && shift.brand.includes(brandName))) {
                if (shift.status !== 'paid') {
                    totalActivationCost += calculateAgencyShiftCost(shift);
                }
            }
        });

        return {
            revenue: totalRevenue,
            commissionOwed: commissionOwed,
            activationCosts: totalActivationCost,
            orderCount: totalOrders,
            pendingOrders: pendingCount,
            topProduct: topProduct,
            aov: aov,
            outstandingInvoices: pendingRevenue
        };

    } catch (error) {
        console.error(`Failed to calculate metrics for brand ${brandName}`, error);
        return {
            revenue: 0,
            commissionOwed: 0,
            activationCosts: 0,
            orderCount: 0,
            pendingOrders: 0,
            topProduct: 'N/A',
            aov: 0,
            outstandingInvoices: 0
        };
    }
}
