
export const PRODUCT_CATALOG = [
    {
        id: 'honey-king',
        name: 'Honey King',
        logo: '/logos/partner-6.png',
        minimumOrder: { type: 'amount', value: 1000 }, // $1,000 minimum
        products: [
            // 2G ROYAL PALM Premium Oil ALL-IN-ONE ($34.95 / unit, 5ct pack)
            { id: 'hk-2g-white-widow', name: '2G Royal Palm - White Widow', description: '2G All-In-One | Hybrid', price: 34.95, caseSize: 5, unit: 'unit', thc: '81.33%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-2g-coochie-runts', name: '2G Royal Palm - Coochie Runts', description: '2G All-In-One | Hybrid', price: 34.95, caseSize: 5, unit: 'unit', thc: '80.20%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-2g-royal-highness', name: '2G Royal Palm - Royal Highness', description: '2G All-In-One | Hybrid', price: 34.95, caseSize: 5, unit: 'unit', thc: '87.50%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-2g-northern-light', name: '2G Royal Palm - Northern Light', description: '2G All-In-One | Indica', price: 34.95, caseSize: 5, unit: 'unit', thc: '83.18%', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-2g-royal-og', name: '2G Royal Palm - Royal OG', description: '2G All-In-One | Indica', price: 34.95, caseSize: 5, unit: 'unit', thc: '82.17%', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-2g-green-crack', name: '2G Royal Palm - Green Crack', description: '2G All-In-One | Sativa', price: 34.95, caseSize: 5, unit: 'unit', thc: '81.87%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'hk-2g-key-lime-pie', name: '2G Royal Palm - Key Lime Pie', description: '2G All-In-One | Sativa', price: 34.95, caseSize: 5, unit: 'unit', thc: '81.67%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'hk-2g-blue-dream', name: '2G Royal Palm - Blue Dream', description: '2G All-In-One | Sativa', price: 34.95, caseSize: 5, unit: 'unit', thc: '81.07%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'hk-2g-durban-poison', name: '2G Royal Palm - Durban Poison', description: '2G All-In-One | Sativa', price: 34.95, caseSize: 5, unit: 'unit', thc: '89.20%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'hk-2g-mango-haze', name: '2G Royal Palm - Mango Haze', description: '2G All-In-One | Sativa', price: 34.95, caseSize: 5, unit: 'unit', thc: '80.84%', strainType: 'Sativa', category: 'Vape', inStock: true },

            // 1.1G PREMIUM OIL ALL-IN-ONE ($20.50 / unit, 10ct pack)
            { id: 'hk-1g-gorilla-punch', name: '1.1G Oil - Gorilla Punch', description: '1.1G All-In-One | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '81.50%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1g-chemdawg', name: '1.1G Oil - Chemdawg', description: '1.1G All-In-One | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '82.33%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1g-diablo-og', name: '1.1G Oil - Diablo OG', description: '1.1G All-In-One | Indica', price: 20.50, caseSize: 10, unit: 'unit', thc: '82.49%', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-1g-alien-cookies', name: '1.1G Oil - Alien Cookies', description: '1.1G All-In-One | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '90.51%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1g-purple-haze', name: '1.1G Oil - Purple Haze', description: '1.1G All-In-One | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '89.81%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1g-khalifa-kush', name: '1.1G Oil - Khalifa Kush', description: '1.1G All-In-One | Indica', price: 20.50, caseSize: 10, unit: 'unit', thc: '88.63%', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-1g-king-louis-xii', name: '1.1G Oil - King Louis XII', description: '1.1G All-In-One | Indica', price: 20.50, caseSize: 10, unit: 'unit', thc: '89.73%', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-1g-blue-dream', name: '1.1G Oil - Blue Dream', description: '1.1G All-In-One | Sativa', price: 20.50, caseSize: 10, unit: 'unit', thc: '86.20%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'hk-1g-jack-herer', name: '1.1G Oil - Jack Herer', description: '1.1G All-In-One | Sativa', price: 20.50, caseSize: 10, unit: 'unit', thc: '87.96%', strainType: 'Sativa', category: 'Vape', inStock: true },

            // 1.1G PREMIUM OIL ALL-IN-ONE Sweet Edition ($20.50 / unit, 10ct pack)
            { id: 'hk-1gs-coochie-runts', name: '1.1G Sweet - Coochie Runts', description: 'Sweet Edition | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '80.91%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1gs-jealous-bananas', name: '1.1G Sweet - Jealous Bananas', description: 'Sweet Edition | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '84.67%', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1gs-white-gushers', name: '1.1G Sweet - White Gushers', description: 'Sweet Edition | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1gs-mango-kush', name: '1.1G Sweet - Mango Kush', description: 'Sweet Edition | Hybrid', price: 20.50, caseSize: 10, unit: 'unit', thc: '', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'hk-1gs-watermelon', name: '1.1G Sweet - Watermelon', description: 'Sweet Edition | Indica', price: 20.50, caseSize: 10, unit: 'unit', thc: '81.26%', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-1gs-wedding-cake', name: '1.1G Sweet - Wedding Cake', description: 'Sweet Edition | Indica', price: 20.50, caseSize: 10, unit: 'unit', thc: '', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-1gs-purple-drink', name: '1.1G Sweet - Purple Drink', description: 'Sweet Edition | Indica', price: 20.50, caseSize: 10, unit: 'unit', thc: '', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'hk-1gs-cake-pop', name: '1.1G Sweet - Cake Pop', description: 'Sweet Edition | Sativa', price: 20.50, caseSize: 10, unit: 'unit', thc: '84.52%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'hk-1gs-grape-dosi', name: '1.1G Sweet - Grape Dosi', description: 'Sweet Edition | Sativa', price: 20.50, caseSize: 10, unit: 'unit', thc: '84.99%', strainType: 'Sativa', category: 'Vape', inStock: true },

            // 7x 0.5G Live Resin ROYAL MINIS - Jar of 7.5G Mini Joints ($22.50 / unit, 16ct pack)
            // Infused with Diamonds + Kief
            { id: 'hk-mini-og-blend', name: 'Live Resin Minis Jar - OG Blend', description: '7x 0.5G Mini Joints (7.5G Jar) | Diamond + Kief Infused | Hybrid', price: 22.50, caseSize: 16, unit: 'jar', thc: '35.26%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Mini Joints Jar', inStock: true },
            { id: 'hk-mini-papaya-melon', name: 'Live Resin Minis Jar - Papaya Melon', description: '7x 0.5G Mini Joints (7.5G Jar) | Diamond + Kief Infused | Hybrid', price: 22.50, caseSize: 16, unit: 'jar', thc: '37.63%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Mini Joints Jar', inStock: true },
            { id: 'hk-mini-blueberry', name: 'Live Resin Minis Jar - Blueberry', description: '7x 0.5G Mini Joints (7.5G Jar) | Diamond + Kief Infused | Indica', price: 22.50, caseSize: 16, unit: 'jar', thc: '35.75%', strainType: 'Indica', category: 'Pre-Roll', subcategory: 'Mini Joints Jar', inStock: true },
            { id: 'hk-mini-gmo', name: 'Live Resin Minis Jar - GMO', description: '7x 0.5G Mini Joints (7.5G Jar) | Diamond + Kief Infused | Indica', price: 22.50, caseSize: 16, unit: 'jar', thc: '31.26%', strainType: 'Indica', category: 'Pre-Roll', subcategory: 'Mini Joints Jar', inStock: true },
            { id: 'hk-mini-grape-dosi', name: 'Live Resin Minis Jar - Grape Dosi', description: '7x 0.5G Mini Joints (7.5G Jar) | Diamond + Kief Infused | Sativa', price: 22.50, caseSize: 16, unit: 'jar', thc: '36.17%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Mini Joints Jar', inStock: true },
            { id: 'hk-mini-sativa-blend', name: 'Live Resin Minis Jar - Sativa Blend', description: '7x 0.5G Mini Joints (7.5G Jar) | Diamond + Kief Infused | Sativa', price: 22.50, caseSize: 16, unit: 'jar', thc: '37.80%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Mini Joints Jar', inStock: true },

            // 1.5G KIEF-COATED DIAMOND INFUSED PRE-ROLL ($8.60 / unit, 24ct pack)
            // Infused with BOTH Kief AND Diamonds
            { id: 'hk-pre-cotton-candy', name: '1.5G Kief+Diamond Pre-Roll - Cotton Candy', description: '1.5G Kief + Diamond Infused | 24-Pack | Hybrid', price: 8.60, caseSize: 24, unit: 'unit', thc: '33.63%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-gorilla-glue', name: '1.5G Kief+Diamond Pre-Roll - Gorilla Glue', description: '1.5G Kief + Diamond Infused | 24-Pack | Hybrid', price: 8.60, caseSize: 24, unit: 'unit', thc: '33.59%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-mango-kush', name: '1.5G Kief+Diamond Pre-Roll - Mango Kush', description: '1.5G Kief + Diamond Infused | 24-Pack | Hybrid', price: 8.60, caseSize: 24, unit: 'unit', thc: '32.47%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-white-runts', name: '1.5G Kief+Diamond Pre-Roll - White Runts', description: '1.5G Kief + Diamond Infused | 24-Pack | Hybrid', price: 8.60, caseSize: 24, unit: 'unit', thc: '35.61%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-blueberry', name: '1.5G Kief+Diamond Pre-Roll - Blueberry', description: '1.5G Kief + Diamond Infused | 24-Pack | Indica', price: 8.60, caseSize: 24, unit: 'unit', thc: '', strainType: 'Indica', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-skywalker-og', name: '1.5G Kief+Diamond Pre-Roll - Skywalker OG', description: '1.5G Kief + Diamond Infused | 24-Pack | Indica', price: 8.60, caseSize: 24, unit: 'unit', thc: '', strainType: 'Indica', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-emergency', name: '1.5G Kief+Diamond Pre-Roll - Emergency', description: '1.5G Kief + Diamond Infused | 24-Pack | Sativa', price: 8.60, caseSize: 24, unit: 'unit', thc: '31.23%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-green-crack', name: '1.5G Kief+Diamond Pre-Roll - Green Crack', description: '1.5G Kief + Diamond Infused | 24-Pack | Sativa', price: 8.60, caseSize: 24, unit: 'unit', thc: '46.56%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-maui-waui', name: '1.5G Kief+Diamond Pre-Roll - Maui Waui', description: '1.5G Kief + Diamond Infused | 24-Pack | Sativa', price: 8.60, caseSize: 24, unit: 'unit', thc: '35.38%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },
            { id: 'hk-pre-tangi', name: '1.5G Kief+Diamond Pre-Roll - Tangi', description: '1.5G Kief + Diamond Infused | 24-Pack | Sativa', price: 8.60, caseSize: 24, unit: 'unit', thc: '46.52%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Kief+Diamond Infused', inStock: true },

            // 3.5G INDOOR FLOWER - SOVEREIGN SELECTION ($20.50 / unit, 8ct pack)
            { id: 'hk-flower-royal-runts', name: 'Royal Runts', description: '3.5G Sovereign | Hybrid', price: 20.50, caseSize: 8, unit: 'unit', thc: '25.29%', strainType: 'Hybrid', category: 'Flower', subcategory: 'Indoor Flower', inStock: true },
            { id: 'hk-flower-super-boof', name: 'Super Boof', description: '3.5G Sovereign | Hybrid', price: 20.50, caseSize: 8, unit: 'unit', thc: '21.88%', strainType: 'Hybrid', category: 'Flower', subcategory: 'Indoor Flower', inStock: true },
            { id: 'hk-flower-purps', name: 'Purps', description: '3.5G Sovereign | Indica', price: 20.50, caseSize: 8, unit: 'unit', thc: '18.87%', strainType: 'Indica', category: 'Flower', subcategory: 'Indoor Flower', inStock: true },
            { id: 'hk-flower-blue-dream', name: 'Blue Dream', description: '3.5G Sovereign | Sativa', price: 20.50, caseSize: 8, unit: 'unit', thc: '20.77%', strainType: 'Sativa', category: 'Flower', subcategory: 'Indoor Flower', inStock: true },
            { id: 'hk-flower-lemon-haze', name: 'Lemon Haze', description: '3.5G Sovereign | Sativa', price: 20.50, caseSize: 8, unit: 'unit', thc: '19.24%', strainType: 'Sativa', category: 'Flower', subcategory: 'Indoor Flower', inStock: true },

            // 1.5G DIAMOND INFUSED PRE-ROLL - NO KIEF ($6.44 / unit, 12ct pack)
            // Infused with Diamonds ONLY (no kief)
            { id: 'hk-dia-purple-punch', name: '1.5G Diamond Pre-Roll - Purple Punch', description: '1.5G Diamond Infused (No Kief) | 12-Pack | Indica', price: 6.44, caseSize: 12, unit: 'unit', thc: '41.05%', strainType: 'Indica', category: 'Pre-Roll', subcategory: 'Diamond Infused', inStock: true },
            { id: 'hk-dia-rainbow-belt', name: '1.5G Diamond Pre-Roll - Rainbow Belt', description: '1.5G Diamond Infused (No Kief) | 12-Pack | Hybrid', price: 6.44, caseSize: 12, unit: 'unit', thc: '42.78%', strainType: 'Hybrid', category: 'Pre-Roll', subcategory: 'Diamond Infused', inStock: true },
            { id: 'hk-dia-strawberry-diesel', name: '1.5G Diamond Pre-Roll - Strawberry Diesel', description: '1.5G Diamond Infused (No Kief) | 12-Pack | Sativa', price: 6.44, caseSize: 12, unit: 'unit', thc: '35.44%', strainType: 'Sativa', category: 'Pre-Roll', subcategory: 'Diamond Infused', inStock: true }
        ]
    },
    {
        id: 'bud-cracker',
        name: 'Bud Cracker Boulevard',
        logo: null,
        minimumOrder: { type: 'amount', value: 1000 }, // $1,000 minimum
        products: [
            // INDOOR Flower (3.5g)
            { id: 'bc-st-135-74', name: 'Sour Tangie', description: '3.5g Indoor Flower', price: 17.00, caseSize: 32, unit: 'unit', thc: '21.03%', strainType: 'Sativa', category: 'Flower', inStock: true },
            { id: 'bc-tc-135-71', name: 'Tropicana Cookies', description: '3.5g Indoor Flower', price: 17.00, caseSize: 32, unit: 'unit', thc: '21.20%', strainType: 'Hybrid', category: 'Flower', inStock: true },
            { id: 'bc-wm-135-72', name: 'Watermelon Mimosa', description: '3.5g Indoor Flower', price: 17.00, caseSize: 32, unit: 'unit', thc: '24.00%', strainType: 'Hybrid', category: 'Flower', inStock: true },
            { id: 'bc-tw-135-73', name: 'Train Wreck', description: '3.5g Indoor Flower', price: 17.00, caseSize: 32, unit: 'unit', thc: '20.90%', strainType: 'Sativa', category: 'Flower', inStock: true }
        ]
    },
    {
        id: 'canna-dots',
        name: 'Canna Dots',
        logo: null,
        minimumOrder: { type: 'amount', value: 1000 }, // $1,000 minimum
        products: [
            { id: 'cd-dots-unflavored', name: 'THC Dissolvable Dots - Unflavored', description: '2.5mg per dot, 100mg per unit | 3.79% CBD', price: 14.50, caseSize: 20, unit: 'unit', thc: '3.73%', strainType: 'Hybrid', category: 'Edible', inStock: true },
            { id: 'cd-dots-blueberry', name: 'THC Sublingual Dots - Blueberry', description: '5mg per dot, 100mg per unit | 7.17% CBD', price: 13.50, caseSize: 20, unit: 'unit', thc: '7.27%', strainType: 'Hybrid', category: 'Edible', inStock: true },
            { id: 'cd-dots-cherry', name: 'THC Sublingual Dots - Cherry', description: '5mg per dot, 100mg per unit | 7.91% CBD', price: 13.50, caseSize: 20, unit: 'unit', thc: '7.27%', strainType: 'Hybrid', category: 'Edible', inStock: true },
            { id: 'cd-dots-orange', name: 'THC Sublingual Dots - Orange', description: '5mg per dot, 100mg per unit | 7.36% CBD', price: 13.50, caseSize: 20, unit: 'unit', thc: '7.74%', strainType: 'Hybrid', category: 'Edible', inStock: true }
        ]
    },
    {
        id: 'space-poppers',
        name: 'Space Poppers',
        logo: '/logos/space-poppers.png',
        minimumOrder: { type: 'cases', value: 1 }, // 1 case minimum for medium bags
        products: [
            // LARGE BAGS - 100mg total, 50 kernels, 2mg per kernel
            { id: 'sp-sweet-chili-lg', name: 'Sweet Chili Popcorn (Large)', description: '100mg - 50 kernels @ 2mg each | Sweet caramel and spicy chili-coated', price: 14.00, casePrice: 350.00, caseSize: 25, unit: 'bag', thc: '100mg', size: 'large', kernels: 50, mgPerKernel: 2, strainType: 'Hybrid', category: 'Edible', inStock: true },
            { id: 'sp-sea-salt-lg', name: 'Sea Salt Caramel Popcorn (Large)', description: '100mg - 50 kernels @ 2mg each | Rich, buttery caramel with sea salt', price: 14.00, casePrice: 350.00, caseSize: 25, unit: 'bag', thc: '100mg', size: 'large', kernels: 50, mgPerKernel: 2, strainType: 'Hybrid', category: 'Edible', inStock: true },
            { id: 'sp-chicago-lg', name: 'Chicago Style Popcorn (Large)', description: '100mg - 50 kernels @ 2mg each | Sweet caramel with sharp, savory cheddar', price: 14.00, casePrice: 350.00, caseSize: 25, unit: 'bag', thc: '100mg', size: 'large', kernels: 50, mgPerKernel: 2, strainType: 'Hybrid', category: 'Edible', inStock: true },

            // MEDIUM BAGS - 25mg total, 25 kernels, 1mg per kernel
            { id: 'sp-churros-md', name: 'Churros Popcorn (Medium)', description: '25mg - 25 kernels @ 1mg each | Cinnamon sugar coated churro flavor', price: 7.50, casePrice: 300.00, caseSize: 40, unit: 'bag', thc: '25mg', size: 'medium', kernels: 25, mgPerKernel: 1, strainType: 'Hybrid', category: 'Edible', inStock: true }
        ]
    },
    {
        id: 'smoothie-bar',
        name: 'Smoothie Bar',
        logo: '/logos/smoothie-bar.png',
        minimumOrder: { type: 'cases', value: 4 }, // 4 case minimum ($800/case = $3,200 min)
        products: [
            { id: 'sb-mimosa', name: 'Mimosa x Dirty Shirley', description: 'Sativa x Sativa', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'sb-papaya', name: 'Papaya x Lemonade', description: 'Indica x Sativa', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'sb-truffle', name: 'Truffle Butter x Blue Dream', description: 'Indica x Sativa', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'sb-black-cherry', name: 'Black Cherry x F1', description: 'Indica x Sativa', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'sb-peanut-butter', name: 'Peanut Butter Breath x Zack\'s Pie', description: 'Hybrid x Indica', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'sb-sour-lemon', name: 'Sour Lemon OG x Pineapple Jack', description: 'Sativa x Sativa', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'sb-lava-cake', name: 'Lava Cake x Sour Diesel', description: 'Indica x Sativa', price: 40.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true }
        ]
    },
    {
        id: 'waferz',
        name: 'Waferz NY',
        logo: null,
        minimumOrder: { type: 'amount', value: 1000 }, // $1,000 minimum
        products: [
            { id: 'wz-flower-rb', name: 'Glacierz Infused Flower - Rainbow Belts (7G)', description: 'Premium Infused Flower', price: 50.00, caseSize: 20, unit: 'unit', thc: '32%', strainType: 'Hybrid', category: 'Flower', inStock: true },
            { id: 'wz-flower-loc', name: 'Glacierz Infused Flower - Lemon Orange Cake (7G)', description: 'Premium Infused Flower', price: 50.00, caseSize: 20, unit: 'unit', thc: '31%', strainType: 'Sativa', category: 'Flower', inStock: true },
            { id: 'wz-flower-jp', name: 'Glacierz Infused Flower - Jelly Pancakes (7G)', description: 'Coming Soon', price: 50.00, caseSize: 20, unit: 'unit', thc: '30%', strainType: 'Indica', category: 'Flower', inStock: true },
            { id: 'wz-badder-oc', name: 'Concentrates - Badder - Orange Cake (1G)', description: 'Premium Badder', price: 22.50, caseSize: 20, unit: 'unit', thc: '78%', strainType: 'Sativa', category: 'Concentrate', inStock: true },
            { id: 'wz-badder-lcf', name: 'Concentrates - Badder - Lemon Cherry Fritter (1G)', description: 'Premium Badder', price: 22.50, caseSize: 20, unit: 'unit', thc: '79%', strainType: 'Hybrid', category: 'Concentrate', inStock: true },
            { id: 'wz-diamond-oc', name: 'Concentrates - Decarbed Diamonds - Orange Cake (1G)', description: 'Coming Soon', price: 22.50, caseSize: 20, unit: 'unit', thc: '', strainType: 'Sativa', category: 'Concentrate', inStock: true },
            { id: 'wz-diamond-lcf', name: 'Concentrates - Decarbed Diamonds - Lemon Cherry Fritter (1G)', description: 'Coming Soon', price: 22.50, caseSize: 20, unit: 'unit', thc: '', strainType: 'Hybrid', category: 'Concentrate', inStock: true },
            { id: 'wz-raw-fk', name: 'Concentrates - Diamonds - Fruit King (1G)', description: 'Coming Soon', price: 22.50, caseSize: 20, unit: 'unit', thc: '', strainType: 'Indica', category: 'Concentrate', inStock: true },
            { id: 'wz-raw-lcf', name: 'Concentrates - Diamonds - Lemon Cherry Fritter (1G)', description: 'Coming Soon', price: 22.50, caseSize: 20, unit: 'unit', thc: '', strainType: 'Hybrid', category: 'Concentrate', inStock: true },
            // Added Smoothie Bar Items to Waferz Menu per user request
            { id: 'wz-sb-mimosa', name: 'SB: Mimosa x Dirty Shirley', description: 'Sativa x Sativa', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'wz-sb-papaya', name: 'SB: Papaya x Lemonade', description: 'Indica x Sativa', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'wz-sb-truffle', name: 'SB: Truffle Butter x Blue Dream', description: 'Indica x Sativa', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'wz-sb-black-cherry', name: 'SB: Black Cherry x F1', description: 'Indica x Sativa', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true },
            { id: 'wz-sb-peanut-butter', name: 'SB: PB Breath x Zack\'s Pie', description: 'Hybrid x Indica', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Hybrid', category: 'Vape', inStock: true },
            { id: 'wz-sb-sour-lemon', name: 'SB: Sour Lemon x Pineapple Jack', description: 'Sativa x Sativa', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'wz-sb-lava-cake', name: 'SB: Lava Cake x Sour Diesel', description: 'Indica x Sativa', price: 45.00, caseSize: 20, unit: 'unit', strainType: 'Indica', category: 'Vape', inStock: true }
        ]
    },
    {
        id: 'pines',
        name: 'Pines',
        logo: '/logos/flx-extracts.png',
        minimumOrder: { type: 'amount', value: 1000 }, // $1,000 minimum
        products: [
            // Greenhouse Flower (3.5g)
            { id: 'pines-flower-pines-og', name: 'Pines OG', description: 'Mixed-Light Greenhouse Jars (3.5g) - Chemdawg x Hindu Kush', price: 10.00, caseSize: 32, unit: 'unit', thc: '20.66%', strainType: 'Indica', category: 'Flower', inStock: true },
            { id: 'pines-flower-iced-sangria', name: 'Iced Sangria', description: 'Mixed-Light (3.5g) - Purple Punch x Oreoz', price: 11.00, caseSize: 50, unit: 'unit', thc: '22.56%', strainType: 'Hybrid', category: 'Flower', inStock: true },
            { id: 'pines-flower-crazy-train', name: 'Crazy Train', description: 'Mixed-Light (3.5g) - Nam Wreck x Vietnamese Gold', price: 11.00, caseSize: 50, unit: 'unit', thc: '23.16%', strainType: 'Sativa', category: 'Flower', inStock: true },
            { id: 'pines-flower-papaya-bomb', name: 'Papaya Bomb', description: 'Mixed-Light (3.5g) - Papaya x THC Bomb', price: 11.00, caseSize: 50, unit: 'unit', thc: '29.51%', strainType: 'Hybrid', category: 'Flower', inStock: true },

            // Pre-Rolled Joints (.7g Joints)
            { id: 'pines-prj-jack-rabbit', name: 'Jack Rabbit PRJs (2pk)', description: '.7g Joints - Jack Herer x Cake Badder OG', price: 5.00, caseSize: 60, unit: 'unit', thc: '20.87%', strainType: 'Sativa', category: 'Pre-Roll', inStock: true },
            { id: 'pines-prj-lcm-2pk', name: 'Lemon Cherry Mintz PRJs (2pk)', description: '.7g Joints - LCG x Kush Mintz', price: 5.50, caseSize: 60, unit: 'unit', thc: '17.80%', strainType: 'Hybrid', category: 'Pre-Roll', inStock: true },
            { id: 'pines-prj-lcm-5pk', name: 'Lemon Cherry Mintz PRJs (5pk)', description: '.7g Joints - LCG x Kush Mintz', price: 12.00, caseSize: 20, unit: 'unit', thc: '17.80%', strainType: 'Hybrid', category: 'Pre-Roll', inStock: true },

            // Live Resin Infused Pre-Roll Joints
            { id: 'pines-iprj-king-sherb', name: 'King Sherb Infused PRJs (2pk)', description: 'Live Resin Infused - OGKB x King Sherb', price: 7.50, caseSize: 40, unit: 'unit', thc: '20.80%', strainType: 'Indica', category: 'Pre-Roll', inStock: true },
            { id: 'pines-iprj-garden-eden', name: 'Garden of Eden Infused PRJs (2pk)', description: 'Live Resin Infused - Fruit King x Lemon Pines', price: 7.50, caseSize: 40, unit: 'unit', thc: '23.50%', strainType: 'Sativa', category: 'Pre-Roll', inStock: true },
            { id: 'pines-iprj-jelly-pancakes', name: 'Jelly Pancakes Infused PRJs (2pk)', description: 'Live Resin Infused - Jelly Breath x Pancakes', price: 7.50, caseSize: 40, unit: 'unit', thc: '23.70%', strainType: 'Indica', category: 'Pre-Roll', inStock: true },
            { id: 'pines-iprj-sherb-cake', name: 'Sherb Cake Infused PRJs (2pk)', description: 'Live Resin Infused - GSC x Pink Panties', price: 7.50, caseSize: 40, unit: 'unit', thc: '20.90%', strainType: 'Indica', category: 'Pre-Roll', inStock: true },

            // All-in-One Vaporizer Device 1g
            { id: 'pines-vape-ssd', name: 'Super Sour Diesel AIO Vape', description: '1g Live Resin - Super Silver Haze x Sour Diesel', price: 20.00, caseSize: 25, unit: 'unit', thc: '69.40%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'pines-vape-blue-dream', name: 'Blue Dream AIO Vape', description: '1g Live Resin - Blueberry x Haze', price: 20.00, caseSize: 25, unit: 'unit', thc: '67.44%', strainType: 'Sativa', category: 'Vape', inStock: true },
            { id: 'pines-vape-lemon-pines', name: 'Lemon Pines AIO Vape', description: '1g Live Resin - Lemon Splash x Iced Out', price: 18.00, caseSize: 25, unit: 'unit', thc: '68.96%', strainType: 'Sativa', category: 'Vape', inStock: true },

            // Concentrates (1g)
            { id: 'pines-conc-jelly-pancakes-1g', name: 'Jelly Pancakes Cured Resin', description: '1g Concentrate - Jelly Breath x Pancakes', price: 15.00, caseSize: 20, unit: 'unit', thc: '68.45%', strainType: 'Indica', category: 'Concentrate', inStock: true },

            // Concentrates (3.5g)
            { id: 'pines-conc-ritz-carlton-3.5g', name: 'Ritz Carlton Live Resin', description: '3.5g Concentrate - Rainbow Belts #37 x Gelato #41', price: 55.00, caseSize: 10, unit: 'unit', thc: '72.62%', strainType: 'Hybrid', category: 'Concentrate', inStock: true },
            { id: 'pines-conc-blueberry-sherbet-3.5g', name: 'Blueberry Sherbet Live Resin', description: '3.5g Concentrate - Blueberry x Cherry Pie', price: 55.00, caseSize: 10, unit: 'unit', thc: '66.03%', strainType: 'Indica', category: 'Concentrate', inStock: true }
        ]
    },
    {
        id: 'flx-extracts',
        name: 'FLX Extracts',
        logo: '/logos/flx-extracts.png',
        isProcessor: true, // This is a processor, not a regular brand
        subBrands: ['pines', 'smoothie-bar', 'waferz'], // Brands under this processor
        minimumOrder: { type: 'amount', value: 1000 }, // $1,000 minimum
        products: [] // Processor doesn't have its own products - manages sub-brands
    },
    {
        id: 'jusbud',
        name: 'JUSBUD!',
        logo: null, // CSS-based logo placeholder
        brandColor: '#000000', // Black background for logo
        minimumOrder: { type: 'cases', value: 1 }, // Minimum 1 case
        // JUSBUD COD Discount Structure:
        // Tier 1 (1-2 cases): 10% off → $10.80/unit, $345.60/case
        // Tier 2 (3-5 cases): 15% off → $10.20/unit, $326.40/case
        // Tier 3 (6+ cases): 20% off → $9.60/unit, $307.20/case
        products: [
            {
                id: 'jb-2pk-sour-diesel',
                name: '2-Pack 1G Pre-Rolls - Sour Diesel',
                description: '2-Pack of 1G Premium Pre-Rolls (2G Total)',
                price: 12.00,
                caseSize: 32,
                unit: 'unit',
                thc: '',
                strainType: 'Sativa',
                category: 'Pre-Roll',
                inStock: true
            },
            {
                id: 'jb-2pk-og-kush',
                name: '2-Pack 1G Pre-Rolls - OG Kush',
                description: '2-Pack of 1G Premium Pre-Rolls (2G Total)',
                price: 12.00,
                caseSize: 32,
                unit: 'unit',
                thc: '',
                strainType: 'Indica',
                category: 'Pre-Roll',
                inStock: true
            }
        ]
    }
];
