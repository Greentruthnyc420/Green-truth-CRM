import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Check } from 'lucide-react';
import { isOnline, getPendingCount, syncPendingSales, setupConnectivityListeners } from '../services/offlineQueueService';

/**
 * Offline indicator banner - shows when offline and pending items to sync
 */
export default function OfflineIndicator({ onSync }) {
    const [online, setOnline] = useState(isOnline());
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [justSynced, setJustSynced] = useState(false);

    useEffect(() => {
        // Check pending count
        const checkPending = async () => {
            const count = await getPendingCount();
            setPendingCount(count);
        };
        checkPending();

        // Set up connectivity listeners
        setupConnectivityListeners(
            async () => {
                setOnline(true);
                // Auto-sync when back online
                if (onSync) {
                    setSyncing(true);
                    const result = await onSync();
                    setSyncing(false);
                    if (result?.synced > 0) {
                        setJustSynced(true);
                        setTimeout(() => setJustSynced(false), 3000);
                    }
                    checkPending();
                }
            },
            () => setOnline(false)
        );

        // Check pending count periodically
        const interval = setInterval(checkPending, 10000);
        return () => clearInterval(interval);
    }, [onSync]);

    // Don't show anything if online and no pending items
    if (online && pendingCount === 0 && !justSynced) return null;

    return (
        <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 rounded-xl shadow-lg p-4 transition-all ${!online ? 'bg-amber-500' : justSynced ? 'bg-emerald-500' : 'bg-slate-800'
            }`}>
            <div className="flex items-center gap-3">
                {!online ? (
                    <>
                        <WifiOff className="text-white" size={20} />
                        <div className="flex-1">
                            <p className="text-white font-medium">You're offline</p>
                            <p className="text-amber-100 text-sm">
                                {pendingCount > 0
                                    ? `${pendingCount} item${pendingCount > 1 ? 's' : ''} will sync when back online`
                                    : 'Changes will sync when connected'
                                }
                            </p>
                        </div>
                    </>
                ) : justSynced ? (
                    <>
                        <Check className="text-white" size={20} />
                        <div className="flex-1">
                            <p className="text-white font-medium">Synced successfully!</p>
                        </div>
                    </>
                ) : (
                    <>
                        {syncing ? (
                            <RefreshCw className="text-emerald-400 animate-spin" size={20} />
                        ) : (
                            <Wifi className="text-emerald-400" size={20} />
                        )}
                        <div className="flex-1">
                            <p className="text-white font-medium">
                                {syncing ? 'Syncing...' : `${pendingCount} pending`}
                            </p>
                        </div>
                        {!syncing && pendingCount > 0 && (
                            <button
                                onClick={async () => {
                                    if (onSync) {
                                        setSyncing(true);
                                        await onSync();
                                        setSyncing(false);
                                        const count = await getPendingCount();
                                        setPendingCount(count);
                                    }
                                }}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg font-medium"
                            >
                                Sync Now
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
