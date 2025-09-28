-- REIT-DAO Governance Schema
-- BelieversCommons Genesis Stack Integration
-- 85/15 Revenue Share Smart Contract Automation

-- REIT-DAO Core Tables
CREATE TABLE blockchain.reit_dao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_name VARCHAR(255) NOT NULL,
    dao_address VARCHAR(42) UNIQUE NOT NULL,
    total_assets NUMERIC(20, 2) NOT NULL DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    governance_token VARCHAR(10) DEFAULT 'BELIEVERS',
    revenue_share_ratio VARCHAR(10) DEFAULT '85:15',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Management
CREATE TABLE blockchain.reit_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID REFERENCES blockchain.reit_dao(id),
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100) NOT NULL,
    market_value NUMERIC(20, 2) NOT NULL,
    acquisition_cost NUMERIC(20, 2) NOT NULL,
    acquisition_date DATE NOT NULL,
    location TEXT,
    performance_metrics JSONB,
    last_valuation_date DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Distribution
CREATE TABLE blockchain.revenue_distribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID REFERENCES blockchain.reit_dao(id),
    distribution_period VARCHAR(20) NOT NULL, -- monthly, quarterly, annual
    total_revenue NUMERIC(20, 2) NOT NULL,
    dao_share NUMERIC(20, 2) NOT NULL, -- 85%
    believers_share NUMERIC(20, 2) NOT NULL, -- 15%
    distribution_date DATE NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-signature Safe Configuration
CREATE TABLE blockchain.multi_sig_safe (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    safe_address VARCHAR(42) UNIQUE NOT NULL,
    threshold INTEGER NOT NULL DEFAULT 3,
    total_owners INTEGER NOT NULL DEFAULT 5,
    nonce BIGINT DEFAULT 0,
    version VARCHAR(20),
    network VARCHAR(50) DEFAULT 'mainnet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe Owners Management
CREATE TABLE blockchain.safe_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    safe_id UUID REFERENCES blockchain.multi_sig_safe(id),
    owner_address VARCHAR(42) NOT NULL,
    owner_name VARCHAR(255),
    role VARCHAR(100) DEFAULT 'owner',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    removed_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE
);

-- Transaction Proposals
CREATE TABLE blockchain.safe_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    safe_id UUID REFERENCES blockchain.multi_sig_safe(id),
    to_address VARCHAR(42) NOT NULL,
    value NUMERIC(36, 18) DEFAULT 0,
    data TEXT,
    operation INTEGER DEFAULT 0, -- 0: call, 1: delegatecall
    safe_tx_gas BIGINT DEFAULT 0,
    base_gas BIGINT DEFAULT 0,
    gas_price NUMERIC(36, 0) DEFAULT 0,
    gas_token VARCHAR(42) DEFAULT '0x0000000000000000000000000000000000000000',
    refund_receiver VARCHAR(42) DEFAULT '0x0000000000000000000000000000000000000000',
    nonce BIGINT NOT NULL,
    transaction_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
    confirmations INTEGER DEFAULT 0,
    required_confirmations INTEGER DEFAULT 3,
    created_by VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Transaction Confirmations
CREATE TABLE blockchain.safe_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES blockchain.safe_transactions(id),
    owner_address VARCHAR(42) NOT NULL,
    signature TEXT NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_id, owner_address)
);

-- Governance Proposals
CREATE TABLE blockchain.governance_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dao_id UUID REFERENCES blockchain.reit_dao(id),
    proposal_id BIGINT NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    proposer_address VARCHAR(42) NOT NULL,
    start_block BIGINT NOT NULL,
    end_block BIGINT NOT NULL,
    for_votes NUMERIC(36, 18) DEFAULT 0,
    against_votes NUMERIC(36, 18) DEFAULT 0,
    abstain_votes NUMERIC(36, 18) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'cancelled', 'defeated', 'succeeded', 'queued', 'expired', 'executed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Governance Votes
CREATE TABLE blockchain.governance_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID REFERENCES blockchain.governance_proposals(id),
    voter_address VARCHAR(42) NOT NULL,
    support INTEGER NOT NULL CHECK (support IN (0, 1, 2)), -- 0: against, 1: for, 2: abstain
    weight NUMERIC(36, 18) NOT NULL,
    reason TEXT,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter_address)
);

-- Revenue Tracking Functions
CREATE OR REPLACE FUNCTION blockchain.calculate_revenue_share(
    total_revenue NUMERIC(20, 2),
    dao_percentage INTEGER DEFAULT 85
) RETURNS TABLE(dao_share NUMERIC(20, 2), believers_share NUMERIC(20, 2)) AS $$
BEGIN
    RETURN QUERY SELECT 
        ROUND(total_revenue * dao_percentage / 100.0, 2) as dao_share,
        ROUND(total_revenue * (100 - dao_percentage) / 100.0, 2) as believers_share;
END;
$$ LANGUAGE plpgsql;

-- Automatic Revenue Distribution Trigger
CREATE OR REPLACE FUNCTION blockchain.auto_revenue_distribution()
RETURNS TRIGGER AS $$
DECLARE
    shares RECORD;
BEGIN
    -- Calculate 85/15 split
    SELECT * INTO shares FROM blockchain.calculate_revenue_share(NEW.total_revenue);
    
    NEW.dao_share = shares.dao_share;
    NEW.believers_share = shares.believers_share;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_revenue_distribution
    BEFORE INSERT OR UPDATE ON blockchain.revenue_distribution
    FOR EACH ROW EXECUTE FUNCTION blockchain.auto_revenue_distribution();

-- Safe Transaction Status Updates
CREATE OR REPLACE FUNCTION blockchain.update_safe_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update confirmation count
    UPDATE blockchain.safe_transactions 
    SET confirmations = (
        SELECT COUNT(*) 
        FROM blockchain.safe_confirmations 
        WHERE transaction_id = NEW.transaction_id
    )
    WHERE id = NEW.transaction_id;
    
    -- Check if enough confirmations
    UPDATE blockchain.safe_transactions 
    SET status = 'ready_for_execution'
    WHERE id = NEW.transaction_id 
    AND confirmations >= required_confirmations 
    AND status = 'pending';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_safe_transaction_status
    AFTER INSERT ON blockchain.safe_confirmations
    FOR EACH ROW EXECUTE FUNCTION blockchain.update_safe_transaction_status();

-- Insert default REIT-DAO configuration
INSERT INTO blockchain.reit_dao (dao_name, dao_address, governance_token) VALUES
('BelieversCommons REIT', '0x1234567890123456789012345678901234567890', 'BELIEVERS');

-- Insert default Multi-sig Safe
INSERT INTO blockchain.multi_sig_safe (safe_address, threshold, total_owners) VALUES
('0x0987654321098765432109876543210987654321', 3, 5);

-- Create performance indexes
CREATE INDEX idx_reit_assets_dao_id ON blockchain.reit_assets(dao_id);
CREATE INDEX idx_revenue_distribution_dao_id ON blockchain.revenue_distribution(dao_id);
CREATE INDEX idx_revenue_distribution_date ON blockchain.revenue_distribution(distribution_date);
CREATE INDEX idx_safe_transactions_safe_id ON blockchain.safe_transactions(safe_id);
CREATE INDEX idx_safe_transactions_status ON blockchain.safe_transactions(status);
CREATE INDEX idx_governance_proposals_dao_id ON blockchain.governance_proposals(dao_id);
CREATE INDEX idx_governance_votes_proposal_id ON blockchain.governance_votes(proposal_id);

-- Create views for dashboards
CREATE VIEW blockchain.dao_portfolio_summary AS
SELECT 
    d.dao_name,
    d.total_assets,
    d.total_members,
    COUNT(a.id) as total_properties,
    SUM(a.market_value) as current_portfolio_value,
    AVG(a.market_value) as avg_property_value
FROM blockchain.reit_dao d
LEFT JOIN blockchain.reit_assets a ON d.id = a.dao_id AND a.active = true
GROUP BY d.id, d.dao_name, d.total_assets, d.total_members;

CREATE VIEW blockchain.revenue_performance AS
SELECT 
    dao_id,
    distribution_period,
    SUM(total_revenue) as total_revenue,
    SUM(dao_share) as total_dao_share,
    SUM(believers_share) as total_believers_share,
    COUNT(*) as distribution_count
FROM blockchain.revenue_distribution
WHERE status = 'executed'
GROUP BY dao_id, distribution_period;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA blockchain TO genesis_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA blockchain TO genesis_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA blockchain TO genesis_admin;