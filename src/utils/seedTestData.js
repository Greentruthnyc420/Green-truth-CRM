// Test Data Seed Script for GreenTruth CRM
// Run this in the browser console while logged in as admin

import { addSale, addCompletedActivation, getLeads, addLead } from './services/firestoreService';

// ============= PRODUCTS FOR SALES =============
const PRODUCTS = {
    flower: [
        { name: 'OG Kush 3.5g', category: 'Flower', price: 45, brandId: 'honey-king', brandName: 'Honey King' },
        { name: 'Blue Dream 7g', category: 'Flower', price: 85, brandId: 'space-poppers', brandName: 'Space Poppers' },
        { name: 'Girl Scout Cookies 1oz', category: 'Flower', price: 280, brandId: 'waferz', brandName: 'Waferz NY' },
        { name: 'Sour Diesel 3.5g', category: 'Flower', price: 50, brandId: 'pines', brandName: 'Pines' },
    ],
    edibles: [
        { name: 'Gummy Bears 100mg', category: 'Edibles', price: 25, brandId: 'canna-dots', brandName: 'Canna Dots' },
        { name: 'Chocolate Bar 200mg', category: 'Edibles', price: 40, brandId: 'smoothie-bar', brandName: 'Smoothie Bar' },
        { name: 'Honey Sticks 50mg 5pk', category: 'Edibles', price: 30, brandId: 'honey-king', brandName: 'Honey King' },
        { name: 'Brownie Bites 6pk', category: 'Edibles', price: 45, brandId: 'bud-cracker', brandName: 'Bud Cracker' },
    ],
    concentrates: [
        { name: 'Live Resin 1g', category: 'Concentrates', price: 60, brandId: 'flx-extracts', brandName: 'FLX Extracts' },
        { name: 'Shatter 1g', category: 'Concentrates', price: 45, brandId: 'flx-extracts', brandName: 'FLX Extracts' },
        { name: 'Rosin 0.5g', category: 'Concentrates', price: 55, brandId: 'pines', brandName: 'Pines' },
        { name: 'Diamonds & Sauce 1g', category: 'Concentrates', price: 70, brandId: 'flx-extracts', brandName: 'FLX Extracts' },
    ],
    prerolls: [
        { name: 'Infused Pre-Roll 1g', category: 'Pre-Rolls', price: 18, brandId: 'space-poppers', brandName: 'Space Poppers' },
        { name: 'Pre-Roll 5pk', category: 'Pre-Rolls', price: 35, brandId: 'honey-king', brandName: 'Honey King' },
        { name: 'King Size Pre-Roll', category: 'Pre-Rolls', price: 22, brandId: 'waferz', brandName: 'Waferz NY' },
    ],
    vapes: [
        { name: 'Disposable Vape 1g', category: 'Vapes', price: 40, brandId: 'canna-dots', brandName: 'Canna Dots' },
        { name: 'Cartridge 0.5g', category: 'Vapes', price: 35, brandId: 'smoothie-bar', brandName: 'Smoothie Bar' },
        { name: 'Cartridge 1g', category: 'Vapes', price: 55, brandId: 'space-poppers', brandName: 'Space Poppers' },
    ]
};

// Dispensary names for test data
const DISPENSARY_NAMES = [
    'SoHo Smoke Shop',
    'Brooklyn Heights Dispensary',
    'Harlem Herbal',
    'Queens Green',
    'Bronx Botanical',
    'East Village Wellness',
    'Chelsea Cannabis Co.',
    'Upper West Side Wellness',
    'Williamsburg Weed',
    'Astoria Apothecary',
    'Flushing Flowers',
    'Jamaica Greens',
    'Staten Island Strains',
    'Long Island Leaf',
    'Midtown Medicine'
];

const BRANDS = ['Honey King', 'Space Poppers', 'Canna Dots', 'FLX Extracts', 'Waferz NY', 'Pines', 'Bud Cracker', 'Smoothie Bar'];
const BRAND_IDS = ['honey-king', 'space-poppers', 'canna-dots', 'flx-extracts', 'waferz', 'pines', 'bud-cracker', 'smoothie-bar'];

// Helper function to get random items from array
function randomItems(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Helper function to get random number in range
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get random date in last 60 days
function randomDate() {
    const now = new Date();
    const daysAgo = randomInRange(1, 60);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().split('T')[0];
}

// ============= SEED SALES WITH PRODUCTS =============
export async function seedSalesWithProducts(count = 15) {
    console.log(`🌱 Starting to seed ${count} sales with product details...`);

    // First, get or create dispensary leads
    let existingLeads = await getLeads();
    const dispensaryIds = {};

    for (const name of DISPENSARY_NAMES) {
        let lead = existingLeads.find(l => l.dispensaryName === name);
        if (!lead) {
            lead = await addLead({
                dispensaryName: name,
                licenseNumber: `OCM-${Date.now()}-${randomInRange(1000, 9999)}`,
                address: `${randomInRange(100, 999)} ${name.split(' ')[0]} Street, New York, NY`,
                leadStatus: 'active',
                status: 'Sold'
            });
        }
        dispensaryIds[name] = lead.id;
    }

    const results = [];

    for (let i = 0; i < count; i++) {
        const dispensaryName = DISPENSARY_NAMES[randomInRange(0, DISPENSARY_NAMES.length - 1)];

        // Select 1-5 random products from different categories
        const allProducts = [...PRODUCTS.flower, ...PRODUCTS.edibles, ...PRODUCTS.concentrates, ...PRODUCTS.prerolls, ...PRODUCTS.vapes];
        const selectedProducts = randomItems(allProducts, randomInRange(1, 5));

        // Create items with quantities
        const items = selectedProducts.map(product => ({
            ...product,
            quantity: randomInRange(1, 5),
            productId: `prod-${Date.now()}-${randomInRange(1000, 9999)}`
        }));

        // Calculate total
        const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const saleData = {
            dispensaryName,
            dispensaryId: dispensaryIds[dispensaryName],
            date: randomDate(),
            totalAmount,
            items,
            brandId: items[0].brandId,
            brandName: items[0].brandName,
            activeBrands: [...new Set(items.map(i => i.brandName))],
            commissionRate: 0.02,
            status: 'completed',
            userId: 'test-user-id',
            userName: 'Test Sales Rep'
        };

        try {
            const result = await addSale(saleData);
            results.push({ success: true, dispensary: dispensaryName, total: totalAmount, items: items.length });
            console.log(`✅ Sale ${i + 1}/${count}: ${dispensaryName} - $${totalAmount.toFixed(2)} (${items.length} items)`);
        } catch (err) {
            results.push({ success: false, dispensary: dispensaryName, error: err.message });
            console.error(`❌ Sale ${i + 1} failed:`, err.message);
        }
    }

    console.log(`🌱 Seed complete: ${results.filter(r => r.success).length}/${count} sales created`);
    return results;
}

// ============= SEED ACTIVATIONS =============
export async function seedActivations(count = 20) {
    console.log(`🌱 Starting to seed ${count} activations...`);

    const results = [];

    for (let i = 0; i < count; i++) {
        const brandIndex = randomInRange(0, BRANDS.length - 1);
        const dispensaryName = DISPENSARY_NAMES[randomInRange(0, DISPENSARY_NAMES.length - 1)];

        // Random hours between 2-8
        const hours = randomInRange(2, 8);
        const startHour = randomInRange(9, 14); // Start between 9am-2pm
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(startHour + hours).padStart(2, '0')}:00`;

        // Random mileage (0-50 miles) - some will be 0 (no vehicle)
        const hasVehicle = Math.random() > 0.3; // 70% have vehicle
        const milesTraveled = hasVehicle ? randomInRange(5, 50) : 0;

        // Random toll (0-25) - only if has vehicle and drove
        const tollAmount = (hasVehicle && milesTraveled > 15 && Math.random() > 0.5)
            ? randomInRange(5, 25)
            : 0;

        const activationData = {
            brandId: BRAND_IDS[brandIndex],
            brand: BRANDS[brandIndex],
            brandName: BRANDS[brandIndex],
            dispensaryName,
            date: randomDate(),
            startTime,
            endTime,
            hoursWorked: hours,
            milesTraveled,
            tollAmount,
            hasVehicle,
            region: Math.random() > 0.2 ? 'NYC' : 'Outside NYC',
            activationType: ['walk-in', 'appointment', 'pop-up'][randomInRange(0, 2)],
            notes: `Test activation for ${BRANDS[brandIndex]} at ${dispensaryName}`,
            userId: 'test-user-id',
            repId: 'test-user-id',
            repName: 'Test Sales Rep'
        };

        try {
            const result = await addCompletedActivation(activationData);
            results.push({
                success: true,
                brand: BRANDS[brandIndex],
                dispensary: dispensaryName,
                hours,
                miles: milesTraveled,
                toll: tollAmount
            });
            console.log(`✅ Activation ${i + 1}/${count}: ${BRANDS[brandIndex]} @ ${dispensaryName} - ${hours}h, ${milesTraveled}mi, $${tollAmount} toll`);
        } catch (err) {
            results.push({ success: false, brand: BRANDS[brandIndex], error: err.message });
            console.error(`❌ Activation ${i + 1} failed:`, err.message);
        }
    }

    console.log(`🌱 Seed complete: ${results.filter(r => r.success).length}/${count} activations created`);
    return results;
}

// ============= RUN ALL SEEDS =============
export async function seedAll() {
    console.log('🚀 Starting comprehensive test data seed...\n');

    console.log('📦 Phase 1: Creating sales with detailed product items...');
    const sales = await seedSalesWithProducts(15);

    console.log('\n🎯 Phase 2: Creating activations with varied durations/mileage/tolls...');
    const activations = await seedActivations(20);

    console.log('\n✨ All seeding complete!');
    console.log(`  Sales: ${sales.filter(r => r.success).length}/15`);
    console.log(`  Activations: ${activations.filter(r => r.success).length}/20`);

    return { sales, activations };
}

// Export for use
window.seedTestData = {
    seedSalesWithProducts,
    seedActivations,
    seedAll
};

console.log('📋 Test data functions loaded! Run in console:');
console.log('  - seedTestData.seedSalesWithProducts(15)');
console.log('  - seedTestData.seedActivations(20)');
console.log('  - seedTestData.seedAll()');
