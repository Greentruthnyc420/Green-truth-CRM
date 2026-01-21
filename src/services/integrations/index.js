/**
 * Integration Manager Service
 * 
 * Central hub for all integration operations.
 * Provides a unified interface for connecting to, syncing with,
 * and managing POS and ERP systems.
 */

import { supabase } from '../supabaseClient';

// Provider adapters (lazy loaded to reduce bundle size)
const PROVIDERS = {
    // ERP Systems
    leaflink: () => import('./providers/leaflink'),
    distru: () => import('./providers/distru'),
    canix: () => import('./providers/canix'),
    flourish: () => import('./providers/flourish'),
    // POS Systems
    dutchie: () => import('./providers/dutchie'),
    blaze: () => import('./providers/blaze'),
    treez: () => import('./providers/treez'),
    // Compliance
    metrc: () => import('./providers/metrc'),
    biotrack: () => import('./providers/biotrack'),
};

// Provider metadata for UI display
export const INTEGRATION_PROVIDERS = {
    // ERP Systems
    leaflink: {
        id: 'leaflink',
        name: 'LeafLink',
        category: 'erp',
        logo: '🍃',
        color: '#10b981',
        description: 'The largest B2B cannabis marketplace',
        features: ['Order sync', 'Inventory management', 'Catalog updates'],
        authType: 'api_key', // api_key, oauth2, oauth1
        docsUrl: 'https://developer.leaflink.com/',
        requiredFields: ['api_key'],
        optionalFields: ['company_id'],
        supportedSyncTypes: ['orders', 'products', 'inventory'],
    },
    distru: {
        id: 'distru',
        name: 'Distru',
        category: 'erp',
        logo: '📦',
        color: '#6366f1',
        description: 'Cannabis distribution and inventory management',
        features: ['Fulfillment tracking', 'Compliance', 'Route optimization'],
        authType: 'api_key',
        docsUrl: 'https://distru.com/api-docs',
        requiredFields: ['api_key'],
        optionalFields: ['api_secret'],
        supportedSyncTypes: ['orders', 'inventory', 'shipments'],
    },
    canix: {
        id: 'canix',
        name: 'Canix',
        category: 'erp',
        logo: '⚡',
        color: '#8b5cf6',
        description: 'Seed-to-sale tracking and manufacturing ERP',
        features: ['Batch tracking', 'Manufacturing', 'Lab results'],
        authType: 'api_key',
        docsUrl: 'https://canix.com/developers',
        requiredFields: ['api_key', 'company_id'],
        optionalFields: [],
        supportedSyncTypes: ['products', 'inventory', 'batches'],
    },
    flourish: {
        id: 'flourish',
        name: 'Flourish',
        category: 'erp',
        logo: '🌸',
        color: '#ec4899',
        description: 'Cannabis ERP for cultivation, manufacturing, and distribution',
        features: ['Supply chain', 'Cost tracking', 'Inventory sync'],
        authType: 'api_key',
        docsUrl: 'https://flourishsoftware.com/api',
        requiredFields: ['api_key'],
        optionalFields: ['facility_id'],
        supportedSyncTypes: ['products', 'inventory', 'orders'],
    },
    // POS Systems
    dutchie: {
        id: 'dutchie',
        name: 'Dutchie',
        category: 'pos',
        logo: '🌿',
        color: '#4ade80',
        description: 'Leading cannabis ecommerce and POS platform',
        features: ['Real-time inventory sync', 'Order management', 'Menu updates'],
        authType: 'api_key',
        docsUrl: 'https://business.dutchie.com/api',
        requiredFields: ['api_key', 'dispensary_id'],
        optionalFields: ['location_id'],
        supportedSyncTypes: ['orders', 'products', 'inventory', 'customers'],
    },
    blaze: {
        id: 'blaze',
        name: 'Blaze',
        category: 'pos',
        logo: '🔥',
        color: '#f97316',
        description: 'All-in-one cannabis retail management and POS',
        features: ['Inventory tracking', 'Customer data sync', 'Sales analytics'],
        authType: 'api_key',
        docsUrl: 'https://blaze.me/developers',
        requiredFields: ['api_key', 'partner_key'],
        optionalFields: ['shop_id'],
        supportedSyncTypes: ['orders', 'products', 'inventory', 'customers'],
    },
    treez: {
        id: 'treez',
        name: 'Treez',
        category: 'pos',
        logo: '🌲',
        color: '#22c55e',
        description: 'Enterprise cannabis retail platform',
        features: ['Product sync', 'Order automation', 'Compliance tracking'],
        authType: 'oauth2',
        docsUrl: 'https://treez.io/api-documentation',
        requiredFields: ['client_id', 'client_secret'],
        optionalFields: ['dispensary_id'],
        supportedSyncTypes: ['orders', 'products', 'inventory'],
    },
    // Compliance (future)
    metrc: {
        id: 'metrc',
        name: 'METRC',
        category: 'compliance',
        logo: '📋',
        color: '#059669',
        description: 'Cannabis track-and-trace compliance system',
        features: ['Package tracking', 'Transfer manifests', 'Compliance reporting'],
        authType: 'api_key',
        docsUrl: 'https://api-ca.metrc.com/Documentation',
        requiredFields: ['api_key', 'user_key'],
        optionalFields: ['license_number'],
        supportedSyncTypes: ['packages', 'transfers', 'sales'],
    },
    biotrack: {
        id: 'biotrack',
        name: 'BioTrack',
        category: 'compliance',
        logo: '🧬',
        color: '#0ea5e9',
        description: 'Seed-to-sale traceability and compliance',
        features: ['Inventory tracking', 'Sales reporting', 'Compliance'],
        authType: 'api_key',
        docsUrl: 'https://biotrack.com/api',
        requiredFields: ['api_key', 'license_id'],
        optionalFields: [],
        supportedSyncTypes: ['inventory', 'sales'],
    },
};

/**
 * Get all connections for an organization
 */
export async function getConnections(orgId, orgType) {
    const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('org_id', orgId)
        .eq('org_type', orgType)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching connections:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get a specific connection
 */
export async function getConnection(connectionId) {
    const { data, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

    if (error) {
        console.error('Error fetching connection:', error);
        throw error;
    }

    return data;
}

/**
 * Create a new integration connection
 */
export async function createConnection(connectionData) {
    const { data, error } = await supabase
        .from('integration_connections')
        .insert({
            org_id: connectionData.orgId,
            org_type: connectionData.orgType,
            provider: connectionData.provider,
            display_name: connectionData.displayName || INTEGRATION_PROVIDERS[connectionData.provider]?.name,
            api_key: connectionData.apiKey,
            api_secret: connectionData.apiSecret,
            access_token: connectionData.accessToken,
            settings: connectionData.settings || {},
            status: 'pending',
            created_by: connectionData.createdBy,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating connection:', error);
        throw error;
    }

    return data;
}

/**
 * Update a connection
 */
export async function updateConnection(connectionId, updates) {
    const updateData = {};

    if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
    if (updates.apiKey !== undefined) updateData.api_key = updates.apiKey;
    if (updates.apiSecret !== undefined) updateData.api_secret = updates.apiSecret;
    if (updates.accessToken !== undefined) updateData.access_token = updates.accessToken;
    if (updates.refreshToken !== undefined) updateData.refresh_token = updates.refreshToken;
    if (updates.settings !== undefined) updateData.settings = updates.settings;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.syncEnabled !== undefined) updateData.sync_enabled = updates.syncEnabled;
    if (updates.lastError !== undefined) updateData.last_error = updates.lastError;

    const { data, error } = await supabase
        .from('integration_connections')
        .update(updateData)
        .eq('id', connectionId)
        .select()
        .single();

    if (error) {
        console.error('Error updating connection:', error);
        throw error;
    }

    return data;
}

/**
 * Delete a connection
 */
export async function deleteConnection(connectionId) {
    const { error } = await supabase
        .from('integration_connections')
        .delete()
        .eq('id', connectionId);

    if (error) {
        console.error('Error deleting connection:', error);
        throw error;
    }

    return true;
}

/**
 * Test a connection's credentials
 */
export async function testConnection(connectionId) {
    const connection = await getConnection(connectionId);
    if (!connection) throw new Error('Connection not found');

    try {
        const providerModule = await PROVIDERS[connection.provider]();
        const result = await providerModule.testConnection(connection);

        // Update connection status based on test result
        await updateConnection(connectionId, {
            status: result.success ? 'active' : 'error',
            lastError: result.success ? null : result.error,
        });

        return result;
    } catch (error) {
        await updateConnection(connectionId, {
            status: 'error',
            lastError: error.message,
        });
        throw error;
    }
}

/**
 * Trigger a sync for a connection
 */
export async function triggerSync(connectionId, syncType = 'full_sync') {
    const connection = await getConnection(connectionId);
    if (!connection) throw new Error('Connection not found');

    // Log sync start
    const { data: logEntry } = await supabase
        .from('integration_sync_logs')
        .insert({
            connection_id: connectionId,
            sync_type: syncType,
            status: 'started',
            started_at: new Date().toISOString(),
        })
        .select()
        .single();

    try {
        const providerModule = await PROVIDERS[connection.provider]();
        const result = await providerModule.sync(connection, syncType);

        // Update log with success
        await supabase
            .from('integration_sync_logs')
            .update({
                status: 'success',
                records_processed: result.recordsProcessed || 0,
                records_created: result.recordsCreated || 0,
                records_updated: result.recordsUpdated || 0,
                completed_at: new Date().toISOString(),
                duration_ms: Date.now() - new Date(logEntry.started_at).getTime(),
            })
            .eq('id', logEntry.id);

        // Update connection last sync
        await updateConnection(connectionId, {
            status: 'active',
            lastError: null,
        });

        await supabase
            .from('integration_connections')
            .update({ last_sync_at: new Date().toISOString(), last_sync_status: 'success' })
            .eq('id', connectionId);

        return result;
    } catch (error) {
        // Update log with failure
        await supabase
            .from('integration_sync_logs')
            .update({
                status: 'failed',
                error_message: error.message,
                completed_at: new Date().toISOString(),
                duration_ms: Date.now() - new Date(logEntry.started_at).getTime(),
            })
            .eq('id', logEntry.id);

        await updateConnection(connectionId, {
            status: 'error',
            lastError: error.message,
        });

        throw error;
    }
}

/**
 * Get sync logs for a connection
 */
export async function getSyncLogs(connectionId, limit = 20) {
    const { data, error } = await supabase
        .from('integration_sync_logs')
        .select('*')
        .eq('connection_id', connectionId)
        .order('started_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching sync logs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Get all available providers by category
 */
export function getProvidersByCategory() {
    const categories = {
        erp: [],
        pos: [],
        compliance: [],
    };

    Object.values(INTEGRATION_PROVIDERS).forEach(provider => {
        if (categories[provider.category]) {
            categories[provider.category].push(provider);
        }
    });

    return categories;
}

export default {
    INTEGRATION_PROVIDERS,
    getProvidersByCategory,
    getConnections,
    getConnection,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    triggerSync,
    getSyncLogs,
};
