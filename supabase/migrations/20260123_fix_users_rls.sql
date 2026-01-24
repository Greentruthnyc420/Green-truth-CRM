-- Fix RLS policies for users table
-- This migration ensures users can:
-- 1. Create their own profile on signup
-- 2. View all users (for team roster/leaderboard)
-- 3. Update their own profile

-- First, ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow all for users" ON users;

-- Create permissive policy for users table (allows all operations for now)
-- This is needed because Firebase Auth handles authentication, not Supabase Auth
-- The anon key just needs basic CRUD access
CREATE POLICY "Allow all for users" ON users 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Add any missing columns that might be needed
DO $$ 
BEGIN
    -- Add is_blocked column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_blocked') THEN
        ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT false;
    END IF;
    
    -- Add updated_at column if missing  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add lifetime_points column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'lifetime_points') THEN
        ALTER TABLE users ADD COLUMN lifetime_points DECIMAL(12,3) DEFAULT 0;
    END IF;
    
    -- Add current_month_points column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'current_month_points') THEN
        ALTER TABLE users ADD COLUMN current_month_points DECIMAL(12,3) DEFAULT 0;
    END IF;
END $$;

-- Grant permissions to anon role (what the publishable key uses)
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT USAGE ON SCHEMA public TO anon;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Log that migration was applied
COMMENT ON TABLE users IS 'User profiles synced from Firebase Auth - RLS policies updated 2026-01-23';
