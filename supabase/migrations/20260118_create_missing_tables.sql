-- Create all missing tables for the GreenTruth CRM
-- Run this in your Supabase SQL Editor

-- 1. SAMPLE_REQUESTS - Track sample delivery requests
CREATE TABLE IF NOT EXISTS sample_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    dispensary_name VARCHAR(255),
    brand_id VARCHAR(255),
    brand_name VARCHAR(255),
    products JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, delivered, cancelled
    requested_by VARCHAR(255),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ORDERS - Track dispensary orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dispensary_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    dispensary_name VARCHAR(255),
    brand_id VARCHAR(255),
    brand_name VARCHAR(255),
    rep_id VARCHAR(255),
    products JSONB DEFAULT '[]'::jsonb,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, shipped, delivered, paid
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PAYMENT_HISTORY - Track all payments to reps
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'wage', 'commission', 'brand_payout'
    recipient_id VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    period_label VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_by VARCHAR(255),
    related_records JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACTIVITY_LOGS - Track user actions for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- 'login', 'sale_created', 'activation_completed', etc.
    entity_type VARCHAR(100), -- 'sale', 'lead', 'activation', etc.
    entity_id VARCHAR(255),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SECURITY_LOGS - Track security events
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL, -- 'login_success', 'login_failed', 'password_reset', etc.
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. DRIVERS - Track delivery drivers (for logistics)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    license_number VARCHAR(100),
    brand_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, inactive
    vehicle_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. VEHICLES - Track delivery vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    license_plate VARCHAR(50),
    vin VARCHAR(50),
    color VARCHAR(50),
    brand_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, inactive
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sample_requests_lead ON sample_requests(lead_id);
CREATE INDEX IF NOT EXISTS idx_sample_requests_status ON sample_requests(status);
CREATE INDEX IF NOT EXISTS idx_orders_dispensary ON orders(dispensary_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_recipient ON payment_history(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON payment_history(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_brand ON drivers(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand_id);

-- Enable RLS on all tables
ALTER TABLE sample_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust based on your security needs)
CREATE POLICY "Allow all for sample_requests" ON sample_requests FOR ALL USING (true);
CREATE POLICY "Allow all for orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for payment_history" ON payment_history FOR ALL USING (true);
CREATE POLICY "Allow all for activity_logs" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all for security_logs" ON security_logs FOR ALL USING (true);
CREATE POLICY "Allow all for drivers" ON drivers FOR ALL USING (true);
CREATE POLICY "Allow all for vehicles" ON vehicles FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE sample_requests IS 'Tracks sample delivery requests from dispensaries';
COMMENT ON TABLE orders IS 'Tracks dispensary orders and their lifecycle';
COMMENT ON TABLE payment_history IS 'Audit trail for all payments made to reps';
COMMENT ON TABLE activity_logs IS 'User activity audit trail';
COMMENT ON TABLE security_logs IS 'Security event logging';
COMMENT ON TABLE drivers IS 'Delivery driver management';
COMMENT ON TABLE vehicles IS 'Delivery vehicle management';
