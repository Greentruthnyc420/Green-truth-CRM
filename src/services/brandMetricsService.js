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
            // Check nested items for brandId match
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            // Fallback: check top-level brandId or brandName
            const matchesTopLevel = sale.brandId === brandId || sale.brandName === brandName;

            if (brandItems.length > 0 || matchesTopLevel) {
                // Calculate revenue - prefer nested items, fallback to sale.amount
                const saleRevenue = brandItems.length > 0
                    ? brandItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                    : parseFloat(sale.amount) || 0;
                totalRevenue += saleRevenue;
                totalOrders++;

                if (sale.status === 'pending') {
                    pendingCount++;
                    pendingRevenue += saleRevenue;
                }

                // Track product sales from items
                brandItems.forEach(item => {
                    productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
                });
            }
        });

        // Calculate Top Selling Product & Product Mix
        let topProduct = 'N/A';
        let maxSold = 0;
        const productMixArray = [];

        // Colors for Pie Chart
        const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

        Object.entries(productSalesMap).forEach(([name, qty]) => {
            if (qty > maxSold) {
                maxSold = qty;
                topProduct = name;
            }
            productMixArray.push({ name, value: qty });
        });

        // Sort and limit Product Mix
        const productMix = productMixArray
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5
            .map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));


        // 4. Calculate Sales History (Monthly)
        const salesHistoryMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        allSales.forEach(sale => {
            const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
            const monthName = months[saleDate.getMonth()];

            // Only count if it involves this brand
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            if (brandItems.length > 0) {
                const saleRevenue = brandItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                salesHistoryMap[monthName] = (salesHistoryMap[monthName] || 0) + saleRevenue;
            }
        });

        // Convert to array in chronological order (handling mostly current year for now or just rolling 12 months)
        // For simplicity in this mock/early version, we just map recent months or all months found.
        // Better: Pre-fill last 6 months to ensure chart continuity
        const salesHistory = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mName = months[d.getMonth()];
            salesHistory.push({
                month: mName,
                revenue: salesHistoryMap[mName] || 0
            });
        }

        // 2. Calculate Activation Costs (Filtered by Brand)
        const { calculateAgencyShiftCost } = await import('../utils/pricing');

        const brandShifts = allShifts.filter(s =>
            s.brands?.includes(brandName) ||
            s.brandId === brandId ||
            (s.dispensaryName && allSales.some(sale => sale.dispensaryName === s.dispensaryName && sale.items?.some(i => i.brandId === brandId)))
        );

        const totalActivationCost = brandShifts.reduce((sum, shift) => sum + calculateAgencyShiftCost(shift), 0);

        // 3. Final metrics
        const commissionOwed = totalRevenue * 0.05;
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // === NEW PERFORMANCE METRICS ===

        // Store Reach - unique dispensaries this brand has sold at
        const uniqueDispensaries = new Set();
        allSales.forEach(sale => {
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            const matchesTopLevel = sale.brandId === brandId || sale.brandName === brandName;
            if ((brandItems.length > 0 || matchesTopLevel) && sale.dispensaryName) {
                uniqueDispensaries.add(sale.dispensaryName);
            }
        });
        const storeReach = uniqueDispensaries.size;

        // Reorder Rate - % of dispensaries that ordered more than once
        const dispensaryOrderCount = {};
        allSales.forEach(sale => {
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            const matchesTopLevel = sale.brandId === brandId || sale.brandName === brandName;
            if ((brandItems.length > 0 || matchesTopLevel) && sale.dispensaryName) {
                dispensaryOrderCount[sale.dispensaryName] = (dispensaryOrderCount[sale.dispensaryName] || 0) + 1;
            }
        });
        const totalDispensaries = Object.keys(dispensaryOrderCount).length;
        const repeatDispensaries = Object.values(dispensaryOrderCount).filter(count => count > 1).length;
        const reorderRate = totalDispensaries > 0 ? (repeatDispensaries / totalDispensaries) * 100 : 0;

        // Units Sold - total product quantity
        let unitsSold = 0;
        allSales.forEach(sale => {
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            brandItems.forEach(item => {
                unitsSold += item.quantity || 0;
            });
        });

        // Month-over-Month Growth
        const currentMonthRevenue = salesHistory.length > 0 ? salesHistory[salesHistory.length - 1].revenue : 0;
        const lastMonthRevenue = salesHistory.length > 1 ? salesHistory[salesHistory.length - 2].revenue : 0;
        const monthOverMonthGrowth = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : (currentMonthRevenue > 0 ? 100 : 0);

        return {
            revenue: totalRevenue,
            commissionOwed: commissionOwed,
            activationCosts: totalActivationCost,
            orderCount: totalOrders,
            pendingOrders: pendingCount,
            topProduct: topProduct,
            aov: aov,
            outstandingInvoices: pendingRevenue,
            salesHistory,
            productMix,
            // New performance metrics
            storeReach,
            reorderRate,
            unitsSold,
            monthOverMonthGrowth
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
            outstandingInvoices: 0,
            salesHistory: [],
            productMix: [],
            storeReach: 0,
            reorderRate: 0,
            unitsSold: 0,
            monthOverMonthGrowth: 0
        };
    }
}
