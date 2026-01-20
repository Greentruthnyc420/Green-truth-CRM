import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckSquare,
    DollarSign,
    Users,
    TrendingUp,
    LogOut,
    Menu,
    X,
    Activity,
    Map,
    Archive,
    GitBranch,
    FileText,
    Calendar,
    History,
    PlusCircle,
    Settings,
    ShieldCheck,
    Car,
    Palette,
    Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, SUPER_ADMIN_EMAILS } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeSwitcher from '../ThemeSwitcher';
import LayoutTourWrapper from '../LayoutTourWrapper';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Admin Layout Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong.</h2>
                    <p className="text-slate-500 mb-4">{this.state.error?.message || 'Unknown error occurred.'}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout, currentUser, isSuperAdminUser } = useAuth();
    const { theme, isDark } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const [isThemeOpen, setIsThemeOpen] = useState(false);

    // Check if current user is super admin
    const showRoleManagement = isSuperAdminUser ? isSuperAdminUser() : SUPER_ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());

    const handleLogout = async () => {
        console.log("Logout button clicked");
        try {
            await logout();
            console.log("Firebase signOut successful, navigating to admin login...");
            navigate('/admin/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { path: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/workflow', label: 'Workflow', icon: CheckSquare },
        { path: '/admin/financials', label: 'Financials', icon: DollarSign },
        { path: '/admin/collections', label: 'Collections', icon: FileText },
        { path: '/admin/invoices', label: 'Invoices', icon: FileText },
        // TEMPORARILY HIDDEN FOR LAUNCH - Logistics
        // { path: '/admin/logistics', label: 'Logistics', icon: Car },
        { path: '/admin/territory', label: 'Territory', icon: Map },
        { path: '/admin/team', label: 'Team', icon: Users },
        { path: '/admin/pipeline', label: 'Pipeline', icon: GitBranch },
        // Role Management only visible to super admins
        ...(showRoleManagement ? [{ path: '/admin/roles', label: 'Roles', icon: Crown }] : []),
    ];

    // Determine tour type based on super admin status
    const tourType = showRoleManagement ? 'super_admin' : 'admin';

    return (
        <LayoutTourWrapper
            tourType={tourType}
            userEmail={currentUser?.email}
            userId={currentUser?.uid}
        >
            <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`
                    themed-sidebar fixed lg:static top-0 left-0 z-50 h-full w-64 transition-transform duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                >
                    {/* Logo Area */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logos/logo-main.png"
                                alt="GreenTruth"
                                className="h-10 w-auto object-contain"
                            />
                            <div>
                                <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-sidebar)' }}>GreenTruth</h1>
                                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Admin Portal</p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden text-slate-400 hover:text-white"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                onClick={() => setIsSidebarOpen(false)}
                                style={({ isActive }) => ({
                                    background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                                    color: isActive ? 'var(--text-sidebar)' : 'var(--text-tertiary)'
                                })}
                                className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                                ${isActive ? 'shadow-lg' : 'hover:bg-white/5 hover:text-white'}
                            `}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)', background: 'rgba(0,0,0,0.2)' }}>
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner"
                                style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}
                            >
                                {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-sidebar)' }}>{currentUser?.email}</p>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Administrator</p>
                            </div>
                        </div>

                        {/* Theme Switcher */}
                        <div className="relative mb-2">
                            <button
                                onClick={() => setIsThemeOpen(!isThemeOpen)}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-medium"
                                style={{ background: 'var(--bg-sidebar-hover)', color: 'var(--text-sidebar)' }}
                            >
                                <Palette size={16} />
                                Theme
                            </button>
                            <ThemeSwitcher isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
                        </div>

                        <button
                            onClick={() => navigate('/app')}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 py-2 rounded-lg transition-colors text-sm font-medium mb-2"
                        >
                            <Activity size={16} />
                            Sales Portal
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-medium"
                            style={{ background: 'var(--bg-sidebar-hover)', color: 'var(--text-sidebar)' }}
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Mobile Header */}
                    <header className="lg:hidden p-4 flex items-center justify-between z-30" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-primary)' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ color: 'var(--text-secondary)' }}
                            className="hover:opacity-80"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Admin Portal</span>
                        <div className="w-8" />
                    </header>

                    {/* Content Scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 lg:p-8 pb-32 lg:pb-8" style={{ background: 'var(--bg-secondary)' }}>
                        <ErrorBoundary key={location.pathname}>
                            <Outlet />
                        </ErrorBoundary>
                    </div>

                    {/* Mobile Bottom Navigation */}
                    <nav className="lg:hidden fixed bottom-0 left-0 right-0 pb-safe z-40 px-4 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.1)]" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)' }}>
                        <MobileNavLink icon={<LayoutDashboard size={20} />} label="Dash" to="/admin" end />
                        <MobileNavLink icon={<CheckSquare size={20} />} label="Workflow" to="/admin/workflow" />

                        <div className="relative -top-4">
                            <NavLink
                                to="/app/log-sale"
                                className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-600/40 border-4 border-white active:scale-95 transition-all"
                            >
                                <PlusCircle size={28} />
                            </NavLink>
                        </div>

                        <MobileNavLink icon={<DollarSign size={20} />} label="Income" to="/admin/financials" />

                        <button
                            onClick={() => setIsMoreMenuOpen(true)}
                            className="flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            <Menu size={20} />
                            <span className="text-[10px] font-medium">More</span>
                        </button>
                    </nav>

                    {/* More Menu Overlay */}
                    <AnimatePresence>
                        {isMoreMenuOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsMoreMenuOpen(false)}
                                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] lg:hidden"
                                />
                                <motion.div
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="fixed bottom-0 left-0 right-0 rounded-t-[2.5rem] z-[70] lg:hidden p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
                                    style={{ background: 'var(--bg-card)' }}
                                >
                                    <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--border-primary)' }} />

                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Control</h2>
                                        <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 pb-8">
                                        <MoreMenuItem to="/admin/territory" icon={<Map className="text-brand-500" />} label="Map" onClick={() => setIsMoreMenuOpen(false)} />
                                        <MoreMenuItem to="/admin/team" icon={<Users className="text-blue-500" />} label="Team" onClick={() => setIsMoreMenuOpen(false)} />
                                        <MoreMenuItem to="/admin/invoices" icon={<FileText className="text-emerald-500" />} label="Billables" onClick={() => setIsMoreMenuOpen(false)} />
                                        <MoreMenuItem to="/admin/pipeline" icon={<GitBranch className="text-orange-500" />} label="Pipeline" onClick={() => setIsMoreMenuOpen(false)} />
                                        <MoreMenuItem to="/admin/collections" icon={<Archive className="text-purple-500" />} label="Collections" onClick={() => setIsMoreMenuOpen(false)} />
                                    </div>

                                    <div className="pt-6 mt-2 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                                        <button
                                            onClick={() => { setIsMoreMenuOpen(false); handleLogout(); }}
                                            className="w-full flex items-center justify-center gap-3 p-4 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all font-sans"
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
                </main>
            </div>
        </LayoutTourWrapper>
    );
}

function MobileNavLink({ to, icon, label, end = false }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${isActive ? 'text-brand-600' : ''}`
            }
            style={({ isActive }) => ({
                color: isActive ? 'var(--accent-primary)' : 'var(--text-tertiary)'
            })}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
}

const MoreMenuItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all active:opacity-80"
        style={({ isActive }) => ({
            background: isActive ? 'var(--accent-primary)' : 'var(--bg-secondary)',
            borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-primary)',
            color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)'
        })}
    >
        {React.cloneElement(icon, { size: 24 })}
        <span className="text-[11px] font-bold text-center leading-tight">{label}</span>
    </NavLink>
);
