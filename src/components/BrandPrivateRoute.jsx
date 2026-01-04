import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useBrandAuth } from '../contexts/BrandAuthContext';

export default function BrandPrivateRoute() {
    const { brandUser } = useBrandAuth();
    const location = useLocation();

    if (!brandUser) {
        // Redirect to brand login, preserving the intended destination
        return <Navigate to="/brand/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
