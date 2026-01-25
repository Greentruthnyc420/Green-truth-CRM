import { supabase } from './supabaseClient';
import { geocodeAddress } from './geocodingService';

export async function backfillLeads() {
    console.log('Starting lead coordinate backfill...');

    // Check for API Key first
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Missing Google Maps API Key');
        return { success: false, message: 'Missing Google Maps API Key' };
    }

    const { data: leads, error } = await supabase.from('leads').select('*').neq('status', 'deleted');

    if (error) {
        console.error('Error fetching leads:', error);
        return { success: false, message: 'Failed to fetch leads from database', error };
    }

    if (!leads || leads.length === 0) {
        return { success: true, message: 'No leads found to process', updatedCount: 0, failedCount: 0, skippedCount: 0 };
    }

    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let logs = [];

    const log = (msg) => {
        console.log(msg);
        logs.push(msg);
    };

    log(`Found ${leads.length} leads to process.`);

    for (const lead of leads) {
        const address = lead.address;

        if (!address) {
            log(`Skipping: ${lead.dispensary_name} (No address)`);
            skippedCount++;
            continue;
        }

        // Skip if already has location (unless we want to force update, but let's be efficient for now, or maybe the user wants to fix existing bad ones?)
        // The user said "fix map data", implying missing ones. But the previous code forced re-geocode.
        // Let's stick to the previous logic of forcing re-geocode to ensure accuracy, as requested.

        try {
            const result = await geocodeAddress(address);

            if (result) {
                // Update Supabase
                const { error: updateError } = await supabase
                    .from('leads')
                    .update({
                        location: result
                    })
                    .eq('id', lead.id);

                if (updateError) {
                    log(`Failed Update: ${lead.dispensary_name} - ${updateError.message}`);
                    failedCount++;
                } else {
                    log(`Updated: ${lead.dispensary_name} -> [${result.lat}, ${result.lng}]`);
                    updatedCount++;
                }
            } else {
                log(`Geocode Failed: ${lead.dispensary_name} (${address})`);
                failedCount++;
            }

        } catch (err) {
            log(`Error: ${lead.dispensary_name} - ${err.message}`);
            failedCount++;
        }

        // Rate limiting: 200ms delay between requests (max 5 req/sec)
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    const summary = `Backfill complete. Updated: ${updatedCount}, Failed: ${failedCount}, Skipped: ${skippedCount}`;
    log(summary);

    const success = updatedCount > 0 || (failedCount === 0 && skippedCount > 0);
    return {
        success: true,
        message: summary,
        updatedCount,
        failedCount,
        skippedCount,
        logs
    };
}
