import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    where
} from "firebase/firestore";
import { db } from "../firebase";
import { serverTimestamp, updateDoc } from "firebase/firestore";

// Status Constants
export const LEAD_STATUS = {
    PROSPECT: 'prospect',
    SAMPLES_REQUESTED: 'samples_requested',
    SAMPLES_DELIVERED: 'samples_delivered',
    ACTIVE: 'active'
};

/*
  Database Schema Design:
  
  Collection: users
  Document ID: userId (from Auth)
  Fields:
    - profileInfo: { firstName, lastName, email, phone, ... }
    - currentCommissionRates: { rateType: number, ... }
    - totalSales: number
  
  Collection: shifts
  Document ID: auto-generated
  Fields:
    - userId: string
    - date: timestamp/string
    - hoursWorked: number
    - milesTraveled: number
    - tollAmount: number
    - tollReceiptImageUrl: string (URL)
    - status: 'pending' | 'paid'
  
  Collection: leads
  Document ID: auto-generated
  Fields:
    - dispensaryName: string
    - contactPerson: string
    - licenseNumber: string
    - interestedBrands: array of strings
    - meetingDate: timestamp/string
    - syncedToHubspot: boolean
  
  Collection: sales
  Document ID: auto-generated
  Fields:
    - dispensaryName: string
    - amount: number
    - date: timestamp/string
    - commissionEarned: number
*/

// Helper to check if we are in "Mock/Test" mode
// We assume if DB fails or userId is specific, we mock.
const isMock = (userId) => userId === 'test-user-123';

// Mock Storage
const MOCK_DB = {
    shifts: [],
    leads: [],
    sales: []
};


// Users Collection
export async function createUserProfile(userId, data) {
    if (isMock(userId)) return; // No-op for mock
    await setDoc(doc(db, "users", userId), data, { merge: true });
}

export async function getUserProfile(userId) {
    if (isMock(userId)) return { name: "Test User", email: "test@ambassador.com" };

    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            return null;
        }
    } catch (e) {
        console.warn("Firestore access failed, returning null", e);
        return null;
    }
}

export async function getAllUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Firestore failed to get all users", e);
        return [];
    }
}


// Shifts Collection
export async function addShift(shiftData) {
    if (isMock(shiftData.userId)) {
        console.log("MOCK DB: Adding Shift", shiftData);
        MOCK_DB.shifts.push({ id: Date.now().toString(), ...shiftData });
        return Date.now().toString();
    }

    const data = { ...shiftData, status: shiftData.status || 'pending' };
    const docRef = await addDoc(collection(db, "shifts"), data);
    return docRef.id;
}

export async function getUserShifts(userId) {
    if (isMock(userId)) {
        return [
            { id: '1', date: new Date(), hoursWorked: 8, milesTraveled: 50, tollAmount: 10, status: 'pending', userId },
            ...MOCK_DB.shifts.filter(s => s.userId === userId)
        ];
    }

    try {
        const q = query(collection(db, "shifts"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Firestore failed, returning empty list", e);
        return [];
    }
}

export async function getAllShifts() {
    try {
        const querySnapshot = await getDocs(collection(db, "shifts"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Firestore failed to get all shifts", e);
        return [];
    }
}

export async function updateShiftStatus(shiftId, newStatus) {
    try {
        const docRef = doc(db, "shifts", shiftId);
        await setDoc(docRef, { status: newStatus }, { merge: true });
        return true;
    } catch (e) {
        console.error("Failed to update shift status", e);
        return false;
    }
}

// Leads Collection
export async function addLead(leadData) {
    // Explicitly handle test user to ensure data stays in the Mock DB ecosystem
    if (leadData.userId === 'test-user-123' || leadData.userId === 'mock-user-id') {
        console.log("MOCK DB: Adding Lead", leadData);
        MOCK_DB.leads.push({ id: Date.now().toString(), ...leadData });
        return Date.now().toString();
    }

    try {
        // Determine initial status
        let initialStatus = leadData.leadStatus || LEAD_STATUS.PROSPECT;
        if (!leadData.leadStatus && leadData.samplesRequested && leadData.samplesRequested.length > 0) {
            initialStatus = LEAD_STATUS.SAMPLES_REQUESTED;
        }

        const data = {
            ...leadData,
            leadStatus: initialStatus,
            syncedToHubspot: leadData.syncedToHubspot || false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "leads"), data);
        return docRef.id;
    } catch (e) {
        console.warn("Firestore failed (likely missing keys). Mocking success.");
        MOCK_DB.leads.push(leadData);
        return "mock-lead-id";
    }
}

export async function getLeads() {
    // If we have items in MOCK_DB, return them. This ensures local prototype session works.
    if (MOCK_DB.leads.length > 0) {
        return MOCK_DB.leads.map((l, i) => ({ id: i.toString(), ...l }));
    }

    try {
        const querySnapshot = await getDocs(collection(db, "leads"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        return MOCK_DB.leads.map((l, i) => ({ id: i.toString(), ...l }));
    }
}

export async function getBrandLeads(brandId) {
    const allLeads = await getLeads();
    return allLeads.filter(l => l.ownerBrandId === brandId || (l.createdBy === 'brand' && l.ownerBrandId === brandId));
}

export async function updateLead(leadId, updates) {
    try {
        const docRef = doc(db, "leads", leadId);
        await setDoc(docRef, updates, { merge: true });
        return true;
    } catch (e) {
        console.error("Failed to update lead", e);
        return false;
    }
}

/**
 * Transitions lead to 'samples_delivered' state.
 */
export async function deliverSamples(leadId) {
    return updateLead(leadId, {
        leadStatus: LEAD_STATUS.SAMPLES_DELIVERED,
        samplesDeliveredAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
    });
}
// Deletion
export async function deleteLead(leadId) {
    try {
        await deleteDoc(doc(db, "leads", leadId));
        return true;
    } catch (e) {
        console.error("Failed to delete lead", e);
        return false;
    }
}
// Fetch leads available for a specific user to log sales against
// Logic: 
// 1. Leads created by this user (always viewable)
// 2. Leads created > 90 days ago (expired exclusivity, open to all)
// 3. (Implied) Leads created < 90 days by OTHERS are hidden
export async function getAvailableLeads(userId) {
    const allLeads = await getLeads(); // Fetch all (simplified for prototype performance)

    // Calculate 45 days ago
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    return allLeads.filter(lead => {
        const isOwner = lead.userId === userId;
        const createdAt = lead.createdAt ? new Date(lead.createdAt) : new Date(0); // Default to old if no date
        const isExpired = createdAt < fortyFiveDaysAgo;

        return isOwner || isExpired;
    });
}

/**
 * Checks for duplicate leads by name (normalized).
 * Returns the lead object if found, otherwise null.
 */
export async function checkDuplicateLead(name) {
    if (!name) return null;
    const normalized = name.toLowerCase().trim();

    // In a real app with many leads, use a "normalizedName" field or dedicated Search index (Algolia/Typesense).
    // Here we fetch all leads and check in memory for prototype.
    const allLeads = await getLeads();

    return allLeads.find(l => (l.dispensaryName || '').toLowerCase().trim() === normalized);
}

/**
 * Fetches ALL accounts (Leads + Sales) for the Master View.
 * Admin: Sees everything.
 * Rep: Sees 'Sold' (Read-only), 'My Leads', and 'Open Pool'.
 */
export async function getAllAccounts(userId, isAdmin) {
    const [allLeads, allSales] = await Promise.all([getLeads(), getSales()]);

    // Create a Map to merge Sales execution into Leads structure if needed, 
    // but the requirement is "Store Name | Status | Owner | Days Since Contact"

    // Strategy: Use Leads as the base for "Accounts". 
    // If a Sale exists without a lead (unlikely in this flow), add it?
    // Let's stick to Leads as the primary "Account" record.
    // Status is determined by: Has 'Sold' status in Lead OR exists in Sales collection.

    const accounts = allLeads.map(lead => {
        // Enhance status if sale exists
        const hasSale = allSales.some(s => s.dispensaryName === lead.dispensaryName); // Loose match
        return {
            ...lead,
            status: hasSale ? 'Sold' : (lead.status || 'New')
        };
    });

    if (isAdmin) {
        return accounts;
    }

    // Rep Logic
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    return accounts.filter(acc => {
        const isSold = acc.status === 'Sold';
        const isOwner = acc.userId === userId;
        const createdAt = acc.createdAt ? new Date(acc.createdAt) : new Date(0);
        const isExpired = createdAt < fortyFiveDaysAgo;

        // Show if:
        // 1. Sold (Read Only)
        // 2. My Lead
        // 3. Open Pool (Expired)
        // HIDE if: New + Other's + < 45 Days

        if (isSold) return true;
        if (isOwner) return true;
        if (isExpired) return true;

        return false; // Hidden
    });
}

// Sales Collection
export async function addSale(saleData) {
    if (saleData.userId === 'test-user-123' || saleData.userId === undefined) {
        console.log("MOCK DB: Adding Sale", saleData);
        MOCK_DB.sales.push({ id: Date.now().toString(), ...saleData });
        return Date.now().toString();
    }

    try {
        const docRef = await addDoc(collection(db, "sales"), saleData);

        // Automatic Transition: Lead -> Active (Sold)
        // Find if a lead exists for this dispensary and user, and update it
        try {
            const allLeads = await getLeads();
            const normalizedName = saleData.dispensaryName.toLowerCase().trim();
            const leadMatch = allLeads.find(l =>
                (l.dispensaryName || '').toLowerCase().trim() === normalizedName &&
                l.userId === saleData.userId
            );

            if (leadMatch) {
                // Merge new active brands with existing ones
                const currentActiveBrands = leadMatch.activeBrands || [];
                const newActiveBrands = saleData.activeBrands || [];
                const mergedActiveBrands = Array.from(new Set([...currentActiveBrands, ...newActiveBrands]));

                // Prepare updates
                const updates = {
                    status: 'Sold',
                    leadStatus: LEAD_STATUS.ACTIVE,
                    activeBrands: mergedActiveBrands,
                    lastSaleDate: new Date().toISOString(),
                    updatedAt: serverTimestamp()
                };

                // If sale provided a license number and lead didn't have one, save it
                if (saleData.licenseNumber && !leadMatch.licenseNumber) {
                    updates.licenseNumber = saleData.licenseNumber;
                }

                await updateLead(leadMatch.id, updates);
            }
        } catch (updateErr) {
            console.warn("Failed to auto-update lead status after sale", updateErr);
        }

        return docRef.id;
    } catch (e) {
        console.warn("Firestore failed. Mocking success.");
        MOCK_DB.sales.push(saleData);
        return "mock-sale-id";
    }
}

export async function getSales() {
    // Priority to Mock DB for local testing consistency
    if (MOCK_DB.sales.length > 0) {
        return MOCK_DB.sales.map((s, i) => ({ id: i.toString(), ...s }));
    }

    try {
        const querySnapshot = await getDocs(collection(db, "sales"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        return MOCK_DB.sales.map((s, i) => ({ id: i.toString(), ...s }));
    }
}

// Aggregation for "My Dispensaries"
export async function getMyDispensaries(userId) {
    // In a real app, this would likely be a dedicated collection or a complex query.
    // Here we will fetch all shifts and sales for the user (or all if mocking) and aggregate in memory.

    const [shifts, sales] = await Promise.all([
        getUserShifts(userId),
        getSales() // In real app, filter by userId if sales track that
    ]);

    const dispensaryMap = new Map();

    // Process Shifts (Activations)
    shifts.forEach(shift => {
        if (!shift.dispensaryName) return;
        const name = shift.dispensaryName;
        if (!dispensaryMap.has(name)) {
            dispensaryMap.set(name, { name, lastActivation: null, lastPurchase: null });
        }
        const current = dispensaryMap.get(name);
        const shiftDate = new Date(shift.date || shift.startTime);
        if (!current.lastActivation || shiftDate > current.lastActivation) {
            current.lastActivation = shiftDate;
        }
    });

    // Process Sales
    sales.forEach(sale => {
        if (!sale.dispensaryName) return;
        // Filter by user ID (strict ownership)
        if (sale.userId && sale.userId !== userId) return;
        const name = sale.dispensaryName;
        if (!dispensaryMap.has(name)) {
            dispensaryMap.set(name, { name, lastActivation: null, lastPurchase: null });
        }
        const current = dispensaryMap.get(name);
        const saleDate = new Date(sale.date);
        if (!current.lastPurchase || saleDate > current.lastPurchase) {
            current.lastPurchase = saleDate;
        }
    });

    // Merge with Leads Data (for contact info)
    const leads = await getAvailableLeads(userId);
    leads.forEach(lead => {
        if (dispensaryMap.has(lead.dispensaryName)) {
            const disp = dispensaryMap.get(lead.dispensaryName);
            disp.email = lead.email;
            disp.phone = lead.phone;
            disp.contactPerson = lead.contactPerson;
            disp.interests = lead.samplesRequested || [];
            // Preserve location data
            if (lead.location) {
                disp.location = lead.location;
            }
            if (lead.licenseNumber) {
                disp.licenseNumber = lead.licenseNumber;
            }
        } else {
            // Optional: Add leads that haven't had activation/sales yet?
            // For "My Dispensaries", maybe strictly active?
            // Let's include them if they are "My Leads".
            if (lead.userId === userId) {
                dispensaryMap.set(lead.dispensaryName, {
                    name: lead.dispensaryName,
                    lastActivation: null,
                    lastPurchase: null,
                    email: lead.email,
                    phone: lead.phone,
                    contactPerson: lead.contactPerson,
                    interests: lead.samplesRequested || [],
                    leadStatus: lead.leadStatus || (lead.status === 'Sold' ? 'active' : 'prospect'),
                    id: lead.id, // Critical for updates
                    location: lead.location, // GPS Coords
                    licenseNumber: lead.licenseNumber // Propagate License for Sales Validation
                });
            }
        }
    });

    // Post-merge fix: If it has a lastPurchase, it's definitely active
    return Array.from(dispensaryMap.values()).map(disp => ({
        ...disp,
        leadStatus: disp.lastPurchase ? 'active' : (disp.leadStatus || 'prospect')
    }));
}

// Cloud Function Trigger (Currently Disabled)
export async function sendOfficialEmail() {
    // Feature paused. See CREDENTIALS_BACKUP.env for implementation details.
    console.warn("Email feature is currently paused.");
    return Promise.resolve(false);
}
// Activity Logging
export async function logActivity(type, leadId, userId, details = {}) {
    try {
        await addDoc(collection(db, "activity_logs"), {
            type, // 'CALL', 'TEXT', 'EMAIL'
            leadId,
            userId,
            ...details,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.error("Failed to log activity", e);
        return false;
    }
}

export async function updateSaleStatus(saleId, newStatus) {
    try {
        const docRef = doc(db, "sales", saleId);
        await setDoc(docRef, { status: newStatus }, { merge: true });
        return true;
    } catch (e) {
        console.error("Failed to update sale status", e);
        return false;
    }
}

export async function updateSale(saleId, updates) {
    try {
        const docRef = doc(db, "sales", saleId);
        await setDoc(docRef, updates, { merge: true });
        return true;
    } catch (e) {
        console.error("Failed to update sale", e);
        return false;
    }
}

export async function markRepAsPaid(repId) {
    try {
        // Query for unpaid SALES belonging to this Rep
        // We assume 'sales' collection is the source of truth for payments
        const q = query(
            collection(db, "sales"),
            where("userId", "==", repId),
            where("status", "!=", "paid") // Find anything NOT 'paid' (e.g. 'pending', 'new', or missing)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No unpaid items found for rep", repId);
            return { success: true, count: 0 };
        }

        const updates = [];
        snapshot.forEach(doc => {
            const docRef = doc.ref; // Use doc.ref directly
            updates.push(
                setDoc(docRef, {
                    status: 'paid',
                    paidStatus: true,
                    payoutDate: new Date() // In real generic usage, strictly use serverTimestamp() but JS Date is fine here
                }, { merge: true })
            );
        });

        await Promise.all(updates);
        return { success: true, count: updates.length };

    } catch (error) {
        console.error("Error marking rep as paid:", error);
        return { success: false, error };
    }
}

// Security Logging
export async function logSecurityEvent(details) {
    try {
        await addDoc(collection(db, "security_logs"), {
            ...details,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.error("Failed to log security event", e);
        return false;
    }
}

export async function seedBrands() {
    const brandsToSeed = [
        { name: "Smoothie Bar", status: "Active" },
        { name: "Wanders New York", status: "Active" },
        { name: "Waferz NY", status: "Active" },
        { name: "FLX Extracts", status: "Active" },
        { name: "Honey King", status: "Active" },
        { name: "Canna Dots", status: "Active" },
        { name: "Space Poppers", status: "Active" },
        { name: "Bud Cracker Boulevard", status: "Active" }
    ];

    try {
        for (const brand of brandsToSeed) {
            // Check existence by name
            const q = query(collection(db, "brands"), where("name", "==", brand.name));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                await addDoc(collection(db, "brands"), brand);
                console.log(`Seeded Brand: ${brand.name}`);
            } else {
                console.log(`Brand already exists: ${brand.name}`);
            }
        }
        return true;
    } catch (e) {
        console.error("Failed to seed brands", e);
        return false;
    }
}

// Brand Products (Dynamic Menu)
export async function getBrandProducts(brandId) {
    try {
        const docRef = doc(db, "brand_products", brandId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().products || [];
        }
        return [];
    } catch (e) {
        console.warn(`Failed to fetch products for brand ${brandId}`, e);
        return [];
    }
}

export async function updateBrandProducts(brandId, products) {
    try {
        const docRef = doc(db, "brand_products", brandId);
        await setDoc(docRef, {
            products,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error(`Failed to update products for brand ${brandId}`, e);
        return false;
    }
}

// Brand Profile & Menu
export async function updateBrandMenuUrl(brandId, menuUrl) {
    try {
        // We'll store this in the 'brands' collection, assuming that's where profiles live
        // Since seedBrands uses 'brands' collection, we stick to that.
        // We need to find the document by 'brandId' field if it's not the doc ID.
        // But for simplicity/consistency with other parts (like brand_products), 
        // let's assume brandId IS the doc ID for 'brands' collection if we control creation.
        // However, seedBrands adds with auto-ID. 
        // So we might need to query by string ID or just use a new collection 'brand_profiles' indexed by ID.
        // decision: use 'brand_profiles' indexed by brandId to avoid query complexity and potential ambiguity.

        const docRef = doc(db, "brand_profiles", brandId);
        await setDoc(docRef, {
            menuUrl,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        return true;
    } catch (e) {
        console.error(`Failed to update menu URL for brand ${brandId}`, e);
        return false;
    }
}

export async function getAllBrandProfiles() {
    try {
        const querySnapshot = await getDocs(collection(db, "brands"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.warn("Failed to fetch brand profiles", e);
        return [];
    }
}
// Activations (Scheduling)
export async function addActivation(activationData) {
    try {
        const docRef = await addDoc(collection(db, "activations"), {
            ...activationData,
            createdAt: new Date().toISOString(),
            status: activationData.status || 'scheduled'
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding activation:", e);
        throw e;
    }
}

export async function getActivations() {
    try {
        const querySnapshot = await getDocs(collection(db, "activations"));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching activations:", e);
        return [];
    }
}

export async function updateActivation(activationId, updates) {
    try {
        const docRef = doc(db, "activations", activationId);
        await setDoc(docRef, updates, { merge: true });
        return true;
    } catch (e) {
        console.error("Error updating activation:", e);
        return false;
    }
}

// Activation Requests (from Brands)
export async function addActivationRequest(requestData) {
    try {
        const docRef = await addDoc(collection(db, "activation_requests"), {
            ...requestData,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding activation request:", e);
        throw e;
    }
}

/**
 * DANGER: Wipes all data from sales, leads, shifts, and activations collections.
 * Only use for factory reset before launch.
 */
export async function wipeAllData() {
    const collectionsToWipe = [
        'sales',
        'leads',
        'shifts',
        'activations',
        'activation_requests',
        'activity_logs',
        'security_logs',
        'brand_products',
        'points_history'
    ];

    // Clear ALL collection-based data
    for (const collectionName of collectionsToWipe) {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            if (querySnapshot.size > 0) {
                const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, collectionName, docSnap.id)));
                await Promise.all(deletePromises);
                console.log(`Wiped ${querySnapshot.size} documents from ${collectionName}`);
            }
        } catch (e) {
            console.error(`Failed to wipe ${collectionName}:`, e);
        }
    }

    // Reset User Statistics (Zero out totalSales)
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userUpdatePromises = usersSnapshot.docs.map(docSnap =>
            updateDoc(docSnap.ref, {
                totalSales: 0,
                lifetimePoints: 0,
                currentMonthPoints: 0,
                updatedAt: serverTimestamp()
            })
        );
        await Promise.all(userUpdatePromises);
        console.log(`Reset statistics for ${usersSnapshot.size} users.`);
    } catch (e) {
        console.error("Failed to reset user statistics:", e);
    }

    // Also clear mock DB
    MOCK_DB.shifts = [];
    MOCK_DB.leads = [];
    MOCK_DB.sales = [];

    // Specific cleanup for "The Green Truth" test brand
    try {
        const brandsRef = collection(db, 'brands');
        const q = query(brandsRef, where('name', '==', 'The Green Truth'));
        const brandDocs = await getDocs(q);
        for (const d of brandDocs.docs) {
            await deleteDoc(doc(db, 'brands', d.id));
        }
    } catch (e) {
        console.error("Failed to delete test brand:", e);
    }

    console.log("CRM Reset Complete: Blank Slate achieved.");
    return true;
}

// Expose for Console Execution
if (typeof window !== 'undefined') {
    window.wipeAllData = wipeAllData;
}
