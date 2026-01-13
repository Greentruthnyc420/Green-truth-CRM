/**
 * Green Truth CRM - Cloud Functions
 * 
 * This file is the main entry point for all Cloud Functions.
 * It imports and exports functions from specialized modules.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const Joi = require('joi');

admin.initializeApp();

// Import specialized function modules
const integrations = require('./integrations');
const webhooks = require('./webhooks');

// Export all functions from the integrations module
exports.getMondaySettings = integrations.getMondaySettings;
exports.saveMondaySettings = integrations.saveMondaySettings;
exports.testMondayConnection = integrations.testMondayConnection;
exports.getRecentSyncHistory = integrations.getRecentSyncHistory;
exports.triggerFullSync = integrations.triggerFullSync;
exports.syncInvoiceToMonday = integrations.syncInvoiceToMonday;
exports.syncLeadToMonday = integrations.syncLeadToMonday;
exports.syncOrderToMonday = integrations.syncOrderToMonday;
exports.syncActivationToMonday = integrations.syncActivationToMonday;
exports.trimSyncLogs = integrations.trimSyncLogs;

// Export webhook handlers
exports.mondayWebhook = webhooks.mondayWebhook;

// ============================================================
// EMAIL: Transporter Setup
// ============================================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().email?.user || process.env.EMAIL_USER,
        pass: functions.config().email?.pass || process.env.EMAIL_PASS
    }
});

// ============================================================
// FUNCTION: Send Invoice Email
// ============================================================
const sendInvoiceEmailSchema = Joi.object({
    invoiceData: Joi.object().required(),
    recipientEmail: Joi.string().email().required(),
});

exports.sendInvoiceEmail = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = sendInvoiceEmailSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { invoiceData, recipientEmail } = value;

    try {
        const html = `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h1 style="color: #10b981; margin-bottom: 0;">Green Truth NYC</h1>
                <p style="color: #64748b; margin-top: 5px;">Invoice #${invoiceData.invoiceNumber}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #64748b; font-size: 12px; text-transform: uppercase;">Bill To:</h3>
                    <p style="font-size: 18px; font-weight: bold; margin: 0;">${invoiceData.brand}</p>
                    <p style="color: #64748b; margin: 0;">${recipientEmail}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="text-align: left; padding: 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">DESCRIPTION</th>
                            <th style="text-align: right; padding: 10px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0;">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoiceData.lineItems.map(item => `
                            <tr>
                                <td style="padding: 15px 10px; border-bottom: 1px solid #f1f5f9;">${item.description}</td>
                                <td style="text-align: right; padding: 15px 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="text-align: right; margin-bottom: 30px;">
                    <p style="font-size: 24px; font-weight: 900; color: #10b981; margin: 0;">Total Due: $${invoiceData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p style="color: #f59e0b; font-weight: bold; margin: 5px 0 0 0;">Due Date: ${invoiceData.dueDate}</p>
                </div>
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; font-size: 14px; color: #92400e;">
                    <strong>Note:</strong> ${invoiceData.notes}
                </div>
                <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
                    <p>Questions? Contact us at billing@thegreentruthnyc.com</p>
                    <p>&copy; ${new Date().getFullYear()} Green Truth NYC. All rights reserved.</p>
                </div>
            </div>
        `;

        if (!transporter.options.auth.user || !transporter.options.auth.pass) {
            functions.logger.info('Email mock log (No credentials configured):', { recipientEmail, invoiceNumber: invoiceData.invoiceNumber });
            return {
                success: true,
                mock: true,
                message: 'No SMTP credentials configured. Email logged to system console instead.'
            };
        }

        await transporter.sendMail({
            from: `"Green Truth NYC" <${transporter.options.auth.user}>`,
            to: recipientEmail,
            subject: `Green Truth Invoice: ${invoiceData.invoiceNumber} - ${invoiceData.brand}`,
            html: html
        });

        functions.logger.info(`Invoice email sent successfully to ${recipientEmail}`);

        return { success: true };
    } catch (error) {
        functions.logger.error('sendInvoiceEmail error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

// ============================================================
// FUNCTION: Send Partnership Inquiry Email
// ============================================================
const sendPartnershipEmailSchema = Joi.object({
    formData: Joi.object().required(),
});

exports.sendPartnershipInquiry = functions.https.onCall(async (data, context) => {
    const { error, value } = sendPartnershipEmailSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { formData } = value;

    try {
        const html = `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h1 style="color: #10b981; margin-bottom: 20px;">New Partnership Inquiry</h1>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p><strong>Company:</strong> ${formData.companyName}</p>
                    <p><strong>Contact:</strong> ${formData.contactName}</p>
                    <p><strong>Email:</strong> ${formData.email}</p>
                    <p><strong>Phone:</strong> ${formData.phone}</p>
                </div>
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #64748b; font-size: 12px; text-transform: uppercase;">Message:</h3>
                    <p style="white-space: pre-wrap;">${formData.message}</p>
                </div>
                <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px;">
                    <p>This inquiry was sent from the Green Truth Landing Page.</p>
                </div>
            </div>
        `;

        const ADMIN_EMAIL = 'notifications@thegreentruthnyc.com';

        if (!transporter.options.auth.user || !transporter.options.auth.pass) {
            functions.logger.info('Partnership Email mock log:', formData);
            return {
                success: true,
                mock: true,
                message: 'No SMTP credentials configured.'
            };
        }

        await transporter.sendMail({
            from: `"Green Truth CRM" <${transporter.options.auth.user}>`,
            to: ADMIN_EMAIL,
            subject: `Partnership Inquiry: ${formData.companyName}`,
            html: html
        });

        return { success: true };
    } catch (error) {
        functions.logger.error('sendPartnershipInquiry error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
