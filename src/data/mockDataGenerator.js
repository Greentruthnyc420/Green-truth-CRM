/**
 * Mock Data Generator for Onboarding Tours
 * Generates 1 year of realistic sample data for demonstrations
 */

// Brand/Product names for realistic data
const BRANDS = [
    { id: 'brand-1', name: 'Honey King', emoji: '🍯' },
    { id: 'brand-2', name: 'Bud Cracker Boulevard', emoji: '🌿' },
    { id: 'brand-3', name: 'Canna Dots', emoji: '🔴' },
    { id: 'brand-4', name: 'Space Poppers', emoji: '🚀' },
    { id: 'brand-5', name: 'Smoothie Bar', emoji: '🥤' },
    { id: 'brand-6', name: 'Waferz NY', emoji: '🧇' },
    { id: 'brand-7', name: 'Pines', emoji: '🌲' }
];

const PRODUCT_TYPES = [
    { category: 'Flower', products: ['OG Kush', 'Blue Dream', 'Gelato', 'Wedding Cake', 'Runtz'] },
    { category: 'Edibles', products: ['Gummies 10mg', 'Gummies 25mg', 'Chocolate Bar', 'Cookies'] },
    { category: 'Vapes', products: ['Disposable 1g', 'Cartridge 0.5g', 'Live Resin 1g'] },
    { category: 'Concentrates', products: ['Live Rosin', 'Diamonds', 'Shatter', 'Budder'] },
    { category: 'Pre-rolls', products: ['Single 1g', 'Pack of 5', 'Infused 1.5g'] }
];

const DISPENSARY_NAMES = [
    'Green Leaf Dispensary', 'Elevated Wellness', 'The Cannabis Corner',
    'Pure NY', 'Empire State Cannabis', 'Brooklyn Buds', 'Queens Green',
    'Harlem Heights', 'SoHo Smoke', 'Williamsburg Wellness'
];

const SALES_REP_NAMES = [
    'Alex Thompson', 'Jordan Rivera', 'Casey Martinez', 'Morgan Chen',
    'Taylor Williams', 'Sam Johnson', 'Riley Anderson', 'Jamie Park'
];

// Helper functions
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatCurrency = (amount) => parseFloat(amount.toFixed(2));

// Data generators
export function generateMockSales(count = 500) {
    const sales = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    for (let i = 0; i < count; i++) {
        const date = randomDate(oneYearAgo, now);
        const brand = randomChoice(BRANDS);
        const productType = randomChoice(PRODUCT_TYPES);
        const product = randomChoice(productType.products);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const rep = randomChoice(SALES_REP_NAMES);

        const quantity = Math.floor(Math.random() * 20) + 1;
        const basePrice = 25 + Math.random() * 100;
        const totalAmount = formatCurrency(quantity * basePrice);

        sales.push({
            id: `sale-${generateId()}`,
            date: date.toISOString(),
            createdAt: date.toISOString(),
            brandId: brand.id,
            brandName: brand.name,
            productName: `${brand.name} - ${product}`,
            category: productType.category,
            dispensaryName: dispensary,
            salesRepName: rep,
            quantity,
            unitPrice: formatCurrency(basePrice),
            totalAmount,
            commission: formatCurrency(totalAmount * 0.05),
            status: randomChoice(['Paid', 'Pending', 'Processing']),
            paymentStatus: randomChoice(['Paid', 'Unpaid', 'Partial'])
        });
    }

    return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function generateMockLeads(count = 200) {
    const leads = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    for (let i = 0; i < count; i++) {
        const date = randomDate(oneYearAgo, now);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const rep = randomChoice(SALES_REP_NAMES);

        leads.push({
            id: `lead-${generateId()}`,
            createdAt: date.toISOString(),
            dispensaryName: `${dispensary} ${Math.floor(Math.random() * 100)}`,
            address: `${Math.floor(Math.random() * 9999)} Broadway, New York, NY`,
            contactName: randomChoice(['John Smith', 'Maria Garcia', 'David Lee', 'Sarah Wilson']),
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            email: `contact@${dispensary.replace(/\s+/g, '').toLowerCase()}.com`,
            status: randomChoice(['New', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Closed Won', 'Closed Lost']),
            assignedTo: rep,
            ocLicense: `OCM-${Math.floor(Math.random() * 9000000) + 1000000}`,
            notes: randomChoice(['Interested in flower products', 'Looking for bulk pricing', 'Opening next month', 'Needs samples first'])
        });
    }

    return leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function generateMockActivations(count = 100) {
    const activations = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < count; i++) {
        const date = randomDate(oneYearAgo, threeMonthsLater);
        const brand = randomChoice(BRANDS);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const rep = randomChoice(SALES_REP_NAMES);
        const isPast = date < now;

        activations.push({
            id: `activation-${generateId()}`,
            date: date.toISOString().split('T')[0],
            createdAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            brandId: brand.id,
            brandName: brand.name,
            dispensaryName: dispensary,
            salesRepName: rep,
            startTime: randomChoice(['10:00', '11:00', '12:00', '14:00', '16:00']),
            endTime: randomChoice(['14:00', '16:00', '18:00', '20:00']),
            type: randomChoice(['Budtender Training', 'Pop-up Demo', 'Grand Opening', 'Special Event']),
            status: isPast
                ? randomChoice(['Completed', 'Completed', 'Cancelled'])
                : randomChoice(['Scheduled', 'Confirmed', 'Requested']),
            wageRate: randomChoice([25, 30, 35, 40]),
            notes: randomChoice(['Bring samples', 'Setup at 9am', 'VIP event', ''])
        });
    }

    return activations.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function generateMockOrders(count = 300) {
    const orders = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    for (let i = 0; i < count; i++) {
        const date = randomDate(oneYearAgo, now);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const brand = randomChoice(BRANDS);

        // Generate order items
        const itemCount = Math.floor(Math.random() * 5) + 1;
        const items = [];
        let orderTotal = 0;

        for (let j = 0; j < itemCount; j++) {
            const productType = randomChoice(PRODUCT_TYPES);
            const product = randomChoice(productType.products);
            const qty = Math.floor(Math.random() * 10) + 1;
            const price = formatCurrency(15 + Math.random() * 80);
            const lineTotal = formatCurrency(qty * price);
            orderTotal += lineTotal;

            items.push({
                id: `item-${generateId()}`,
                name: `${brand.name} - ${product}`,
                category: productType.category,
                quantity: qty,
                price,
                total: lineTotal
            });
        }

        orders.push({
            id: `order-${generateId()}`,
            orderNumber: `ORD-${Date.now().toString().slice(-6)}${i}`,
            createdAt: date.toISOString(),
            dispensaryName: dispensary,
            dispensaryId: `disp-${generateId()}`,
            brands: { [brand.id]: brand.name },
            items,
            subtotal: orderTotal,
            tax: formatCurrency(orderTotal * 0.0875),
            totalAmount: formatCurrency(orderTotal * 1.0875),
            status: randomChoice(['Pending Approval', 'Approved', 'Processing', 'Shipped', 'Delivered', 'Completed']),
            paymentStatus: randomChoice(['Paid', 'Unpaid', 'Partial']),
            ocLicense: `OCM-${Math.floor(Math.random() * 9000000) + 1000000}`
        });
    }

    return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function generateMockInvoices(count = 150) {
    const invoices = [];
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    for (let i = 0; i < count; i++) {
        const date = randomDate(oneYearAgo, now);
        const dispensary = randomChoice(DISPENSARY_NAMES);
        const dueDate = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);

        const amount = formatCurrency(500 + Math.random() * 5000);

        invoices.push({
            id: `inv-${generateId()}`,
            invoiceNumber: `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`,
            createdAt: date.toISOString(),
            dueDate: dueDate.toISOString(),
            dispensaryName: dispensary,
            amount,
            status: dueDate < now
                ? randomChoice(['Paid', 'Paid', 'Overdue'])
                : randomChoice(['Pending', 'Sent', 'Paid']),
            items: Math.floor(Math.random() * 10) + 1,
            ocLicense: `OCM-${Math.floor(Math.random() * 9000000) + 1000000}`
        });
    }

    return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Generate all mock data at once
export function generateAllMockData() {
    return {
        sales: generateMockSales(500),
        leads: generateMockLeads(200),
        activations: generateMockActivations(100),
        orders: generateMockOrders(300),
        invoices: generateMockInvoices(150),
        brands: BRANDS,
        dispensaries: DISPENSARY_NAMES,
        salesReps: SALES_REP_NAMES,
        generatedAt: new Date().toISOString()
    };
}

// Analytics helpers
export function calculateAnalytics(mockData) {
    const { sales, leads, activations, orders } = mockData;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Recent metrics
    const recentSales = sales.filter(s => new Date(s.date) >= thirtyDaysAgo);
    const weeklySales = sales.filter(s => new Date(s.date) >= sevenDaysAgo);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);
    const monthlyRevenue = recentSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const weeklyRevenue = weeklySales.reduce((sum, s) => sum + s.totalAmount, 0);

    const activeLeads = leads.filter(l => !['Closed Won', 'Closed Lost'].includes(l.status)).length;
    const conversionRate = leads.filter(l => l.status === 'Closed Won').length / leads.length * 100;

    const upcomingActivations = activations.filter(a =>
        new Date(a.date) >= now && a.status !== 'Cancelled'
    ).length;

    const pendingOrders = orders.filter(o => o.status === 'Pending Approval').length;

    return {
        totalRevenue: formatCurrency(totalRevenue),
        totalCommission: formatCurrency(totalCommission),
        monthlyRevenue: formatCurrency(monthlyRevenue),
        weeklyRevenue: formatCurrency(weeklyRevenue),
        totalSales: sales.length,
        totalLeads: leads.length,
        activeLeads,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        totalActivations: activations.length,
        upcomingActivations,
        totalOrders: orders.length,
        pendingOrders
    };
}

export default generateAllMockData;
