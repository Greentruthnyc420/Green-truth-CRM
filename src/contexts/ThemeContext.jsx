import React, { createContext, useContext, useState, useEffect } from 'react';

// Available themes
export const THEMES = {
    classic: {
        id: 'classic',
        name: 'Classic',
        description: 'Light green professional theme',
        icon: '☀️'
    },
    darkGold: {
        id: 'dark-gold',
        name: 'Dark Gold',
        description: 'Luxury black & gold',
        icon: '🏆'
    },
    midnightTeal: {
        id: 'midnight-teal',
        name: 'Midnight Teal',
        description: 'Futuristic navy & cyan',
        icon: '🌊'
    },
    noirEmerald: {
        id: 'noir-emerald',
        name: 'Noir Emerald',
        description: 'Premium black & green',
        icon: '💎'
    }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Load saved theme from localStorage or default to classic
        const saved = localStorage.getItem('app-theme');
        return saved || 'classic';
    });

    useEffect(() => {
        // Apply theme class to document root
        const root = document.documentElement;

        // Remove all theme classes
        root.classList.remove('theme-classic', 'theme-dark-gold', 'theme-midnight-teal', 'theme-noir-emerald');

        // Add current theme class
        root.classList.add(`theme-${theme}`);

        // Save to localStorage
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const value = {
        theme,
        setTheme,
        themes: THEMES,
        isDark: theme !== 'classic'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
