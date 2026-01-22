/**
 * Comprehensive Tour Steps - In-depth walkthrough of all features
 * Each tour covers every card, feature, and workflow on its respective dashboard
 * 
 * TARGETING GUIDE:
 * - Use specific selectors where possible for highlighting
 * - 'body' is used for general/center announcements
 * - position: 'center' for modals, 'right' for sidebar items, 'bottom' for top elements
 */

// Canna Consultant Tour - Comprehensive walkthrough
export const salesRepTourSteps = [
    // Welcome
    {
        target: 'body',
        title: 'Welcome to GreenTruth! 🌿',
        description: 'This is your Canna Consultant Dashboard. I\'ll give you a complete walkthrough of every feature - tracking sales, logging hours, finding leads, and earning commissions.',
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

// Social Media & Cannabis Consultant Tour (Alyssa)
export const socialManagerTourSteps = [
    // Welcome
    {
        target: 'body',
        title: 'Welcome, Social Media Manager! ✨',
        description: 'You\'re the voice of Green Truth NYC! This dashboard gives you consultant access PLUS special tools for content planning, team coordination, and social media strategy. Let me show you everything.',
        position: 'center'
    },

    // Your Dual Role
    {
        target: 'body',
        title: 'Your Dual Role 🎭',
        description: 'You wear two hats: 1) Social Media Manager - creating content, managing our brand presence. 2) Canna Consultant - you can also do pop-ups and earn commissions. Best of both worlds!',
        position: 'center'
    },

    // Dashboard Stats
    {
        target: '.grid',
        title: 'Your Performance Stats 📊',
        description: 'Track your personal metrics: pending wages from activations you do, your commission earnings (2% of sales), and your hourly rate. These update in real-time.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Your Toolkit 🛠️',
        description: 'This sidebar has everything you need. I\'ll walk you through each tool and how it helps with social media content creation.',
        position: 'right'
    },

    // Schedule - Content Planning
    {
        target: 'a[href="/app/schedule"]',
        title: 'Activation Calendar 📅',
        description: 'THE GOLD MINE for content! See ALL upcoming pop-ups. Plan to visit activations for: behind-the-scenes content, consultant spotlights, product features, and dispensary partnerships.',
        position: 'right'
    },

    // Schedule Strategy
    {
        target: 'body',
        title: 'Content Calendar Strategy 📆',
        description: 'Pro tip: Plan your content around the schedule. Monday = Hype posts for the week. Day-of = Stories and live content. Day after = Recap and engagement.',
        position: 'center'
    },

    // Map - Location Content
    {
        target: 'a[href="/app/map"]',
        title: 'Location Mapping 🗺️',
        description: 'See all dispensary locations. Use this for: geo-tagging posts, neighborhood-specific content, planning content routes, and finding photo-worthy spots.',
        position: 'right'
    },

    // Map Content Ideas
    {
        target: 'body',
        title: 'Map-Based Content Ideas 📍',
        description: 'Try these: "Pop-ups in [neighborhood] this week!" | "Which borough are we visiting today?" | Neighborhood spotlight series. The map shows you where the action is!',
        position: 'center'
    },

    // Accounts - Dispensary Relationships
    {
        target: 'a[href="/app/accounts"]',
        title: 'Dispensary Partners 🏪',
        description: 'View all our partner dispensaries. Check their status, location, and history. Great for: tagging in posts, featuring partners, and coordinating collaborations.',
        position: 'right'
    },

    // Accounts Content Strategy
    {
        target: 'body',
        title: 'Partner Spotlight Content 🌟',
        description: 'Feature our best partners! "Dispensary of the Week" series, owner interviews, store tours. Build relationships by giving partners social love.',
        position: 'center'
    },

    // Log Shift (When You Do Activations)
    {
        target: 'a[href="/app/log-shift"]',
        title: 'Log Your Activations ⏱️',
        description: 'When you work a pop-up, log your hours here. Start/end time, mileage, expenses. You earn $20-30/hr just like other consultants!',
        position: 'right'
    },

    // Log Sale
    {
        target: 'a[href="/app/log-sale"]',
        title: 'Log Your Sales 💰',
        description: 'If you make sales during activations, log them! You earn 2% commission on your personal sales, paid quarterly. Every sale counts.',
        position: 'right'
    },

    // Leaderboard - Team Content
    {
        target: 'a[href="/app/leaderboard"]',
        title: 'Team Leaderboard 🏆',
        description: 'See top performers! Use this for: consultant spotlight posts, celebrating wins, creating healthy competition content, and recognizing the team.',
        position: 'right'
    },

    // Leaderboard Content Ideas
    {
        target: 'body',
        title: 'Leaderboard Content Ideas 🎉',
        description: 'Post ideas: "Congrats to [name] - top seller this week!" | Monthly MVP features | Behind-the-scenes with top consultants. People love recognition!',
        position: 'center'
    },

    // Profile Settings
    {
        target: 'body',
        title: 'Settings & Profile ⚙️',
        description: 'Access settings from the menu. Update your profile photo, notification preferences, and view your payment history. Keep your info current!',
        position: 'center'
    },

    // Content Types
    {
        target: 'body',
        title: 'Content Pillars 📸',
        description: 'Your content mix: 1) Activation highlights 2) Product features 3) Team spotlights 4) Dispensary partners 5) Behind-the-scenes 6) Educational cannabis content',
        position: 'center'
    },

    // Social Best Practices
    {
        target: 'body',
        title: 'Social Media Best Practices 📱',
        description: 'Remember: Tag dispensaries and consultants. Use location stickers. Post Stories during activations. Engage with comments. Cross-post to all platforms.',
        position: 'center'
    },

    // Hashtag Strategy
    {
        target: 'body',
        title: 'Hashtag Strategy #️⃣',
        description: 'Core hashtags: #GreenTruthNYC #CannaConsultant #NYCCannabis #PopUpLife. Add location-specific and trending tags. Keep a hashtag library!',
        position: 'center'
    },

    // Content Capture Tips
    {
        target: 'body',
        title: 'Content Capture Tips 📷',
        description: 'When visiting activations: Get action shots, product displays, consultant candids, customer reactions (with permission), and store atmosphere. Variety is key!',
        position: 'center'
    },

    // Your Compensation
    {
        target: 'body',
        title: 'Your Compensation 💵',
        description: 'You earn: 1) Your social media salary (set) 2) $20-30/hr for activations you work 3) 2% commission on sales you make 4) Mileage reimbursement. Track everything!',
        position: 'center'
    },

    // Weekly Workflow
    {
        target: 'body',
        title: 'Your Weekly Workflow 📋',
        description: 'Monday: Check schedule, plan content week. Tuesday-Friday: Create and post. Weekends: Cover key activations. Sunday: Review metrics, plan next week.',
        position: 'center'
    },

    // Metrics & Reporting
    {
        target: 'body',
        title: 'Track Your Impact 📈',
        description: 'Keep notes on: engagement rates, follower growth, best-performing content, activation attendance boost. This helps show social media ROI!',
        position: 'center'
    },

    // You're Ready
    {
        target: 'body',
        title: 'You\'re Ready to Create! 🚀',
        description: 'Use this dashboard daily. Check the schedule often. Build relationships with consultants and dispensaries. Let\'s make Green Truth NYC the most recognized cannabis brand in New York!',
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

    // Pipeline - Sales Process
    {
        target: 'a[href*="pipeline"]',
        title: 'Sales Pipeline 🔄',
        description: 'Track prospects through your sales funnel: Lead → Contacted → Negotiating → Closed. Move cards between stages by clicking on them.',
        position: 'right'
    },

    // New Lead
    {
        target: 'a[href*="new-lead"]',
        title: 'Add New Leads ➕',
        description: 'Found a new dispensary? Add them here with their contact info. They\'ll appear in your pipeline for follow-up.',
        position: 'right'
    },

    // Orders - Incoming
    {
        target: 'a[href*="orders"]',
        title: 'Incoming Orders 📦',
        description: 'All orders from dispensaries appear here. See dispensary name, OCM license, products ordered, and quantities. Approve orders to move them to fulfillment.',
        position: 'right'
    },

    // NAVIGATE: Show Orders Page
    {
        target: '.grid, table, [class*="order"]',
        title: 'Your Orders Dashboard 📋',
        description: 'Here\'s where you\'ll see all incoming orders. View order details, approve shipments, and track fulfillment status. Demo data shows what this looks like with active orders.',
        position: 'bottom',
        navigateTo: '/brand/orders'
    },

    // Order Workflow
    {
        target: 'body',
        title: 'Order Workflow 📋',
        description: 'Orders flow: Pending → Approved → Shipped → Delivered. Update status as you process each order. Dispensaries can track their order status too.',
        position: 'center'
    },

    // Products
    {
        target: 'a[href*="products"]',
        title: 'Product Catalog 🛍️',
        description: 'Add products with name, SKU, category, THC%, case size, and pricing. Upload product images. This is what dispensaries see when ordering.',
        position: 'right'
    },

    // NAVIGATE: Show Products Page
    {
        target: '.grid, table, [class*="product"]',
        title: 'Your Product Management 🛍️',
        description: 'Manage your entire product catalog from here. Add new products, update pricing, upload images, and track inventory. Your real products from the catalog are shown here.',
        position: 'bottom',
        navigateTo: '/brand/products'
    },

    // Product Tips
    {
        target: 'body',
        title: 'Product Tips 💡',
        description: 'Include wholesale AND retail pricing. Set case sizes (6, 12, 24 units). Add COA links for compliance. Good product info = more orders!',
        position: 'center'
    },

    // Menu Editor
    {
        target: 'a[href*="menu"]',
        title: 'Menu / Price Sheet 📋',
        description: 'Upload your official PDF menu. Sales reps use this when pitching to dispensaries. Include strain info, THC ranges, and case pricing.',
        position: 'right'
    },

    // Deals - Strategy
    {
        target: 'a[href*="deals"]',
        title: 'Deals & Discounts 🏷️',
        description: 'Set up tiered pricing to encourage larger orders. Example: 5% off 3+ cases, 10% off 5+ cases, 15% off 10+ cases.',
        position: 'right'
    },

    // NAVIGATE: Show Deals Page  
    {
        target: '.grid, [class*="deal"], [class*="discount"]',
        title: 'Active Deals & Promotions 🏷️',
        description: 'Create and manage your promotional offers here. Set volume discounts, COD incentives, and first-order specials to drive more sales.',
        position: 'bottom',
        navigateTo: '/brand/deals'
    },

    // Deal Tips
    {
        target: 'body',
        title: 'Deal Strategy 🧠',
        description: 'COD discounts (2-5%) are popular and improve cash flow. First-order discounts attract new accounts. Stack discounts to maximize appeal!',
        position: 'center'
    },

    // Schedule
    {
        target: 'a[href*="schedule"]',
        title: 'Activation Calendar 📅',
        description: 'View all your scheduled pop-ups. See which dispensary, date, time, and assigned ambassador. Request new activations from the dashboard.',
        position: 'right'
    },

    // Request Activation
    {
        target: 'body',
        title: 'Request Pop-Ups ⭐',
        description: 'Click "Request Activation" on the dashboard. Select a dispensary and preferred dates. Our team will confirm and assign an ambassador.',
        position: 'center'
    },

    // Activation Benefits
    {
        target: 'body',
        title: 'Activation ROI 📊',
        description: 'Ambassadors sample products, educate budtenders, and drive immediate sales. Average ROI is 3-5x the activation fee. Schedule monthly for best results!',
        position: 'center'
    },

    // Map
    {
        target: 'a[href*="map"]',
        title: 'Coverage Map 🗺️',
        description: 'Interactive map of NYC dispensaries. Green = carrying your products. Gray = prospects. Click any pin for details and order history.',
        position: 'right'
    },

    // Invoices to Dispensaries
    {
        target: 'a[href*="invoices/dispensary"]',
        title: 'Invoices TO Dispensaries 💵',
        description: 'Track money owed to you. See invoice status: Pending, Sent, Paid, Overdue. Download PDF invoices anytime. Net-30 terms standard.',
        position: 'right'
    },

    // NAVIGATE: Show Invoices Page
    {
        target: '.grid, table, [class*="invoice"]',
        title: 'Your Invoice Dashboard 💵',
        description: 'View all invoices, track payment status, and download PDFs. Filter by status (Pending, Paid, Overdue) to stay on top of receivables.',
        position: 'bottom',
        navigateTo: '/brand/invoices/dispensary'
    },

    // Invoices from GreenTruth
    {
        target: 'a[href*="invoices/greentruth"]',
        title: 'Invoices FROM GreenTruth 💳',
        description: 'Your platform fees and activation charges appear here. ACH payment info is on each invoice. Pay on time to maintain scheduling priority.',
        position: 'right'
    },

    // Integrations
    {
        target: 'a[href*="integrations"]',
        title: 'Integrations 🔗',
        description: 'Connect to Dutchie, Blaze, Treez, Metrc, or BioTrack. Sync inventory and orders automatically. Contact us for setup assistance.',
        position: 'right'
    },

    // Team Management
    {
        target: 'body',
        title: 'Team Management 👥',
        description: 'Go to Settings → Team Management to invite team members. Assign roles: Admin (full access), Manager (edit), or Viewer (read-only).',
        position: 'center'
    },

    // Settings
    {
        target: 'body',
        title: 'Brand Settings ⚙️',
        description: 'Update your business info, ACH payment details, and notification preferences in Settings. Keep contact info current for order notifications!',
        position: 'center'
    },

    // Payment Terms
    {
        target: 'body',
        title: 'Payment Terms 💰',
        description: 'Standard is Net-30 for dispensaries. COD available with discount incentive. We handle invoicing and collection - you focus on product!',
        position: 'center'
    },

    // Support
    {
        target: 'body',
        title: 'Need Help? 🤝',
        description: 'Email brands@thegreentruthnyc.com for product questions. sales@thegreentruthnyc.com for new accounts. We respond within 24 hours!',
        position: 'center'
    },

    // Return to Dashboard
    {
        target: 'body',
        title: 'Back to Your Dashboard 🏠',
        description: 'Now let\'s head back to your main dashboard where all your key metrics are displayed.',
        position: 'center',
        navigateTo: '/brand'
    },

    // Final
    {
        target: 'body',
        title: 'Let\'s Grow Together! 🚀',
        description: 'Start by reviewing your product catalog, setting up deals, and checking the pipeline. Request your first activation to drive immediate sales!',
        position: 'center'
    }
];

// Processor Tour (FLX) - All brand capabilities PLUS multi-brand management
export const processorTourSteps = [
    // Welcome - Processor specific
    {
        target: 'body',
        title: 'Welcome to Your Processor Hub! 🏭',
        description: 'You manage MULTIPLE brands from one powerful dashboard. Control orders, inventory, and activations across your entire portfolio from one place.',
        position: 'center'
    },

    // Brand Switcher - PROCESSOR EXCLUSIVE
    {
        target: '.flex.gap-2, [class*="tab"], [class*="switch"]',
        title: '🔥 Brand Switcher (Your Superpower)',
        description: 'Toggle between brands using these tabs. "All Brands" shows combined data. Individual brand tabs show brand-specific metrics. Use this constantly!',
        position: 'bottom'
    },

    // How Brand Switcher Works
    {
        target: 'body',
        title: 'Switching Brands 🔄',
        description: 'When you switch brands, ALL data on the page changes: stats, charts, orders, products. It\'s like having a separate dashboard for each brand.',
        position: 'center'
    },

    // Combined Analytics
    {
        target: '.grid',
        title: 'Portfolio Metrics 📊',
        description: 'In "All Brands" view: combined revenue, total orders, and portfolio-wide stats. In individual brand view: that brand\'s specific performance.',
        position: 'bottom'
    },

    // Charts
    {
        target: '[class*="chart"], [class*="recharts"]',
        title: 'Brand Performance Comparison 📈',
        description: 'Compare brands side-by-side. Which is growing? Which needs marketing? Use these insights to allocate your budget and ambassador time.',
        position: 'bottom'
    },

    // Navigation
    {
        target: 'aside, .themed-sidebar, nav',
        title: 'Management Tools',
        description: 'Same tools as brands, but with multi-brand capability. The brand switcher on the dashboard controls your view throughout the portal.',
        position: 'right'
    },

    // Pipeline - Multi-Brand Leads
    {
        target: 'a[href*="pipeline"]',
        title: 'Combined Sales Pipeline 🔄',
        description: 'See prospects for ALL your brands. Identify which dispensaries are interested in Space Poppers vs Pines vs Smoothie Bar - cross-sell opportunities!',
        position: 'right'
    },

    // Cross-Sell Tip
    {
        target: 'body',
        title: 'Cross-Sell Strategy 💡',
        description: 'Pro tip: Dispensaries buying one brand are warm leads for your others. "You love Space Poppers? Try our Smoothie Bar line!" Use the map to spot these.',
        position: 'center'
    },

    // Orders - Multi-Brand
    {
        target: 'a[href*="orders"]',
        title: 'Orders Across All Brands 📦',
        description: 'View and manage orders for every brand you manage. Filter by brand, status, or dispensary. Approve, ship, and track from one unified view.',
        position: 'right'
    },

    // NAVIGATE: Show Orders Page
    {
        target: '.grid, table, [class*="order"]',
        title: 'Multi-Brand Orders View 📦',
        description: 'Here you manage orders across ALL your brands. See which brand each order is for, approve shipments, and track fulfillment from one unified dashboard.',
        position: 'bottom',
        navigateTo: '/brand/orders'
    },

    // Order Processing
    {
        target: 'body',
        title: 'Efficient Order Processing 📋',
        description: 'Batch similar orders together. Consolidate shipments to the same dispensary across brands. Save time and shipping costs!',
        position: 'center'
    },

    // Products
    {
        target: 'a[href*="products"]',
        title: 'Per-Brand Product Catalogs 🛍️',
        description: 'Each brand has its own catalog. Switch to a brand using the dashboard tabs, then manage that brand\'s products. Keep all SKUs and pricing current.',
        position: 'right'
    },

    // Deals - Per Brand
    {
        target: 'a[href*="deals"]',
        title: 'Brand-Specific Deals 🏷️',
        description: 'Set different deal structures per brand. Space Poppers might offer 15% off 5+ cases while Smoothie Bar offers 10% off. Customize per brand strategy.',
        position: 'right'
    },

    // NAVIGATE: Show Deals Page
    {
        target: '.grid, [class*="deal"]',
        title: 'Deals Across Your Portfolio 🏷️',
        description: 'Manage promotional offers for each brand from here. Compare what\'s working across brands and optimize your deal strategy.',
        position: 'bottom',
        navigateTo: '/brand/deals'
    },

    // Schedule - All Activations
    {
        target: 'a[href*="schedule"]',
        title: 'Multi-Brand Activation Calendar 📅',
        description: 'See ALL pop-ups across all your brands. Color-coded by brand. Plan strategically - avoid scheduling two of YOUR brands at the same location on the same day.',
        position: 'right'
    },

    // Request Activations
    {
        target: 'body',
        title: 'Strategic Activation Planning ⭐',
        description: 'Request activations for any brand. Multi-brand bundles at one location get better ambassador attention. Rotate brands monthly for variety.',
        position: 'center'
    },

    // Map - Distribution View
    {
        target: 'a[href*="map"]',
        title: 'Portfolio Distribution Map 🗺️',
        description: 'The GOLD MINE: See which dispensaries carry which of YOUR brands. Find stores with Space Poppers but NOT Smoothie Bar - instant cross-sell targets!',
        position: 'right'
    },

    // Map Strategy
    {
        target: 'body',
        title: 'Map Strategy 🎯',
        description: 'Color-code pins by brand. Gaps in coverage = opportunity. When one brand gets into a new store, immediately pitch your others.',
        position: 'center'
    },

    // Invoices - Dispensary
    {
        target: 'a[href*="invoices/dispensary"]',
        title: 'Consolidated A/R View 💵',
        description: 'Track receivables across all brands. See total outstanding by dispensary - one store might owe you across multiple brand invoices.',
        position: 'right'
    },

    // NAVIGATE: Show Invoices Page
    {
        target: '.grid, table, [class*="invoice"]',
        title: 'Multi-Brand Invoicing 💵',
        description: 'View invoices across your entire portfolio. Track what each dispensary owes across all your brands in one view.',
        position: 'bottom',
        navigateTo: '/brand/invoices/dispensary'
    },

    // Invoices from GreenTruth
    {
        target: 'a[href*="invoices/greentruth"]',
        title: 'Platform Invoices 💳',
        description: 'Your activation fees and platform charges - consolidated across brands for easy management. One payment covers all your brands.',
        position: 'right'
    },

    // Fulfillment
    {
        target: 'a[href*="fulfillment"]',
        title: 'Fulfillment Center 📤',
        description: 'Manage shipments across all brands. Track what\'s been picked, packed, and shipped. Consolidate orders to the same destination when possible.',
        position: 'right'
    },

    // Team Management
    {
        target: 'body',
        title: 'Team Management 👥',
        description: 'Go to Settings → Team Management. Invite team members with access to ALL your brands or specific ones. Assign Admin, Manager, or Viewer roles.',
        position: 'center'
    },

    // Integrations
    {
        target: 'a[href*="integrations"]',
        title: 'System Integrations 🔗',
        description: 'Connect your POS, inventory system, or compliance platform. Sync data automatically. Ask us about custom integrations for processors.',
        position: 'right'
    },

    // Menu PDFs
    {
        target: 'a[href*="menu"]',
        title: 'Brand Menu Sheets 📋',
        description: 'Maintain separate PDF menus for each brand. Sales reps use these in the field. Keep pricing and strain info current for each brand.',
        position: 'right'
    },

    // Portfolio Strategy
    {
        target: 'body',
        title: 'Portfolio Strategy 📊',
        description: 'Review weekly: Which brand has best margins? Best reorder rates? Highest activation ROI? Allocate ambassador time to biggest opportunities.',
        position: 'center'
    },

    // Settings
    {
        target: 'body',
        title: 'Processor Settings ⚙️',
        description: 'Configure business info, payment details, and manage your team. All settings apply across your entire brand portfolio.',
        position: 'center'
    },

    // Support
    {
        target: 'body',
        title: 'Processor Support 🤝',
        description: 'Email processors@thegreentruthnyc.com for multi-brand questions. You have priority support as a processor partner. We respond within 24 hours.',
        position: 'center'
    },

    // Return to Dashboard
    {
        target: 'body',
        title: 'Back to Processor Dashboard 🏠',
        description: 'Let\'s head back to your main dashboard with the powerful brand comparison view.',
        position: 'center',
        navigateTo: '/brand'
    },

    // Final
    {
        target: 'body',
        title: 'Multi-Brand Power! 🚀',
        description: 'You have complete portfolio control. Use the brand switcher, cross-sell between brands, and leverage data to grow strategically. Let\'s dominate NYC together!',
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

    // Deals Widget
    {
        target: 'aside, .themed-sidebar',
        title: 'Available Deals 💰',
        description: 'Check the Deals Widget in your sidebar! See all active promotions from every brand - bulk discounts, COD savings, flash sales, and more. Each deal shows exactly what you need to qualify.',
        position: 'right'
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

    // Trial User Upgrade - NEW
    {
        target: 'body',
        title: 'Trial Email Upgrades ⭐',
        description: 'Trial sales reps use [name].thegreentruthnyc@gmail.com emails. When they make their first sale, use the upgrade button (envelope icon) to convert them to an official @thegreentruthnyc.com email.',
        position: 'center'
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
