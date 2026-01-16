-- ============================================================
-- Minimal: Add Only Completion Fields
-- No assumptions about existing columns
-- ============================================================

-- Add completion tracking fields
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS total_hours NUMERIC(4,2);
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS miles_traveled NUMERIC(6,2);
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS odometer_image_url TEXT;
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS toll_amount NUMERIC(10,2);
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS toll_receipt_url TEXT;
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS has_vehicle BOOLEAN DEFAULT true;
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Also add status column if it doesn't exist
ALTER TABLE public.activations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';

-- Show final table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activations'
ORDER BY ordinal_position;
