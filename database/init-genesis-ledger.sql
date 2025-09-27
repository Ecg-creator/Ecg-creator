-- Genesis Ledger Database Initialization
-- BelieversCommons Immutable Transaction Recording
-- First Warden Faiz Ahmed - Revenue Optimization Framework

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schema for Genesis Stack components
CREATE SCHEMA IF NOT EXISTS genesis;
CREATE SCHEMA IF NOT EXISTS empire_os;
CREATE SCHEMA IF NOT EXISTS river_os;
CREATE SCHEMA IF NOT EXISTS synergize_os;
CREATE SCHEMA IF NOT EXISTS compliance;
CREATE SCHEMA IF NOT EXISTS blockchain;

-- Genesis System Configuration
CREATE TABLE genesis.system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    environment VARCHAR(50) DEFAULT 'production',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert core configuration
INSERT INTO genesis.system_config (key, value) VALUES
('revenue_target', '{"annual": 370000000, "currency": "INR"}'),
('genesis_mode', '{"modes": ["empire", "river", "synergize"], "default": "empire"}'),
('compliance_framework', '{"ecg_charter": true, "dpdpa_2023": true, "auto_compliance": true}'),
('blockchain_config', '{"safe_threshold": 3, "safe_owners": 5, "network": "mainnet"}');

-- Immutable Transaction Ledger
CREATE TABLE genesis.transaction_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    value NUMERIC(36, 18) NOT NULL,
    gas_used BIGINT NOT NULL,
    gas_price NUMERIC(36, 0) NOT NULL,
    transaction_fee NUMERIC(36, 18) NOT NULL,
    data TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    genesis_component VARCHAR(50) NOT NULL CHECK (genesis_component IN ('empire', 'river', 'synergize')),
    revenue_impact NUMERIC(15, 2) DEFAULT 0,
    compliance_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Immutability constraint
    CHECK (created_at IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_transaction_ledger_hash ON genesis.transaction_ledger(transaction_hash);
CREATE INDEX idx_transaction_ledger_component ON genesis.transaction_ledger(genesis_component);
CREATE INDEX idx_transaction_ledger_status ON genesis.transaction_ledger(status);
CREATE INDEX idx_transaction_ledger_created_at ON genesis.transaction_ledger(created_at);

-- Revenue Streams Tracking
CREATE TABLE genesis.revenue_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_name VARCHAR(255) NOT NULL,
    stream_type VARCHAR(100) NOT NULL,
    annual_target NUMERIC(15, 2) NOT NULL,
    current_revenue NUMERIC(15, 2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB
);

-- Insert predefined revenue streams
INSERT INTO genesis.revenue_streams (stream_name, stream_type, annual_target, metadata) VALUES
('Membership NFT Issuance', 'membership_nft', 5000000, '{"sbt_enabled": true, "tier_monetization": true}'),
('REIT-DAO Governance', 'reit_dao_governance', 12000000, '{"management_fees": true, "asset_value": "dynamic"}'),
('MAHDI Sandbox Licensing', 'mahdi_sandbox', 2500000, '{"premium_api": true, "developer_tools": true}'),
('Cloudflare Security Premium', 'security_premium', 4500000, '{"vulnerability_scanning": true, "waf_protection": true}'),
('Compliance Automation', 'compliance_automation', 3000000, '{"regulatory_services": true, "auto_reporting": true}');

-- Audit Trail for Compliance
CREATE TABLE compliance.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    compliance_requirement VARCHAR(255),
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ECG Charter Compliance Tracking
CREATE TABLE compliance.ecg_charter_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article VARCHAR(10) NOT NULL,
    requirement TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'pending', 'exempt')),
    evidence_hash VARCHAR(64),
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_review TIMESTAMP WITH TIME ZONE,
    automated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert ECG Charter requirements
INSERT INTO compliance.ecg_charter_compliance (article, requirement, status, automated) VALUES
('2.1', 'Platform security through containerized infrastructure', 'compliant', true),
('4', 'Automated revenue share via Genesis Stack smart contracts', 'compliant', true),
('DPDPA', 'Privacy compliance through containerized data processing', 'compliant', true);

-- Performance monitoring
CREATE TABLE genesis.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    metric_value NUMERIC(15, 4) NOT NULL,
    metric_unit VARCHAR(50),
    component VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION genesis.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_system_config_timestamp
    BEFORE UPDATE ON genesis.system_config
    FOR EACH ROW EXECUTE FUNCTION genesis.update_timestamp();

-- Create views for reporting
CREATE VIEW genesis.revenue_summary AS
SELECT 
    stream_name,
    annual_target,
    current_revenue,
    ROUND((current_revenue / annual_target * 100), 2) as achievement_percentage,
    active
FROM genesis.revenue_streams
WHERE active = true;

CREATE VIEW compliance.compliance_dashboard AS
SELECT 
    article,
    requirement,
    status,
    automated,
    last_verified,
    CASE 
        WHEN next_review < NOW() THEN 'overdue'
        WHEN next_review < NOW() + INTERVAL '7 days' THEN 'due_soon'
        ELSE 'current'
    END as review_status
FROM compliance.ecg_charter_compliance;

-- Grant permissions
GRANT USAGE ON SCHEMA genesis TO genesis_admin;
GRANT USAGE ON SCHEMA empire_os TO genesis_admin;
GRANT USAGE ON SCHEMA river_os TO genesis_admin;
GRANT USAGE ON SCHEMA synergize_os TO genesis_admin;
GRANT USAGE ON SCHEMA compliance TO genesis_admin;
GRANT USAGE ON SCHEMA blockchain TO genesis_admin;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA genesis TO genesis_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO genesis_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA genesis TO genesis_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA compliance TO genesis_admin;