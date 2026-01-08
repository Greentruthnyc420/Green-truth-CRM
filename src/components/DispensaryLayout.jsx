import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, LogOut, Building2, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DispensaryLayout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/dispensary/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
                <div className="p-8 border-b border-slate-50">
                    <img src="/logos/logo-main.png" alt="Logo" className="h-12 w-auto object-contain" />
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <DispensaryNavItem to="/dispensary" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <DispensaryNavItem to="/dispensary/marketplace" icon={<ShoppingBag size={20} />} label="Marketplace" />

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

            {/* Mobile Nav */}
            <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
                <img src="/logos/logo-main.png" alt="Logo" className="h-10 w-auto" />
                <div className="flex items-center gap-3">
                    <button className="p-2 text-slate-400"><Bell size={20} /></button>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                        {currentUser?.displayName?.[0] || 'D'}
                    </div>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-8 pb-24">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 px-2 py-2 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <MobileNavItem to="/dispensary" icon={<LayoutDashboard size={22} />} label="Dashboard" />
                <MobileNavItem to="/dispensary/marketplace" icon={<ShoppingBag size={22} />} label="Shop" />

                <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-400">
                    <LogOut size={22} />
                    <span className="text-[10px] font-medium">Exit</span>
                </button>
            </nav>
        </div>
    );
}

const DispensaryNavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        end
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'
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
