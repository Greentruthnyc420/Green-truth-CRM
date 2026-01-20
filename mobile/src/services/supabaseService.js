import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration for mobile
// Use the same credentials as web app
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wlcqrgkvkcmewepbxwfh.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsY3FyZ2t2a2NtZXdlcGJ4d2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0ODY2NTksImV4cCI6MjA1MDA2MjY1OX0.TNBwLbKwBhQFzyRNXaGFHb-dIYLEPnhYWx4WNKqVv3A';

// Create Supabase client with AsyncStorage for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Deal rules functions (matching web dealService)
export const getDealRules = async (brandId = null) => {
    try {
        let query = supabase
            .from('deal_rules')
            .select('*')
            .eq('is_active', true);

        if (brandId) {
            query = query.eq('brand_id', brandId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching deal rules:', error);
            return [];
        }

        // Parse tiers if stored as JSON string
        return (data || []).map(rule => ({
            ...rule,
            tiers: typeof rule.tiers === 'string' ? JSON.parse(rule.tiers) : rule.tiers
        }));
    } catch (error) {
        console.error('Error in getDealRules:', error);
        return [];
    }
};

// Calculate applicable deals (simplified version for mobile)
export const calculateApplicableDeals = async (brandId, cartItems, paymentMethod = 'cod') => {
    const rules = await getDealRules(brandId);
    const applicableDeals = [];

    for (const rule of rules) {
        if (rule.rule_type === 'tiered_cod_discount' && paymentMethod === 'cod' && rule.tiers) {
            // Calculate total cases
            const totalCases = cartItems.reduce((sum, item) => {
                const caseSize = item.caseSize || 1;
                return sum + Math.ceil(item.quantity / caseSize);
            }, 0);

            // Find applicable tier
            const sortedTiers = [...rule.tiers].sort((a, b) => b.minCases - a.minCases);
            const applicableTier = sortedTiers.find(tier => totalCases >= tier.minCases);

            if (applicableTier) {
                applicableDeals.push({
                    ...rule,
                    appliedDiscount: applicableTier.discountPercent,
                    appliedTier: applicableTier,
                });
            }
        }
    }

    return applicableDeals;
};

export default supabase;
