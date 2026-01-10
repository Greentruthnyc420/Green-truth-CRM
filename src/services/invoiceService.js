import { supabase } from './supabaseClient';

const TABLE_NAME = 'invoices';

/**
 * Creates a new itemized invoice.
 * @param {Object} invoiceData - { brandId, brandName, startDate, endDate, items: [], status: 'pending', ... }
 */
export async function createInvoice(invoiceData) {
    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([{
                ...invoiceData,
                status: invoiceData.status || 'pending',
                items: invoiceData.items || [], // Stored as JSONB
                createdAt: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;

        // Mark items as billed
        if (invoiceData.items && invoiceData.items.length > 0) {
            await markItemsAsBilled(invoiceData.items, data.id);
        }

        return data.id;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}

/**
 * Allow Admins to get all invoices, or Brands to get only theirs.
 */
export async function getInvoices(brandId = null) {
    try {
        let query = supabase
            .from(TABLE_NAME)
            .select('*')
            .order('createdAt', { ascending: false });

        if (brandId) {
            query = query.eq('brandId', brandId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }
}

/**
 * Fetch all activations for a brand that haven't been billed yet.
 */
export async function getUnbilledActivations(brandId) {
    try {
        const { data, error } = await supabase
            .from('activations')
            .select('*')
            .eq('brandId', brandId)
            // .neq('billingStatus', 'billed') // This can be tricky with nulls
            .not('billingStatus', 'eq', 'billed');

        if (error) throw error;
        // Client side filter if needed for nulls, but .not existing usually works
        return data || [];
    } catch (error) {
        console.error("Error getting unbilled work:", error);
        return [];
    }
}

async function markItemsAsBilled(items, invoiceId) {
    // Activations
    const activationIds = items
        .filter(i => i.sourceType === 'activation' && i.sourceId)
        .map(i => i.sourceId);

    if (activationIds.length > 0) {
        await supabase
            .from('activations')
            .update({ billingStatus: 'billed', invoiceId })
            .in('id', activationIds);
    }

    // Sales
    const saleIds = items
        .filter(i => i.sourceType === 'sale' && i.sourceId)
        .map(i => i.sourceId);

    if (saleIds.length > 0) {
        await supabase
            .from('sales')
            .update({ billingStatus: 'billed', invoiceId })
            .in('id', saleIds);
    }
}

export async function updateInvoiceStatus(invoiceId, status) {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .update({ status })
            .eq('id', invoiceId);
        return !error;
    } catch (error) {
        console.error("Error updating invoice status:", error);
        return false;
    }
}

export async function deleteInvoice(invoiceId) {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', invoiceId);
        return !error;
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return false;
    }
}
