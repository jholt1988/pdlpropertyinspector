/*
  # Add Social Login Support

  1. Extend Users Table
    - Add social provider fields
    - Add OAuth-specific columns
    - Update constraints and indexes

  2. Social Login Tracking
    - Track provider information
    - Support account linking
    - Maintain audit trail

  3. Security
    - Update RLS policies
    - Add social login audit logging
    - Maintain data integrity
*/

-- Add social login fields to auth_users table
ALTER TABLE auth_users 
ADD COLUMN IF NOT EXISTS social_provider_id text,
ADD COLUMN IF NOT EXISTS social_provider_user_id text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS locale text,
ADD COLUMN IF NOT EXISTS account_linked_at timestamptz;

-- Update provider enum to include social providers
DO $$
BEGIN
  -- Check if the type exists and alter it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_provider') THEN
    -- Add new enum values if they don't exist
    BEGIN
      ALTER TYPE user_provider ADD VALUE IF NOT EXISTS 'google';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TYPE user_provider ADD VALUE IF NOT EXISTS 'microsoft';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
      ALTER TYPE user_provider ADD VALUE IF NOT EXISTS 'apple';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Create unique constraint for social provider combinations
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_social_provider 
ON auth_users (social_provider_id, social_provider_user_id)
WHERE social_provider_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_provider ON auth_users (provider);
CREATE INDEX IF NOT EXISTS idx_users_email_provider ON auth_users (email, provider);

-- Create social login audit table
CREATE TABLE IF NOT EXISTS social_login_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth_users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  action text NOT NULL, -- 'login', 'register', 'link', 'unlink'
  success boolean NOT NULL DEFAULT true,
  ip_address inet,
  user_agent text,
  additional_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on social login audit
ALTER TABLE social_login_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for social login audit
CREATE POLICY "Users can view own social login audit"
  ON social_login_audit
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage social login audit"
  ON social_login_audit
  FOR ALL
  TO service_role
  USING (true);

-- Create function to log social login events
CREATE OR REPLACE FUNCTION log_social_login_event(
  p_user_id uuid,
  p_provider text,
  p_action text,
  p_success boolean DEFAULT true,
  p_additional_data jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO social_login_audit (
    user_id,
    provider,
    action,
    success,
    ip_address,
    user_agent,
    additional_data
  ) VALUES (
    p_user_id,
    p_provider,
    p_action,
    p_success,
    inet_client_addr(),
    current_setting('request.headers', true)::jsonb->>'user-agent',
    p_additional_data
  );
END;
$$;

-- Update the user registration function to support social login
CREATE OR REPLACE FUNCTION create_social_user(
  p_email text,
  p_name text,
  p_provider text,
  p_social_provider_id text,
  p_social_provider_user_id text,
  p_avatar_url text DEFAULT NULL,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_locale text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Insert new user
  INSERT INTO auth_users (
    email,
    name,
    provider,
    social_provider_id,
    social_provider_user_id,
    avatar_url,
    first_name,
    last_name,
    locale,
    email_verified,
    is_active,
    role
  ) VALUES (
    lower(p_email),
    p_name,
    p_provider::user_provider,
    p_social_provider_id,
    p_social_provider_user_id,
    p_avatar_url,
    p_first_name,
    p_last_name,
    p_locale,
    true, -- Social logins are pre-verified
    true,
    'property_manager' -- Default role
  )
  RETURNING id INTO new_user_id;

  -- Log the social registration event
  PERFORM log_social_login_event(
    new_user_id,
    p_provider,
    'register',
    true,
    jsonb_build_object(
      'social_provider_user_id', p_social_provider_user_id,
      'has_avatar', p_avatar_url IS NOT NULL
    )
  );

  RETURN new_user_id;
END;
$$;

-- Function to link social account to existing user
CREATE OR REPLACE FUNCTION link_social_account(
  p_user_id uuid,
  p_provider text,
  p_social_provider_id text,
  p_social_provider_user_id text,
  p_avatar_url text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user with social account information
  UPDATE auth_users 
  SET 
    provider = p_provider::user_provider,
    social_provider_id = p_social_provider_id,
    social_provider_user_id = p_social_provider_user_id,
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    account_linked_at = now(),
    email_verified = true -- Linking verifies email
  WHERE id = p_user_id;

  -- Log the account linking event
  PERFORM log_social_login_event(
    p_user_id,
    p_provider,
    'link',
    true,
    jsonb_build_object(
      'social_provider_user_id', p_social_provider_user_id,
      'linked_at', now()
    )
  );

  RETURN FOUND;
END;
$$;

-- Function to unlink social account
CREATE OR REPLACE FUNCTION unlink_social_account(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_provider text;
BEGIN
  -- Get current provider for logging
  SELECT social_provider_id INTO old_provider
  FROM auth_users 
  WHERE id = p_user_id;

  -- Update user to remove social account information
  UPDATE auth_users 
  SET 
    provider = 'email',
    social_provider_id = NULL,
    social_provider_user_id = NULL,
    account_linked_at = NULL
  WHERE id = p_user_id;

  -- Log the account unlinking event
  PERFORM log_social_login_event(
    p_user_id,
    old_provider,
    'unlink',
    true,
    jsonb_build_object('unlinked_at', now())
  );

  RETURN FOUND;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_audit_user_created 
ON social_login_audit (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_audit_provider_created 
ON social_login_audit (provider, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE social_login_audit IS 'Audit trail for social login events';
COMMENT ON FUNCTION create_social_user IS 'Creates a new user from social login';
COMMENT ON FUNCTION link_social_account IS 'Links a social account to existing user';
COMMENT ON FUNCTION unlink_social_account IS 'Removes social account linking';