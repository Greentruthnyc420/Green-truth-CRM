/**
 * Geocodes an address using the OpenStreetMap Nominatim API.
 * Biased toward New York State for better accuracy with local addresses.
 * @param {string} address - The address string to geocode.
 * @returns {Promise<{lat: number, lng: number, address: string} | null>} - The coordinates and formatted address, or null if failed.
 */
export async function geocodeAddress(address) {
    if (!address) return null;

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
            console.warn('Geocoding failed:', response.statusText);
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

            console.log('Geocoded address:', normalizedAddress, '→', result.display_name);

            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                address: result.display_name
            };
        }

        console.warn('No geocoding results for:', normalizedAddress);
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}
