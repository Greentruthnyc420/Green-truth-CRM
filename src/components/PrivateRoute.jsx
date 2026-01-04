import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute() {
    const { currentUser } = useAuth();

    // Note: In a real app, you might want a loading state in AuthContext 
    // to prevent redirecting while auth is initializing.
    // Assuming AuthContext handles this or returns null initially.

    return currentUser ? <Outlet /> : <Navigate to="/login" />;
}
