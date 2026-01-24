import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader, Building2, MapPin, ArrowLeft, UserCheck } from 'lucide-react';
import { verifyLicense } from '../../services/firestoreService';
import { useNotification } from '../../contexts/NotificationContext';

export default function DispensaryVerification() {
    const [license, setLicense] = useState('');
    const [dispensaryName, setDispensaryName] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [referralRep, setReferralRep] = useState(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // Capture referral code from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            sessionStorage.setItem('dispensary_referral_rep', ref);
            setReferralRep(ref);
            showNotification('You were referred by one of our sales representatives!', 'success');
        } else {
            // Check if already stored from previous visit
            const storedRef = sessionStorage.getItem('dispensary_referral_rep');
            if (storedRef) setReferralRep(storedRef);
        }
    }, []);

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!dispensaryName.trim()) {
            showNotification('Please enter your dispensary name', 'error');
            return;
        }

        if (!address.trim()) {
            showNotification('Please enter your dispensary address', 'error');
            return;
        }

        setLoading(true);
        try {
            const referralRepId = sessionStorage.getItem('dispensary_referral_rep');

            // If license is provided, try to verify it
            if (license.trim()) {
                const verified = await verifyLicense(license.trim().toUpperCase());
                if (verified) {
                    showNotification(`License verified for ${verified.data.dispensaryName || verified.data.name}!`, 'success');
                    sessionStorage.setItem('verified_license', JSON.stringify({
                        ...verified.data,
                        userEnteredName: dispensaryName,
                        userEnteredAddress: address,
                        referralRepId: referralRepId || null
                    }));
                } else {
                    // License provided but not found - still allow registration with unverified flag
                    showNotification('License not found in our records, but you can still register. We\'ll verify it later.', 'info');
                    sessionStorage.setItem('verified_license', JSON.stringify({
                        id: null,
                        dispensaryName: dispensaryName,
                        name: dispensaryName,
                        licenseNumber: license.trim().toUpperCase(),
                        licenseVerified: false,
                        licensePending: false,
                        userEnteredName: dispensaryName,
                        userEnteredAddress: address,
                        referralRepId: referralRepId || null
                    }));
                }
            } else {
                // No license provided - allow registration with pending status
                showNotification('No license provided. You can add it later in settings.', 'info');
                sessionStorage.setItem('verified_license', JSON.stringify({
                    id: null,
                    dispensaryName: dispensaryName,
                    name: dispensaryName,
                    licenseNumber: null,
                    licenseVerified: false,
                    licensePending: true,
                    userEnteredName: dispensaryName,
                    userEnteredAddress: address,
                    referralRepId: referralRepId || null
                }));
            }

            navigate('/dispensary/register');
        } catch (error) {
            showNotification('An error occurred. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full">
                {/* Referral Banner */}
                {referralRep && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <p className="font-bold text-emerald-800 text-sm">Referred by Sales Rep</p>
                            <p className="text-emerald-600 text-xs">Your account will be linked to your rep for priority support</p>
                        </div>
                    </div>
                )}

                {/* Back to Gateway Button */}
                <button
                    onClick={() => navigate('/gateway')}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors mb-6"
                >
                    <ArrowLeft size={18} /> Back to Gateway
                </button>

                <div className="text-center mb-10">
                    {/* Logo - Large, width-based, with transform to visually center */}
                    <div className="w-full flex items-center justify-center mb-6">
                        <img
                            src="/logos/green-truth-logo-dark.png"
                            alt="GreenTruth NYC"
                            className="w-full max-w-md object-contain filter drop-shadow-lg"
                            style={{ transform: 'translateX(-8px)' }}
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dispensary Portal</h1>
                    <p className="mt-3 text-slate-500 font-medium">Register your dispensary to get started</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Dispensary Name</label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    placeholder="Your Dispensary Name"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm"
                                    value={dispensaryName}
                                    onChange={(e) => setDispensaryName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Dispensary Address</label>
                            <div className="relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    required
                                    placeholder="123 Main St, New York, NY 10001"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                                License Number <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="OCM, CAURD, Provisional, or Retail License"
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono text-sm uppercase"
                                    value={license}
                                    onChange={(e) => setLicense(e.target.value)}
                                />
                            </div>
                            <p className="mt-3 text-xs text-slate-400 leading-relaxed ml-1">
                                We accept OCM, CAURD, Provisional, Medical, or any NY cannabis retail license.
                                <br />Don't have one yet? No problem - you can add it later.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !dispensaryName || !address}
                            className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? <Loader className="animate-spin" /> : <>{license ? 'Verify & Continue' : 'Continue Without License'} <ArrowRight size={20} /></>}
                        </button>
                    </form>

                    {/* Developer Bypass Button (Local Dev Only) */}
                    {(import.meta.env.DEV || window.location.hostname === 'localhost') && (
                        <button
                            type="button"
                            onClick={() => {
                                showNotification('Developer access - bypassing verification', 'success');
                                navigate('/dispensary');
                            }}
                            className="w-full mt-4 py-3 bg-purple-600/10 border border-purple-500/30 text-purple-700 font-bold rounded-2xl hover:bg-purple-600/20 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <span>🚀</span> Developer Bypass (Skip to Dashboard)
                        </button>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm text-slate-500">
                        Already have an account?{' '}
                        <button onClick={() => navigate('/dispensary/login')} className="text-emerald-600 font-bold hover:underline">
                            Login here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
