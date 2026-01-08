import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase URL or Anon Key");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check connection
export async function checkConnection() {
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) throw error;
        console.log("Supabase Connected Successfully");
        return true;
    } catch (e) {
        console.error("Supabase Connection Failed", e);
        return false;
    }
}
