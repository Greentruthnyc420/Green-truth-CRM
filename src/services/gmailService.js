/**
 * Gmail Service - OAuth-based email sending via Gmail API
 * Uses the Google Identity Services (GIS) library for OAuth 2.0
 */

const CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

let tokenClient = null;
let accessToken = null;

/**
 * Initialize the Google Identity Services token client
 */
export function initGmailAuth() {
    return new Promise((resolve, reject) => {
        if (!CLIENT_ID) {
            reject(new Error('Gmail Client ID not configured'));
            return;
        }

        // Check if GIS library is loaded
        if (!window.google?.accounts?.oauth2) {
            // Load GIS script
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = () => {
                initializeTokenClient(resolve, reject);
            };
            script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
            document.head.appendChild(script);
        } else {
            initializeTokenClient(resolve, reject);
        }
    });
}

function initializeTokenClient(resolve, reject) {
    try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response) => {
                if (response.access_token) {
                    accessToken = response.access_token;
                    resolve(response.access_token);
                } else {
                    reject(new Error('Failed to get access token'));
                }
            },
        });
        resolve(tokenClient);
    } catch (error) {
        reject(error);
    }
}

/**
 * Request Gmail access from the user
 */
export async function requestGmailAccess() {
    if (!tokenClient) {
        await initGmailAuth();
    }

    return new Promise((resolve, reject) => {
        tokenClient.callback = (response) => {
            if (response.error) {
                reject(new Error(response.error));
            } else if (response.access_token) {
                accessToken = response.access_token;
                resolve(response.access_token);
            }
        };
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
}

/**
 * Check if user has granted Gmail access
 */
export function hasGmailAccess() {
    return !!accessToken;
}

/**
 * Send an email via Gmail API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body (plain text)
 * @param {string} [cc] - CC recipients
 * @param {string} [bcc] - BCC recipients
 * @param {string} [from] - From email (optional, uses authenticated user)
 */
export async function sendEmail({ to, subject, body, cc = '', bcc = '', from = '' }) {
    if (!accessToken) {
        throw new Error('Gmail not authorized. Please connect your Gmail first.');
    }

    // Build RFC 2822 formatted email
    const emailLines = [];
    if (from) emailLines.push(`From: ${from}`);
    emailLines.push(`To: ${to}`);
    if (cc) emailLines.push(`Cc: ${cc}`);
    if (bcc) emailLines.push(`Bcc: ${bcc}`);
    emailLines.push(`Subject: ${subject}`);
    emailLines.push('Content-Type: text/plain; charset=utf-8');
    emailLines.push('');
    emailLines.push(body);

    const email = emailLines.join('\r\n');

    // Base64 URL-safe encode
    const encodedEmail = btoa(unescape(encodeURIComponent(email)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            raw: encodedEmail
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to send email');
    }

    return response.json();
}

/**
 * Revoke Gmail access
 */
export function revokeGmailAccess() {
    if (accessToken && window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(accessToken, () => {
            accessToken = null;
        });
    }
    accessToken = null;
}

/**
 * Get the current access token (for debugging/status)
 */
export function getAccessToken() {
    return accessToken;
}
