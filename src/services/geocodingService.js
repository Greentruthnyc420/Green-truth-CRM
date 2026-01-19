/**
 * Geocoding Service using OpenStreetMap Nominatim API
 * Free to use with proper attribution and rate limiting
 * https://operations.osmfoundation.org/policies/nominatim/
 */

// Simple in-memory cache to avoid repeated API calls
const geocodeCache = new Map();

// Rate limiter - Nominatim requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

/**
 * Geocode an address to lat/lng coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if not found
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

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    try {
        // Use Nominatim API (OpenStreetMap)
        const encodedAddress = encodeURIComponent(trimmedAddress);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    'User-Agent': 'GreenTruthCRM/1.0 (contact@thegreentruthnyc.com)'
                }
            }
        );

        if (!response.ok) {
            console.warn('Geocoding API error:', response.status);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };

            // Cache the result
            geocodeCache.set(trimmedAddress, result);
            return result;
        }

        // No results found - cache null to avoid repeated lookups
        geocodeCache.set(trimmedAddress, null);
        return null;

    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Batch geocode multiple addresses (respects rate limits)
 * @param {string[]} addresses - Array of addresses to geocode
 * @returns {Promise<Map<string, {lat: number, lng: number}>>} - Map of address to coordinates
 */
export async function batchGeocodeAddresses(addresses) {
    const results = new Map();

    for (const address of addresses) {
        const coords = await geocodeAddress(address);
        if (coords) {
            results.set(address, coords);
        }
    }

    return results;
}

/**
 * Generate consistent mock coordinates based on a string (fallback)
 * Uses NYC area as base with deterministic offsets
 * @param {string} str - String to hash for coordinates
 * @returns {[number, number]} - [lat, lng] tuple
 */
export function getMockCoordinates(str) {
    if (!str) return [40.7128, -74.0060];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Create offset within ~5 mile radius of NYC center
    const latOffset = (hash % 1000) / 7000;
    const lngOffset = ((hash >> 16) % 1000) / 7000;

    return [40.7128 + latOffset, -74.0060 + lngOffset];
}

/**
 * Get coordinates for a lead/dispensary, trying real geocoding first
 * Falls back to mock coordinates if geocoding fails
 * @param {Object} lead - Lead object with address or name
 * @returns {Promise<[number, number]>} - [lat, lng] tuple
 */
export async function getLeadCoordinates(lead) {
    // If lead already has coordinates, use them
    if (lead.location?.lat && lead.location?.lng) {
        return [lead.location.lat, lead.location.lng];
    }

    if (lead.coords && Array.isArray(lead.coords) && lead.coords.length === 2) {
        return lead.coords;
    }

    // Try to geocode the address
    const address = lead.address || lead.fullAddress || lead.location?.address;
    if (address) {
        const coords = await geocodeAddress(address);
        if (coords) {
            return [coords.lat, coords.lng];
        }
    }

    // Fallback to mock coordinates based on name
    return getMockCoordinates(lead.dispensaryName || lead.name || lead.id);
}

// Clear cache (useful for testing or when data updates)
export function clearGeocodeCache() {
    geocodeCache.clear();
}
