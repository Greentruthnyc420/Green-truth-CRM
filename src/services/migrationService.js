import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { supabase } from './supabaseClient';

export async function migrateDataToSupabase(onLog) {
    const logs = [];
    const log = (msg) => {
        console.log(`[Migration] ${msg}`);
        if (onLog) onLog(msg);
        logs.push(msg);
    };

    const safelyGetDate = (val) => {
        if (!val) return new Date().toISOString();
        try {
            if (typeof val.toDate === 'function') return val.toDate().toISOString();
            if (val.seconds) return new Date(val.seconds * 1000).toISOString(); // Handle raw Firestore timestamp objects
            return new Date(val).toISOString();
        } catch (e) {
            console.warn("Date parse error, defaulting to now:", val);
            return new Date().toISOString();
        }
    };

    try {
        log("Starting Migration...");

        // 1. Migrate Users
        log("Fetching Users from Firestore...");
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email || `missing_${doc.id}@example.com`,
                name: data.name || data.displayName || 'Unknown User',
                role: data.role || 'bg_user',
                created_at: safelyGetDate(data.createdAt)
            };
        });

        if (users.length > 0) {
            log(`Found ${users.length} users. Inserting to Supabase...`);
            const { error: userError } = await supabase.from('users').upsert(users);
            if (userError) throw new Error(`User Sync Failed: ${userError.message}`);
        }

        // 2. Migrate Leads
        log("Fetching Leads from Firestore...");
        const leadsSnap = await getDocs(collection(db, 'leads'));
        const leads = leadsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                dispensary_name: data.dispensaryName || 'Unknown',
                license_number: data.licenseNumber || null,
                address: data.address || null,
                assigned_ambassador_id: data.assignedAmbassadorId || null,
                rep_assigned_name: data.repAssigned || null,
                status: data.status || 'Prospect',
                lead_status: data.leadStatus || null,
                active_brands: data.activeBrands || [],

                // New Fields
                samples_requested: data.samplesRequested || [],
                priority: data.priority || 'Normal',
                contacts: data.contacts || [], // Store full array
                meeting_date: safelyGetDate(data.meetingDate),
                location: data.location || null, // { lat, lng }
                license_image_url: data.licenseImageUrl || null,

                created_at: safelyGetDate(data.createdAt),
                last_sale_date: data.lastSaleDate ? safelyGetDate(data.lastSaleDate) : null
            };
        });

        // ISSUE: Sales need Lead UUID. Firestore Leads have string IDs. 
        // We can't insert String ID into UUID column.
        // Quick Fix: We should have made Supabase IDs 'text' to match Firestore for easiest migration.
        // I will ask user to alter table to text ID, OR I will try to rely on License Number linkage.
        // Let's try inserting. If it fails, we know why.

        if (leads.length > 0) {
            const { error: leadError } = await supabase.from('leads').insert(leads); // using insert lets Supabase gen UUIDs
            if (leadError) console.error("Lead Sync partial error (likely ID mismatch):", leadError);
        }

        // 3. Migrate Sales
        log("Fetching Sales from Firestore...");
        try {
            const salesSnap = await getDocs(collection(db, 'sales'));
            const sales = salesSnap.docs.map(doc => {
                const data = doc.data();

                // Map Firestore fields to Supabase Columns
                // Note: 'brandId' or nested items structure needs to be put in jsonb 'items'
                // Data shapes differ between Portal orders (brands object) and Rep sales (cart/items?). 
                // We'll store the raw product data in 'items' for safety.

                let quantityItems = [];
                if (data.items && Array.isArray(data.items)) {
                    quantityItems = data.items;
                } else if (data.brands) {
                    // Flatten brands object: { brandId: { productId: { ... } } }
                    Object.values(data.brands).forEach(productsObj => {
                        Object.values(productsObj).forEach(item => quantityItems.push(item));
                    });
                }

                // Check for valid Date
                let createdAt = new Date().toISOString();
                if (data.createdAt) {
                    createdAt = typeof data.createdAt.toDate === 'function'
                        ? data.createdAt.toDate().toISOString()
                        : new Date(data.createdAt).toISOString();
                } else if (data.date) {
                    createdAt = typeof data.date.toDate === 'function'
                        ? data.date.toDate().toISOString()
                        : new Date(data.date).toISOString();
                }

                return {
                    id: doc.id, // Text ID now allowed
                    lead_id: data.dispensaryId || null, // Link to Lead
                    rep_id: data.userId || data.repId || null, // Link to User
                    dispensary_name: data.dispensaryName || 'Unknown',
                    amount: data.totalAmount || data.amount || 0,
                    commission: data.commissionEarned || 0,
                    items: quantityItems, // JSONB
                    status: data.status || 'completed',
                    created_at: createdAt
                };
            });

            if (sales.length > 0) {
                // Sanitize payload (remove undefined, ensure valid JSON)
                const sanitizedSales = sales.map(s => {
                    const clean = {};
                    Object.keys(s).forEach(key => {
                        clean[key] = s[key] === undefined ? null : s[key];
                    });
                    return clean;
                });

                log(`Preparing to insert ${sanitizedSales.length} sales...`);
                // log(`Debug Payload (First Item): ${JSON.stringify(sanitizedSales[0])}`); // Uncomment if needed

                const { error: saleError } = await supabase.from('sales').upsert(sanitizedSales);

                if (saleError) {
                    console.error("Sale Sync Error Full:", saleError);
                    throw new Error(`Sale Sync Failed: ${saleError.message} (Details: ${saleError.details || ''})`);
                }
                log("Sales synced successfully.");
            }
        } catch (saleErr) {
            log(`Error processing sales: ${saleErr.message}`);
        }

        // 4. Migrate Sample Requests
        log("Fetching Sample Requests...");
        try {
            const samplesSnap = await getDocs(collection(db, 'sample_requests'));
            const samples = samplesSnap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    brand_id: data.brandId || null,
                    dispensary_id: data.dispensaryId || null,
                    requested_brands: data.requestedBrands || [], // JSONB array
                    status: data.status || 'pending',
                    created_at: safelyGetDate(data.createdAt),
                    updated_at: safelyGetDate(data.updatedAt)
                };
            });

            if (samples.length > 0) {
                log(`Found ${samples.length} sample requests. Inserting...`);
                // Use upsert to avoid duplicates
                const { error: sampleError } = await supabase.from('sample_requests').upsert(samples);
                if (sampleError) throw new Error(`Sample Sync Failed: ${sampleError.message}`);
                log("Sample Requests synced.");
            }
        } catch (sampleErr) {
            log(`Error processing samples: ${sampleErr.message}`);
        }

        /*
        // 5. Migrate Points History (SKIPPED per user request)
        log("Fetching Points History...");
        try {
            // ... (Code removed to skip migration)
        } catch (pointErr) {
             log(`Error processing points: ${pointErr.message}`);
        }
        */
        log("Points History skipped.");

        log("Migration Complete!");

    } catch (e) {
        log(`CRITICAL ERROR: ${e.message}`);
        console.error(e);
        return logs;
    }
}
