import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findDispensary() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or('name.ilike.%dispensary test 99%,email.ilike.%dispensary test 99%');

    if (error) {
        console.error("Error finding user:", error);
        return;
    }

    if (users.length === 0) {
        // Try leads table too, just in case
        const { data: leads, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .ilike('dispensary_name', '%dispensary test 99%');

        if (leadError) {
            console.error("Error finding lead:", leadError);
            return;
        }

        if (leads.length === 0) {
            console.log("No record found for 'dispensary test 99' in users or leads.");
        } else {
            console.log("Found in leads:", leads);
        }
    } else {
        console.log("Found in users:", users);
    }
}

findDispensary();
