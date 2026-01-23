/**
 * Mobile Data Service
 * Fetches real data from Supabase for the mobile app
 */
import { supabase } from './supabaseService';

// ==================== REP DATA ====================

/**
 * Get rep dashboard stats
 * @param {string} userId - The rep's user ID
 */
export async function getRepStats(userId) {
    try {
        // Get sales for this rep
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('total_amount, commission_rate, created_at')
            .eq('rep_id', userId);

        if (salesError) console.error('Error fetching sales:', salesError);

        // Get activations for this rep
        const { data: activations, error: activationsError } = await supabase
            .from('activations')
            .select('id, status, activation_date')
            .eq('rep_id', userId);

        if (activationsError) console.error('Error fetching activations:', activationsError);

        // Calculate stats
        const salesList = sales || [];
        const activationsList = activations || [];

        const totalCommission = salesList.reduce((sum, sale) => {
            const amount = sale.total_amount || 0;
            const rate = sale.commission_rate || 0.02;
            return sum + (amount * rate);
        }, 0);

        const totalSales = salesList.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

        // Calculate this month's stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthSales = salesList.filter(s => new Date(s.created_at) >= monthStart);
        const monthPoints = monthSales.length * 50; // 50 points per sale

        // Upcoming activations (pending/confirmed status)
        const upcomingActivations = activationsList.filter(a =>
            a.status === 'pending' || a.status === 'confirmed'
        ).length;

        return {
            lifetimePoints: salesList.length * 50 + activationsList.filter(a => a.status === 'completed').length * 100,
            monthPoints,
            pendingCommission: totalCommission,
            upcomingActivations,
            totalSales,
            salesCount: salesList.length,
            activationsCount: activationsList.length,
        };
    } catch (error) {
        console.error('Error getting rep stats:', error);
        return {
            lifetimePoints: 0,
            monthPoints: 0,
            pendingCommission: 0,
            upcomingActivations: 0,
        };
    }
}

/**
 * Get recent activity for rep dashboard
 * @param {string} userId - The rep's user ID
 * @param {number} limit - Number of items to return
 */
export async function getRepRecentActivity(userId, limit = 5) {
    try {
        // Get recent sales
        const { data: sales } = await supabase
            .from('sales')
            .select('id, dispensary_name, total_amount, created_at')
            .eq('rep_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Get recent activations
        const { data: activations } = await supabase
            .from('activations')
            .select('id, dispensary_name, total_hours, status, created_at')
            .eq('rep_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        // Combine and sort by date
        const activities = [
            ...(sales || []).map(s => ({
                id: s.id,
                type: 'sale',
                title: `Sale logged at ${s.dispensary_name || 'Unknown'}`,
                subtitle: `$${(s.total_amount || 0).toFixed(2)}`,
                date: s.created_at,
                color: '#10b981',
            })),
            ...(activations || []).map(a => ({
                id: a.id,
                type: 'activation',
                title: a.status === 'completed' ? 'Activation completed' : `Activation ${a.status}`,
                subtitle: a.total_hours ? `${a.total_hours} hours` : a.dispensary_name,
                date: a.created_at,
                color: '#3b82f6',
            })),
        ];

        // Sort by date and take top items
        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting recent activity:', error);
        return [];
    }
}

/**
 * Get rep's sales list
 * @param {string} userId - The rep's user ID
 */
export async function getRepSales(userId) {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('rep_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            dispensaryName: s.dispensary_name,
            brandName: s.brand_name,
            amount: s.total_amount || 0,
            commission: (s.total_amount || 0) * (s.commission_rate || 0.02),
            status: s.status || 'completed',
            date: s.sale_date || s.created_at,
            invoiceNumber: s.invoice_number,
        }));
    } catch (error) {
        console.error('Error getting rep sales:', error);
        return [];
    }
}

/**
 * Get rep's activations
 * @param {string} userId - The rep's user ID
 */
export async function getRepActivations(userId) {
    try {
        const { data, error } = await supabase
            .from('activations')
            .select('*')
            .eq('rep_id', userId)
            .order('activation_date', { ascending: false });

        if (error) throw error;

        return (data || []).map(a => ({
            id: a.id,
            brandName: a.brand_name,
            dispensaryName: a.dispensary_name,
            date: a.activation_date,
            hours: a.total_hours || 0,
            miles: a.miles_traveled || 0,
            status: a.status || 'pending',
            region: a.region,
        }));
    } catch (error) {
        console.error('Error getting rep activations:', error);
        return [];
    }
}

// ==================== BRAND DATA ====================

/**
 * Get brand dashboard stats
 * @param {string} brandId - The brand ID
 */
export async function getBrandStats(brandId) {
    try {
        // Get orders for this brand
        const { data: sales } = await supabase
            .from('sales')
            .select('id, total_amount, created_at')
            .eq('brand_id', brandId);

        // Get activations for this brand
        const { data: activations } = await supabase
            .from('activations')
            .select('id')
            .eq('brand_id', brandId);

        // Get deals for this brand
        const { data: deals } = await supabase
            .from('deal_rules')
            .select('id')
            .eq('brand_id', brandId)
            .eq('is_active', true);

        const salesList = sales || [];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthSales = salesList.filter(s => new Date(s.created_at) >= monthStart);
        const monthRevenue = monthSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

        return {
            totalOrders: salesList.length,
            monthRevenue,
            activeDeals: (deals || []).length,
            activationsCount: (activations || []).length,
        };
    } catch (error) {
        console.error('Error getting brand stats:', error);
        return { totalOrders: 0, monthRevenue: 0, activeDeals: 0, activationsCount: 0 };
    }
}

/**
 * Get brand's orders
 * @param {string} brandId - The brand ID
 */
export async function getBrandOrders(brandId) {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('brand_id', brandId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            orderNumber: s.invoice_number || `ORD-${s.id.slice(0, 4)}`,
            dispensaryName: s.dispensary_name,
            amount: s.total_amount || 0,
            status: s.status || 'completed',
            date: s.sale_date || s.created_at,
        }));
    } catch (error) {
        console.error('Error getting brand orders:', error);
        return [];
    }
}

// ==================== DISPENSARY DATA ====================

/**
 * Get dispensary dashboard stats
 * @param {string} dispensaryId - The dispensary ID
 */
export async function getDispensaryStats(dispensaryId) {
    try {
        // Get orders for this dispensary
        const { data: orders } = await supabase
            .from('sales')
            .select('id, total_amount, status, created_at')
            .eq('dispensary_id', dispensaryId);

        const ordersList = orders || [];
        const pendingOrders = ordersList.filter(o =>
            o.status === 'pending' || o.status === 'processing' || o.status === 'shipped'
        ).length;

        const totalSpend = ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);

        return {
            pendingOrders,
            totalSpend,
            savedAmount: totalSpend * 0.02, // Estimate 2% savings
            favoriteBrands: 5, // Placeholder
        };
    } catch (error) {
        console.error('Error getting dispensary stats:', error);
        return { pendingOrders: 0, totalSpend: 0, savedAmount: 0, favoriteBrands: 0 };
    }
}

/**
 * Get dispensary's orders
 * @param {string} dispensaryId - The dispensary ID
 */
export async function getDispensaryOrders(dispensaryId) {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('dispensary_id', dispensaryId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            orderNumber: s.invoice_number || `ORD-${s.id.slice(0, 4)}`,
            brandName: s.brand_name,
            amount: s.total_amount || 0,
            status: s.status || 'completed',
            date: s.sale_date || s.created_at,
            items: s.products?.length || 0,
        }));
    } catch (error) {
        console.error('Error getting dispensary orders:', error);
        return [];
    }
}

/**
 * Get available products for marketplace
 */
export async function getMarketplaceProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, brands(name)')
            .eq('in_stock', true)
            .order('name');

        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            name: p.name,
            brandName: p.brands?.name || p.brand_name || 'Unknown Brand',
            price: p.price || 0,
            category: p.category,
            description: p.description,
            imageUrl: p.image_url,
        }));
    } catch (error) {
        console.error('Error getting marketplace products:', error);
        return [];
    }
}

// ==================== ADMIN DATA ====================

/**
 * Get admin dashboard overview stats
 */
export async function getAdminStats() {
    try {
        // Get counts from various tables
        const [usersResult, leadsResult, salesResult, activationsResult] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('leads').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
            supabase.from('sales').select('id, total_amount', { count: 'exact' }),
            supabase.from('activations').select('id', { count: 'exact', head: true }),
        ]);

        const salesData = salesResult.data || [];
        const totalRevenue = salesData.reduce((sum, s) => sum + (s.total_amount || 0), 0);

        // Get this month's stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data: monthSales } = await supabase
            .from('sales')
            .select('total_amount')
            .gte('created_at', monthStart);

        const monthRevenue = (monthSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);

        return {
            totalUsers: usersResult.count || 0,
            totalLeads: leadsResult.count || 0,
            totalSales: salesResult.count || 0,
            totalActivations: activationsResult.count || 0,
            totalRevenue,
            monthRevenue,
        };
    } catch (error) {
        console.error('Error getting admin stats:', error);
        return { totalUsers: 0, totalLeads: 0, totalSales: 0, totalActivations: 0, totalRevenue: 0, monthRevenue: 0 };
    }
}

/**
 * Get list of all users (reps)
 */
export async function getAllUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(u => ({
            id: u.id,
            name: u.name || u.display_name || 'Unknown',
            email: u.email,
            role: u.role || 'rep',
            status: u.status || 'active',
            phone: u.phone,
            createdAt: u.created_at,
        }));
    } catch (error) {
        console.error('Error getting all users:', error);
        return [];
    }
}

/**
 * Get list of all leads
 */
export async function getAllLeads() {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .neq('status', 'deleted')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(l => ({
            id: l.id,
            dispensaryName: l.dispensary_name,
            address: l.address,
            repAssigned: l.rep_assigned_name,
            leadStatus: l.lead_status,
            status: l.status,
            priority: l.priority,
            createdAt: l.created_at,
        }));
    } catch (error) {
        console.error('Error getting all leads:', error);
        return [];
    }
}

/**
 * Get all sales for admin view
 */
export async function getAllSales() {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(s => ({
            id: s.id,
            dispensaryName: s.dispensary_name,
            brandName: s.brand_name,
            repId: s.rep_id,
            amount: s.total_amount || 0,
            status: s.status || 'completed',
            date: s.sale_date || s.created_at,
            invoiceNumber: s.invoice_number,
        }));
    } catch (error) {
        console.error('Error getting all sales:', error);
        return [];
    }
}

// ==================== TIME HELPERS ====================

export function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}
