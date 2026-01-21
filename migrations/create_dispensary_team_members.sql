-- Migration: Create dispensary_team_members table
-- This table allows dispensaries to add team members with different roles
-- Each team member can have specific notification preferences

CREATE TABLE IF NOT EXISTS dispensary_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensary_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'buyer', 'inventory', 'viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
    invited_by TEXT NOT NULL,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_members_dispensary ON dispensary_team_members(dispensary_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON dispensary_team_members(email);

-- Enable Row Level Security
ALTER TABLE dispensary_team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for dispensary owners and team members
CREATE POLICY "Dispensary owners can manage their team"
ON dispensary_team_members
FOR ALL
USING (auth.uid()::text = dispensary_id OR auth.uid()::text = invited_by)
WITH CHECK (auth.uid()::text = dispensary_id OR auth.uid()::text = invited_by);

-- Policy: Allow team members to see their own record
CREATE POLICY "Team members can view their own record"
ON dispensary_team_members
FOR SELECT
USING (auth.jwt() ->> 'email' = email);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_dispensary_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_team_members_timestamp
    BEFORE UPDATE ON dispensary_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_dispensary_team_members_updated_at();

-- Also extend notification_preferences for dispensary-specific preferences
-- Add columns if they don't exist
DO $$
BEGIN
    -- Add dispensary notification columns if notification_preferences exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        BEGIN
            ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS activation_scheduled BOOLEAN DEFAULT TRUE;
            ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS activation_confirmed BOOLEAN DEFAULT TRUE;
            ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS order_approved BOOLEAN DEFAULT TRUE;
            ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS order_shipped BOOLEAN DEFAULT TRUE;
            ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS invoice_ready BOOLEAN DEFAULT TRUE;
            ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS notification_email TEXT;
        EXCEPTION WHEN OTHERS THEN
            -- Columns may already exist, ignore errors
            NULL;
        END;
    END IF;
END $$;
