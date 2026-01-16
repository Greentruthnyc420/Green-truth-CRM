import React, { useState, useEffect } from 'react';
import { CheckCircle2, KeyRound, Loader2, ExternalLink, ChevronDown, ChevronUp, Zap, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBrandAuth } from '../../contexts/BrandAuthContext';

// Monday.com OAuth configuration
const MONDAY_CLIENT_ID = import.meta.env.VITE_MONDAY_CLIENT_ID || '';
const MONDAY_SCOPES = 'me:read boards:read boards:write';

// Boards that will be auto-created on connection
const AUTO_CREATE_BOARDS = [
    { name: 'GreenTruth Sales', description: 'Track all sales and revenue' },
    { name: 'GreenTruth Invoices', description: 'Invoice tracking and payments' },
    { name: 'Scheduled Activations', description: 'Confirmed activation events' },
    { name: 'Requested Activations', description: 'Pending activation requests' },
    { name: 'Leads & Accounts', description: 'CRM account sync' }
];

const MondayIntegrationCard = ({ getSettings, saveSettings, testConnection, entityType = 'brand', entityId = null }) => {
    const { brandUser } = useBrandAuth();
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mondayToken, setMondayToken] = useState('');
    const [invoicesBoardId, setInvoicesBoardId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Determine redirect URI based on entity type
    const getRedirectUri = () => {
        const base = window.location.origin;
        switch (entityType) {
            case 'dispensary':
                return `${base}/dispensary/integrations/monday/callback`;
            case 'admin':
                return `${base}/admin/integrations/monday/callback`;
            default:
                return `${base}/brand/integrations/monday/callback`;
        }
    };

    // Generate OAuth URL
    const getOAuthUrl = () => {
        if (!MONDAY_CLIENT_ID) {
            console.warn('VITE_MONDAY_CLIENT_ID not configured');
            return null;
        }
        const redirectUri = getRedirectUri();
        const state = btoa(JSON.stringify({ entityType, entityId: entityId || brandUser?.brandId }));
        return `https://auth.monday.com/oauth2/authorize?client_id=${MONDAY_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(MONDAY_SCOPES)}&state=${state}`;
    };

    useEffect(() => {
        setIsLoading(true);
        getSettings()
            .then((result) => {
                setSettings(result.data);
                if (result.data?.invoicesBoardId) {
                    setInvoicesBoardId(result.data.invoicesBoardId);
                }
            })
            .catch((error) => {
                console.error("Error fetching Monday settings:", error);
                toast.error("Failed to fetch integration settings.");
            })
            .finally(() => setIsLoading(false));
    }, [getSettings]);

    const handleOAuthConnect = () => {
        const oauthUrl = getOAuthUrl();
        if (!oauthUrl) {
            // Fallback to showing API key section if OAuth not configured
            toast.error('OAuth not configured. Please use the API Token method below.');
            setShowAdvanced(true);
            return;
        }
        // Redirect to Monday.com OAuth
        window.location.href = oauthUrl;
    };

    const handleSaveSettings = async () => {
        if (!invoicesBoardId) {
            toast.error("Please enter your Invoices Board ID.");
            return;
        }
        setIsSaving(true);
        try {
            await saveSettings({ invoicesBoardId: invoicesBoardId });
            toast.success("Settings saved successfully!");
            setSettings({ ...settings, invoicesBoardId: invoicesBoardId });
        } catch (error) {
            console.error("Error saving Monday settings:", error);
            toast.error(`Failed to save settings: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveMondayToken = async () => {
        if (!mondayToken) {
            toast.error("Please enter your Monday.com API Token.");
            return;
        }
        setIsSaving(true);
        try {
            await saveSettings({ mondayApiToken: mondayToken });
            const testResult = await testConnection({ apiToken: mondayToken });

            if (testResult.data.success) {
                toast.success(`Connection successful! Connected as ${testResult.data.user.name}.`);
                setSettings({ ...settings, connected: true });
                setMondayToken('');
            } else {
                throw new Error(testResult.data.error || "Connection test failed.");
            }
        } catch (error) {
            console.error("Error saving Monday token:", error);
            toast.error(`Connection failed: ${error.message}`);
            setSettings({ ...settings, connected: false });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDisconnect = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ mondayApiToken: null });
            toast.success("Successfully disconnected from Monday.com.");
            setSettings({ ...settings, connected: false, invoicesBoardId: '' });
            setInvoicesBoardId('');
        } catch (error) {
            console.error("Error disconnecting Monday.com:", error);
            toast.error("Failed to disconnect. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff3d57] to-[#ff6849] rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
                    <span className="text-2xl">📅</span>
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Monday.com Integration</h3>
                    <p className="text-sm text-slate-500">Work OS for order tracking and project management</p>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-slate-500 py-8 justify-center">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Loading connection status...</span>
                </div>
            )}

            {/* CONNECTED STATE */}
            {!isLoading && settings?.connected && (
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-green-600" />
                                <p className="font-semibold text-green-800">Connected to Monday.com</p>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                disabled={isSaving}
                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 disabled:bg-red-300 transition-colors">
                                {isSaving ? 'Disconnecting...' : 'Disconnect'}
                            </button>
                        </div>
                    </div>

                    {/* Auto-Created Boards Info */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-amber-500" />
                            Auto-Synced Dashboards
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {AUTO_CREATE_BOARDS.map((board, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 border border-slate-100 text-xs">
                                    <div className="font-semibold text-slate-700">{board.name}</div>
                                    <div className="text-slate-400">{board.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Board Configuration */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Settings2 size={16} />
                            Board Configuration
                        </h4>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={invoicesBoardId}
                                onChange={(e) => setInvoicesBoardId(e.target.value)}
                                placeholder="Invoices Board ID (optional - auto-created)"
                                className="flex-1 p-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="bg-amber-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSaving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* NOT CONNECTED STATE */}
            {!isLoading && !settings?.connected && (
                <div className="space-y-4">
                    {/* Primary OAuth Button */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200 text-center">
                        <h4 className="font-bold text-slate-800 text-lg mb-2">Connect in One Click</h4>
                        <p className="text-slate-500 text-sm mb-4">
                            Click below to securely connect your Monday.com account. We'll automatically create dashboards for you.
                        </p>
                        <button
                            onClick={handleOAuthConnect}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#ff3d57] to-[#ff6849] text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02] transition-all text-lg"
                        >
                            <span className="text-2xl">📅</span>
                            Connect with Monday.com
                            <ExternalLink size={18} />
                        </button>
                        <p className="text-xs text-slate-400 mt-3">
                            Secure OAuth connection • No password required
                        </p>
                    </div>

                    {/* Auto-Create Preview */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                            <Zap size={16} />
                            Dashboards We'll Create For You:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {AUTO_CREATE_BOARDS.map((board, idx) => (
                                <span key={idx} className="bg-white/80 text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
                                    {board.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Advanced / Manual Setup (Collapsible) */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                        >
                            <span className="font-semibold text-slate-600 flex items-center gap-2">
                                <KeyRound size={16} />
                                Advanced Setup (API Token)
                            </span>
                            {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>

                        {showAdvanced && (
                            <div className="p-4 bg-white border-t border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Instructions */}
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-2 text-sm">How to Get Your API Token:</h4>
                                        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600">
                                            <li>Log in to Monday.com</li>
                                            <li>Click your <strong>Profile Picture</strong> → <strong>Developers</strong></li>
                                            <li>Click <strong>My Access Tokens</strong></li>
                                            <li>Click <strong>Show</strong>, then <strong>Copy</strong></li>
                                        </ol>
                                        <a
                                            href="https://monday.com/developers/v2"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-amber-600 hover:underline mt-2 inline-flex items-center gap-1"
                                        >
                                            Monday.com Docs <ExternalLink size={12} />
                                        </a>
                                    </div>

                                    {/* Token Input */}
                                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-2 text-sm">Enter API Token</h4>
                                        <div className="flex items-center gap-2 mb-3">
                                            <KeyRound className="text-slate-400" size={16} />
                                            <input
                                                type="password"
                                                value={mondayToken}
                                                onChange={(e) => setMondayToken(e.target.value)}
                                                placeholder="paste-your-api-token"
                                                className="flex-1 p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveMondayToken}
                                            disabled={isSaving || !mondayToken}
                                            className="w-full bg-slate-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-800 disabled:bg-slate-400 flex items-center justify-center gap-2 text-sm transition-colors"
                                        >
                                            {isSaving ? <><Loader2 className="animate-spin" size={14} /> Connecting...</> : 'Connect with Token'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MondayIntegrationCard;

