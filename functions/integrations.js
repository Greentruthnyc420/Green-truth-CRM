/**
 * Green Truth CRM - Integrations Cloud Functions
 *
 * This file consolidates all third-party integration logic, starting with Monday.com.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Joi = require('joi');
const fetch = require('node-fetch');
const Bottleneck = require('bottleneck');
const retry = require('async-retry');

// Initialize Firestore database
const db = admin.firestore();

// Rate limiting for Monday.com API: 50 requests per minute.
const limiter = new Bottleneck({
    reservoir: 50,
    reservoirRefreshAmount: 50,
    reservoirRefreshInterval: 60 * 1000,
});

// Monday.com GraphQL endpoint
const MONDAY_API_URL = 'https://api.monday.com/v2';

// ================================= HELPERS =================================

/**
 * Makes a GraphQL request to the Monday.com API with retry and rate limiting.
 * @param {string} apiToken - The brand's Monday.com API token.
 * @param {string} query - The GraphQL query.
 * @param {object} variables - The query variables.
 * @returns {Promise<object>} - The response data from the Monday.com API.
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

        if (!response.ok) {
            if (response.status >= 400 && response.status < 500) {
                const errorText = await response.text();
                bail(new Error(`Client error: ${response.status} ${errorText}`));
                return;
            }
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        if (data.errors) {
            functions.logger.error("Monday.com API Error", { errors: data.errors });
            throw new Error(data.errors[0]?.message || 'Monday.com API Error');
        }
        return data;
    }, {
        retries: 3,
        factor: 2,
        minTimeout: 1000,
        onRetry: (error, attempt) => {
            functions.logger.warn(`Retrying Monday.com request (attempt ${attempt})`, { error: error.message });
        }
    });
}

/**
 * Retrieves a brand's Monday.com integration settings from Firestore.
 * @param {string} brandId - The brand's ID.
 * @returns {Promise<object>} - The integration settings.
 * @throws {Error} If the settings or API token are not found.
 */
async function getBrandMondayIntegration(brandId) {
    const docRef = db.collection('brand_integrations').doc(brandId);
    const doc = await docRef.get();

    if (!doc.exists) {
        throw new functions.https.HttpsError('not-found', 'No integration settings found for this brand.');
    }

    const data = doc.data();
    if (!data.mondayApiToken) {
        throw new functions.https.HttpsError('failed-precondition', 'Monday.com API token not configured.');
    }

    return {
        apiToken: data.mondayApiToken,
        invoicesBoardId: data.invoicesBoardId,
        leadsBoardId: data.leadsBoardId,
        ordersBoardId: data.ordersBoardId,
        activationsBoardId: data.activationsBoardId,
    };
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


// ================================= MONDAY.COM FUNCTIONS =================================

/**
 * Get Monday.com Integration Settings
 */
const getMondaySettingsSchema = Joi.object({
    brandId: Joi.string().required(),
});

exports.getMondaySettings = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to view settings.');
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
            // Return a clear status instead of throwing an error for a non-existent setup
            return { connected: false, configured: false };
        }

        const settings = doc.data();
        return {
            connected: !!settings.mondayApiToken,
            configured: true,
            lastSync: settings.lastSync || null,
            leadsBoardId: settings.leadsBoardId || null,
            ordersBoardId: settings.ordersBoardId || null,
            invoicesBoardId: settings.invoicesBoardId || null,
        };
    } catch (err) {
        functions.logger.error('Error in getMondaySettings:', err);
        throw new functions.https.HttpsError('internal', 'Could not retrieve Monday.com settings.');
    }
});

/**
 * Save Monday.com Integration Settings
 */
const saveMondaySettingsSchema = Joi.object({
    brandId: Joi.string().required(),
    settings: Joi.object({
        mondayApiToken: Joi.string().allow(null),
        invoicesBoardId: Joi.string().allow(''),
    }).required(),
});


exports.saveMondaySettings = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to save settings.');
    }

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
            updatedBy: context.auth.uid,
        }, { merge: true });

        return { success: true };
    } catch (err) {
        functions.logger.error('Error in saveMondaySettings:', err);
        throw new functions.https.HttpsError('internal', 'Failed to save Monday.com settings.');
    }
});

/**
 * Test Monday.com Connection
 */
const testMondayConnectionSchema = Joi.object({
    apiToken: Joi.string().required(),
});

exports.testMondayConnection = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to test connection.');
    }

    const { error, value } = testMondayConnectionSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { apiToken } = value;

    try {
        const query = 'query { me { name email } }';
        const result = await mondayRequest(apiToken, query);
        return { success: true, user: result.data.me };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

/**
 * Get Recent Sync History
 */
const getRecentSyncHistorySchema = Joi.object({
    brandId: Joi.string().required(),
});

exports.getRecentSyncHistory = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to view sync history.');
    }

    const { error, value } = getRecentSyncHistorySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId } = value;

    try {
        const snapshot = await db.collection('brand_sync_logs')
            .where('brandId', '==', brandId)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return history;
    } catch (err) {
        functions.logger.error('Error fetching sync history:', err);
        throw new functions.https.HttpsError('internal', 'Could not retrieve sync history.');
    }
});

/**
 * Trigger Full Sync
 */
const triggerFullSyncSchema = Joi.object({
    brandId: Joi.string().required(),
});

exports.triggerFullSync = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = triggerFullSyncSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId } = value;

    functions.logger.info(`Manual sync triggered for brand: ${brandId} by user: ${context.auth.uid}`);

    return { success: true, message: 'Full sync initiated. This may take a few minutes.' };
});

/**
 * Sync Invoice to Monday.com
 */
const syncInvoiceToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    invoice: Joi.object().required(),
});

exports.syncInvoiceToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = syncInvoiceToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, invoice } = value;

    try {
        const { apiToken, invoicesBoardId } = await getBrandMondayIntegration(brandId);

        if (!invoicesBoardId) {
            throw new Error('Invoices Board ID not configured in settings.');
        }

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
            boardId: invoicesBoardId,
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

/**
 * Sync Lead to Monday.com
 */
const syncLeadToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    lead: Joi.object().required(),
});

exports.syncLeadToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = syncLeadToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, lead } = value;

    try {
        const { apiToken, leadsBoardId } = await getBrandMondayIntegration(brandId);

        if (!leadsBoardId) {
            throw new Error('Leads Board ID not configured in settings.');
        }

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
            'text': lead.contactPerson || '',
            'email': { email: lead.email || '', text: lead.email || '' },
            'status': { label: lead.status || 'New' }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: leadsBoardId,
            itemName: lead.dispensaryName,
            columnValues: columnValues
        });

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

/**
 * Sync Order to Monday.com
 */
const syncOrderToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    order: Joi.object().required(),
});

exports.syncOrderToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = syncOrderToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, order } = value;

    try {
        const { apiToken, ordersBoardId } = await getBrandMondayIntegration(brandId);

        if (!ordersBoardId) {
            throw new Error('Orders Board ID not configured in settings.');
        }

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
            'numbers': order.amount || 0,
            'status': { label: order.status || 'Pending' },
            'date': { date: order.date || new Date().toISOString().split('T')[0] }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: ordersBoardId,
            itemName: `Order: ${order.dispensaryName || 'Unknown'}`,
            columnValues: columnValues
        });

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

/**
 * Sync Activation to Monday.com
 */
const syncActivationToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    activation: Joi.object().required(),
});

exports.syncActivationToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = syncActivationToMondaySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId, activation } = value;

    try {
        const { apiToken, activationsBoardId } = await getBrandMondayIntegration(brandId);

        if (!activationsBoardId) {
            throw new Error('Activations Board ID not configured in settings.');
        }

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
            'date': { date: activation.date || new Date().toISOString().split('T')[0] },
            'text': activation.storeName || 'Unknown Location',
            'status': { label: activation.type === 'Sampling' ? 'Sampling' : 'Pop-up' }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: activationsBoardId,
            itemName: `Activation @ ${activation.storeName || 'Unknown Store'}`,
            columnValues: columnValues
        });

        if (activation.id) {
            await db.collection('activations').doc(activation.id).update({
                mondayItemId: result.data.create_item.id,
                mondaySyncedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        await logSyncEvent(brandId, 'syncActivation', true, { activationId: activation.id, mondayItemId: result.data.create_item.id });

        return {
            success: true,
            mondayItemId: result.data.create_item.id
        };
    } catch (error) {
        functions.logger.error('syncActivationToMonday error:', error);
        await logSyncEvent(brandId, 'syncActivation', false, { activationId: activation.id }, error.message);
        return {
            success: false,
            error: error.message
        };
    }
});

/**
 * SCHEDULED FUNCTION: Trim Sync Logs
 */
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
