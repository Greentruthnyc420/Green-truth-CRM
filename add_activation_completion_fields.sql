-- Add completion tracking fields to activations table
ALTER TABLE public.activations 
    ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS total_hours NUMERIC(4,2),
    ADD COLUMN IF NOT EXISTS miles_traveled NUMERIC(6,2),
    ADD COLUMN IF NOT EXISTS odometer_image_url TEXT,
    ADD COLUMN IF NOT EXISTS toll_amount NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS toll_receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS region TEXT,
    ADD COLUMN IF NOT EXISTS has_vehicle BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add index for querying completed activations
CREATE INDEX IF NOT EXISTS idx_activations_completed 
    ON public.activations(completed_at) 
    WHERE status = 'completed';

-- Add index for querying scheduled activations by rep
CREATE INDEX IF NOT EXISTS idx_activations_rep_scheduled 
    ON public.activations(rep_id, activation_date) 
    WHERE status = 'scheduled';
