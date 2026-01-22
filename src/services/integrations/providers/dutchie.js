/**
 * Dutchie Integration Provider
 * 
 * Leading cannabis ecommerce and POS platform for dispensaries.
 * API Docs: https://business.dutchie.com/api
 */

const BASE_URL = 'https://plus.dutchie.com/api/v1';

export async function testConnection(connection) {
    console.log('[Dutchie] Testing connection:', connection.id);

    if (!connection.api_key) {
        return { success: false, error: 'API key is required' };
    }

    return {
        success: true,
        message: 'Connection configured (API not yet activated)',
        provider: 'dutchie'
    };
}

export async function sync(connection, syncType) {
    console.log(`[Dutchie] Starting ${syncType} sync for connection:`, connection.id);

    return {
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        errors: [],
    };
}

export async function syncOrders(_connection, _options = {}) {
    // GET /orders
    console.log('[Dutchie] Syncing orders...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function syncProducts(_connection, _options = {}) {
    // GET /catalog/products
    console.log('[Dutchie] Syncing products...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function syncInventory(_connection, _options = {}) {
    // GET /inventory
    console.log('[Dutchie] Syncing inventory...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function syncCustomers(_connection, _options = {}) {
    // GET /customers
    console.log('[Dutchie] Syncing customers...');
    return { recordsProcessed: 0, recordsCreated: 0, recordsUpdated: 0 };
}

export async function pushMenuUpdate(_connection, _menuData) {
    // POST /catalog/products
    console.log('[Dutchie] Pushing menu update...');
    return { success: true };
}

export async function handleWebhook(payload, _signature, _connection) {
    console.log('[Dutchie] Handling webhook:', payload.event);

    switch (payload.event) {
        case 'order.created':
            break;
        case 'order.completed':
            break;
        case 'inventory.updated':
            break;
    }
}

export function mapProductToDutchie(product) {
    return {
        name: product.name,
        type: product.category,
        brand: product.brandName,
        price: product.price,
        quantity: product.inventory,
        thc_content: product.thcContent,
        cbd_content: product.cbdContent,
        description: product.description,
    };
}

export function mapOrderFromDutchie(dutchieOrder) {
    return {
        externalId: dutchieOrder.id,
        externalSource: 'dutchie',
        dispensaryId: dutchieOrder.dispensary_id,
        customerName: dutchieOrder.customer?.name,
        items: dutchieOrder.items?.map(item => ({
            productId: item.product_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        })),
        status: dutchieOrder.status,
        createdAt: dutchieOrder.created_at,
    };
}

export default {
    testConnection,
    sync,
    syncOrders,
    syncProducts,
    syncInventory,
    syncCustomers,
    pushMenuUpdate,
    handleWebhook,
    mapProductToDutchie,
    mapOrderFromDutchie,
};
