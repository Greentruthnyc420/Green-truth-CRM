/**
 * Demo Data for Tour Mode
 * Comprehensive mock data showing 12 months of impressive sales activity
 * Used to populate dashboards during onboarding tours
 */

// Realistic date ranges for the past 12 months
const getMonthsAgo = (months) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date;
};

// ===== SALES DATA (12 months, $1.2M+ total) =====
export const demoSalesData = {
    monthly: [
        { month: 'Feb 2025', revenue: 68500, orders: 142, avgOrder: 482 },
        { month: 'Mar 2025', revenue: 82300, orders: 168, avgOrder: 490 },
        { month: 'Apr 2025', revenue: 95200, orders: 189, avgOrder: 504 },
        { month: 'May 2025', revenue: 109400, orders: 215, avgOrder: 509 },
        { month: 'Jun 2025', revenue: 118700, orders: 234, avgOrder: 507 },
        { month: 'Jul 2025', revenue: 125300, orders: 251, avgOrder: 499 },
        { month: 'Aug 2025', revenue: 132800, orders: 268, avgOrder: 495 },
        { month: 'Sep 2025', revenue: 119500, orders: 241, avgOrder: 496 },
        { month: 'Oct 2025', revenue: 128900, orders: 262, avgOrder: 492 },
        { month: 'Nov 2025', revenue: 145200, orders: 298, avgOrder: 487 },
        { month: 'Dec 2025', revenue: 162400, orders: 335, avgOrder: 485 },
        { month: 'Jan 2026', revenue: 148700, orders: 306, avgOrder: 486 }
    ],
    totals: {
        revenue: 1436900,
        orders: 2909,
        avgOrder: 494,
        growth: 117 // percentage growth year over year
    }
};

// ===== SALES REP PERFORMANCE =====
export const demoSalesReps = [
    {
        id: 'rep-1',
        name: 'Marcus Johnson',
        avatar: null,
        role: 'Senior Ambassador',
        totalSales: 287500,
        commissionsEarned: 14375,
        hoursWorked: 486,
        leadsConverted: 89,
        conversionRate: 42,
        activationsCompleted: 124,
        pendingPayout: 2875,
        status: 'active'
    },
    {
        id: 'rep-2',
        name: 'Sarah Chen',
        avatar: null,
        role: 'Ambassador',
        totalSales: 234200,
        commissionsEarned: 11710,
        hoursWorked: 412,
        leadsConverted: 72,
        conversionRate: 38,
        activationsCompleted: 98,
        pendingPayout: 1856,
        status: 'active'
    },
    {
        id: 'rep-3',
        name: 'David Williams',
        avatar: null,
        role: 'Ambassador',
        totalSales: 198700,
        commissionsEarned: 9935,
        hoursWorked: 378,
        leadsConverted: 61,
        conversionRate: 35,
        activationsCompleted: 82,
        pendingPayout: 1245,
        status: 'active'
    },
    {
        id: 'rep-4',
        name: 'Emma Rodriguez',
        avatar: null,
        role: 'Junior Ambassador',
        totalSales: 156400,
        commissionsEarned: 7820,
        hoursWorked: 298,
        leadsConverted: 48,
        conversionRate: 32,
        activationsCompleted: 64,
        pendingPayout: 985,
        status: 'active'
    }
];

// ===== BRAND PARTNERS =====
export const demoBrands = [
    {
        id: 'brand-1',
        name: 'Pacific Greens',
        logo: null,
        storesReached: 142,
        totalRevenue: 425600,
        pendingOrders: 12,
        topProducts: ['Northern Lights Pre-Roll', 'Sativa Gummies 100mg', 'CBD Tincture'],
        monthlyGrowth: 23,
        activationsThisMonth: 18
    },
    {
        id: 'brand-2',
        name: 'Elevated Farms',
        logo: null,
        storesReached: 98,
        totalRevenue: 312400,
        pendingOrders: 8,
        topProducts: ['Premium Flower 3.5g', 'Live Resin Cart', 'Infused Pre-Rolls'],
        monthlyGrowth: 18,
        activationsThisMonth: 14
    },
    {
        id: 'brand-3',
        name: 'GreenLeaf Extracts',
        logo: null,
        storesReached: 76,
        totalRevenue: 245800,
        pendingOrders: 5,
        topProducts: ['Diamond Sauce', 'Rosin Dabs', 'Disposable Vapes'],
        monthlyGrowth: 28,
        activationsThisMonth: 11
    },
    {
        id: 'brand-4',
        name: 'Nature\'s Choice',
        logo: null,
        storesReached: 54,
        totalRevenue: 178900,
        pendingOrders: 3,
        topProducts: ['Organic Flower', 'Full Spectrum Oil', 'Edibles Variety Pack'],
        monthlyGrowth: 15,
        activationsThisMonth: 8
    }
];

// ===== DISPENSARY PARTNERS =====
export const demoDispensaries = [
    {
        id: 'disp-1',
        name: 'Green Valley Wellness',
        location: 'Los Angeles, CA',
        totalOrders: 87,
        totalSpent: 156700,
        preferredBrands: ['Pacific Greens', 'Elevated Farms'],
        lastOrder: getMonthsAgo(0),
        status: 'active',
        activationsHosted: 24
    },
    {
        id: 'disp-2',
        name: 'Mountain High Dispensary',
        location: 'Denver, CO',
        totalOrders: 64,
        totalSpent: 112400,
        preferredBrands: ['GreenLeaf Extracts', 'Nature\'s Choice'],
        lastOrder: getMonthsAgo(0),
        status: 'active',
        activationsHosted: 18
    },
    {
        id: 'disp-3',
        name: 'Coastal Cannabis',
        location: 'San Diego, CA',
        totalOrders: 52,
        totalSpent: 98500,
        preferredBrands: ['Pacific Greens'],
        lastOrder: getMonthsAgo(0),
        status: 'active',
        activationsHosted: 15
    }
];

// ===== LEADS PIPELINE =====
export const demoLeads = [
    {
        id: 'lead-1',
        dispensaryName: 'Harvest Moon Cannabis',
        contactName: 'Jennifer Blake',
        phone: '(555) 123-4567',
        email: 'jennifer@harvestmoon.com',
        location: 'Portland, OR',
        status: 'hot',
        assignedTo: 'rep-1',
        lastContact: getMonthsAgo(0),
        notes: 'Very interested in Pacific Greens, scheduling activation for next week',
        estimatedValue: 45000
    },
    {
        id: 'lead-2',
        dispensaryName: 'Emerald City Dispensary',
        contactName: 'Michael Torres',
        phone: '(555) 234-5678',
        email: 'mike@emeraldcity.com',
        location: 'Seattle, WA',
        status: 'warm',
        assignedTo: 'rep-2',
        lastContact: getMonthsAgo(0),
        notes: 'Requested product samples, following up this week',
        estimatedValue: 32000
    },
    {
        id: 'lead-3',
        dispensaryName: 'Rocky Mountain Remedies',
        contactName: 'Lisa Anderson',
        phone: '(555) 345-6789',
        email: 'lisa@rockymtnremedies.com',
        location: 'Boulder, CO',
        status: 'warm',
        assignedTo: 'rep-1',
        lastContact: getMonthsAgo(0),
        notes: 'Interested in exclusive partnership',
        estimatedValue: 58000
    },
    {
        id: 'lead-4',
        dispensaryName: 'Golden State Green',
        contactName: 'Robert Kim',
        phone: '(555) 456-7890',
        email: 'robert@goldenstategreen.com',
        location: 'Sacramento, CA',
        status: 'new',
        assignedTo: 'rep-3',
        lastContact: getMonthsAgo(0),
        notes: 'Initial contact made, scheduling demo',
        estimatedValue: 28000
    }
];

// ===== INVOICES & PAYMENTS =====
export const demoInvoices = [
    {
        id: 'INV-2026-0142',
        dispensary: 'Green Valley Wellness',
        brand: 'Pacific Greens',
        amount: 12450,
        date: getMonthsAgo(0),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        status: 'pending',
        items: [
            { name: 'Northern Lights Pre-Roll (100 units)', qty: 100, price: 3500 },
            { name: 'Sativa Gummies 100mg (200 units)', qty: 200, price: 5950 },
            { name: 'CBD Tincture (50 units)', qty: 50, price: 3000 }
        ]
    },
    {
        id: 'INV-2026-0138',
        dispensary: 'Mountain High Dispensary',
        brand: 'GreenLeaf Extracts',
        amount: 8750,
        date: getMonthsAgo(0),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'pending',
        items: [
            { name: 'Diamond Sauce (75 units)', qty: 75, price: 4500 },
            { name: 'Rosin Dabs (50 units)', qty: 50, price: 4250 }
        ]
    },
    {
        id: 'INV-2026-0135',
        dispensary: 'Coastal Cannabis',
        brand: 'Pacific Greens',
        amount: 15200,
        date: getMonthsAgo(1),
        dueDate: getMonthsAgo(0),
        status: 'paid',
        paidDate: getMonthsAgo(0),
        items: [
            { name: 'Premium Flower Bundle', qty: 1, price: 15200 }
        ]
    },
    {
        id: 'INV-2026-0128',
        dispensary: 'Green Valley Wellness',
        brand: 'Elevated Farms',
        amount: 9800,
        date: getMonthsAgo(1),
        dueDate: getMonthsAgo(0),
        status: 'paid',
        paidDate: getMonthsAgo(0),
        items: [
            { name: 'Live Resin Cart (150 units)', qty: 150, price: 9800 }
        ]
    }
];

// ===== UPCOMING ACTIVATIONS =====
export const demoActivations = [
    {
        id: 'act-1',
        brand: 'Pacific Greens',
        dispensary: 'Green Valley Wellness',
        date: new Date(new Date().setDate(new Date().getDate() + 3)),
        time: '12:00 PM - 6:00 PM',
        salesRep: 'Marcus Johnson',
        status: 'confirmed',
        expectedSales: 4500
    },
    {
        id: 'act-2',
        brand: 'Elevated Farms',
        dispensary: 'Mountain High Dispensary',
        date: new Date(new Date().setDate(new Date().getDate() + 5)),
        time: '11:00 AM - 5:00 PM',
        salesRep: 'Sarah Chen',
        status: 'confirmed',
        expectedSales: 3800
    },
    {
        id: 'act-3',
        brand: 'GreenLeaf Extracts',
        dispensary: 'Coastal Cannabis',
        date: new Date(new Date().setDate(new Date().getDate() + 7)),
        time: '1:00 PM - 7:00 PM',
        salesRep: 'David Williams',
        status: 'pending',
        expectedSales: 3200
    }
];

// ===== PAYROLL DATA =====
export const demoPayroll = {
    currentPeriod: {
        startDate: getMonthsAgo(0),
        endDate: new Date(),
        totalHours: 1574,
        totalWages: 23610,
        totalCommissions: 8420,
        grandTotal: 32030
    },
    pendingPayouts: [
        { rep: 'Marcus Johnson', wages: 7290, commissions: 2875, total: 10165 },
        { rep: 'Sarah Chen', wages: 6180, commissions: 1856, total: 8036 },
        { rep: 'David Williams', wages: 5670, commissions: 1245, total: 6915 },
        { rep: 'Emma Rodriguez', wages: 4470, commissions: 985, total: 5455 }
    ]
};

// ===== DASHBOARD METRICS FOR EACH ROLE =====
export const demoDashboardMetrics = {
    salesRep: {
        mySales: 45600,
        myCommissions: 2280,
        myHours: 86,
        myLeads: 12,
        pendingPayout: 1140,
        activationsToday: 1,
        upcomingActivations: 4
    },
    brand: {
        totalRevenue: 425600,
        ordersThisMonth: 42,
        storesReached: 142,
        pendingOrders: 12,
        topProduct: 'Northern Lights Pre-Roll',
        monthlyGrowth: 23,
        pendingPayment: 28450
    },
    dispensary: {
        totalOrders: 87,
        pendingDeliveries: 3,
        savedProducts: 24,
        upcomingActivations: 2,
        totalSpent: 156700,
        favoriteBrand: 'Pacific Greens'
    },
    admin: {
        totalRevenue: 1436900,
        activeReps: 4,
        activeBrands: 4,
        activeDispensaries: 28,
        pendingPayroll: 32030,
        pendingInvoices: 5,
        activationsThisWeek: 8
    },
    superAdmin: {
        totalRevenue: 1436900,
        totalUsers: 89,
        activeSessions: 12,
        systemHealth: 99.8,
        pendingApprovals: 3,
        recentErrors: 0
    }
};

// ===== ACTIVITY FEED =====
export const demoActivityFeed = [
    {
        id: 'activity-1',
        type: 'sale',
        message: 'New order from Green Valley Wellness - $4,250',
        time: '10 minutes ago',
        icon: 'dollar-sign'
    },
    {
        id: 'activity-2',
        type: 'activation',
        message: 'Marcus Johnson checked in at Coastal Cannabis',
        time: '25 minutes ago',
        icon: 'map-pin'
    },
    {
        id: 'activity-3',
        type: 'lead',
        message: 'New lead added: Emerald City Dispensary',
        time: '1 hour ago',
        icon: 'user-plus'
    },
    {
        id: 'activity-4',
        type: 'payment',
        message: 'Invoice INV-2026-0135 marked as paid',
        time: '2 hours ago',
        icon: 'check-circle'
    },
    {
        id: 'activity-5',
        type: 'brand',
        message: 'Pacific Greens added 3 new products',
        time: '3 hours ago',
        icon: 'package'
    }
];

// ===== HELPER TO CHECK IF IN TOUR MODE =====
export const isTourMode = () => {
    return sessionStorage.getItem('tourMode') === 'true';
};

export const enableTourMode = () => {
    sessionStorage.setItem('tourMode', 'true');
};

export const disableTourMode = () => {
    sessionStorage.removeItem('tourMode');
};

// Export all demo data as a single object
export default {
    sales: demoSalesData,
    salesReps: demoSalesReps,
    brands: demoBrands,
    dispensaries: demoDispensaries,
    leads: demoLeads,
    invoices: demoInvoices,
    activations: demoActivations,
    payroll: demoPayroll,
    dashboardMetrics: demoDashboardMetrics,
    activityFeed: demoActivityFeed,
    isTourMode,
    enableTourMode,
    disableTourMode
};
