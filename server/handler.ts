import { runEstimateAgent } from './estimate';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBucket, setBucket } from './rateLimiterStore';
import { z } from 'zod';
import { jwtVerify } from 'jose';
import { validateApiKey } from './utils/apiKeyManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fallback API keys from JSON file (for backward compatibility)
const apiKeysPath = path.join(__dirname, 'apiKeys.json');
let apiKeys: Record<string, any> = {};
try {
  const apiKeysData = readFileSync(apiKeysPath, 'utf-8');
  apiKeys = JSON.parse(apiKeysData || '{}');
  console.log('Loaded fallback API keys from:', apiKeysPath);
} catch (e) {
  console.warn('Failed to load fallback API keys from', apiKeysPath, '- using database only:', (e as Error).message);
  apiKeys = {};
}

const EstimatePayload = z.object({
  inventoryItems: z.array(z.any()),
  userLocation: z.object({ city: z.string(), region: z.string() }).passthrough().optional(),
  currency: z.string().optional(),
});

export async function handleEstimateRequest(req: any, res: any) {
  // API Key auth: either header X-API-KEY or query param api_key
  let apiKey = req.headers['x-api-key'] || req.query?.api_key || req.body?.api_key;

  // Optional: Bearer token JWT can be used instead. If present, validate and map to api key
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!apiKey && authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.API_JWT_SECRET;
    if (jwtSecret) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
        // allow token to carry apiKey claim or owner claim
        if (payload && (payload.apiKey || payload.sub)) {
          apiKey = (payload.apiKey as string) || (payload.sub as string);
        }
      } catch (err) {
        res.status(401).json({ error: 'Invalid bearer token' });
        return;
      }
    }
  }

  // Validate API key using database or fallback to JSON
  let apiKeyData;
  try {
    apiKeyData = await validateApiKey(apiKey);
  } catch (error) {
    console.warn('Database API key validation failed, trying JSON fallback:', (error as Error).message);
    // Fallback to JSON file validation
    if (apiKeys[apiKey]) {
      apiKeyData = {
        id: apiKey,
        name: 'JSON File Key',
        ownerEmail: apiKeys[apiKey].owner || 'unknown',
        permissions: { estimate: true },
        rateLimitTier: 'basic',
        dailyQuota: 1000,
        monthlyQuota: 30000
      };
    }
  }

  if (!apiKeyData) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }

  // Check permissions
  if (!apiKeyData.permissions?.estimate) {
    res.status(403).json({ error: 'API key does not have permission for estimate generation' });
    return;
  }

  // Rate limiting per API key (using tier-based limits)
  const now = Date.now();
  const rateWindowMs = 60 * 1000; // 1 minute window
  
  // Determine rate limits based on tier
  let maxRequestsPerWindow = 20; // basic default
  if (apiKeyData.rateLimitTier === 'premium') {
    maxRequestsPerWindow = 100;
  } else if (apiKeyData.rateLimitTier === 'enterprise') {
    maxRequestsPerWindow = 500;
  }
  
  const key = `apiKey:${apiKey}`;
  const bucketRaw = await getBucket(key);
  const bucket = bucketRaw || { count: 0, windowStart: now };
  if (now - bucket.windowStart > rateWindowMs) {
    bucket.count = 0;
    bucket.windowStart = now;
  }
  bucket.count += 1;
  await setBucket(key, bucket);
  if (bucket.count > maxRequestsPerWindow) {
    res.status(429).json({ 
      error: 'Rate limit exceeded for API key',
      limit: maxRequestsPerWindow,
      tier: apiKeyData.rateLimitTier,
      resetAt: new Date(bucket.windowStart + rateWindowMs).toISOString()
    });
    return;
  }

  // Validate payload
  const parse = EstimatePayload.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid payload', details: parse.error.format() });
    return;
  }

  const { inventoryItems, userLocation, currency } = parse.data;

  try {
    const result = await runEstimateAgent(inventoryItems, userLocation, currency);
    res.json(result);
  } catch (err: any) {
    console.error('Estimate handler error:', err);
    res.status(500).json({ error: err?.message || 'Estimate failed' });
  }
}
