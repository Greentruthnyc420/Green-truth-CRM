-- Integration Infrastructure Tables
-- Run: supabase db push or apply this migration

-- ============================================
-- Integration Connections Table
-- Stores API credentials and settings per org
-- ============================================
CREATE TABLE IF NOT EXISTS integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL,                    -- dispensary_id or brand_id
    org_type TEXT NOT NULL CHECK (org_type IN ('dispensary', 'brand', 'processor')),
    provider TEXT NOT NULL CHECK (provider IN (
        'leaflink', 'distru', 'canix', 'flourish',  -- ERPs
        'dutchie', 'blaze', 'treez',                 -- POS
        'metrc', 'biotrack'                          -- Compliance
    )),
    display_name TEXT,                       -- User-friendly connection name
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'pending', 'disconnected')),
    
    -- Credentials (encrypted in production)
    api_key TEXT,
    api_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    
    -- Configuration
    settings JSONB DEFAULT '{}',             -- Sync frequency, field mappings, etc.
    webhook_url TEXT,                        -- Incoming webhook URL for this connection
    webhook_secret TEXT,                     -- Secret for validating webhooks
    
    -- Sync tracking
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    last_error TEXT,
    sync_enabled BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    -- Unique constraint: one connection per org per provider
    UNIQUE(org_id, provider)
);

-- ============================================
-- Integration Sync Logs Table
-- Detailed logs for debugging sync issues
-- ============================================
CREATE TABLE IF NOT EXISTS integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES integration_connections(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_type TEXT NOT NULL CHECK (sync_type IN (
        'orders', 'inventory', 'products', 'customers', 
        'invoices', 'shipments', 'full_sync', 'webhook'
    )),
    direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound', 'bidirectional')),
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'partial')),
    
    -- Results
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Request/Response for debugging (sensitive data should be redacted)
    request_summary JSONB,
    response_summary JSONB
);

-- ============================================
-- Integration Field Mappings Table
-- Map GreenTruth fields to provider fields
-- ============================================
CREATE TABLE IF NOT EXISTS integration_field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES integration_connections(id) ON DELETE CASCADE,
    
    entity_type TEXT NOT NULL,               -- 'product', 'order', 'customer', etc.
    greentruth_field TEXT NOT NULL,          -- Our field name
    provider_field TEXT NOT NULL,            -- Their field name
    transform_type TEXT,                     -- 'direct', 'uppercase', 'money_cents', etc.
    default_value TEXT,                      -- Default if field is missing
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_integration_connections_org ON integration_connections(org_id, org_type);
CREATE INDEX IF NOT EXISTS idx_integration_connections_provider ON integration_connections(provider);
CREATE INDEX IF NOT EXISTS idx_integration_connections_status ON integration_connections(status);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_connection ON integration_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_status ON integration_sync_logs(status, started_at DESC);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_field_mappings ENABLE ROW LEVEL SECURITY;

-- Connections: Users can only see their own org's connections
CREATE POLICY "Users can view own org integrations" ON integration_connections
    FOR SELECT USING (
        org_id = auth.uid()::text 
        OR org_id IN (
            SELECT dispensary_id FROM profiles WHERE id = auth.uid()
        )
        OR org_id IN (
            SELECT brand_id FROM brand_users WHERE firebase_uid = auth.uid()::text
        )
    );

CREATE POLICY "Users can manage own org integrations" ON integration_connections
    FOR ALL USING (
        org_id = auth.uid()::text 
        OR org_id IN (
            SELECT dispensary_id FROM profiles WHERE id = auth.uid()
        )
        OR org_id IN (
            SELECT brand_id FROM brand_users WHERE firebase_uid = auth.uid()::text
        )
    );

-- Sync logs: Inherit from connection permissions
CREATE POLICY "Users can view own sync logs" ON integration_sync_logs
    FOR SELECT USING (
        connection_id IN (
            SELECT id FROM integration_connections WHERE 
                org_id = auth.uid()::text 
                OR org_id IN (SELECT dispensary_id FROM profiles WHERE id = auth.uid())
                OR org_id IN (SELECT brand_id FROM brand_users WHERE firebase_uid = auth.uid()::text)
        )
    );

-- Field mappings: Inherit from connection permissions
CREATE POLICY "Users can manage own field mappings" ON integration_field_mappings
    FOR ALL USING (
        connection_id IN (
            SELECT id FROM integration_connections WHERE 
                org_id = auth.uid()::text 
                OR org_id IN (SELECT dispensary_id FROM profiles WHERE id = auth.uid())
                OR org_id IN (SELECT brand_id FROM brand_users WHERE firebase_uid = auth.uid()::text)
        )
    );

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_integration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_integration_connections_timestamp
    BEFORE UPDATE ON integration_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_timestamp();
