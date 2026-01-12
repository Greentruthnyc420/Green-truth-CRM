import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Anon Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tablesToClear = [
    'sales',
    'leads',
    'sample_requests',
    'shifts',
    'activations',
    'activity_logs',
    'security_logs',
    'drivers',
    'vehicles'
];

async function cleanup() {
    console.log("🚀 Starting Production Data Cleanup...");

    for (const table of tablesToClear) {
        try {
            console.log(`🧹 Clearing table: ${table}...`);
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

            if (error) {
                if (error.code === '42P01') {
                    console.warn(`⚠️ Table ${table} does not exist. Skipping.`);
                } else {
                    console.error(`❌ Error clearing ${table}:`, error.message);
                }
            } else {
                console.log(`✅ ${table} cleared.`);
            }
        } catch (err) {
            console.error(`💥 Fatal error clearing ${table}:`, err);
        }
    }

    // Verify preservation
    console.log("\n🔍 Verifying Preservation of Core Data...");
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });

    console.log(`👤 Users preserved: ${userCount}`);
    console.log(`📦 Products preserved: ${productCount}`);

    console.log("\n✨ Cleanup Complete. System is now a Blank Slate.");
}

cleanup();
