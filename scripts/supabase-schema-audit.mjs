import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function auditSchema() {
    console.log("🕵️ Auditing Supabase Schema for Monday Sync...");

    // Check activations
    console.log("\n--- Activations Table ---");
    const { data: activations, error: actError } = await supabase.from('activations').select('*').limit(1);
    if (actError) {
        console.error("❌ Error accessing 'activations':", actError.message);
    } else {
        console.log("✅ 'activations' table exists. Sample row data keys:");
        console.log(activations.length > 0 ? Object.keys(activations[0]) : "No data found, but table exists.");
    }

    // Check invoices
    console.log("\n--- Invoices Table ---");
    const { data: invoices, error: invError } = await supabase.from('invoices').select('*').limit(1);
    if (invError) {
        console.warn("⚠️ Warning: 'invoices' table not found or inaccessible. Error:", invError.message);
        // Sometimes names are different, check 'sales' as a fallback since it's used for invoicing
        const { data: sales, error: saleError } = await supabase.from('sales').select('*').limit(1);
        if (!saleError) {
            console.log("ℹ️ Found 'sales' table. Using this for invoice data mapping.");
            console.log("Sample keys:", sales.length > 0 ? Object.keys(sales[0]) : "Empty table.");
        }
    } else {
        console.log("✅ 'invoices' table exists. Sample row data keys:");
        console.log(invoices.length > 0 ? Object.keys(invoices[0]) : "No data found, but table exists.");
    }

    // Check brand_settings
    console.log("\n--- Brand Settings Table ---");
    const { data: settings, error: setError } = await supabase.from('brand_settings').select('*').limit(1);
    if (setError) {
        console.warn("⚠️ 'brand_settings' table not found. Checking 'brand_profiles' or 'users'...");
        const { data: profiles } = await supabase.from('brand_profiles').select('*').limit(1);
        if (profiles) console.log("Found 'brand_profiles'. Keys:", Object.keys(profiles[0] || {}));
    } else {
        console.log("✅ 'brand_settings' table exists. Keys:", Object.keys(settings[0] || {}));
    }
}

auditSchema();
