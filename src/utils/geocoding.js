/**
 * Geocodes an address using the OpenStreetMap Nominatim API.
 * @param {string} address - The address string to geocode.
 * @returns {Promise<{lat: number, lng: number, address: string} | null>} - The coordinates and formatted address, or null if failed.
 */
export async function geocodeAddress(address) {
    if (!address) return null;

    try {
        const query = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

        const response = await fetch(url, {
            headers: {
                // Required by Nominatim Terms of Service
                'User-Agent': 'TheGreenTruthApp/1.0 (contact@thegreentruthnyc.com)'
            }
        });

        if (!response.ok) {
            console.warn('Geocoding failed:', response.statusText);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                address: result.display_name // Use the official OSM formatted address if desired
            };
        }

        return null; // No results found
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}
