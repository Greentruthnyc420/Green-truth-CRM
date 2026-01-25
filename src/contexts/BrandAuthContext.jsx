import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendPasswordResetEmail
} from "firebase/auth";
import { useAuth, ADMIN_EMAILS } from "./AuthContext";
import { supabase } from '../services/supabaseClient';
import { sendAdminNotification, createUserRegistrationEmail } from '../services/adminNotifications';
import { getAuthErrorMessage } from '../utils/authErrors';

// Reserved System IDs
export const INTERNAL_BRAND_ID = 'greentruth';

// Default brands for fallback - used when database is unavailable
const DEFAULT_BRANDS = {
    'honey-king': { brandId: 'honey-king', brandName: '🍯 Honey King', logo: '/logos/partner-5.png' },
    'canna-dots': { brandId: 'canna-dots', brandName: 'Canna Dots', logo: '/logos/partner-3.jpg' },
    'space-poppers': { brandId: 'space-poppers', brandName: 'Space Poppers', logo: '/logos/partner-2.png' },
    'smoothie-bar': { brandId: 'smoothie-bar', brandName: 'Smoothie Bar', logo: '/logos/smoothie-bar.png' },
    'waferz': { brandId: 'waferz', brandName: 'Waferz NY', logo: '/logos/waferz.png' },
    'pines': { brandId: 'pines', brandName: 'Pines', logo: '/logos/pines.png' },
    'flx-extracts': { brandId: 'flx-extracts', brandName: 'FLX Extracts', logo: '/logos/flx-extracts.png', isProcessor: true, managedBrands: ['pines', 'smoothie-bar', 'waferz'] },
    'jusbud': { brandId: 'jusbud', brandName: 'JUSBUD!', logo: '/logos/jusbud.png' }
};

// Export for backwards compatibility - will be dynamically overwritten
export let AVAILABLE_BRANDS = { ...DEFAULT_BRANDS };

// Legacy support: Map old license numbers to brands (for existing users)
// New users should not use these - they select brand from dropdown
export let BRAND_LICENSES = {
    ...Object.fromEntries(
        Object.entries(AVAILABLE_BRANDS).map(([id, brand]) => [id, brand])
    ),
    'greentruth': { brandId: 'greentruth', brandName: 'Green Truth NYC' }
};

// Users who manage multiple brands (email -> brandIds)
const MULTI_BRAND_USERS = {
    'paripatelny@gmail.com': ['pines', 'smoothie-bar', 'waferz']
};

// FLX Processor users get access to all FLX sub-brands
const FLX_SUB_BRANDS = ['pines', 'smoothie-bar', 'waferz'];

const BrandAuthContext = createContext();

export function useBrandAuth() {
    return useContext(BrandAuthContext);
}

export function BrandAuthProvider({ children }) {
    const [brandUser, setBrandUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availableBrands, setAvailableBrands] = useState(DEFAULT_BRANDS);
    const { currentUser: authUser } = useAuth(); // renamed for clarity

    // Load brands dynamically from Supabase admin_brands table
    useEffect(() => {
        async function loadBrands() {
            try {
                const { data, error } = await supabase
                    .from('admin_brands')
                    .select('*')
                    .eq('status', 'active')
                    .order('name', { ascending: true });

                if (error) throw error;

                if (data && data.length > 0) {
                    // Transform database records to brand format
                    const dynamicBrands = {};
                    data.forEach(b => {
                        dynamicBrands[b.id] = {
                            brandId: b.id,
                            brandName: b.name,
                            logo: b.logo || null,
                            isProcessor: b.is_processor || false,
                            managedBrands: b.managed_brands || []
                        };
                    });

                    // Merge with defaults (defaults act as fallback for missing logos etc)
                    const mergedBrands = { ...DEFAULT_BRANDS, ...dynamicBrands };
                    setAvailableBrands(mergedBrands);

                    // Update the exports for backwards compatibility
                    AVAILABLE_BRANDS = mergedBrands;
                    BRAND_LICENSES = {
                        ...Object.fromEntries(
                            Object.entries(mergedBrands).map(([id, brand]) => [id, brand])
                        ),
                        'greentruth': { brandId: 'greentruth', brandName: 'Green Truth NYC' }
                    };

                    console.log('[BrandAuth] Loaded', Object.keys(dynamicBrands).length, 'brands from database');
                }
            } catch (err) {
                console.warn('[BrandAuth] Failed to load brands from database, using defaults:', err);
            }
        }
        loadBrands();
    }, []);

    // Sync brandUser with Firebase Auth state
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    // Check if this user is a brand user (Supabase)
                    const { data: mapping, error } = await supabase
                        .from('brand_users')
                        .select('*')
                        .eq('uid', user.uid)
                        .single();

                    if (mapping) {
                        const brandInfo = BRAND_LICENSES[mapping.licenseNumber];

                        if (!brandInfo) {
                            console.warn("Brand license not found for user:", mapping.licenseNumber);
                            setBrandUser(null);
                        } else {
                            // Support for multi-brand
                            let extraBrands = [];
                            const multiBrandConfig = MULTI_BRAND_USERS[user.email?.toLowerCase()];
                            if (multiBrandConfig && Array.isArray(multiBrandConfig)) {
                                extraBrands = multiBrandConfig.map(bid => {
                                    const key = Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === bid);
                                    return key ? { ...BRAND_LICENSES[key], license: key } : null;
                                }).filter(Boolean);
                            } else if (mapping.allowedBrands && Array.isArray(mapping.allowedBrands)) {
                                extraBrands = mapping.allowedBrands.filter(Boolean); // Assuming migrated JSON structure matches
                            }

                            setBrandUser({
                                ...brandInfo,
                                email: user.email,
                                uid: user.uid,
                                licenseNumber: mapping.licenseNumber,
                                // Set isProcessor based on account_type, with backward compatibility
                                isProcessor: mapping.account_type === 'processor' || brandInfo.brandId === 'flx-extracts',
                                allowedBrands: extraBrands.length > 0 ? extraBrands : [{ ...brandInfo, license: mapping.licenseNumber }],
                                teamRole: 'owner' // Original brand owner
                            });
                        }
                    } else {
                        // User not in brand_users - check if they're a team member
                        const { data: teamMemberships } = await supabase
                            .from('brand_team_members')
                            .select('*, admin_brands!inner(id, name, logo, is_processor, managed_brands)')
                            .ilike('email', user.email)
                            .not('invite_accepted', 'is', false);

                        if (teamMemberships && teamMemberships.length > 0) {
                            // User is a team member - use their first membership
                            const membership = teamMemberships[0];
                            const brand = membership.admin_brands;

                            // Link user_id if not already linked
                            if (!membership.user_id) {
                                await supabase
                                    .from('brand_team_members')
                                    .update({
                                        user_id: user.uid,
                                        invite_accepted: true,
                                        updated_at: new Date().toISOString()
                                    })
                                    .eq('id', membership.id);
                                console.log('[BrandAuth] Linked team member:', user.email, 'to brand:', brand.id);
                            }

                            setBrandUser({
                                brandId: brand.id,
                                brandName: brand.name,
                                logo: brand.logo,
                                email: user.email,
                                uid: user.uid,
                                isProcessor: brand.is_processor || false,
                                allowedBrands: [{ brandId: brand.id, brandName: brand.name, license: brand.id }],
                                teamRole: membership.role, // 'admin', 'manager', or 'viewer'
                                isTeamMember: true
                            });
                            console.log('[BrandAuth] Team member logged in:', user.email, 'Role:', membership.role);
                        } else if (brandUser && !brandUser.isImpersonating) {
                            setBrandUser(null);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching brand user mapping:", err);
                    setBrandUser(null);
                }
            } else {
                setBrandUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Check if a brand already has verified owner (to skip secret gate)
    // Returns true if brand owner has completed first login (password_changed = true)
    async function checkBrandHasUsers(brandId) {
        try {
            // First check if brand has password_changed = true in admin_brands
            const { data: brandData, error: brandError } = await supabase
                .from('admin_brands')
                .select('password_changed, owner_user_id')
                .eq('id', brandId)
                .single();

            if (brandError) throw brandError;

            // If brand owner has completed first login, skip the gate
            if (brandData?.password_changed === true) {
                return true;
            }

            // Fallback: check if there are any brand_users for this brand
            const { data, error } = await supabase
                .from('brand_users')
                .select('uid')
                .eq('brandId', brandId)
                .limit(1);

            if (error) throw error;
            return data && data.length > 0;
        } catch (err) {
            console.warn('[BrandAuth] Failed to check brand users:', err);
            return false; // Default to requiring gate if check fails
        }
    }

    // Create an invite for a new team member
    async function createTeamInvite(email, role = 'member') {
        if (!brandUser) throw new Error('Must be logged in to invite team members');

        const inviteToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry

        try {
            const { error } = await supabase.from('brand_invites').insert([{
                brand_id: brandUser.brandId,
                license_number: brandUser.licenseNumber,
                email: email.toLowerCase(),
                role: role,
                invite_token: inviteToken,
                expires_at: expiresAt.toISOString(),
                invited_by: brandUser.uid,
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;
            return { success: true, token: inviteToken };
        } catch (err) {
            console.error('[BrandAuth] Failed to create invite:', err);
            throw new Error('Failed to create invite. Please try again.');
        }
    }

    // Get pending invites for a brand
    async function getPendingInvites() {
        if (!brandUser) return [];

        try {
            const { data, error } = await supabase
                .from('brand_invites')
                .select('*')
                .eq('brand_id', brandUser.brandId)
                .is('accepted_at', null)
                .gt('expires_at', new Date().toISOString());

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('[BrandAuth] Failed to get invites:', err);
            return [];
        }
    }

    // Get team members for a brand
    async function getTeamMembers() {
        if (!brandUser) return [];

        try {
            const { data, error } = await supabase
                .from('brand_users')
                .select('*')
                .eq('brandId', brandUser.brandId);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn('[BrandAuth] Failed to get team members:', err);
            return [];
        }
    }

    // Validate license number and return brand info if valid
    function validateLicense(licenseNumber) {
        const normalized = licenseNumber?.toUpperCase().trim();
        return BRAND_LICENSES[normalized] || null;
    }

    // Signup with license verification
    async function signupBrand(email, password, licenseNumber, accountType = 'brand') {
        setLoading(true);
        try {
            const brandInfo = validateLicense(licenseNumber);
            if (!brandInfo) {
                throw new Error('Invalid license number. Please check your brand license.');
            }

            // 1. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Determine allowedBrands for processor accounts
            let allowedBrands = null;
            if (accountType === 'processor' && brandInfo.managedBrands && brandInfo.managedBrands.length > 0) {
                // Auto-assign brands for known processors
                allowedBrands = brandInfo.managedBrands.map(bid => {
                    const key = Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === bid);
                    return key ? { ...BRAND_LICENSES[key], license: key } : null;
                }).filter(Boolean);
            }
            // else: allowedBrands stays null - can be manually configured later in Supabase

            // 3. Create Mapping in Supabase
            const license = licenseNumber.toUpperCase().trim();
            const { error } = await supabase.from('brand_users').insert([{
                uid: user.uid,
                email: email,
                licenseNumber: license,
                brandId: brandInfo.brandId,
                account_type: accountType, // Store account type
                allowedBrands: allowedBrands, // Store auto-assigned brands (if any)
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            // 4. Set this user as the brand owner (first to sign up is admin)
            try {
                await supabase
                    .from('admin_brands')
                    .update({
                        owner_user_id: user.uid,
                        login_email: email,
                        password_changed: true
                    })
                    .eq('id', brandInfo.brandId);
                console.log('[BrandAuth] Set brand owner:', brandInfo.brandId, user.uid);
            } catch (ownerErr) {
                console.warn('[BrandAuth] Failed to set brand owner:', ownerErr);
            }

            // Send admin notification
            try {
                const { html, text } = createUserRegistrationEmail({
                    userEmail: email,
                    role: `Brand User (${brandInfo.brandName})`,
                    timestamp: new Date().toLocaleString()
                });

                await sendAdminNotification({
                    subject: `👤 New Brand User: ${email}`,
                    html,
                    text
                });
            } catch (emailErr) {
                console.warn("New brand user email notification failed:", emailErr);
            }

            return user;
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Login with license verification (for brand owners)
    // Also allows team members to login without license
    async function loginBrand(email, password, licenseNumber) {
        setLoading(true);
        try {
            // 1. Sign in with Firebase Auth first
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Check if brand owner (in brand_users)
            const { data: mapping } = await supabase
                .from('brand_users')
                .select('*')
                .eq('uid', user.uid)
                .single();

            if (mapping) {
                // Brand owner - verify license matches
                const brandInfo = validateLicense(licenseNumber);
                if (brandInfo && mapping.licenseNumber.toUpperCase().trim() !== licenseNumber.toUpperCase().trim()) {
                    throw new Error("This account is linked to a different brand license.");
                }
                return user;
            }

            // 3. If not in brand_users, check if team member
            const { data: teamMember } = await supabase
                .from('brand_team_members')
                .select('*')
                .ilike('email', email)
                .single();

            if (teamMember) {
                // Team member - allow login, onAuthStateChanged will handle the rest
                console.log('[BrandAuth] Team member login:', email);
                return user;
            }

            // 4. Neither brand owner nor team member
            throw new Error('Account not linked to any brand. Please contact your brand administrator for an invite.');
        } catch (error) {
            console.error("Login error:", error);
            throw new Error(getAuthErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }

    // Signup for invited team members (no license needed, just email/password)
    async function signupTeamMember(email, password) {
        setLoading(true);
        try {
            // 1. Check if this email has a pending invite
            const { data: invite } = await supabase
                .from('brand_team_members')
                .select('*, admin_brands!inner(id, name)')
                .ilike('email', email)
                .single();

            if (!invite) {
                throw new Error('No pending invite found for this email. Please ask a brand administrator to invite you.');
            }

            // 2. Create Firebase account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Link user_id and accept invite
            await supabase
                .from('brand_team_members')
                .update({
                    user_id: user.uid,
                    invite_accepted: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', invite.id);

            console.log('[BrandAuth] Team member signed up:', email, 'Brand:', invite.admin_brands.name);

            // Send admin notification
            try {
                const { html, text } = createUserRegistrationEmail({
                    userEmail: email,
                    role: `Team Member (${invite.admin_brands.name}) - ${invite.role}`,
                    timestamp: new Date().toLocaleString()
                });

                await sendAdminNotification({
                    subject: `👥 New Team Member: ${email}`,
                    html,
                    text
                });
            } catch (emailErr) {
                console.warn("Team member email notification failed:", emailErr);
            }

            return user;
        } catch (error) {
            console.error("Team signup error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Dev test login - bypasses license verification
    function devBrandLogin(brandId) {
        if (!import.meta.env.DEV) {
            console.warn("Dev login is disabled in production.");
            return null;
        }

        const licenseKey = Object.keys(BRAND_LICENSES).find(key => BRAND_LICENSES[key].brandId === brandId);
        if (!licenseKey) {
            console.error('Unknown brand ID for dev login');
            return null;
        }
        const brandInfo = BRAND_LICENSES[licenseKey];

        // Handle processors - set up allowedBrands from managedBrands
        let allowedBrands = [];
        if (brandInfo.isProcessor && brandInfo.managedBrands && brandInfo.managedBrands.length > 0) {
            allowedBrands = brandInfo.managedBrands.map(bid => {
                const key = Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === bid);
                return key ? { ...BRAND_LICENSES[key], license: key } : null;
            }).filter(Boolean);
        }

        const mockBrandUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: `${brandId}@example.com`,
            displayName: brandInfo.brandName,
            uid: `brand-${brandId}`,
            isProcessor: brandInfo.isProcessor || false,
            allowedBrands: allowedBrands
        };

        console.log('[DevLogin] Created mock brand user:', mockBrandUser);
        setBrandUser(mockBrandUser);
        return mockBrandUser;
    }

    // Mock Google Login for Brand Portal - Updated to real logic
    async function loginWithGoogle(licenseNumber) {
        setLoading(true);
        try {
            const googleProvider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check for existing mapping (Supabase)
            const { data: mapping } = await supabase
                .from('brand_users')
                .select('*')
                .eq('uid', user.uid)
                .single();

            if (!mapping) {
                if (!licenseNumber) {
                    await auth.signOut();
                    throw new Error("This Google account is not linked to a brand. Please sign in with your brand license first.");
                }

                const brandInfo = validateLicense(licenseNumber);
                if (!brandInfo) throw new Error('Invalid license number.');

                // Create the mapping (Supabase)
                const { error } = await supabase.from('brand_users').insert([{
                    uid: user.uid,
                    email: user.email,
                    licenseNumber: licenseNumber.toUpperCase().trim(),
                    brandId: brandInfo.brandId,
                    created_at: new Date().toISOString()
                }]);
                if (error) throw error;

                // Send admin notification
                try {
                    const { html, text } = createUserRegistrationEmail({
                        userEmail: user.email,
                        role: `Brand User (${brandInfo.brandName} - Google)`,
                        timestamp: new Date().toLocaleString()
                    });

                    await sendAdminNotification({
                        subject: `👤 New Brand User (Google): ${user.email}`,
                        html,
                        text
                    });
                } catch (emailErr) {
                    console.warn("New brand user email notification failed:", emailErr);
                }
            }

            return user;
        } catch (error) {
            console.error("Google Login Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }

    // Switch context for multi-brand users (Processors)
    function switchBrand(targetBrandId) {
        if (!brandUser || !brandUser.allowedBrands) return;

        const targetBrand = brandUser.allowedBrands.find(b => b.brandId === targetBrandId);
        // Also allow switching back to the "Root" brand if it's not in the array (usually the license holder)
        const isRoot = brandUser.licenseNumber && BRAND_LICENSES[brandUser.licenseNumber]?.brandId === targetBrandId;

        if (targetBrand || isRoot) {
            const newBrandInfo = targetBrand || BRAND_LICENSES[brandUser.licenseNumber];
            setBrandUser(prev => ({
                ...prev,
                ...newBrandInfo,
                // Keep the root license/email/uid same, just swap permission context
                // But we might want to flag that we are "viewing as" someone else?
                // For now, simple swap is enough as the UI uses brandId
            }));
        } else {
            console.warn("Attempted to switch to unauthorized brand:", targetBrandId);
        }
    }

    // Admin Backdoor: Impersonate a brand
    function impersonateBrand(brandId, returnUrl = null) {
        // Verify Admin via AuthContext
        const isAuthorized = authUser && ADMIN_EMAILS.includes(authUser.email?.toLowerCase());

        if (!isAuthorized) {
            console.error("Unauthorized attempt to impersonate brand.");
            throw new Error("Access Denied: You are not an authorized administrator.");
        }

        // Find brand info by brandId
        const licenseKey = Object.keys(BRAND_LICENSES).find(key => BRAND_LICENSES[key].brandId === brandId);
        if (!licenseKey) throw new Error("Brand not found.");

        const brandInfo = BRAND_LICENSES[licenseKey];

        // Processor Logic: If impersonating a processor, give them their sub-brands
        let extraBrands = [];
        if (brandInfo.isProcessor && brandId === 'flx-extracts') {
            extraBrands = FLX_SUB_BRANDS.map(bid => {
                const key = Object.keys(BRAND_LICENSES).find(k => BRAND_LICENSES[k].brandId === bid);
                return key ? { ...BRAND_LICENSES[key], license: key } : null;
            }).filter(Boolean);
        }

        const ghostUser = {
            ...brandInfo,
            licenseNumber: licenseKey,
            email: authUser.email, // Use admin email
            displayName: `👻 ${brandInfo.brandName} (Admin)`,
            uid: `ghost-${brandId}`,
            isImpersonating: true,
            returnUrl: returnUrl, // Store the URL to return to
            allowedBrands: extraBrands
        };

        setBrandUser(ghostUser);
        return ghostUser;
    }

    // Real Password reset functionality
    async function resetPassword(email) {
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true, message: 'Password reset link sent to your email.' };
        } catch (error) {
            console.error("Password reset error:", error);
            let msg = error.message;
            if (msg.includes("user-not-found")) msg = "No user found with this email.";
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }

    async function logoutBrand() {
        try {
            await auth.signOut();
        } catch (err) {
            console.error("Error during brand sign out:", err);
        } finally {
            setBrandUser(null);
        }
    }

    const value = {
        brandUser,
        loading,
        availableBrands,
        validateLicense,
        loginBrand,
        signupBrand,
        signupTeamMember,
        loginWithGoogle,
        devBrandLogin,
        impersonateBrand,
        switchBrand,
        resetPassword,
        logoutBrand,
        // Team management functions
        checkBrandHasUsers,
        createTeamInvite,
        getPendingInvites,
        getTeamMembers
    };

    return (
        <BrandAuthContext.Provider value={value}>
            {!loading && children}
        </BrandAuthContext.Provider>
    );
}
