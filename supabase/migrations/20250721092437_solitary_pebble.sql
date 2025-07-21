/*
# Secure User Authentication Schema

## Overview
This migration creates a comprehensive user authentication system with proper security measures including:
- Secure password storage (hashed with bcrypt)
- Email verification system
- Password reset functionality
- Session management
- Rate limiting tracking
- Audit logging

## Tables Created
1. `auth_users` - Main user accounts
2. `user_sessions` - Active user sessions for JWT token management
3. `auth_attempts` - Rate limiting and security monitoring
4. `audit_logs` - Security audit trail

## Security Features
- RLS (Row Level Security) enabled on all tables
- Proper indexing for performance and security
- Secure password hashing storage
- Email verification workflow
- Account locking mechanisms
- Comprehensive audit logging
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table with enhanced security
CREATE TABLE IF NOT EXISTS auth_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  email_verified boolean DEFAULT false,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('property_manager', 'landlord', 'tenant', 'maintenance')),
  company text,
  phone text,
  avatar_url text,
  
  -- Authentication fields
  password_hash text NOT NULL,
  provider text NOT NULL DEFAULT 'email' CHECK (provider IN ('email', 'google', 'microsoft', 'apple')),
  provider_id text, -- For social logins
  
  -- Security fields
  is_active boolean DEFAULT true,
  failed_login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  email_verification_token text,
  email_verification_expires timestamptz,
  password_reset_token text,
  password_reset_expires timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT valid_name CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Create user sessions table for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  session_id text UNIQUE NOT NULL,
  token_family text NOT NULL, -- For refresh token rotation
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  
  -- Indexes for performance
  INDEX idx_user_sessions_user_id ON user_sessions(user_id),
  INDEX idx_user_sessions_session_id ON user_sessions(session_id),
  INDEX idx_user_sessions_expires_at ON user_sessions(expires_at)
);

-- Create auth attempts table for rate limiting and security monitoring
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier text NOT NULL, -- Email, IP, or other identifier
  attempt_type text NOT NULL CHECK (attempt_type IN ('login', 'registration', 'password_reset', 'email_verification')),
  success boolean NOT NULL,
  ip_address inet,
  user_agent text,
  error_message text,
  
  -- Rate limiting fields
  attempts_count integer DEFAULT 1,
  blocked_until timestamptz,
  
  -- Timestamp
  attempted_at timestamptz DEFAULT now(),
  
  -- Indexes for rate limiting queries
  INDEX idx_auth_attempts_identifier_type ON auth_attempts(identifier, attempt_type),
  INDEX idx_auth_attempts_attempted_at ON auth_attempts(attempted_at),
  INDEX idx_auth_attempts_blocked_until ON auth_attempts(blocked_until)
);

-- Create audit logs table for security monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource text,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  
  -- Timestamp
  created_at timestamptz DEFAULT now(),
  
  -- Indexes for querying
  INDEX idx_audit_logs_user_id ON audit_logs(user_id),
  INDEX idx_audit_logs_action ON audit_logs(action),
  INDEX idx_audit_logs_created_at ON audit_logs(created_at)
);

-- Enable Row Level Security
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_users
CREATE POLICY "Users can read own profile"
  ON auth_users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON auth_users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Property managers can read all users
CREATE POLICY "Property managers can read all users"
  ON auth_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users 
      WHERE id::text = auth.uid()::text 
      AND role = 'property_manager'
    )
  );

-- RLS Policies for user_sessions
CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- RLS Policies for auth_attempts (read-only for users, full access for property managers)
CREATE POLICY "Property managers can read all auth attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users 
      WHERE id::text = auth.uid()::text 
      AND role = 'property_manager'
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Property managers can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth_users 
      WHERE id::text = auth.uid()::text 
      AND role = 'property_manager'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_auth_users_updated_at
  BEFORE UPDATE ON auth_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup expired sessions and auth attempts
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM user_sessions WHERE expires_at < now();
  
  -- Delete old auth attempts (keep for 30 days)
  DELETE FROM auth_attempts WHERE attempted_at < now() - interval '30 days';
  
  -- Delete old audit logs (keep for 1 year)
  DELETE FROM audit_logs WHERE created_at < now() - interval '1 year';
  
  -- Reset blocked users whose block period has expired
  UPDATE auth_attempts 
  SET blocked_until = NULL 
  WHERE blocked_until IS NOT NULL AND blocked_until < now();
  
  -- Reset locked users whose lock period has expired
  UPDATE auth_users 
  SET locked_until = NULL, failed_login_attempts = 0
  WHERE locked_until IS NOT NULL AND locked_until < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id uuid,
  p_action text,
  p_resource text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource, resource_id, old_values, new_values,
    ip_address, user_agent, success, error_message
  )
  VALUES (
    p_user_id, p_action, p_resource, p_resource_id, p_old_values, p_new_values,
    p_ip_address, p_user_agent, p_success, p_error_message
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_email_verification_token ON auth_users(email_verification_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_password_reset_token ON auth_users(password_reset_token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_created_at ON auth_users(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_users_role ON auth_users(role);

-- Schedule cleanup to run daily
SELECT cron.schedule('cleanup-expired-auth-records', '0 2 * * *', 'SELECT cleanup_expired_records()');

-- Insert demo users with secure passwords (for development only)
DO $$
BEGIN
  -- Only insert demo users if none exist
  IF NOT EXISTS (SELECT 1 FROM auth_users LIMIT 1) THEN
    INSERT INTO auth_users (email, name, role, company, phone, password_hash, email_verified) VALUES
    (
      'manager@demo.com', 
      'John Manager', 
      'property_manager', 
      'Premier Property Management', 
      '+1-555-123-4567',
      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfXL8vBMT3i8.R2', -- SecureDemo123!
      true
    ),
    (
      'landlord@demo.com', 
      'Sarah Landlord', 
      'landlord', 
      'Landlord Properties LLC', 
      '+1-555-234-5678',
      '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfXL8vBMT3i8.R2', -- SecureDemo123!
      true
    );
  END IF;
END $$;