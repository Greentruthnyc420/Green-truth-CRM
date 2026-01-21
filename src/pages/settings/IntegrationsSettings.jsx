/**
 * Integrations Settings Page
 * 
 * Allows users to connect, configure, and manage POS/ERP integrations.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import {
    Link2, Unlink, Settings, RefreshCw, CheckCircle, XCircle, Clock,
    AlertCircle, ChevronRight, Zap, Database, Shield, ExternalLink,
    Plus, Eye, EyeOff, History, Play, Pause, Trash2, Edit2, Save, X, Info
} from 'lucide-react';
import {
    INTEGRATION_PROVIDERS,
    getProvidersByCategory,
    getConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    triggerSync,
    getSyncLogs,
} from '../../services/integrations';

export default function IntegrationsSettings({ portalType = 'dispensary' }) {
    const { user } = useAuth();
    const { brandUser } = useBrandAuth();

    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [syncLogs, setSyncLogs] = useState([]);
    const [testingConnection, setTestingConnection] = useState(null);
    const [syncing, setSyncing] = useState(null);

    // Get org ID based on portal type
    const orgId = portalType === 'dispensary'
        ? user?.uid
        : brandUser?.brandId || brandUser?.id;

    const providers = getProvidersByCategory();

    useEffect(() => {
        if (orgId) {
            loadConnections();
        }
    }, [orgId, portalType]);

    async function loadConnections() {
        setLoading(true);
        try {
            const data = await getConnections(orgId, portalType);
            setConnections(data);
        } catch (error) {
            console.error('Failed to load connections:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleConnect(provider) {
        setSelectedProvider(provider);
        setShowConnectModal(true);
    }

    async function handleTest(connection) {
        setTestingConnection(connection.id);
        try {
            await testConnection(connection.id);
            await loadConnections();
        } catch (error) {
            console.error('Test failed:', error);
        } finally {
            setTestingConnection(null);
        }
    }

    async function handleSync(connection) {
        setSyncing(connection.id);
        try {
            await triggerSync(connection.id, 'full_sync');
            await loadConnections();
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSyncing(null);
        }
    }

    async function handleViewLogs(connection) {
        setSelectedConnection(connection);
        try {
            const logs = await getSyncLogs(connection.id);
            setSyncLogs(logs);
            setShowLogsModal(true);
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    }

    async function handleDisconnect(connection) {
        if (!confirm(`Are you sure you want to disconnect ${connection.display_name}?`)) return;

        try {
            await deleteConnection(connection.id);
            await loadConnections();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    }

    function getConnectionForProvider(providerId) {
        return connections.find(c => c.provider === providerId);
    }

    function getStatusBadge(status) {
        const badges = {
            active: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Connected' },
            pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
            error: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Error' },
            inactive: { color: 'bg-gray-100 text-gray-600', icon: AlertCircle, label: 'Inactive' },
            disconnected: { color: 'bg-gray-100 text-gray-500', icon: Unlink, label: 'Disconnected' },
        };
        const badge = badges[status] || badges.inactive;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon size={12} />
                {badge.label}
            </span>
        );
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Integrations
                </h1>
                <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Connect your POS, ERP, and compliance systems to sync data automatically.
                </p>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <Info className="text-blue-500 mt-0.5" size={20} />
                <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Getting Developer Access</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Most integrations require API keys from the provider. Contact each provider's support to request developer access,
                        then enter your credentials here to activate the integration.
                    </p>
                </div>
            </div>

            {/* ERP Integrations */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Database size={20} className="text-indigo-500" />
                    ERP Systems
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {providers.erp.map(provider => {
                        const connection = getConnectionForProvider(provider.id);
                        return (
                            <IntegrationCard
                                key={provider.id}
                                provider={provider}
                                connection={connection}
                                onConnect={() => handleConnect(provider)}
                                onTest={() => handleTest(connection)}
                                onSync={() => handleSync(connection)}
                                onViewLogs={() => handleViewLogs(connection)}
                                onDisconnect={() => handleDisconnect(connection)}
                                testing={testingConnection === connection?.id}
                                syncing={syncing === connection?.id}
                                getStatusBadge={getStatusBadge}
                            />
                        );
                    })}
                </div>
            </section>

            {/* POS Integrations */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Zap size={20} className="text-amber-500" />
                    POS Systems
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {providers.pos.map(provider => {
                        const connection = getConnectionForProvider(provider.id);
                        return (
                            <IntegrationCard
                                key={provider.id}
                                provider={provider}
                                connection={connection}
                                onConnect={() => handleConnect(provider)}
                                onTest={() => handleTest(connection)}
                                onSync={() => handleSync(connection)}
                                onViewLogs={() => handleViewLogs(connection)}
                                onDisconnect={() => handleDisconnect(connection)}
                                testing={testingConnection === connection?.id}
                                syncing={syncing === connection?.id}
                                getStatusBadge={getStatusBadge}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Compliance (future) */}
            <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Shield size={20} className="text-emerald-500" />
                    Compliance Systems
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {providers.compliance.map(provider => {
                        const connection = getConnectionForProvider(provider.id);
                        return (
                            <IntegrationCard
                                key={provider.id}
                                provider={provider}
                                connection={connection}
                                onConnect={() => handleConnect(provider)}
                                onTest={() => handleTest(connection)}
                                onSync={() => handleSync(connection)}
                                onViewLogs={() => handleViewLogs(connection)}
                                onDisconnect={() => handleDisconnect(connection)}
                                testing={testingConnection === connection?.id}
                                syncing={syncing === connection?.id}
                                getStatusBadge={getStatusBadge}
                            />
                        );
                    })}
                </div>
            </section>

            {/* Connect Modal */}
            {showConnectModal && selectedProvider && (
                <ConnectModal
                    provider={selectedProvider}
                    orgId={orgId}
                    orgType={portalType}
                    onClose={() => {
                        setShowConnectModal(false);
                        setSelectedProvider(null);
                    }}
                    onSuccess={() => {
                        setShowConnectModal(false);
                        setSelectedProvider(null);
                        loadConnections();
                    }}
                />
            )}

            {/* Sync Logs Modal */}
            {showLogsModal && selectedConnection && (
                <SyncLogsModal
                    connection={selectedConnection}
                    logs={syncLogs}
                    onClose={() => {
                        setShowLogsModal(false);
                        setSelectedConnection(null);
                        setSyncLogs([]);
                    }}
                />
            )}
        </div>
    );
}

// Integration Card Component
function IntegrationCard({ provider, connection, onConnect, onTest, onSync, onViewLogs, onDisconnect, testing, syncing, getStatusBadge }) {
    const isConnected = connection && connection.status !== 'disconnected';

    return (
        <div
            className="themed-card rounded-xl p-5 transition-all hover:shadow-md"
            style={{ borderLeft: `4px solid ${provider.color}` }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.logo}</span>
                    <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{provider.name}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{provider.category.toUpperCase()}</p>
                    </div>
                </div>
                {connection && getStatusBadge(connection.status)}
            </div>

            {/* Description */}
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
                {provider.description}
            </p>

            {/* Features */}
            <div className="flex flex-wrap gap-1 mb-4">
                {provider.features.map((feature, i) => (
                    <span
                        key={i}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: `${provider.color}20`, color: provider.color }}
                    >
                        {feature}
                    </span>
                ))}
            </div>

            {/* Last Sync */}
            {isConnected && connection.last_sync_at && (
                <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>
                    Last synced: {new Date(connection.last_sync_at).toLocaleString()}
                </p>
            )}

            {/* Error Message */}
            {connection?.last_error && (
                <p className="text-xs text-red-500 mb-3 truncate" title={connection.last_error}>
                    ⚠️ {connection.last_error}
                </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {!isConnected ? (
                    <>
                        <button
                            onClick={onConnect}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            style={{ background: provider.color, color: 'white' }}
                        >
                            <Plus size={14} />
                            Connect
                        </button>
                        <a
                            href={provider.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        >
                            <ExternalLink size={14} />
                            Docs
                        </a>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onSync}
                            disabled={syncing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            style={{ background: provider.color, color: 'white' }}
                        >
                            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                            onClick={onTest}
                            disabled={testing}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                            <Zap size={14} className={testing ? 'animate-pulse' : ''} />
                            Test
                        </button>
                        <button
                            onClick={onViewLogs}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        >
                            <History size={14} />
                            Logs
                        </button>
                        <button
                            onClick={onDisconnect}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-red-500 hover:bg-red-50"
                            style={{ background: 'var(--bg-secondary)' }}
                        >
                            <Unlink size={14} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// Connect Modal Component
function ConnectModal({ provider, orgId, orgType, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        displayName: provider.name,
        apiKey: '',
        apiSecret: '',
        accessToken: '',
        settings: {},
    });
    const [showSecrets, setShowSecrets] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            await createConnection({
                orgId,
                orgType,
                provider: provider.id,
                displayName: formData.displayName,
                apiKey: formData.apiKey,
                apiSecret: formData.apiSecret,
                accessToken: formData.accessToken,
                settings: formData.settings,
            });
            onSuccess();
        } catch (err) {
            setError(err.message || 'Failed to create connection');
        } finally {
            setSaving(false);
        }
    }

    const toggleSecret = (field) => {
        setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="themed-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{provider.logo}</span>
                        <div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Connect {provider.name}
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Enter your API credentials
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg"
                            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    {/* API Key */}
                    {provider.requiredFields.includes('api_key') && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                API Key <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showSecrets.apiKey ? 'text' : 'password'}
                                    value={formData.apiKey}
                                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 pr-10 rounded-lg"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="Enter your API key"
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleSecret('apiKey')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    {showSecrets.apiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* API Secret */}
                    {(provider.requiredFields.includes('api_secret') || provider.optionalFields.includes('api_secret')) && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                                API Secret {provider.requiredFields.includes('api_secret') && <span className="text-red-500">*</span>}
                            </label>
                            <div className="relative">
                                <input
                                    type={showSecrets.apiSecret ? 'text' : 'password'}
                                    value={formData.apiSecret}
                                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                                    required={provider.requiredFields.includes('api_secret')}
                                    className="w-full px-4 py-2 pr-10 rounded-lg"
                                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                    placeholder="Enter your API secret"
                                />
                                <button
                                    type="button"
                                    onClick={() => toggleSecret('apiSecret')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    {showSecrets.apiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* OAuth (for Treez) */}
                    {provider.authType === 'oauth2' && (
                        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                This integration uses OAuth2. Click the button below to authorize with {provider.name}.
                            </p>
                            <button
                                type="button"
                                className="mt-3 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: provider.color, color: 'white' }}
                            >
                                Authorize with {provider.name}
                            </button>
                        </div>
                    )}

                    {/* Docs Link */}
                    <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg-secondary)' }}>
                        <Info size={16} className="text-blue-500" />
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Need help? <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View {provider.name} API docs</a>
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                            style={{ background: provider.color }}
                        >
                            {saving ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Sync Logs Modal
function SyncLogsModal({ connection, logs, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="themed-card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Sync History - {connection.display_name}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <X size={20} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Logs Table */}
                <div className="overflow-y-auto max-h-96">
                    {logs.length === 0 ? (
                        <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                            No sync history yet
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <th className="text-left py-2 px-2" style={{ color: 'var(--text-secondary)' }}>Time</th>
                                    <th className="text-left py-2 px-2" style={{ color: 'var(--text-secondary)' }}>Type</th>
                                    <th className="text-left py-2 px-2" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                    <th className="text-right py-2 px-2" style={{ color: 'var(--text-secondary)' }}>Records</th>
                                    <th className="text-left py-2 px-2" style={{ color: 'var(--text-secondary)' }}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td className="py-2 px-2" style={{ color: 'var(--text-primary)' }}>
                                            {new Date(log.started_at).toLocaleString()}
                                        </td>
                                        <td className="py-2 px-2 capitalize" style={{ color: 'var(--text-primary)' }}>
                                            {log.sync_type?.replace('_', ' ')}
                                        </td>
                                        <td className="py-2 px-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${log.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                    log.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        log.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="py-2 px-2 text-right" style={{ color: 'var(--text-primary)' }}>
                                            {log.records_processed || 0}
                                        </td>
                                        <td className="py-2 px-2" style={{ color: 'var(--text-secondary)' }}>
                                            {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium"
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
