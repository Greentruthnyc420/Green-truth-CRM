/**
 * Simple Tour Steps - No Navigation
 * Each tour stays on its respective dashboard
 */

// Sales Rep Tour
export const salesRepTourSteps = [
    {
        target: 'body',
        title: 'Welcome to GreenTruth! 🌿',
        description: 'This is your ambassador dashboard. Let me show you around!',
        position: 'center'
    },
    {
        target: 'nav, .themed-sidebar',
        title: 'Navigation Sidebar',
        description: 'Use these menu items to access different features. Each one opens a new section.',
        position: 'right'
    },
    {
        target: 'a[href="/app/log-sale"]',
        title: 'Log Sales 💰',
        description: 'Record every sale here to earn 2% commission, paid quarterly!',
        position: 'right'
    },
    {
        target: 'a[href="/app/schedule"]',
        title: 'Your Schedule 📅',
        description: 'View upcoming pop-up activations you\'re assigned to.',
        position: 'right'
    },
    {
        target: 'a[href="/app/log-shift"]',
        title: 'Log Hours ⏱️',
        description: 'After each activation, log your hours, miles, and tolls here. Paid biweekly!',
        position: 'right'
    },
    {
        target: 'a[href="/app/map"]',
        title: 'Find Leads 🗺️',
        description: 'Explore dispensaries on the map to find new accounts.',
        position: 'right'
    },
    {
        target: 'body',
        title: 'You\'re Ready! 🎉',
        description: 'That\'s it! Start by logging a sale or checking your schedule. Welcome aboard!',
        position: 'center'
    }
];

// Social Manager Tour (Alyssa)
export const socialManagerTourSteps = [
    {
        target: 'body',
        title: 'Welcome Alyssa! 🌿✨',
        description: 'You have ambassador access plus admin features. Let me show you!',
        position: 'center'
    },
    ...salesRepTourSteps.slice(1, 6),
    {
        target: 'body',
        title: 'Admin Access',
        description: 'You can also access the Admin portal from the Gateway for analytics and team management.',
        position: 'center'
    }
];

// Brand Partner Tour
export const brandTourSteps = [
    {
        target: 'body',
        title: 'Welcome to Your Brand Portal! 📊',
        description: 'Track revenue, manage orders, and schedule activations all in one place.',
        position: 'center'
    },
    {
        target: 'nav, .themed-sidebar',
        title: 'Navigation',
        description: 'Access all brand features from this sidebar.',
        position: 'right'
    },
    {
        target: 'a[href="/brand/orders"]',
        title: 'Orders 📦',
        description: 'View and manage incoming dispensary orders. See dispensary name, address, and OCM license for each order.',
        position: 'right'
    },
    {
        target: 'a[href="/brand/invoices"]',
        title: 'Invoices 💵',
        description: 'Track payments and download invoice statements.',
        position: 'right'
    },
    {
        target: 'a[href="/brand/deals"]',
        title: 'Deals & Discounts 🏷️',
        description: 'Set up tiered discounts to incentivize larger orders. Example: 10% off 5+ cases, 15% off 10+ cases!',
        position: 'right'
    },
    {
        target: 'a[href="/brand/activations"]',
        title: 'Activations ⭐',
        description: 'Request in-store pop-ups at dispensaries. Our ambassadors bring your products to life!',
        position: 'right'
    },
    {
        target: 'a[href="/brand/schedule"]',
        title: 'Schedule 📅',
        description: 'View upcoming activations and sync with Monday.com if connected.',
        position: 'right'
    },
    {
        target: 'body',
        title: 'All Set! 🚀',
        description: 'Explore your dashboard and reach out if you need anything!',
        position: 'center'
    }
];

// Processor Tour (FLX)
export const processorTourSteps = [
    {
        target: 'body',
        title: 'Welcome to Your Processor Hub! 🏭',
        description: 'Manage all your brands from one dashboard.',
        position: 'center'
    },
    {
        target: '.flex.gap-2 button, [class*="brand-switch"]',
        title: 'Brand Switcher',
        description: 'Toggle between your brands or view "All Brands" for combined analytics.',
        position: 'bottom'
    },
    {
        target: 'a[href*="orders"]',
        title: 'Orders 📦',
        description: 'Manage orders across all your brands. Filter by brand to focus.',
        position: 'right'
    },
    {
        target: 'a[href*="deals"]',
        title: 'Deals 🏷️',
        description: 'Configure tiered discounts for each brand (COD orders, volume discounts, etc.)',
        position: 'right'
    },
    {
        target: 'a[href*="activations"]',
        title: 'Activations ⭐',
        description: 'Schedule pop-ups for any of your brands.',
        position: 'right'
    },
    {
        target: 'body',
        title: 'Multi-Brand Power! 🎯',
        description: 'Use the brand switcher to focus on specific brands. You\'re all set!',
        position: 'center'
    }
];

// Dispensary Tour
export const dispensaryTourSteps = [
    {
        target: 'body',
        title: 'Welcome to Your Dispensary Portal! 🏪',
        description: 'Order products, track deliveries, and manage your GreenTruth relationship here.',
        position: 'center'
    },
    {
        target: 'nav, .themed-sidebar',
        title: 'Navigation',
        description: 'Access all features from this sidebar.',
        position: 'right'
    },
    {
        target: 'a[href*="marketplace"]',
        title: 'Browse Products 🛍️',
        description: 'Explore our full product catalog. Filter by brand, category, or THC%. Look for deals and tiered discounts!',
        position: 'right'
    },
    {
        target: 'a[href*="orders"]',
        title: 'Your Orders 📦',
        description: 'Track order status from placed to delivered.',
        position: 'right'
    },
    {
        target: 'a[href*="invoices"]',
        title: 'Invoices 🧾',
        description: 'View your purchase history and payment status.',
        position: 'right'
    },
    {
        target: 'body',
        title: 'Discounts Available! 💰',
        description: 'Many brands offer tiered discounts: the more cases you order, the bigger your savings. COD orders often get extra discounts!',
        position: 'center'
    },
    {
        target: 'body',
        title: 'Ready to Order! 🎉',
        description: 'Browse the marketplace to get started. Welcome!',
        position: 'center'
    }
];

// Admin Tour
export const adminTourSteps = [
    {
        target: 'body',
        title: 'Admin Dashboard 🛡️',
        description: 'Your control center for the GreenTruth operation.',
        position: 'center'
    },
    {
        target: 'nav, .themed-sidebar',
        title: 'Admin Navigation',
        description: 'Access all admin features from here.',
        position: 'right'
    },
    {
        target: 'a[href="/admin/workflow"]',
        title: 'Workflow 📋',
        description: 'Manage activation requests and approvals.',
        position: 'right'
    },
    {
        target: 'a[href="/admin/financials"]',
        title: 'Financials 💰',
        description: 'Revenue, expenses, and profit tracking.',
        position: 'right'
    },
    {
        target: 'a[href="/admin/team"]',
        title: 'Team 👥',
        description: 'View ambassadors, performance, and payroll.',
        position: 'right'
    },
    {
        target: 'body',
        title: 'You\'re In Control! 💪',
        description: 'Explore each section to master the platform.',
        position: 'center'
    }
];

// Super Admin Tour (Omar)
export const superAdminTourSteps = [
    {
        target: 'body',
        title: 'Super Admin Dashboard 👑',
        description: 'Welcome Omar! You have full system access.',
        position: 'center'
    },
    ...adminTourSteps.slice(1, 5),
    {
        target: 'a[href="/admin/roles"]',
        title: 'Role Management 🔑',
        description: 'Assign admin roles and manage permissions.',
        position: 'right'
    },
    {
        target: 'body',
        title: 'Full Control Unlocked! 🚀',
        description: 'You have access to everything. Build the empire!',
        position: 'center'
    }
];

// Get tour by type
export function getTourSteps(tourType) {
    const tours = {
        'sales_rep': salesRepTourSteps,
        'social_manager': socialManagerTourSteps,
        'brand': brandTourSteps,
        'processor': processorTourSteps,
        'dispensary': dispensaryTourSteps,
        'admin': adminTourSteps,
        'super_admin': superAdminTourSteps
    };
    return tours[tourType] || salesRepTourSteps;
}
