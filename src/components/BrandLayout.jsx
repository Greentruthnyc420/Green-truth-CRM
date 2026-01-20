import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useBrandAuth } from '../contexts/BrandAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSwitcher, { MobileThemeBar } from './ThemeSwitcher';
import LayoutTourWrapper from './LayoutTourWrapper';
import { LayoutDashboard, ShoppingCart, FileText, Menu, LogOut, Package, ArrowDownLeft, ArrowUpRight, Navigation, Calendar, UserPlus, Settings, X, Car, Palette, GitBranch, MoreHorizontal, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrandLayout() {
    const { brandUser, logoutBrand, switchBrand } = useBrandAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);
    const [isThemeOpen, setIsThemeOpen] = React.useState(false);

    const handleLogout = () => {
        logoutBrand();
        navigate('/brand/login');
    };

    const handleExitGhostMode = () => {
        const returnUrl = brandUser?.returnUrl || '/app/admin';
        logoutBrand();
        navigate(returnUrl);
    };

    const isGhost = brandUser?.isImpersonating;

    const initials = brandUser?.brandName
        ? brandUser.brandName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'BR';

    // Unified Brand Logo Mapping - Wanders removed
    // Format: { brandId: { top: 'Path to large sidebar logo', icon: 'Path to small icon logo' } }
    const BRAND_ASSETS = {
        'greentruth': {
            top: '/logos/logo-main.png', // Use master logo for internal portal
            icon: '/logos/logo-main.png'
        },
        'space-poppers': {
            top: '/logos/space-poppers.png',
            icon: '/logos/space-poppers.png'
        },
        'canna-dots': {
            top: '/logos/partner-3.jpg',
            icon: '/logos/partner-3.jpg'
        },
        'bud-cracker': {
            top: '/logos/partner-4.png',
            icon: '/logos/bud-cracker-secondary.png'
        },
        'honey-king': {
            top: '/logos/partner-5.png', // Text Logo
            icon: '/logos/partner-6.png'  // Lion Logo
        },
        'waferz': {
            top: '/logos/waferz.png',
            icon: '/logos/waferz.png'
        },
        'smoothie-bar': {
            top: '/logos/smoothie-bar.png',
            icon: '/logos/smoothie-bar.png'
        },
        'flx-extracts': {
            top: '/logos/flx-extracts.png',
            icon: '/logos/flx-extracts.png'
        },
        'pines': {
            top: '/logos/pines.png',
            icon: '/logos/pines.png'
        }
    };

    const currentBrandId = brandUser?.brandId;
    const assets = currentBrandId ? BRAND_ASSETS[currentBrandId] : null;

    // Top Sidebar Logo (Large logo on dark background)
    const topSidebarLogo = assets?.top || null;

    // Brand Logo for Icons (Context, Footer, Header)
    const brandLogo = assets?.icon || null;

    // Determine tour type based on whether this is a processor
    const tourType = brandUser?.isProcessor || brandUser?.allowedBrands?.length > 0 ? 'processor' : 'brand';

    return (
        <LayoutTourWrapper
            tourType={tourType}
            userEmail={brandUser?.email}
            userId={brandUser?.id}
        >
            <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
                {/* Sidebar */}
                <aside className="hidden md:flex flex-col w-64 themed-sidebar h-screen fixed left-0 top-0 overflow-y-auto"
                    style={{ borderRight: '1px solid var(--border-primary)' }}>
                    {/* Brand Logo Area - Personalized */}
                    <div className="h-48 flex items-center justify-center bg-slate-950 overflow-hidden relative border-b border-slate-800 shrink-0 p-8">
                        {topSidebarLogo ? (
                            <img
                                src={topSidebarLogo}
                                alt={brandUser?.brandName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-emerald-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                                {initials}
                            </div>
                        )}
                    </div>

                    {/* Brand Context Header - Simplified for FLX Processor, Context Dropdown for others */}
                    <div className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 border-b border-emerald-800 shrink-0">
                        <div className="flex flex-col gap-1">
                            {/* For FLX Processor: Show simple branding (use dashboard tabs to switch) */}
                            {brandUser?.isProcessor || brandUser?.allowedBrands?.length > 0 ? (
                                <>
                                    <h2 className="font-black text-white text-xl leading-tight">
                                        FLX Extracts
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                        <p className="text-orange-100 text-[10px] font-bold uppercase tracking-[0.1em]">Processor View</p>
                                    </div>
                                    <p className="text-emerald-100/70 text-xs mt-2">
                                        Use Dashboard tabs to switch brands
                                    </p>
                                </>
                            ) : (
                                /* For regular brands: Show brand name or context dropdown if they have multiple brands */
                                <>
                                    <h2 className="font-black text-white text-xl leading-tight" title={brandUser?.brandName}>
                                        {brandUser?.brandName || 'Brand Portal'}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                                        <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.1em]">Partner Dashboard</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1">
                        <NavItem to="/brand" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
                        <NavItem to="/brand/pipeline" icon={<GitBranch size={20} />} label="Pipeline" />
                        <NavItem to="/brand/new-lead" icon={<UserPlus size={20} />} label="New Lead" />
                        <NavItem to="/brand/schedule" icon={<Calendar size={20} />} label="Schedule" />
                        <NavItem to="/brand/map" icon={<Navigation size={20} />} label="Store Map" />
                        <NavItem to="/brand/orders" icon={<ShoppingCart size={20} />} label="Orders" />
                        <NavItem to="/brand/products" icon={<Package size={20} />} label="Products" />
                        <NavItem to="/brand/deals" icon={<Tag size={20} />} label="Deals" />
                        <NavItem to="/brand/invoices/dispensary" icon={<ArrowUpRight size={20} />} label="To Dispensaries" />
                        <NavItem to="/brand/invoices/greentruth" icon={<ArrowDownLeft size={20} />} label="From GreenTruth" />
                        <NavItem to="/brand/menu" icon={<Menu size={20} />} label="Menu Editor" />
                        <NavItem to="/brand/integrations" icon={<Settings size={20} />} label="Integrations" />
                        {(brandUser?.isProcessor || brandUser?.allowedBrands?.length > 0) && (
                            <>
                                {/* TEMPORARILY HIDDEN FOR LAUNCH - Logistics */}
                                {/* <NavItem to="/brand/logistics" icon={<Car size={20} />} label="Logistics" /> */}
                                <NavItem to="/brand/fulfillment" icon={<Package size={20} />} label="Fulfillment" />
                            </>
                        )}
                    </nav>

                    {/* User Section */}
                    <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
                        <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-sidebar-hover)' }}>
                            {brandLogo ? (
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                                    <img src={brandLogo} alt="" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                                    style={{ background: 'var(--accent-primary)', color: 'var(--text-inverse)' }}>
                                    {initials}
                                </div>
                            )}
                            <div className="text-sm overflow-hidden whitespace-nowrap">
                                <p className="font-medium max-w-[120px] truncate" style={{ color: 'var(--text-sidebar)' }}>{brandUser?.brandName}</p>
                                <p className="text-xs truncate max-w-[120px]" style={{ color: 'var(--text-tertiary)' }}>{brandUser?.email}</p>
                            </div>
                        </div>

                        {/* Theme Switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setIsThemeOpen(!isThemeOpen)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors"
                                style={{ background: 'var(--bg-sidebar-hover)', color: 'var(--text-sidebar)' }}
                            >
                                <Palette size={20} />
                                <span className="font-medium text-sm">Theme</span>
                            </button>
                            <ThemeSwitcher isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-sidebar)' }}
                        >
                            <LogOut size={20} />
                            <span className="font-medium text-sm">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 md:ml-64 w-full min-h-screen relative">
                    {/* Ghost Mode Banner */}
                    {isGhost && (
                        <div className="bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-2 text-sm font-bold flex items-center justify-between sticky top-0 md:static z-50">
                            <div className="flex items-center gap-2">
                                <span>👻</span>
                                <span>Ghost Mode Active: Viewing as Admin</span>
                            </div>
                            <button onClick={handleExitGhostMode} className="text-xs underline hover:text-amber-900">
                                Exit
                            </button>
                        </div>
                    )}

                    {/* Mobile Header */}
                    <header className="md:hidden bg-gradient-to-r from-orange-600 to-orange-700 p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
                        <button
                            onClick={() => setIsMoreMenuOpen(true)}
                            className="p-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-white/10"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            {brandLogo && (
                                <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-sm">
                                    <img src={brandLogo} alt="" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <span className="font-bold text-white truncate max-w-[150px]">{brandUser?.brandName}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                            {initials}
                        </div>
                    </header>

                    {/* Mobile Navigation - Admin Style Bottom Nav with More Button */}
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t pb-safe z-40 px-2 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)]" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <MobileNavItem to="/brand" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
                        <MobileNavItem to="/brand/orders" icon={<ShoppingCart size={20} />} label="Orders" />
                        <MobileNavItem to="/brand/schedule" icon={<Calendar size={20} />} label="Schedule" />
                        <MobileNavItem to="/brand/invoices/dispensary" icon={<ArrowUpRight size={20} />} label="Invoices" />
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
                                        <SlideGridItem to="/brand" icon={<LayoutDashboard size={22} />} label="Dashboard" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/pipeline" icon={<GitBranch size={22} className="text-amber-500" />} label="Pipeline" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/products" icon={<Package size={22} className="text-purple-500" />} label="Products" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/map" icon={<Navigation size={22} className="text-orange-500" />} label="Map" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/new-lead" icon={<UserPlus size={22} className="text-emerald-500" />} label="New Lead" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/menu" icon={<Package size={22} className="text-indigo-500" />} label="Menu" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/deals" icon={<Tag size={22} className="text-pink-500" />} label="Deals" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/invoices/greentruth" icon={<ArrowDownLeft size={22} className="text-orange-500" />} label="Invoices" onClick={() => setIsMoreMenuOpen(false)} />
                                        <SlideGridItem to="/brand/integrations" icon={<Settings size={22} className="text-slate-500" />} label="Settings" onClick={() => setIsMoreMenuOpen(false)} />
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="px-4 pb-8 border-t pt-4" style={{ borderColor: 'var(--border-primary)' }}>
                                        {isGhost && (
                                            <button
                                                onClick={() => { setIsMoreMenuOpen(false); handleExitGhostMode(); }}
                                                className="w-full flex items-center justify-center gap-3 p-4 bg-amber-50 text-amber-700 font-bold rounded-2xl hover:bg-amber-100 transition-all border border-amber-100 mb-3"
                                            >
                                                <span>👻</span>
                                                Exit Ghost Mode
                                            </button>
                                        )}
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

                    {/* Page Content */}
                    <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </LayoutTourWrapper>
    );
}

const NavItem = ({ to, icon, label, end }) => {
    return (
        <NavLink
            to={to}
            end={end}
            style={({ isActive }) => ({
                background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                color: isActive ? 'var(--text-sidebar)' : 'var(--text-tertiary)'
            })}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'shadow-md' : 'hover:bg-slate-800 hover:text-white'}`
            }
        >
            <div className="min-w-[20px]">{icon}</div>
            <span className="font-medium whitespace-nowrap overflow-hidden">{label}</span>
        </NavLink>
    );
};

const MobileNavItem = ({ to, icon, label, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors ${isActive ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
            }`
        }
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
);

const MoreMenuItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${isActive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'border-slate-100 text-slate-600 active:bg-slate-50'
            }`
        }
        style={({ isActive }) => ({ background: isActive ? undefined : 'var(--bg-card)' })}
    >
        {React.cloneElement(icon, { size: 24 })}
        <span className="text-[11px] font-bold text-center leading-tight">{label}</span>
    </NavLink>
);

const SlideMenuItem = ({ to, icon, label, onClick }) => (
    <NavLink
        to={to}
        end={to === '/brand'}
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
        end={to === '/brand'}
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
