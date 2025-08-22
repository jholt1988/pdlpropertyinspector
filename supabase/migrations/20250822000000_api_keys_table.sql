-- Migration: Create API keys table for secure key management
-- This replaces the JSON file-based approach with a proper database table

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Key identification and authentication
  key_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash of the actual key
  key_prefix VARCHAR(20) NOT NULL, -- Visible prefix for identification (e.g., 'sk_live_', 'sk_test_')
  name VARCHAR(255) NOT NULL, -- Human-readable name for the key
  
  -- Ownership and permissions
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_email VARCHAR(255), -- Cached for easier querying
  permissions JSONB DEFAULT '{"estimate": true}'::jsonb, -- Feature permissions
  
  -- Rate limiting and quotas
  rate_limit_tier VARCHAR(50) DEFAULT 'basic' CHECK (rate_limit_tier IN ('basic', 'premium', 'enterprise')),
  daily_quota INTEGER DEFAULT 100, -- Requests per day
  monthly_quota INTEGER DEFAULT 3000, -- Requests per month
  
  -- Usage tracking
  usage_count_daily INTEGER DEFAULT 0,
  usage_count_monthly INTEGER DEFAULT 0,
  usage_count_total INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_used_ip INET,
  
  -- Lifecycle management
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL means no expiration
  is_active BOOLEAN DEFAULT true,
  
  -- Security metadata
  created_by_ip INET,
  user_agent TEXT,
  
  -- Soft delete support
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_owner_id ON api_keys(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active, expires_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_api_keys_usage_tracking ON api_keys(last_used_at, usage_count_total) WHERE deleted_at IS NULL;

-- Create partial index for active, non-expired keys (most common query)
CREATE INDEX IF NOT EXISTS idx_api_keys_active_valid ON api_keys(key_hash, owner_id) 
WHERE is_active = true AND deleted_at IS NULL AND (expires_at IS NULL OR expires_at > NOW());

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER api_keys_updated_at_trigger
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Function to reset daily usage counts (call via cron job)
CREATE OR REPLACE FUNCTION reset_daily_api_key_usage()
RETURNS void AS $$
BEGIN
  UPDATE api_keys 
  SET usage_count_daily = 0
  WHERE usage_count_daily > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly usage counts (call via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_api_key_usage()
RETURNS void AS $$
BEGIN
  UPDATE api_keys 
  SET usage_count_monthly = 0
  WHERE usage_count_monthly > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to safely increment usage counters
CREATE OR REPLACE FUNCTION increment_api_key_usage(
  p_key_hash VARCHAR(255),
  p_ip INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  key_record api_keys%ROWTYPE;
BEGIN
  -- Get the key and check limits
  SELECT * INTO key_record
  FROM api_keys
  WHERE key_hash = p_key_hash
    AND is_active = true
    AND deleted_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());
  
  -- Key not found or expired
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check daily quota
  IF key_record.daily_quota IS NOT NULL AND key_record.usage_count_daily >= key_record.daily_quota THEN
    RETURN false;
  END IF;
  
  -- Check monthly quota
  IF key_record.monthly_quota IS NOT NULL AND key_record.usage_count_monthly >= key_record.monthly_quota THEN
    RETURN false;
  END IF;
  
  -- Increment counters
  UPDATE api_keys
  SET 
    usage_count_daily = usage_count_daily + 1,
    usage_count_monthly = usage_count_monthly + 1,
    usage_count_total = usage_count_total + 1,
    last_used_at = NOW(),
    last_used_ip = COALESCE(p_ip, last_used_ip)
  WHERE id = key_record.id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create a new API key (called from application)
CREATE OR REPLACE FUNCTION create_api_key(
  p_key_hash VARCHAR(255),
  p_key_prefix VARCHAR(20),
  p_name VARCHAR(255),
  p_owner_id UUID,
  p_owner_email VARCHAR(255),
  p_permissions JSONB DEFAULT '{"estimate": true}'::jsonb,
  p_rate_limit_tier VARCHAR(50) DEFAULT 'basic',
  p_daily_quota INTEGER DEFAULT 100,
  p_monthly_quota INTEGER DEFAULT 3000,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_created_by_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_key_id UUID;
BEGIN
  INSERT INTO api_keys (
    key_hash, key_prefix, name, owner_id, owner_email,
    permissions, rate_limit_tier, daily_quota, monthly_quota,
    expires_at, created_by_ip, user_agent
  ) VALUES (
    p_key_hash, p_key_prefix, p_name, p_owner_id, p_owner_email,
    p_permissions, p_rate_limit_tier, p_daily_quota, p_monthly_quota,
    p_expires_at, p_created_by_ip, p_user_agent
  )
  RETURNING id INTO new_key_id;
  
  RETURN new_key_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own API keys
CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can only insert API keys for themselves
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can only update their own API keys
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can only soft-delete their own API keys
CREATE POLICY api_keys_delete_own ON api_keys
  FOR UPDATE
  USING (auth.uid() = owner_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = owner_id);

-- Create a view for active API keys (commonly used)
CREATE OR REPLACE VIEW active_api_keys AS
SELECT 
  id,
  key_prefix,
  name,
  owner_id,
  owner_email,
  permissions,
  rate_limit_tier,
  daily_quota,
  monthly_quota,
  usage_count_daily,
  usage_count_monthly,
  usage_count_total,
  last_used_at,
  created_at,
  expires_at,
  CASE 
    WHEN expires_at IS NULL THEN true
    WHEN expires_at > NOW() THEN true
    ELSE false
  END as is_valid
FROM api_keys
WHERE is_active = true 
  AND deleted_at IS NULL;

-- Grant appropriate permissions
GRANT SELECT ON active_api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api_keys TO authenticated;
GRANT USAGE ON SEQUENCE api_keys_id_seq TO authenticated;

-- Create some example/development keys (optional - remove in production)
DO $$
BEGIN
  -- Only insert if no keys exist (avoid duplicates on re-run)
  IF NOT EXISTS (SELECT 1 FROM api_keys LIMIT 1) THEN
    -- Development key (matches existing JSON file)
    INSERT INTO api_keys (
      key_hash,
      key_prefix,
      name,
      owner_email,
      permissions,
      rate_limit_tier,
      daily_quota,
      monthly_quota
    ) VALUES (
      encode(sha256('dev_api_key_example'::bytea), 'hex'),
      'dev_',
      'Development Example Key',
      'dev@example.com',
      '{"estimate": true, "health": true}'::jsonb,
      'basic',
      1000,
      30000
    );
    
    -- Test key for automated testing
    INSERT INTO api_keys (
      key_hash,
      key_prefix, 
      name,
      owner_email,
      permissions,
      rate_limit_tier,
      daily_quota,
      monthly_quota
    ) VALUES (
      encode(sha256('test_api_key_12345'::bytea), 'hex'),
      'test_',
      'Automated Testing Key',
      'test@example.com',
      '{"estimate": true}'::jsonb,
      'basic',
      10000,
      300000
    );
  END IF;
END $$;

-- Comments for documentation
COMMENT ON TABLE api_keys IS 'Secure storage and management of API keys for service authentication';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual API key - never store plaintext keys';
COMMENT ON COLUMN api_keys.key_prefix IS 'Visible prefix for key identification (e.g., sk_live_, sk_test_)';
COMMENT ON COLUMN api_keys.permissions IS 'JSON object defining what features this key can access';
COMMENT ON COLUMN api_keys.rate_limit_tier IS 'Determines rate limiting rules: basic, premium, enterprise';
COMMENT ON COLUMN api_keys.daily_quota IS 'Maximum requests per day (NULL = unlimited)';
COMMENT ON COLUMN api_keys.monthly_quota IS 'Maximum requests per month (NULL = unlimited)';
COMMENT ON FUNCTION increment_api_key_usage IS 'Safely increment usage counters with quota checking';
COMMENT ON FUNCTION create_api_key IS 'Create a new API key with proper validation and security';
