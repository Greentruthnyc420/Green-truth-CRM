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

/**
 * Sync a lead to Monday.com
 * @param {string} brandId - The brand's ID
 * @param {object} lead - The lead object to sync
 * @param {string} boardId - The Monday.com board ID
 * @returns {Promise<{success: boolean, mondayItemId?: string, error?: string}>}
 */
export async function syncLeadToMonday(brandId, lead, boardId) {
    try {
        const syncLead = httpsCallable(functions, 'syncLeadToMonday');
        const result = await syncLead({ brandId, lead, boardId });
        return result.data;
    } catch (error) {
        console.error('syncLeadToMonday error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sync lead'
        };
    }
}

/**
 * Sync an order to Monday.com
 * @param {string} brandId - The brand's ID
 * @param {object} order - The order object to sync
 * @param {string} boardId - The Monday.com board ID
 * @returns {Promise<{success: boolean, mondayItemId?: string, error?: string}>}
 */
export async function syncOrderToMonday(brandId, order, boardId) {
    try {
        const syncOrder = httpsCallable(functions, 'syncOrderToMonday');
        const result = await syncOrder({ brandId, order, boardId });
        return result.data;
    } catch (error) {
        console.error('syncOrderToMonday error:', error);
        return {
            success: false,
            error: error.message || 'Failed to sync order'
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
