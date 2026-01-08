import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function DispensaryPrivateRoute() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <Loader className="animate-spin text-emerald-600" size={40} />
            </div>
        );
    }

    // Check if logged in and if the role is 'dispensary'
    // Developer bypass for localhost/dev
    const isDevMode = import.meta.env.DEV || window.location.hostname === 'localhost';

    return (currentUser || isDevMode) ? <Outlet /> : <Navigate to="/dispensary/login" />;
}
