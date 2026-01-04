import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Mail, Lock, Key, Loader, ArrowRight, Eye, EyeOff, Package, AlertCircle, ArrowLeft, Shield } from 'lucide-react';

export default function BrandLogin() {
    const { loginBrand, signupBrand, devBrandLogin, validateLicense, loginWithGoogle } = useBrandAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/brand';

    const [step, setStep] = useState('license'); // 'license' | 'auth'
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [licenseNumber, setLicenseNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [brandInfo, setBrandInfo] = useState(null);

    const handleLicenseSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = validateLicense(licenseNumber);
        if (result) {
            setBrandInfo(result);
            setStep('auth');
        } else {
            setError('Invalid license number. Please check with your account manager.');
        }
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (authMode === 'signup') {
                await signupBrand(email, password, licenseNumber);
            } else {
                await loginBrand(email, password, licenseNumber);
            }
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            await loginWithGoogle(licenseNumber); // Pass license to link account
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || 'Google Login failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleDevLogin = (brandId) => {
        devBrandLogin(brandId);
        navigate('/brand', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">

                {/* Header Section */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-10 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <NavLink to="/" className="absolute top-4 left-4 z-20 text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                        <ArrowLeft size={16} />
                        Back
                    </NavLink>
                    <div className="relative z-10">
                        {/* Dynamic Brand Logo/Icon */}
                        <div className="w-48 h-48 mx-auto flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
                            {step === 'auth' && brandInfo ? (
                                <div className="w-32 h-32 rounded-3xl bg-white/20 flex items-center justify-center shadow-2xl backdrop-blur-sm border border-white/30">
                                    <span className="text-5xl font-bold text-white">
                                        {brandInfo.brandName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                                    </span>
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                                    <Package size={64} className="text-white/90" strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 shadow-black/20 drop-shadow-md">
                            Brand Portal
                        </h2>
                        <p className="text-white/90 text-base font-medium">
                            Manage orders, invoices & menus
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {step === 'license' ? (
                        <>
                            <div className="mb-6 text-center">
                                <h3 className="font-bold text-slate-800 mb-1">Enter Your License</h3>
                                <p className="text-sm text-slate-500">Verify your brand license to continue</p>
                            </div>

                            <form onSubmit={handleLicenseSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">License Number</label>
                                    <div className="relative">
                                        <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-amber-500 outline-none transition-all uppercase"
                                            placeholder="e.g., WANDERS-LICENSE-001"
                                            value={licenseNumber}
                                            onChange={(e) => setLicenseNumber(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
                                >
                                    Verify License
                                    <ArrowRight size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="mb-6 text-center">
                                <span className="inline-block px-3 py-1 bg-amber-100 text-orange-600 rounded-full text-xs font-bold mb-2 uppercase tracking-wide">
                                    {brandInfo?.brandName}
                                </span>
                                <h3 className="font-bold text-slate-800 mb-1">
                                    {location.state?.isSignUp || authMode === 'signup' ? 'Create Account' : 'Sign In'}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {location.state?.isSignUp || authMode === 'signup'
                                        ? 'Set up your brand access credentials'
                                        : 'Welcome back! Login to your dashboard'}
                                </p>
                            </div>

                            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-amber-500 outline-none transition-all"
                                            placeholder="brand@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-amber-500 outline-none transition-all"
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader size={20} className="animate-spin" />
                                    ) : (
                                        location.state?.isSignUp || authMode === 'signup' ? 'Create Account' : 'Login'
                                    )}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                                        className="text-sm font-medium text-amber-600 hover:text-amber-700"
                                    >
                                        {authMode === 'login'
                                            ? "Don't have an account? Sign Up"
                                            : "Already have an account? Log In"}
                                    </button>
                                </div>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-slate-500">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full bg-white border border-slate-200 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                    Google
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('license'); setBrandInfo(null); setEmail(''); setPassword(''); }}
                                    className="w-full text-slate-500 text-sm hover:text-slate-700 transition-colors mt-2"
                                >
                                    ← Use a different license
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full text-slate-500 text-sm hover:text-amber-600 transition-colors mt-4 flex items-center justify-center gap-2"
                                >
                                    <Shield size={16} />
                                    Sign in as Admin
                                </button>
                            </form>
                        </>
                    )}

                    {/* Dev Login Shortcuts */}
                    {import.meta.env.DEV && step === 'license' && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-xs text-slate-400 text-center mb-3 uppercase tracking-wider font-medium">Dev Login Shortcuts</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('wanders')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Wanders NY
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('honey-king')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Honey King
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('bud-cracker')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Bud Cracker
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('canna-dots')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Canna Dots
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('space-poppers')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Space Poppers
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('smoothie-bar')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Smoothie Bar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('waferz')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Waferz NY
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDevLogin('pines')}
                                    className="bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all"
                                >
                                    Pines
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
