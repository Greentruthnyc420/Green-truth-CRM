/**
 * Green Truth CRM - Monday.com Cloud Functions
 *
 * This file contains additional Cloud Functions for Monday.com integration.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Joi = require('joi');

const db = admin.firestore();

/**
 * ============================================================
 * FUNCTION: Get Recent Sync History
 * ============================================================
 * Fetches the last 20 sync log events for a specific brand.
 */
const getRecentSyncHistorySchema = Joi.object({
    brandId: Joi.string().required(),
});

exports.getRecentSyncHistory = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { error, value } = getRecentSyncHistorySchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { brandId } = value;

    try {
        const snapshot = await db.collection('brand_sync_logs')
            .where('brandId', '==', brandId)
            .orderBy('receivedAt', 'desc')
            .limit(20)
            .get();

        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return history;
    } catch (error) {
        functions.logger.error('Error fetching sync history for brand:', brandId, error);
        throw new functions.https.HttpsError('internal', 'Could not retrieve sync history.');
    }
});

/**
 * ============================================================
 * FUNCTION: Trigger Full Sync
 * ============================================================
 * Kicks off a full data synchronization process.
 * NOTE: This function is a placeholder and does not perform a full sync.
 * A full implementation would require a more robust solution, such as using
 * Google Cloud Pub/Sub to trigger a long-running background function,
 * to avoid hitting the HTTPS function timeout limits.
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

    // Placeholder: In a real implementation, this would trigger a Pub/Sub function
    // to perform a full data sync without hitting the HTTPS function timeout.
    return { success: true, message: 'Full sync initiated. This may take a few minutes.' };
});
