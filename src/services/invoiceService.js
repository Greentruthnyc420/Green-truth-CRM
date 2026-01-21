import { supabase } from './supabaseClient';

const TABLE_NAME = 'invoices';

/**
 * Get unpaid invoices for a dispensary, grouped by brand.
 * Used to check if dispensary has outstanding balance before allowing new orders.
 * @param {string} dispensaryId - The dispensary's ID
 * @returns {Object} - Map of brandId -> unpaid invoices array
 */
export async function getUnpaidInvoicesForDispensary(dispensaryId) {
    if (!dispensaryId) return {};

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('dispensary_id', dispensaryId)
            .in('status', ['pending', 'overdue'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by brand (handle both column naming conventions)
        const byBrand = {};
        (data || []).forEach(inv => {
            // Handle both snake_case and camelCase column names
            const brandId = inv.brand_id || inv.brandId;
            if (!brandId) return; // Skip if no brand associated

            if (!byBrand[brandId]) {
                byBrand[brandId] = [];
            }
            byBrand[brandId].push({
                id: inv.id,
                invoice_number: inv.invoice_number || inv.invoiceNumber,
                brand_id: brandId,
                brand_name: inv.brand_name || inv.brandName,
                total_amount: inv.total_amount || inv.total || 0,
                amount: inv.total_amount || inv.total || 0, // Alias for modal display
                status: inv.status,
                due_date: inv.due_date || inv.dueDate,
                created_at: inv.created_at || inv.createdAt
            });
        });

        return byBrand;
    } catch (error) {
        console.error("Error fetching unpaid invoices for dispensary:", error);
        return {};
    }
}

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
            .order('created_at', { ascending: false });

        if (brandId) {
            query = query.eq('brand_id', brandId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map snake_case to camelCase for frontend compatibility
        return (data || []).map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            brandId: inv.brand_id,
            brandName: inv.brand_name,
            type: inv.type,
            dispensaryName: inv.dispensary_name,
            activationId: inv.activation_id,
            items: inv.items || [],
            totalAmount: inv.total_amount,
            status: inv.status,
            dueDate: inv.due_date,
            paidDate: inv.paid_date,
            createdAt: inv.created_at,
            notes: inv.notes
        }));
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

/**
 * Auto-generate an invoice for a completed activation.
 * This is called automatically when an activation is logged.
 * 
 * @param {Object} activationData - The activation record (already inserted)
 * @param {number} activationFee - Pre-calculated activation fee
 * @returns {string|null} - Invoice ID or null on failure
 */
export async function createActivationInvoice(activationData, activationFee) {
    try {
        const invoiceNumber = `INV-ACT-${Date.now()}`;

        // Build invoice items
        const items = [{
            description: `In-Store Activation at ${activationData.dispensary_name || activationData.dispensaryName}`,
            date: activationData.activation_date || activationData.date || new Date().toISOString().split('T')[0],
            hours: activationData.total_hours || activationData.hoursWorked || 0,
            region: activationData.region || 'NYC',
            mileage: activationData.miles_traveled || activationData.milesTraveled || 0,
            mileageRate: 0.725,
            mileageAmount: (activationData.miles_traveled || activationData.milesTraveled || 0) * 0.725,
            tolls: activationData.toll_amount || activationData.tollAmount || 0,
            total: activationFee,
            sourceType: 'activation',
            sourceId: activationData.id
        }];

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([{
                invoice_number: invoiceNumber,
                brand_id: activationData.brand_id || activationData.brandId,
                brand_name: activationData.brand_name || activationData.brandName,
                type: 'activation',
                dispensary_name: activationData.dispensary_name || activationData.dispensaryName,
                activation_id: activationData.id,
                items: items,
                total_amount: activationFee,
                status: 'pending',
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Due in 30 days
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            console.error("Error creating activation invoice:", error);
            return null;
        }

        console.log(`📄 Auto-generated invoice ${invoiceNumber} for ${activationData.brand_name || activationData.brandName}: $${activationFee.toFixed(2)}`);
        return data.id;
    } catch (error) {
        console.error("Error in createActivationInvoice:", error);
        return null;
    }
}
