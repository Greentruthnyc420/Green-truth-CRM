/**
 * Green Truth CRM - Cloud Functions
 * 
 * This file contains Cloud Functions for Monday.com integration.
 * Each brand stores their own API key securely in Firestore.
 * 
 * Functions:
 * - testMondayConnection: Validates a brand's Monday.com API token
 * - syncLeadToMonday: Pushes a lead to the brand's Monday.com board
 * - syncOrderToMonday: Pushes an order to the brand's Monday.com board
 * 
 * SECURITY: API keys are fetched from Firestore at runtime, never exposed to client.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Bottleneck = require('bottleneck');
const retry = require('async-retry');
const Joi = require('joi');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Rate limiting: 50 requests per minute.
const limiter = new Bottleneck({
    reservoir: 50,
    reservoirRefreshAmount: 50,
    reservoirRefreshInterval: 60 * 1000, // per minute
});

// Monday.com GraphQL endpoint
const MONDAY_API_URL = 'https://api.monday.com/v2';

/**
 * Helper: Make a GraphQL request to Monday.com with retry and rate limiting
 * @param {string} apiToken - The brand's Monday.com API token
 * @param {string} query - GraphQL query
 * @param {object} variables - Query variables
 */
async function mondayRequest(apiToken, query, variables = {}) {
    return await retry(async bail => {
        const response = await limiter.schedule(() => fetch(MONDAY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiToken,
                'API-Version': '2024-01'
            },
            body: JSON.stringify({ query, variables })
        }));

        // Handle non-ok responses
        if (!response.ok) {
            // Don't retry on client errors
            if (response.status >= 400 && response.status < 500) {
                const errorText = await response.text();
                bail(new Error(`Client error: ${response.status} ${errorText}`));
                return;
            }
            // Retry on server errors
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            // Log the specific error for better debugging
            functions.logger.error("Monday.com API Error", {
                errors: data.errors
            });
            throw new Error(data.errors[0]?.message || 'Monday.com API Error');
        }

        return data;
    }, {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        onRetry: (error, attempt) => {
            functions.logger.warn(`Retrying Monday.com request (attempt ${attempt})`, {
                error: error.message
            });
        }
    });
}

/**
 * Helper: Get brand's Monday.com API token from Firestore
 * @param {string} brandId - The brand's ID
 */
async function getBrandMondayToken(brandId) {
    const docRef = db.collection('brand_integrations').doc(brandId);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new Error('No integration settings found for this brand');
    }

    const data = doc.data();
    if (!data.mondayApiToken) {
        throw new Error('Monday.com API token not configured');
    }

    return data.mondayApiToken;
}

/**
 * Helper: Log a sync event to Firestore
 * @param {string} brandId - The brand's ID
 * @param {string} action - e.g., 'syncLead', 'syncOrder'
 * @param {boolean} success - Whether the sync was successful
 * @param {object} details - Additional details (e.g., leadId, orderId)
 * @param {string|null} error - Error message if failed
 */
async function logSyncEvent(brandId, action, success, details, error = null) {
    try {
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const logData = {
            brandId,
            action,
            success,
            details,
            error,
            timestamp,
        };
        await db.collection('brand_sync_logs').add(logData);

        const integrationRef = db.collection('brand_integrations').doc(brandId);
        await integrationRef.update({
            lastSync: {
                timestamp,
                success,
                action,
            }
        });
    } catch (logError) {
        functions.logger.error('Failed to log sync event', {
            brandId,
            action,
            error: logError.message
        });
    }
}

// ============================================================
// FUNCTION: Test Monday.com Connection
// ============================================================
const testMondayConnectionSchema = Joi.object({
    apiToken: Joi.string().required(),
});

exports.testMondayConnection = functions.https.onCall(async (data, context) => {
    // Verify authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Validate input
    const { error, value } = testMondayConnectionSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { apiToken } = value;

    try {
        // Simple query to verify token works
        const query = `query { me { name email } }`;
        const result = await mondayRequest(apiToken, query);

        return {
            success: true,
            user: result.data.me
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// Export functions from other files
const monday = require('./monday');
const webhooks = require('./webhooks');

exports.getRecentSyncHistory = monday.getRecentSyncHistory;
exports.triggerFullSync = monday.triggerFullSync;
exports.mondayWebhook = webhooks.mondayWebhook;

// ============================================================
// FUNCTION: Sync Invoice to Monday.com
// ============================================================
const syncInvoiceToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    invoice: Joi.object().required(),
    boardId: Joi.string().required(),
});

exports.syncInvoiceToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = syncInvoiceToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, invoice, boardId } = value;

    try {
        const apiToken = await getBrandMondayToken(brandId);

        const query = `
            mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
                create_item (
                    board_id: $boardId,
                    item_name: $itemName,
                    column_values: $columnValues
                ) {
                    id
                }
            }
        `;

        const columnValues = JSON.stringify({
            'numbers': invoice.amount || 0,
            'status': { label: invoice.status || 'Unpaid' },
            'date4': { date: invoice.dueDate || new Date().toISOString().split('T')[0] }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: boardId,
            itemName: `Invoice: ${invoice.dispensaryName || 'Unknown'}`,
            columnValues: columnValues
        });

        if (invoice.id) {
            await db.collection('invoices').doc(invoice.id).update({
                mondayItemId: result.data.create_item.id,
                mondaySyncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await logSyncEvent(brandId, 'syncInvoice', true, { invoiceId: invoice.id, mondayItemId: result.data.create_item.id });

        return {
            success: true,
            mondayItemId: result.data.create_item.id
        };
    } catch (error) {
        functions.logger.error('syncInvoiceToMonday error:', error);
        await logSyncEvent(brandId, 'syncInvoice', false, { invoiceId: invoice.id }, error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================================
// FUNCTION: Get Monday.com Integration Settings
// ============================================================
const getMondaySettingsSchema = Joi.object({
    brandId: Joi.string().required(),
});

exports.getMondaySettings = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = getMondaySettingsSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId } = value;

    try {
        const docRef = db.collection('brand_integrations').doc(brandId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { connected: false };
        }

        const settings = doc.data();
        // Return only non-sensitive data
        return {
            connected: !!settings.mondayApiToken,
            lastSync: settings.lastSync || null,
            leadsBoardId: settings.leadsBoardId || null,
            ordersBoardId: settings.ordersBoardId || null,
        };
    } catch (error) {
        functions.logger.error('getMondaySettings error:', error);
        throw new functions.https.HttpsError('internal', 'Could not retrieve Monday.com settings');
    }
});

// ============================================================
// FUNCTION: Sync Lead to Monday.com
// ============================================================
const syncLeadToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    lead: Joi.object().required(),
    boardId: Joi.string().required(),
});

exports.syncLeadToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Validate input
    const { error, value } = syncLeadToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, lead, boardId } = value;

    try {
        const apiToken = await getBrandMondayToken(brandId);

        // Create item in Monday.com board
        const query = `
            mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
                create_item (
                    board_id: $boardId,
                    item_name: $itemName,
                    column_values: $columnValues
                ) {
                    id
                }
            }
        `;

        // Map lead fields to Monday.com columns
        // Note: Column IDs will need to be configured per brand
        const columnValues = JSON.stringify({
            // Standard column mappings - brands can customize
            'text': lead.contactPerson || '',
            'email': { email: lead.email || '', text: lead.email || '' },
            'status': { label: lead.status || 'New' }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: boardId,
            itemName: lead.dispensaryName,
            columnValues: columnValues
        });

        // Update Firestore with Monday.com item ID
        if (lead.id) {
            await db.collection('leads').doc(lead.id).update({
                mondayItemId: result.data.create_item.id,
                mondaySyncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await logSyncEvent(brandId, 'syncLead', true, { leadId: lead.id, mondayItemId: result.data.create_item.id });

        return {
            success: true,
            mondayItemId: result.data.create_item.id
        };
    } catch (error) {
        functions.logger.error('syncLeadToMonday error:', error);
        await logSyncEvent(brandId, 'syncLead', false, { leadId: lead.id }, error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================================
// FUNCTION: Sync Order to Monday.com
// ============================================================
const syncOrderToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    order: Joi.object().required(),
    boardId: Joi.string().required(),
});

exports.syncOrderToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Validate input
    const { error, value } = syncOrderToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, order, boardId } = value;

    try {
        const apiToken = await getBrandMondayToken(brandId);

        const query = `
            mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
                create_item (
                    board_id: $boardId,
                    item_name: $itemName,
                    column_values: $columnValues
                ) {
                    id
                }
            }
        `;

        // Map order fields to Monday.com columns
        const columnValues = JSON.stringify({
            'numbers': order.amount || 0,
            'status': { label: order.status || 'Pending' },
            'date': { date: order.date || new Date().toISOString().split('T')[0] }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: boardId,
            itemName: `Order: ${order.dispensaryName || 'Unknown'}`,
            columnValues: columnValues
        });

        // Update Firestore with Monday.com item ID
        if (order.id) {
            await db.collection('sales').doc(order.id).update({
                mondayItemId: result.data.create_item.id,
                mondaySyncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await logSyncEvent(brandId, 'syncOrder', true, { orderId: order.id, mondayItemId: result.data.create_item.id });

        return {
            success: true,
            mondayItemId: result.data.create_item.id
        };
    } catch (error) {
        functions.logger.error('syncOrderToMonday error:', error);
        await logSyncEvent(brandId, 'syncOrder', false, { orderId: order.id }, error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================================
// SCHEDULED FUNCTION: Trim Sync Logs
// ============================================================
exports.trimSyncLogs = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const integrationsSnapshot = await db.collection('brand_integrations').get();
    for (const doc of integrationsSnapshot.docs) {
        const brandId = doc.id;
        const logsQuery = db.collection('brand_sync_logs').where('brandId', '==', brandId);
        const snapshot = await logsQuery.count().get();
        const count = snapshot.data().count;

        if (count > 100) {
            const logsToDeleteQuery = logsQuery.orderBy('timestamp', 'asc').limit(count - 100);
            const logsToDeleteSnapshot = await logsToDeleteQuery.get();
            const batch = db.batch();
            logsToDeleteSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
    }
    return null;
});

// ============================================================
// FUNCTION: Save Monday.com Integration Settings
// ============================================================
const saveMondaySettingsSchema = Joi.object({
    brandId: Joi.string().required(),
    settings: Joi.object().required(),
});

exports.saveMondaySettings = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // Validate input
    const { error, value } = saveMondaySettingsSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, settings } = value;

    try {
        const docRef = db.collection('brand_integrations').doc(brandId);

        await docRef.set({
            ...settings,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: context.auth.uid
        }, { merge: true });

        return { success: true };
    } catch (error) {
        functions.logger.error('saveMondaySettings error:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// ============================================================
// EMAIL: Transporter Setup
// ============================================================
// To configure, run: firebase functions:config:set email.user="your@email.com" email.pass="yourpassword"
const transporter = nodemailer.createTransport({
    service: 'gmail', // Default to gmail, can be changed
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
        // Build basic HTML template
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
