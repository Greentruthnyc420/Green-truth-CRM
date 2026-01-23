// Audit Logging Service
// Logs key actions for compliance and security tracking

import { supabase } from './supabaseClient';

/**
 * Audit log event types
 */
export const AUDIT_EVENTS = {
    // Authentication
    LOGIN: 'auth.login',
    LOGOUT: 'auth.logout',
    PASSWORD_RESET: 'auth.password_reset',

    // Sales
    SALE_CREATED: 'sale.created',
    SALE_UPDATED: 'sale.updated',
    SALE_DELETED: 'sale.deleted',

    // Leads/Dispensaries
    LEAD_CREATED: 'lead.created',
    LEAD_UPDATED: 'lead.updated',
    LEAD_DELETED: 'lead.deleted',

    // Activations
    ACTIVATION_SCHEDULED: 'activation.scheduled',
    ACTIVATION_COMPLETED: 'activation.completed',
    ACTIVATION_CANCELLED: 'activation.cancelled',

    // Invoices
    INVOICE_CREATED: 'invoice.created',
    INVOICE_SENT: 'invoice.sent',
    INVOICE_PAID: 'invoice.paid',

    // Admin actions
    USER_ROLE_CHANGED: 'admin.role_change',
    SETTINGS_UPDATED: 'admin.settings_update',
    DATA_EXPORTED: 'admin.data_export',

    // Brand actions
    ORDER_APPROVED: 'brand.order_approved',
    ORDER_REJECTED: 'brand.order_rejected',
    PRODUCT_UPDATED: 'brand.product_updated'
};

/**
 * Log an audit event
 * @param {string} eventType - Type of event (use AUDIT_EVENTS constants)
 * @param {object} details - Event-specific details
 * @param {string} userId - User who performed the action
 * @param {string} targetId - Optional ID of affected resource
 */
export async function logAuditEvent(eventType, details = {}, userId = null, targetId = null) {
    try {
        const logEntry = {
            event_type: eventType,
            user_id: userId,
            target_id: targetId,
            details: details,
            ip_address: null, // Can be captured server-side if needed
            user_agent: navigator.userAgent || null,
            timestamp: new Date().toISOString()
        };

        const { error } = await supabase
            .from('audit_logs')
            .insert([logEntry]);

        if (error) throw error;

        console.log('[Audit]', eventType, targetId || '');
        return true;
    } catch (err) {
        // Don't break app flow if audit logging fails
        console.warn('[Audit] Failed to log event:', err);
        return false;
    }
}

/**
 * Get audit logs with filters
 * @param {object} filters - Query filters
 */
export async function getAuditLogs(filters = {}) {
    try {
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters.eventType) {
            query = query.eq('event_type', filters.eventType);
        }
        if (filters.startDate) {
            query = query.gte('timestamp', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('timestamp', filters.endDate);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    } catch (err) {
        console.error('[Audit] Failed to get logs:', err);
        return [];
    }
}

/**
 * Convenience wrapper for common audit actions
 */
export const audit = {
    login: (userId, details = {}) =>
        logAuditEvent(AUDIT_EVENTS.LOGIN, details, userId),

    logout: (userId) =>
        logAuditEvent(AUDIT_EVENTS.LOGOUT, {}, userId),

    saleCreated: (userId, saleId, details = {}) =>
        logAuditEvent(AUDIT_EVENTS.SALE_CREATED, details, userId, saleId),

    leadCreated: (userId, leadId, details = {}) =>
        logAuditEvent(AUDIT_EVENTS.LEAD_CREATED, details, userId, leadId),

    activationScheduled: (userId, activationId, details = {}) =>
        logAuditEvent(AUDIT_EVENTS.ACTIVATION_SCHEDULED, details, userId, activationId),

    roleChanged: (adminId, targetUserId, newRole, oldRole) =>
        logAuditEvent(AUDIT_EVENTS.USER_ROLE_CHANGED, { newRole, oldRole }, adminId, targetUserId),

    dataExported: (userId, exportType, details = {}) =>
        logAuditEvent(AUDIT_EVENTS.DATA_EXPORTED, { exportType, ...details }, userId)
};
