import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function discoverSchema() {
    console.log('🔍 Discovering actual activations table schema...\n');

    // Try inserting with minimal fields to see what's required
    const testActivation = {
        brand_name: 'Test',
        dispensary_name: 'Test Disp',
        rep_name: 'Test Rep',
        notes: 'Schema discovery test'
    };

    const { data, error } = await supabase
        .from('activations')
        .insert([testActivation])
        .select()
        .single();

    if (error) {
        console.error('❌ Insert failed:', error.message);
        console.log('\nThis reveals what columns exist and what\'s required.\n');

        // Parse error to find out what's missing
        if (error.message.includes('null value in column')) {
            const match = error.message.match(/null value in column "([^"]+)"/);
            if (match) {
                console.log(`⚠️  Required column: "${match[1]}"`);
            }
        }
    } else {
        console.log('✅ Successfully inserted test record!');
        console.log('\n📊 Discovered Schema (actual column names):');
        console.log(JSON.stringify(Object.keys(data), null, 2));

        console.log('\n📝 Sample Record:');
        console.log(JSON.stringify(data, null, 2));

        // Clean up
        await supabase.from('activations').delete().eq('id', data.id);
        console.log('\n🧹 Test record deleted');
    }
}

discoverSchema();
