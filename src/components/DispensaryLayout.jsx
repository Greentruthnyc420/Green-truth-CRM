import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, LogOut, Calendar, Menu, X, FileText, ShoppingCart, MoreHorizontal, Settings, Link2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileThemeBar } from './ThemeSwitcher';

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
                <div className="p-4 border-b border-slate-50">
                    <img src="/logos/logo-main.png" alt="The Green Truth" className="h-20 w-auto object-contain" />
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <DispensaryNavItem to="/dispensary" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <DispensaryNavItem to="/dispensary/schedule" icon={<Calendar size={20} />} label="Schedule" />
                    <DispensaryNavItem to="/dispensary/marketplace" icon={<ShoppingBag size={20} />} label="Marketplace" />
                    <DispensaryNavItem to="/dispensary/orders" icon={<ShoppingCart size={20} />} label="My Orders" />
                    <DispensaryNavItem to="/dispensary/invoices" icon={<FileText size={20} />} label="Invoices" />
                    <DispensaryNavItem to="/dispensary/settings" icon={<Settings size={20} />} label="Settings" />
                    <DispensaryNavItem to="/dispensary/integrations" icon={<Link2 size={20} />} label="Integrations" />
                </nav>
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
                <img src="/logos/logo-main.png" alt="The Green Truth" className="h-16 w-auto" />
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    {currentUser?.displayName?.[0] || 'D'}
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 pb-24">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav - Admin Style with More Button */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t pb-safe z-40 px-2 py-2 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <MobileNavItem to="/dispensary" icon={<LayoutDashboard size={22} />} label="Dashboard" />
                <MobileNavItem to="/dispensary/marketplace" icon={<ShoppingBag size={22} />} label="Shop" />
                <MobileNavItem to="/dispensary/orders" icon={<ShoppingCart size={22} />} label="Orders" />
                <MobileNavItem to="/dispensary/schedule" icon={<Calendar size={22} />} label="Schedule" />
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: isMenuOpen ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                >
                    <MoreHorizontal size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">More</span>
                </button>
            </nav>

            {/* Bottom Slide-Up More Menu (Admin Style) */}
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
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
                            style={{ background: 'var(--bg-card)' }}
                        >
                            {/* Handle Bar */}
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1.5 rounded-full" style={{ background: 'var(--border-primary)' }} />
                            </div>

                            {/* Header */}
                            <div className="flex justify-between items-center px-6 pb-4">
                                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>More</h2>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Theme Bar - 4 Visible Options */}
                            <div className="px-4 pb-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                <MobileThemeBar />
                            </div>

                            <div className="px-4 py-4 grid grid-cols-4 gap-3">
                                <SlideGridItem to="/dispensary" icon={<LayoutDashboard size={22} />} label="Dashboard" onClick={() => setIsMenuOpen(false)} />
                                <SlideGridItem to="/dispensary/marketplace" icon={<ShoppingBag size={22} className="text-emerald-500" />} label="Shop" onClick={() => setIsMenuOpen(false)} />
                                <SlideGridItem to="/dispensary/orders" icon={<ShoppingCart size={22} className="text-blue-500" />} label="Orders" onClick={() => setIsMenuOpen(false)} />
                                <SlideGridItem to="/dispensary/schedule" icon={<Calendar size={22} className="text-indigo-500" />} label="Schedule" onClick={() => setIsMenuOpen(false)} />
                                <SlideGridItem to="/dispensary/invoices" icon={<FileText size={22} className="text-orange-500" />} label="Invoices" onClick={() => setIsMenuOpen(false)} />
                                <SlideGridItem to="/dispensary/settings" icon={<Settings size={22} className="text-purple-500" />} label="Settings" onClick={() => setIsMenuOpen(false)} />
                            </div>

                            {/* Footer Actions */}
                            <div className="px-4 pb-8 border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                                <button
                                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                                    className="w-full flex items-center justify-center gap-3 p-4 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
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

// Grid item for mobile More menu
const SlideGridItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        end={to === '/dispensary'}
        onClick={onClick}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all ${isActive
                ? 'bg-emerald-50 text-emerald-600'
                : 'hover:bg-slate-100'
            }`
        }
        style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}
    >
        {icon}
        <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </NavLink>
);
