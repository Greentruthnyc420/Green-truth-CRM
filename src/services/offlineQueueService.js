// Offline Queue Service
// Uses IndexedDB to queue sales and sync when back online

const DB_NAME = 'greentruth-offline';
const DB_VERSION = 1;
const STORES = {
    SALES_QUEUE: 'sales_queue',
    PENDING_ACTIVATIONS: 'pending_activations'
};

let db = null;

/**
 * Initialize IndexedDB
 */
async function initDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Sales queue store
            if (!database.objectStoreNames.contains(STORES.SALES_QUEUE)) {
                const salesStore = database.createObjectStore(STORES.SALES_QUEUE, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                salesStore.createIndex('timestamp', 'timestamp');
                salesStore.createIndex('synced', 'synced');
            }

            // Pending activations store
            if (!database.objectStoreNames.contains(STORES.PENDING_ACTIVATIONS)) {
                const actStore = database.createObjectStore(STORES.PENDING_ACTIVATIONS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                actStore.createIndex('timestamp', 'timestamp');
            }
        };
    });
}

/**
 * Queue a sale for later sync
 */
export async function queueSale(saleData) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.SALES_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SALES_QUEUE);

        const record = {
            ...saleData,
            timestamp: Date.now(),
            synced: false
        };

        const request = store.add(record);
        request.onsuccess = () => {
            console.log('[Offline] Sale queued for sync');
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all unsynced sales
 */
export async function getUnsyncedSales() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.SALES_QUEUE], 'readonly');
        const store = transaction.objectStore(STORES.SALES_QUEUE);
        const request = store.openCursor();
        const unsyncedSales = [];

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                // Only include records where synced is explicitly false or undefined
                if (cursor.value.synced === false || cursor.value.synced === undefined) {
                    unsyncedSales.push(cursor.value);
                }
                cursor.continue();
            } else {
                // Cursor finished, return results
                resolve(unsyncedSales);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Mark a sale as synced
 */
export async function markSaleSynced(id) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.SALES_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SALES_QUEUE);
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            const record = getRequest.result;
            if (record) {
                record.synced = true;
                record.syncedAt = Date.now();
                const updateRequest = store.put(record);
                updateRequest.onsuccess = () => resolve(true);
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                resolve(false);
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Clear synced sales older than 7 days
 */
export async function cleanupOldSales() {
    const database = await initDB();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORES.SALES_QUEUE], 'readwrite');
        const store = transaction.objectStore(STORES.SALES_QUEUE);
        const request = store.openCursor();
        let deleted = 0;

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.synced && cursor.value.timestamp < sevenDaysAgo) {
                    cursor.delete();
                    deleted++;
                }
                cursor.continue();
            } else {
                console.log(`[Offline] Cleaned up ${deleted} old sales`);
                resolve(deleted);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get count of pending items
 */
export async function getPendingCount() {
    const sales = await getUnsyncedSales();
    return sales.length;
}

/**
 * Check if we're online
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function setupConnectivityListeners(onOnline, onOffline) {
    window.addEventListener('online', () => {
        console.log('[Offline] Back online');
        if (onOnline) onOnline();
    });

    window.addEventListener('offline', () => {
        console.log('[Offline] Gone offline');
        if (onOffline) onOffline();
    });
}

/**
 * Sync all pending sales (call this when back online)
 */
export async function syncPendingSales(submitSaleFunction) {
    if (!isOnline()) {
        console.log('[Offline] Cannot sync - still offline');
        return { synced: 0, failed: 0 };
    }

    const pendingSales = await getUnsyncedSales();
    let synced = 0;
    let failed = 0;

    for (const sale of pendingSales) {
        try {
            await submitSaleFunction(sale);
            await markSaleSynced(sale.id);
            synced++;
        } catch (err) {
            console.error('[Offline] Failed to sync sale:', err);
            failed++;
        }
    }

    console.log(`[Offline] Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
}
