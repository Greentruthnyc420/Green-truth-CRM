/**
 * Quick script to create test orders for all brands
 * Run this in the browser console after logging in as admin
 */

const BRANDS = [
    {
        id: 'honey-king',
        name: '🍯 Honey King',
        products: [
            { name: 'Honey King 1g Pre-Roll', price: 25 },
            { name: 'Honey King Infused 2g', price: 45 },
            { name: 'Honey King Live Rosin 1g', price: 80 },
            { name: 'Honey King Flower 3.5g', price: 55 },
        ]
    },
    {
        id: 'bud-cracker',
        name: 'Bud Cracker Boulevard',
        products: [
            { name: 'Bud Cracker Blunt 2g', price: 35 },
            { name: 'Bud Cracker 5-Pack', price: 65 },
            { name: 'Bud Cracker Shake 7g', price: 45 },
        ]
    },
    {
        id: 'canna-dots',
        name: 'Canna Dots',
        products: [
            { name: 'Canna Dots Gummies 100mg', price: 30 },
            { name: 'Canna Dots Gummies 500mg', price: 75 },
            { name: 'Canna Dots Hard Candy', price: 25 },
            { name: 'Canna Dots Chocolate Bar', price: 40 },
        ]
    },
    {
        id: 'space-poppers',
        name: 'Space Poppers',
        products: [
            { name: 'Space Poppers 0.5g Disposable', price: 35 },
            { name: 'Space Poppers 1g Cartridge', price: 55 },
            { name: 'Space Poppers Pod System', price: 45 },
        ]
    },
    {
        id: 'smoothie-bar',
        name: 'Smoothie Bar',
        products: [
            { name: 'Smoothie Bar Drink 25mg', price: 15 },
            { name: 'Smoothie Bar Drink 50mg', price: 25 },
            { name: 'Smoothie Bar Elixir 100mg', price: 40 },
        ]
    },
    {
        id: 'waferz',
        name: 'Waferz NY',
        products: [
            { name: 'Waferz Chocolate Wafer', price: 20 },
            { name: 'Waferz Vanilla Stack', price: 35 },
            { name: 'Waferz Party Pack', price: 60 },
        ]
    },
    {
        id: 'pines',
        name: 'Pines',
        products: [
            { name: 'Pines OG Flower 3.5g', price: 50 },
            { name: 'Pines Sativa 7g', price: 85 },
            { name: 'Pines Kief 1g', price: 40 },
        ]
    },
    {
        id: 'flx-extracts',
        name: 'FLX Extracts',
        products: [
            { name: 'FLX Live Resin 1g', price: 65 },
            { name: 'FLX Sugar Wax 1g', price: 55 },
            { name: 'FLX Diamonds 0.5g', price: 80 },
            { name: 'FLX Badder 1g', price: 60 },
        ]
    }
];

async function createTestOrders() {
    const { supabase } = await import('/src/services/supabaseClient.js');

    for (const brand of BRANDS) {
        const items = brand.products.map(p => ({
            productName: p.name,
            product: p.name,
            brandId: brand.id,
            brandName: brand.name,
            price: p.price,
            quantity: 5,
            lineTotal: p.price * 5
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

        const { data, error } = await supabase.from('sales').insert([{
            dispensary_name: 'Green Leaf NYC',
            dispensary_id: 'green-leaf-nyc',
            brand_id: brand.id,
            brand_name: brand.name,
            rep_id: 'admin-dev',
            rep_name: 'Omar Elsayed',
            items: items,
            total_amount: totalAmount,
            commission_earned: totalAmount * 0.02,
            status: 'pending',
            payment_status: 'unpaid',
            sale_date: new Date().toISOString(),
            created_at: new Date().toISOString()
        }]).select();

        if (error) console.error(`❌ ${brand.name}:`, error);
        else console.log(`✅ ${brand.name}: $${totalAmount}`);
    }
    console.log('🎉 All orders created!');
}

createTestOrders();
