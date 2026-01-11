import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// Admin email addresses for all notifications
const ADMIN_EMAILS = [
    'omar@thegreentruthnyc.com',
    'amber@thegreentruthnyc.com'
];

/**
 * Send email notification to admin team
 * @param {Object} params
 * @param {string} params.subject - Email subject line
 * @param {string} params.html - HTML email content
 * @param {string} params.text - Plain text fallback
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function sendAdminNotification({ subject, html, text }) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Green Truth CRM <notifications@thegreentruthnyc.com>',
            to: ADMIN_EMAILS,
            subject: subject,
            html: html,
            text: text
        });

        if (error) throw error;

        console.log('✅ Admin notification sent:', subject);
        return { success: true, data };
    } catch (error) {
        console.error('❌ Email notification error:', error);
        return { success: false, error };
    }
}

/**
 * Email template for sale notifications
 */
export function createSaleEmail({ dispensaryName, revenue, repName, commission, products }) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #065f46 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">💰 New Sale Logged!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Sale Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Dispensary:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${dispensaryName}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Revenue:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #10b981; font-weight: bold; font-size: 18px;">$${revenue.toLocaleString()}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Sales Rep:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${repName}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Commission:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #065f46; font-weight: bold;">$${commission.toFixed(2)}</td>
                    </tr>
                    ${products ? `
                    <tr style="background: white;">
                        <td style="padding: 15px; font-weight: bold; color: #6b7280;">Products:</td>
                        <td style="padding: 15px; color: #1f2937;">${products}</td>
                    </tr>
                    ` : ''}
                </table>
                <div style="margin-top: 30px; padding: 20px; background: white; border-left: 4px solid #10b981; border-radius: 4px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        <strong>Green Truth NYC CRM</strong> • Real-Time Notification
                    </p>
                </div>
            </div>
        </div>
    `;

    const text = `
New Sale Logged!

Dispensary: ${dispensaryName}
Revenue: $${revenue.toLocaleString()}
Sales Rep: ${repName}
Commission: $${commission.toFixed(2)}
${products ? `Products: ${products}` : ''}

---
Green Truth NYC CRM
    `.trim();

    return { html, text };
}

/**
 * Email template for lead notifications
 */
export function createLeadEmail({ dispensaryName, contactPerson, phone, email, interestedBrands, repName }) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🎯 New Lead Logged!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Lead Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Dispensary:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: bold; font-size: 16px;">${dispensaryName}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Contact Person:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${contactPerson || 'N/A'}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Phone:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${phone || 'N/A'}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Email:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${email || 'N/A'}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Interested Brands:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #3b82f6; font-weight: bold;">${interestedBrands || 'Not specified'}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; font-weight: bold; color: #6b7280;">Logged By:</td>
                        <td style="padding: 15px; color: #1f2937;">${repName}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 20px; background: white; border-left: 4px solid #3b82f6; border-radius: 4px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        <strong>Green Truth NYC CRM</strong> • Real-Time Notification
                    </p>
                </div>
            </div>
        </div>
    `;

    const text = `
New Lead Logged!

Dispensary: ${dispensaryName}
Contact Person: ${contactPerson || 'N/A'}
Phone: ${phone || 'N/A'}
Email: ${email || 'N/A'}
Interested Brands: ${interestedBrands || 'Not specified'}
Logged By: ${repName}

---
Green Truth NYC CRM
    `.trim();

    return { html, text };
}

/**
 * Email template for activation notifications
 */
export function createActivationEmail({ dispensaryName, activationType, date, repName, notes }) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🎯 New Activation Logged!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Activation Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Location:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: bold; font-size: 16px;">${dispensaryName}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Type:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #8b5cf6; font-weight: bold;">${activationType}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Date:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${date}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Sales Rep:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${repName}</td>
                    </tr>
                    ${notes ? `
                    <tr style="background: white;">
                        <td style="padding: 15px; font-weight: bold; color: #6b7280; vertical-align: top;">Notes:</td>
                        <td style="padding: 15px; color: #1f2937;">${notes}</td>
                    </tr>
                    ` : ''}
                </table>
                <div style="margin-top: 30px; padding: 20px; background: white; border-left: 4px solid #8b5cf6; border-radius: 4px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        <strong>Green Truth NYC CRM</strong> • Real-Time Notification
                    </p>
                </div>
            </div>
        </div>
    `;

    const text = `
New Activation Logged!

Location: ${dispensaryName}
Type: ${activationType}
Date: ${date}
Sales Rep: ${repName}
${notes ? `Notes: ${notes}` : ''}

---
Green Truth NYC CRM
    `.trim();

    return { html, text };
}

/**
 * Email template for new user registrations
 */
export function createUserRegistrationEmail({ userEmail, role, timestamp }) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">👤 New User Registration!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">User Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Email:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: bold;">${userEmail}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Role:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #f59e0b; font-weight: bold; text-transform: capitalize;">${role}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; font-weight: bold; color: #6b7280;">Timestamp:</td>
                        <td style="padding: 15px; color: #1f2937;">${timestamp}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 20px; background: white; border-left: 4px solid #f59e0b; border-radius: 4px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        <strong>Green Truth NYC CRM</strong> • Real-Time Notification
                    </p>
                </div>
            </div>
        </div>
    `;

    const text = `
New User Registration!

Email: ${userEmail}
Role: ${role}
Timestamp: ${timestamp}

---
Green Truth NYC CRM
    `.trim();

    return { html, text };
}

/**
 * Email template for dispensary orders
 */
export function createOrderEmail({ dispensaryName, brandName, products, total, orderDate }) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🛒 New Order Placed!</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Order Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Dispensary:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: bold; font-size: 16px;">${dispensaryName}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Brand:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${brandName}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Total:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #06b6d4; font-weight: bold; font-size: 18px;">$${total.toLocaleString()}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; font-weight: bold; color: #6b7280;">Order Date:</td>
                        <td style="padding: 15px; border-bottom: 2px solid #e5e7eb; color: #1f2937;">${orderDate}</td>
                    </tr>
                    <tr style="background: white;">
                        <td style="padding: 15px; font-weight: bold; color: #6b7280; vertical-align: top;">Products:</td>
                        <td style="padding: 15px; color: #1f2937;">${products}</td>
                    </tr>
                </table>
                <div style="margin-top: 30px; padding: 20px; background: white; border-left: 4px solid #06b6d4; border-radius: 4px;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        <strong>Green Truth NYC CRM</strong> • Real-Time Notification
                    </p>
                </div>
            </div>
        </div>
    `;

    const text = `
New Order Placed!

Dispensary: ${dispensaryName}
Brand: ${brandName}
Total: $${total.toLocaleString()}
Order Date: ${orderDate}
Products: ${products}

---
Green Truth NYC CRM
    `.trim();

    return { html, text };
}
