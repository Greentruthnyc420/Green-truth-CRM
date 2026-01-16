import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Green Truth CRM - Database Setup Script\n');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('='.repeat(60) + '\n');

// Table creation SQL (simplified without RLS for initial setup)
const createTablesSQL = `
-- Create shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    dispensary_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_hours NUMERIC(4,2),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rep_id TEXT NOT NULL,
    rep_name TEXT,
    dispensary_name TEXT NOT NULL,
    brand_name TEXT,
    products JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission_earned NUMERIC(10,2) DEFAULT 0,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensary_name TEXT NOT NULL,
    license_number TEXT,
    address TEXT,
    contacts JSONB DEFAULT '[]'::jsonb,
    priority TEXT DEFAULT 'Normal',
    samples_requested JSONB DEFAULT '[]'::jsonb,
    active_brands JSONB DEFAULT '[]'::jsonb,
    meeting_date DATE,
    lead_status TEXT DEFAULT 'prospect',
    first_order_date DATE,
    notes TEXT,
    created_by TEXT,
    owner_brand_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activations table
CREATE TABLE IF NOT EXISTS public.activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    dispensary_id TEXT,
    dispensary_name TEXT NOT NULL,
    rep_id TEXT,
    rep_name TEXT,
    activation_date DATE NOT NULL,
    activation_type TEXT DEFAULT 'sampling',
    start_time TIME,
    end_time TIME,
    total_hours NUMERIC(4,2),
    status TEXT DEFAULT 'scheduled',
    invoice_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`.trim();

async function createTables() {
    console.log('📊 Creating database tables...\n');

    // Split SQL into individual statements
    const statements = createTablesSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
        try {
            // Use rpc to execute SQL (requires a custom function in Supabase)
            // Since we can't execute raw SQL directly, we'll use the REST API
            const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

            if (error) {
                // This error is expected if exec_sql function doesn't exist
                console.log('⚠️  Direct SQL execution not available via Supabase JS client');
                console.log('📋 Please execute schema.sql manually in Supabase dashboard\n');
                return false;
            }

            successCount++;
        } catch (e) {
            errorCount++;
        }
    }

    return successCount > 0;
}

async function verifyTables() {
    console.log('🔍 Verifying tables...\n');

    const tables = ['shifts', 'sales', 'leads', 'activations'];
    const results = {};

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(0);

            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`❌ Table "${table}" does NOT exist`);
                    results[table] = false;
                } else {
                    console.log(`✅ Table "${table}" exists (query error but table found)`);
                    results[table] = true;
                }
            } else {
                console.log(`✅ Table "${table}" exists`);
                results[table] = true;
            }
        } catch (e) {
            console.log(`❌ Table "${table}" error:`, e.message);
            results[table] = false;
        }
    }

    const missingTables = Object.entries(results)
        .filter(([_, exists]) => !exists)
        .map(([table]) => table);

    console.log('\n' + '='.repeat(60));

    if (missingTables.length === 0) {
        console.log('✅ All tables exist!\n');
        return true;
    } else {
        console.log(`\n❌ Missing tables: ${missingTables.join(', ')}\n`);
        console.log('📋 ACTION REQUIRED:');
        console.log('1. Open: https://app.supabase.com/project/wlcqrgkvkcmewepbxwfh/sql');
        console.log('2. Copy and paste the contents of schema.sql');
        console.log('3. Click "Run" to execute\n');
        return false;
    }
}

async function main() {
    // First verify what exists
    const allExist = await verifyTables();

    if (allExist) {
        console.log('✨ Database is ready!\n');
        process.exit(0);
    }

    // Attempt to create tables
    console.log('\n💡 Attempting automatic table creation...\n');
    const created = await createTables();

    if (!created) {
        console.log('ℹ️  Manual setup required - see instructions above.\n');
        process.exit(1);
    }

    // Verify again
    console.log('\n🔄 Re-verifying tables...\n');
    const verified = await verifyTables();

    if (verified) {
        console.log('✨ Setup complete!\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tables still missing - manual setup required.\n');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
