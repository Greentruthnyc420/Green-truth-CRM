-- ============================================================
-- Complete Activations Table Setup
-- This script creates the table if it doesn't exist and adds
-- all necessary columns for shift/activation completion tracking
-- ============================================================

-- Create activations table with ALL fields
CREATE TABLE IF NOT EXISTS public.activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core activation info
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    dispensary_id TEXT,
    dispensary_name TEXT NOT NULL,
    rep_id TEXT,
    rep_name TEXT,
    activation_date DATE NOT NULL,
    activation_type TEXT DEFAULT 'sampling',
    status TEXT DEFAULT 'scheduled',
    
    -- Completion tracking (for when shift is logged)
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_hours NUMERIC(4,2),
    miles_traveled NUMERIC(6,2),
    odometer_image_url TEXT,
    toll_amount NUMERIC(10,2),
    toll_receipt_url TEXT,
    region TEXT,
    has_vehicle BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ,
    
    -- Financial
    invoice_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    
    -- Metadata
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Completion fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='start_time') THEN
        ALTER TABLE public.activations ADD COLUMN start_time TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='end_time') THEN
        ALTER TABLE public.activations ADD COLUMN end_time TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='total_hours') THEN
        ALTER TABLE public.activations ADD COLUMN total_hours NUMERIC(4,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='miles_traveled') THEN
        ALTER TABLE public.activations ADD COLUMN miles_traveled NUMERIC(6,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='odometer_image_url') THEN
        ALTER TABLE public.activations ADD COLUMN odometer_image_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='toll_amount') THEN
        ALTER TABLE public.activations ADD COLUMN toll_amount NUMERIC(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='toll_receipt_url') THEN
        ALTER TABLE public.activations ADD COLUMN toll_receipt_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='region') THEN
        ALTER TABLE public.activations ADD COLUMN region TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='has_vehicle') THEN
        ALTER TABLE public.activations ADD COLUMN has_vehicle BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='activations' AND column_name='completed_at') THEN
        ALTER TABLE public.activations ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activations_brand_id ON public.activations(brand_id);
CREATE INDEX IF NOT EXISTS idx_activations_dispensary ON public.activations(dispensary_name);
CREATE INDEX IF NOT EXISTS idx_activations_date ON public.activations(activation_date);
CREATE INDEX IF NOT EXISTS idx_activations_rep_id ON public.activations(rep_id);
CREATE INDEX IF NOT EXISTS idx_activations_status ON public.activations(status);
CREATE INDEX IF NOT EXISTS idx_activations_completed ON public.activations(completed_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_activations_rep_scheduled ON public.activations(rep_id, activation_date) WHERE status = 'scheduled';

-- Enable RLS
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.activations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.activations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.activations;

-- Create policies
CREATE POLICY "Enable read access for all users" 
    ON public.activations FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.activations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" 
    ON public.activations FOR UPDATE 
    USING (auth.role() = 'authenticated');
