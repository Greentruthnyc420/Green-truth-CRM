import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, LogOut, Store, Menu, X, ArrowLeftRight, Settings, ShieldCheck, Map, Calendar, History, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    // Close sidebar on navigation on mobile
    useEffect(() => {
        if (window.innerWidth <= 768) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/admin/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans">
            {/* Mobile Overlay */}
            {isSidebarOpen && window.innerWidth <= 768 && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-50
                ${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'} flex flex-col overflow-hidden`}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-between border-b border-slate-800 p-4">
                    <div className="flex items-center justify-center flex-1">
                        {isSidebarOpen ? (
                            <span className="text-xl font-bold text-white tracking-wider">ADMIN PORTAL</span>
                        ) : (
                            <span className="text-xl font-bold text-white md:block hidden">AP</span>
                        )}
                    </div>
                    {isSidebarOpen && window.innerWidth <= 768 && (
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1">
                    <AdminNavItem
                        to="/admin"
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        isOpen={isSidebarOpen}
                        end={true}
                    />

                    <div className="pt-4 mt-4 border-t border-slate-800 opacity-50">
                        {isSidebarOpen && <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Internal Tools</p>}
                    </div>

                    <AdminNavItem
                        to="/app"
                        icon={<ArrowLeftRight size={20} />}
                        label="Switch to GT App"
                        isOpen={isSidebarOpen}
                    />

                    <AdminNavItem
                        to="/admin/integrations"
                        icon={<Settings size={20} />}
                        label="Integrations"
                        isOpen={isSidebarOpen}
                    />
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-slate-800">
                    <div className={`flex items-center gap-3 ${(!isSidebarOpen && window.innerWidth > 768) && 'justify-center'}`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
                            {currentUser?.email?.[0].toUpperCase() || 'A'}
                        </div>
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-white truncate">{currentUser?.email}</p>
                                <p className="text-xs text-slate-500">Administrator</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className={`mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${(!isSidebarOpen && window.innerWidth > 768) && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'} relative`}>
                {/* Mobile Top Bar */}
                <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
                    <span className="font-bold text-white tracking-widest uppercase text-sm">Admin Portal</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                        {currentUser?.email?.[0].toUpperCase() || 'A'}
                    </div>
                </div>

                <div className="p-4 md:p-8 pb-24 md:pb-8">
                    <Outlet />
                </div>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 px-4 py-2 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <MobileNavLink icon={<LayoutDashboard size={20} />} label="Dash" to="/admin" end />
                    <MobileNavLink icon={<Users size={20} />} label="Leads" to="/admin/leads" />

                    <div className="relative -top-4">
                        <NavLink
                            to="/app/log-sale"
                            className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/40 border-4 border-white active:scale-95 transition-all"
                        >
                            <PlusCircle size={28} />
                        </NavLink>
                    </div>

                    <MobileNavLink icon={<Store size={20} />} label="Brands" to="/admin/brands" />

                    <button
                        onClick={() => setIsMoreMenuOpen(true)}
                        className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-slate-400 hover:text-indigo-600 transition-colors"
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
                                    <h2 className="text-xl font-bold text-slate-800">Admin Control</h2>
                                    <button onClick={() => setIsMoreMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pb-8">
                                    <MoreMenuItem to="/app/map" icon={<Map className="text-indigo-500" />} label="Lead Map" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/admin/integrations" icon={<Settings className="text-purple-500" />} label="Integrations" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/app/schedule" icon={<Calendar className="text-blue-500" />} label="Schedule" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/app/history" icon={<History className="text-slate-500" />} label="History" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/app" icon={<ArrowLeftRight className="text-emerald-500" />} label="Field App" onClick={() => setIsMoreMenuOpen(false)} />
                                    <MoreMenuItem to="/admin/users" icon={<ShieldCheck className="text-red-500" />} label="Sys Admin" onClick={() => setIsMoreMenuOpen(false)} />
                                </div>

                                <div className="border-t border-slate-100 pt-6 mt-2 flex flex-col gap-3">
                                    <button
                                        onClick={() => { setIsMoreMenuOpen(false); handleLogout(); }}
                                        className="w-full flex items-center justify-center gap-3 p-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all font-sans"
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
    );
}

function MobileNavLink({ to, icon, label, end = false }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-1 px-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'
                }`
            }
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
        className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${isActive
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-white border-slate-100 text-slate-600 active:bg-slate-50'
            }`
        }
    >
        {React.cloneElement(icon, { size: 24 })}
        <span className="text-[11px] font-bold text-center leading-tight">{label}</span>
    </NavLink>
);

function AdminNavItem({ to, icon, label, isOpen, end = false }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                } ${!isOpen && 'justify-center'}`
            }
        >
            <div className={`transition-transform duration-200 ${!isOpen && 'group-hover:scale-110'}`}>
                {icon}
            </div>
            {isOpen && <span className="font-medium">{label}</span>}
        </NavLink>
    );
}
