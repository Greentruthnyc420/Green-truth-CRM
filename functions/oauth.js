const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const Joi = require('joi');

const db = admin.firestore();

// Schema for input validation
const exchangeTokenSchema = Joi.object({
    code: Joi.string().required(),
    redirectUri: Joi.string().required(),
    brandId: Joi.string().optional().allow(null),
    userType: Joi.string().optional().valid('brand', 'dispensary').default('brand')
});

/**
 * Exchanges Monday.com authorization code for an access token
 * and saves it to the brand's integration settings.
 */
exports.exchangeMondayToken = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    // 2. Input Validation
    const { error, value } = exchangeTokenSchema.validate(data);
    if (error) {
        throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    }
    const { code, redirectUri, brandId, userType } = value;

    // Validate brandId if userType is brand
    if (userType === 'brand' && !brandId) {
        throw new functions.https.HttpsError('invalid-argument', 'Brand ID is required for brand integration.');
    }

    // 3. Get Secrets
    // Note: Secrets must be exposed to the function via runWith({ secrets: [...] })
    const clientId = process.env.MONDAY_CLIENT_ID || functions.config().monday.client_id;
    const clientSecret = process.env.MONDAY_CLIENT_SECRET || functions.config().monday.client_secret;

    if (!clientId || !clientSecret) {
        throw new functions.https.HttpsError('failed-precondition', 'Monday.com OAuth credentials not configured on server.');
    }

    try {
        // 4. Exchange Code for Token
        const tokenUrl = 'https://auth.monday.com/oauth2/token';
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri
            })
        });

        const json = await response.json();

        if (!response.ok) {
            functions.logger.error('Monday Token Exchange Failed', json);
            throw new Error(json.error_description || json.message || 'Failed to exchange token');
        }

        const { access_token, refresh_token, scope } = json;

        // 5. Auto-Provision Boards (Phase 2c)
        // We do this BEFORE saving to ensure we have IDs to save, or we save incrementally.
        // Better to save token first in case provisioning fails, so we don't lose the connection.

        let boardIds = {};
        try {
            const { provisionMondayBoards, provisionDispensaryBoards } = require('./monday-provision');

            /* 
            if (userType === 'dispensary') {
                boardIds = await provisionDispensaryBoards(access_token);
            } else {
                boardIds = await provisionMondayBoards(access_token);
            }
            */
        } catch (provErr) {
            functions.logger.error('Monday Provisioning Failed', provErr);
            // Continue - we still want to save the token
        }

        // 6. Save securely to Firestore
        // We permit the user to update the brand integration if they are authenticated.
        // In a stricter app, we'd check if context.auth.uid has 'owner' role for brandId.

        const updateData = {
            mondayApiToken: access_token,
            mondayRefreshToken: refresh_token || null, // Monday might not return this for all scopes
            mondayTokenScope: scope,
            mondayConnectedAt: admin.firestore.FieldValue.serverTimestamp(),
            mondayConnectedBy: context.auth.uid,
            connectionType: 'oauth'
        };

        if (userType === 'dispensary') {
            // Dispensary Logic: Save to dispensary_integrations/{uid}
            if (boardIds.invoices) updateData.invoicesBoardId = boardIds.invoices;

            await db.collection('dispensary_integrations').doc(context.auth.uid).set(updateData, { merge: true });
            functions.logger.info(`Successfully linked Monday.com for Dispensary ${context.auth.uid}`);
        } else {
            // Brand Logic: Save to brand_integrations/{brandId}
            // Merge mapped board IDs if they were created
            if (boardIds.invoices) updateData.invoicesBoardId = boardIds.invoices;
            if (boardIds.activations) updateData.activationsBoardId = boardIds.activations;
            if (boardIds.sales) updateData.salesBoardId = boardIds.sales;
            if (boardIds.accounts) updateData.accountsBoardId = boardIds.accounts;

            await db.collection('brand_integrations').doc(brandId).set(updateData, { merge: true });
            functions.logger.info(`Successfully linked Monday.com for Brand ${brandId}`);
        }

        return { success: true, provisioned: Object.keys(boardIds).length > 0 };

    } catch (err) {
        functions.logger.error('Exchange Monday Token Error', err);
        throw new functions.https.HttpsError('internal', `OAuth Flow Failed: ${err.message}`);
    }
});
