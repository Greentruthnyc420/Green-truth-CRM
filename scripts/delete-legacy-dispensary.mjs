import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TARGET_ID = 'jy4757WU0GTN7Olp2P8hEh9WqW52';

async function deleteDispensary() {
    console.log(`🗑️ Attempting to delete legacy record: ${TARGET_ID}...`);

    // Check if it's in users
    const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('id', TARGET_ID)
        .single();

    if (findError) {
        console.warn("⚠️ User not found in 'users' table or error occurred:", findError.message);
    } else {
        console.log(`✅ Found user: ${user.name} (${user.email}). Deleting...`);
        const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', TARGET_ID);

        if (deleteError) {
            console.error("❌ Error deleting from users:", deleteError.message);
        } else {
            console.log("✨ Successfully deleted user from 'users' table.");
        }
    }

    // Also check leads table just in case it's cross-referenced
    const { error: leadDeleteError } = await supabase
        .from('leads')
        .delete()
        .eq('dispensary_name', 'Dispensary Test 99');

    if (leadDeleteError) {
        console.warn("⚠️ Note: No matching record found/deleted in 'leads' table.");
    } else {
        console.log("✅ Checked and cleared any matching entries in 'leads' table.");
    }

    console.log("\n🔍 Verification complete.");
}

deleteDispensary();
