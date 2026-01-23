/**
 * Email Notification Service
 * Calls Supabase Edge Function to send transactional emails
 * 
 * Email Types:
 * - order_confirmation: When a new order is placed
 * - order_approved: When brand approves an order
 * - order_shipped: When order is marked as shipped
 * - activation_scheduled: When activation is confirmed
 * - activation_reminder: Day before activation (cron job)
 * - invoice_ready: When invoice is generated
 * - team_invite: When team member is invited
 * 
 * To enable emails:
 * 1. Create Resend account at resend.com
 * 2. Verify domain thegreentruthnyc.com with DNS records
 * 3. Add RESEND_API_KEY to Supabase Edge Function secrets
 * 4. Add FROM_EMAIL=sales@thegreentruthnyc.com to Supabase secrets
 */

import { supabase } from './supabaseClient';

const EDGE_FUNCTION_URL = 'https://wlcqrgkvkcmewepbxwfh.supabase.co/functions/v1/send-email';

/**
 * Send an email notification via Supabase Edge Function
 * @param {string} type - Email type (order_confirmation, activation_scheduled, etc.)
 * @param {string} to - Recipient email address
 * @param {object} data - Email template data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function sendEmailNotification(type, to, data = {}) {
    try {
        // Get current session for authentication
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            console.warn('No active session for email notification');
            return { success: false, error: 'Not authenticated' };
        }

        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ type, to, data }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Email send failed:', result);
            return { success: false, error: result.error || 'Failed to send email' };
        }

        console.log(`✅ Email sent: ${type} to ${to}`);
        return { success: true, id: result.id };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(to, orderData) {
    return sendEmailNotification('order_confirmation', to, {
        orderId: orderData.id,
        total: orderData.total,
        customerName: orderData.customerName,
        items: orderData.items,
    });
}

/**
 * Send order approved email
 */
export async function sendOrderApproved(to, orderData) {
    return sendEmailNotification('order_approved', to, {
        orderId: orderData.id,
        brandName: orderData.brandName,
    });
}

/**
 * Send order shipped email
 */
export async function sendOrderShipped(to, orderData) {
    return sendEmailNotification('order_shipped', to, {
        orderId: orderData.id,
        trackingNumber: orderData.trackingNumber,
    });
}

/**
 * Send activation scheduled confirmation
 */
export async function sendActivationScheduled(to, activationData) {
    return sendEmailNotification('activation_scheduled', to, {
        date: activationData.date,
        dispensaryName: activationData.dispensaryName,
        brandName: activationData.brandName,
        timeSlot: activationData.timeSlot,
    });
}

/**
 * Send invoice ready notification
 */
export async function sendInvoiceReady(to, invoiceData) {
    return sendEmailNotification('invoice_ready', to, {
        invoiceNumber: invoiceData.invoiceNumber,
        amount: invoiceData.amount,
        dueDate: invoiceData.dueDate,
    });
}

/**
 * Send team invitation email
 */
export async function sendTeamInvite(to, inviteData) {
    return sendEmailNotification('team_invite', to, {
        dispensaryName: inviteData.dispensaryName,
        role: inviteData.role,
        invitedBy: inviteData.invitedBy,
        acceptUrl: inviteData.acceptUrl,
    });
}

/**
 * Send dispensary signup notification to admin
 * Called when a new dispensary registers on the platform
 */
export async function sendDispensarySignupNotification(dispensaryData) {
    // Send to admin email(s)
    const adminEmail = 'omar@thegreentruthnyc.com';

    return sendEmailNotification('dispensary_signup', adminEmail, {
        dispensaryName: dispensaryData.dispensaryName,
        contactName: dispensaryData.contactName,
        email: dispensaryData.email,
        address: dispensaryData.address,
        licenseNumber: dispensaryData.licenseNumber,
        referredBy: dispensaryData.referredBy || 'Self-Service',
        registrationDate: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
    });
}

// Legacy Firebase function for backward compatibility
export { sendInvoiceEmail } from './emailServiceLegacy';

export default {
    sendEmailNotification,
    sendOrderConfirmation,
    sendOrderApproved,
    sendOrderShipped,
    sendActivationScheduled,
    sendInvoiceReady,
    sendTeamInvite,
    sendDispensarySignupNotification,
};
