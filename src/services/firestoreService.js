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

export async function deleteUser(userId) {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
        console.error("Error deleting user:", error);
        return false;
    }
    return true;
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

// --- ACTIVATIONS (Shift Completion) ---
// Note: "Logging a shift" means creating/completing an activation
// The shifts table is deprecated - all shift data goes into activations

export async function addCompletedActivation(activationData) {
    // Calculate total hours from start and end time
    const calculateHours = (startTime, endTime) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        return parseFloat(diffHours.toFixed(2));
    };

    const totalHours = activationData.startTime && activationData.endTime
        ? calculateHours(activationData.startTime, activationData.endTime)
        : activationData.hoursWorked || 0;

    const { data, error } = await supabase.from('activations').insert([{
        brand_id: activationData.brandId || activationData.brand,
        brand_name: activationData.brand || activationData.brandName,
        dispensary_name: activationData.dispensaryName,
        dispensary_id: activationData.dispensaryId || null,
        rep_id: activationData.userId || activationData.repId,
        rep_name: activationData.repName || null,
        activation_date: activationData.date || new Date().toISOString().split('T')[0],
        activation_type: activationData.activationType || 'walk-in',
        status: 'completed',
        start_time: activationData.startTime,
        end_time: activationData.endTime,
        total_hours: totalHours,
        miles_traveled: activationData.milesTraveled || 0,
        trip_log_image_url: activationData.odometerImageUrl || null,
        toll_amount: activationData.tollAmount || 0,
        toll_receipt_url: activationData.tollReceiptImageUrl || null,
        region: activationData.region || 'NYC',
        has_vehicle: activationData.hasVehicle !== undefined ? activationData.hasVehicle : true,
        completed_at: new Date().toISOString(),
        notes: activationData.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;

    // Auto-generate invoice for the brand
    try {
        const { createActivationInvoice } = await import('./invoiceService');
        const { calculateAgencyShiftCost } = await import('../utils/pricing');

        // Calculate activation fee using agency pricing
        const activationFee = calculateAgencyShiftCost({
            hoursWorked: totalHours,
            region: activationData.region || 'NYC',
            milesTraveled: activationData.milesTraveled || 0,
            tollAmount: activationData.tollAmount || 0,
            hasVehicle: activationData.hasVehicle !== undefined ? activationData.hasVehicle : true
        });

        // Create the invoice
        await createActivationInvoice(data, activationFee);
    } catch (invoiceError) {
        // Don't fail the activation if invoice creation fails
        console.error('⚠️ Invoice auto-generation failed (activation still saved):', invoiceError);
    }

    return data.id;
}

// Deprecated: Use addCompletedActivation instead
export async function addShift(shiftData) {
    console.warn('⚠️ addShift is deprecated. Use addCompletedActivation instead.');
    return addCompletedActivation(shiftData);
}

export async function getUserActivations(userId, statusFilter = null) {
    let query = supabase.from('activations').select('*').eq('rep_id', userId);

    if (statusFilter) {
        query = query.eq('status', statusFilter);
    }

    const { data, error } = await query.order('activation_date', { ascending: false });
    if (error) return [];

    // Map database fields to frontend expected format
    return data.map(a => ({
        id: a.id,
        brandName: a.brand_name || a.brand_id || 'Unknown',
        brand: a.brand_name || a.brand_id,
        dispensaryName: a.dispensary_name || 'Store Visit',
        date: a.activation_date || a.created_at,
        hoursWorked: a.total_hours || 0,
        milesTraveled: a.miles_traveled || 0,
        tollAmount: a.toll_amount || 0,
        status: a.status || 'pending',
        region: a.region,
        notes: a.notes,
        startTime: a.start_time,
        endTime: a.end_time,
        tripLogImageUrl: a.trip_log_image_url,
        tollReceiptUrl: a.toll_receipt_url
    }));
}

export async function getAllActivations() {
    const { data, error } = await supabase.from('activations').select('*').order('activation_date', { ascending: false });
    if (error) return [];

    // Map database fields to frontend expected format
    return data.map(a => ({
        id: a.id,
        brandId: a.brand_id,
        brandName: a.brand_name,
        brand: a.brand_name, // Alias for compatibility
        dispensaryName: a.dispensary_name || 'Store Visit',
        dispensaryId: a.dispensary_id,
        repId: a.rep_id,
        repName: a.rep_name,
        date: a.activation_date || a.created_at,
        activationType: a.activation_type,
        status: a.status || 'pending',
        startTime: a.start_time,
        endTime: a.end_time,
        hoursWorked: a.total_hours || 0,
        milesTraveled: a.miles_traveled || 0,
        tollAmount: a.toll_amount || 0,
        region: a.region || 'NYC',
        hasVehicle: a.has_vehicle,
        notes: a.notes,
        tripLogImageUrl: a.trip_log_image_url,
        tollReceiptUrl: a.toll_receipt_url,
        createdAt: a.created_at,
        updatedAt: a.updated_at
    }));
}

// Deprecated: Use getUserActivations instead
export async function getUserShifts(userId) {
    console.warn('⚠️ getUserShifts is deprecated. Use getUserActivations(userId, "completed") instead.');
    return getUserActivations(userId, 'completed');
}

// Deprecated: Use getAllActivations instead
export async function getAllShifts() {
    console.warn('⚠️ getAllShifts is deprecated. Use getAllActivations() instead.');
    return getAllActivations();
}

export async function updateActivationStatus(activationId, newStatus) {
    const { error } = await supabase.from('activations').update({
        status: newStatus,
        updated_at: new Date().toISOString()
    }).eq('id', activationId);
    return !error;
}

// Deprecated: Use updateActivationStatus instead
export async function updateShiftStatus(shiftId, newStatus) {
    console.warn('⚠️ updateShiftStatus is deprecated. Use updateActivationStatus instead.');
    return updateActivationStatus(shiftId, newStatus);
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

export async function getBrandLeads(brandId) {
    // Get leads that belong to a specific brand
    // Leads can be associated with a brand via the active_brands array or brand_id
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .or(`brand_id.eq.${brandId},active_brands.cs.{${brandId}}`);

    if (error) {
        console.error('Error fetching brand leads:', error);
        return [];
    }

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

    // 2. Insert Sale - use correct Supabase column names
    // Extract brand info from items if available
    const brandInfo = saleData.items && saleData.items.length > 0 ? saleData.items[0] : {};
    const brandName = brandInfo.brandName || saleData.brandName || 'Unknown';

    // Generate unique invoice number: BRAND-REP-SEQUENCE
    let invoiceNumber = null;
    try {
        const { generateInvoiceNumber } = await import('./invoiceNumberService');
        invoiceNumber = await generateInvoiceNumber(brandName, repName);
    } catch (err) {
        console.warn('Invoice number generation failed, using fallback:', err);
        invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    }

    const { data: sale, error } = await supabase.from('sales').insert([{
        dispensary_id: leadId,
        rep_id: repId,
        dispensary_name: saleData.dispensaryName,
        total_amount: saleData.totalAmount || saleData.amount || 0,
        // commission_rate stores the rate (e.g., 0.02 for 2%), not the dollar amount
        // Database constraint: precision 5, scale 4 (max 9.9999)
        commission_rate: saleData.commissionRate || 0.02,
        products: saleData.items || [],
        brand_id: brandInfo.brandId || saleData.brandId || null,
        brand_name: brandName,
        status: saleData.status || 'completed',
        sale_date: saleData.date ? new Date(saleData.date).toISOString() : new Date().toISOString(),
        invoice_number: invoiceNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return sale.id;
}

export async function getSales() {
    const { data, error } = await supabase.from('sales').select('*');
    if (error) {
        console.error('getSales error:', error);
        return [];
    }

    return data.map(s => ({
        id: s.id,
        dispensaryId: s.dispensary_id,
        userId: s.rep_id, // Map back to userId for app compatibility
        repId: s.rep_id,
        dispensaryName: s.dispensary_name,
        amount: s.total_amount || 0,
        totalAmount: s.total_amount || 0, // alias
        // Calculate commission $ from rate * amount
        commissionEarned: (s.commission_rate || 0.02) * (s.total_amount || 0),
        commissionRate: s.commission_rate || 0.02,
        items: s.products || [],
        products: s.products || [], // direct alias
        status: s.status,
        date: s.sale_date || s.created_at, // App expects 'date'
        saleDate: s.sale_date,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        // Add brand info for Brand Oversight
        brandId: s.brand_id || null,
        brandName: s.brand_name || null,
        deliveryDate: s.delivery_date || null,
        invoiceNumber: s.invoice_number || null
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

    // Create a map of dispensary names that have sales
    const soldDispensaries = new Set();
    sales.forEach(sale => {
        if (sale.dispensaryName) {
            soldDispensaries.add(sale.dispensaryName.toLowerCase());
        }
    });

    // Merge leads with sales info - mark leads as Sold if they have sales
    const mergedAccounts = leads.map(lead => {
        const hasBeenSold = soldDispensaries.has((lead.dispensaryName || '').toLowerCase()) ||
            lead.status === 'Sold' ||
            lead.leadStatus === 'active';

        return {
            ...lead,
            status: hasBeenSold ? 'Sold' : (lead.status || 'New'),
            hasSales: hasBeenSold
        };
    });

    return mergedAccounts;
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
    const { error } = await supabase
        .from('sales')
        .update({
            status: status,
            updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

    if (error) {
        console.error("updateSaleStatus error:", error);
        return false;
    }
    return true;
}

export async function updateSale(saleId, data) {
    // Map frontend field names (camelCase) to Supabase column names (snake_case)
    const updateData = {
        updated_at: new Date().toISOString()
    };

    // Define field mappings: camelCase -> snake_case
    const fieldMappings = {
        paidDate: 'paid_date',
        deliveredAt: 'delivered_at',
        deliveryDate: 'delivery_date',
        totalAmount: 'total_amount',
        brandId: 'brand_id',
        brandName: 'brand_name',
        dispensaryId: 'dispensary_id',
        dispensaryName: 'dispensary_name',
        repId: 'rep_id',
        saleDate: 'sale_date',
        commissionRate: 'commission_rate'
    };

    // Process each field from the input data
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
            // If there's a mapping, use the snake_case version
            if (fieldMappings[key]) {
                updateData[fieldMappings[key]] = value;
            } else {
                // Otherwise, use the key as-is (for already snake_case fields like 'status')
                updateData[key] = value;
            }
        }
    }

    const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId);

    if (error) {
        console.error("updateSale error:", error);
        return false;
    }
    return true;
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

export async function deleteActivation(id) {
    const { error } = await supabase.from('activations').delete().eq('id', id);
    if (error) {
        console.error('Delete activation error:', error);
        throw error;
    }
    return true;
}

export async function resetDatabase() {
    console.warn("⚠️ DELETING ALL TEST DATA...");

    // List of transactional tables to clear
    const tables = [
        'sales',
        'leads',
        'sample_requests',
        'activations',
        'activity_logs',
        'security_logs',
        'drivers',
        'vehicles',
        'orders',
        'payment_history'
    ];

    const results = await Promise.all(
        tables.map(async (tableName) => {
            try {
                // First, count how many records exist
                const { count, error: countError } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (countError) {
                    console.warn(`Could not count ${tableName}:`, countError);
                }

                // Delete all rows
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .gte('created_at', '1970-01-01');

                if (error) {
                    console.error(`Error clearing table ${tableName}:`, error);
                    return { table: tableName, success: false, error, deleted: 0 };
                }
                return { table: tableName, success: true, deleted: count || 0 };
            } catch (e) {
                console.error(`Exception clearing table ${tableName}:`, e);
                return { table: tableName, success: false, error: e.message, deleted: 0 };
            }
        })
    );

    const failed = results.filter(r => !r.success);
    const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);

    if (failed.length > 0) {
        console.error("Database reset failed for some tables:", failed);
        return { success: false, results, totalDeleted };
    }

    console.log("✅ Database reset complete. All test data cleared.");
    return { success: true, results, totalDeleted };
}

/**
 * Developer tool: Reset all data with detailed feedback.
 * Returns a summary of what was deleted from each table.
 * Gracefully handles tables that don't exist.
 */
export async function devResetAllData() {
    console.warn("🚨 DEVELOPER RESET: Clearing all transactional data...");

    const tablesToClear = [
        { name: 'activations', label: 'Activations' },
        { name: 'sales', label: 'Sales' },
        { name: 'leads', label: 'Leads/Dispensaries' },
        { name: 'sample_requests', label: 'Sample Requests' },
        { name: 'orders', label: 'Orders' },
        { name: 'payment_history', label: 'Payment History' },
        { name: 'activity_logs', label: 'Activity Logs' },
        { name: 'security_logs', label: 'Security Logs' },
        { name: 'drivers', label: 'Drivers' },
        { name: 'vehicles', label: 'Vehicles' }
    ];

    const results = [];

    for (const table of tablesToClear) {
        try {
            // Count first
            const { count, error: countError } = await supabase
                .from(table.name)
                .select('*', { count: 'exact', head: true });

            // If table doesn't exist or error, mark as skipped
            if (countError) {
                results.push({
                    table: table.name,
                    label: table.label,
                    success: true,
                    skipped: true,
                    deleted: 0
                });
                continue;
            }

            // If count is 0, skip the delete
            if (!count || count === 0) {
                results.push({
                    table: table.name,
                    label: table.label,
                    success: true,
                    deleted: 0
                });
                continue;
            }

            // Delete all
            const { error } = await supabase
                .from(table.name)
                .delete()
                .gte('created_at', '1970-01-01');

            if (error) {
                // Mark as skipped, not error (table might not exist)
                results.push({
                    table: table.name,
                    label: table.label,
                    success: true,
                    skipped: true,
                    deleted: 0
                });
            } else {
                results.push({
                    table: table.name,
                    label: table.label,
                    success: true,
                    deleted: count || 0
                });
            }
        } catch (e) {
            // Handle gracefully - mark as skipped
            results.push({
                table: table.name,
                label: table.label,
                success: true,
                skipped: true,
                deleted: 0
            });
        }
    }

    const totalDeleted = results.reduce((sum, r) => sum + (r.deleted || 0), 0);
    const skipped = results.filter(r => r.skipped);

    // Also clear localStorage to reset milestone celebrations and other cached state
    try {
        // Clear all milestone celebration keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('milestone_celebrated_') ||
                key.startsWith('last_') ||
                key.startsWith('cached_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Cleared ${keysToRemove.length} localStorage items`);
    } catch (e) {
        console.warn('Could not clear localStorage:', e);
    }

    return {
        success: true,
        totalDeleted,
        results,
        message: `✅ Deleted ${totalDeleted} records` +
            (skipped.length > 0 ? ` (${skipped.length} tables skipped)` : '') +
            ' + cleared localStorage'
    };
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
        id: a.id, // Fixed: use a.id instead of a.activation_id
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
    const { data, error } = await supabase.from('brand_profiles').select('*');

    if (!error && data && data.length > 0) {
        return data;
    }

    console.warn("brand_profiles empty/missing, returning static brands");
    // Fallback static brands (matching BrandAuthContext.jsx)
    return [
        { id: 'honey-king', name: '🍯 Honey King' },
        { id: 'bud-cracker', name: 'Bud Cracker Boulevard' },
        { id: 'canna-dots', name: 'Canna Dots' },
        { id: 'space-poppers', name: 'Space Poppers' },
        { id: 'smoothie-bar', name: 'Smoothie Bar' },
        { id: 'waferz', name: 'Waferz NY' },
        { id: 'pines', name: 'Pines' },
        { id: 'flx-extracts', name: 'FLX Extracts' },
        { id: 'budcracker-nyc', name: 'Budcracker NYC' }
    ];
}

// --- PAYROLL ---

/**
 * Mark a sale as "collected" - brand has paid us for this sale.
 * Rep commission cannot be paid until the sale is collected.
 * Only uses existing 'status' column - no schema changes required.
 */
export async function markSaleCollected(saleId) {
    const { error } = await supabase
        .from('sales')
        .update({
            status: 'collected',
            updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

    if (error) {
        console.error("markSaleCollected error:", error);
        return false;
    }
    return true;
}

/**
 * Mark all collected sales for a rep as "paid" - rep has received their 2% commission.
 * Only sales with status='collected' can be marked as paid.
 */
export async function markRepAsPaid(repId) {
    // First, find all collected (but not yet paid) sales for this rep
    const { data: collectedSales, error: fetchError } = await supabase
        .from('sales')
        .select('id')
        .eq('rep_id', repId)
        .eq('status', 'collected');

    if (fetchError) {
        console.error("markRepAsPaid fetch error:", fetchError);
        return { success: false, count: 0 };
    }

    if (!collectedSales || collectedSales.length === 0) {
        return { success: true, count: 0, message: 'No collected sales to pay out' };
    }

    // Update all collected sales to paid
    const saleIds = collectedSales.map(s => s.id);
    const { error: updateError } = await supabase
        .from('sales')
        .update({
            status: 'paid',
            updated_at: new Date().toISOString()
        })
        .in('id', saleIds);

    if (updateError) {
        console.error("markRepAsPaid update error:", updateError);
        return { success: false, count: 0 };
    }

    return { success: true, count: saleIds.length };
}

/**
 * Mark a single sale as paid to rep (for individual payouts)
 */
export async function markSaleRepPaid(saleId) {
    const { error } = await supabase
        .from('sales')
        .update({
            status: 'paid',
            updated_at: new Date().toISOString()
        })
        .eq('id', saleId);

    if (error) {
        console.error("markSaleRepPaid error:", error);
        return false;
    }
    return true;
}

/**
 * Mark an activation as paid by brand (we received the fee)
 */
export async function markActivationBrandPaid(activationId) {
    const { error } = await supabase
        .from('activations')
        .update({
            status: 'paid',
            updated_at: new Date().toISOString()
        })
        .eq('id', activationId);

    if (error) {
        console.error("markActivationBrandPaid error:", error);
        return false;
    }
    return true;
}

/**
 * Mark an activation's rep wages as paid
 * Uses status='rep_paid' to indicate both brand has paid AND rep has been paid
 */
export async function markActivationRepPaid(activationId) {
    const { error } = await supabase
        .from('activations')
        .update({
            status: 'rep_paid',
            updated_at: new Date().toISOString()
        })
        .eq('id', activationId);

    if (error) {
        console.error("markActivationRepPaid error:", error);
        return false;
    }
    return true;
}

// --- ADMIN BRANDS (Managed via Admin Panel) ---

export async function getAdminBrands() {
    try {
        const { data, error } = await supabase
            .from('admin_brands')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching admin brands:', error);
        // Fallback to localStorage for backwards compatibility
        try {
            return JSON.parse(localStorage.getItem('admin_brands') || '[]');
        } catch { return []; }
    }
}

export async function saveAdminBrand(brand) {
    try {
        const { data, error } = await supabase
            .from('admin_brands')
            .upsert({
                id: brand.id,
                name: brand.name,
                status: brand.status || 'active',
                commission_rate: brand.commissionRate || 5,
                contract_start: brand.contractStart,
                contacts: brand.contacts || [],
                login_email: brand.loginEmail,
                temp_password: brand.tempPassword,
                password_changed: brand.passwordChanged || false,
                invite_sent: brand.inviteSent || false,
                logo: brand.logo,
                created_at: brand.createdAt || new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error saving admin brand:', error);
        throw error;
    }
}

export async function deleteAdminBrand(brandId) {
    try {
        const { error } = await supabase
            .from('admin_brands')
            .delete()
            .eq('id', brandId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting admin brand:', error);
        throw error;
    }
}

export async function updateAdminBrand(brandId, updates) {
    try {
        const { data, error } = await supabase
            .from('admin_brands')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', brandId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating admin brand:', error);
        throw error;
    }
}

export async function getAdminBrandByEmail(email) {
    try {
        const { data, error } = await supabase
            .from('admin_brands')
            .select('*')
            .ilike('login_email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
        return data;
    } catch (error) {
        console.error('Error fetching admin brand by email:', error);
        return null;
    }
}

export async function markBrandPasswordChanged(brandId) {
    return updateAdminBrand(brandId, {
        password_changed: true,
        temp_password: null
    });
}

// --- DUPLICATE CLEANUP TOOLS ---

/**
 * Find duplicate activations (same brand, dispensary, and date)
 * Returns an object with duplicate groups and total count
 */
export async function findDuplicateActivations() {
    const activations = await getActivations();

    // Group by brand + dispensary + date
    const groups = {};
    activations.forEach(act => {
        const key = `${act.brandId || 'unknown'}_${act.dispensaryId || 'unknown'}_${act.dateOfActivation || 'unknown'}`;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(act);
    });

    // Find groups with more than 1 activation (duplicates)
    const duplicates = {};
    let totalDuplicates = 0;

    for (const [key, group] of Object.entries(groups)) {
        if (group.length > 1) {
            duplicates[key] = group;
            totalDuplicates += group.length - 1; // Keep one, count rest as duplicates
        }
    }

    return {
        totalActivations: activations.length,
        duplicateGroups: Object.keys(duplicates).length,
        totalDuplicates,
        duplicates
    };
}

/**
 * Delete duplicate activations (keeps the first one in each group)
 * Returns count of deleted activations
 */
export async function cleanupDuplicateActivations() {
    const { duplicates, totalDuplicates } = await findDuplicateActivations();

    if (totalDuplicates === 0) {
        return { success: true, deleted: 0, message: 'No duplicates found' };
    }

    let deleted = 0;
    const errors = [];

    for (const [key, group] of Object.entries(duplicates)) {
        // Keep the first activation (index 0), delete the rest
        const toDelete = group.slice(1);

        for (const act of toDelete) {
            try {
                const { error } = await supabase
                    .from('activations')
                    .delete()
                    .eq('id', act.id);

                if (error) {
                    errors.push({ id: act.id, error: error.message });
                } else {
                    deleted++;
                }
            } catch (e) {
                errors.push({ id: act.id, error: e.message });
            }
        }
    }

    return {
        success: errors.length === 0,
        deleted,
        errors: errors.length > 0 ? errors : undefined,
        message: `Deleted ${deleted} duplicate activations`
    };
}

// --- PAYMENT HISTORY ---

/**
 * Log a payment to the payment_history table.
 * Called when marking wages or commissions as paid.
 * @param {Object} paymentData - Payment details
 * @returns {Object} Created payment record
 */
export async function logPayment(paymentData) {
    const { data, error } = await supabase
        .from('payment_history')
        .insert([{
            type: paymentData.type, // 'wage', 'commission', 'brand_payout'
            recipient_id: paymentData.recipientId,
            recipient_name: paymentData.recipientName,
            amount: paymentData.amount,
            period_start: paymentData.periodStart,
            period_end: paymentData.periodEnd,
            period_label: paymentData.periodLabel,
            paid_at: new Date().toISOString(),
            paid_by: paymentData.paidBy,
            related_records: paymentData.relatedRecords || [],
            notes: paymentData.notes || '',
            created_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error logging payment:', error);
        throw error;
    }

    return data;
}

/**
 * Get payment history with optional filters.
 * @param {Object} filters - Optional filters { recipientId, type, startDate, endDate }
 * @returns {Array} Payment records
 */
export async function getPaymentHistory(filters = {}) {
    let query = supabase
        .from('payment_history')
        .select('*')
        .order('paid_at', { ascending: false });

    if (filters.recipientId) {
        query = query.eq('recipient_id', filters.recipientId);
    }
    if (filters.type) {
        query = query.eq('type', filters.type);
    }
    if (filters.startDate) {
        query = query.gte('paid_at', filters.startDate);
    }
    if (filters.endDate) {
        query = query.lte('paid_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payment history:', error);
        return [];
    }

    return (data || []).map(p => ({
        id: p.id,
        type: p.type,
        recipientId: p.recipient_id,
        recipientName: p.recipient_name,
        amount: p.amount,
        periodStart: p.period_start,
        periodEnd: p.period_end,
        periodLabel: p.period_label,
        paidAt: p.paid_at,
        paidBy: p.paid_by,
        relatedRecords: p.related_records || [],
        notes: p.notes,
        createdAt: p.created_at
    }));
}

/**
 * Get payment history for a specific rep.
 * @param {string} repId - Rep user ID
 * @returns {Array} Payment records for the rep
 */
export async function getRepPaymentHistory(repId) {
    return getPaymentHistory({ recipientId: repId });
}

/**
 * Mark wages as paid and log the payment.
 * @param {string} repId - Rep user ID
 * @param {string} repName - Rep display name
 * @param {Array} activationIds - List of activation IDs being paid
 * @param {number} totalAmount - Total amount paid
 * @param {string} periodLabel - Pay period label
 * @param {string} paidBy - Admin user ID who processed payment
 */
export async function markWagesPaidWithHistory(repId, repName, activationIds, totalAmount, periodLabel, paidBy) {
    // 1. Update all activations to rep_paid status
    const { error: updateError } = await supabase
        .from('activations')
        .update({
            status: 'rep_paid',
            updated_at: new Date().toISOString()
        })
        .in('id', activationIds);

    if (updateError) {
        console.error('Error marking activations as paid:', updateError);
        throw updateError;
    }

    // 2. Log the payment
    const paymentRecord = await logPayment({
        type: 'wage',
        recipientId: repId,
        recipientName: repName,
        amount: totalAmount,
        periodLabel: periodLabel,
        paidBy: paidBy,
        relatedRecords: activationIds,
        notes: `Biweekly wages for ${activationIds.length} activations`
    });

    return {
        success: true,
        activationsUpdated: activationIds.length,
        paymentRecordId: paymentRecord?.id
    };
}

/**
 * Mark commissions as paid and log the payment.
 * @param {string} repId - Rep user ID
 * @param {string} repName - Rep display name
 * @param {Array} saleIds - List of sale IDs being paid
 * @param {number} totalAmount - Total commission amount
 * @param {string} quarterLabel - Quarter label (e.g., "Q1 2025")
 * @param {string} paidBy - Admin user ID who processed payment
 */
export async function markCommissionsPaidWithHistory(repId, repName, saleIds, totalAmount, quarterLabel, paidBy) {
    // 1. Update all sales to paid status
    const { error: updateError } = await supabase
        .from('sales')
        .update({
            status: 'paid',
            updated_at: new Date().toISOString()
        })
        .in('id', saleIds);

    if (updateError) {
        console.error('Error marking sales as paid:', updateError);
        throw updateError;
    }

    // 2. Log the payment
    const paymentRecord = await logPayment({
        type: 'commission',
        recipientId: repId,
        recipientName: repName,
        amount: totalAmount,
        periodLabel: quarterLabel,
        paidBy: paidBy,
        relatedRecords: saleIds,
        notes: `${quarterLabel} commission for ${saleIds.length} sales`
    });

    return {
        success: true,
        salesUpdated: saleIds.length,
        paymentRecordId: paymentRecord?.id
    };
}


