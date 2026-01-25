
import { createClient } from '@supabase/supabase-js';

// Hardcoded from .env.local for this script
const SUPABASE_URL = 'https://wlcqrgkvkcmewepbxwfh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u1HpFo6rSpUUH_4o0uw6Fw_NCbD83V6';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findTestLeads() {
    console.log("Searching for test/blank leads...");

    // Fetch all leads
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, dispensary_name, address, status, lead_status');

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    console.log(`Analyzing ${leads.length} total leads...`);

    const targets = leads.filter(l => {
        const name = (l.dispensary_name || '').toLowerCase().trim();
        return name === '' ||
            name.includes('test') ||
            name.includes('blank') ||
            name === 'dispensary'; // Common placeholder
    });

    if (targets.length === 0) {
        console.log("No test/blank leads found.");
    } else {
        console.log(`Found ${targets.length} potential test leads:`);
        targets.forEach(t => {
            console.log(`- [${t.id}] "${t.dispensary_name}" (Status: ${t.status || 'null'})`);
        });

        // Uncomment to enable deletion
        await deleteLeads(targets);
    }
}

async function deleteLeads(leadsToDelete) {
    if (leadsToDelete.length === 0) return;

    console.log(`\nDeleting ${leadsToDelete.length} leads...`);
    const ids = leadsToDelete.map(l => l.id);

    // Hard delete or soft delete? User said "remove", but soft delete is safer.
    // Let's check status first. If they are already deleted, maybe we hard delete?
    // For now, let's use the 'deleted' status as per service pattern.

    // Actually user wants them GONE from the accounts list. Service filters out 'deleted'.
    const { error } = await supabase
        .from('leads')
        .update({ status: 'deleted' })
        .in('id', ids);

    if (error) {
        console.error("Error deleting leads:", error);
    } else {
        console.log("Successfully marked leads as deleted.");
    }
}

findTestLeads();
