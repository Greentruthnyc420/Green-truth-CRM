import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function inspectActivationsTable() {
    console.log('🔍 Inspecting activations table...\n');

    // Try to get any existing records to see the structure
    const { data, error } = await supabase
        .from('activations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log('📊 Sample Record Structure:');
        console.log(JSON.stringify(data[0], null, 2));
        console.log('\n📋 Available Columns:');
        console.log(Object.keys(data[0]).join(', '));
    } else {
        console.log('ℹ️  No records found in activations table');
        console.log('Attempting to insert a minimal record to discover schema...\n');

        const { data: insertData, error: insertError } = await supabase
            .from('activations')
            .insert([{
                brand_id: 'test',
                dispensary_id: 'test'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('Error:', insertError.message);
            console.log('\nThis error reveals required columns.');
        } else {
            console.log('✅ Discovered schema:');
            console.log(Object.keys(insertData).join(', '));

            // Clean up
            await supabase.from('activations').delete().eq('id', insertData.id);
        }
    }
}

inspectActivationsTable();
