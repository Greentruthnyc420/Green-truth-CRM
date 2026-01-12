import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { useNotification } from '../../contexts/NotificationContext';
// import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function MondayCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { brandUser } = useBrandAuth();
    const { showNotification } = useNotification();
    const [status, setStatus] = useState('processing');
    const functions = getFunctions();

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');

            if (!code) {
                showNotification('No authorization code found', 'error');
                setStatus('error');
                return;
            }

            if (!brandUser?.brandId) {
                return;
            }

            try {
                const exchangeMondayToken = httpsCallable(functions, 'exchangeMondayToken');
                await exchangeMondayToken({
                    code,
                    redirectUri: window.location.origin + '/brand/integrations/monday/callback',
                    brandId: brandUser.brandId
                });

                showNotification('Monday.com successfully connected!', 'success');
                navigate('/brand/integrations');
            } catch (error) {
                console.error('OAuth Callback Error:', error);

                let msg = error.message;
                if (msg.includes('redirect_uri_mismatch')) {
                    msg = 'Redirect URI mismatch. Please ensure your Monday App settings match: ' + window.location.origin + '/brand/integrations/monday/callback';
                }

                showNotification(`Connection failed: ${msg}`, 'error');
                setStatus('error');
            }
        };

        handleCallback(); // Run once
    }, [searchParams, brandUser, navigate, functions]);

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-red-500 font-medium">Connection Failed</p>
                <button onClick={() => navigate('/brand/integrations')} className="mt-4 text-brand-600 underline">
                    Return to Integrations
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-slate-700">Connecting to Monday.com...</h2>
            <p className="text-slate-500 text-sm">Please wait while we secure your implementation.</p>
        </div>
    );
}
