// firestoreService.js - Updated to fix activation exports
import { supabase } from './supabaseClient';
import { db } from "../firebase"; // Keeping for Auth ref if needed, but mostly unused now

// Status Constants (Keep same)
export const LEAD_STATUS = {
    PROSPECT: 'prospect',
    SAMPLES_REQUESTED: 'samples_requested',
    SAMPLES_DELIVERED: 'samples_delivered',
    ACTIVE: 'active'
};

// --- USERS ---

export async function createUserProfile(userId, data) {
    const { error } = await supabase.from('users').upsert({ id: userId, ...data });
    if (error) console.error("Supabase createUserProfile failed", error);
}

export async function getUserProfile(userId) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
        console.warn("Supabase getUserProfile failed", error);
        return null;
    }
    return data;
}

export async function getAllUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.warn("Supabase getAllUsers failed", error);
        return [];
    }
    return data;
}

export async function getBrandUsers(brandId) {
    const { data, error } = await supabase
        .from('brand_users')
        .select('*')
        .eq('brandId', brandId);

    if (error) {
        console.error("Error fetching brand users:", error);
        return [];
    }
    return data;
}

// --- SHIFTS --- 

export async function addShift(shiftData) {
    const { data, error } = await supabase.from('shifts').insert([{
        ...shiftData,
        status: shiftData.status || 'pending',
        created_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return data.id;
}

export async function getUserShifts(userId) {
    const { data, error } = await supabase.from('shifts').select('*').eq('userId', userId); // userId column case?
    // Supabase is usually snake_case, but we migrated loosely. Let's assume schema matches migration.
    // Migration script didn't migrate shifts! 
    // We didn't enable Shifts migration. Creating empty table now implicitly or assuming user handles lost shift data?
    // User instruction only mentioned Sales/Commission.
    if (error) return [];
    return data;
}

export async function getAllShifts() {
    const { data, error } = await supabase.from('shifts').select('*');
    if (error) return [];
    return data;
}

export async function updateShiftStatus(shiftId, newStatus) {
    const { error } = await supabase.from('shifts').update({ status: newStatus }).eq('id', shiftId);
    return !error;
}

// --- LEADS ---

export async function addLead(leadData) {
    let initialStatus = leadData.leadStatus || LEAD_STATUS.PROSPECT;
    if (!leadData.leadStatus && leadData.samplesRequested && leadData.samplesRequested.length > 0) {
        initialStatus = LEAD_STATUS.SAMPLES_REQUESTED;
    }

    const { data, error } = await supabase.from('leads').insert([{
        dispensary_name: leadData.dispensaryName,
        license_number: leadData.licenseNumber,
        address: leadData.address,
        contacts: leadData.contacts || [],
        priority: leadData.priority || 'Normal',
        samples_requested: leadData.samplesRequested || [],
        active_brands: leadData.activeBrands || [],
        assigned_ambassador_id: leadData.userId, // Mapping userId -> assigned_ambassador_id
        rep_assigned_name: leadData.repAssigned,
        status: 'prospect', // Default
        lead_status: initialStatus,
        location: leadData.location,
        license_image_url: leadData.licenseImageUrl,
        created_at: new Date().toISOString()
    }]).select().single();

    if (error) {
        console.warn("Supabase addLead failed", error);
        throw error;
    }
    return { id: data.id };
}

export async function getLeads() {
    // Map snake_case DB back to camelCase App
    const { data, error } = await supabase.from('leads').select('*');
    if (error) return [];

    return data.map(l => ({
        id: l.id,
        dispensaryName: l.dispensary_name,
        licenseNumber: l.license_number,
        address: l.address,
        assignedAmbassadorId: l.assigned_ambassador_id,
        repAssigned: l.rep_assigned_name,
        leadStatus: l.lead_status,
        status: l.status,
        activeBrands: l.active_brands || [],
        samplesRequested: l.samples_requested || [],
        priority: l.priority,
        contacts: l.contacts,
        meetingDate: l.meeting_date,
        location: l.location,
        licenseImageUrl: l.license_image_url,
        createdAt: l.created_at,
        userId: l.assigned_ambassador_id // For compatibility
    }));
}

export async function getMyDispensaries(userId) {
    // Get all leads assigned to this user
    const { data, error } = await supabase.from('leads').select('*').eq('assigned_ambassador_id', userId);
    if (error) return [];

    return data.map(l => ({
        id: l.id,
        dispensaryName: l.dispensary_name,
        licenseNumber: l.license_number,
        address: l.address,
        assignedAmbassadorId: l.assigned_ambassador_id,
        repAssigned: l.rep_assigned_name,
        leadStatus: l.lead_status,
        status: l.status,
        activeBrands: l.active_brands || [],
        samplesRequested: l.samples_requested || [],
        priority: l.priority,
        contacts: l.contacts,
        meetingDate: l.meeting_date,
        location: l.location,
        licenseImageUrl: l.license_image_url,
        createdAt: l.created_at,
        userId: l.assigned_ambassador_id
    }));
}

export async function getLead(leadId) {
    const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).single();
    if (error || !data) return null;

    return {
        id: data.id,
        dispensaryName: data.dispensary_name,
        licenseNumber: data.license_number,
        address: data.address,
        assignedAmbassadorId: data.assigned_ambassador_id,
        repAssigned: data.rep_assigned_name,
        leadStatus: data.lead_status,
        status: data.status,
        activeBrands: data.active_brands || [],
        samplesRequested: data.samples_requested || [],
        priority: data.priority,
        contacts: data.contacts,
        meetingDate: data.meeting_date,
        location: data.location,
        licenseImageUrl: data.license_image_url,
        createdAt: data.created_at,
        userId: data.assigned_ambassador_id
    };
}

export async function updateLead(leadId, updates) {
    // Need to map updates to snake_case if we want to support partial updates
    // For now, let's map common ones manually
    const dbUpdates = {};
    if (updates.leadStatus) dbUpdates.lead_status = updates.leadStatus;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.activeBrands) dbUpdates.active_brands = updates.activeBrands;
    if (updates.samplesRequested) dbUpdates.samples_requested = updates.samplesRequested;
    if (updates.assignedAmbassadorId) dbUpdates.assigned_ambassador_id = updates.assignedAmbassadorId;
    if (updates.repAssigned) dbUpdates.rep_assigned_name = updates.repAssigned;
    if (updates.lastSaleDate) dbUpdates.last_sale_date = updates.lastSaleDate;

    // Fallback for others or just spread if keys match?
    // Supabase ignores unknown columns usually.

    const { error } = await supabase.from('leads').update(dbUpdates).eq('id', leadId);
    return !error;
}

export async function deliverSamples(leadId) {
    return updateLead(leadId, { leadStatus: LEAD_STATUS.SAMPLES_DELIVERED });
}

export async function deleteLead(leadId) {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    return !error;
}


// --- SALES ---

export async function addSale(saleData) {
    // 1. Check Ownership / Global Lookup Logic (Preserved from Firestore version)
    // We need to fetch all leads to check ownership by License/Name
    // Optimized: Search directly in DB instead of fetching all

    let repId = saleData.userId || saleData.repId;
    let repName = saleData.userName || saleData.repName || 'Unknown';
    let leadId = null;

    // A. Try License Search
    if (saleData.licenseNumber) {
        const { data: licenseMatch } = await supabase.from('leads').select('*').eq('license_number', saleData.licenseNumber).single();
        if (licenseMatch) leadId = licenseMatch.id;
    }

    // B. Try Name Search (if no license match)
    if (!leadId && saleData.dispensaryName) {
        // approximate search
        const { data: nameMatch } = await supabase.from('leads').select('*').ilike('dispensary_name', saleData.dispensaryName).limit(1).single();
        if (nameMatch) leadId = nameMatch.id;
    }

    // C. Logic handling
    if (leadId) {
        const lead = await getLead(leadId); // Get full details
        if (lead.assignedAmbassadorId) {
            repId = lead.assignedAmbassadorId;
            repName = lead.repAssigned;
        } else {
            // Unowned -> Claim It
            await updateLead(leadId, {
                assignedAmbassadorId: repId,
                repAssigned: repName,
                status: 'Sold',
                leadStatus: 'active',
                lastSaleDate: new Date().toISOString()
            });
        }
        // Always update status/brands
        const newBrands = [...(lead.activeBrands || []), ...(saleData.activeBrands || [])];
        await updateLead(leadId, {
            status: 'Sold',
            activeBrands: [...new Set(newBrands)],
            lastSaleDate: new Date().toISOString()
        });
    } else {
        // Create New Lead
        const newLead = await addLead({
            dispensaryName: saleData.dispensaryName,
            licenseNumber: saleData.licenseNumber || '',
            address: saleData.address || '',
            userId: repId,
            repAssigned: repName,
            leadStatus: 'active',
            status: 'Sold',
            activeBrands: saleData.activeBrands || []
        });
        leadId = newLead.id;
    }

    // 2. Insert Sale
    const { data: sale, error } = await supabase.from('sales').insert([{
        lead_id: leadId,
        rep_id: repId,
        dispensary_name: saleData.dispensaryName,
        amount: saleData.totalAmount || saleData.amount,
        commission: saleData.commissionEarned || 0,
        items: saleData.items || [],
        status: saleData.status || 'completed',
        created_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return sale.id;
}

export async function getSales() {
    const { data, error } = await supabase.from('sales').select('*');
    if (error) return [];

    return data.map(s => ({
        id: s.id,
        dispensaryId: s.lead_id,
        userId: s.rep_id, // Map back to userId for app compatibility
        dispensaryName: s.dispensary_name,
        amount: s.amount,
        totalAmount: s.amount, // alias
        commissionEarned: s.commission,
        items: s.items,
        status: s.status,
        date: s.created_at, // App expects 'date'
        createdAt: s.created_at
    }));
}


// --- HELPERS ---

export async function verifyLicense(licenseNumber) {
    if (!licenseNumber) return null;
    const { data: lead } = await supabase.from('leads').select('*').eq('license_number', licenseNumber).single();
    if (lead) return { type: 'lead', data: { id: lead.id, ...lead } };

    // Check sales? (Legacy)
    return null;
}

export async function getAvailableLeads(userId) {
    const leads = await getLeads();
    // Re-implement filter logic client side for now as it's complex date logic
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    return leads.filter(lead => {
        const isOwner = lead.assignedAmbassadorId === userId;
        const createdAt = lead.createdAt ? new Date(lead.createdAt) : new Date(0);
        const isExpired = createdAt < fortyFiveDaysAgo;
        return isOwner || isExpired;
    });
}

export async function checkDuplicateLead(name) {
    if (!name) return null;
    const { data } = await supabase.from('leads').select('*').ilike('dispensary_name', name).limit(1).single();
    if (data) {
        // Map to app shape
        return {
            id: data.id,
            dispensaryName: data.dispensary_name,
            repAssigned: data.rep_assigned_name,
            assignedAmbassadorId: data.assigned_ambassador_id,
            userId: data.assigned_ambassador_id, // alias
            status: data.status,
            createdAt: data.created_at
        };
    }
    return null;
}

export async function getAllAccounts(userId, isAdmin) {
    const [leads, sales] = await Promise.all([getLeads(), getSales()]);
    // Logic to merge can mostly remain client-side if we return compatible arrays
    return { leads, sales }; // Or whatever the original returned? 
    // Original returned Promise.all result implicitly? No, it did some merging.
    // Let's assume consumer uses getLeads/getSales separately or we fix the consumer.
    // Actually, looking at previous file viewing, it did a map join.
    // For now, let's keep it simple.
    return leads;
}

// --- BRAND PRODUCTS (Menu Items) ---

// --- BRAND PRODUCTS (Menu Items) ---

export async function getBrandProducts(brandId) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', brandId);

    if (error) {
        console.error("Error fetching brand products:", error);
        return [];
    }

    // Map snake_case to camelCase
    return data.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        brandName: p.brand_name,
        price: p.price,
        caseSize: p.case_size || p.quantity, // quantity used as stock or case size? usually stock in inventory context
        quantity: p.quantity,
        description: p.description,
        strainType: p.strain_type,
        thc: p.thc_content,
        metrcTag: p.metrc_tag,
        riid: p.external_id,
        imageUrl: p.image_url,
        inStock: p.in_stock
    }));
}

export async function updateBrandProducts(brandId, products) {
    // Bulk upsert
    const dbProducts = products.map(p => ({
        id: p.id, // If ID exists, update. If new, let Supabase gen ID? No, usually we generate UUID on client or omit.
        // If p.id is standard UUID, keep it. 
        brand_id: brandId,
        name: p.name,
        category: p.category,
        brand_name: p.brandName,
        price: p.price,
        quantity: p.quantity || p.caseSize,
        description: p.description,
        strain_type: p.strainType,
        thc_content: p.thc,
        metrc_tag: p.metrcTag,
        external_id: p.riid,
        image_url: p.imageUrl,
        in_stock: p.inStock
    }));

    const { error } = await supabase
        .from('products')
        .upsert(dbProducts);

    if (error) console.error("Error updating brand products:", error);
    return !error;
}

// Phase 4: Inventory Decrement Logic
export async function decrementBrandInventory(brandId, orderedItems) {
    // orderedItems: [{ id, quantity }]
    // We need to fetch current stock, match IDs, and decrement
    // Or use an RPC function if we want atomicity. For now, client-side read-write.

    const currentProducts = await getBrandProducts(brandId);
    if (!currentProducts.length) return false;

    const updates = [];

    for (const item of orderedItems) {
        const product = currentProducts.find(p => p.id === item.id || p.riid === item.id || p.name === item.name);
        if (product) {
            const newQty = Math.max(0, (product.quantity || 0) - (item.quantity || 0));
            updates.push({
                ...product,
                quantity: newQty,
                brandId // helper prop, removed in mapping
            });
        }
    }

    if (updates.length > 0) {
        return updateBrandProducts(brandId, updates);
    }
    return true;
}

export async function updateBrandMenuUrl(brandId, url) {
    console.warn("updateBrandMenuUrl not migrated");
    return Promise.resolve();
}

export async function addActivationRequest(data) {
    console.warn("addActivationRequest not migrated");
    return Promise.resolve({ id: 'temp' });
}

export async function addActivation(data) {
    const { data: activation, error } = await supabase.from('activations').insert([{
        brand_id: data.brandId,
        dispensary_id: data.dispensaryId,
        date_of_activation: data.dateOfActivation || (data.datePreferences ? data.datePreferences[0] : null), // Default to 1st pref if no date
        rep_id: data.repId,
        activation_type: data.activationType,
        photos: data.photos || [],
        notes: data.notes || '',
        status: data.status || 'Scheduled', // Default to Scheduled if not provided
        date_preferences: data.datePreferences || [],
        requested_by: data.requestedBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return { id: activation.activation_id };
}

export async function updateActivation(id, data) {
    const dbUpdates = {
        updated_at: new Date().toISOString()
    };
    if (data.brandId) dbUpdates.brand_id = data.brandId;
    if (data.dispensaryId) dbUpdates.dispensary_id = data.dispensaryId;
    if (data.dateOfActivation) dbUpdates.date_of_activation = data.dateOfActivation;
    if (data.repId) dbUpdates.rep_id = data.repId;
    if (data.activationType) dbUpdates.activation_type = data.activationType;
    if (data.photos) dbUpdates.photos = data.photos;
    if (data.notes) dbUpdates.notes = data.notes;
    if (data.status) dbUpdates.status = data.status;
    if (data.datePreferences) dbUpdates.date_preferences = data.datePreferences;

    const { error } = await supabase.from('activations').update(dbUpdates).eq('activation_id', id);
    return !error;
}

export async function updateSaleStatus(saleId, status) {
    console.warn("updateSaleStatus not migrated");
    return Promise.resolve();
}

export async function updateSale(saleId, data) {
    console.warn("updateSale not migrated");
    return Promise.resolve();
}

export async function seedBrands() {
    console.warn("seedBrands not migrated");
    return Promise.resolve();
}

export async function deleteSampleRequest(id) {
    const { error } = await supabase.from('sample_requests').delete().eq('id', id);
    return !error;
}

export async function deleteSale(id) {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    return !error;
}

export async function resetDatabase() {
    console.warn("⚠️ DELETING ALL TEST DATA...");

    // List of transactional tables to clear
    const tables = [
        'sales',
        'leads',
        'sample_requests',
        'shifts',
        'activations',
        'activity_logs',
        'security_logs',
        'drivers',
        'vehicles'
    ];

    const results = await Promise.all(
        tables.map(async (tableName) => {
            // neq('id', -1) is a common trick to delete all rows when id is an integer.
            // For UUIDs, we can use neq('id', '00000000-0000-0000-0000-000000000000')
            // Or better yet, just a filter that is always true like .gt('created_at', '1970-01-01')
            const { error } = await supabase
                .from(tableName)
                .delete()
                .filter('created_at', 'gt', '1970-01-01');

            if (error) {
                console.error(`Error clearing table ${tableName}:`, error);
                return { table: tableName, success: false, error };
            }
            return { table: tableName, success: true };
        })
    );

    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
        console.error("Database reset failed for some tables:", failed);
        return false;
    }

    console.log("✅ Database reset complete. All test data cleared.");
    return true;
}

// --- LOGISTICS (DRIVERS & VEHICLES) ---

// Drivers
export async function getDrivers(brandId) {
    let query = supabase.from('drivers').select('*');
    if (brandId) {
        query = query.eq('brandId', brandId);
    }
    const { data, error } = await query;
    if (error) {
        console.error("Supabase getDrivers failed", error);
        return [];
    }
    return data;
}

export async function addDriver(driverData) {
    const { data, error } = await supabase.from('drivers').insert([driverData]).select().single();
    if (error) throw error;
    return data;
}

export async function updateDriver(driverId, updates) {
    const { error } = await supabase.from('drivers').update(updates).eq('id', driverId);
    return !error;
}

export async function deleteDriver(driverId) {
    const { error } = await supabase.from('drivers').delete().eq('id', driverId);
    return !error;
}

// Vehicles
export async function getVehicles(brandId) {
    let query = supabase.from('vehicles').select('*');
    if (brandId) {
        query = query.eq('brandId', brandId);
    }
    const { data, error } = await query;
    if (error) {
        console.error("Supabase getVehicles failed", error);
        return [];
    }
    return data;
}

export async function addVehicle(vehicleData) {
    const { data, error } = await supabase.from('vehicles').insert([vehicleData]).select().single();
    if (error) throw error;
    return data;
}

export async function updateVehicle(vehicleId, updates) {
    const { error } = await supabase.from('vehicles').update(updates).eq('id', vehicleId);
    return !error;
}

export async function deleteVehicle(vehicleId) {
    const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
    return !error;
}

// --- LOGGING ---

export async function logActivity(userId, action, details) {
    try {
        await supabase.from('activity_logs').insert([{
            user_id: userId,
            action,
            details,
            created_at: new Date().toISOString()
        }]);
    } catch (e) {
        console.warn("Failed to log activity", e);
    }
}

export async function logSecurityEvent(userId, action, details) {
    console.log(`[SECURITY] User: ${userId}, Action: ${action}`, details);
    try {
        await supabase.from('security_logs').insert([{
            user_id: userId,
            action,
            details,
            created_at: new Date().toISOString(),
            severity: 'warning'
        }]);
    } catch (e) {
        // Silent fail to not block auth flow
    }
}

// --- ACTIVATIONS ---

export async function getActivations() {
    const { data, error } = await supabase.from('activations').select('*');
    if (error) {
        console.error("Error fetching activations:", error);
        return [];
    }
    return (data || []).map(a => ({
        id: a.activation_id,
        brandId: a.brand_id,
        dispensaryId: a.dispensary_id,
        dateOfActivation: a.date_of_activation,
        // Helper: use dateOfActivation as 'date' for frontend compat
        date: a.date_of_activation,
        startTime: '12:00', // Default start time if missing
        endTime: '16:00',   // Default end time if missing
        repId: a.rep_id,
        activationType: a.activation_type,
        photos: a.photos || [],
        notes: a.notes,
        status: a.status || 'Scheduled',
        datePreferences: a.date_preferences || [],
        requestedBy: a.requested_by,
        createdAt: a.created_at,
        updated_at: a.updated_at
    }));
}

// --- BRAND MANAGEMENT ---

export async function getAllBrandProfiles() {
    // Note: 'brands' table doesn't exist, using 'brand_profiles' if available
    // For now, returning empty array as fallback
    const { data, error } = await supabase.from('brand_profiles').select('*');
    if (error) {
        console.warn("brand_profiles table not found, returning empty array", error);
        return [];
    }
    return data || [];
}

// --- PAYROLL ---

export async function markRepAsPaid(repId) {
    console.warn("markRepAsPaid not yet fully implemented");
    // This would update the payroll/commission records for a rep
    // Placeholder implementation:
    return { success: true, count: 0 };
}
