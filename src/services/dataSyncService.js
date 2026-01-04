import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../firebase";
import { geocodeAddress } from "../utils/geocoding";

const OCM_API_URL = "https://data.ny.gov/resource/jskf-tt3q.json";

// Helper for throttling
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches official NY State dispensary data and imports it into Firestore.
 * Handles duplicates and geocoding.
 * @param {function} onProgress - Callback (current, total, message)
 */
export async function importOfficialDispensaries(onProgress) {
    try {
        console.log("Starting OCM Data Import...");
        if (onProgress) onProgress(0, 0, "Fetching OCM Data...");

        // 1. Fetch Data
        // Filter for 'Adult-Use Retail Dispensary License'
        const response = await fetch(`${OCM_API_URL}?$limit=3000&license_type=Adult-Use Retail Dispensary License&license_status=Active`);

        if (!response.ok) {
            throw new Error(`Failed to fetch OCM data: ${response.statusText}`);
        }

        const rawData = await response.json();
        console.log(`Fetched ${rawData.length} records from OCM.`);

        // 2. Prepare for Batch Write
        let batch = writeBatch(db);
        let operationCount = 0;
        let successCount = 0;

        // 3. Import Loop
        for (const [index, record] of rawData.entries()) {

            // Use DBA (Doing Business As) if available, otherwise Entity Name
            const name = record.dba || record.entity_name || record.business_name;
            const address = `${record.address_line_1 || ''}, ${record.city || ''}, ${record.state || 'NY'} ${record.zip_code || ''}`.trim();

            if (!name) continue;

            const progressMsg = `Processing ${name.substring(0, 20)}...`;
            console.log(`Processing [${index + 1}/${rawData.length}]: ${name}...`);
            if (onProgress) onProgress(index + 1, rawData.length, progressMsg);

            // Normalized ID
            const licenseId = record.license_number || `uk-${Math.random().toString(36).substr(2, 9)}`;
            const docId = `ocm-${licenseId.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

            // Location Strategy:
            // 1. Try OCM Georeference (if available)
            // 2. Fallback to Nominatim Geocoding (Throttled)
            let locationData = {
                lat: record.georeference?.coordinates?.[1] || null,
                lng: record.georeference?.coordinates?.[0] || null,
                address: address
            };

            // If missing coords, Geocode!
            if (!locationData.lat && address.length > 5) {
                try {
                    // Normalize address for better geocoding results
                    const cleanAddress = address.replace(/#/g, '');
                    const geoResult = await geocodeAddress(cleanAddress);

                    if (geoResult) {
                        locationData = geoResult;
                        console.log(`  -> Geocoded: ${geoResult.lat}, ${geoResult.lng}`);
                    }

                    if (onProgress) onProgress(index + 1, rawData.length, `Geocoding ${name.substring(0, 15)}... (Throttled)`);
                    // Critical: Throttle to respect Nominatim usage policy (max 1 req/sec)
                    await delay(1100);

                } catch (err) {
                    console.warn(`  -> Geocoding failed for ${address}:`, err);
                }
            }

            // Construct Lead Object
            const leadData = {
                dispensaryName: name,
                contactPerson: record.primary_contact_name || "Manager",
                email: record.email || "",
                phone: record.phone || "",
                licenseNumber: record.license_number || "",
                address: address,
                location: locationData,
                status: 'New',
                source: 'Official NY OCM Import',
                importedAt: new Date().toISOString(),
                syncedToHubspot: false,
                userId: 'system-import',
                repAssigned: 'Unassigned',
                operationalStatus: record.operational_status || 'Unknown'
            };

            // Add to batch (upsert)
            const docRef = doc(db, "leads", docId);
            batch.set(docRef, leadData, { merge: true });

            operationCount++;
            successCount++;

            // Commit batch every 400 ops
            if (operationCount >= 400) {
                await batch.commit();
                console.log(`Committed batch of ${operationCount} records.`);
                batch = writeBatch(db);
                operationCount = 0;
            }
        }

        // Final Commit
        if (operationCount > 0) {
            await batch.commit();
        }

        console.log("Import Complete.");
        return { success: true, count: successCount };

    } catch (error) {
        console.error("Import failed:", error);
        return { success: false, error: error.message };
    }
}
