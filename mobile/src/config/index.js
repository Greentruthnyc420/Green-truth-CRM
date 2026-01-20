// Mobile configuration for shared imports
// This file bridges the web services to the mobile app

// Re-export web services for mobile use
export { supabase } from '../../src/services/supabaseClient';

// Firebase config - shared
export const firebaseConfig = {
    // These will be loaded from environment or the existing web config
};

// API Endpoints
export const API_CONFIG = {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5173',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

// Feature flags for mobile
export const MOBILE_FEATURES = {
    offlineMode: false, // Future feature
    pushNotifications: false, // Phase 4
    biometricAuth: false, // Future feature
};
