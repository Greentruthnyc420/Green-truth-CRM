-- Migration: Create notification_preferences table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    user_type TEXT DEFAULT 'rep', -- 'rep', 'brand', 'admin', 'dispensary'
    
    -- Sales Rep preferences
    notify_lead_assigned BOOLEAN DEFAULT true,
    notify_activation_approved BOOLEAN DEFAULT true,
    notify_activation_reminder BOOLEAN DEFAULT true,
    notify_payment_processed BOOLEAN DEFAULT true,
    
    -- Brand/Processor preferences  
    notify_new_order BOOLEAN DEFAULT true,
    notify_activation_request BOOLEAN DEFAULT true,
    notify_activation_completed BOOLEAN DEFAULT true,
    notify_invoice_ready BOOLEAN DEFAULT true,
    notify_low_inventory BOOLEAN DEFAULT false,
    
    -- Admin preferences
    notify_new_lead BOOLEAN DEFAULT true,
    notify_new_sale BOOLEAN DEFAULT true,
    notify_new_user BOOLEAN DEFAULT true,
    notify_partnership_inquiry BOOLEAN DEFAULT true,
    notify_daily_summary BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_email ON notification_preferences(email);

-- Enable RLS (Row Level Security)
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update their own preferences
CREATE POLICY "Users can manage own notification prefs" ON notification_preferences
    FOR ALL USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_notification_prefs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_prefs_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_prefs_timestamp();
