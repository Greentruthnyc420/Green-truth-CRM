import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Adding Activation Completion Fields\n');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('='.repeat(60) + '\n');

async function executeSQL(sql) {
    try {
        // Since we can't execute raw SQL directly via Supabase JS client,
        // we'll use the activated columns to verify
        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            // Expected - exec_sql function doesn't exist
            console.log('⚠️  Direct SQL execution not available');
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

async function verifyActivationsTable() {
    console.log('🔍 Verifying activations table structure...\n');

    try {
        const { data, error } = await supabase
            .from('activations')
            .select('*')
            .limit(0);

        if (error) {
            if (error.message.includes('does not exist')) {
                console.error('❌ activations table does not exist!');
                return false;
            }
        }

        console.log('✅ activations table exists');
        return true;
    } catch (e) {
        console.error('❌ Error accessing activations table:', e.message);
        return false;
    }
}

async function testActivationComplete() {
    console.log('\n🧪 Testing activation completion workflow...\n');

    try {
        // Try to insert a test completed activation
        const testData = {
            brand_id: 'test-brand',
            brand_name: 'Test Brand',
            dispensary_name: 'Test Dispensary',
            rep_id: 'test-rep',
            rep_name: 'Test Rep',
            activation_date: new Date().toISOString().split('T')[0],
            activation_type: 'walk-in',
            status: 'completed',
            start_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            end_time: new Date().toISOString(),
            total_hours: 4,
            miles_traveled: 25,
            toll_amount: 5.50,
            region: 'NYC',
            has_vehicle: true,
            completed_at: new Date().toISOString(),
            notes: 'Test activation completion'
        };

        const { data, error } = await supabase
            .from('activations')
            .insert([testData])
            .select()
            .single();

        if (error) {
            console.error('❌ Test insert failed:', error.message);

            // Check if it's a missing column error
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                console.log('\n⚠️  Missing columns detected!');
                console.log('📋 Please run the following SQL in Supabase Dashboard:\n');
                console.log(fs.readFileSync('add_activation_completion_fields.sql', 'utf8'));
                return false;
            }

            return false;
        }

        console.log('✅ Test activation created with ID:', data.id);

        // Clean up test data
        await supabase
            .from('activations')
            .delete()
            .eq('id', data.id);

        console.log('✅ Test data cleaned up');
        console.log('\n🎉 All columns exist and are working!');

        return true;
    } catch (e) {
        console.error('❌ Test failed:', e.message);
        return false;
    }
}

async function main() {
    const tableExists = await verifyActivationsTable();

    if (!tableExists) {
        console.log('\n❌ Cannot proceed without activations table');
        process.exit(1);
    }

    console.log('\n💡 Attempting to add completion fields...\n');

    const testPassed = await testActivationComplete();

    if (!testPassed) {
        console.log('\n📋 MANUAL ACTION REQUIRED:');
        console.log('1. Open: https://app.supabase.com/project/wlcqrgkvkcmewepbxwfh/sql');
        console.log('2. Run the SQL from: add_activation_completion_fields.sql');
        console.log('3. Run this script again to verify\n');
        process.exit(1);
    }

    console.log('\n✨ Setup complete! Ready to log shifts as activation completions.\n');
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
