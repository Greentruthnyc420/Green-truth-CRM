import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getAuthErrorMessage } from '../../utils/authErrors';

export default function DispensaryLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, googleLogin } = useAuth();
    const { showNotification } = useNotification();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            showNotification('Welcome back!', 'success');
            navigate('/dispensary');
        } catch (error) {
            showNotification(getAuthErrorMessage(error), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await googleLogin();
            navigate('/dispensary');
        } catch (error) {
            showNotification(getAuthErrorMessage(error), 'error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center p-4">
            <div className="max-w-xl w-full mx-auto">
                <button
                    onClick={() => navigate('/dispensary/verify')}
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-medium transition-colors mb-6 ml-2"
                >
                    <ArrowLeft size={18} /> Back to Verification
                </button>

                <div className="text-center mb-8">
                    {/* Logo - Large, width-based, with transform to visually center */}
                    <div className="w-full flex items-center justify-center mb-4">
                        <img
                            src="/logos/green-truth-logo-dark.png"
                            alt="GreenTruth NYC"
                            className="w-full max-w-md object-contain filter drop-shadow-lg"
                            style={{ transform: 'translateX(-8px)' }}
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dispensary Login</h1>
                    <p className="mt-2 text-slate-500">Access your dashboard and place orders</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 p-8 border border-slate-100">
                    <form onSubmit={handleEmailLogin} className="space-y-6">
                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm font-bold text-slate-700 ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                        >
                            {loading ? <Loader className="animate-spin" /> : 'Log In'}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or continue with</span></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Google Account
                    </button>

                    {/* Developer Login Button (Local Dev Only) */}
                    {(import.meta.env.DEV || window.location.hostname === 'localhost') && (
                        <div className="mt-4 space-y-2">
                            <button
                                onClick={() => {
                                    sessionStorage.setItem('skipTour', 'true');
                                    showNotification('Developer access granted', 'success');
                                    navigate('/dispensary');
                                }}
                                className="w-full py-3 bg-purple-600/10 border border-purple-500/30 text-purple-700 font-bold rounded-2xl hover:bg-purple-600/20 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <span>💜</span>  Developer Login (Localhost Only)
                            </button>
                            <button
                                onClick={() => {
                                    sessionStorage.setItem('triggerTour', 'dispensary');
                                    showNotification('Starting Dispensary Tour', 'info');
                                    navigate('/dispensary');
                                }}
                                className="w-full py-3 bg-purple-500 text-white font-bold rounded-2xl hover:bg-purple-600 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                ▶️ Dispensary Tour (13 steps)
                            </button>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    New store?{' '}
                    <button onClick={() => navigate('/dispensary/verify')} className="text-emerald-600 font-bold hover:underline">
                        Register with License
                    </button>
                </p>
            </div>
        </div>
    );
}
