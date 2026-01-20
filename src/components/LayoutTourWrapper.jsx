import React, { useState, useEffect } from 'react';
import OnboardingTour, { TourTriggerButton } from './onboarding/OnboardingTour';
import { useOnboarding } from '../hooks/useOnboarding';
import { getTourSteps } from '../data/tourSteps';

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
    showReplayButton = true
}) {
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

    // Start tour for first-time users
    useEffect(() => {
        if (!isLoading && isFirstTime && !tourCompleted) {
            // Delay to let the page render
            const timer = setTimeout(() => {
                setShowTour(true);
                setIsReplay(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isFirstTime, tourCompleted]);

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

            {/* Replay button (shown in a floating position when tour is completed) */}
            {showReplayButton && tourCompleted && !showTour && (
                <div className="fixed bottom-24 right-6 z-40">
                    <TourTriggerButton onClick={handleReplay} />
                </div>
            )}
        </>
    );
}
