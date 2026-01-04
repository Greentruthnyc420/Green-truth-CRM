import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useBrandAuth } from '../contexts/BrandAuthContext';
import { LayoutDashboard, ShoppingCart, FileText, Menu, LogOut, Package, ArrowDownLeft, ArrowUpRight, Navigation } from 'lucide-react';

export default function BrandLayout() {
    const { brandUser, logoutBrand } = useBrandAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutBrand();
        navigate('/brand/login');
    };

    const isGhost = brandUser?.isImpersonating;

    const initials = brandUser?.brandName
        ? brandUser.brandName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : 'BR';

    // Map Brand IDs to Logo Files (Files moved to public/logos/)
    const LOGO_MAP = {
        'wanders': '/logos/partner-1.png',
        'honey-king': '/logos/partner-2.png',
        'waferz': '/logos/partner-3.jpg',
        'canna-dots': '/logos/partner-4.png',
        'space-poppers': '/logos/partner-5.png',
        'smoothie-bar': '/logos/partner-6.png',
        // Fallbacks or others
        'pines': null,
        'bud-cracker': null
    };

    const brandLogo = brandUser?.brandId ? LOGO_MAP[brandUser.brandId] : null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800">
                {/* System Logo Area - Uniform with Sales Portal */}
                <div className="h-64 flex items-center justify-center bg-black overflow-hidden relative border-b border-slate-800 shrink-0">
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-950">
                        <img
                            src="/logos/logo-main.png"
                            alt="The Green Truth"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Brand Context Header - Compact & Emerald */}
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-700 border-b border-emerald-800 shrink-0">
                    <div className="flex flex-row items-center gap-4">
                        {/* Brand Logo or Initials */}
                        {brandLogo ? (
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
                                <img src={brandLogo} alt={brandUser?.brandName} className="w-full h-full object-contain rounded-lg" />
                            </div>
                        ) : (
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner border border-white/10">
                                {initials}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <h2 className="font-bold text-white text-base truncate" title={brandUser?.brandName}>{brandUser?.brandName || 'Brand Portal'}</h2>
                            <p className="text-emerald-200 text-xs truncate">Partner Dashboard</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    <NavItem to="/brand" icon={<LayoutDashboard size={20} />} label="Dashboard" end />
                    <NavItem to="/brand/map" icon={<Navigation size={20} />} label="Store Map" />
                    <NavItem to="/brand/orders" icon={<ShoppingCart size={20} />} label="Orders" />
                    <NavItem to="/brand/invoices/dispensary" icon={<ArrowDownLeft size={20} />} label="Dispensary Inv." />
                    <NavItem to="/brand/invoices/greentruth" icon={<ArrowUpRight size={20} />} label="GreenTruth Inv." />
                    <NavItem to="/brand/menu" icon={<Menu size={20} />} label="Menu Editor" />
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
                        <button onClick={handleLogout} className="text-xs underline hover:text-amber-900">
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
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 px-4 py-2 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <MobileNavItem to="/brand" icon={<LayoutDashboard size={22} />} label="Dashboard" end />
                    <MobileNavItem to="/brand/orders" icon={<ShoppingCart size={22} />} label="Orders" />
                    <MobileNavItem to="/brand/invoices/dispensary" icon={<ArrowDownLeft size={22} />} label="Disp. Inv" />
                    <MobileNavItem to="/brand/menu" icon={<Menu size={22} />} label="Menu" />
                </nav>

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
