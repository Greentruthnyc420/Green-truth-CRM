import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, LogOut, Store, Menu, X, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

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
                        label="Switch to App"
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
            <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
                {/* Mobile Top Bar */}
                <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
                    <span className="font-bold text-slate-800">Admin Portal</span>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -mr-2 text-slate-600"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

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
