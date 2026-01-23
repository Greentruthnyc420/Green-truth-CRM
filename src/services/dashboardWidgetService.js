// Dashboard Widget Settings Service
// Manages user preferences for dashboard widget visibility

import { supabase } from './supabaseClient';

const DEFAULT_WIDGETS = {
    salesOverview: { visible: true, order: 0 },
    recentSales: { visible: true, order: 1 },
    topDispensaries: { visible: true, order: 2 },
    upcomingActivations: { visible: true, order: 3 },
    commissionTracker: { visible: true, order: 4 },
    leaderboard: { visible: true, order: 5 },
    teamPerformance: { visible: true, order: 6 },
    revenueChart: { visible: true, order: 7 }
};

const STORAGE_KEY = 'dashboard_widget_settings';

/**
 * Get widget settings for a user
 */
export async function getWidgetSettings(userId) {
    try {
        // Try to get from Supabase first
        const { data, error } = await supabase
            .from('user_preferences')
            .select('dashboard_widgets')
            .eq('user_id', userId)
            .single();

        if (data?.dashboard_widgets) {
            return { ...DEFAULT_WIDGETS, ...data.dashboard_widgets };
        }

        // Fall back to localStorage
        const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
        if (stored) {
            return { ...DEFAULT_WIDGETS, ...JSON.parse(stored) };
        }

        return DEFAULT_WIDGETS;
    } catch (err) {
        console.warn('[WidgetSettings] Failed to load:', err);
        return DEFAULT_WIDGETS;
    }
}

/**
 * Save widget settings for a user
 */
export async function saveWidgetSettings(userId, settings) {
    try {
        // Save to localStorage for immediate access
        localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(settings));

        // Save to Supabase for cross-device sync
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: userId,
                dashboard_widgets: settings,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;

        return true;
    } catch (err) {
        console.warn('[WidgetSettings] Failed to save:', err);
        return false;
    }
}

/**
 * Toggle a widget's visibility
 */
export async function toggleWidget(userId, widgetId, visible) {
    const current = await getWidgetSettings(userId);
    const updated = {
        ...current,
        [widgetId]: { ...current[widgetId], visible }
    };
    return saveWidgetSettings(userId, updated);
}

/**
 * Reset to default settings
 */
export async function resetWidgetSettings(userId) {
    return saveWidgetSettings(userId, DEFAULT_WIDGETS);
}

/**
 * Get list of available widgets with labels
 */
export function getAvailableWidgets() {
    return [
        { id: 'salesOverview', label: 'Sales Overview', description: 'Total sales, revenue, and key metrics' },
        { id: 'recentSales', label: 'Recent Sales', description: 'Latest sales activity' },
        { id: 'topDispensaries', label: 'Top Dispensaries', description: 'Best performing accounts' },
        { id: 'upcomingActivations', label: 'Upcoming Activations', description: 'Scheduled activations calendar' },
        { id: 'commissionTracker', label: 'Commission Tracker', description: 'Your earnings progress' },
        { id: 'leaderboard', label: 'Leaderboard', description: 'Team ranking and competition' },
        { id: 'teamPerformance', label: 'Team Performance', description: 'Team sales metrics (managers)' },
        { id: 'revenueChart', label: 'Revenue Chart', description: 'Revenue trends over time' }
    ];
}
