
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://wlcqrgkvkcmewepbxwfh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_u1HpFo6rSpUUH_4o0uw6Fw_NCbD83V6';
// Using the key from .env file
const GOOGLE_MAPS_KEY = 'AIzaSyCPdIULzFSCyOFlBsrgo6yw2GQlR8tie_8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function backfillCoordinates() {
    console.log("Starting coordinate backfill...");

    // Fetch leads needing coordinates (active, not deleted, with address)
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, dispensary_name, address, location')
        .neq('status', 'deleted')
        .neq('address', '')
        .not('address', 'is', null);

    if (error) {
        console.error("Error fetching leads:", error);
        return;
    }

    const needsUpdate = leads.filter(l => {
        // Check if location is missing or invalid
        return !l.location || !l.location.lat || !l.location.lng;
    });

    console.log(`Found ${needsUpdate.length} leads needing coordinates out of ${leads.length} total.`);

    let updatedCount = 0;

    for (const lead of needsUpdate) {
        console.log(`Processing: ${lead.dispensary_name} (${lead.address})`);

        try {
            const coords = await geocodeAddress(lead.address);
            if (coords) {
                const { error: updateError } = await supabase
                    .from('leads')
                    .update({
                        location: coords,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', lead.id);

                if (updateError) {
                    console.error(`  Failed to update DB for ${lead.dispensary_name}:`, updateError);
                } else {
                    console.log(`  ✅ Updated: ${coords.lat}, ${coords.lng}`);
                    updatedCount++;
                }
            } else {
                console.log("  ⚠️ Could not geocode address.");
            }
        } catch (err) {
            console.error(`  Error processing ${lead.id}:`, err);
        }

        // Brief pause to be nice to the API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\nBackfill complete. Updated ${updatedCount} leads.`);
}

async function geocodeAddress(address) {
    if (!address) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const loc = data.results[0].geometry.location;
            return { lat: loc.lat, lng: loc.lng };
        } else {
            console.error(`  Geocoding API error: ${data.status}`, data.error_message || '');
            return null;
        }
    } catch (error) {
        console.error("  Fetch error:", error);
        return null;
    }
}

backfillCoordinates();
