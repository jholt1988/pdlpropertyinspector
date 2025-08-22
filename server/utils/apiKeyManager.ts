// server/utils/apiKeyManager.ts
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role for server operations

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export interface ApiKeyData {
  id: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  ownerId?: string;
  ownerEmail: string;
  permissions: Record<string, boolean>;
  rateLimitTier: 'basic' | 'premium' | 'enterprise';
  dailyQuota: number;
  monthlyQuota: number;
  usageCountDaily: number;
  usageCountMonthly: number;
  usageCountTotal: number;
  lastUsedAt?: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

/**
 * Generate a cryptographically secure API key
 */
export function generateApiKey(prefix: string = 'sk'): string {
  const randomBytes = crypto.randomBytes(32);
  const key = `${prefix}_${randomBytes.toString('base64url')}`;
  return key;
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Create a new API key in the database
 */
export async function createApiKey(params: {
  name: string;
  ownerEmail: string;
  ownerId?: string;
  permissions?: Record<string, boolean>;
  rateLimitTier?: 'basic' | 'premium' | 'enterprise';
  dailyQuota?: number;
  monthlyQuota?: number;
  expiresAt?: Date;
  prefix?: string;
}): Promise<{ id: string; key: string; keyData: ApiKeyData }> {
  if (!supabase) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const key = generateApiKey(params.prefix || 'sk');
  const keyHash = hashApiKey(key);
  
  const { data, error } = await supabase.rpc('create_api_key', {
    p_key_hash: keyHash,
    p_key_prefix: params.prefix || 'sk_',
    p_name: params.name,
    p_owner_id: params.ownerId || null,
    p_owner_email: params.ownerEmail,
    p_permissions: params.permissions || { estimate: true },
    p_rate_limit_tier: params.rateLimitTier || 'basic',
    p_daily_quota: params.dailyQuota || 100,
    p_monthly_quota: params.monthlyQuota || 3000,
    p_expires_at: params.expiresAt?.toISOString() || null
  });

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

  // Fetch the created key data
  const { data: keyData, error: fetchError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch created API key: ${fetchError.message}`);
  }

  return {
    id: data,
    key, // Return the plaintext key ONLY at creation time
    keyData: transformApiKeyData(keyData)
  };
}

/**
 * Validate an API key and check quotas
 */
export async function validateApiKey(key: string): Promise<ApiKeyData | null> {
  if (!supabase) {
    // Fallback to JSON file if Supabase not configured
    return validateApiKeyFromJson(key);
  }

  const keyHash = hashApiKey(key);
  
  // Try to increment usage (this also validates the key and checks quotas)
  const { data: canUse, error } = await supabase.rpc('increment_api_key_usage', {
    p_key_hash: keyHash
  });

  if (error || !canUse) {
    return null;
  }

  // Fetch the key data
  const { data: keyData, error: fetchError } = await supabase
    .from('active_api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .single();

  if (fetchError || !keyData) {
    return null;
  }

  return transformApiKeyData(keyData);
}

/**
 * Fallback validation using JSON file (for development/backward compatibility)
 */
async function validateApiKeyFromJson(key: string): Promise<ApiKeyData | null> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const apiKeysPath = path.join(__dirname, '..', 'apiKeys.json');
    
    const apiKeysData = fs.readFileSync(apiKeysPath, 'utf-8');
    const apiKeys = JSON.parse(apiKeysData);
    
    if (apiKeys[key]) {
      return {
        id: key,
        keyHash: hashApiKey(key),
        keyPrefix: key.split('_')[0] + '_',
        name: 'JSON File Key',
        ownerEmail: apiKeys[key].owner || 'unknown',
        permissions: { estimate: true },
        rateLimitTier: 'basic',
        dailyQuota: 1000,
        monthlyQuota: 30000,
        usageCountDaily: 0,
        usageCountMonthly: 0,
        usageCountTotal: 0,
        createdAt: apiKeys[key].createdAt || new Date().toISOString(),
        isActive: true
      };
    }
  } catch (error) {
    console.warn('Failed to read JSON API keys:', error);
  }
  
  return null;
}

/**
 * List API keys for a user
 */
export async function listApiKeys(ownerId: string): Promise<ApiKeyData[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('active_api_keys')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list API keys: ${error.message}`);
  }

  return data.map(transformApiKeyData);
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(keyId: string, ownerId: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('owner_id', ownerId);

  return !error;
}

/**
 * Transform database row to our TypeScript interface
 */
function transformApiKeyData(row: any): ApiKeyData {
  return {
    id: row.id,
    keyHash: row.key_hash,
    keyPrefix: row.key_prefix,
    name: row.name,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email,
    permissions: row.permissions,
    rateLimitTier: row.rate_limit_tier,
    dailyQuota: row.daily_quota,
    monthlyQuota: row.monthly_quota,
    usageCountDaily: row.usage_count_daily,
    usageCountMonthly: row.usage_count_monthly,
    usageCountTotal: row.usage_count_total,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isActive: row.is_active
  };
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyStats(keyId: string, ownerId: string): Promise<{
  dailyUsage: number;
  monthlyUsage: number;
  totalUsage: number;
  dailyQuota: number;
  monthlyQuota: number;
  lastUsed?: string;
} | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('api_keys')
    .select('usage_count_daily, usage_count_monthly, usage_count_total, daily_quota, monthly_quota, last_used_at')
    .eq('id', keyId)
    .eq('owner_id', ownerId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    dailyUsage: data.usage_count_daily,
    monthlyUsage: data.usage_count_monthly,
    totalUsage: data.usage_count_total,
    dailyQuota: data.daily_quota,
    monthlyQuota: data.monthly_quota,
    lastUsed: data.last_used_at
  };
}
