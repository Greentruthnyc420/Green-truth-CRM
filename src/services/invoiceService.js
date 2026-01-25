import { supabase } from './supabaseClient';

const TABLE_NAME = 'invoices';

/**
 * Generate a sequential invoice number in format: GT-MMDDYYYY-XXXX
 * Queries the database for the last invoice number of today
 * and increments by 1.
 * @returns {string} - Invoice number like GT-01252026-0001
 */
async function generateInvoiceNumber() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    const dateStr = `${month}${day}${year}`;
    const prefix = `GT-${dateStr}-`;

    try {
        // Find the highest invoice number for today
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('invoice_number')
            .like('invoice_number', `${prefix}%`)
            .order('invoice_number', { ascending: false })
            .limit(1);

        if (error) throw error;

        let nextNumber = 1;

        if (data && data.length > 0 && data[0].invoice_number) {
            // Extract the sequence number from the last invoice
            const lastInvoice = data[0].invoice_number;
            const match = lastInvoice.match(new RegExp(`^GT-${dateStr}-(\\d+)$`));
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        // Pad to 4 digits
        const paddedNumber = String(nextNumber).padStart(4, '0');
        return `${prefix}${paddedNumber}`;
    } catch (error) {
        console.error("Error generating invoice number:", error);
        // Fallback to timestamp-based if database query fails
        return `GT-${dateStr}-${Date.now().toString().slice(-4)}`;
    }
}

/**
 * Migrate existing invoices to new GT-MMDDYYYY-XXXX format.
 * This function updates all invoices that don't have the new format.
 * Should be called once during app initialization or as an admin action.
 * @returns {Object} - { updated: number, errors: number }
 */
export async function migrateInvoiceNumbers() {
    try {
        // Get all invoices that don't have the new format
        const { data: invoices, error } = await supabase
            .from(TABLE_NAME)
            .select('id, invoice_number, created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Group invoices by date to generate sequential numbers
        const byDate = {};
        let updated = 0;
        let errors = 0;

        for (const inv of invoices || []) {
            // Skip if already in new format (GT-MMDDYYYY-XXXX)
            if (inv.invoice_number && /^GT-\d{8}-\d{4}$/.test(inv.invoice_number)) {
                continue;
            }

            // Generate new invoice number based on created_at
            const createdAt = new Date(inv.created_at);
            const month = String(createdAt.getMonth() + 1).padStart(2, '0');
            const day = String(createdAt.getDate()).padStart(2, '0');
            const year = createdAt.getFullYear();
            const dateStr = `${month}${day}${year}`;

            // Track sequence per date
            if (!byDate[dateStr]) {
                byDate[dateStr] = 0;
            }
            byDate[dateStr]++;

            const newInvoiceNumber = `GT-${dateStr}-${String(byDate[dateStr]).padStart(4, '0')}`;

            // Update the invoice
            const { error: updateError } = await supabase
                .from(TABLE_NAME)
                .update({ invoice_number: newInvoiceNumber })
                .eq('id', inv.id);

            if (updateError) {
                console.error(`Failed to update invoice ${inv.id}:`, updateError);
                errors++;
            } else {
                console.log(`Updated invoice ${inv.id}: ${inv.invoice_number} → ${newInvoiceNumber}`);
                updated++;
            }
        }

        return { updated, errors, message: `Migrated ${updated} invoices with ${errors} errors` };
    } catch (error) {
        console.error("Migration failed:", error);
        return { updated: 0, errors: 1, message: error.message };
    }
}

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
        // Generate invoice number if not provided
        const invoiceNumber = invoiceData.invoiceNumber || invoiceData.invoice_number || await generateInvoiceNumber();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([{
                ...invoiceData,
                invoice_number: invoiceNumber,
                status: invoiceData.status || 'pending',
                items: invoiceData.items || [], // Stored as JSONB
                created_at: new Date().toISOString()
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
        // Use the new sequential invoice number format
        const invoiceNumber = await generateInvoiceNumber();

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
