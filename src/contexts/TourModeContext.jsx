import React, { createContext, useContext, useState, useCallback } from 'react';
import demoData, { enableTourMode, disableTourMode, isTourMode as checkTourMode } from '../data/demoData';

/**
 * TourModeContext - Provides demo data when in tour/demo mode
 * Dashboards can use this to show impressive mock data during tours
 */
const TourModeContext = createContext(null);

export function TourModeProvider({ children }) {
    const [isActive, setIsActive] = useState(checkTourMode());

    const startTourMode = useCallback(() => {
        enableTourMode();
        setIsActive(true);
    }, []);

    const endTourMode = useCallback(() => {
        disableTourMode();
        setIsActive(false);
    }, []);

    // Helper to get data - returns demo data in tour mode, otherwise null
    const getTourData = useCallback((key) => {
        if (!isActive) return null;
        return demoData[key] || null;
    }, [isActive]);

    const value = {
        isTourMode: isActive,
        startTourMode,
        endTourMode,
        getTourData,
        demoData: isActive ? demoData : null
    };

    return (
        <TourModeContext.Provider value={value}>
            {children}
        </TourModeContext.Provider>
    );
}

export function useTourMode() {
    const context = useContext(TourModeContext);
    if (!context) {
        // Return safe defaults if used outside provider
        return {
            isTourMode: false,
            startTourMode: () => { },
            endTourMode: () => { },
            getTourData: () => null,
            demoData: null
        };
    }
    return context;
}

export default TourModeContext;
