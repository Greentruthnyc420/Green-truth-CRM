/**
 * Test Data Generator Utility
 * 
 * This utility generates test dispensaries, sales, and activations
 * for testing the compensation logic (hourly rate, milestone bonuses).
 * 
 * HOW TO USE:
 * 1. Open browser console on the app
 * 2. Run: import('/src/utils/testDataGenerator.js').then(m => m.generateTestData())
 * 3. To cleanup: import('/src/utils/testDataGenerator.js').then(m => m.cleanupTestData())
 */

import { addSale, addLead, resetDatabase, getSales, getLeads } from '../services/firestoreService';
import { PRODUCT_CATALOG } from '../data/productCatalog';

// NYC Dispensary Names - 50 unique realistic names
const DISPENSARY_NAMES = [
    "Cannabis Culture NYC", "Green Leaf Manhattan", "Brooklyn Bud Co",
    "Queens Cannabis Collective", "Bronx Green Room", "Harlem Hash House",
    "SoHo Smoke Shop", "Chelsea Cannabis", "East Village Dispensary",
    "West Side Wellness", "Midtown Medical", "Lower East Leaf",
    "Williamsburg Weed Works", "Bushwick Buds", "Crown Heights Cannabis",
    "Bed-Stuy Botanicals", "Park Slope Pot Shop", "DUMBO Dispensary",
    "Greenpoint Green", "Astoria Apothecary", "Jackson Heights Hemp",
    "Flushing Flora", "Jamaica Joint", "Long Island City Leaf",
    "Forest Hills Flower", "Rego Park Remedies", "Bayside Botanics",
    "Whitestone Wellness", "Fordham Finest", "Riverdale Remedies",
    "Pelham Parkway Plants", "Morris Park Marijuana", "City Island Cannabis",
    "Throgs Neck THC", "Staten Island Smoke", "St. George Green",
    "Stapleton Strains", "Great Kills Grass", "New Dorp Dispensary",
    "Inwood Infusions", "Washington Heights Weed", "Hamilton Heights Hemp",
    "Sugar Hill Smoke", "Central Harlem Cannabis", "Morningside Marijuana",
    "Upper East Essence", "Upper West Wellness", "Columbus Circle Cannabis",
    "Times Square THC", "Financial District Flora"
];

// Generate random license number
const generateLicense = (index) => `OCM-LIC-${String(index + 1).padStart(4, '0')}`;

// Generate random amount between min and max
const randomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Get random products from catalog
const getRandomProducts = (minItems = 2, maxItems = 5) => {
    const items = [];
    const numItems = randomAmount(minItems, maxItems);
    const usedProducts = new Set();

    // Get available brands (exclude processor brands with no products)
    const brandsWithProducts = PRODUCT_CATALOG.filter(b => b.products && b.products.length > 0);

    for (let i = 0; i < numItems; i++) {
        // Pick random brand
        const brand = brandsWithProducts[Math.floor(Math.random() * brandsWithProducts.length)];
        // Pick random product from brand
        const product = brand.products[Math.floor(Math.random() * brand.products.length)];

        // Skip if we already added this product
        const productKey = `${brand.id}-${product.id}`;
        if (usedProducts.has(productKey)) continue;
        usedProducts.add(productKey);

        // Random quantity 1-10
        const qty = randomAmount(1, 10);

        items.push({
            brandId: brand.id,
            brandName: brand.name,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: qty,
            unit: product.unit || 'unit'
        });
    }

    return items;
};

// Calculate total from items
const calculateItemsTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Adjust items to match target amount
const adjustItemsToAmount = (items, targetAmount) => {
    const currentTotal = calculateItemsTotal(items);
    if (currentTotal === 0) return items;

    const factor = targetAmount / currentTotal;

    return items.map(item => ({
        ...item,
        quantity: Math.max(1, Math.round(item.quantity * factor))
    }));
};

/**
 * Generate test dispensaries and sales
 * @param {number} dispensaryCount - Number of dispensaries to create (default 50)
 * @param {number} salesPerDispensary - Number of sales per dispensary (default 2)
 * @param {string} repId - Rep ID to assign sales to
 * @param {string} repName - Rep name to display
 */
export async function generateTestData(
    dispensaryCount = 50,
    salesPerDispensary = 2,
    repId = 'test-sales-rep',
    repName = 'Test Sales Rep'
) {
    console.log('🚀 Starting test data generation...');
    console.log(`📊 Will create ${dispensaryCount} dispensaries with ${salesPerDispensary} sales each`);
    console.log(`💰 Target total sales: ${dispensaryCount * salesPerDispensary}`);

    const results = {
        dispensariesCreated: 0,
        salesCreated: 0,
        totalAmount: 0,
        errors: []
    };

    // Limit to available names
    const actualCount = Math.min(dispensaryCount, DISPENSARY_NAMES.length);

    for (let i = 0; i < actualCount; i++) {
        const dispensaryName = DISPENSARY_NAMES[i];
        const licenseNumber = generateLicense(i);

        try {
            // Create sales for this dispensary
            for (let j = 0; j < salesPerDispensary; j++) {
                // Target amount between $2,000 and $10,000
                const targetAmount = randomAmount(2000, 10000);

                // Get random products and adjust to target amount
                let items = getRandomProducts(3, 6);
                items = adjustItemsToAmount(items, targetAmount);
                const actualAmount = calculateItemsTotal(items);

                // Get active brands from items
                const activeBrands = [...new Set(items.map(item => item.brandName))];

                // Payment terms options
                const paymentTermsOptions = ['Net 30', 'Net 15', 'COD', 'Net 45'];
                const paymentTerms = paymentTermsOptions[Math.floor(Math.random() * paymentTermsOptions.length)];

                // Create the sale - this will also create/update the lead
                await addSale({
                    dispensaryName,
                    licenseNumber,
                    date: new Date(),
                    paymentTerms,
                    amount: actualAmount,
                    totalAmount: actualAmount,
                    items,
                    commissionEarned: actualAmount * 0.02,
                    userId: repId,
                    userName: repName,
                    representativeId: repId,
                    representativeName: repName,
                    activeBrands
                });

                results.salesCreated++;
                results.totalAmount += actualAmount;

                console.log(`  ✅ Sale ${j + 1} for ${dispensaryName}: $${actualAmount.toFixed(2)}`);
            }

            results.dispensariesCreated++;

            // Progress update every 10 dispensaries
            if ((i + 1) % 10 === 0) {
                console.log(`📈 Progress: ${i + 1}/${actualCount} dispensaries processed`);
                console.log(`  🎯 Milestone reached! ${i + 1} stores now active`);
            }

        } catch (error) {
            console.error(`❌ Error creating data for ${dispensaryName}:`, error);
            results.errors.push({ dispensary: dispensaryName, error: error.message });
        }
    }

    console.log('\n🎉 Test data generation complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Dispensaries created: ${results.dispensariesCreated}`);
    console.log(`💵 Sales created: ${results.salesCreated}`);
    console.log(`💰 Total sales amount: $${results.totalAmount.toFixed(2)}`);
    console.log(`📊 Average sale amount: $${(results.totalAmount / results.salesCreated).toFixed(2)}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (results.errors.length > 0) {
        console.log('\nErrors:', results.errors);
    }

    return results;
}

/**
 * Generate a smaller set of test data for quick testing
 */
export async function generateQuickTestData(repId = 'test-sales-rep', repName = 'Test Sales Rep') {
    return generateTestData(10, 2, repId, repName);
}

/**
 * Check current database state
 */
export async function checkDatabaseState() {
    console.log('🔍 Checking database state...\n');

    const [sales, leads] = await Promise.all([
        getSales(),
        getLeads()
    ]);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 Total Leads: ${leads.length}`);
    console.log(`💵 Total Sales: ${sales.length}`);

    if (sales.length > 0) {
        const totalAmount = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
        console.log(`💰 Total Sales Amount: $${totalAmount.toFixed(2)}`);

        // Count sales with items
        const salesWithItems = sales.filter(s => s.items && s.items.length > 0);
        console.log(`📦 Sales with items: ${salesWithItems.length}`);

        // Sample sale
        console.log('\n📋 Sample Sale:', sales[0]);
    }

    if (leads.length > 0) {
        // Count active leads
        const activeLeads = leads.filter(l => l.leadStatus === 'active' || l.status === 'Sold');
        console.log(`🏪 Active/Sold Leads: ${activeLeads.length}`);

        // Sample lead
        console.log('\n📋 Sample Lead:', leads[0]);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return { sales, leads };
}

/**
 * Cleanup all test data
 * WARNING: This will delete ALL sales, leads, and other transactional data!
 */
export async function cleanupTestData() {
    console.log('⚠️ WARNING: This will delete ALL test data!');
    console.log('🗑️ Cleaning up database...\n');

    const success = await resetDatabase();

    if (success) {
        console.log('✅ Database cleanup complete!');
    } else {
        console.log('❌ Database cleanup failed - some tables may have errors');
    }

    return success;
}

// Export for console use
window.testDataGen = {
    generate: generateTestData,
    quick: generateQuickTestData,
    check: checkDatabaseState,
    cleanup: cleanupTestData
};

console.log('📦 Test Data Generator loaded!');
console.log('Usage:');
console.log('  testDataGen.check()    - Check current database state');
console.log('  testDataGen.quick()    - Generate 10 dispensaries with 20 sales');
console.log('  testDataGen.generate() - Generate 50 dispensaries with 100 sales');
console.log('  testDataGen.cleanup()  - Delete all test data');
