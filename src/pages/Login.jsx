import React, { useState } from 'react';
import { useAuth, isTrialEmail } from '../contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { Mail, Lock, Loader, ArrowRight, Eye, EyeOff, Shield, Users, ArrowLeft, Instagram, Play } from 'lucide-react';
import { createUserProfile } from '../services/firestoreService';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function Login() {
    const { login, signup, loginWithGoogle, devLogin, resetPassword, currentUser } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in - Fixes "Back to Dashboard" issue
    React.useEffect(() => {
        if (currentUser) {
            navigate('/app', { replace: true });
        }
    }, [currentUser, navigate]);

    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [instagramHandle, setInstagramHandle] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Format Instagram handle (remove @ if user types it)
    const formatInstagram = (value) => {
        return value.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '');
    };

    // Capture Referral Code
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        const role = params.get('role');
        if (ref) {
            sessionStorage.setItem('referralRef', ref);
            setIsRegistering(true); // Auto-switch to signup
            setSuccess("Referral code applied! Please create your account.");
        }
        if (role) {
            sessionStorage.setItem('signupRole', role);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Validate Instagram handle for signup
                if (!instagramHandle || instagramHandle.trim() === '') {
                    setError('Instagram handle is required for registration.');
                    setLoading(false);
                    return;
                }

                // Create Firebase auth account
                const userCredential = await signup(email, password);
                const user = userCredential.user;

                // Create user profile with Instagram
                const isTrial = isTrialEmail(user.email);
                await createUserProfile(user.uid, {
                    email: user.email,
                    name: user.displayName || email.split('@')[0],
                    role: sessionStorage.getItem('signupRole') || 'rep',
                    instagramHandle: formatInstagram(instagramHandle),
                    assigned_ambassador_id: sessionStorage.getItem('referralRef') || null,
                    is_trial: isTrial,
                    created_at: new Date().toISOString()
                });

                // Clear session storage
                sessionStorage.removeItem('referralRef');
                sessionStorage.removeItem('signupRole');
            } else {
                await login(email, password);
            }
            navigate('/app', { replace: true });
        } catch (err) {
            console.error(err);
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await loginWithGoogle();
            navigate('/app', { replace: true });
        } catch (err) {
            console.error(err);
            setError(getAuthErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError("Please enter your email address to reset password.");
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const result = await resetPassword(email);
            setSuccess(result.message);
        } catch (err) {
            console.error(err);
            setError("Failed to reset password. " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
            <div className="themed-card w-full max-w-xl rounded-2xl overflow-hidden">

                {/* Header Section - Reduced padding on mobile */}
                <div className="bg-slate-900 p-6 md:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-brand-600/10 z-0"></div>
                    <NavLink to="/gateway" className="absolute top-4 left-4 z-20 text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                        <ArrowLeft size={16} />
                        Back
                    </NavLink>
                    <div className="relative z-10">
                        {/* Logo - Large, width-based, with transform to visually center (shift left 8px for NYC text) */}
                        <div className="w-full flex items-center justify-center mb-4 md:mb-6">
                            <img src="/logos/green-truth-logo-dark.png" alt="GreenTruth Logo" className="w-full max-w-md object-contain filter drop-shadow-lg" style={{ transform: 'translateX(-8px)' }} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isRegistering ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-slate-400 text-sm">
                            Cannabis Consultant Portal
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                            {error}
                            {error.includes("Firebase API Key") && (
                                <p className="mt-2 text-xs underline cursor-pointer" onClick={() => window.open('FIREBASE_SETUP.md')}>
                                    Read Setup Guide
                                </p>
                            )}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg border border-emerald-100 text-center">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Instagram Handle - Required for Registration */}
                        {isRegistering && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                    Instagram Handle <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Instagram size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-brand-500 outline-none transition-all"
                                        placeholder="your_instagram"
                                        value={instagramHandle}
                                        onChange={(e) => setInstagramHandle(formatInstagram(e.target.value))}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Required for activation flyers & social media tagging</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isRegistering ? 'Sign Up' : 'Sign In'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        {!isRegistering && (
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="w-full text-center text-sm text-slate-500 hover:text-brand-600 font-medium transition-colors"
                            >
                                Forgot your password?
                            </button>
                        )}
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-slate-100 flex-1"></div>
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Or continue with</span>
                        <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-primary)'
                        }}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                    </button>

                    {import.meta.env.DEV && (
                        <div className="space-y-2 mt-4 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                            <p className="text-xs font-bold text-slate-500 text-center mb-3">🧪 DEV MODE - Test Tours</p>

                            {/* Canna Consultant Tour */}
                            <button
                                type="button"
                                onClick={() => {
                                    devLogin('rep@thegreentruthnyc.com');
                                    sessionStorage.setItem('triggerTour', 'sales_rep');
                                    navigate('/app');
                                }}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:from-emerald-600 hover:to-green-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Play size={14} />
                                Sales Rep Tour (16 steps)
                            </button>

                            {/* Social Media Manager Tour */}
                            <button
                                type="button"
                                onClick={() => {
                                    devLogin('alyssa@thegreentruthnyc.com');
                                    sessionStorage.setItem('triggerTour', 'social_manager');
                                    navigate('/app');
                                }}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 text-white py-2.5 rounded-lg font-bold text-sm hover:from-pink-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
                            >
                                <Users size={14} />
                                Social Media Manager Tour (24 steps)
                            </button>
                        </div>
                    )}



                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="ml-1 text-brand-600 font-bold hover:underline focus:outline-none"
                            >
                                {isRegistering ? 'Sign in' : 'Register'}
                            </button>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
