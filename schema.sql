-- Green Truth CRM - Database Schema for Core Tables
-- This file creates the essential tables for Shifts, Sales, Leads, and Activations

-- ============================================================
-- TABLE: shifts
-- Purpose: Store work shifts logged by sales reps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    dispensary_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    total_hours NUMERIC(4,2),
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: sales
-- Purpose: Store sales transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rep_id TEXT NOT NULL,
    rep_name TEXT,
    dispensary_name TEXT NOT NULL,
    brand_name TEXT,
    products JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    commission_earned NUMERIC(10,2) DEFAULT 0,
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: leads
-- Purpose: Store prospective dispensary leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispensary_name TEXT NOT NULL,
    license_number TEXT,
    address TEXT,
    contacts JSONB DEFAULT '[]'::jsonb,
    priority TEXT DEFAULT 'Normal',
    samples_requested JSONB DEFAULT '[]'::jsonb,
    active_brands JSONB DEFAULT '[]'::jsonb,
    meeting_date DATE,
    lead_status TEXT DEFAULT 'prospect',
    first_order_date DATE,
    notes TEXT,
    created_by TEXT,
    owner_brand_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: activations
-- Purpose: Store in-store activation events (pop-ups, samplings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    dispensary_id TEXT,
    dispensary_name TEXT NOT NULL,
    rep_id TEXT,
    rep_name TEXT,
    activation_date DATE NOT NULL,
    activation_type TEXT DEFAULT 'sampling',
    start_time TIME,
    end_time TIME,
    total_hours NUMERIC(4,2),
    status TEXT DEFAULT 'scheduled',
    invoice_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================

-- Shifts indexes
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON public.shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_rep_id ON public.sales(rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_dispensary ON public.sales(dispensary_name);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_brand ON public.sales(brand_name);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_owner_brand ON public.leads(owner_brand_id);
CREATE INDEX IF NOT EXISTS idx_leads_dispensary ON public.leads(dispensary_name);

-- Activations indexes
CREATE INDEX IF NOT EXISTS idx_activations_brand_id ON public.activations(brand_id);
CREATE INDEX IF NOT EXISTS idx_activations_dispensary ON public.activations(dispensary_name);
CREATE INDEX IF NOT EXISTS idx_activations_date ON public.activations(activation_date);
CREATE INDEX IF NOT EXISTS idx_activations_rep_id ON public.activations(rep_id);
CREATE INDEX IF NOT EXISTS idx_activations_status ON public.activations(status);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (Optional but recommended)
-- ============================================================

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES (Basic - can be customized based on your auth setup)
-- ============================================================

-- Shifts: Users can view and insert their own shifts
CREATE POLICY "Users can view their own shifts" 
    ON public.shifts FOR SELECT 
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own shifts" 
    ON public.shifts FOR INSERT 
    WITH CHECK (auth.uid()::text = user_id);

-- Sales: Public read for now (customize based on needs)
CREATE POLICY "Enable read access for all users" 
    ON public.sales FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.sales FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Leads: Public read for now
CREATE POLICY "Enable read access for all users" 
    ON public.leads FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.leads FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

-- Activations: Public read for now
CREATE POLICY "Enable read access for all users" 
    ON public.activations FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.activations FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
