import React, { useState } from 'react';
import { useAuth, ADMIN_EMAILS } from '../../contexts/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { Shield, Loader, ArrowRight, Lock, Mail, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AdminLogin() {
    const { login, loginWithGoogle, devLogin, currentUser, logout } = useAuth();
    const navigate = useNavigate();

    // Redirect logic with explicit Admin check to prevent loops
    React.useEffect(() => {
        if (currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase())) {
            navigate('/admin', { replace: true });
        }
    }, [currentUser, navigate]);

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Pre-check for admin status before attempting login
            if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
                throw new Error("Access Denied: You do not have admin privileges.");
            }

            await login(email, password);
            navigate('/admin', { replace: true });
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to log in.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await loginWithGoogle();
            const userEmail = result.user.email.toLowerCase();

            if (!ADMIN_EMAILS.includes(userEmail)) {
                // If not admin, logout immediately to prevent getting stuck
                await logout();
                throw new Error("Access Denied: You do not have admin privileges.");
            }

            navigate('/admin', { replace: true });
        } catch (err) {
            setError(err.message || "Failed to log in with Google.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 z-0" />
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
            </div>

            <div className="relative z-10 bg-slate-800/50 backdrop-blur-xl w-full max-w-md rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">

                {/* Header */}
                <div className="bg-slate-950/50 p-8 text-center border-b border-slate-700/50">
                    <NavLink to="/" className="absolute top-4 left-4 text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium">
                        <ArrowLeft size={14} />
                        Back to Gateway
                    </NavLink>

                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin Portal</h2>
                    <p className="text-slate-400 text-sm">Restricted Access Only</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {/* Access Denied Warning for non-admin logged in users */}
                    {currentUser && !ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()) && (
                        <div className="mb-6 p-4 bg-amber-500/10 text-amber-400 text-sm rounded-xl border border-amber-500/20 text-left">
                            <p className="font-bold mb-2">Logged in as {currentUser.email}</p>
                            <p className="mb-3 opacity-90">You do not have permission to access the admin portal.</p>
                            <button
                                onClick={logout}
                                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium text-amber-300"
                            >
                                Logout & Try Different Account
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 text-red-400 text-sm rounded-xl border border-red-500/20 flex gap-3 text-left">
                            <Shield size={18} className="flex-shrink-0 mt-0.5" />
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 rounded-xl border border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="admin@thegreentruthnyc.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full pl-10 pr-12 py-3 bg-slate-900/50 rounded-xl border border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader size={20} className="animate-spin" />
                            ) : (
                                <>
                                    Access Dashboard
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-slate-700 flex-1"></div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Or</span>
                        <div className="h-px bg-slate-700 flex-1"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white text-slate-900 py-3.5 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign in with Google
                    </button>


                    <div className="mt-8 text-center text-xs text-slate-500">
                        Authorized Personnel Only
                    </div>
                </div>
            </div>
        </div>
    );
}
