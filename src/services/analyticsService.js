import { supabase } from './supabaseClient';

/**
 * Analytics Service - Aggregates real-time data for AI chatbot consumption
 * Provides comprehensive context for smarter AI responses
 */

/**
 * Get comprehensive brand analytics for AI context
 * @param {string} brandId - The brand's ID
 * @returns {Object} - Full analytics context for AI
 */
export async function getBrandAnalytics(brandId) {
    if (!brandId) return getEmptyBrandContext();

    try {
        // Fetch all data in parallel for performance
        const [
            salesResult,
            activationsResult,
            ordersResult,
            invoicesResult
        ] = await Promise.all([
            supabase.from('sales').select('*').eq('brand_id', brandId).order('created_at', { ascending: false }),
            supabase.from('activations').select('*').or(`brand_id.eq.${brandId},brandId.eq.${brandId}`).order('created_at', { ascending: false }),
            supabase.from('orders').select('*').eq('brand_id', brandId).order('created_at', { ascending: false }),
            supabase.from('invoices').select('*').or(`brand_id.eq.${brandId},brandId.eq.${brandId}`)
        ]);

        const sales = salesResult.data || [];
        const activations = activationsResult.data || [];
        const orders = ordersResult.data || [];
        const invoices = invoicesResult.data || [];

        // Calculate key metrics
        const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || s.totalAmount || 0), 0);
        const totalOrders = orders.length + sales.length;
        const unitsSold = sales.reduce((sum, s) => sum + (s.quantity || s.units || 1), 0);

        // Get unique dispensaries reached
        const dispensaries = new Set([
            ...sales.map(s => s.dispensary_id || s.dispensaryId).filter(Boolean),
            ...activations.map(a => a.dispensary_id || a.dispensaryId).filter(Boolean)
        ]);
        const storeReach = dispensaries.size;

        // Outstanding invoices
        const unpaidInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
        const outstandingInvoices = unpaidInvoices.reduce((sum, i) => sum + (i.total_amount || i.total || 0), 0);

        // Top products (from sales data)
        const productSales = {};
        sales.forEach(sale => {
            const products = sale.products || sale.items || {};
            Object.values(products).forEach(p => {
                const name = p.name || 'Unknown';
                if (!productSales[name]) productSales[name] = { name, units: 0, revenue: 0 };
                productSales[name].units += p.quantity || 1;
                productSales[name].revenue += (p.total || p.price || 0);
            });
        });
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(p => ({ name: p.name, units: p.units, revenue: p.revenue }));

        // Upcoming activations
        const today = new Date().toISOString().split('T')[0];
        const upcomingActivations = activations
            .filter(a => {
                const date = a.activation_date || a.date || '';
                return date >= today && a.status !== 'cancelled';
            })
            .slice(0, 5)
            .map(a => ({
                date: a.activation_date || a.date,
                dispensaryName: a.dispensary_name || a.dispensaryName,
                repName: a.rep_name || a.repName,
                status: a.status
            }));

        // Recent activations (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const recentActivations = activations.filter(a => {
            const date = a.activation_date || a.date || '';
            return date >= thirtyDaysAgo;
        });

        // Month-over-month growth calculation
        const thisMonth = new Date().getMonth();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const thisYear = new Date().getFullYear();
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const thisMonthSales = sales.filter(s => {
            const date = new Date(s.created_at);
            return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
        }).reduce((sum, s) => sum + (s.total_amount || s.totalAmount || 0), 0);

        const lastMonthSales = sales.filter(s => {
            const date = new Date(s.created_at);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        }).reduce((sum, s) => sum + (s.total_amount || s.totalAmount || 0), 0);

        let monthOverMonthGrowth = 'N/A';
        if (lastMonthSales > 0) {
            const growth = ((thisMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1);
            monthOverMonthGrowth = `${growth >= 0 ? '+' : ''}${growth}%`;
        } else if (thisMonthSales > 0) {
            monthOverMonthGrowth = '+100% (new growth)';
        }

        // Generate trend insights
        const recentTrends = generateTrendInsights({
            thisMonthSales,
            lastMonthSales,
            recentActivations: recentActivations.length,
            totalActivations: activations.length,
            unpaidInvoiceCount: unpaidInvoices.length
        });

        return {
            brandId,
            brandName: brandId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            totalRevenue,
            totalOrders,
            unitsSold,
            storeReach,
            outstandingInvoices,
            unpaidInvoiceCount: unpaidInvoices.length,
            topProducts,
            upcomingActivations,
            recentActivationCount: recentActivations.length,
            totalActivations: activations.length,
            monthOverMonthGrowth,
            recentTrends,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('[Analytics] Error fetching brand analytics:', error);
        return getEmptyBrandContext();
    }
}

/**
 * Get comprehensive dispensary analytics for AI context
 * @param {string} dispensaryId - The dispensary's ID
 * @returns {Object} - Full analytics context for AI
 */
export async function getDispensaryAnalytics(dispensaryId) {
    if (!dispensaryId) return getEmptyDispensaryContext();

    try {
        const [ordersResult, invoicesResult, activationsResult] = await Promise.all([
            supabase.from('orders').select('*').eq('dispensary_id', dispensaryId).order('created_at', { ascending: false }),
            supabase.from('invoices').select('*').eq('dispensary_id', dispensaryId),
            supabase.from('activations').select('*').or(`dispensary_id.eq.${dispensaryId},dispensaryId.eq.${dispensaryId}`)
        ]);

        const orders = ordersResult.data || [];
        const invoices = invoicesResult.data || [];
        const activations = activationsResult.data || [];

        // Calculate metrics
        const totalSpend = orders.reduce((sum, o) => sum + (o.total_amount || o.totalAmount || 0), 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'Pending Approval').length;

        // Outstanding balance
        const unpaidInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
        const outstandingBalance = unpaidInvoices.reduce((sum, i) => sum + (i.total_amount || i.total || 0), 0);

        // Brands ordered from
        const brandsOrdered = [...new Set(orders.map(o => o.brand_id || o.brandId).filter(Boolean))];

        // Recent orders
        const recentOrders = orders.slice(0, 5).map(o => ({
            id: o.id,
            brandName: o.brand_name || o.brandName,
            total: o.total_amount || o.totalAmount || 0,
            status: o.status,
            date: o.created_at
        }));

        // Upcoming activations at this dispensary
        const today = new Date().toISOString().split('T')[0];
        const upcomingActivations = activations
            .filter(a => (a.activation_date || a.date || '') >= today)
            .slice(0, 3)
            .map(a => ({
                date: a.activation_date || a.date,
                brandName: a.brand_name || a.brandName,
                repName: a.rep_name || a.repName
            }));

        return {
            dispensaryId,
            totalSpend,
            totalOrders,
            pendingOrders,
            outstandingBalance,
            unpaidInvoiceCount: unpaidInvoices.length,
            brandsOrdered,
            recentOrders,
            upcomingActivations,
            averageOrderValue: totalOrders > 0 ? totalSpend / totalOrders : 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('[Analytics] Error fetching dispensary analytics:', error);
        return getEmptyDispensaryContext();
    }
}

/**
 * Get comprehensive sales rep analytics for AI context
 * @param {string} repId - The sales rep's user ID
 * @returns {Object} - Full analytics context for AI
 */
export async function getSalesRepAnalytics(repId) {
    if (!repId) return getEmptySalesRepContext();

    try {
        const [salesResult, leadsResult, activationsResult, profileResult] = await Promise.all([
            supabase.from('sales').select('*').eq('created_by', repId).order('created_at', { ascending: false }),
            supabase.from('leads').select('*').eq('rep_assigned', repId),
            supabase.from('activations').select('*').or(`rep_id.eq.${repId},repId.eq.${repId}`).order('created_at', { ascending: false }),
            supabase.from('users').select('*').eq('id', repId).single()
        ]);

        const sales = salesResult.data || [];
        const leads = leadsResult.data || [];
        const activations = activationsResult.data || [];
        const profile = profileResult.data || {};

        // Calculate earnings
        const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || s.totalAmount || 0), 0);
        const commission = totalSales * 0.02; // 2% commission
        const activationCount = activations.length;

        // Lead stats
        const activeLeads = leads.filter(l => l.status === 'active' || l.status === 'Active');
        const convertedLeads = leads.filter(l => l.status === 'converted' || l.status === 'Converted');

        // Recent sales
        const recentSales = sales.slice(0, 5).map(s => ({
            dispensaryName: s.dispensary_name || s.dispensaryName,
            amount: s.total_amount || s.totalAmount || 0,
            date: s.created_at,
            brandName: s.brand_name || s.brandName
        }));

        // Upcoming activations
        const today = new Date().toISOString().split('T')[0];
        const upcomingActivations = activations
            .filter(a => (a.activation_date || a.date || '') >= today)
            .slice(0, 5)
            .map(a => ({
                date: a.activation_date || a.date,
                dispensaryName: a.dispensary_name || a.dispensaryName,
                brandName: a.brand_name || a.brandName
            }));

        // Calculate hourly rate based on active accounts
        const activeAccountCount = convertedLeads.length;
        const hourlyRate = Math.min(20 + Math.floor(activeAccountCount / 10), 30);

        return {
            repId,
            repName: profile.name || profile.legal_first_name || 'Sales Rep',
            totalSales,
            commission,
            activationCount,
            leadCount: leads.length,
            activeLeadCount: activeLeads.length,
            convertedLeadCount: convertedLeads.length,
            conversionRate: leads.length > 0 ? ((convertedLeads.length / leads.length) * 100).toFixed(1) + '%' : '0%',
            hourlyRate,
            recentSales,
            upcomingActivations,
            lifetimePoints: profile.lifetime_points || 0,
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('[Analytics] Error fetching sales rep analytics:', error);
        return getEmptySalesRepContext();
    }
}

// Helper: Generate trend insights text
function generateTrendInsights({ thisMonthSales, lastMonthSales, recentActivations, totalActivations, unpaidInvoiceCount }) {
    const insights = [];

    if (thisMonthSales > lastMonthSales && lastMonthSales > 0) {
        insights.push('📈 Sales trending upward this month');
    } else if (thisMonthSales < lastMonthSales && lastMonthSales > 0) {
        insights.push('📉 Sales down from last month - consider more activations');
    }

    if (recentActivations > 3) {
        insights.push(`✅ Strong activation activity (${recentActivations} in last 30 days)`);
    } else if (totalActivations > 0 && recentActivations === 0) {
        insights.push('⚠️ No recent activations - schedule more pop-ups');
    }

    if (unpaidInvoiceCount > 2) {
        insights.push(`💰 ${unpaidInvoiceCount} unpaid invoices - follow up on collections`);
    }

    return insights.length > 0 ? insights.join('\n') : 'No significant trends to report';
}

// Empty context fallbacks
function getEmptyBrandContext() {
    return {
        brandName: 'Your Brand',
        totalRevenue: 0,
        totalOrders: 0,
        unitsSold: 0,
        storeReach: 0,
        outstandingInvoices: 0,
        topProducts: [],
        upcomingActivations: [],
        monthOverMonthGrowth: 'N/A',
        recentTrends: 'No data available yet. Start by making sales or scheduling activations!'
    };
}

function getEmptyDispensaryContext() {
    return {
        totalSpend: 0,
        totalOrders: 0,
        pendingOrders: 0,
        outstandingBalance: 0,
        brandsOrdered: [],
        recentOrders: [],
        upcomingActivations: [],
        averageOrderValue: 0
    };
}

function getEmptySalesRepContext() {
    return {
        repName: 'Sales Rep',
        totalSales: 0,
        commission: 0,
        activationCount: 0,
        leadCount: 0,
        convertedLeadCount: 0,
        conversionRate: '0%',
        hourlyRate: 20,
        recentSales: [],
        upcomingActivations: [],
        lifetimePoints: 0
    };
}
