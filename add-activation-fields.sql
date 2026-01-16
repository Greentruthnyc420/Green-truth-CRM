-- ============================================================
-- Add Completion Fields to Existing Activations Table
-- This script only ADDS missing columns, doesn't recreate the table
-- ============================================================

-- Add completion tracking fields (only if they don't exist)
DO $$ 
BEGIN
    -- Check and add start_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'start_time'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN start_time TIMESTAMPTZ;
        RAISE NOTICE 'Added column: start_time';
    END IF;
    
    -- Check and add end_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'end_time'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN end_time TIMESTAMPTZ;
        RAISE NOTICE 'Added column: end_time';
    END IF;
    
    -- Check and add total_hours
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'total_hours'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN total_hours NUMERIC(4,2);
        RAISE NOTICE 'Added column: total_hours';
    END IF;
    
    -- Check and add miles_traveled
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'miles_traveled'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN miles_traveled NUMERIC(6,2);
        RAISE NOTICE 'Added column: miles_traveled';
    END IF;
    
    -- Check and add odometer_image_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'odometer_image_url'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN odometer_image_url TEXT;
        RAISE NOTICE 'Added column: odometer_image_url';
    END IF;
    
    -- Check and add toll_amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'toll_amount'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN toll_amount NUMERIC(10,2);
        RAISE NOTICE 'Added column: toll_amount';
    END IF;
    
    -- Check and add toll_receipt_url
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'toll_receipt_url'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN toll_receipt_url TEXT;
        RAISE NOTICE 'Added column: toll_receipt_url';
    END IF;
    
    -- Check and add region
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'region'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN region TEXT;
        RAISE NOTICE 'Added column: region';
    END IF;
    
    -- Check and add has_vehicle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'has_vehicle'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN has_vehicle BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added column: has_vehicle';
    END IF;
    
    -- Check and add completed_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activations' 
        AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.activations ADD COLUMN completed_at TIMESTAMPTZ;
        RAISE NOTICE 'Added column: completed_at';
    END IF;
    
    RAISE NOTICE 'Activation completion fields setup complete!';
END $$;

-- Create indexes for the new fields (safe - will skip if exists)
CREATE INDEX IF NOT EXISTS idx_activations_completed 
    ON public.activations(completed_at) 
    WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_activations_rep_scheduled 
    ON public.activations(rep_id, activation_date) 
    WHERE status = 'scheduled';

-- Verify: Show current table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activations'
ORDER BY ordinal_position;
