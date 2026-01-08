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
    GitBranch
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
    const { logout, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const navItems = [
        { path: '/admin', end: true, label: 'Overview', icon: LayoutDashboard },
        { path: '/admin/workflow', label: 'Workflow', icon: CheckSquare },
        { path: '/admin/financials', label: 'Financials', icon: DollarSign },
        { path: '/admin/territory', label: 'Territory', icon: Map },
        { path: '/admin/team', label: 'Team', icon: Users },
        { path: '/admin/pipeline', label: 'Pipeline', icon: GitBranch }, // Was Growth
        { path: '/admin/growth', label: 'Growth', icon: TrendingUp },  // Was Console/Global Export
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
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
                    fixed lg:static top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo Area */}
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2 rounded-lg">
                        <Activity className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">GreenTruth</h1>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">Admin Portal</p>
                    </div>
                    <button
                        className="ml-auto lg:hidden text-slate-400 hover:text-white"
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
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                                ${isActive
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                            `}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Profile / Logout */}
                <div className="p-4 border-t border-white/10 bg-slate-950/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shadow-inner">
                            {currentUser?.email?.substring(0, 2).toUpperCase() || 'AD'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{currentUser?.email}</p>
                            <p className="text-xs text-slate-500">Administrator</p>
                        </div>
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
                        className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-slate-500 hover:text-slate-800"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-slate-800">Admin Portal</span>
                    <div className="w-8" />
                </header>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">
                    <ErrorBoundary key={location.pathname}>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>
        </div>
    );
}
