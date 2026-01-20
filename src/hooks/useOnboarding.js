import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// Special users who should always get a tour on next login
// (Currently disabled - only first-time users get automatic tour)
const FORCE_TOUR_EMAILS = [
    // Add emails here to force tour for specific users (training purposes)
    // 'alyssa@thegreentruthnyc.com',  // Social Media Manager
    // 'omar@thegreentruthnyc.com',     // Super Admin (Omar)
];

/**
 * Hook to manage onboarding tour state
 * @param {string} tourType - Type of tour (sales_rep, brand, dispensary, admin, super_admin, social_manager)
 * @param {string} userEmail - Current user's email
 * @param {string} userId - Current user's ID
 */
export function useOnboarding(tourType, userEmail, userId) {
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [tourCompleted, setTourCompleted] = useState(false);

    // Determine effective tour type based on email
    const getEffectiveTourType = useCallback(() => {
        if (userEmail === 'alyssa@thegreentruthnyc.com') {
            return 'social_manager';
        }
        if (userEmail === 'omar@thegreentruthnyc.com') {
            return 'super_admin';
        }
        return tourType;
    }, [userEmail, tourType]);

    // Check if user should see tour
    useEffect(() => {
        async function checkOnboardingStatus() {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                // Check localStorage first for quick response
                const localKey = `onboarding_${getEffectiveTourType()}_${userId}`;
                const localCompleted = localStorage.getItem(localKey);

                // Check if this user should ALWAYS get a tour (for testing/training)
                const forceNewTour = FORCE_TOUR_EMAILS.includes(userEmail?.toLowerCase());

                if (forceNewTour) {
                    // Clear any existing completion status for forced users
                    localStorage.removeItem(localKey);
                    setIsFirstTime(true);
                    setTourCompleted(false);
                    setIsLoading(false);
                    return;
                }

                if (localCompleted === 'true') {
                    setTourCompleted(true);
                    setIsFirstTime(false);
                    setIsLoading(false);
                    return;
                }

                // Check Supabase for persistent state
                const { data, error } = await supabase
                    .from('user_onboarding')
                    .select('completed_tours')
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                    console.warn('Error fetching onboarding status:', error);
                }

                const completedTours = data?.completed_tours || [];
                const effectiveTour = getEffectiveTourType();

                if (completedTours.includes(effectiveTour)) {
                    setTourCompleted(true);
                    setIsFirstTime(false);
                    localStorage.setItem(localKey, 'true');
                } else {
                    setIsFirstTime(true);
                    setTourCompleted(false);
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
                // Default to showing tour on error
                setIsFirstTime(true);
            } finally {
                setIsLoading(false);
            }
        }

        checkOnboardingStatus();
    }, [userId, userEmail, getEffectiveTourType]);

    // Mark tour as complete
    const completeTour = useCallback(async () => {
        if (!userId) return;

        const effectiveTour = getEffectiveTourType();
        const localKey = `onboarding_${effectiveTour}_${userId}`;

        // Update localStorage immediately
        localStorage.setItem(localKey, 'true');
        setTourCompleted(true);
        setIsFirstTime(false);

        // Remove from force list after completion
        // (They can still replay manually)

        try {
            // Upsert to Supabase
            const { data: existing } = await supabase
                .from('user_onboarding')
                .select('completed_tours')
                .eq('user_id', userId)
                .single();

            const currentTours = existing?.completed_tours || [];

            if (!currentTours.includes(effectiveTour)) {
                const updatedTours = [...currentTours, effectiveTour];

                await supabase
                    .from('user_onboarding')
                    .upsert({
                        user_id: userId,
                        completed_tours: updatedTours,
                        last_completed_at: new Date().toISOString()
                    }, {
                        onConflict: 'user_id'
                    });
            }
        } catch (error) {
            console.error('Error saving onboarding completion:', error);
            // Already saved to localStorage, so user won't see it again
        }
    }, [userId, getEffectiveTourType]);

    // Reset tour (for replay functionality)
    const resetTour = useCallback(() => {
        const effectiveTour = getEffectiveTourType();
        const localKey = `onboarding_${effectiveTour}_${userId}`;
        localStorage.removeItem(localKey);
        setIsFirstTime(false); // Not first time, but allowing replay
        setTourCompleted(false);
    }, [userId, getEffectiveTourType]);

    // Start a manual replay
    const startReplay = useCallback(() => {
        setIsFirstTime(false); // Replay = skippable
        setTourCompleted(false);
    }, []);

    return {
        isFirstTime,
        isLoading,
        tourCompleted,
        effectiveTourType: getEffectiveTourType(),
        completeTour,
        resetTour,
        startReplay
    };
}

export default useOnboarding;
