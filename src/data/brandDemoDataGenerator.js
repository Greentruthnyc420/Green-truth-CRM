/**
 * Brand-Specific Demo Data Generator for Onboarding Tours
 * Generates impressive demo data using REAL products from the catalog
 * This data is ONLY shown during the mandatory first-time tour
 */

import { PRODUCT_CATALOG } from './productCatalog';

// NYC Dispensary names for realistic data
const DISPENSARY_NAMES = [
    'The Cannabis Place - Manhattan', 'Green Leaf NYC', 'Empire State Dispensary',
    'Brooklyn Buds', 'Queens Green', 'Harlem Heights Cannabis', 'SoHo Smoke Shop',
    'Williamsburg Wellness', 'Astoria Green', 'Bronx Botanical', 'Chelsea Chillz',
    'East Village Elevated', 'Midtown Meds', 'Union Square Greens', 'Financial District Flowers'
];

const SALES_REP_NAMES = [
    'Alex Thompson', 'Jordan Rivera', 'Casey Martinez', 'Morgan Chen',
    'Taylor Williams', 'Sam Johnson', 'Riley Anderson', 'Jamie Park'
];

// Helper functions
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (amount) => parseFloat(amount.toFixed(2));

/**
 * Generate demo sales data for a specific brand
 * Uses real products from their catalog
 */
function generateBrandSales(brandId, targetRevenue = 150000) {
    const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
    if (!brand || !brand.products || brand.products.length === 0) {
        return [];
    }

    const sales = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    let totalRevenue = 0;
    let saleId = 0;

    // Generate sales until we hit target revenue
    while (totalRevenue < targetRevenue) {
        const date = randomDate(oneYearAgo, now);
        const product = randomChoice(brand.products);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const rep = randomChoice(SALES_REP_NAMES);

        // Calculate quantity based on case size
        const casesOrdered = Math.floor(Math.random() * 3) + 1;
        const quantity = casesOrdered * (product.caseSize || 10);
        const totalAmount = formatCurrency(quantity * product.price);

        if (totalRevenue + totalAmount > targetRevenue * 1.1) break;

        totalRevenue += totalAmount;
        saleId++;

        sales.push({
            id: `demo-sale-${saleId}`,
            date: date.toISOString(),
            createdAt: date.toISOString(),
            brandId: brand.id,
            brandName: brand.name,
            productId: product.id,
            productName: product.name,
            category: product.category,
            dispensaryName: dispensary,
            salesRepName: rep,
            quantity,
            unitPrice: product.price,
            totalAmount,
            commission: formatCurrency(totalAmount * 0.05),
            status: randomChoice(['Paid', 'Paid', 'Paid', 'Pending']),
            thc: product.thc || '',
            strainType: product.strainType || 'Hybrid'
        });
    }

    return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Generate demo orders for a specific brand
 */
function generateBrandOrders(brandId, count = 80) {
    const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
    if (!brand || !brand.products || brand.products.length === 0) {
        return [];
    }

    const orders = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    for (let i = 0; i < count; i++) {
        const date = randomDate(oneYearAgo, now);
        const dispensary = randomChoice(DISPENSARY_NAMES);

        // Generate order items using real products
        const itemCount = Math.floor(Math.random() * 4) + 1;
        const items = [];
        let orderTotal = 0;

        for (let j = 0; j < itemCount; j++) {
            const product = randomChoice(brand.products);
            const cases = Math.floor(Math.random() * 3) + 1;
            const qty = cases * (product.caseSize || 10);
            const lineTotal = formatCurrency(qty * product.price);
            orderTotal += lineTotal;

            items.push({
                id: `item-${generateId()}`,
                productId: product.id,
                name: product.name,
                category: product.category,
                quantity: qty,
                price: product.price,
                total: lineTotal
            });
        }

        orders.push({
            id: `demo-order-${generateId()}`,
            orderNumber: `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
            createdAt: date.toISOString(),
            dispensaryName: dispensary,
            dispensaryId: `disp-${generateId()}`,
            brandId: brand.id,
            brandName: brand.name,
            items,
            subtotal: orderTotal,
            tax: formatCurrency(orderTotal * 0.0875),
            totalAmount: formatCurrency(orderTotal * 1.0875),
            status: randomChoice(['Completed', 'Completed', 'Delivered', 'Shipped', 'Pending Approval']),
            paymentStatus: randomChoice(['Paid', 'Paid', 'Paid', 'Unpaid']),
            ocLicense: `OCM-${Math.floor(Math.random() * 9000000) + 1000000}`
        });
    }

    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Generate demo activations for a specific brand
 */
function generateBrandActivations(brandId, count = 30) {
    const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
    if (!brand) return [];

    const activations = [];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < count; i++) {
        const date = randomDate(sixMonthsAgo, threeMonthsLater);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const rep = randomChoice(SALES_REP_NAMES);
        const isPast = date < now;

        activations.push({
            id: `demo-activation-${generateId()}`,
            date: date.toISOString().split('T')[0],
            createdAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            brandId: brand.id,
            brandName: brand.name,
            dispensaryName: dispensary,
            repName: rep,
            startTime: randomChoice(['10:00', '11:00', '12:00', '14:00']),
            endTime: randomChoice(['14:00', '16:00', '18:00']),
            type: randomChoice(['Pop-up Demo', 'Budtender Training', 'Grand Opening', 'Weekend Event']),
            status: isPast
                ? randomChoice(['Completed', 'Completed', 'Completed'])
                : randomChoice(['Scheduled', 'Confirmed']),
            wageRate: randomChoice([25, 30, 35]),
            notes: ''
        });
    }

    return activations.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Generate demo leads for a specific brand
 */
function generateBrandLeads(brandId, count = 40) {
    const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
    if (!brand) return [];

    const leads = [];
    const statuses = ['prospect', 'samples_requested', 'samples_delivered', 'active', 'active', 'active'];

    for (let i = 0; i < count; i++) {
        const dispensary = `${randomChoice(DISPENSARY_NAMES)} #${Math.floor(Math.random() * 50) + 1}`;
        const status = randomChoice(statuses);

        leads.push({
            id: `demo-lead-${generateId()}`,
            dispensaryName: dispensary,
            brandId: brand.id,
            brandName: brand.name,
            leadStatus: status,
            contacts: [{
                name: randomChoice(['John Smith', 'Maria Garcia', 'David Lee', 'Sarah Wilson', 'Mike Chen']),
                role: randomChoice(['Buyer', 'Manager', 'Owner'])
            }],
            address: `${Math.floor(Math.random() * 999) + 1} Broadway, New York, NY`,
            ocLicense: `OCM-${Math.floor(Math.random() * 9000000) + 1000000}`,
            createdAt: randomDate(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), new Date()).toISOString()
        });
    }

    return leads;
}

/**
 * Generate monthly sales history for charts
 */
function generateMonthlySalesHistory(sales) {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        monthlyData[key] = 0;
    }

    // Sum up sales by month
    sales.forEach(sale => {
        const date = new Date(sale.date);
        const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyData[key] !== undefined) {
            monthlyData[key] += sale.totalAmount;
        }
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
        month: month.split(' ')[0], // Just the month name
        revenue: formatCurrency(revenue)
    }));
}

/**
 * Generate product mix for pie chart
 */
function generateProductMix(sales) {
    const productCounts = {};
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

    sales.forEach(sale => {
        const category = sale.category || 'Other';
        productCounts[category] = (productCounts[category] || 0) + sale.quantity;
    });

    return Object.entries(productCounts).map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
    }));
}

/**
 * Calculate demo analytics from generated data
 */
function calculateDemoAnalytics(sales, orders, leads, activations) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Revenue calculations
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const thisMonthSales = sales.filter(s => new Date(s.date) >= thirtyDaysAgo);
    const lastMonthSales = sales.filter(s => {
        const d = new Date(s.date);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthOverMonthGrowth = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 15;

    // Order metrics
    const uniqueDispensaries = new Set(orders.map(o => o.dispensaryName)).size;
    const totalUnits = sales.reduce((sum, s) => sum + s.quantity, 0);

    // Reorder rate (dispensaries that ordered more than once)
    const dispensaryOrderCounts = {};
    orders.forEach(o => {
        dispensaryOrderCounts[o.dispensaryName] = (dispensaryOrderCounts[o.dispensaryName] || 0) + 1;
    });
    const repeatCustomers = Object.values(dispensaryOrderCounts).filter(c => c > 1).length;
    const reorderRate = uniqueDispensaries > 0 ? (repeatCustomers / uniqueDispensaries) * 100 : 65;

    // Top products
    const productSales = {};
    sales.forEach(s => {
        productSales[s.productName] = (productSales[s.productName] || 0) + s.quantity;
    });
    const topProducts = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value], idx) => ({
            rank: idx + 1,
            name,
            value,
            color: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6'][idx]
        }));

    // Upcoming activations
    const upcomingActivations = activations.filter(a => new Date(a.date) >= now && a.status !== 'Cancelled');

    // Outstanding invoices (simulated as 15% of revenue)
    const outstandingInvoices = formatCurrency(totalRevenue * 0.15);

    // Commission owed (5% of revenue)
    const commissionOwed = formatCurrency(totalRevenue * 0.05);

    // Activation costs (based on completed activations)
    const completedActivations = activations.filter(a => a.status === 'Completed');
    const activationCosts = formatCurrency(completedActivations.length * 4 * 30); // 4hrs avg at $30/hr

    return {
        revenue: formatCurrency(totalRevenue),
        orderCount: orders.length,
        pendingOrders: orders.filter(o => o.status === 'Pending Approval').length,
        aov: orders.length > 0 ? formatCurrency(totalRevenue / orders.length) : 0,
        storeReach: uniqueDispensaries,
        reorderRate: formatCurrency(reorderRate),
        unitsSold: totalUnits,
        monthOverMonthGrowth: formatCurrency(monthOverMonthGrowth),
        outstandingInvoices,
        commissionOwed,
        activationCosts,
        topProduct: topProducts[0]?.name || 'N/A',
        top10Products: topProducts,
        salesHistory: generateMonthlySalesHistory(sales),
        productMix: generateProductMix(sales),
        upcomingActivationsCount: upcomingActivations.length
    };
}

/**
 * MAIN EXPORT: Generate all demo data for a specific brand
 * This returns data in the same format expected by BrandDashboard
 */
export function generateBrandDemoData(brandId) {
    // Target revenues by brand (to make numbers impressive)
    const brandTargets = {
        'honey-king': 180000,
        'bud-cracker': 150000,
        'canna-dots': 120000,
        'space-poppers': 140000,
        'smoothie-bar': 130000,
        'waferz': 100000,
        'pines': 160000,
        'jusbud': 90000,
        'flx-extracts': 390000 // Combined
    };

    const targetRevenue = brandTargets[brandId] || 150000;

    const sales = generateBrandSales(brandId, targetRevenue);
    const orders = generateBrandOrders(brandId, Math.floor(targetRevenue / 2000));
    const activations = generateBrandActivations(brandId, 30);
    const leads = generateBrandLeads(brandId, 40);
    const analytics = calculateDemoAnalytics(sales, orders, leads, activations);

    return {
        financials: analytics,
        brandLeads: leads,
        upcomingActivations: activations.filter(a => new Date(a.date) >= new Date()).slice(0, 10),
        sales,
        orders,
        allActivations: activations,
        isDemoData: true
    };
}

/**
 * Generate combined demo data for FLX Extracts (processor)
 * Combines data from Pines, Smoothie Bar, and Waferz
 * Returns data in format expected by FLXProcessorDashboard
 */
export function generateProcessorDemoData() {
    const subBrands = ['pines', 'smoothie-bar', 'waferz'];

    // Use same property names as FLXProcessorDashboard expects
    const combinedData = {
        financials: {
            totalRevenue: 0,
            totalOrders: 0,
            totalCommission: 0,
            totalActivationCost: 0,
            pendingOrders: 0,
            avgOrderValue: 0,
            profitMargin: 85,
            revenueByBrand: [],
            ordersByBrand: [],
            salesHistory: [],
            topProducts: [],
            bestBrand: null,
            categoryBreakdown: [],
            storeReach: 0,
            reorderRate: 72,
            unitsSold: 0,
            monthOverMonthGrowth: 18
        },
        brandLeads: [],
        upcomingActivations: [],
        brandBreakdown: {},
        isDemoData: true
    };

    const allSalesHistories = [];
    let bestBrandData = null;
    let bestRevenue = 0;

    subBrands.forEach(brandId => {
        const brandData = generateBrandDemoData(brandId);
        const brand = PRODUCT_CATALOG.find(b => b.id === brandId);
        const brandColor = { 'pines': '#10b981', 'smoothie-bar': '#3b82f6', 'waferz': '#f59e0b' }[brandId];

        // Aggregate financials
        combinedData.financials.totalRevenue += brandData.financials.revenue;
        combinedData.financials.totalOrders += brandData.financials.orderCount;
        combinedData.financials.totalCommission += brandData.financials.commissionOwed;
        combinedData.financials.totalActivationCost += brandData.financials.activationCosts;
        combinedData.financials.pendingOrders += brandData.financials.pendingOrders;
        combinedData.financials.unitsSold += brandData.financials.unitsSold;

        // Track best brand
        if (brandData.financials.revenue > bestRevenue) {
            bestRevenue = brandData.financials.revenue;
            bestBrandData = { name: brand?.name || brandId, metrics: { revenue: brandData.financials.revenue } };
        }

        // Revenue by brand (for pie chart)
        combinedData.financials.revenueByBrand.push({
            name: brand?.name || brandId,
            value: brandData.financials.revenue,
            color: brandColor
        });

        // Orders by brand (for bar chart)
        combinedData.financials.ordersByBrand.push({
            name: brand?.name || brandId,
            orders: brandData.financials.orderCount,
            revenue: brandData.financials.revenue,
            color: brandColor
        });

        // Combine leads and activations
        combinedData.brandLeads.push(...brandData.brandLeads);
        combinedData.upcomingActivations.push(...brandData.upcomingActivations);

        // Store brand breakdown (for byBrand object)
        combinedData.brandBreakdown[brandId] = {
            id: brandId,
            name: brand?.name || brandId,
            color: brandColor,
            metrics: {
                revenue: brandData.financials.revenue,
                orderCount: brandData.financials.orderCount,
                commissionOwed: brandData.financials.commissionOwed,
                activationCosts: brandData.financials.activationCosts,
                pendingOrders: brandData.financials.pendingOrders,
                storeReach: brandData.financials.storeReach,
                reorderRate: brandData.financials.reorderRate,
                unitsSold: brandData.financials.unitsSold,
                monthOverMonthGrowth: brandData.financials.monthOverMonthGrowth,
                salesHistory: brandData.financials.salesHistory,
                productMix: brandData.financials.productMix,
                topProduct: brandData.financials.topProduct
            }
        };

        allSalesHistories.push(brandData.financials.salesHistory);

        // Add top products with brand info
        brandData.financials.top10Products.forEach(p => {
            combinedData.financials.topProducts.push({
                ...p,
                brand: brand?.name || brandId,
                brandColor
            });
        });
    });

    // Calculate derived values
    combinedData.financials.avgOrderValue = combinedData.financials.totalOrders > 0
        ? combinedData.financials.totalRevenue / combinedData.financials.totalOrders
        : 0;
    combinedData.financials.profitMargin = combinedData.financials.totalRevenue > 0
        ? ((combinedData.financials.totalRevenue - combinedData.financials.totalActivationCost) / combinedData.financials.totalRevenue * 100)
        : 85;
    combinedData.financials.bestBrand = bestBrandData;

    // Calculate unique store reach
    const uniqueStores = new Set(combinedData.brandLeads.filter(l => l.leadStatus === 'active').map(l => l.dispensaryName));
    combinedData.financials.storeReach = uniqueStores.size || 45;

    // Combine sales histories (stacked)
    if (allSalesHistories.length > 0 && allSalesHistories[0].length > 0) {
        combinedData.financials.salesHistory = allSalesHistories[0].map((month, idx) => ({
            month: month.month,
            pines: allSalesHistories[0][idx]?.revenue || 0,
            'smoothie-bar': allSalesHistories[1]?.[idx]?.revenue || 0,
            waferz: allSalesHistories[2]?.[idx]?.revenue || 0,
            total: allSalesHistories.reduce((sum, history) => sum + (history[idx]?.revenue || 0), 0)
        }));
    }

    // Category breakdown
    combinedData.financials.categoryBreakdown = [
        { name: 'Vape', value: 35, color: '#10b981' },
        { name: 'Flower', value: 25, color: '#3b82f6' },
        { name: 'Concentrate', value: 20, color: '#f59e0b' },
        { name: 'Pre-Roll', value: 15, color: '#8b5cf6' },
        { name: 'Other', value: 5, color: '#06b6d4' }
    ];

    // Sort and limit top products
    combinedData.financials.topProducts = combinedData.financials.topProducts
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Limit activations
    combinedData.upcomingActivations = combinedData.upcomingActivations.slice(0, 15);

    return combinedData;
}

export default generateBrandDemoData;
