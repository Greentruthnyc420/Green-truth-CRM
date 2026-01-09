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

        return {
            success: true,
            mondayItemId: result.data.create_item.id
        };
    } catch (error) {
        functions.logger.error('syncLeadToMonday error:', error);
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

        return {
            success: true,
            mondayItemId: result.data.create_item.id
        };
    } catch (error) {
        functions.logger.error('syncOrderToMonday error:', error);
        return {
            success: false,
            error: error.message
        };
    }
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
