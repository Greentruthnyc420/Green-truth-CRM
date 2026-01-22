import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, ADMIN_EMAILS, isTrialEmail } from '../contexts/AuthContext';

export default function PrivateRoute() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    // Check if user has valid email:
    // 1. Admin emails (hardcoded list)
    // 2. Official @thegreentruthnyc.com domain
    // 3. Trial emails: [name].thegreentruthnyc@gmail.com
    const email = currentUser?.email?.toLowerCase();
    const isValidEmail = currentUser && (
        ADMIN_EMAILS.includes(email) ||
        email?.endsWith('@thegreentruthnyc.com') ||
        isTrialEmail(email)
    );

    if (!currentUser || !isValidEmail) {
        return <Navigate to="/login" />;
    }

    return <Outlet />;
}
