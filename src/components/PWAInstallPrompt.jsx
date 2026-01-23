import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

/**
 * PWA Install Prompt Component
 * Shows a banner prompting users to install the app
 */
export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Check if already dismissed recently
        const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
        if (dismissedTime) {
            const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
            if (hoursSinceDismissed < 24) {
                setDismissed(true);
                return;
            }
        }

        // Listen for the beforeinstallprompt event
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowPrompt(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted install prompt');
        }

        setInstallPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
        setDismissed(true);
        setShowPrompt(false);
    };

    // Check iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const showIOSPrompt = isIOS && !isStandalone && !dismissed;

    if (!showPrompt && !showIOSPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 z-50 animate-slideUp">
            <div className="bg-gradient-to-r from-brand-600 to-emerald-600 rounded-2xl shadow-xl p-4 text-white">
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <Smartphone size={28} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">Install GreenTruth</h3>
                        <p className="text-white/80 text-sm mt-1">
                            {isIOS
                                ? 'Tap the share button, then "Add to Home Screen"'
                                : 'Get quick access from your home screen'
                            }
                        </p>

                        {!isIOS && installPrompt && (
                            <button
                                onClick={handleInstall}
                                className="mt-3 flex items-center gap-2 bg-white text-brand-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
                            >
                                <Download size={18} />
                                Install App
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
