-- Membership Soulbound Token (SBT) Schema
-- BelieversCommons Charter NFT Implementation
-- Revenue Stream: ₹50L annual SBT issuance fees

-- Membership Tiers Configuration
CREATE TABLE blockchain.membership_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name VARCHAR(100) UNIQUE NOT NULL,
    tier_level INTEGER UNIQUE NOT NULL,
    annual_fee NUMERIC(10, 2) NOT NULL,
    benefits JSONB NOT NULL,
    revenue_share_percentage NUMERIC(5, 2) DEFAULT 0,
    max_members INTEGER,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert membership tiers
INSERT INTO blockchain.membership_tiers (tier_name, tier_level, annual_fee, benefits, revenue_share_percentage, max_members) VALUES
('Genesis Believer', 1, 10000, '{"access": "basic", "voting_power": 1, "revenue_share": false}', 0, 10000),
('First Warden', 2, 50000, '{"access": "premium", "voting_power": 5, "revenue_share": true, "governance": true}', 2.5, 500),
('Supreme Guardian', 3, 100000, '{"access": "executive", "voting_power": 10, "revenue_share": true, "governance": true, "veto_power": true}', 5.0, 100),
('Sovereign Architect', 4, 250000, '{"access": "unlimited", "voting_power": 25, "revenue_share": true, "governance": true, "proposal_creation": true}', 10.0, 25),
('Divine Chancellor', 5, 500000, '{"access": "supreme", "voting_power": 50, "revenue_share": true, "all_permissions": true}', 15.0, 5);

-- Soulbound Token Registry
CREATE TABLE blockchain.soulbound_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT UNIQUE NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    tier_id UUID REFERENCES blockchain.membership_tiers(id),
    soul_name VARCHAR(255),
    metadata_uri TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    
    -- Soulbound constraint - cannot be transferred
    CONSTRAINT sbt_immutable CHECK (owner_address IS NOT NULL),
    UNIQUE(owner_address, tier_id) -- One SBT per tier per soul
);

-- Member Profile Registry
CREATE TABLE blockchain.member_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    soul_name VARCHAR(255) UNIQUE,
    email VARCHAR(320),
    kyc_verified BOOLEAN DEFAULT FALSE,
    kyc_document_hash VARCHAR(64),
    reputation_score INTEGER DEFAULT 0,
    total_contribution NUMERIC(15, 2) DEFAULT 0,
    join_date DATE DEFAULT CURRENT_DATE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'inactive')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue Contributions Tracking
CREATE TABLE blockchain.member_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES blockchain.member_profiles(id),
    contribution_type VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    transaction_hash VARCHAR(66),
    contribution_date DATE DEFAULT CURRENT_DATE,
    revenue_impact NUMERIC(15, 2) DEFAULT 0,
    tier_bonus_applied BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- License Compliance Validation
CREATE TABLE compliance.license_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES blockchain.member_profiles(id),
    license_type VARCHAR(100) NOT NULL,
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'expired')),
    validation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE,
    compliance_score INTEGER DEFAULT 0,
    validator_address VARCHAR(42),
    evidence_hash VARCHAR(64),
    auto_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SBT Transfer Prevention (Soulbound enforcement)
CREATE TABLE blockchain.sbt_transfer_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id BIGINT REFERENCES blockchain.soulbound_tokens(token_id),
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_reason TEXT DEFAULT 'Soulbound token transfer not allowed',
    gas_wasted BIGINT DEFAULT 0
);

-- Revenue Optimization Functions
CREATE OR REPLACE FUNCTION blockchain.calculate_member_revenue_share(
    member_wallet VARCHAR(42),
    period_start DATE,
    period_end DATE
) RETURNS NUMERIC(15, 2) AS $$
DECLARE
    total_share NUMERIC(15, 2) := 0;
    tier_percentage NUMERIC(5, 2);
    base_revenue NUMERIC(15, 2);
BEGIN
    -- Get member's highest tier percentage
    SELECT COALESCE(MAX(mt.revenue_share_percentage), 0) INTO tier_percentage
    FROM blockchain.soulbound_tokens sbt
    JOIN blockchain.membership_tiers mt ON sbt.tier_id = mt.id
    WHERE sbt.owner_address = member_wallet 
    AND sbt.active = true;
    
    -- Calculate base revenue for the period (placeholder - should integrate with actual revenue data)
    SELECT COALESCE(SUM(rs.current_revenue), 0) INTO base_revenue
    FROM genesis.revenue_streams rs
    WHERE rs.last_updated BETWEEN period_start AND period_end;
    
    -- Calculate member's share
    total_share = base_revenue * tier_percentage / 100.0;
    
    RETURN COALESCE(total_share, 0);
END;
$$ LANGUAGE plpgsql;

-- SBT Issuance Revenue Tracking
CREATE OR REPLACE FUNCTION blockchain.track_sbt_revenue()
RETURNS TRIGGER AS $$
DECLARE
    tier_fee NUMERIC(10, 2);
    tier_name VARCHAR(100);
BEGIN
    -- Get tier fee
    SELECT annual_fee, tier_name INTO tier_fee, tier_name
    FROM blockchain.membership_tiers 
    WHERE id = NEW.tier_id;
    
    -- Record revenue contribution
    INSERT INTO blockchain.member_contributions (
        member_id, 
        contribution_type, 
        amount, 
        revenue_impact
    ) 
    SELECT 
        mp.id,
        'SBT Issuance Fee - ' || tier_name,
        tier_fee,
        tier_fee
    FROM blockchain.member_profiles mp
    WHERE mp.wallet_address = NEW.owner_address;
    
    -- Update revenue stream
    UPDATE genesis.revenue_streams 
    SET current_revenue = current_revenue + tier_fee,
        last_updated = NOW()
    WHERE stream_name = 'Membership NFT Issuance';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_sbt_revenue
    AFTER INSERT ON blockchain.soulbound_tokens
    FOR EACH ROW EXECUTE FUNCTION blockchain.track_sbt_revenue();

-- Prevent SBT Transfers (Soulbound enforcement)
CREATE OR REPLACE FUNCTION blockchain.prevent_sbt_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the attempt
    INSERT INTO blockchain.sbt_transfer_attempts (
        token_id, 
        from_address, 
        to_address
    ) VALUES (
        NEW.token_id,
        OLD.owner_address,
        NEW.owner_address
    );
    
    -- Prevent the transfer by keeping the old owner
    NEW.owner_address = OLD.owner_address;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_sbt_transfer
    BEFORE UPDATE OF owner_address ON blockchain.soulbound_tokens
    FOR EACH ROW 
    WHEN (OLD.owner_address != NEW.owner_address)
    EXECUTE FUNCTION blockchain.prevent_sbt_transfer();

-- Compliance Validation Automation
CREATE OR REPLACE FUNCTION compliance.auto_validate_license()
RETURNS TRIGGER AS $$
DECLARE
    member_tier_level INTEGER;
    compliance_threshold INTEGER := 80;
BEGIN
    -- Get member's highest tier level
    SELECT COALESCE(MAX(mt.tier_level), 0) INTO member_tier_level
    FROM blockchain.soulbound_tokens sbt
    JOIN blockchain.membership_tiers mt ON sbt.tier_id = mt.id
    JOIN blockchain.member_profiles mp ON sbt.owner_address = mp.wallet_address
    WHERE mp.id = NEW.member_id 
    AND sbt.active = true;
    
    -- Auto-validate based on tier level
    IF member_tier_level >= 3 THEN -- Supreme Guardian and above
        NEW.validation_status = 'valid';
        NEW.compliance_score = 100;
        NEW.auto_validated = true;
    ELSIF member_tier_level >= 2 AND NEW.compliance_score >= compliance_threshold THEN
        NEW.validation_status = 'valid';
        NEW.auto_validated = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_validate_license
    BEFORE INSERT ON compliance.license_validations
    FOR EACH ROW EXECUTE FUNCTION compliance.auto_validate_license();

-- Create performance indexes
CREATE INDEX idx_soulbound_tokens_owner ON blockchain.soulbound_tokens(owner_address);
CREATE INDEX idx_soulbound_tokens_tier ON blockchain.soulbound_tokens(tier_id);
CREATE INDEX idx_soulbound_tokens_active ON blockchain.soulbound_tokens(active);
CREATE INDEX idx_member_profiles_wallet ON blockchain.member_profiles(wallet_address);
CREATE INDEX idx_member_contributions_member ON blockchain.member_contributions(member_id);
CREATE INDEX idx_license_validations_member ON compliance.license_validations(member_id);

-- Create dashboard views
CREATE VIEW blockchain.membership_revenue_summary AS
SELECT 
    mt.tier_name,
    COUNT(sbt.id) as active_members,
    mt.annual_fee,
    COUNT(sbt.id) * mt.annual_fee as projected_annual_revenue,
    SUM(mc.amount) as actual_contributions
FROM blockchain.membership_tiers mt
LEFT JOIN blockchain.soulbound_tokens sbt ON mt.id = sbt.tier_id AND sbt.active = true
LEFT JOIN blockchain.member_profiles mp ON sbt.owner_address = mp.wallet_address
LEFT JOIN blockchain.member_contributions mc ON mp.id = mc.member_id 
    AND mc.contribution_type LIKE 'SBT Issuance Fee%'
GROUP BY mt.id, mt.tier_name, mt.annual_fee
ORDER BY mt.tier_level;

CREATE VIEW blockchain.high_value_members AS
SELECT 
    mp.soul_name,
    mp.wallet_address,
    mt.tier_name,
    mp.total_contribution,
    mp.reputation_score,
    sbt.issued_at,
    CASE 
        WHEN sbt.expires_at > NOW() OR sbt.expires_at IS NULL THEN 'Active'
        ELSE 'Expired'
    END as membership_status
FROM blockchain.member_profiles mp
JOIN blockchain.soulbound_tokens sbt ON mp.wallet_address = sbt.owner_address
JOIN blockchain.membership_tiers mt ON sbt.tier_id = mt.id
WHERE sbt.active = true 
AND mt.tier_level >= 3 -- Supreme Guardian and above
ORDER BY mt.tier_level DESC, mp.total_contribution DESC;

CREATE VIEW compliance.compliance_dashboard_sbt AS
SELECT 
    mp.soul_name,
    mp.wallet_address,
    COUNT(lv.id) as total_validations,
    COUNT(CASE WHEN lv.validation_status = 'valid' THEN 1 END) as valid_licenses,
    AVG(lv.compliance_score) as avg_compliance_score,
    MAX(lv.validation_date) as last_validation
FROM blockchain.member_profiles mp
LEFT JOIN compliance.license_validations lv ON mp.id = lv.member_id
GROUP BY mp.id, mp.soul_name, mp.wallet_address
HAVING COUNT(lv.id) > 0
ORDER BY avg_compliance_score DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA blockchain TO genesis_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA compliance TO genesis_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA blockchain TO genesis_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA compliance TO genesis_admin;