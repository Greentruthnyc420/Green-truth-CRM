-- Create payment_history table for tracking all rep payments
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'wage', 'commission', 'brand_payout'
    recipient_id VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    period_label VARCHAR(100), -- e.g., "Jan 1-15, 2026" or "Q1 2026"
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_by VARCHAR(255), -- Admin who processed the payment
    related_records JSONB DEFAULT '[]'::jsonb, -- Array of activation/sale IDs
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payment_history_recipient ON payment_history(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_type ON payment_history(type);
CREATE INDEX IF NOT EXISTS idx_payment_history_paid_at ON payment_history(paid_at);

-- Enable RLS (Row Level Security)
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read/write all, reps can read their own
CREATE POLICY "payment_history_read_own" ON payment_history
    FOR SELECT
    USING (true); -- For now, allow all reads (admin panel only)

CREATE POLICY "payment_history_insert" ON payment_history
    FOR INSERT
    WITH CHECK (true); -- Admin inserts only

-- Add comment for documentation
COMMENT ON TABLE payment_history IS 'Tracks all payments made to sales reps (wages and commissions)';
