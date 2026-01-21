/**
 * Activation Request Service
 * Handles routing activation requests to reps or admin
 */
import { supabase } from './supabaseClient';
import { getLead, getLeads } from './firestoreService';

// Request statuses
export const REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    SCHEDULED: 'scheduled',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};

// Auto-timeout duration (24 hours in milliseconds)
const TIMEOUT_HOURS = 24;

/**
 * Create a new activation request with auto-routing
 * If the store has an assigned rep, route to them
 * Otherwise, route to admin (assigned_rep_id = null)
 */
export async function createActivationRequest(data) {
    // Lookup the store to find assigned rep
    let assignedRepId = null;
    let dispensaryId = null;

    if (data.storeName) {
        const leads = await getLeads();
        const store = leads.find(l =>
            l.dispensaryName?.toLowerCase() === data.storeName?.toLowerCase()
        );
        if (store) {
            dispensaryId = store.id;
            assignedRepId = store.assignedAmbassadorId || null;
        }
    }

    // Calculate expiry time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TIMEOUT_HOURS);

    const requestData = {
        brand_id: data.brandId,
        brand_name: data.brandName,
        dispensary_id: dispensaryId,
        dispensary_name: data.storeName,
        assigned_rep_id: assignedRepId,

        // Date/time options
        date_option_1: data.date1 || null,
        time_option_1: data.time1 || null,
        date_option_2: data.date2 || null,
        time_option_2: data.time2 || null,
        date_option_3: data.date3 || null,
        time_option_3: data.time3 || null,

        notes: data.notes || '',
        status: REQUEST_STATUS.PENDING,
        requested_by: data.requestedBy || 'brand',
        requester_id: data.requesterId || null,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data: result, error } = await supabase
        .from('activation_requests')
        .insert([requestData])
        .select()
        .single();

    if (error) {
        console.error('Error creating activation request:', error);
        throw error;
    }

    return {
        id: result.id,
        assignedRepId: assignedRepId,
        routedTo: assignedRepId ? 'rep' : 'admin'
    };
}

/**
 * Get all activation requests (for admin - sees everything)
 */
export async function getAllActivationRequests() {
    const { data, error } = await supabase
        .from('activation_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching activation requests:', error);
        return [];
    }

    return data.map(mapRequestToFrontend);
}

/**
 * Get pending activation requests for a specific rep
 */
export async function getActivationRequestsForRep(repId) {
    const { data, error } = await supabase
        .from('activation_requests')
        .select('*')
        .eq('assigned_rep_id', repId)
        .eq('status', REQUEST_STATUS.PENDING)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching rep activation requests:', error);
        return [];
    }

    return data.map(mapRequestToFrontend);
}

/**
 * Get requests that need admin attention:
 * - No assigned rep (null)
 * - Rep declined
 * - Request expired
 */
export async function getActivationRequestsForAdmin() {
    // First, check for expired requests and update their status
    await checkExpiredRequests();

    const { data, error } = await supabase
        .from('activation_requests')
        .select('*')
        .or('assigned_rep_id.is.null,status.eq.declined,status.eq.expired')
        .in('status', [REQUEST_STATUS.PENDING, REQUEST_STATUS.DECLINED, REQUEST_STATUS.EXPIRED])
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin activation requests:', error);
        return [];
    }

    return data.map(mapRequestToFrontend);
}

/**
 * Rep accepts a request - selects a date
 */
export async function acceptActivationRequest(requestId, selectedDate, selectedTime) {
    const { error } = await supabase
        .from('activation_requests')
        .update({
            status: REQUEST_STATUS.ACCEPTED,
            selected_date: selectedDate,
            selected_time: selectedTime,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) {
        console.error('Error accepting activation request:', error);
        throw error;
    }

    return true;
}

/**
 * Rep declines a request - provides reason, routes back to admin
 */
export async function declineActivationRequest(requestId, reason) {
    const { error } = await supabase
        .from('activation_requests')
        .update({
            status: REQUEST_STATUS.DECLINED,
            decline_reason: reason,
            // Clear assigned rep so it goes back to admin queue
            assigned_rep_id: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) {
        console.error('Error declining activation request:', error);
        throw error;
    }

    return true;
}

/**
 * Admin assigns a new rep to handle the request
 */
export async function assignRepToRequest(requestId, repId) {
    // Reset expiry when reassigning
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TIMEOUT_HOURS);

    const { error } = await supabase
        .from('activation_requests')
        .update({
            assigned_rep_id: repId,
            status: REQUEST_STATUS.PENDING,
            decline_reason: null, // Clear previous decline reason
            expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) {
        console.error('Error assigning rep to request:', error);
        throw error;
    }

    return true;
}

/**
 * Mark request as scheduled (after activation is created)
 */
export async function markRequestAsScheduled(requestId, activationId) {
    const { error } = await supabase
        .from('activation_requests')
        .update({
            status: REQUEST_STATUS.SCHEDULED,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) {
        console.error('Error marking request as scheduled:', error);
        throw error;
    }

    return true;
}

/**
 * Cancel a request
 */
export async function cancelActivationRequest(requestId) {
    const { error } = await supabase
        .from('activation_requests')
        .update({
            status: REQUEST_STATUS.CANCELLED,
            updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (error) {
        console.error('Error cancelling activation request:', error);
        throw error;
    }

    return true;
}

/**
 * Check for expired requests and update their status
 */
async function checkExpiredRequests() {
    const now = new Date().toISOString();

    const { error } = await supabase
        .from('activation_requests')
        .update({
            status: REQUEST_STATUS.EXPIRED,
            assigned_rep_id: null, // Route back to admin
            updated_at: now
        })
        .eq('status', REQUEST_STATUS.PENDING)
        .lt('expires_at', now);

    if (error) {
        console.warn('Error checking expired requests:', error);
    }
}

/**
 * Get count of pending requests for a rep (for badge display)
 */
export async function getPendingRequestCountForRep(repId) {
    const { count, error } = await supabase
        .from('activation_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_rep_id', repId)
        .eq('status', REQUEST_STATUS.PENDING);

    if (error) {
        console.error('Error getting pending request count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Get count of requests needing admin attention
 */
export async function getPendingRequestCountForAdmin() {
    await checkExpiredRequests();

    const { count, error } = await supabase
        .from('activation_requests')
        .select('*', { count: 'exact', head: true })
        .or('assigned_rep_id.is.null,status.eq.declined,status.eq.expired')
        .in('status', [REQUEST_STATUS.PENDING, REQUEST_STATUS.DECLINED, REQUEST_STATUS.EXPIRED]);

    if (error) {
        console.error('Error getting admin pending request count:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Map database row to frontend format
 */
function mapRequestToFrontend(row) {
    return {
        id: row.id,
        brandId: row.brand_id,
        brandName: row.brand_name,
        dispensaryId: row.dispensary_id,
        dispensaryName: row.dispensary_name,
        assignedRepId: row.assigned_rep_id,

        dateOption1: row.date_option_1,
        timeOption1: row.time_option_1,
        dateOption2: row.date_option_2,
        timeOption2: row.time_option_2,
        dateOption3: row.date_option_3,
        timeOption3: row.time_option_3,

        selectedDate: row.selected_date,
        selectedTime: row.selected_time,

        notes: row.notes,
        declineReason: row.decline_reason,
        status: row.status,
        requestedBy: row.requested_by,
        requesterId: row.requester_id,

        expiresAt: row.expires_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}
