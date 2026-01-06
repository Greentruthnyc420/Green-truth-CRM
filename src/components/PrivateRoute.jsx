import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';

export default function PrivateRoute() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    const isOrgEmail = currentUser && (
        ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()) ||
        currentUser.email?.toLowerCase().endsWith('@thegreentruthnyc.com')
    );

    if (!currentUser || !isOrgEmail) {
        return <Navigate to="/login" />;
    }

    return <Outlet />;
}
