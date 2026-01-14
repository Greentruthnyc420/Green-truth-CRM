
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

// ============================================================
// FUNCTION: Send Activation Request Notification (Email)
// ============================================================
const sendActivationRequestSchema = Joi.object({
    requestData: Joi.object().required(),
});

exports.sendActivationRequestNotification = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    const { error, value } = sendActivationRequestSchema.validate(data);
    if (error) throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    const { requestData } = value;

    try {
        const html = `
            <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">New Activation Request</h2>
                <p><strong>${requestData.requestedBy}</strong> has requested a new activation.</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Brand:</strong> ${requestData.brandName}</p>
                    <p><strong>Dispensary:</strong> ${requestData.dispensaryName}</p>
                    <p><strong>Requested Dates:</strong></p>
                    <ul>
                        ${requestData.dates.map(d => `<li>${d}</li>`).join('')}
                    </ul>
                    <p><strong>Notes:</strong> ${requestData.notes}</p>
                </div>
                
                <p>Please review and schedule in the Admin Dashboard.</p>
            </div>
        `;

        const ADMIN_EMAIL = 'notifications@thegreentruthnyc.com';

        await transporter.sendMail({
            from: `"Green Truth CRM" <${transporter.options.auth.user}>`,
            to: ADMIN_EMAIL,
            subject: `Activation Request: ${requestData.brandName} @ ${requestData.dispensaryName}`,
            html: html
        });

        return { success: true };
    } catch (error) {
        functions.logger.error('sendActivationRequestNotification error:', error);
        return { success: false, error: error.message };
    }
});

// ============================================================
// OAUTH: Monday.com
// ============================================================
const { exchangeMondayToken } = require('./oauth');
exports.exchangeMondayToken = exchangeMondayToken;

// ============================================================
// MONDAY.COM SYNC: SALES (ORDERS)
// ============================================================
// Note: Keeping Jules' version as it includes commission and items
const { getBrandMondayIntegration, logSyncEvent, mondayRequest } = require('./integrations'); // Access helper function if possible? 
// Ah, the helper functions are NOT exported from integrations.js. 
// I need them for these inline functions. 
// OR I should move these inline functions TO integrations.js.

// For now, to allow the file to run and fix valid syntax, I will import dependencies or rely on duplications if they were in the original file.
// The original file (Jules version) had helpers inline or imported.
// In the 'index.js' I viewed, 'mondayRequest' was a helper defined at the top.
// Since I moved 'mondayRequest' to integrations.js and didn't export it, these functions below will FAIL.

// FATAL FLAW IN PLAN: 'mondayRequest' and 'logSyncEvent' are in integrations.js but not exported.
// I must export them from integrations.js to use them here.


// ============================================================
// MONDAY.COM SYNC: SALES (ORDERS)
// ============================================================
// Import helpers from integrations.js
const { getBrandMondayIntegration, logSyncEvent, mondayRequest } = require('./integrations');

const syncSaleToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    sale: Joi.object().required()
});

exports.syncSaleToMonday = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    // 2. Validation
    const { error, value } = syncSaleToMondaySchema.validate(data);
    if (error) throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    const { brandId, sale } = value;

    try {
        const settings = await getBrandMondayIntegration(brandId);
        const { mondayApiToken, salesBoardId } = settings;

        if (!mondayApiToken || !salesBoardId) {
            throw new Error('Monday credentials or Sales Board ID not configured.');
        }

        // 3. Construct Query
        // Columns: Date, People (Rep), Numbers (Amount), Status (Status), Long Text (Items)
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

        // Format Items List
        const itemsSummary = (sale.items || []).map(i => `${i.quantity}x ${i.name}`).join('\n');

        const columnValues = JSON.stringify({
            'date4': { date: (sale.date || new Date().toISOString()).split('T')[0] },
            'numbers': sale.amount || 0,
            'numbers_1': sale.commissionEarned || 0, // Commission
            'status': { label: sale.status === 'completed' ? 'Done' : 'Working on it' },
            'long_text': { text: itemsSummary }
        });

        const result = await mondayRequest(mondayApiToken, query, {
            boardId: salesBoardId,
            itemName: `Order: ${sale.dispensaryName || 'Unknown'}`,
            columnValues: columnValues
        });

        // 4. Log Success
        await logSyncEvent(brandId, 'syncSale', true, { saleId: sale.id, mondayItemId: result.data.create_item.id });

        return { success: true, mondayItemId: result.data.create_item.id };

    } catch (error) {
        functions.logger.error('syncSaleToMonday error:', error);
        await logSyncEvent(brandId, 'syncSale', false, { saleId: sale.id }, error.message);
        return { success: false, error: error.message };
    }
});

// ============================================================
// MONDAY.COM SYNC: ACCOUNTS (LEADS)
// ============================================================
const syncAccountToMondaySchema = Joi.object({
    brandId: Joi.string().required(),
    lead: Joi.object().required()
});

exports.syncAccountToMonday = functions.https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    // 2. Validation
    const { error, value } = syncAccountToMondaySchema.validate(data);
    if (error) throw new functions.https.HttpsError('invalid-argument', error.details[0].message);
    const { brandId, lead } = value;

    try {
        const settings = await getBrandMondayIntegration(brandId);
        const { mondayApiToken, accountsBoardId } = settings;

        if (!mondayApiToken || !accountsBoardId) {
            throw new Error('Monday credentials or Accounts Board ID not configured.');
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
            'status': { label: lead.leadStatus === 'active' ? 'Active' : 'Prospect' },
            'text': lead.licenseNumber || '',
            'location': {
                lat: 0, lng: 0,
                address: lead.address || 'Unknown'
            },
            'date': { date: (lead.lastSaleDate || new Date().toISOString()).split('T')[0] }
        });

        const result = await mondayRequest(mondayApiToken, query, {
            boardId: accountsBoardId,
            itemName: lead.dispensaryName || 'Unknown Dispensary',
            columnValues: columnValues
        });

        await logSyncEvent(brandId, 'syncAccount', true, { leadId: lead.id, mondayItemId: result.data.create_item.id });

        return { success: true, mondayItemId: result.data.create_item.id };

    } catch (error) {
        functions.logger.error('syncAccountToMonday error:', error);
        await logSyncEvent(brandId, 'syncAccount', false, { leadId: lead.id }, error.message);
        return { success: false, error: error.message };
    }
});


// Schema for syncing a dispensary invoice
const syncDispensaryInvoiceSchema = Joi.object({
    invoice: Joi.object({
        id: Joi.string().required(),
        amount: Joi.number().required(),
        dueDate: Joi.string().allow(null, '').optional(),
        brandName: Joi.string().required(),
        status: Joi.string().default('Unpaid')
    }).required()
});

/**
 * Get dispensary Monday settings
 */
exports.getDispensaryIntegration = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    const doc = await db.collection('dispensary_integrations').doc(context.auth.uid).get();
    if (!doc.exists) return { connected: false };

    const d = doc.data();
    return {
        connected: !!d.mondayApiToken,
        invoicesBoardId: d.invoicesBoardId,
        lastSync: d.lastSync
    };
});

/**
 * Sync Dispensary Invoice to Monday
 */
exports.syncDispensaryInvoiceToMonday = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

    const { error, value } = syncDispensaryInvoiceSchema.validate(data);
    if (error) throw new functions.https.HttpsError('invalid-argument', error.details[0].message);

    const { invoice } = value;
    const uid = context.auth.uid;

    try {
        const doc = await db.collection('dispensary_integrations').doc(uid).get();
        if (!doc.exists || !doc.data().mondayApiToken) {
            throw new Error('Monday.com not connected.');
        }

        const { mondayApiToken: apiToken, invoicesBoardId } = doc.data();
        if (!invoicesBoardId) throw new Error('Invoices Board ID not found. Try reconnecting Monday.');

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
            'numbers': invoice.amount,
            'date': { date: invoice.dueDate || new Date().toISOString().split('T')[0] },
            'text': invoice.brandName,
            'status': { label: invoice.status }
        });

        const result = await mondayRequest(apiToken, query, {
            boardId: Number(invoicesBoardId),
            itemName: `Invoice from ${invoice.brandName}`,
            columnValues: columnValues
        });

        // Optional: Update lastSync
        await db.collection('dispensary_integrations').doc(uid).update({
            lastSync: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, mondayItemId: result.data.create_item.id };

    } catch (err) {
        functions.logger.error('syncDispensaryInvoiceToMonday Error', err);
        return { success: false, error: err.message };
    }
});
