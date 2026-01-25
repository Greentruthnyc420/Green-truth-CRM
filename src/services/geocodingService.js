/**
 * Geocoding Service - Google Maps Only
 * Strictly enforced to use high-quality Google Maps data.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Simple in-memory cache to avoid repeated API calls for the same string
const geocodeCache = new Map();

/**
 * Geocode an address to lat/lng coordinates using Google Maps API.
 * Returns null if geocoding fails or no results found.
 * 
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string, placeId: string} | null>}
 */
export async function geocodeAddress(address) {
    if (!address || typeof address !== 'string') {
        return null;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) return null;

    // Check cache first
    if (geocodeCache.has(trimmedAddress)) {
        return geocodeCache.get(trimmedAddress);
    }

    // Ensure we have an API key
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API Key is missing! Check .env file.');
        return null;
    }

    try {
        // Bias results to NY area for better accuracy if ambiguous
        // NY Bounds approx: south=40.49, west=-79.76, north=45.01, east=-71.85
        // Using components restriction to US/NY can also help
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmedAddress)}&components=country:US&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const resultObj = data.results[0];
            const { lat, lng } = resultObj.geometry.location;

            const result = {
                lat,
                lng,
                formattedAddress: resultObj.formatted_address,
                placeId: resultObj.place_id
            };

            console.log(`[Geocoding] Success: "${trimmedAddress}" -> "${result.formattedAddress}"`);

            // Cache the result
            geocodeCache.set(trimmedAddress, result);
            return result;
        } else {
            if (data.status === 'ZERO_RESULTS') {
                console.warn(`[Geocoding] No results found for: "${trimmedAddress}"`);
            } else {
                console.error(`[Geocoding] API Error for "${trimmedAddress}":`, data.status, data.error_message);
            }
            return null;
        }

    } catch (error) {
        console.error('[Geocoding] Network or unexpected error:', error);
        return null;
    }
}

/**
 * Batch geocode multiple addresses
 * @param {string[]} addresses
 * @returns {Promise<Map<string, {lat: number, lng: number}>>}
 */
export async function batchGeocodeAddresses(addresses) {
    const results = new Map();
    // Google Maps QPS is usually 50 QPS, so we can run reasonable parallelism.
    // However, to be safe and avoid rate limits on standard plans, we'll process sequentially or in small chunks.

    for (const address of addresses) {
        if (!process) break; // Safety check
        const coords = await geocodeAddress(address);
        if (coords) {
            results.set(address, coords);
        }
        // Small delay to be polite to the API rate limiter
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay = max 10 req/s
    }
    return results;
}

/**
 * Get coordinates for a lead/dispensary.
 * STRICT: Returns null if no valid coordinates found. NEVER returns mock data.
 * @param {Object} lead
 * @returns {Promise<[number, number] | null>}
 */
export async function getLeadCoordinates(lead) {
    // 1. Use existing valid coordinates if available in DB
    if (lead?.location?.lat && lead?.location?.lng) {
        // Ensure they are numbers
        const lat = parseFloat(lead.location.lat);
        const lng = parseFloat(lead.location.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
        }
    }

    // 2. Check legacy array format if exists
    if (Array.isArray(lead?.coords) && lead.coords.length === 2) {
        return lead.coords;
    }

    // 3. Try to geocode if we have an address but no valid coords stored
    const address = lead?.address || lead?.fullAddress || lead?.location?.address;
    if (address) {
        const coords = await geocodeAddress(address);
        if (coords) {
            // NOTE: We should ideally update the lead in DB here, but this function is just a getter.
            // The caller is responsible for persisting this if they want to save API calls.
            return [coords.lat, coords.lng];
        }
    }

    // 4. Return null if all else fails. 
    // The Map component must handle nulls by not rendering a pin.
    return null;
}


/**
 * Find a place by name and return address details.
 * Uses Google Places API (Find Place from Text).
 * 
 * @param {string} query - The place name to search for (e.g. "Green Dragon NYC")
 * @returns {Promise<{name: string, formattedAddress: string, lat: number, lng: number, placeId: string} | null>}
 */
export async function findPlaceFromText(query) {
    if (!query || typeof query !== 'string') return null;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return null;

    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API Key is missing!');
        return null;
    }

    try {
        // Request fields: formatted_address,name,geometry,place_id
        const fields = 'formatted_address,name,geometry,place_id';
        const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(trimmedQuery)}&inputtype=textquery&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
            const candidate = data.candidates[0];
            const result = {
                name: candidate.name,
                formattedAddress: candidate.formatted_address,
                lat: candidate.geometry.location.lat,
                lng: candidate.geometry.location.lng,
                placeId: candidate.place_id
            };
            console.log(`[Place Search] Found: "${trimmedQuery}" -> "${result.name}" (${result.formattedAddress})`);
            return result;
        } else {
            console.warn(`[Place Search] No candidates found for: "${trimmedQuery}"`, data.status);
            return null;
        }
    } catch (error) {
        console.error('[Place Search] Network or unexpected error:', error);
        return null;
    }
}

