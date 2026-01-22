/**
 * Blaze Integration Provider
 * 
 * All-in-one cannabis retail management and POS system.
 * API Docs: https://blaze.me/developers
 */

const BASE_URL = 'https://api.blaze.me/v1';

export async function testConnection(connection) {
    console.log('[Blaze] Testing connection:', connection.id);

    if (!connection.api_key) {
        return { success: false, error: 'API key is required' };
    }

    return {
        success: true,
        message: 'Connection configured (API not yet activated)',
        provider: 'blaze'
    };
}

export async function sync(connection, syncType) {
    console.log(`[Blaze] Starting ${syncType} sync for connection:`, connection.id);

    return {
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        errors: [],
    };
}

export async function syncOrders(_connection, _options = {}) {
    console.log('[Blaze] Syncing orders...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function syncProducts(_connection, _options = {}) {
    console.log('[Blaze] Syncing products...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function syncInventory(_connection, _options = {}) {
    console.log('[Blaze] Syncing inventory...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function syncCustomers(_connection, _options = {}) {
    console.log('[Blaze] Syncing customers...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function handleWebhook(payload, _signature, _connection) {
    console.log('[Blaze] Handling webhook:', payload.event);
}

export function mapProductToBlaze(product) {
    return {
        name: product.name,
        category: product.category,
        brand_name: product.brandName,
        unit_price: product.price,
        quantity_available: product.inventory,
    };
}

export function mapOrderFromBlaze(blazeOrder) {
    return {
        externalId: blazeOrder.id,
        externalSource: 'blaze',
        items: blazeOrder.cart_items?.map(item => ({
            productId: item.product_id,
            name: item.product_name,
            quantity: item.quantity,
            price: item.unit_price,
        })),
        status: blazeOrder.status,
        createdAt: blazeOrder.created_at,
    };
}

export default {
    testConnection,
    sync,
    syncOrders,
    syncProducts,
    syncInventory,
    syncCustomers,
    handleWebhook,
    mapProductToBlaze,
    mapOrderFromBlaze,
};
