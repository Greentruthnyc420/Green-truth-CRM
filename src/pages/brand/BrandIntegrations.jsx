/**
 * Brand Integrations Page
 * 
 * Allows brand partners to configure their Monday.com integration.
 * Features:
 * - API token input with secure storage
 * - Connection testing
 * - Board ID configuration for leads, orders, invoices
 * - Sync status indicator
 * 
 * SECURITY: API tokens are sent directly to Cloud Functions and stored
 * encrypted in Firestore. They are NEVER stored in localStorage or sessionStorage.
 */

import React, { useState, useEffect } from 'react';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    Settings, Link2, Check, X, Loader, Eye, EyeOff,
    ArrowLeft, Save, RefreshCw, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    testMondayConnection,
    saveMondaySettings,
    getMondayIntegrationStatus
} from '../../services/mondayService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function BrandIntegrations() {
    const { brandUser } = useBrandAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showToken, setShowToken] = useState(false);

    // Form State
    const [apiToken, setApiToken] = useState('');
    const [leadsBoardId, setLeadsBoardId] = useState('');
    const [ordersBoardId, setOrdersBoardId] = useState('');
    const [invoicesBoardId, setInvoicesBoardId] = useState('');
    const [autoSyncLeads, setAutoSyncLeads] = useState(true);
    const [autoSyncOrders, setAutoSyncOrders] = useState(true);

    // Status State
    const [connectionStatus, setConnectionStatus] = useState(null); // null, 'success', 'error'
    const [connectedUser, setConnectedUser] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [webhookEvents, setWebhookEvents] = useState([]);

    // Load existing settings
    useEffect(() => {
        async function loadSettings() {
            if (!brandUser?.brandId) return;

            try {
                const docRef = doc(db, 'brand_integrations', brandUser.brandId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Don't load the actual token - just show it's configured
                    if (data.mondayApiToken) {
                        setApiToken('••••••••••••••••••••'); // Masked
                        setConnectionStatus('success');
                    }
                    setLeadsBoardId(data.leadsBoardId || '');
                    setOrdersBoardId(data.ordersBoardId || '');
                    setInvoicesBoardId(data.invoicesBoardId || '');
                    setAutoSyncLeads(data.autoSyncLeads !== false);
                    setAutoSyncOrders(data.autoSyncOrders !== false);
                    setLastSaved(data.updatedAt?.toDate?.() || null);
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, [brandUser]);

    useEffect(() => {
        async function fetchWebhookEvents() {
            if (!brandUser?.brandId) return;
            const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
            const q = query(
                collection(db, 'brand_sync_logs'),
                where('brandId', '==', brandUser.brandId),
                orderBy('receivedAt', 'desc'),
                limit(5)
            );
            const querySnapshot = await getDocs(q);
            const events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWebhookEvents(events);
        }
        fetchWebhookEvents();
    }, [brandUser]);

    const handleTestConnection = async () => {
        if (!apiToken || apiToken.startsWith('••')) {
            setError('Please enter a valid API token to test');
            return;
        }

        setTesting(true);
        setError('');
        setConnectionStatus(null);

        const result = await testMondayConnection(apiToken);

        if (result.success) {
            setConnectionStatus('success');
            setConnectedUser(result.user);
            setSuccess(`Connected as ${result.user?.name || 'Unknown User'}`);
        } else {
            setConnectionStatus('error');
            setError(result.error || 'Connection failed');
        }

        setTesting(false);
    };

    const handleSave = async () => {
        if (!brandUser?.brandId) return;

        // Validate token if it's new (not masked)
        if (apiToken && !apiToken.startsWith('••') && connectionStatus !== 'success') {
            setError('Please test your connection before saving');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        const settings = {
            leadsBoardId,
            ordersBoardId,
            invoicesBoardId,
            autoSyncLeads,
            autoSyncOrders,
        };

        // Only include token if it's new (not masked)
        if (apiToken && !apiToken.startsWith('••')) {
            settings.mondayApiToken = apiToken;
        }

        const result = await saveMondaySettings(brandUser.brandId, settings);

        if (result.success) {
            setSuccess('Settings saved successfully!');
            setLastSaved(new Date());
        } else {
            setError(result.error || 'Failed to save settings');
        }

        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-emerald-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link to="/brand" className="text-slate-500 hover:text-slate-700 flex items-center gap-2 mb-4 text-sm font-medium">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Settings className="text-emerald-500" />
                    Integrations
                </h1>
                <p className="text-slate-500 mt-1">Connect your Monday.com workspace to sync leads and orders automatically.</p>
            </div>

            {/* Monday.com Integration Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                                <img
                                    src="https://dapulse-res.cloudinary.com/image/upload/f_auto,q_auto/remote_mondaycom_static/img/monday-logo-x2.png"
                                    alt="Monday.com"
                                    className="w-8 h-8 object-contain"
                                />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Monday.com</h2>
                                <p className="text-slate-400 text-sm">Sync leads, orders, and invoices</p>
                            </div>
                        </div>
                        {connectionStatus === 'success' && (
                            <span className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold">
                                <Check size={14} /> Connected
                            </span>
                        )}
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Status Messages */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
                            <AlertTriangle size={20} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-emerald-700">
                            <Check size={20} />
                            <span className="text-sm font-medium">{success}</span>
                        </div>
                    )}

                    {/* API Token */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            API Token
                            <a
                                href="https://developer.monday.com/api-reference/docs/authentication"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-emerald-600 font-normal hover:underline inline-flex items-center gap-1"
                            >
                                How to get this <ExternalLink size={12} />
                            </a>
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    type={showToken ? 'text' : 'password'}
                                    value={apiToken}
                                    onChange={(e) => {
                                        setApiToken(e.target.value);
                                        setConnectionStatus(null);
                                    }}
                                    placeholder="Enter your Monday.com API token"
                                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button
                                onClick={handleTestConnection}
                                disabled={testing || !apiToken || apiToken.startsWith('••')}
                                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {testing ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : connectionStatus === 'success' ? (
                                    <Check size={18} className="text-emerald-500" />
                                ) : connectionStatus === 'error' ? (
                                    <X size={18} className="text-red-500" />
                                ) : (
                                    <Link2 size={18} />
                                )}
                                Test
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                            Your token is stored securely and never exposed in the browser.
                        </p>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Board IDs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Leads Board ID</label>
                            <input
                                type="text"
                                value={leadsBoardId}
                                onChange={(e) => setLeadsBoardId(e.target.value)}
                                placeholder="e.g., 1234567890"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Orders Board ID</label>
                            <input
                                type="text"
                                value={ordersBoardId}
                                onChange={(e) => setOrdersBoardId(e.target.value)}
                                placeholder="e.g., 1234567890"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Invoices Board ID</label>
                            <input
                                type="text"
                                value={invoicesBoardId}
                                onChange={(e) => setInvoicesBoardId(e.target.value)}
                                placeholder="e.g., 1234567890"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Auto-sync toggles */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-700">Automatic Sync</h3>
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <div>
                                <p className="font-bold text-slate-700">Auto-sync new leads</p>
                                <p className="text-sm text-slate-500">Automatically push new leads to Monday.com</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoSyncLeads}
                                onChange={(e) => setAutoSyncLeads(e.target.checked)}
                                className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                            />
                        </label>
                        <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <div>
                                <p className="font-bold text-slate-700">Auto-sync orders</p>
                                <p className="text-sm text-slate-500">Automatically push new orders to Monday.com</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoSyncOrders}
                                onChange={(e) => setAutoSyncOrders(e.target.checked)}
                                className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
                            />
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        {lastSaved && (
                            <span>Last saved: {lastSaved.toLocaleString()}</span>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <Loader size={18} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        Save Settings
                    </button>
                </div>
            </div>

            {/* Help Card */}
            <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2">📘 How to find your Board IDs</h3>
                <ol className="text-sm text-blue-700 space-y-2">
                    <li>1. Open your Monday.com board</li>
                    <li>2. Look at the URL: <code className="bg-blue-100 px-1 rounded">monday.com/boards/<strong>1234567890</strong></code></li>
                    <li>3. The number after "/boards/" is your Board ID</li>
                </ol>
            </div>

            {/* Webhook URL Section */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-3">Webhook Configuration</h2>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <p className="text-sm text-slate-600 mb-4">
                        To enable real-time updates from Monday.com (e.g., status changes), add the following webhook URL to your board's integration settings.
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            readOnly
                            value={`${import.meta.env.VITE_WEBHOOK_URL}?brandId=${brandUser?.brandId}`}
                            className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${import.meta.env.VITE_WEBHOOK_URL}?brandId=${brandUser?.brandId}`);
                                setSuccess('Webhook URL copied to clipboard!');
                            }}
                            className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-bold text-gray-800 mb-2">Setup Instructions:</h4>
                        <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                            <li>In your Monday.com board, click on "Integrate".</li>
                            <li>Search for and select the "Webhooks" integration.</li>
                            <li>Choose the trigger, e.g., "When a status changes to something".</li>
                            <li>Paste the copied URL into the webhook URL field.</li>
                            <li>Monday.com will send a challenge to the URL; our server handles it automatically.</li>
                            <li>Your integration is now active!</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Webhook Event Log */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-slate-800 mb-3">Recent Webhook Events</h2>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    {webhookEvents.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center">No recent webhook events found.</p>
                    ) : (
                        <ul className="space-y-3">
                            {webhookEvents.map(event => (
                                <li key={event.id} className="p-3 bg-gray-50 rounded-lg text-xs">
                                    <pre className="whitespace-pre-wrap"><code>{JSON.stringify(event, null, 2)}</code></pre>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
