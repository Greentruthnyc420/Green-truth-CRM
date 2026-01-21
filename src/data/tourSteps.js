/**
 * Comprehensive Tour Steps - In-depth walkthrough of all features
 * Each tour covers every card, feature, and workflow on its respective dashboard
 * 
 * TARGETING GUIDE:
 * - Use specific selectors where possible for highlighting
 * - 'body' is used for general/center announcements
 * - position: 'center' for modals, 'right' for sidebar items, 'bottom' for top elements
 */

// Sales Rep Tour - Comprehensive walkthrough
export const salesRepTourSteps = [
    // Welcome
    {
        target: 'body',
        title: 'Welcome to GreenTruth! 🌿',
        description: 'This is your Sales Ambassador Dashboard. I\'ll give you a complete walkthrough of every feature - tracking sales, logging hours, finding leads, and earning commissions.',
        position: 'center'
    },

    // Stats Grid - targeting the grid of stat cards
    {
        target: '.grid',
        title: 'Your Performance Stats 📊',
        description: 'These cards show your key metrics: pending wages from activations, unpaid commissions (2% of your sales), your hourly rate ($20-$30/hr based on doors), and active dispensary count. All data updates in real-time!',
        position: 'bottom'
    },


    // Navigation Sidebar
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Navigation Menu 📱',
        description: 'Access all your tools from this sidebar. Each section helps you with a different part of your job. Let me walk you through each one.',
        position: 'right'
    },

    // Dashboard Home
    {
        target: 'a[href="/app"]',
        title: 'Dashboard Home 🏠',
        description: 'Your main hub. Come here to see your overall performance, upcoming schedule, and quick stats at a glance.',
        position: 'right'
    },

    // Schedule
    {
        target: 'a[href="/app/schedule"]',
        title: 'Your Schedule 📅',
        description: 'View all your upcoming pop-up activations. See which dispensaries you\'re assigned to, dates, times, and which brands you\'ll represent. Check this DAILY!',
        position: 'right'
    },

    // Log Shift / Hours
    {
        target: 'a[href="/app/log-shift"]',
        title: 'Log Your Hours ⏱️',
        description: 'After EVERY activation, log your hours here. Include start/end time, mileage, tolls, and parking. Pay ranges $20-$30/hr (starting at $20), paid biweekly via direct deposit.',
        position: 'right'
    },

    // Log Sale
    {
        target: 'a[href="/app/log-sale"]',
        title: 'Log Sales 💰',
        description: 'Record every sale here! Enter dispensary, products, quantities, and payment method. You earn 2% commission on all YOUR sales, paid quarterly. If someone else closes your lead, they get the commission.',
        position: 'right'
    },

    // Territory Map
    {
        target: 'a[href="/app/map"]',
        title: 'Territory Map 🗺️',
        description: 'Interactive map of all dispensaries. Green pins = active accounts, gray = prospects. Use this to find nearby leads and plan your route.',
        position: 'right'
    },

    // New Lead
    {
        target: 'a[href="/app/new-lead"]',
        title: 'Add New Leads ➕',
        description: 'Found a new dispensary? Add them here! You get 45 DAYS of exclusivity on your leads. After that, they open to the whole team. Remember: YOU only earn commission if YOU close the sale.',
        position: 'right'
    },

    // Accounts
    {
        target: 'a[href="/app/accounts"]',
        title: 'All Accounts 🏪',
        description: 'View every dispensary in the system. See their status, order history, and assigned rep. Build relationships with your accounts for repeat business!',
        position: 'right'
    },

    // Leaderboard
    {
        target: 'a[href="/app/leaderboard"]',
        title: 'Leaderboard 🏆',
        description: 'See how you rank! Top performers by sales volume, activations, and leads. QUARTERLY bonuses for top performers - compete to win!',
        position: 'right'
    },

    // Brand Menus
    {
        target: 'a[href="/app/menus"]',
        title: 'Brand Menus 📋',
        description: 'Browse all product catalogs. See products by category, THC%, case sizes, and pricing. Use this to help dispensaries choose what to order.',
        position: 'right'
    },

    // Settings
    {
        target: 'a[href="/app/settings"]',
        title: 'Settings ⚙️',
        description: 'Update your profile, payment info for direct deposit, and notification preferences. Keep this current for accurate payouts!',
        position: 'right'
    },

    // Pay Structure
    {
        target: 'body',
        title: 'How You Get Paid 💸',
        description: 'HOURLY: $20-$30/hr for activations (biweekly direct deposit). COMMISSION: 2% on YOUR sales (quarterly). MILEAGE: Reimbursed. BONUSES: Quarterly for top performers.',
        position: 'center'
    },

    // Tips for Success
    {
        target: 'body',
        title: 'Tips for Success 🎯',
        description: '1) Check schedule daily. 2) Log hours IMMEDIATELY after each activation. 3) Add leads before someone else does. 4) Build relationships = repeat orders = more commission.',
        position: 'center'
    },

    // Final
    {
        target: 'body',
        title: 'You\'re Ready! 🎉',
        description: 'Start by checking your schedule, then explore the map for leads. Log every activation and every sale. Welcome to the Green Truth team!',
        position: 'center'
    }
];

// Social Manager Tour (Alyssa) - Ambassador access + scheduling visibility
export const socialManagerTourSteps = [
    {
        target: 'body',
        title: 'Welcome, Social Manager! ✨',
        description: 'You have ambassador access for logging sales/hours, PLUS additional visibility for content planning and team coordination.',
        position: 'center'
    },

    // Stats
    {
        target: '.grid',
        title: 'Your Dashboard 📊',
        description: 'Same stats as ambassadors - your sales, hours, and commissions. Track your own performance.',
        position: 'bottom'
    },

    // Ambassador features (abbreviated)
    {
        target: 'aside, .themed-sidebar',
        title: 'Ambassador Tools 🛠️',
        description: 'You can log sales, hours, view schedule, and add leads just like any ambassador. Use these when you do in-store activations.',
        position: 'right'
    },

    // Schedule focus
    {
        target: 'a[href="/app/schedule"]',
        title: 'Team Schedule 📅',
        description: 'View the FULL activation calendar - all ambassadors, all dispensaries. Use this to plan content around upcoming activations.',
        position: 'right'
    },

    // Map for content
    {
        target: 'a[href="/app/map"]',
        title: 'Content Planning Map 🗺️',
        description: 'See all dispensary locations. Plan social content around specific neighborhoods or upcoming pop-ups.',
        position: 'right'
    },

    // Admin Access
    {
        target: 'body',
        title: 'Admin Portal Access 🔐',
        description: 'From the Gateway page, you can also access the Admin portal for deeper team analytics and scheduling data.',
        position: 'center'
    },

    // Social Tips
    {
        target: 'body',
        title: 'Content Ideas 📸',
        description: 'Use the schedule to know when activations are happening, then visit for behind-the-scenes content. Tag ambassadors and dispensaries for engagement!',
        position: 'center'
    },

    // Pay info
    {
        target: 'body',
        title: 'Your Compensation 💰',
        description: 'Same as ambassadors: $20-$30/hr for activations, 2% commission on your sales, mileage reimbursement. Plus your salary for social management.',
        position: 'center'
    },

    // Final
    {
        target: 'body',
        title: 'You\'re Set! 🚀',
        description: 'Use the schedule and map for content planning. Log any activations you do. Let\'s grow Green Truth\'s social presence!',
        position: 'center'
    }
];

// Brand Partner Tour - Comprehensive for single-brand users
export const brandTourSteps = [
    // Welcome
    {
        target: 'body',
        title: 'Welcome to Your Brand Portal! 📊',
        description: 'This is your command center. Track orders, manage products, view revenue, schedule activations, and grow your presence in NYC dispensaries.',
        position: 'center'
    },

    // Dashboard Stats
    {
        target: '.grid',
        title: 'Key Metrics 💰',
        description: 'Your top-line numbers: total revenue, pending orders, active dispensary accounts, and scheduled activations. Everything updates in real-time.',
        position: 'bottom'
    },

    // Charts
    {
        target: '[class*="chart"], [class*="recharts"]',
        title: 'Revenue Trends 📈',
        description: 'Track your sales over time. See monthly performance, identify your best-selling products, and spot which dispensaries order most.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Navigation Menu',
        description: 'Access all your brand management tools from here. Let me walk you through each section.',
        position: 'right'
    },

    // Orders
    {
        target: 'a[href*="orders"]',
        title: 'Orders 📦',
        description: 'All incoming orders from dispensaries. See dispensary name, OCM license, products ordered, quantities, and status. Approve, ship, or flag orders here.',
        position: 'right'
    },

    // Invoices to Dispensaries
    {
        target: 'a[href*="invoices"]',
        title: 'Dispensary Invoices 🧾',
        description: 'Track money owed TO YOU by dispensaries. See paid vs pending, payment terms (Net-30 or COD), and collection history. Download statements anytime.',
        position: 'right'
    },

    // Products
    {
        target: 'a[href*="products"]',
        title: 'Product Catalog 🛍️',
        description: 'Manage your products. Add new items, update pricing, set case sizes, upload photos. This is what dispensaries see in the marketplace.',
        position: 'right'
    },

    // Menu Editor
    {
        target: 'a[href*="menu"]',
        title: 'Menu / Price Sheet 📋',
        description: 'Upload your official menu PDF. Sales reps and dispensaries reference this when placing orders. Keep it updated with current pricing!',
        position: 'right'
    },

    // Deals
    {
        target: 'a[href*="deals"]',
        title: 'Deals & Discounts 🏷️',
        description: 'Set up tiered pricing! Example: 10% off 3+ cases, 15% off 5+ cases. COD discounts encouraged. Bigger discounts = more orders!',
        position: 'right'
    },

    // Schedule
    {
        target: 'a[href*="schedule"]',
        title: 'Activation Calendar 📅',
        description: 'See all your upcoming in-store pop-ups. Which dispensaries, which ambassadors, and when. Activation fees are billed separately.',
        position: 'right'
    },

    // Pipeline
    {
        target: 'a[href*="pipeline"]',
        title: 'Sales Pipeline 🔄',
        description: 'Track prospects. See which dispensaries are interested, in negotiation, or ready to order. Move leads through the funnel.',
        position: 'right'
    },

    // Map
    {
        target: 'a[href*="map"]',
        title: 'Coverage Map 🗺️',
        description: 'Visual map of your distribution. Green = dispensaries carrying your products. Identify gaps and expansion opportunities.',
        position: 'right'
    },

    // Request Activation
    {
        target: 'body',
        title: 'Request Pop-Ups ⭐',
        description: 'Want more exposure? Request activations at any dispensary. Our ambassadors represent your brand, sample products, and drive sales.',
        position: 'center'
    },

    // Invoices from GreenTruth
    {
        target: 'body',
        title: 'GreenTruth Invoices 💳',
        description: 'You\'ll also receive invoices FROM us for activation fees and platform services. Pay on time to keep scheduling priority!',
        position: 'center'
    },

    // Final
    {
        target: 'body',
        title: 'Let\'s Grow! 🚀',
        description: 'Check your pending orders, set up deal tiers, and consider scheduling more activations. We\'re here to help your brand succeed in NYC!',
        position: 'center'
    }
];

// Processor Tour (FLX) - All brand capabilities PLUS multi-brand management
export const processorTourSteps = [
    // Welcome - Processor specific
    {
        target: 'body',
        title: 'Welcome to Your Processor Hub! 🏭',
        description: 'You manage MULTIPLE brands from one powerful dashboard. Everything a single brand can do, you can do - but across your entire portfolio.',
        position: 'center'
    },

    // Brand Switcher - PROCESSOR EXCLUSIVE
    {
        target: '.flex.gap-2, [class*="tab"], [class*="switch"]',
        title: '🔥 Brand Switcher (Your Superpower)',
        description: 'Toggle between your brands or select "All Brands" for combined data. This is your most powerful tool - use it to focus or go wide.',
        position: 'bottom'
    },

    // Combined Analytics
    {
        target: '.grid',
        title: 'Portfolio Analytics 📊',
        description: 'When viewing "All Brands": see COMBINED revenue, orders, and activations. Switch to a specific brand to drill into that brand\'s individual performance.',
        position: 'bottom'
    },

    // Charts
    {
        target: '[class*="chart"], [class*="recharts"]',
        title: 'Compare Your Brands 📈',
        description: 'Which brands are growing? Which need attention? Use these charts to identify trends, seasonal patterns, and where to invest your marketing budget.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Management Tools',
        description: 'Your complete toolkit. Every feature works per-brand OR across all brands - the brand switcher controls your view. Let me walk you through each section.',
        position: 'right'
    },

    // Dashboard
    {
        target: 'a[href*="dashboard"]',
        title: 'Dashboard Home 🏠',
        description: 'Your command center. Quick stats, alerts, and action items. Start here every day to see what needs your attention.',
        position: 'right'
    },

    // Orders
    {
        target: 'a[href*="orders"]',
        title: 'Orders Across Brands 📦',
        description: 'Manage orders for ALL brands or filter by one. Each order shows brand, dispensary, products, and status. Approve, ship, or flag - all from one place.',
        position: 'right'
    },

    // Invoices - Dispensary
    {
        target: 'a[href*="invoices"]',
        title: 'Dispensary Invoices 🧾',
        description: 'Track money owed TO you from dispensaries. View consolidated across brands or per-brand. See outstanding balances, aging, and payment history.',
        position: 'right'
    },

    // Products
    {
        target: 'a[href*="products"]',
        title: 'Product Catalogs 🛍️',
        description: 'Each brand has its own catalog. Switch brands using the brand switcher, then manage that brand\'s products, pricing, images, and availability.',
        position: 'right'
    },

    // Menu
    {
        target: 'a[href*="menu"]',
        title: 'Brand Menus 📋',
        description: 'Upload price sheets for each brand. Sales reps and dispensaries reference these when ordering. Keep them updated with current pricing!',
        position: 'right'
    },

    // Deals
    {
        target: 'a[href*="deals"]',
        title: 'Deals Per Brand 🏷️',
        description: 'Configure discounts INDIVIDUALLY for each brand. One brand can have different deal tiers than another. Customize to each brand\'s strategy.',
        position: 'right'
    },

    // Schedule
    {
        target: 'a[href*="schedule"]',
        title: 'Activation Calendar 📅',
        description: 'See ALL pop-ups across your brands. Know which brand is being featured at each dispensary. Plan your promotional calendar strategically.',
        position: 'right'
    },

    // Pipeline
    {
        target: 'a[href*="pipeline"]',
        title: 'Combined Pipeline 🔄',
        description: 'Track leads interested in ANY of your brands. See which dispensaries are prospects for which products and where they are in the sales process.',
        position: 'right'
    },

    // Map
    {
        target: 'a[href*="map"]',
        title: 'Territory Coverage 🗺️',
        description: 'Visual map of distribution across NYC. See which dispensaries carry which brands. The gold mine: find stores with ONE of your brands but not the others.',
        position: 'right'
    },

    // GreenTruth Invoices
    {
        target: 'body',
        title: 'GreenTruth Invoices 💳',
        description: 'You\'ll receive invoices FROM us for activation fees and services. These are consolidated across your brands for easy management.',
        position: 'center'
    },

    // Cross-selling Strategy
    {
        target: 'body',
        title: 'Cross-Sell Strategy 🧠',
        description: 'Your unique advantage: dispensaries buying from one brand are warm leads for your others. Use the map and data to identify these opportunities.',
        position: 'center'
    },

    // Request Activations
    {
        target: 'body',
        title: 'Multi-Brand Activations ⭐',
        description: 'Request pop-ups for any brand, or bundle multiple brands at one location. Activation fees apply per brand, but bundling creates bigger impact.',
        position: 'center'
    },

    // Portfolio Optimization
    {
        target: 'body',
        title: 'Portfolio Optimization 📊',
        description: 'Regularly review: Which brand has highest margin? Best reorder rate? Most activation ROI? Use data to allocate your resources and grow strategically.',
        position: 'center'
    },

    // Final
    {
        target: 'body',
        title: 'Multi-Brand Power! 🎯',
        description: 'You have complete portfolio control. Use the brand switcher, cross-sell between brands, and leverage your data advantage. Let\'s dominate NYC together!',
        position: 'center'
    }
];

// Dispensary Tour - Buyer-focused experience
export const dispensaryTourSteps = [
    // Welcome
    {
        target: 'body',
        title: 'Welcome to Green Truth! 🏪',
        description: 'Order from NYC\'s best cannabis brands. Track deliveries, view invoices, schedule pop-ups, and access exclusive deals - all in one place.',
        position: 'center'
    },

    // Stats Dashboard
    {
        target: '.grid',
        title: 'Your Dashboard 📊',
        description: 'At a glance: pending orders, scheduled deliveries, outstanding balance, and upcoming activations at your location.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Quick Navigation',
        description: 'Everything you need is in this menu. Let me show you each section.',
        position: 'right'
    },

    // Marketplace
    {
        target: 'a[href*="marketplace"]',
        title: 'Browse Products 🛍️',
        description: 'Full product catalog from all brands. Filter by category, strain type, THC%, or brand. See real-time pricing and availability.',
        position: 'right'
    },

    // Deals Alert
    {
        target: 'body',
        title: 'Bulk & COD Discounts 💰',
        description: 'Many brands offer discounts for bulk orders and COD payments. The more you order, the more you save! Check each brand for their specific deals.',
        position: 'center'
    },

    // Cart
    {
        target: 'button[class*="cart"], [class*="cart"]',
        title: 'Your Cart 🛒',
        description: 'Add products as you browse. Review your order, see applied discounts, then checkout. Simple as that.',
        position: 'bottom'
    },

    // Orders
    {
        target: 'a[href*="orders"]',
        title: 'Track Orders 📦',
        description: 'All your orders from placed to delivered. See status, expected delivery, driver info, and order details.',
        position: 'right'
    },

    // Invoices
    {
        target: 'a[href*="invoices"]',
        title: 'Your Invoices 🧾',
        description: 'View all invoices and payment status. Download for your records. Routing and account numbers are provided for ACH payments.',
        position: 'right'
    },

    // Schedule
    {
        target: 'a[href*="schedule"]',
        title: 'Pop-Up Calendar 📅',
        description: 'See upcoming brand activations AT YOUR LOCATION. Ambassadors come to sample products and help drive sales to your customers.',
        position: 'right'
    },

    // Request Activations
    {
        target: 'body',
        title: 'Request Pop-Ups ⭐',
        description: 'Want more brand activations? Request specific brands to do pop-ups at your store. They bring samples, do demos, and drive traffic!',
        position: 'center'
    },

    // Payment Terms
    {
        target: 'body',
        title: 'Payment Options 💳',
        description: 'Net-30 terms available for qualified accounts. COD payments often qualify for additional discounts. ACH details provided on invoices.',
        position: 'center'
    },

    // Support
    {
        target: 'body',
        title: 'Your Support Team 🤝',
        description: 'Questions? Contact your dedicated sales rep or email sales@thegreentruthnyc.com. We\'re here to help!',
        position: 'center'
    },

    // Final
    {
        target: 'body',
        title: 'Start Shopping! 🎉',
        description: 'Head to the marketplace to browse products. Remember: bigger orders = bigger savings! Welcome to the Green Truth family!',
        position: 'center'
    }
];

// Admin Tour - Full system control
export const adminTourSteps = [
    // Welcome
    {
        target: 'body',
        title: 'Admin Control Center 🛡️',
        description: 'Complete visibility into the entire operation: all teams, all sales, all financials. You manage everything from here.',
        position: 'center'
    },

    // Dashboard Stats
    {
        target: '.grid',
        title: 'Company Metrics 📊',
        description: 'Real-time overview: total revenue, active ambassadors, pending orders, today\'s activations. The pulse of Green Truth.',
        position: 'bottom'
    },

    // Charts
    {
        target: '[class*="chart"], [class*="recharts"]',
        title: 'Performance Analytics 📈',
        description: 'Revenue trends, growth rates, team productivity. Compare time periods, identify patterns, spot issues early.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Admin Navigation',
        description: 'Access every administrative function from here. Let me walk you through each section.',
        position: 'right'
    },

    // Dashboard
    {
        target: 'a[href="/admin"]',
        title: 'Dashboard Home 🏠',
        description: 'Your main overview. Quick stats, recent activity, alerts that need attention.',
        position: 'right'
    },

    // Workflow
    {
        target: 'a[href*="workflow"]',
        title: 'Workflow / Approvals 📋',
        description: 'Handle activation requests, hour approvals, and scheduling. Items flow through: Request → Approved → Scheduled → Completed.',
        position: 'right'
    },

    // Pipeline
    {
        target: 'a[href*="pipeline"], a[href*="growth"]',
        title: 'Sales Pipeline 🔄',
        description: 'All leads and opportunities. Track conversion rates, see which reps are closing, identify stuck deals to assist.',
        position: 'right'
    },

    // Financials
    {
        target: 'a[href*="financials"]',
        title: 'Financials 💰',
        description: 'The money page. Revenue, expenses, profit margins, payroll costs, outstanding invoices. Export reports for accounting.',
        position: 'right'
    },

    // Invoices
    {
        target: 'a[href*="invoices"]',
        title: 'Invoice Management 🧾',
        description: 'Generate invoices for brands (activation fees) and dispensaries (product orders). Track payments, send reminders.',
        position: 'right'
    },

    // Team
    {
        target: 'a[href*="team"]',
        title: 'Team Management 👥',
        description: 'All ambassadors and their metrics. Hours logged, sales made, activations done. Click anyone for detailed performance.',
        position: 'right'
    },

    // Brands
    {
        target: 'a[href*="brands"]',
        title: 'Brand Partners 📦',
        description: 'All brands in the system. Their products, orders, relationship status. Add new brands, manage existing ones.',
        position: 'right'
    },

    // Territory
    {
        target: 'a[href*="territory"]',
        title: 'Territory Map 🗺️',
        description: 'Dispensary coverage across NYC. See assignments, identify gaps, plan expansion strategy.',
        position: 'right'
    },

    // Collections
    {
        target: 'a[href*="collections"]',
        title: 'Collections (A/R) 💵',
        description: 'Who owes us money. Aging reports, payment reminders, collection notes. Manage accounts receivable here.',
        position: 'right'
    },

    // Final
    {
        target: 'body',
        title: 'You\'re In Control! 💪',
        description: 'Explore each section. All data is real-time. Questions? The team is here to support you.',
        position: 'center'
    }
];

// Super Admin Tour (Omar) - Includes role management
export const superAdminTourSteps = [
    {
        target: 'body',
        title: 'Super Admin Access 👑',
        description: 'Welcome! You have FULL system access - everything admins see, plus role management and system configuration.',
        position: 'center'
    },

    // Stats
    {
        target: '.grid',
        title: 'Complete Overview 📊',
        description: 'All company metrics at your fingertips. Revenue, team size, orders, activations - the full picture.',
        position: 'bottom'
    },

    // Charts
    {
        target: '[class*="chart"], [class*="recharts"]',
        title: 'Deep Analytics 📈',
        description: 'All performance data. Use this to make strategic decisions about growth, hiring, and territory expansion.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Full Admin Suite',
        description: 'Every tool available. You see everything. Let me highlight the key sections.',
        position: 'right'
    },

    // All standard admin sections
    {
        target: 'a[href*="workflow"]',
        title: 'Workflow 📋',
        description: 'Approve hours, activations, and requests. Keep operations running smoothly.',
        position: 'right'
    },

    {
        target: 'a[href*="financials"]',
        title: 'Financials 💰',
        description: 'Complete P&L visibility. Revenue, costs, margins. Export for accounting.',
        position: 'right'
    },

    {
        target: 'a[href*="team"]',
        title: 'Team 👥',
        description: 'All team members and performance. Hire, fire, promote based on data.',
        position: 'right'
    },

    {
        target: 'a[href*="brands"]',
        title: 'Brands 📦',
        description: 'Manage all brand relationships. Onboard new partners, handle issues.',
        position: 'right'
    },

    {
        target: 'a[href*="territory"]',
        title: 'Territory 🗺️',
        description: 'Strategic view of NYC coverage. Plan expansion, assign territories.',
        position: 'right'
    },

    {
        target: 'a[href*="collections"]',
        title: 'Collections 💵',
        description: 'A/R management. Who owes, how much, how long. Essential for cash flow.',
        position: 'right'
    },

    // Role Management - SUPER ADMIN EXCLUSIVE
    {
        target: 'a[href*="roles"]',
        title: '🔐 Role Management (Super Admin Only)',
        description: 'Assign admin access to team members. Grant or revoke permissions. Only YOU can modify roles.',
        position: 'right'
    },

    // System Config
    {
        target: 'body',
        title: 'System Configuration ⚙️',
        description: 'You can access system settings, modify configurations, and make changes regular admins cannot. Use wisely!',
        position: 'center'
    },

    // Final
    {
        target: 'body',
        title: 'Build the Empire! 🚀',
        description: 'You have all the tools. Full visibility, full control. Let\'s continue growing Green Truth!',
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
