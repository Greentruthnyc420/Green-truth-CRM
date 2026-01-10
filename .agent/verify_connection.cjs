const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log("Verifying Supabase Connection...");
    const { data, error } = await supabase.from('brand_users').select('*').limit(1);

    if (error) {
        console.error("Connection Failed:", error.message);
        // Supabase often returns 404/error if table doesn't exist, which catches setup issues
    } else {
        console.log("Connection Success! Table 'brand_users' is accessible.");
        console.log("Rows found:", data.length);
    }
}

verify();
