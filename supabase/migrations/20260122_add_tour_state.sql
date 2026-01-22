-- Add first_tour_completed flag to admin_brands table
-- This tracks whether a brand has completed their mandatory onboarding tour

ALTER TABLE admin_brands ADD COLUMN IF NOT EXISTS first_tour_completed BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_brands_first_tour ON admin_brands(first_tour_completed);

-- Comment for documentation
COMMENT ON COLUMN admin_brands.first_tour_completed IS 'Tracks if brand has completed their mandatory first-time onboarding tour';
