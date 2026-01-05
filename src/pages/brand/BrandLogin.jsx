import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useBrandAuth } from '../../contexts/BrandAuthContext';
import { Mail, Lock, Key, Loader, ArrowRight, Eye, EyeOff, Package, AlertCircle, ArrowLeft, Shield } from 'lucide-react';

export default function BrandLogin() {
    const { loginBrand, signupBrand, devBrandLogin, validateLicense, loginWithGoogle, resetPassword } = useBrandAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/brand';

    const [step, setStep] = useState('license'); // 'license' | 'auth'
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'reset'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [licenseNumber, setLicenseNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [brandInfo, setBrandInfo] = useState(null);

    const handleLicenseSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

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
        setSuccessMessage('');
        setLoading(true);

        try {
            if (authMode === 'signup') {
                await signupBrand(email, password, licenseNumber);
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

                    {successMessage && (
                        <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100 flex items-center gap-2">
                            <AlertCircle size={18} className="rotate-180" />
                            {successMessage}
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
                                    {authMode === 'reset' ? 'Reset Password' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {authMode === 'reset'
                                        ? 'Enter your email to receive a reset link'
                                        : (authMode === 'signup' ? 'Set up your brand access credentials' : 'Welcome back! Login to your dashboard')}
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

                                {authMode !== 'reset' && (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-sm font-medium text-slate-700">Password</label>
                                                {authMode === 'login' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setAuthMode('reset')}
                                                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                                                    >
                                                        Forgot Password?
                                                    </button>
                                                )}
                                            </div>
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
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <Loader size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {authMode === 'reset' ? 'Send Reset Link' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <div className="text-center pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                                        className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors"
                                    >
                                        {authMode === 'reset'
                                            ? "Wait, I remember it! Back to Login"
                                            : (authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In")}
                                    </button>
                                </div>

                                {authMode !== 'reset' && (
                                    <div className="space-y-4 pt-2">
                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs">
                                                <span className="px-3 bg-white text-slate-400 font-medium uppercase tracking-wider">Or secure access with</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGoogleLogin}
                                            disabled={loading}
                                            className="w-full bg-white border-2 border-slate-100 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 group shadow-sm"
                                        >
                                            <div className="bg-white p-1 rounded-md shadow-sm border border-slate-100 group-hover:scale-110 transition-transform flex items-center justify-center">
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                            </div>
                                            <span>Continue with Google</span>
                                        </button>
                                    </div>
                                )}

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
