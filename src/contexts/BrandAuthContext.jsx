import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

// Placeholder licenses for all 8 brands
export const BRAND_LICENSES = {
    'WANDERS-LICENSE-001': { brandId: 'wanders', brandName: 'Wanders New York' },
    'HONEYKING-LICENSE-001': { brandId: 'honey-king', brandName: 'Honey King' },
    'BUDCRACKER-LICENSE-001': { brandId: 'bud-cracker', brandName: 'Bud Cracker Boulevard' },
    'CANNADOTS-LICENSE-001': { brandId: 'canna-dots', brandName: 'Canna Dots' },
    'SPACEPOPPERS-LICENSE-001': { brandId: 'space-poppers', brandName: 'Space Poppers' },
    'SMOOTHIEBAR-LICENSE-001': { brandId: 'smoothie-bar', brandName: 'Smoothie Bar' },
    'WAFERZ-LICENSE-001': { brandId: 'waferz', brandName: 'Waferz NY' },
    'PINES-LICENSE-001': { brandId: 'pines', brandName: 'Pines' },
};

const BrandAuthContext = createContext();

export function useBrandAuth() {
    return useContext(BrandAuthContext);
}

export function BrandAuthProvider({ children }) {
    const [brandUser, setBrandUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const { currentUser } = useAuth();

    // Validate license number and return brand info if valid
    function validateLicense(licenseNumber) {
        const normalized = licenseNumber?.toUpperCase().trim();
        return BRAND_LICENSES[normalized] || null;
    }

    // Signup with license verification
    async function signupBrand(email, password, licenseNumber) {
        setLoading(true);
        try {
            const brandInfo = validateLicense(licenseNumber);
            if (!brandInfo) {
                throw new Error('Invalid license number. Please check your brand license.');
            }

            // In production, this would create a new Firebase user and link to brand profile
            const mockBrandUser = {
                ...brandInfo,
                email: email,
                licenseNumber: licenseNumber.toUpperCase().trim(),
                displayName: brandInfo.brandName,
                uid: `brand-${brandInfo.brandId}`
            };

            setBrandUser(mockBrandUser);
            return mockBrandUser;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Login with license verification
    async function loginBrand(email, password, licenseNumber) {
        setLoading(true);
        try {
            const brandInfo = validateLicense(licenseNumber);
            if (!brandInfo) {
                throw new Error('Invalid license number. Please check your brand license.');
            }

            // In production, this would authenticate with Firebase
            // For now, we create a mock brand user
            const mockBrandUser = {
                ...brandInfo,
                email: email,
                licenseNumber: licenseNumber.toUpperCase().trim(),
                displayName: brandInfo.brandName,
                uid: `brand-${brandInfo.brandId}`
            };

            setBrandUser(mockBrandUser);
            return mockBrandUser;
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Dev test login - bypasses license verification
    function devBrandLogin(brandId) {
        // Find brand info by brandId
        const licenseKey = Object.keys(BRAND_LICENSES).find(key => BRAND_LICENSES[key].brandId === brandId);

        if (!licenseKey) {
            console.error('Unknown brand ID for dev login');
            return null;
        }

        const brandInfo = BRAND_LICENSES[licenseKey];

        const mockBrandUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: `${brandId}@example.com`,
            displayName: brandInfo.brandName,
            uid: `brand-${brandId}`
        };

        setBrandUser(mockBrandUser);
        return mockBrandUser;
    }

    // Mock Google Login for Brand Portal
    async function loginWithGoogle(licenseNumber) {
        setLoading(true);
        try {
            // Validate license first if provided (auto-linking logic would go here)
            let brandInfo = null;
            if (licenseNumber) {
                brandInfo = validateLicense(licenseNumber);
                if (!brandInfo) throw new Error('Invalid license number.');
            } else {
                // Mock logic: If no license, default to Wanders for demo, 
                // OR ideally we would look up the user by email in Firestore
                brandInfo = BRAND_LICENSES['WANDERS-LICENSE-001'];
            }

            const mockGoogleUser = {
                ...brandInfo,
                email: 'google-user@example.com',
                displayName: brandInfo.brandName,
                uid: `brand-google-${brandInfo.brandId}`,
                photoURL: 'https://lh3.googleusercontent.com/a/ACg8ocIq8d...'
            };

            setTimeout(() => {
                setBrandUser(mockGoogleUser);
                setLoading(false);
            }, 1000);

            return mockGoogleUser;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    }

    // Admin Backdoor: Impersonate a brand
    function impersonateBrand(brandId) {
        // Verify Admin via AuthContext
        const adminEmail = 'omar@thegreentruthnyc.com';
        const isAuthorized = currentUser?.email === adminEmail || currentUser?.email === 'admin-user-id-123'; // dev mock

        if (!isAuthorized) {
            console.error("Unauthorized attempt to impersonate brand.");
            throw new Error("Access Denied: You are not an authorized administrator.");
        }

        // Find brand info by brandId
        const licenseKey = Object.keys(BRAND_LICENSES).find(key => BRAND_LICENSES[key].brandId === brandId);
        if (!licenseKey) throw new Error("Brand not found.");

        const brandInfo = BRAND_LICENSES[licenseKey];

        const ghostUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: currentUser.email, // Use admin email
            displayName: `👻 ${brandInfo.brandName} (Admin)`,
            uid: `ghost-${brandId}`,
            isImpersonating: true
        };

        setBrandUser(ghostUser);
        return ghostUser;
    }

    function logoutBrand() {
        setBrandUser(null);
    }

    const value = {
        brandUser,
        loading,
        validateLicense,
        loginBrand,
        signupBrand,
        loginWithGoogle,
        devBrandLogin,
        impersonateBrand,
        logoutBrand
    };

    return (
        <BrandAuthContext.Provider value={value}>
            {children}
        </BrandAuthContext.Provider>
    );
}
