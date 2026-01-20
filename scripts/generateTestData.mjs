/**
 * Test Data Generator - 6 Months Historical Data
 * Generates realistic test data for all workflows:
 * - Leads → Sales → Orders → Invoices → Payments
 * - Activations → Rep Payments
 * - Brand Deals & Menus
 */

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, writeBatch, doc, getDocs, setDoc } from 'firebase/firestore';

// Firebase config from .env
const firebaseConfig = {
    apiKey: "AIzaSyBH6GDjv4n-lbJSEMal0XQwL3xvssJeQc4",
    authDomain: "the-green-truth-nyc-database.firebaseapp.com",
    projectId: "the-green-truth-nyc-database",
    storageBucket: "the-green-truth-nyc-database.firebasestorage.app",
    messagingSenderId: "369652835306",
    appId: "1:369652835306:web:d9a7fd0201bf2c3c5c4893"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}
const db = getFirestore(app);

// ========== Data Templates ==========

const BRANDS = [
    { id: 'brand-jusbud', name: 'JUSBUD', contactEmail: 'info@jusbud.com' },
    { id: 'brand-nativa', name: 'Nativa', contactEmail: 'info@nativa.com' },
    { id: 'brand-greenleaf', name: 'GreenLeaf Labs', contactEmail: 'sales@greenleaf.com' },
    { id: 'brand-cloudnine', name: 'Cloud Nine', contactEmail: 'hello@cloudnine.com' },
    { id: 'brand-earthly', name: 'Earthly Delights', contactEmail: 'contact@earthly.com' }
];

const DISPENSARIES = [
    { id: 'disp-greenway', name: 'Greenway Cannabis', address: '420 Broadway, New York, NY 10012', licenseNumber: 'OCM-2024-001', paymentTerms: 'NET15' },
    { id: 'disp-highline', name: 'Highline Dispensary', address: '123 High St, Brooklyn, NY 11201', licenseNumber: 'OCM-2024-002', paymentTerms: 'NET30' },
    { id: 'disp-empire', name: 'Empire State Cannabis', address: '555 Empire Blvd, Queens, NY 11375', licenseNumber: 'OCM-2024-003', paymentTerms: 'COD' },
    { id: 'disp-leaf', name: 'Leaf & Co', address: '789 Leaf Lane, Bronx, NY 10451', licenseNumber: 'OCM-2024-004', paymentTerms: 'NET15' },
    { id: 'disp-uplift', name: 'Uplift Wellness', address: '321 Wellness Way, Staten Island, NY 10301', licenseNumber: 'OCM-2024-005', paymentTerms: 'NET30' },
    { id: 'disp-botanical', name: 'Botanical Gardens', address: '156 Garden Ave, Manhattan, NY 10011', licenseNumber: 'OCM-2024-006', paymentTerms: 'NET15' },
    { id: 'disp-horizon', name: 'Horizon Collective', address: '888 Horizon Rd, Brooklyn, NY 11215', licenseNumber: 'OCM-2024-007', paymentTerms: 'COD' },
    { id: 'disp-sunrise', name: 'Sunrise Dispensary', address: '42 Sunrise Blvd, Queens, NY 11354', licenseNumber: 'OCM-2024-008', paymentTerms: 'NET30' }
];

const SALES_REPS = [
    { id: 'rep-alex', name: 'Alex Thompson', email: 'alex@greentruth.com' },
    { id: 'rep-jordan', name: 'Jordan Rivera', email: 'jordan@greentruth.com' },
    { id: 'rep-casey', name: 'Casey Martinez', email: 'casey@greentruth.com' },
    { id: 'rep-morgan', name: 'Morgan Lee', email: 'morgan@greentruth.com' },
    { id: 'rep-taylor', name: 'Taylor Chen', email: 'taylor@greentruth.com' }
];

const PRODUCTS = [
    { name: 'Premium Flower 3.5g', price: 45, category: 'flower' },
    { name: 'Premium Flower 7g', price: 85, category: 'flower' },
    { name: 'Live Resin Cartridge', price: 55, category: 'vape' },
    { name: 'Distillate Cartridge', price: 40, category: 'vape' },
    { name: 'Infused Pre-Rolls 5pk', price: 35, category: 'preroll' },
    { name: 'Gummy Edibles 10pk', price: 30, category: 'edible' },
    { name: 'Chocolate Bar 100mg', price: 25, category: 'edible' },
    { name: 'Tincture 1000mg', price: 60, category: 'tincture' },
    { name: 'Concentrate 1g', price: 50, category: 'concentrate' },
    { name: 'Topical Cream', price: 35, category: 'topical' }
];

// Helper functions
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDateInRange(monthsAgo) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - monthsAgo);
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() - (monthsAgo > 0 ? monthsAgo - 1 : 0));

    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    return new Date(randomTime);
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// ========== Data Generators ==========

async function generateLeads() {
    console.log('Generating leads...');
    const leads = [];

    for (let month = 6; month >= 0; month--) {
        const leadsPerMonth = randomBetween(8, 15);
        for (let i = 0; i < leadsPerMonth; i++) {
            const date = generateDateInRange(month);
            const brand = randomItem(BRANDS);
            const rep = randomItem(SALES_REPS);

            const statuses = ['prospect', 'samples_requested', 'samples_delivered', 'active', 'inactive'];
            const weights = month > 3 ? [0.1, 0.1, 0.2, 0.5, 0.1] : [0.3, 0.2, 0.2, 0.2, 0.1];
            let random = Math.random();
            let statusIdx = 0;
            let cumulative = 0;
            for (let j = 0; j < weights.length; j++) {
                cumulative += weights[j];
                if (random < cumulative) {
                    statusIdx = j;
                    break;
                }
            }

            leads.push({
                dispensaryName: `${randomItem(['Green', 'High', 'Leaf', 'Cloud', 'Sun', 'Moon', 'Earth', 'Sky'])} ${randomItem(['Wellness', 'Dispensary', 'Cannabis', 'Collective', 'Shop'])} ${randomBetween(1, 99)}`,
                address: `${randomBetween(100, 999)} ${randomItem(['Main', 'Oak', 'Cannabis', 'Green', 'High'])} St, ${randomItem(['New York', 'Brooklyn', 'Queens'])} NY ${randomBetween(10001, 11299)}`,
                licenseNumber: `OCM-${2024}-${String(randomBetween(100, 999))}`,
                leadStatus: statuses[statusIdx],
                ownerBrandId: brand.id,
                brandName: brand.name,
                createdBy: rep.id,
                createdByName: rep.name,
                createdAt: Timestamp.fromDate(date),
                meetingDate: formatDate(date),
                contacts: [{ name: `Contact ${randomBetween(1, 100)}`, role: 'Manager', email: `contact${randomBetween(1, 100)}@example.com`, phone: `555-${randomBetween(1000, 9999)}` }]
            });
        }
    }

    const batch = writeBatch(db);
    for (const lead of leads) {
        const docRef = doc(collection(db, 'leads'));
        batch.set(docRef, lead);
    }
    await batch.commit();
    console.log(`Created ${leads.length} leads`);
    return leads;
}

async function generateSales() {
    console.log('Generating sales...');
    const sales = [];

    for (let month = 6; month >= 0; month--) {
        const salesPerMonth = randomBetween(15, 30);
        for (let i = 0; i < salesPerMonth; i++) {
            const date = generateDateInRange(month);
            const dispensary = randomItem(DISPENSARIES);
            const brand = randomItem(BRANDS);
            const rep = randomItem(SALES_REPS);

            const itemCount = randomBetween(2, 6);
            const items = [];
            let subtotal = 0;

            for (let j = 0; j < itemCount; j++) {
                const product = randomItem(PRODUCTS);
                const qty = randomBetween(1, 10);
                items.push({
                    name: product.name,
                    price: product.price,
                    quantity: qty,
                    brandId: brand.id,
                    brandName: brand.name
                });
                subtotal += product.price * qty;
            }

            const statuses = ['pending', 'accepted', 'fulfilled', 'delivered', 'paid'];
            const statusWeights = month > 3 ? [0.05, 0.05, 0.1, 0.3, 0.5] : [0.2, 0.2, 0.2, 0.2, 0.2];
            let random = Math.random();
            let statusIdx = 0;
            let cumulative = 0;
            for (let k = 0; k < statusWeights.length; k++) {
                cumulative += statusWeights[k];
                if (random < cumulative) {
                    statusIdx = k;
                    break;
                }
            }

            const commissionRate = 0.02;
            const commission = subtotal * commissionRate;

            sales.push({
                dispensaryId: dispensary.id,
                dispensaryName: dispensary.name,
                dispensaryAddress: dispensary.address,
                licenseNumber: dispensary.licenseNumber,
                paymentTerms: dispensary.paymentTerms,
                items,
                subtotal,
                totalAmount: subtotal,
                status: statuses[statusIdx],
                date: Timestamp.fromDate(date),
                createdAt: Timestamp.fromDate(date),
                userId: rep.id,
                userName: rep.name,
                representativeName: rep.name,
                commissionEarned: commission,
                brandId: brand.id,
                brandName: brand.name
            });
        }
    }

    // Batch write (max 500 per batch)
    for (let i = 0; i < sales.length; i += 450) {
        const batch = writeBatch(db);
        const slice = sales.slice(i, i + 450);
        for (const sale of slice) {
            const docRef = doc(collection(db, 'sales'));
            batch.set(docRef, sale);
        }
        await batch.commit();
    }
    console.log(`Created ${sales.length} sales`);
    return sales;
}

async function generateActivations() {
    console.log('Generating activations...');
    const activations = [];

    for (let month = 6; month >= 0; month--) {
        const activationsPerMonth = randomBetween(20, 40);
        for (let i = 0; i < activationsPerMonth; i++) {
            const date = generateDateInRange(month);
            const dispensary = randomItem(DISPENSARIES);
            const brand = randomItem(BRANDS);
            const rep = randomItem(SALES_REPS);

            const types = ['popup', 'demo', 'training', 'promotional'];
            const statuses = ['Requested', 'Confirmed', 'Completed', 'rep_paid'];
            const statusWeights = month > 3 ? [0.05, 0.1, 0.35, 0.5] : [0.25, 0.25, 0.25, 0.25];
            let random = Math.random();
            let statusIdx = 0;
            let cumulative = 0;
            for (let k = 0; k < statusWeights.length; k++) {
                cumulative += statusWeights[k];
                if (random < cumulative) {
                    statusIdx = k;
                    break;
                }
            }

            const hoursWorked = randomBetween(3, 8);
            const hourlyRate = 25;
            const milesTraveled = randomBetween(5, 50);
            const tollAmount = randomBetween(0, 20);

            activations.push({
                storeName: dispensary.name,
                storeId: dispensary.id,
                address: dispensary.address,
                brandId: brand.id,
                brandName: brand.name,
                repId: rep.id,
                repName: rep.name,
                type: randomItem(types),
                status: statuses[statusIdx],
                date: formatDate(date),
                startTime: '10:00',
                endTime: `${10 + hoursWorked}:00`,
                hoursWorked,
                hourlyRate,
                milesTraveled,
                tollAmount,
                totalPay: (hoursWorked * hourlyRate) + (milesTraveled * 0.67) + tollAmount,
                createdAt: Timestamp.fromDate(date),
                notes: `Activation at ${dispensary.name} for ${brand.name}`
            });
        }
    }

    for (let i = 0; i < activations.length; i += 450) {
        const batch = writeBatch(db);
        const slice = activations.slice(i, i + 450);
        for (const activation of slice) {
            const docRef = doc(collection(db, 'activations'));
            batch.set(docRef, activation);
        }
        await batch.commit();
    }
    console.log(`Created ${activations.length} activations`);
    return activations;
}

async function generateInvoices(sales) {
    console.log('Generating invoices from sales...');
    const invoices = [];

    // Create invoices from delivered/paid sales
    const paidSales = sales.filter(s => s.status === 'delivered' || s.status === 'paid');

    for (const sale of paidSales) {
        const dueDate = new Date(sale.date.toDate());
        dueDate.setDate(dueDate.getDate() + (sale.paymentTerms === 'NET30' ? 30 : sale.paymentTerms === 'NET15' ? 15 : 0));

        invoices.push({
            saleId: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            dispensaryId: sale.dispensaryId,
            dispensaryName: sale.dispensaryName,
            brandId: sale.brandId,
            brandName: sale.brandName,
            items: sale.items,
            subtotal: sale.subtotal,
            total: sale.totalAmount,
            status: sale.status === 'paid' ? 'paid' : Math.random() > 0.5 ? 'paid' : 'pending',
            createdAt: sale.createdAt,
            dueDate: Timestamp.fromDate(dueDate),
            paymentTerms: sale.paymentTerms,
            invoiceNumber: `INV-${new Date(sale.date.toDate()).getFullYear()}-${String(randomBetween(1000, 9999))}`
        });
    }

    for (let i = 0; i < invoices.length; i += 450) {
        const batch = writeBatch(db);
        const slice = invoices.slice(i, i + 450);
        for (const invoice of slice) {
            const docRef = doc(collection(db, 'invoices'));
            batch.set(docRef, invoice);
        }
        await batch.commit();
    }
    console.log(`Created ${invoices.length} invoices`);
    return invoices;
}

async function generatePaymentHistory() {
    console.log('Generating payment history...');
    const payments = [];

    // Generate rep payment history
    for (const rep of SALES_REPS) {
        for (let month = 6; month >= 1; month--) {
            const date = generateDateInRange(month);

            payments.push({
                repId: rep.id,
                repName: rep.name,
                amount: randomBetween(150, 800),
                payPeriod: `${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(new Date(date).setDate(new Date(date).getDate() + 14)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                activationIds: [`act-${randomBetween(1000, 9999)}`, `act-${randomBetween(1000, 9999)}`],
                paidBy: 'admin-omar',
                paidAt: Timestamp.fromDate(date),
                type: 'wages'
            });
        }
    }

    const batch = writeBatch(db);
    for (const payment of payments) {
        const docRef = doc(collection(db, 'payment_history'));
        batch.set(docRef, payment);
    }
    await batch.commit();
    console.log(`Created ${payments.length} payment history records`);
    return payments;
}

async function generateDeals() {
    console.log('Generating brand deals...');
    const deals = [];

    for (const brand of BRANDS) {
        // Create 2-4 deals per brand
        const dealCount = randomBetween(2, 4);
        for (let i = 0; i < dealCount; i++) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - randomBetween(0, 3));
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + randomBetween(1, 3));

            deals.push({
                brandId: brand.id,
                brandName: brand.name,
                title: `${randomItem(['Flash', 'Summer', 'Holiday', 'Launch', 'VIP'])} ${randomItem(['Sale', 'Deal', 'Promo', 'Special'])}`,
                description: `Get ${randomBetween(10, 30)}% off select products`,
                discountType: randomItem(['percentage', 'fixed', 'tiered']),
                discountValue: randomBetween(10, 25),
                minOrderAmount: randomBetween(100, 500),
                startDate: Timestamp.fromDate(startDate),
                endDate: Timestamp.fromDate(endDate),
                status: Math.random() > 0.2 ? 'active' : 'expired',
                createdAt: Timestamp.fromDate(startDate),
                applicableProducts: ['all']
            });
        }
    }

    const batch = writeBatch(db);
    for (const deal of deals) {
        const docRef = doc(collection(db, 'brand_deals'));
        batch.set(docRef, deal);
    }
    await batch.commit();
    console.log(`Created ${deals.length} deals`);
    return deals;
}

async function generateBrandMenus() {
    console.log('Generating brand menus...');

    for (const brand of BRANDS) {
        const menuItems = [];
        const productCategories = ['flower', 'vape', 'edible', 'preroll', 'concentrate'];

        for (const category of productCategories) {
            const itemCount = randomBetween(3, 6);
            for (let i = 0; i < itemCount; i++) {
                const basePrice = category === 'flower' ? randomBetween(30, 80) :
                    category === 'vape' ? randomBetween(35, 60) :
                        category === 'edible' ? randomBetween(20, 40) :
                            category === 'preroll' ? randomBetween(25, 45) :
                                randomBetween(40, 70);

                menuItems.push({
                    id: `${brand.id}-${category}-${i}`,
                    name: `${brand.name} ${category.charAt(0).toUpperCase() + category.slice(1)} ${randomItem(['Premium', 'Classic', 'Gold', 'Platinum'])} ${randomItem(['OG', 'Haze', 'Kush', 'Dream', 'Cloud'])}`,
                    category,
                    price: basePrice,
                    thcContent: `${randomBetween(18, 32)}%`,
                    cbdContent: `${randomBetween(0, 5)}%`,
                    description: `High-quality ${category} from ${brand.name}`,
                    inStock: Math.random() > 0.1,
                    imageUrl: null,
                    createdAt: Timestamp.now()
                });
            }
        }

        await setDoc(doc(db, 'brand_menus', brand.id), {
            brandId: brand.id,
            brandName: brand.name,
            items: menuItems,
            updatedAt: Timestamp.now()
        });
    }
    console.log(`Created menus for ${BRANDS.length} brands`);
}

async function generateDispensaryProfiles() {
    console.log('Generating dispensary profiles...');

    for (const dispensary of DISPENSARIES) {
        await setDoc(doc(db, 'dispensary_profiles', dispensary.id), {
            dispensaryId: dispensary.id,
            dispensaryName: dispensary.name,
            name: dispensary.name,
            address: dispensary.address,
            licenseNumber: dispensary.licenseNumber,
            paymentTerms: dispensary.paymentTerms,
            contactEmail: `contact@${dispensary.name.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: `555-${randomBetween(1000, 9999)}`,
            createdAt: Timestamp.now(),
            isVerified: true
        });
    }
    console.log(`Created ${DISPENSARIES.length} dispensary profiles`);
}

// ========== Main Execution ==========

async function generateAllTestData() {
    console.log('========================================');
    console.log('Starting 6-Month Test Data Generation');
    console.log('========================================\n');

    try {
        // Generate in order of dependencies
        await generateDispensaryProfiles();
        await generateBrandMenus();
        const leads = await generateLeads();
        const sales = await generateSales();
        await generateActivations();
        await generateInvoices(sales);
        await generatePaymentHistory();
        await generateDeals();

        console.log('\n========================================');
        console.log('Test Data Generation Complete!');
        console.log('========================================');
        console.log('\nSummary:');
        console.log('- 8 Dispensary Profiles');
        console.log('- 5 Brand Menus');
        console.log('- ~70-100 Leads');
        console.log('- ~100-200 Sales');
        console.log('- ~150-280 Activations');
        console.log('- Corresponding Invoices');
        console.log('- ~30 Payment History Records');
        console.log('- ~10-20 Brand Deals');

    } catch (error) {
        console.error('Error generating test data:', error);
        throw error;
    }
}

// Run the generator
generateAllTestData()
    .then(() => {
        console.log('\nDone! You can now test the app with 6 months of data.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to generate test data:', error);
        process.exit(1);
    });
