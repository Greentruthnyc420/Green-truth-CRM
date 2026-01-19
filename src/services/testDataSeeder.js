/**
 * Comprehensive CRM Test Data Seeder
 * Creates 20 sales, 20 activations, and tests the full payment flow
 */

import { supabase } from './supabaseClient';

// ===== BRAND DATA WITH PRODUCTS =====
const BRANDS = [
    {
        id: 'honey-king',
        name: '🍯 Honey King',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-01-01',
        products: [
            { name: 'Honey King 1g Pre-Roll', category: 'Pre-roll', price: 25, strain_type: 'Hybrid', thc_content: '28%' },
            { name: 'Honey King Infused 2g', category: 'Pre-roll', price: 45, strain_type: 'Indica', thc_content: '35%' },
            { name: 'Honey King Live Rosin 1g', category: 'Concentrate', price: 80, strain_type: 'Sativa', thc_content: '85%' },
            { name: 'Honey King Flower 3.5g', category: 'Flower', price: 55, strain_type: 'Hybrid', thc_content: '30%' },
        ]
    },
    {
        id: 'bud-cracker',
        name: 'Bud Cracker Boulevard',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-02-15',
        products: [
            { name: 'Bud Cracker Blunt 2g', category: 'Pre-roll', price: 35, strain_type: 'Indica', thc_content: '32%' },
            { name: 'Bud Cracker 5-Pack', category: 'Pre-roll', price: 65, strain_type: 'Hybrid', thc_content: '28%' },
            { name: 'Bud Cracker Shake 7g', category: 'Flower', price: 45, strain_type: 'Sativa', thc_content: '22%' },
        ]
    },
    {
        id: 'canna-dots',
        name: 'Canna Dots',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-03-01',
        products: [
            { name: 'Canna Dots Gummies 100mg', category: 'Edible', price: 30, strain_type: 'Hybrid', thc_content: '100mg' },
            { name: 'Canna Dots Gummies 500mg', category: 'Edible', price: 75, strain_type: 'Indica', thc_content: '500mg' },
            { name: 'Canna Dots Hard Candy', category: 'Edible', price: 25, strain_type: 'Sativa', thc_content: '50mg' },
            { name: 'Canna Dots Chocolate Bar', category: 'Edible', price: 40, strain_type: 'Hybrid', thc_content: '200mg' },
        ]
    },
    {
        id: 'space-poppers',
        name: 'Space Poppers',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-01-20',
        products: [
            { name: 'Space Poppers 0.5g Disposable', category: 'Vape', price: 35, strain_type: 'Sativa', thc_content: '90%' },
            { name: 'Space Poppers 1g Cartridge', category: 'Vape', price: 55, strain_type: 'Indica', thc_content: '88%' },
            { name: 'Space Poppers Pod System', category: 'Vape', price: 45, strain_type: 'Hybrid', thc_content: '85%' },
        ]
    },
    {
        id: 'smoothie-bar',
        name: 'Smoothie Bar',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-04-01',
        products: [
            { name: 'Smoothie Bar Drink 25mg', category: 'Beverage', price: 15, strain_type: 'Hybrid', thc_content: '25mg' },
            { name: 'Smoothie Bar Drink 50mg', category: 'Beverage', price: 25, strain_type: 'Sativa', thc_content: '50mg' },
            { name: 'Smoothie Bar Elixir 100mg', category: 'Beverage', price: 40, strain_type: 'Indica', thc_content: '100mg' },
        ]
    },
    {
        id: 'waferz',
        name: 'Waferz NY',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-05-01',
        products: [
            { name: 'Waferz Chocolate Wafer', category: 'Edible', price: 20, strain_type: 'Hybrid', thc_content: '50mg' },
            { name: 'Waferz Vanilla Stack', category: 'Edible', price: 35, strain_type: 'Indica', thc_content: '100mg' },
            { name: 'Waferz Party Pack', category: 'Edible', price: 60, strain_type: 'Sativa', thc_content: '250mg' },
        ]
    },
    {
        id: 'pines',
        name: 'Pines',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-06-01',
        products: [
            { name: 'Pines OG Flower 3.5g', category: 'Flower', price: 50, strain_type: 'Indica', thc_content: '29%' },
            { name: 'Pines Sativa 7g', category: 'Flower', price: 85, strain_type: 'Sativa', thc_content: '26%' },
            { name: 'Pines Kief 1g', category: 'Concentrate', price: 40, strain_type: 'Hybrid', thc_content: '45%' },
        ]
    },
    {
        id: 'flx-extracts',
        name: 'FLX Extracts',
        status: 'active',
        commission_rate: 5,
        contract_start: '2024-01-01',
        products: [
            { name: 'FLX Live Resin 1g', category: 'Concentrate', price: 65, strain_type: 'Sativa', thc_content: '82%' },
            { name: 'FLX Sugar Wax 1g', category: 'Concentrate', price: 55, strain_type: 'Indica', thc_content: '78%' },
            { name: 'FLX Diamonds 0.5g', category: 'Concentrate', price: 80, strain_type: 'Hybrid', thc_content: '95%' },
            { name: 'FLX Badder 1g', category: 'Concentrate', price: 60, strain_type: 'Sativa', thc_content: '80%' },
        ]
    }
];

// ===== NYC DISPENSARIES =====
const NYC_DISPENSARIES = [
    { name: 'Green Leaf NYC', address: '123 Broadway, Manhattan, NY 10001', borough: 'Manhattan', license: 'OCM-2024-001' },
    { name: 'Brooklyn Buds', address: '456 Atlantic Ave, Brooklyn, NY 11217', borough: 'Brooklyn', license: 'OCM-2024-002' },
    { name: 'Queens Cannabis Co', address: '789 Queens Blvd, Elmhurst, NY 11373', borough: 'Queens', license: 'OCM-2024-003' },
    { name: 'Bronx Botanicals', address: '321 Grand Concourse, Bronx, NY 10451', borough: 'Bronx', license: 'OCM-2024-004' },
    { name: 'Staten Island Green', address: '555 Victory Blvd, Staten Island, NY 10301', borough: 'Staten Island', license: 'OCM-2024-005' },
    { name: 'Harlem Heights', address: '125th St & Lenox Ave, Harlem, NY 10027', borough: 'Manhattan', license: 'OCM-2024-006' },
    { name: 'Williamsburg Wellness', address: '200 Bedford Ave, Brooklyn, NY 11249', borough: 'Brooklyn', license: 'OCM-2024-007' },
    { name: 'Astoria Apothecary', address: '30-15 Steinway St, Astoria, NY 11103', borough: 'Queens', license: 'OCM-2024-008' },
    { name: 'Fordham Flora', address: '2500 Grand Concourse, Bronx, NY 10458', borough: 'Bronx', license: 'OCM-2024-009' },
    { name: 'Chelsea Chronic', address: '222 W 23rd St, Manhattan, NY 10011', borough: 'Manhattan', license: 'OCM-2024-010' },
    { name: 'Bushwick Botanical', address: '999 Myrtle Ave, Brooklyn, NY 11206', borough: 'Brooklyn', license: 'OCM-2024-011' },
    { name: 'Flushing Fields', address: '135-15 Roosevelt Ave, Flushing, NY 11354', borough: 'Queens', license: 'OCM-2024-012' },
    { name: 'Riverdale Remedies', address: '5600 Broadway, Bronx, NY 10471', borough: 'Bronx', license: 'OCM-2024-013' },
    { name: 'SoHo Sativa', address: '100 Spring St, Manhattan, NY 10012', borough: 'Manhattan', license: 'OCM-2024-014' },
    { name: 'Park Slope Pot', address: '350 5th Ave, Brooklyn, NY 11215', borough: 'Brooklyn', license: 'OCM-2024-015' },
    { name: 'Jamaica Bay Joint', address: '150-10 Jamaica Ave, Jamaica, NY 11432', borough: 'Queens', license: 'OCM-2024-016' },
    { name: 'Mott Haven Market', address: '400 E 138th St, Bronx, NY 10454', borough: 'Bronx', license: 'OCM-2024-017' },
    { name: 'Lower East Side Leaf', address: '50 Clinton St, Manhattan, NY 10002', borough: 'Manhattan', license: 'OCM-2024-018' },
    { name: 'Crown Heights Cannabis', address: '800 Eastern Pkwy, Brooklyn, NY 11213', borough: 'Brooklyn', license: 'OCM-2024-019' },
    { name: 'Long Island City Leaf', address: '10-15 Jackson Ave, LIC, NY 11101', borough: 'Queens', license: 'OCM-2024-020' },
];

// ===== HELPER FUNCTIONS =====

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomProducts(brand, count) {
    const shuffled = [...brand.products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateSaleItems(brands, minBrands = 3, maxBrands = 5) {
    // Pick random number of brands
    const numBrands = randomBetween(minBrands, maxBrands);
    const shuffledBrands = [...brands].sort(() => 0.5 - Math.random()).slice(0, numBrands);

    const items = [];
    let total = 0;

    for (const brand of shuffledBrands) {
        // Pick 1-3 products from this brand
        const numProducts = randomBetween(1, 3);
        const products = getRandomProducts(brand, numProducts);

        for (const product of products) {
            // Space Poppers requires minimum 3 cases per product
            const minCases = brand.id === 'space-poppers' ? 3 : 5;
            const quantity = randomBetween(minCases, 20); // Case quantity
            const lineTotal = product.price * quantity;
            total += lineTotal;

            items.push({
                productName: product.name,
                product: product.name,
                brandId: brand.id,
                brandName: brand.name,
                category: product.category,
                price: product.price,
                quantity: quantity,
                lineTotal: lineTotal
            });
        }
    }

    return { items, total };
}

// ===== MAIN SEEDING FUNCTIONS =====

export async function seedBrandsAndProducts() {
    console.log('🌱 Seeding brands and products...');

    // Seed brands
    for (const brand of BRANDS) {
        const { products, ...brandData } = brand;

        // Insert brand
        const { error: brandError } = await supabase
            .from('brands')
            .upsert({
                ...brandData,
                contacts: JSON.stringify([]),
            }, { onConflict: 'id' });

        if (brandError) console.error('Brand insert error:', brandData.name, brandError);

        // Insert products
        for (const product of products) {
            const { error: productError } = await supabase
                .from('products')
                .upsert({
                    brand_id: brand.id,
                    brand_name: brand.name,
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    strain_type: product.strain_type,
                    thc_content: product.thc_content,
                    quantity: randomBetween(50, 200), // Initial stock
                    in_stock: true
                }, { onConflict: 'id' });

            if (productError) console.error('Product insert error:', product.name, productError);
        }
    }

    console.log('✅ Brands and products seeded');
    return { success: true, brands: BRANDS.length, products: BRANDS.reduce((sum, b) => sum + b.products.length, 0) };
}

export async function seedDispensaries(repId = 'marcus-johnson') {
    console.log('🏪 Seeding 20 dispensaries...');

    const dispensaries = [];

    for (let i = 0; i < NYC_DISPENSARIES.length; i++) {
        const disp = NYC_DISPENSARIES[i];

        const dispensary = {
            dispensary_name: disp.name,
            address: disp.address,
            license_number: disp.license,
            lead_status: 'active',
            priority: 'Normal',
            assigned_ambassador_id: repId,
            rep_assigned_name: 'Marcus Johnson',
            contacts: [],
            samples_requested: [],
            active_brands: []
        };

        const { data, error } = await supabase
            .from('leads')
            .insert(dispensary)
            .select()
            .single();

        if (error) {
            console.error('Dispensary insert error:', disp.name, error);
        } else {
            dispensaries.push(data);
            console.log(`  ✅ Created: ${disp.name}`);
        }
    }

    console.log(`✅ Created ${dispensaries.length} dispensaries`);
    return dispensaries;
}

export async function seedSales(dispensaries, repId = 'marcus-johnson') {
    console.log('💰 Creating 20 sales...');

    const sales = [];

    for (let i = 0; i < dispensaries.length; i++) {
        const dispensary = dispensaries[i];
        const { items, total } = generateSaleItems(BRANDS);

        // Minimum order is $1000
        const adjustedTotal = Math.max(total, 1000);

        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - randomBetween(0, 30)); // Random date in last 30 days

        const sale = {
            dispensary_id: dispensary.id,
            dispensary_name: dispensary.dispensary_name,
            rep_id: repId,
            products: items, // JSONB column
            total_amount: adjustedTotal,
            commission_rate: 0.02, // 2% stored as decimal
            status: 'completed',
            sale_date: saleDate.toISOString(),
            brand_id: items[0]?.brandId || 'honey-king',
            brand_name: items[0]?.brandName || 'Honey King'
        };

        const { data, error } = await supabase
            .from('sales')
            .insert(sale)
            .select()
            .single();

        if (error) {
            console.error('Sale insert error:', error);
        } else {
            sales.push(data);
            console.log(`  ✅ Sale #${i + 1}: $${adjustedTotal.toFixed(2)} at ${dispensary.dispensary_name} (${items.length} items, ${new Set(items.map(it => it.brandId)).size} brands)`);
        }
    }

    console.log(`✅ Created ${sales.length} sales worth $${sales.reduce((sum, s) => sum + s.total_amount, 0).toFixed(2)}`);
    return sales;
}

export async function seedActivations(dispensaries, repId = 'marcus-johnson') {
    console.log('🎯 Creating 20 activations...');

    const activations = [];

    for (let i = 0; i < dispensaries.length; i++) {
        const dispensary = dispensaries[i];

        // Randomly select a brand for this activation
        const brand = randomFromArray(BRANDS);

        // Variable hours (2-5), mileage (10-50), tolls ($0-$25)
        const hours = randomBetween(2, 5);
        const mileage = randomBetween(10, 50);
        const tolls = randomBetween(0, 5) * 5; // $0, $5, $10, $15, $20, $25

        // Calculate activation fee based on hours + mileage + tolls
        const baseRate = 50; // $50/hour
        const mileageRate = 0.725; // Full IRS rate
        const activationFee = (hours * baseRate) + (mileage * mileageRate) + tolls;

        const activationDate = new Date();
        activationDate.setDate(activationDate.getDate() - randomBetween(0, 30));

        const activation = {
            dispensary_id: dispensary.id,
            dispensary_name: dispensary.dispensary_name,
            brand_id: brand.id,
            brand_name: brand.name,
            rep_id: repId,
            rep_name: 'Marcus Johnson',
            activation_date: activationDate.toISOString().split('T')[0],
            activation_type: 'walk-in',
            total_hours: hours,
            miles_traveled: mileage,
            toll_amount: tolls,
            has_vehicle: mileage > 20,
            region: 'NYC',
            status: 'completed',
            notes: `In-store activation at ${dispensary.dispensary_name} featuring ${brand.name} products. Hours: ${hours}, Miles: ${mileage}, Tolls: $${tolls}`
        };

        const { data, error } = await supabase
            .from('activations')
            .insert(activation)
            .select()
            .single();

        if (error) {
            console.error('Activation insert error:', error);
        } else {
            activations.push(data);
            console.log(`  ✅ Activation #${i + 1}: ${hours}hrs at ${dispensary.dispensary_name} (${brand.name}) - $${activationFee.toFixed(2)}`);
        }
    }

    console.log(`✅ Created ${activations.length} activations (${activations.reduce((sum, a) => sum + (a.total_hours || 0), 0)} total hours)`);
    return activations;
}

// ===== MAIN TEST RUNNER =====

export async function runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive CRM Test...\n');

    const results = {
        success: true,
        brands: 0,
        products: 0,
        dispensaries: 0,
        sales: 0,
        salesTotal: 0,
        activations: 0,
        activationsTotal: 0
    };

    try {
        // Phase 1: Seed brands and products
        console.log('\n📦 PHASE 1: BRANDS & PRODUCTS');
        console.log('='.repeat(40));
        const brandResult = await seedBrandsAndProducts();
        results.brands = brandResult.brands;
        results.products = brandResult.products;

        // Phase 2: Seed dispensaries
        console.log('\n🏪 PHASE 2: DISPENSARIES');
        console.log('='.repeat(40));
        const dispensaries = await seedDispensaries();
        results.dispensaries = dispensaries.length;

        // Phase 3: Seed sales
        console.log('\n💰 PHASE 3: SALES');
        console.log('='.repeat(40));
        const sales = await seedSales(dispensaries);
        results.sales = sales.length;
        results.salesTotal = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

        // Phase 4: Seed activations
        console.log('\n🎯 PHASE 4: ACTIVATIONS');
        console.log('='.repeat(40));
        const activations = await seedActivations(dispensaries);
        results.activations = activations.length;
        results.activationsTotal = activations.reduce((sum, a) => sum + (a.total_hours || 0), 0);

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 COMPREHENSIVE TEST COMPLETE');
        console.log('='.repeat(50));
        console.log(`✅ Brands seeded: ${results.brands}`);
        console.log(`✅ Products seeded: ${results.products}`);
        console.log(`✅ Dispensaries created: ${results.dispensaries}`);
        console.log(`✅ Sales logged: ${results.sales} (Total: $${results.salesTotal.toFixed(2)})`);
        console.log(`✅ Activations logged: ${results.activations} (${results.activationsTotal} hours)`);
        console.log(`💵 Total Sales: $${results.salesTotal.toFixed(2)}`);

    } catch (error) {
        console.error('❌ Test failed:', error);
        results.success = false;
        results.error = error.message;
    }

    return results;
}

export default { runComprehensiveTest, seedBrandsAndProducts, seedDispensaries, seedSales, seedActivations };
