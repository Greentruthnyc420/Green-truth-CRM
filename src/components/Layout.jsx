import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, PlusCircle, Car, Users, DollarSign, ShieldCheck, FileText, Trophy, Building2, Navigation, Calendar, Menu, X, Settings, MoreHorizontal, HelpCircle, LogOut, Tag } from 'lucide-react';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSwitcher, { MobileThemeBar } from './ThemeSwitcher';
import LayoutTourWrapper from './LayoutTourWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import PWAInstallPrompt from './PWAInstallPrompt';
import OfflineIndicator from './OfflineIndicator';
import NotificationBell from './NotificationBell';


const Sidebar = ({ isCollapsed, toggleSidebar, currentUser }) => {
    const { theme } = useTheme();
    // Defensive check for ADMIN_EMAILS to prevent white-screen crashes
    const safeAdminEmails = Array.isArray(ADMIN_EMAILS) ? ADMIN_EMAILS : [];
    const isAdmin = currentUser && currentUser.email && safeAdminEmails.includes(currentUser.email.toLowerCase());

    // Extract name from email (e.g., amber@thegreentruthnyc.com -> Amber)
    const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0].charAt(0).toUpperCase() + currentUser.email.split('@')[0].slice(1) : 'User');
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

    return (
        <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-24' : 'w-64'} themed-sidebar h-screen fixed left-0 top-0 overflow-y-auto transition-all duration-300`}
            style={{ borderRight: '1px solid var(--border-primary)' }}>
            {/* Increased logo area from h-24/h-80 to h-40/h-120 */}
            <div
                onClick={toggleSidebar}
                className={`p-0 ${isCollapsed ? 'h-24' : 'h-64'} flex items-center justify-center bg-black overflow-hidden relative border-b border-slate-800 cursor-pointer group transition-all duration-300`}
            >
                {/* Brand Logo Area - Using transparent logo (same as gateway) */}
                <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950 group-hover:bg-slate-900 transition-colors">
                    <img
                        src="/logos/logo-main.png"
                        alt="The Green Truth"
                        className={`object-contain transition-all duration-300 group-hover:scale-105 ${isCollapsed ? 'w-full h-auto px-1' : 'w-full h-full'}`}
                    />
                </div>
            </div>

            <nav className="flex-1 p-2 space-y-1">
                <NavItem to="/app" icon={<LayoutDashboard size={20} />} label="Dashboard" isCollapsed={isCollapsed} />
                <div className="flex bg-slate-800/40 rounded-lg mx-2 mb-1 overflow-hidden backdrop-blur-sm shadow-inner group-hover:bg-slate-800/60 transition-colors">
                    <NavItem to="/app/map" icon={<Navigation size={20} className="text-brand-400" />} label="Territory Map" isCollapsed={isCollapsed} />
                </div>
                <NavItem to="/app/history" icon={<History size={20} />} label="History" isCollapsed={isCollapsed} />
                <NavItem to="/app/schedule" icon={<Calendar size={20} />} label="Schedule" isCollapsed={isCollapsed} />

                <div className={`pt-4 pb-1 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                    Actions
                </div>

                <NavItem to="/app/log-shift" icon={<Car size={20} />} label="Log Shift" isCollapsed={isCollapsed} />
                <NavItem to="/app/new-lead" icon={<Users size={20} />} label="New Lead" isCollapsed={isCollapsed} />
                <NavItem to="/app/log-sale" icon={<DollarSign size={20} />} label="Log Sale" isCollapsed={isCollapsed} />
                <NavItem to="/app/accounts" icon={<Building2 size={20} />} label="All Accounts" isCollapsed={isCollapsed} />

                <div className="my-1 border-t border-slate-800/50"></div>
                <NavItem to="/app/leaderboard" icon={<Trophy size={20} className="text-yellow-500" />} label="King of the Crop" isCollapsed={isCollapsed} />

                <div className={`pt-4 pb-1 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                    Resources
                </div>

                <NavItem to="/app/menus" icon={<FileText size={20} />} label="Brand Menus" isCollapsed={isCollapsed} />
                <NavItem to="/app/deals" icon={<Tag size={20} />} label="Deals & Promos" isCollapsed={isCollapsed} />
                <NavItem to="/app/settings" icon={<Settings size={20} />} label="Settings" isCollapsed={isCollapsed} />


            </nav>

            <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                <div className={`flex items-center gap-3 p-2 rounded-lg ${isCollapsed ? 'justify-center' : ''}`}
                    style={{ background: 'var(--bg-sidebar-hover)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold min-w-[2rem]"
                        style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}>
                        {initials}
                    </div>
                    {!isCollapsed && (
                        <div className="text-sm overflow-hidden whitespace-nowrap">
                            <p className="font-medium" style={{ color: 'var(--text-sidebar)' }}>{userName}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{currentUser?.email || 'Ambassador'}</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};


const NavItem = ({ to, icon, label, isCollapsed }) => {
    return (
        <NavLink
            to={to}
            end={to === '/app' || to === '/admin'}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                    ? 'shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
            }
            style={({ isActive }) => isActive ? {
                background: 'var(--accent-primary)',
                color: 'var(--text-inverse)'
            } : {}}
            title={isCollapsed ? label : ''}
        >
            <div className="min-w-[20px]">{icon}</div>
            {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden">{label}</span>}
        </NavLink>
    );
};

const MobileNavItem = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-colors min-h-[60px] ${!isActive ? 'text-slate-400 hover:text-slate-600' : ''}`
            }
            style={({ isActive }) => isActive ? {
                color: 'var(--accent-primary)'
            } : {}}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
};

export default function Layout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Defensive check for ADMIN_EMAILS
    const safeAdminEmails = Array.isArray(ADMIN_EMAILS) ? ADMIN_EMAILS : [];
    const isAdmin = currentUser && currentUser.email && safeAdminEmails.includes(currentUser.email.toLowerCase());

    // Extract name from email (e.g., amber@thegreentruthnyc.com -> Amber)
    const userName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0].charAt(0).toUpperCase() + currentUser.email.split('@')[0].slice(1) : 'User');
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

    const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <LayoutTourWrapper
            tourType="sales_rep"
            userEmail={currentUser?.email}
            userId={currentUser?.uid}
        >
            <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    currentUser={currentUser}
                />

                <main className={`flex-1 ${isSidebarCollapsed ? 'md:ml-24' : 'md:ml-64'} w-full min-h-screen relative transition-all duration-300`}>
                    {/* Mobile Header */}
                    <header className="md:hidden border-b p-4 flex items-center justify-between sticky top-0 z-40" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        {/* Hamburger Menu Button */}
                        <button
                            onClick={() => setIsMoreMenuOpen(true)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <Menu size={24} />
                        </button>

                        {/* Logo */}
                        <img src="/logos/logo-main.png" alt="The Green Truth" className="h-14 w-auto object-contain" />

                        {/* Notifications and User Avatar */}
                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                {initials}
                            </div>
                        </div>
                    </header>

                    <div className="p-4 md:p-8 pb-32 md:pb-8 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* PWA Install Prompt */}
                <PWAInstallPrompt />

                {/* Offline Status Indicator */}
                <OfflineIndicator />


                {/* Bottom Nav - Admin Style with More Button */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-md border-t pb-safe z-50 px-2 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <MobileNavItem to="/app" icon={<LayoutDashboard size={20} />} label="Home" />
                    <MobileNavItem to="/app/new-lead" icon={<Users size={20} />} label="Leads" />

                    <div className="relative -top-4">
                        <NavLink
                            to="/app/log-sale"
                            className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-600/40 border-4 border-white active:scale-95 transition-all"
                        >
                            <PlusCircle size={28} />
                        </NavLink>
                    </div>

                    <MobileNavItem to="/app/history" icon={<History size={20} />} label="History" />
                    <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: isMoreMenuOpen ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}
                    >
                        <MoreHorizontal size={20} />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </nav>

                {/* Bottom Slide-Up More Menu (Admin Style) */}
                <AnimatePresence>
                    {isMoreMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMoreMenuOpen(false)}
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
                                    <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Theme Bar - 4 Visible Options */}
                                <div className="px-4 pb-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                                    <MobileThemeBar />
                                </div>

                                {/* Navigation Grid */}
                                <div className="px-4 py-4 grid grid-cols-4 gap-3">
                                    <SlideGridItem to="/app" icon={<LayoutDashboard size={22} />} label="Dashboard" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/map" icon={<Navigation size={22} className="text-brand-500" />} label="Map" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/schedule" icon={<Calendar size={22} className="text-blue-500" />} label="Schedule" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/accounts" icon={<Building2 size={22} className="text-indigo-500" />} label="Accounts" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/log-shift" icon={<Car size={22} className="text-orange-500" />} label="Log Shift" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/leaderboard" icon={<Trophy size={22} className="text-yellow-500" />} label="Leaderboard" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/menus" icon={<FileText size={22} className="text-emerald-500" />} label="Menus" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/deals" icon={<Tag size={22} className="text-purple-500" />} label="Deals" onClick={() => setIsMoreMenuOpen(false)} />
                                    <SlideGridItem to="/app/settings" icon={<Settings size={22} className="text-slate-500" />} label="Settings" onClick={() => setIsMoreMenuOpen(false)} />
                                </div>



                                {/* Footer Actions */}
                                <div className="px-4 pb-8 border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                                    <button
                                        onClick={() => { setIsMoreMenuOpen(false); handleLogout(); }}
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
        </LayoutTourWrapper>
    );
}

const MoreMenuItem = ({ to, icon, label, onClick }) => {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${!isActive ? 'border-slate-100 text-slate-600 active:bg-slate-50' : ''}`
            }
            style={({ isActive }) => isActive ? {
                background: 'var(--bg-sidebar-active)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)'
            } : { background: 'var(--bg-card)' }}
        >
            {React.cloneElement(icon, { size: 24 })}
            <span className="text-[11px] font-bold text-center leading-tight">{label}</span>
        </NavLink>
    );
};

// Slide-out menu item for the left drawer
const SlideMenuItem = ({ to, icon, label, onClick }) => {
    return (
        <NavLink
            to={to}
            end={to === '/app' || to === '/admin'}
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
};

// Grid item for mobile More menu
const SlideGridItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        end={to === '/app'}
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
