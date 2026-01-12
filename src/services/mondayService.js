/**
 * Monday.com Integration Service
 * 
 * Frontend service for interacting with Monday.com Cloud Functions.
 * This service makes calls to Firebase Cloud Functions which securely
 * handle the Monday.com API tokens (stored in Firestore).
 * 
 * IMPORTANT: API tokens are NEVER exposed to the frontend.
 * All Monday.com API calls go through Cloud Functions.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

/**
 * Test a Monday.com API token before saving
 * @param {string} apiToken - The Monday.com API token to test
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
export async function testMondayConnection(apiToken) {
    try {
        const testConnection = httpsCallable(functions, 'testMondayConnection');
        const result = await testConnection({ apiToken });
        return result.data;
    } catch (error) {
        console.error('testMondayConnection error:', error);
        return {
            success: false,
            error: error.message || 'Failed to test connection'
        };
    }
}

/**
 * Save Monday.com integration settings for a brand
 * @param {string} brandId - The brand's ID
 * @param {object} settings - Settings object containing mondayApiToken, leadsBoard, etc.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function saveMondaySettings(brandId, settings) {
    try {
        const saveSettings = httpsCallable(functions, 'saveMondaySettings');
        const result = await saveSettings({ brandId, settings });
        return result.data;
    } catch (error) {
        console.error('saveMondaySettings error:', error);
        return {
            success: false,
            error: error.message || 'Failed to save settings'
        };
    }
}

export async function syncAccountToMonday(brandId, lead) {
    try {
        const syncAccount = httpsCallable(functions, 'syncAccountToMonday');
        const result = await syncAccount({ brandId, lead });
        return result.data;
    } catch (error) {
        console.error('syncAccountToMonday error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sync lead'
        };
    }
}
// Legacy support: alias syncLeadToMonday to syncAccountToMonday if needed, or keeping it separate.
// For now, replacing syncLeadToMonday with syncAccountToMonday as per new plan.
export const syncLeadToMonday = syncAccountToMonday;

/**
 * Sync an order/sale to Monday.com
 * @param {string} brandId - The brand's ID
 * @param {object} sale - The sale object to sync
 * @param {string} boardId - The Monday.com board ID
 * @returns {Promise<{success: boolean, mondayItemId?: string, error?: string}>}
 */
export async function syncSaleToMonday(brandId, sale) {
    try {
        const syncSale = httpsCallable(functions, 'syncSaleToMonday');
        const result = await syncSale({ brandId, sale });
        return result.data;
    } catch (error) {
        console.error('syncSaleToMonday error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sync sale'
        };
    }
}
// Alias for backward compatibility if needed, but prefer syncSaleToMonday
export const syncOrderToMonday = syncSaleToMonday;

/**
 * Sync an activation to Monday.com
 * @param {string} brandId - The brand's ID
 * @param {object} activation - The activation object
 * @returns {Promise<{success: boolean, mondayItemId?: string, error?: string}>}
 */
export async function syncActivationToMonday(brandId, activation) {
    try {
        const syncAct = httpsCallable(functions, 'syncActivationToMonday');
        const result = await syncAct({ brandId, activation });
        return result.data;
    } catch (error) {
        console.error('syncActivationToMonday error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sync activation'
        };
    }
}

/**
 * Get Monday.com integration status for a brand
 * Checks if the brand has configured their Monday.com integration
 * @param {string} brandId - The brand's ID
 * @returns {Promise<{connected: boolean, lastSync?: Date}>}
 */
export async function getMondayIntegrationStatus(brandId) {
    if (!brandId) {
        return { connected: false, lastSync: null };
    }
    try {
        const getSettings = httpsCallable(functions, 'getMondaySettings');
        const result = await getSettings({ brandId });
        return result.data;
    } catch (error) {
        console.error('getMondayIntegrationStatus error:', error);
        return { connected: false, lastSync: null };
    }
}

/**
 * Fetch recent sync history for a brand
 * @param {string} brandId - The brand's ID
 * @returns {Promise<Array>}
 */
export async function getRecentSyncHistory(brandId) {
    if (!brandId) {
        return [];
    }
    try {
        const getHistory = httpsCallable(functions, 'getRecentSyncHistory');
        const result = await getHistory({ brandId });
        return result.data;
    } catch (error) {
        console.error('getRecentSyncHistory error:', error);
        return [];
    }
}

/**
 * Manually trigger a full sync for a brand
 * @param {string} brandId - The brand's ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function triggerFullSync(brandId) {
    if (!brandId) {
        return { success: false, error: 'Brand ID is required' };
    }
    try {
        const triggerSync = httpsCallable(functions, 'triggerFullSync');
        const result = await triggerSync({ brandId });
        return result.data;
    } catch (error) {
        console.error('triggerFullSync error:', error);
        return { success: false, error: error.message };
    }
}
/**
 * Get Dispensary Monday Integration Status
 */
export async function getDispensaryMondayIntegrationStatus() {
    try {
        const getStatus = httpsCallable(functions, 'getDispensaryIntegration');
        const result = await getStatus();
        return result.data;
    } catch (error) {
        console.error('getDispensaryMondayIntegrationStatus error:', error);
        return { connected: false };
    }
}

/**
 * Sync Dispensary Invoice
 */
export async function syncDispensaryInvoiceToMonday(invoice) {
    try {
        const syncFn = httpsCallable(functions, 'syncDispensaryInvoiceToMonday');
        const result = await syncFn({ invoice });
        return result.data;
    } catch (error) {
        console.error('syncDispensaryInvoiceToMonday error:', error);
        return { success: false, error: error.message };
    }
}
