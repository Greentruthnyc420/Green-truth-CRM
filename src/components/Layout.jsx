import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, History, PlusCircle, Car, Users, DollarSign, ShieldCheck, FileText, Trophy, LogOut, Building2, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ADMIN_EMAILS = ['omar@thegreentruthnyc.com', 'realtest@test.com', 'omar@gmail.com'];

const Sidebar = ({ isCollapsed, toggleSidebar, currentUser }) => {
    const { logout } = useAuth();
    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());
    const initials = currentUser?.displayName
        ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : (currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'U');

    const handleLogout = async () => {
        try {
            await logout();
            // The AuthContext will likely handle the redirect to login, 
            // but we can ensure navigation happens if needed.
            window.location.href = '/login';
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-24' : 'w-64'} bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto border-r border-slate-800 transition-all duration-300`}>
            {/* Increased logo area from h-24/h-80 to h-40/h-120 */}
            <div
                onClick={toggleSidebar}
                className={`p-0 ${isCollapsed ? 'h-24' : 'h-64'} flex items-center justify-center bg-black overflow-hidden relative border-b border-slate-800 cursor-pointer group transition-all duration-300`}
            >
                {/* Brand Logo Area - Increased size and using transparent light version */}
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

                {isAdmin && (
                    <>
                        <div className={`pt-4 pb-1 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-opacity duration-300 ${isCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>
                            Admin
                        </div>

                        <NavItem to="/app/admin" icon={<ShieldCheck size={20} />} label="Admin Console" isCollapsed={isCollapsed} />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-3">
                <div className={`flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-sm font-bold min-w-[2rem]">
                        {initials}
                    </div>
                    {!isCollapsed && (
                        <div className="text-sm overflow-hidden whitespace-nowrap">
                            <p className="font-medium text-white">{currentUser?.displayName || (isAdmin ? 'Omar' : 'Sales Representative')}</p>
                            <p className="text-slate-400 text-xs truncate">{currentUser?.email || 'Ambassador'}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                    title="Sign Out"
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="font-medium text-sm">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};

const BottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40 px-4 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <MobileNavItem to="/app" icon={<LayoutDashboard size={22} />} label="Home" />
        <MobileNavItem to="/app/history" icon={<History size={22} />} label="History" />

        {/* Floating Action Button for main actions */}
        <div className="relative -top-5">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group">
                <NavLink
                    to="/app/log-shift"
                    className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-colors"
                >
                    <PlusCircle size={28} />
                </NavLink>
            </div>
        </div>

        <MobileNavItem to="/app/new-lead" icon={<Users size={22} />} label="Leads" />
        <MobileNavItem to="/app/log-sale" icon={<DollarSign size={22} />} label="Sales" />
    </nav>
);

const NavItem = ({ to, icon, label, isCollapsed }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`
        }
        title={isCollapsed ? label : ''}
    >
        <div className="min-w-[20px]">{icon}</div>
        {!isCollapsed && <span className="font-medium whitespace-nowrap overflow-hidden">{label}</span>}
    </NavLink>
);

const MobileNavItem = ({ to, icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-lg transition-colors min-h-[60px] ${isActive
                ? 'text-brand-600'
                : 'text-slate-400 hover:text-slate-600'
            }`
        }
    >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
);

export default function Layout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const { currentUser } = useAuth();

    // Calculate initials for mobile header too
    const initials = currentUser?.displayName
        ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : (currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'U');


    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                currentUser={currentUser}
            />

            <main className={`flex-1 ${isSidebarCollapsed ? 'md:ml-24' : 'md:ml-64'} w-full min-h-screen relative transition-all duration-300`}>
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
                    {/* Increased mobile header logo from h-10 to h-20 */}
                    <div className="flex items-center gap-3">
                        <img src="/logos/logo-main.png" alt="Company Logo" className="h-16 w-auto object-contain" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {initials}
                    </div>
                </header>

                <div className="p-4 md:p-8 pb-32 md:pb-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>


            </main>

            <BottomNav />
            <BottomNav />
        </div>
    );
}
