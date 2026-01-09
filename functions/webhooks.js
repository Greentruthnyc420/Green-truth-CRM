/**
 * Green Truth CRM - Webhook Handlers
 *
 * This file contains Cloud Functions for handling incoming webhooks,
 * specifically from Monday.com for real-time data synchronization.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

const db = admin.firestore();

/**
 * Verifies the webhook signature from Monday.com.
 * @param {string} authorization - The Authorization header from the request.
 * @param {string} body - The raw request body.
 * @returns {boolean} - True if the signature is valid.
 */
function verifyMondaySignature(authorization, body) {
    const signingSecret = functions.config().monday.signing_secret;
    if (!signingSecret) {
        functions.logger.error('Monday signing secret is not configured.');
        return false;
    }

    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(body);
    const expectedSignature = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(authorization), Buffer.from(expectedSignature));
}

/**
 * ============================================================
 * FUNCTION: Monday.com Webhook Handler
 * ============================================================
 * Handles incoming events from Monday.com.
 */
exports.mondayWebhook = functions.https.onRequest(async (req, res) => {
    functions.logger.info('Received Monday.com webhook', { body: req.body });

    // Monday.com sends a challenge request to verify the webhook URL
    if (req.body.challenge) {
        functions.logger.info('Responding to Monday.com challenge');
        return res.status(200).send({ challenge: req.body.challenge });
    }

    // Verify the request signature for security
    const signature = req.headers.authorization;
    const rawBody = JSON.stringify(req.body);

    if (!verifyMondaySignature(signature, rawBody)) {
        functions.logger.warn('Invalid Monday.com webhook signature');
        return res.status(401).send('Invalid signature');
    }

    const { event } = req.body;
    const { brandId } = req.query;

    if (!event) {
        functions.logger.warn('Webhook received without an event payload');
        return res.status(400).send('Missing event payload');
    }
    if (!brandId) {
        functions.logger.warn('Webhook received without a brandId in the query string');
        return res.status(400).send('Missing brandId');
    }

    try {
        // Handle 'update_column_value' which covers status changes
        if (event.type === 'update_column_value' && event.columnId === 'status') {
            const { itemId, value } = event;
            const newStatus = value.label.text;

            // Scope queries to the specific brand to prevent data leakage
            const leadsRef = db.collection('leads');
            const ordersRef = db.collection('sales');

            const leadQuery = leadsRef.where('ownerBrandId', '==', brandId).where('mondayItemId', '==', String(itemId));
            const orderQuery = ordersRef.where('brandId', '==', brandId).where('mondayItemId', '==', String(itemId));

            const [leadSnapshot, orderSnapshot] = await Promise.all([
                leadQuery.get(),
                orderQuery.get(),
            ]);

            if (!leadSnapshot.empty) {
                const doc = leadSnapshot.docs[0];
                await doc.ref.update({ status: newStatus, mondaySyncedAt: admin.firestore.FieldValue.serverTimestamp() });
                functions.logger.info(`Updated lead ${doc.id} for brand ${brandId} to status "${newStatus}"`);
            } else if (!orderSnapshot.empty) {
                const doc = orderSnapshot.docs[0];
                await doc.ref.update({ status: newStatus, mondaySyncedAt: admin.firestore.FieldValue.serverTimestamp() });
                functions.logger.info(`Updated order ${doc.id} for brand ${brandId} to status "${newStatus}"`);
            } else {
                functions.logger.warn(`Received status update for unknown item ID: ${itemId} for brand: ${brandId}`);
            }
        }

        // Log the event with brandId for better tracking
        const logData = {
            brandId,
            ...event,
            receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('brand_sync_logs').add(logData);

        return res.status(200).send('Webhook processed successfully.');
    } catch (error) {
        functions.logger.error('Error processing Monday.com webhook:', error);
        return res.status(500).send('Internal Server Error');
    }
});
