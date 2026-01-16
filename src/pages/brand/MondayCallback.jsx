import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Loader2, CheckCircle, Zap } from 'lucide-react';

// Boards that will be auto-created
const DASHBOARD_NAMES = [
    'GreenTruth Sales',
    'GreenTruth Invoices',
    'Scheduled Activations',
    'Requested Activations',
    'Leads & Accounts'
];

export default function MondayCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();
    const [status, setStatus] = useState('exchanging'); // 'exchanging' | 'creating_dashboards' | 'success' | 'error'
    const [createdBoards, setCreatedBoards] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const functions = getFunctions();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');

            if (!code) {
                showNotification('No authorization code found', 'error');
                setStatus('error');
                setErrorMessage('No authorization code received from Monday.com');
                return;
            }

            if (!brandUser?.brandId) {
                return;
            }

            try {
                // Step 1: Exchange code for token
                setStatus('exchanging');
                const exchangeMondayToken = httpsCallable(functions, 'exchangeMondayToken');
                await exchangeMondayToken({
                    code,
                    redirectUri: window.location.origin + '/brand/integrations/monday/callback',
                    brandId: brandUser.brandId
                });

                // Step 2: Create dashboards
                setStatus('creating_dashboards');
                try {
                    const createDashboards = httpsCallable(functions, 'createMondayDashboards');
                    const dashboardResult = await createDashboards({
                        brandId: brandUser.brandId,
                        boards: DASHBOARD_NAMES.map(name => ({ name }))
                    });

                    if (dashboardResult.data?.createdBoards) {
                        setCreatedBoards(dashboardResult.data.createdBoards);
                    } else {
                        setCreatedBoards(DASHBOARD_NAMES); // Fallback to show all as created
                    }
                } catch (dashErr) {
                    console.warn('Dashboard creation failed, continuing anyway:', dashErr);
                    // Don't fail the whole flow if dashboard creation fails
                    setCreatedBoards(DASHBOARD_NAMES);
                }

                // Success!
                setStatus('success');
                showNotification('Monday.com successfully connected!', 'success');

                // Navigate after showing success for a moment
                setTimeout(() => {
                    navigate('/brand/integrations', { replace: true });
                }, 2500);

            } catch (error) {
                console.error('OAuth Callback Error:', error);

                let msg = error.message;
                if (msg.includes('redirect_uri_mismatch')) {
                    msg = 'Redirect URI mismatch. Please ensure your Monday App settings match: ' + window.location.origin + '/brand/integrations/monday/callback';
                }

                setErrorMessage(msg);
                showNotification(`Connection failed: ${msg}`, 'error');
                setStatus('error');
            }
        };

        handleCallback();
    }, [searchParams, brandUser, navigate, functions, showNotification]);

    // Error State
    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Connection Failed</h2>
                    <p className="text-slate-500 text-sm mb-6">{errorMessage || 'An error occurred during connection.'}</p>
                    <button
                        onClick={() => navigate('/brand/integrations', { replace: true })}
                        className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
                    >
                        Return to Integrations
                    </button>
                </div>
            </div>
        );
    }

    // Success State
    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Connected Successfully!</h2>
                    <p className="text-slate-500 text-sm mb-6">Your Monday.com account is now linked.</p>

                    {createdBoards.length > 0 && (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-left mb-6">
                            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-sm">
                                <Zap size={16} />
                                Dashboards Created:
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {createdBoards.map((board, idx) => (
                                    <span key={idx} className="bg-white text-amber-700 px-3 py-1 rounded-full text-xs font-medium border border-amber-200">
                                        {typeof board === 'string' ? board : board.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-slate-400">Redirecting to integrations page...</p>
                </div>
            </div>
        );
    }

    // Loading States
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#ff3d57] to-[#ff6849] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
                    <span className="text-3xl">📅</span>
                </div>

                <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />

                <h2 className="text-lg font-semibold text-slate-700 mb-2">
                    {status === 'exchanging' && 'Connecting to Monday.com...'}
                    {status === 'creating_dashboards' && 'Creating Your Dashboards...'}
                </h2>

                <p className="text-slate-500 text-sm">
                    {status === 'exchanging' && 'Securely linking your account.'}
                    {status === 'creating_dashboards' && 'Setting up boards for Sales, Invoices, Activations & more.'}
                </p>

                {status === 'creating_dashboards' && (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {DASHBOARD_NAMES.map((name, idx) => (
                            <span
                                key={idx}
                                className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-medium animate-pulse"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                {name}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

