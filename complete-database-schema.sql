-- ============================================================
-- Green Truth CRM - Complete Database Schema
-- This creates all core tables: activations, leads, and sales
-- Designed to work across all brands
-- ============================================================

-- ============================================================
-- TABLE: activations (includes shift completion tracking)
-- ============================================================
DROP TABLE IF EXISTS public.activations CASCADE;

CREATE TABLE public.activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core activation/shift info
    brand_id TEXT,
    brand_name TEXT NOT NULL,
    dispensary_id TEXT,
    dispensary_name TEXT NOT NULL,
    rep_id TEXT,
    rep_name TEXT,
    activation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activation_type TEXT DEFAULT 'sampling', -- sampling, walk-in, scheduled, etc.
    status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled
    
    -- Shift completion tracking (populated when logging a shift)
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    total_hours NUMERIC(4,2),
    miles_traveled NUMERIC(6,2),
    odometer_image_url TEXT,
    toll_amount NUMERIC(10,2),
    toll_receipt_url TEXT,
    region TEXT, -- NYC, LI, UPSTATE
    has_vehicle BOOLEAN DEFAULT true,
    completed_at TIMESTAMPTZ,
    
    -- Financial
    invoice_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending', -- pending, paid
    
    -- Metadata
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: leads
-- ============================================================
DROP TABLE IF EXISTS public.leads CASCADE;

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dispensary info
    dispensary_name TEXT NOT NULL,
    license_number TEXT,
    address TEXT,
    contacts JSONB DEFAULT '[]'::jsonb, -- Array of contact objects
    
    -- Lead management
    priority TEXT DEFAULT 'Normal', -- Low, Normal, High
    assigned_ambassador_id TEXT, -- User ID of assigned rep
    rep_assigned_name TEXT,
    owner_brand_id TEXT, -- Which brand owns this lead
    
    -- Brand relationships
    samples_requested JSONB DEFAULT '[]'::jsonb, -- Array of brand IDs
    active_brands JSONB DEFAULT '[]'::jsonb, -- Array of brand IDs they carry
    
    -- Lead progression
    lead_status TEXT DEFAULT 'prospect', -- prospect, samples_requested, samples_delivered, active
    meeting_date DATE,
    first_order_date DATE,
    
    -- Metadata
    notes TEXT,
    location TEXT,
    license_image_url TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: sales
-- ============================================================
DROP TABLE IF EXISTS public.sales CASCADE;

CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Transaction info
    rep_id TEXT NOT NULL,
    rep_name TEXT,
    dispensary_name TEXT NOT NULL,
    dispensary_id TEXT,
    
    -- Brand info
    brand_name TEXT,
    brand_id TEXT,
    
    -- Product details
    products JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {sku, name, quantity, price, etc}
    
    -- Financial
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission_earned NUMERIC(10,2) DEFAULT 0,
    commission_rate NUMERIC(5,4) DEFAULT 0.02, -- 2% default
    
    -- Status
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'completed', -- completed, pending, cancelled
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

-- Activations indexes
CREATE INDEX idx_activations_brand_id ON public.activations(brand_id);
CREATE INDEX idx_activations_brand_name ON public.activations(brand_name);
CREATE INDEX idx_activations_dispensary ON public.activations(dispensary_name);
CREATE INDEX idx_activations_date ON public.activations(activation_date);
CREATE INDEX idx_activations_rep_id ON public.activations(rep_id);
CREATE INDEX idx_activations_status ON public.activations(status);
CREATE INDEX idx_activations_completed ON public.activations(completed_at) WHERE status = 'completed';
CREATE INDEX idx_activations_region ON public.activations(region);

-- Leads indexes
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_assigned_ambassador ON public.leads(assigned_ambassador_id);
CREATE INDEX idx_leads_owner_brand ON public.leads(owner_brand_id);
CREATE INDEX idx_leads_dispensary ON public.leads(dispensary_name);
CREATE INDEX idx_leads_priority ON public.leads(priority);

-- Sales indexes
CREATE INDEX idx_sales_rep_id ON public.sales(rep_id);
CREATE INDEX idx_sales_dispensary ON public.sales(dispensary_name);
CREATE INDEX idx_sales_brand_id ON public.sales(brand_id);
CREATE INDEX idx_sales_brand_name ON public.sales(brand_name);
CREATE INDEX idx_sales_date ON public.sales(sale_date);
CREATE INDEX idx_sales_status ON public.sales(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY (DEVELOPMENT MODE: PERMISSIVE)
-- ============================================================

ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES (Allowing anon access for development)
-- ============================================================

-- Activations policies
DROP POLICY IF EXISTS "activations_select_all" ON public.activations;
DROP POLICY IF EXISTS "activations_insert_auth" ON public.activations;
DROP POLICY IF EXISTS "activations_update_auth" ON public.activations;

CREATE POLICY "activations_select_all" ON public.activations FOR SELECT USING (true);
CREATE POLICY "activations_insert_all" ON public.activations FOR INSERT WITH CHECK (true);
CREATE POLICY "activations_update_all" ON public.activations FOR UPDATE USING (true);

-- Leads policies
DROP POLICY IF EXISTS "leads_select_all" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_auth" ON public.leads;
DROP POLICY IF EXISTS "leads_update_auth" ON public.leads;

CREATE POLICY "leads_select_all" ON public.leads FOR SELECT USING (true);
CREATE POLICY "leads_insert_all" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_update_all" ON public.leads FOR UPDATE USING (true);

-- Sales policies
DROP POLICY IF EXISTS "sales_select_all" ON public.sales;
DROP POLICY IF EXISTS "sales_insert_auth" ON public.sales;
DROP POLICY IF EXISTS "sales_update_auth" ON public.sales;
DROP POLICY IF EXISTS "sales_delete_auth" ON public.sales;

CREATE POLICY "sales_select_all" ON public.sales FOR SELECT USING (true);
CREATE POLICY "sales_insert_all" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "sales_update_all" ON public.sales FOR UPDATE USING (true);
CREATE POLICY "sales_delete_all" ON public.sales FOR DELETE USING (true);

-- ============================================================
-- VERIFICATION: Show created tables and columns
-- ============================================================

SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('activations', 'leads', 'sales')
GROUP BY table_name
ORDER BY table_name;
