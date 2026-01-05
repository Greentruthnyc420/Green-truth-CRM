import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ADMIN_EMAILS } from '../contexts/AuthContext';
import { useBrandAuth } from '../contexts/BrandAuthContext';

export default function BrandPrivateRoute() {
    const { brandUser } = useBrandAuth();
    const { currentUser } = useAuth();
    const location = useLocation();

    const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

    if (!brandUser) {
        if (isAdmin) {
            // If admin hits this without a ghost user, send them to dashboard to select one
            return <Navigate to="/app/admin" state={{ from: location }} replace />;
        }
        // Redirect to brand login, preserving the intended destination
        return <Navigate to="/brand/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
