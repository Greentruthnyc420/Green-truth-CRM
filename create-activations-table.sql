-- First, drop the existing incomplete activations table
DROP TABLE IF EXISTS public.activations CASCADE;

-- Create the complete activations table with ALL required columns
CREATE TABLE public.activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core activation info
    brand_id TEXT,
    brand_name TEXT NOT NULL,
    dispensary_id TEXT,
    dispensary_name TEXT NOT NULL,
    rep_id TEXT,
    rep_name TEXT,  
    activation_date DATE NOT NULL DEFAULT CURRENT_DATE,
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

-- Create indexes
CREATE INDEX idx_activations_brand_id ON public.activations(brand_id);
CREATE INDEX idx_activations_dispensary ON public.activations(dispensary_name);
CREATE INDEX idx_activations_date ON public.activations(activation_date);
CREATE INDEX idx_activations_rep_id ON public.activations(rep_id);
CREATE INDEX idx_activations_status ON public.activations(status);
CREATE INDEX idx_activations_completed ON public.activations(completed_at) WHERE status = 'completed';

-- Enable RLS
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

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

-- Verify table was created
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'activations'
ORDER BY ordinal_position;
