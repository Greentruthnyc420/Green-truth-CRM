import React from 'react';
import { ShoppingCart } from 'lucide-react';
import AdminOrders from '../../../components/admin/AdminOrders';

/**
 * Admin Orders Page - Allows admins to approve/reject/fulfill sales orders
 * This page wraps the AdminOrders component with a page header
 */
export default function AdminOrdersPage() {
    return (
        <div className="space-y-6 pb-12">
            <header>
                <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <ShoppingCart className="text-brand-600" />
                    Sales Orders
                </h1>
                <p style={{ color: 'var(--text-tertiary)' }}>
                    Review, approve, reject, and fulfill incoming sales orders from reps.
                </p>
            </header>

            <AdminOrders />
        </div>
    );
}
