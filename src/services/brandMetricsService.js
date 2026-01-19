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

        // 1. Calculate Revenue & 5% Commission (only on collected revenue)
        let totalRevenue = 0;
        let collectedRevenue = 0; // Only collected/paid sales count towards commission
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

                // Track collected revenue (sales with status 'collected' or 'paid')
                if (sale.status === 'collected' || sale.status === 'paid') {
                    collectedRevenue += saleRevenue;
                }

                if (sale.status === 'pending' || !sale.status) {
                    pendingCount++;
                    pendingRevenue += saleRevenue;
                }

                // Track product sales from items
                if (brandItems.length > 0) {
                    brandItems.forEach(item => {
                        // Ensure we have a valid product name (fallback to productName, brandName, or Unknown)
                        const productName = item.name || item.productName || item.brandName || brandName || 'Unknown Product';
                        const qty = item.quantity || 1;
                        productSalesMap[productName] = (productSalesMap[productName] || 0) + qty;
                    });
                } else if (matchesTopLevel) {
                    // Fallback: use productName, productId, or brandName for legacy sales without items[]
                    const productKey = sale.productName || sale.productId || sale.brandName || 'Unknown Product';
                    const qty = sale.quantity || 1;
                    productSalesMap[productKey] = (productSalesMap[productKey] || 0) + qty;
                }
            }
        });

        // Calculate Top Selling Product & Product Mix
        let topProduct = 'N/A';
        let maxSold = 0;
        const productMixArray = [];

        // Colors for Pie Chart
        const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16'];

        // Helper to clean product names (remove brand name and product type prefixes)
        const cleanProductName = (name, brand) => {
            if (!name || name === 'Unknown Product') return name;
            let cleaned = name;

            // Helper to strip emojis and trim
            const stripEmoji = (str) => str?.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim() || str;

            // Remove brand name prefix (e.g., "Honey King 1g Pre-Roll" -> "1g Pre-Roll")
            // Also try without emojis since product names may not include brand emoji
            const brandPatterns = [brand, brandName, stripEmoji(brand), stripEmoji(brandName)].filter(Boolean);
            for (const pattern of brandPatterns) {
                if (pattern && cleaned.toLowerCase().startsWith(pattern.toLowerCase())) {
                    cleaned = cleaned.slice(pattern.length).trim();
                    cleaned = cleaned.replace(/^[-:]+\s*/, '');
                    break;
                }
            }


            // Remove common product type prefixes (legacy data cleanup)
            const productTypePrefixes = [
                'Indoor Flower - ', 'Outdoor Flower - ', 'Greenhouse Flower - ',
                'Infused Pre-Roll - ', 'Diamond Pre-Roll - ', 'Live Resin Minis - ',
                '2G Royal Palm - ', '1.1G Oil - ', '1.1G Sweet - ',
                '1G Oil - ', '2G Oil - '
            ];
            for (const prefix of productTypePrefixes) {
                if (cleaned.startsWith(prefix)) {
                    cleaned = cleaned.slice(prefix.length);
                    break;
                }
                // Also check case-insensitive
                if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
                    cleaned = cleaned.slice(prefix.length);
                    break;
                }
            }

            return cleaned || name;
        };

        Object.entries(productSalesMap).forEach(([name, qty]) => {
            if (qty > maxSold) {
                maxSold = qty;
                topProduct = cleanProductName(name, brandName);
            }
            productMixArray.push({ name: cleanProductName(name, brandName), fullName: name, value: qty });
        });

        // Sort all products by sales volume
        const sortedProducts = productMixArray.sort((a, b) => b.value - a.value);

        // Top 10 for the modal
        const top10Products = sortedProducts.slice(0, 10).map((item, index) => ({
            ...item,
            color: COLORS[index % COLORS.length],
            rank: index + 1
        }));

        // Top 5 for Product Mix pie chart
        const productMix = sortedProducts
            .slice(0, 5)
            .map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));


        // 4. Calculate Sales History (Monthly)
        const salesHistoryMap = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        allSales.forEach(sale => {
            const saleDate = sale.date?.toDate ? sale.date.toDate() : new Date(sale.date);
            const monthName = months[saleDate.getMonth()];

            // Only count if it involves this brand
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            const matchesTopLevel = sale.brandId === brandId || sale.brandName === brandName;

            if (brandItems.length > 0) {
                const saleRevenue = brandItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                salesHistoryMap[monthName] = (salesHistoryMap[monthName] || 0) + saleRevenue;
            } else if (matchesTopLevel) {
                // Fallback: include top-level sales without items[] in sales history
                const saleRevenue = parseFloat(sale.amount) || 0;
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

        // 3. Final metrics - Commission is only owed on COLLECTED revenue
        const commissionOwed = collectedRevenue * 0.05;
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

        // Units Sold - total product quantity (accounting for case sizes)
        // Import product catalog to look up case sizes
        const { PRODUCT_CATALOG } = await import('../data/productCatalog');

        // Build a map of product ID to case size for quick lookup
        const caseSizeMap = {};
        PRODUCT_CATALOG.forEach(brand => {
            (brand.products || []).forEach(product => {
                caseSizeMap[product.id] = product.caseSize || 1;
                // Also map by name for fallback matching
                caseSizeMap[product.name] = product.caseSize || 1;
            });
        });

        let unitsSold = 0;
        allSales.forEach(sale => {
            const brandItems = sale.items?.filter(item => item.brandId === brandId) || [];
            const matchesTopLevel = sale.brandId === brandId || sale.brandName === brandName;

            if (brandItems.length > 0) {
                // Count from nested items - multiply quantity by caseSize
                brandItems.forEach(item => {
                    const qty = item.quantity || 1;
                    // Use caseSize from item if available, otherwise look up from catalog
                    const caseSize = item.caseSize || caseSizeMap[item.productId] || caseSizeMap[item.name] || 1;
                    unitsSold += qty * caseSize;
                });
            } else if (matchesTopLevel) {
                // Top-level sale without items array
                const qty = sale.quantity || 1;
                const caseSize = sale.caseSize || caseSizeMap[sale.productId] || caseSizeMap[sale.productName] || 1;
                unitsSold += qty * caseSize;
            }
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
            top10Products: top10Products,
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
            top10Products: [],
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
