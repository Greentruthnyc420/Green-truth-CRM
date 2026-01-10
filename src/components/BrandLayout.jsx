import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useBrandAuth } from '../contexts/BrandAuthContext';
import { LayoutDashboard, ShoppingCart, FileText, Menu, LogOut, Package, ArrowDownLeft, ArrowUpRight, Navigation, Calendar, UserPlus, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrandLayout() {
    const { brandUser, logoutBrand, switchBrand } = useBrandAuth();
    const navigate = useNavigate();

    const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

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

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800">
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

                {/* Brand Context Header - Enhanced Legibility (Logo Removed per User Request) */}
                <div className="p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 border-b border-emerald-800 shrink-0">
                    <div className="flex flex-col gap-1">
                        {brandUser?.allowedBrands && brandUser.allowedBrands.length > 0 ? (
                            <div className="relative">
                                <label className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1 block">Context</label>
                                <select
                                    value={brandUser.brandId}
                                    onChange={(e) => switchBrand(e.target.value)}
                                    className="w-full bg-emerald-900/40 text-white font-bold text-sm rounded-lg border border-emerald-500/50 p-2 focus:ring-2 focus:ring-white/20 outline-none appearance-none cursor-pointer hover:bg-emerald-900/60 transition-colors"
                                >
                                    {/* Current Brand / Root Brand */}
                                    <option value={brandUser.brandId} className="bg-slate-800 text-white">{brandUser.brandName}</option>

                                    {/* Other Available Brands */}
                                    {brandUser.allowedBrands
                                        .filter(b => b.brandId !== brandUser.brandId) // Don't show current again
                                        .map(b => (
                                            <option key={b.brandId} value={b.brandId} className="bg-slate-800 text-white">
                                                {b.brandName}
                                            </option>
                                        ))}

                                    {/* If currently in sub-brand, offer switch back to root license (if distinct) */}
                                    {/* This is handled by allowedBrands array in logic, but let's trust the array for now. Logic in AuthContext handles root fallback. */}
                                </select>
                                <div className="absolute right-3 bottom-3 pointer-events-none text-emerald-200">
                                    <ArrowDownLeft size={12} className="rotate-[-45deg]" />
                                </div>
                            </div>
                        ) : (
                            <h2 className="font-black text-white text-xl leading-tight" title={brandUser?.brandName}>
                                {brandUser?.brandName || 'Brand Portal'}
                            </h2>
                        )}

                        {!brandUser?.allowedBrands && (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.1em]">Partner Dashboard</p>
                            </div>
                        )}
                        {brandUser?.allowedBrands && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                <p className="text-orange-100 text-[10px] font-bold uppercase tracking-[0.1em]">Processor View</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <NavItem to="/brand" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
                    <NavItem to="/brand/new-lead" icon={<UserPlus size={20} />} label="New Lead" />
                    <NavItem to="/brand/schedule" icon={<Calendar size={20} />} label="Schedule" />
                    <NavItem to="/brand/map" icon={<Navigation size={20} />} label="Store Map" />
                    <NavItem to="/brand/orders" icon={<ShoppingCart size={20} />} label="Orders" />
                    <NavItem to="/brand/invoices/dispensary" icon={<ArrowDownLeft size={20} />} label="Dispensary Inv." />
                    <NavItem to="/brand/invoices/greentruth" icon={<ArrowUpRight size={20} />} label="GreenTruth Inv." />
                    <NavItem to="/brand/menu" icon={<Menu size={20} />} label="Menu Editor" />
                    <NavItem to="/brand/integrations" icon={<Settings size={20} />} label="Integrations" />
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-slate-800 space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                        {brandLogo ? (
                            <div className="w-8 h-8 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
                                <img src={brandLogo} alt="" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold shadow-sm">
                                {initials}
                            </div>
                        )}
                        <div className="text-sm overflow-hidden whitespace-nowrap">
                            <p className="font-medium text-white max-w-[120px] truncate">{brandUser?.brandName}</p>
                            <p className="text-slate-400 text-xs truncate max-w-[120px]">{brandUser?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
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

                {/* Mobile Header - Orange */}
                <header className="md:hidden bg-gradient-to-r from-orange-600 to-orange-700 p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
                    <div className="flex items-center gap-3">
                        {brandLogo ? (
                            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shadow-sm">
                                <img src={brandLogo} alt="" className="w-full h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                                {initials}
                            </div>
                        )}
                        <span className="font-bold text-white truncate max-w-[200px]">{brandUser?.brandName}</span>
                    </div>
                </header>

                {/* Mobile Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 px-4 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <MobileNavItem to="/brand" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
                    <MobileNavItem to="/brand/orders" icon={<ShoppingCart size={20} />} label="Orders" />
                    <MobileNavItem to="/brand/invoices/dispensary" icon={<ArrowDownLeft size={20} />} label="Disp. Inv" />

                    <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-400 hover:text-emerald-700 transition-colors"
                    >
                        <Menu size={20} />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </nav>

                {/* More Menu Slide-up / Overlay */}
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
                                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[70] md:hidden p-6 max-h-[85vh] overflow-y-auto shadow-2xl"
                            >
                                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl font-bold text-slate-800">Brand Menu</h2>
                                    <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pb-8">
                                    <MoreMenuItem to="/brand/new-lead" icon={<UserPlus className="text-emerald-500" />} label="New Lead" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/brand/schedule" icon={<Calendar className="text-blue-500" />} label="Schedule" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/brand/map" icon={<Navigation className="text-orange-500" />} label="Store Map" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/brand/menu" icon={<Menu className="text-indigo-500" />} label="Menu Editor" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/brand/invoices/greentruth" icon={<ArrowUpRight className="text-emerald-600" />} label="GT Invoices" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/brand/integrations" icon={<Settings className="text-purple-500" />} label="Integrations" onClick={() => setIsMoreMenuOpen(false)} />
                                </div>

                                <div className="border-t border-slate-100 pt-6 mt-2 flex flex-col gap-3">
                                    {isGhost && (
                                        <button
                                            onClick={() => { setIsMoreMenuOpen(false); handleExitGhostMode(); }}
                                            className="w-full flex items-center justify-center gap-3 p-4 bg-amber-50 text-amber-700 font-bold rounded-2xl hover:bg-amber-100 transition-all border border-amber-100"
                                        >
                                            <span>👻</span>
                                            Exit Ghost Mode
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setIsMoreMenuOpen(false); handleLogout(); }}
                                        className="w-full flex items-center justify-center gap-3 p-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"
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
    );
}

const NavItem = ({ to, icon, label, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-orange-600 text-white shadow-md shadow-orange-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
        }
    >
        <div className="min-w-[20px]">{icon}</div>
        <span className="font-medium whitespace-nowrap overflow-hidden">{label}</span>
    </NavLink>
);

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
                : 'bg-white border-slate-100 text-slate-600 active:bg-slate-50'
            }`
        }
    >
        {React.cloneElement(icon, { size: 24 })}
        <span className="text-[11px] font-bold text-center leading-tight">{label}</span>
    </NavLink>
);
