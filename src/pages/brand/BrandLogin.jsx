import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useBrandAuth, AVAILABLE_BRANDS } from '../../contexts/BrandAuthContext';
import { Mail, Lock, Loader, ArrowRight, Eye, EyeOff, ArrowLeft, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
// BrandLoginGate removed

// Map brand IDs to absolute logo paths (matching Gateway)
const BRAND_LOGOS = {
    'honey-king': '/logos/partner-5.png',
    'bud-cracker': '/logos/partner-4.png',
    'canna-dots': '/logos/partner-3.jpg',
    'space-poppers': '/logos/partner-2.png',
    'smoothie-bar': '/logos/smoothie-bar.png',
    'waferz': '/logos/waferz.png',
    'pines': '/logos/pines.png',
    'flx-extracts': '/logos/flx-extracts.png',
    'budcracker-nyc': '/logos/partner-7.png'
};

export default function BrandLogin() {
    const { loginBrand, signupBrand, loginWithGoogle, resetPassword, devBrandLogin, brandUser } = useBrandAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/brand';

    // Redirect if already logged in
    React.useEffect(() => {
        if (brandUser) {
            navigate(from, { replace: true });
        }
    }, [brandUser, navigate, from]);

    const [step, setStep] = useState('selection'); // 'selection' | 'auth'
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'reset'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Store the full license info object here
    const [selectedBrand, setSelectedBrand] = useState(null);

    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState('brand'); // 'brand' | 'processor'

    // Convert AVAILABLE_BRANDS object to array for brand selection
    const brandList = Object.entries(AVAILABLE_BRANDS).map(([brandId, info]) => ({
        brandId,
        ...info
    }));

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);
        setAccessCode(''); // Reset code
        setStep('gate'); // Move to Gate step
        setError('');
        setSuccessMessage('');
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        // Use the selected brand's license
        const licenseNumber = selectedBrand.license;

        try {
            if (authMode === 'signup') {
                await signupBrand(email, password, licenseNumber, accountType);
                navigate(from, { replace: true });
            } else if (authMode === 'reset') {
                const result = await resetPassword(email);
                setSuccessMessage(result.message);
                setTimeout(() => setAuthMode('login'), 3000);
            } else {
                await loginBrand(email, password, licenseNumber);
                navigate(from, { replace: true });
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Brand Code Mapping (2-9)
    const BRAND_CODE_MAP = {
        '2': 'honey-king',
        '3': 'bud-cracker',
        '4': 'space-poppers',
        '5': 'canna-dots',
        '6': 'smoothie-bar',
        '7': 'waferz',
        '8': 'pines',
        '9': 'flx-extracts', // Processor
    };

    const handleDevLogin = async (brandIdOverride = null) => {
        setLoading(true);
        try {
            const bId = brandIdOverride || selectedBrand?.brandId || 'honey-king';
            await devBrandLogin(bId);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Dev Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle(selectedBrand.license);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Google Login failed.');
        } finally {
            setLoading(false);
        }
    };

    // --- SECRET CODE GATE LOGIC ---
    const [accessCode, setAccessCode] = useState('');
    const [gateError, setGateError] = useState('');

    const handleVerification = (e) => {
        e.preventDefault();
        const code = accessCode.trim();
        const brandId = BRAND_CODE_MAP[code];

        if (brandId) {
            // Verify code matches selected brand
            if (brandId === selectedBrand?.brandId) {
                // Success! Unlock
                setStep('auth'); // Move to Auth step (Step 3)

                // Save to session as requested
                try {
                    sessionStorage.setItem('selectedBrand', JSON.stringify(selectedBrand));
                } catch (err) { console.error(err); }
            } else {
                setGateError('Incorrect access code for this brand.');
                setTimeout(() => setGateError(''), 2000);
            }
        } else {
            setGateError('Invalid Access Code');
            setTimeout(() => setGateError(''), 2000);
        }
    };


    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-amber-500/30 font-sans">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-black z-0" />
                <motion.div
                    className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px]"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                />
            </div>

            <div className={`relative z-10 w-full transition-all duration-500 ${step === 'selection' ? 'max-w-6xl' : 'max-w-md'}`}>

                {/* --- SELECTION STEP --- */}
                {step === 'selection' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                    >
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                                Welcome, Partner
                            </h1>
                            <p className="text-xl text-slate-400">Select your brand to access your dashboard</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {brandList.map((brand, index) => (
                                <motion.button
                                    key={brand.brandId}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleBrandSelect(brand)}
                                    className="group relative bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-6 hover:bg-slate-800/80 hover:border-amber-500/50 transition-all duration-300 h-64 shadow-2xl hover:shadow-amber-900/20"
                                >
                                    <div className="h-32 w-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <img
                                            src={BRAND_LOGOS[brand.brandId] || partner6}
                                            alt={brand.brandName}
                                            className="h-full w-full object-contain filter drop-shadow-lg"
                                        />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white font-bold text-lg group-hover:text-amber-400 transition-colors">{brand.brandName}</h3>
                                        <div className="h-0.5 w-0 bg-amber-500 mx-auto mt-2 transition-all duration-300 group-hover:w-16"></div>
                                    </div>

                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-500/20 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                                </motion.button>
                            ))}
                        </div>

                        {(import.meta.env.DEV || window.location.hostname === 'localhost') && (
                            <div className="mt-8 pt-8 border-t border-slate-800/50 flex justify-center">
                                <button
                                    onClick={() => handleDevLogin()}
                                    className="px-6 py-2 bg-slate-900/50 border border-amber-500/20 rounded-full text-amber-500 text-xs font-bold uppercase tracking-widest hover:bg-amber-500/10 transition-all flex items-center gap-2"
                                >
                                    <Shield size={14} /> Master Developer Bypass
                                </button>
                            </div>
                        )}

                        <div className="mt-12 text-center">
                            <NavLink to="/" className="text-slate-500 hover:text-white transition-colors inline-flex items-center gap-2">
                                <ArrowLeft size={16} /> Back to Gateway
                            </NavLink>
                        </div>
                    </motion.div>
                )}



                {/* --- GATE STEP (Verify Secret Code) --- */}
                {step === 'gate' && selectedBrand && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-sm mx-auto"
                    >
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center relative">
                            {/* Back Button */}
                            <button
                                onClick={() => setStep('selection')}
                                className="absolute top-4 left-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>

                            <div className="mb-6 flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center p-3">
                                    <img
                                        src={BRAND_LOGOS[selectedBrand.brandId] || partner6}
                                        alt={selectedBrand.brandName}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>

                            <h2 className="text-white text-xl font-bold mb-1">{selectedBrand.brandName}</h2>
                            <p className="text-zinc-500 text-sm mb-6">Enter secure digit to proceed</p>

                            <form onSubmit={handleVerification} className="space-y-4">
                                <input
                                    type="text"
                                    maxLength={1}
                                    value={accessCode}
                                    onChange={(e) => {
                                        setAccessCode(e.target.value);
                                        setGateError('');
                                    }}
                                    className="w-full bg-black border border-zinc-700 rounded-xl py-4 text-center text-2xl tracking-widest text-white focus:border-white focus:ring-0 outline-none transition-colors"
                                    placeholder="•"
                                    autoFocus
                                />

                                {gateError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-500 text-xs font-medium flex items-center justify-center gap-1"
                                    >
                                        <Shield size={12} /> {gateError}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full bg-amber-600 text-white font-bold py-3.5 rounded-xl hover:bg-amber-700 transition-colors shadow-lg shadow-amber-900/20"
                                >
                                    Unlock Portal
                                </button>

                                {(import.meta.env.DEV || window.location.hostname === 'localhost') && (
                                    <button
                                        type="button"
                                        onClick={() => handleDevLogin(selectedBrand.brandId)}
                                        className="w-full mt-4 bg-transparent border border-zinc-700 text-zinc-500 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Shield size={12} /> Local Dev Bypass
                                    </button>
                                )}
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* --- AUTH STEP --- */}
                {step === 'auth' && selectedBrand && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className="bg-slate-950 p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>

                            <button
                                onClick={() => { setStep('selection'); setBrandInfo(null); setError(''); }}
                                className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium z-10"
                            >
                                <ArrowLeft size={14} /> All Brands
                            </button>

                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10 p-4">
                                    <img
                                        src={BRAND_LOGOS[selectedBrand.brandId] || partner6}
                                        alt={selectedBrand.brandName}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-1">{selectedBrand.brandName}</h2>
                                <p className="text-amber-500 text-xs font-medium tracking-widest uppercase">Portal Access</p>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            {error && (
                                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                                    <Shield size={18} /> {error}
                                </div>
                            )}
                            {successMessage && (
                                <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100 flex items-center gap-2">
                                    <CheckCircle size={18} /> {successMessage}
                                </div>
                            )}

                            <div className="mb-6 text-center">
                                <h3 className="font-bold text-slate-800 text-lg">
                                    {authMode === 'reset' ? 'Recover Password' : (authMode === 'signup' ? 'Setup Account' : 'Sign In')}
                                </h3>
                                <p className="text-slate-500 text-sm">
                                    {authMode === 'reset'
                                        ? 'Enter email to receive recovery instructions'
                                        : 'Enter your credentials to continue'}
                                </p>
                            </div>

                            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                                            placeholder="brand@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Account Type Selector - Only for Signup */}
                                {authMode === 'signup' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Account Type</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setAccountType('brand')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${accountType === 'brand' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                            >
                                                <div className="font-bold text-sm text-slate-800 mb-1">Brand</div>
                                                <div className="text-xs text-slate-500">Single brand management</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAccountType('processor')}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${accountType === 'processor' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                                            >
                                                <div className="font-bold text-sm text-slate-800 mb-1">Processor</div>
                                                <div className="text-xs text-slate-500">Manage multiple brands</div>
                                            </button>
                                        </div>
                                    </div>
                                )}


                                {authMode !== 'reset' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5 ml-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase">Password</label>
                                            {authMode === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setAuthMode('reset')}
                                                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                                                >
                                                    Forgot Password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                                >
                                    {loading ? (
                                        <Loader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {authMode === 'reset' ? 'Send Link' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="px-3 bg-white text-slate-400 font-medium">Or</span></div>
                            </div>

                            {authMode !== 'reset' && (
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm hover:border-slate-300 mb-4"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google Sign In
                                </button>
                            )}

                            {/* Developer Access Removed for Production */}

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                                    className="text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                >
                                    {authMode === 'reset'
                                        ? "Back to Login"
                                        : (authMode === 'login' ? "Accessing for the first time? Create Account" : "Already have an account? Log In")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div >
    );
}
