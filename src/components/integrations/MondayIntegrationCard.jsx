import React, { useState, useEffect } from 'react';
import { CheckCircle2, KeyRound, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const MondayIntegrationCard = ({ getSettings, saveSettings, testConnection }) => {
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mondayToken, setMondayToken] = useState('');
    const [invoicesBoardId, setInvoicesBoardId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
            // Set token to null to disconnect
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
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">📅</span>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Monday.com Integration</h3>
                    <p className="text-sm text-slate-600">Work OS for order tracking and project management</p>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Loading connection status...</span>
                </div>
            )}

            {!isLoading && settings?.connected && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-green-600" />
                            <p className="font-semibold text-green-800">Your account is connected to Monday.com</p>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            disabled={isSaving}
                            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-600 disabled:bg-red-300">
                                {isSaving ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                    </div>
                    <div className="mt-4">
                        <h4 className="font-bold text-slate-800 mb-2">Invoices Board ID</h4>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={invoicesBoardId}
                                onChange={(e) => setInvoicesBoardId(e.target.value)}
                                placeholder="Enter your Invoices Board ID"
                                className="flex-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                            />
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="bg-amber-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 flex items-center justify-center gap-2"
                            >
                                {isSaving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isLoading && !settings?.connected && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {/* Instructions */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2">How to Connect Your Monday.com Account:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                            <li>Log in to Monday.com.</li>
                            <li>Click your <strong>Profile Picture</strong> (bottom left) and select <strong>Developers</strong>.</li>
                            <li>In the new tab, click <strong>My Access Tokens</strong> on the left menu.</li>
                            <li>Click <strong>Show</strong>, then <strong>Copy</strong> your Personal API Token.</li>
                            <li>Paste that token into the field below and click <strong>"Save Connection"</strong>.</li>
                        </ol>
                        <a href="https://monday.com/developers/v2/guides/authentication/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 hover:underline mt-3 inline-flex items-center gap-1">
                            Read Monday.com Docs <ExternalLink size={14} />
                        </a>
                    </div>
                    {/* Connection Form */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-3">Enter API Token</h4>
                         <div className="flex items-center gap-2">
                            <KeyRound className="text-slate-400" size={18} />
                            <input
                                type="password"
                                value={mondayToken}
                                onChange={(e) => setMondayToken(e.target.value)}
                                placeholder="paste-your-api-token-here"
                                className="flex-1 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <button
                            onClick={handleSaveMondayToken}
                            disabled={isSaving}
                            className="w-full mt-3 bg-amber-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-amber-700 disabled:bg-amber-400 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : 'Save Connection'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MondayIntegrationCard;
