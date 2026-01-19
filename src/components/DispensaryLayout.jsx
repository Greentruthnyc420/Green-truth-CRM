import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, LogOut, Bell, Plug, Calendar, Menu, X, FileText, ShoppingCart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeSwitcher from './ThemeSwitcher';

export default function DispensaryLayout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/dispensary/login');
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg-primary)' }}>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 border-r h-screen sticky top-0" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="p-8 border-b border-slate-50">
                    <img src="/logos/logo-main.png" alt="Logo" className="h-12 w-auto object-contain" />
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <DispensaryNavItem to="/dispensary" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <DispensaryNavItem to="/dispensary/schedule" icon={<Calendar size={20} />} label="Schedule" />
                    <DispensaryNavItem to="/dispensary/marketplace" icon={<ShoppingBag size={20} />} label="Marketplace" />
                    <DispensaryNavItem to="/dispensary/orders" icon={<ShoppingCart size={20} />} label="My Orders" />
                    <DispensaryNavItem to="/dispensary/integrations" icon={<Plug size={20} />} label="Integrations" />

                    {/* Divider */}
                    <div className="py-2">
                        <div className="border-t border-slate-100"></div>
                    </div>


                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
                    >
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 z-40" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <Menu size={24} />
                </button>
                <img src="/logos/logo-main.png" alt="Logo" className="h-10 w-auto" />
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    {currentUser?.displayName?.[0] || 'D'}
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 pb-24">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav - Quick Access */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t pb-safe z-40 px-2 py-2 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <MobileNavItem to="/dispensary" icon={<LayoutDashboard size={22} />} label="Dashboard" />
                <MobileNavItem to="/dispensary/marketplace" icon={<ShoppingBag size={22} />} label="Shop" />
                <MobileNavItem to="/dispensary/orders" icon={<ShoppingCart size={22} />} label="Orders" />
                <MobileNavItem to="/dispensary/schedule" icon={<Calendar size={22} />} label="Schedule" />
            </nav>

            {/* Slide-out Menu from Left */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 z-[70] md:hidden p-6 overflow-y-auto shadow-2xl"
                            style={{ background: 'var(--bg-card)' }}
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Menu</h2>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <nav className="space-y-2 pb-6">
                                <SlideMenuItem to="/dispensary" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setIsMenuOpen(false)} />
                                <SlideMenuItem to="/dispensary/schedule" icon={<Calendar size={20} className="text-blue-500" />} label="Schedule" onClick={() => setIsMenuOpen(false)} />
                                <SlideMenuItem to="/dispensary/marketplace" icon={<ShoppingBag size={20} className="text-emerald-500" />} label="Marketplace" onClick={() => setIsMenuOpen(false)} />
                                <SlideMenuItem to="/dispensary/orders" icon={<ShoppingCart size={20} className="text-blue-500" />} label="My Orders" onClick={() => setIsMenuOpen(false)} />
                                <SlideMenuItem to="/dispensary/invoices" icon={<FileText size={20} className="text-orange-500" />} label="Invoices" onClick={() => setIsMenuOpen(false)} />
                                <SlideMenuItem to="/dispensary/integrations" icon={<Plug size={20} className="text-purple-500" />} label="Integrations" onClick={() => setIsMenuOpen(false)} />
                            </nav>

                            <div className="border-t pt-4 mt-2" style={{ borderColor: 'var(--border-primary)' }}>
                                <div className="pb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Appearance</span>
                                </div>
                                <ThemeSwitcher isOpen={true} onClose={() => { }} inline={true} />
                            </div>

                            <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border-primary)' }}>
                                <button
                                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                    className="w-full flex items-center gap-3 p-4 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
                                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                >
                                    <LogOut size={20} />
                                    Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

const DispensaryNavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        end
        style={({ isActive }) => ({
            background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
            color: isActive ? 'var(--accent-primary)' : undefined
        })}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${isActive ? 'shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`
        }
    >
        {icon} {label}
    </NavLink>
);

const MobileNavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-4 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'
            }`
        }
    >
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
);

const SlideMenuItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        end={to === '/dispensary'}
        onClick={onClick}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${!isActive ? 'hover:bg-slate-100' : ''}`
        }
        style={({ isActive }) => isActive ? {
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)'
        } : { color: 'var(--text-primary)' }}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);
