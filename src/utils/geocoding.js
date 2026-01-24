/**
 * Geocodes an address using Google Maps Geocoding API (primary) with OpenStreetMap fallback.
 * Google Maps provides much more accurate results for NYC addresses.
 * @param {string} address - The address string to geocode.
 * @returns {Promise<{lat: number, lng: number, address: string} | null>} - The coordinates and formatted address, or null if failed.
 */

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export async function geocodeAddress(address) {
    if (!address) return null;

    // Try Google Maps first (more accurate)
    if (GOOGLE_API_KEY) {
        try {
            const result = await geocodeWithGoogle(address);
            if (result) return result;
        } catch (error) {
            console.warn('Google geocoding failed, falling back to OpenStreetMap:', error);
        }
    }

    // Fallback to OpenStreetMap Nominatim
    return await geocodeWithNominatim(address);
}

/**
 * Geocode using Google Maps Geocoding API
 */
async function geocodeWithGoogle(address) {
    const encodedAddress = encodeURIComponent(address);

    // Bias results towards New York area
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&components=administrative_area:NY|country:US&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
        console.warn('Google geocoding request failed:', response.statusText);
        return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        console.log('Google geocoded:', address, '→', result.formatted_address);

        return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            address: result.formatted_address,
            placeId: result.place_id
        };
    }

    if (data.status === 'ZERO_RESULTS') {
        console.warn('Google found no results for:', address);
    } else if (data.status !== 'OK') {
        console.warn('Google geocoding error:', data.status, data.error_message);
    }

    return null;
}

/**
 * Geocode using OpenStreetMap Nominatim API (free fallback)
 */
async function geocodeWithNominatim(address) {
    try {
        // Normalize the address - add NY, USA if not already present for better accuracy
        let normalizedAddress = address.trim();
        const hasState = /\b(NY|New York|N\.Y\.)\b/i.test(normalizedAddress);
        const hasCountry = /\b(USA|US|United States)\b/i.test(normalizedAddress);

        if (!hasState) {
            normalizedAddress += ', NY';
        }
        if (!hasCountry) {
            normalizedAddress += ', USA';
        }

        const query = encodeURIComponent(normalizedAddress);

        // Use viewbox to bias results toward New York State area
        // NY State bounding box: approx -79.76 to -71.85 longitude, 40.49 to 45.01 latitude
        const viewbox = '-79.76,45.01,-71.85,40.49';

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=us&viewbox=${viewbox}&bounded=0`;

        const response = await fetch(url, {
            headers: {
                // Required by Nominatim Terms of Service
                'User-Agent': 'TheGreenTruthApp/1.0 (contact@thegreentruthnyc.com)'
            }
        });

        if (!response.ok) {
            console.warn('Nominatim geocoding failed:', response.statusText);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            // Prefer results in New York State if multiple results
            const nyResult = data.find(r =>
                r.display_name &&
                (r.display_name.includes('New York') || r.display_name.includes(', NY,'))
            );
            const result = nyResult || data[0];

            console.log('Nominatim geocoded:', normalizedAddress, '→', result.display_name);

            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                address: result.display_name
            };
        }

        console.warn('Nominatim found no results for:', normalizedAddress);
        return null;
    } catch (error) {
        console.error('Nominatim geocoding error:', error);
        return null;
    }
}

/**
 * Batch geocode multiple addresses (for migration/updates)
 */
export async function batchGeocodeAddresses(addresses) {
    const results = [];

    for (const address of addresses) {
        const result = await geocodeAddress(address);
        results.push({ address, result });

        // Rate limiting: wait between requests to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    return results;
}
