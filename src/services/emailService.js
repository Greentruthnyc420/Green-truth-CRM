/**
 * Email Service
 * 
 * Frontend service for interacting with Email Cloud Functions.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Send an invoice via email
 * @param {object} invoiceData - The invoice details
 * @param {string} recipientEmail - Where to send the invoice
 * @returns {Promise<{success: boolean, message?: string, mock?: boolean}>}
 */
export async function sendInvoiceEmail(invoiceData, recipientEmail) {
    try {
        const sendEmail = httpsCallable(functions, 'sendInvoiceEmail');
        const result = await sendEmail({ invoiceData, recipientEmail });
        return result.data;
    } catch (error) {
        console.error('sendInvoiceEmail error:', error);
        throw new Error(error.message || 'Failed to send email');
    }
}
