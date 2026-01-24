import React, { useState, useEffect } from 'react';
import OnboardingTour from './onboarding/OnboardingTour';
import { useOnboarding } from '../hooks/useOnboarding';
import { getTourSteps } from '../data/tourSteps';
import { HelpCircle } from 'lucide-react';

/**
 * Layout Tour Wrapper
 * Wraps a layout with onboarding tour functionality
 * 
 * @param {string} tourType - Type of tour (sales_rep, brand, dispensary, admin)
 * @param {string} userEmail - Current user's email
 * @param {string} userId - Current user's ID
 * @param {React.ReactNode} children - Layout children
 */
export default function LayoutTourWrapper({
    tourType,
    userEmail,
    userId,
    children,
    showReplayButton = false // Default to false - Help is now in Settings pages
}) {
    // Check for skipTour flag SYNCHRONOUSLY before any effects run
    // This ensures dev logins never trigger tours
    const skipTourOnMount = React.useMemo(() => {
        const skip = sessionStorage.getItem('skipTour');
        if (skip) {
            sessionStorage.removeItem('skipTour');
            return true;
        }
        return false;
    }, []); // Only runs once on mount

    const {
        isFirstTime,
        isLoading,
        tourCompleted,
        effectiveTourType,
        completeTour,
        startReplay
    } = useOnboarding(tourType, userEmail, userId);

    const [showTour, setShowTour] = useState(false);
    const [isReplay, setIsReplay] = useState(false);

    // Check for tour trigger from login page (Take Tour button)
    useEffect(() => {
        const triggerTour = sessionStorage.getItem('triggerTour');
        if (triggerTour && triggerTour === tourType) {
            // Clear the trigger immediately
            sessionStorage.removeItem('triggerTour');
            // Start tour after a short delay for page to render
            const timer = setTimeout(() => {
                setShowTour(true);
                setIsReplay(true); // Treat as replay so it always shows
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [tourType]);

    // Start tour for first-time users (unless skipTour flag was set from dev login)
    useEffect(() => {
        // If skipTour was set on mount, never auto-start
        if (skipTourOnMount) {
            return;
        }

        if (!isLoading && isFirstTime && !tourCompleted) {
            // Delay to let the page render
            const timer = setTimeout(() => {
                setShowTour(true);
                setIsReplay(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isFirstTime, tourCompleted, skipTourOnMount]);

    // Get tour steps for the effective tour type
    const steps = getTourSteps(effectiveTourType);

    // Handle tour completion
    const handleComplete = () => {
        setShowTour(false);
        completeTour();
    };

    // Handle replay request
    const handleReplay = () => {
        setIsReplay(true);
        setShowTour(true);
    };

    if (isLoading) {
        return <>{children}</>;
    }

    return (
        <>
            {children}

            {/* Show tour when active */}
            {showTour && (
                <OnboardingTour
                    steps={steps}
                    isFirstTime={!isReplay && isFirstTime}
                    onComplete={handleComplete}
                    tourKey={effectiveTourType}
                />
            )}

            {/* Replay button - positioned at bottom-left corner, subtle and out of the way */}
            {showReplayButton && !showTour && (
                <button
                    onClick={handleReplay}
                    className="fixed bottom-4 left-4 z-30 flex items-center gap-2 px-3 py-2 bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-xl transition-all group"
                    title="Replay Tour"
                >
                    <HelpCircle size={16} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Help</span>
                </button>
            )}
        </>
    );
}
