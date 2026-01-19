// Run database migrations
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://wlcqrgkvkcmewepbxwfh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_u1HpFo6rSpUUH_4o0uw6Fw_NCbD83V6';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Running database migration...');

    // Read the SQL file
    const sqlPath = join(__dirname, 'supabase/migrations/20260118_create_missing_tables.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split by semicolons and run each statement
    const statements = sql.split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    let success = 0;
    let failed = 0;

    for (const statement of statements) {
        if (!statement.trim()) continue;

        try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (error) {
                // Try direct query if rpc not available
                console.log(`⚠️ RPC not available, trying fallback for: ${statement.substring(0, 50)}...`);
                failed++;
            } else {
                success++;
                console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
            }
        } catch (e) {
            console.log(`⚠️ Could not execute: ${statement.substring(0, 50)}...`);
            failed++;
        }
    }

    console.log(`\n📊 Results: ${success} succeeded, ${failed} need manual execution`);
    console.log('\n⚠️ If migrations failed, please run the SQL manually in Supabase SQL Editor');
}

runMigration().catch(console.error);
