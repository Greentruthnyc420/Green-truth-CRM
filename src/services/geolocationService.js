// Geolocation Service for Field Verification
// Captures GPS coordinates for activation check-ins

/**
 * Get current position with high accuracy
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
 */
export async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                let message = 'Location error';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location permission denied';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location unavailable';
                        break;
                    case error.TIMEOUT:
                        message = 'Location request timed out';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000 // Cache for 1 minute
            }
        );
    });
}

/**
 * Calculate distance between two points in meters
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

/**
 * Verify user is near a dispensary location
 * @param {number} dispensaryLat
 * @param {number} dispensaryLng
 * @param {number} maxDistanceMeters - Default 500m
 */
export async function verifyNearLocation(dispensaryLat, dispensaryLng, maxDistanceMeters = 500) {
    try {
        const userLocation = await getCurrentLocation();
        const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            dispensaryLat,
            dispensaryLng
        );

        return {
            verified: distance <= maxDistanceMeters,
            distance: Math.round(distance),
            userLocation,
            message: distance <= maxDistanceMeters
                ? 'Location verified'
                : `You are ${Math.round(distance)}m away (max: ${maxDistanceMeters}m)`
        };
    } catch (error) {
        return {
            verified: false,
            distance: null,
            userLocation: null,
            message: error.message
        };
    }
}

/**
 * Request location permission
 */
export async function requestLocationPermission() {
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
        // Fallback for browsers that don't support permissions API
        return 'prompt';
    }
}
