import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';

/**
 * OnboardingRoute - Wrapper that checks if user has completed onboarding
 * Redirects to /onboarding if onboarding_complete is false
 */
export default function OnboardingRoute() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [checkComplete, setCheckComplete] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        async function checkOnboardingStatus() {
            if (!currentUser?.uid) {
                setCheckComplete(true);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('onboarding_complete, role')
                    .eq('id', currentUser.uid)
                    .single();

                if (error) {
                    console.warn('Error checking onboarding status:', error);
                    setCheckComplete(true);
                    return;
                }

                // Only require onboarding for sales reps, not admins or dispensaries
                const requiresOnboarding = data?.role === 'rep' && !data?.onboarding_complete;
                setNeedsOnboarding(requiresOnboarding);
            } catch (err) {
                console.error('Onboarding check failed:', err);
            } finally {
                setCheckComplete(true);
            }
        }

        checkOnboardingStatus();
    }, [currentUser?.uid]);

    // Show loading while checking
    if (!checkComplete) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Redirect to onboarding if needed
    if (needsOnboarding && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
