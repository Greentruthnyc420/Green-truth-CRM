import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function AdminPrivateRoute() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

    if (!currentUser) {
        return <Navigate to="/admin/login" />;
    }

    if (!isAdmin) {
        // Redirect non-admins to the login page so they see the "Access Denied" state
        return <Navigate to="/admin/login" />;
    }

    return <Outlet />;
}
