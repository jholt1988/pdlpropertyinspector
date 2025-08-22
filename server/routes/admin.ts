// server/routes/admin.ts
import { createApiKey, listApiKeys, deactivateApiKey, getApiKeyStats } from '../utils/apiKeyManager.js';
import { z } from 'zod';

const CreateApiKeySchema = z.object({
  name: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerId: z.string().uuid().optional(),
  permissions: z.record(z.boolean()).optional(),
  rateLimitTier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  dailyQuota: z.number().int().positive().optional(),
  monthlyQuota: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
  prefix: z.string().optional()
});

export async function handleCreateApiKey(req: any, res: any) {
  try {
    // Basic auth check - in production, you'd want proper admin authentication
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    const parse = CreateApiKeySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid payload', details: parse.error.format() });
      return;
    }

    const data = parse.data;
    const result = await createApiKey({
      name: data.name,
      ownerEmail: data.ownerEmail,
      ownerId: data.ownerId,
      permissions: data.permissions,
      rateLimitTier: data.rateLimitTier,
      dailyQuota: data.dailyQuota,
      monthlyQuota: data.monthlyQuota,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      prefix: data.prefix
    });

    res.json({
      id: result.id,
      key: result.key, // Only returned at creation time!
      name: result.keyData.name,
      prefix: result.keyData.keyPrefix,
      permissions: result.keyData.permissions,
      rateLimitTier: result.keyData.rateLimitTier,
      dailyQuota: result.keyData.dailyQuota,
      monthlyQuota: result.keyData.monthlyQuota,
      createdAt: result.keyData.createdAt,
      warning: 'Save this key securely - it will not be shown again!'
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
}

export async function handleListApiKeys(req: any, res: any) {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      res.status(400).json({ error: 'ownerId query parameter required' });
      return;
    }

    const keys = await listApiKeys(ownerId);
    
    // Remove sensitive data
    const safeKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      prefix: key.keyPrefix,
      ownerEmail: key.ownerEmail,
      permissions: key.permissions,
      rateLimitTier: key.rateLimitTier,
      dailyQuota: key.dailyQuota,
      monthlyQuota: key.monthlyQuota,
      usageCountDaily: key.usageCountDaily,
      usageCountMonthly: key.usageCountMonthly,
      usageCountTotal: key.usageCountTotal,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      isActive: key.isActive
    }));

    res.json({ keys: safeKeys });
  } catch (error) {
    console.error('List API keys error:', error);
    res.status(500).json({ error: 'Failed to list API keys' });
  }
}

export async function handleDeactivateApiKey(req: any, res: any) {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    const { keyId, ownerId } = req.body;
    if (!keyId || !ownerId) {
      res.status(400).json({ error: 'keyId and ownerId required' });
      return;
    }

    const success = await deactivateApiKey(keyId, ownerId);
    if (success) {
      res.json({ message: 'API key deactivated successfully' });
    } else {
      res.status(404).json({ error: 'API key not found or already deactivated' });
    }
  } catch (error) {
    console.error('Deactivate API key error:', error);
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
}

export async function handleGetApiKeyStats(req: any, res: any) {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    const { keyId, ownerId } = req.query;
    if (!keyId || !ownerId) {
      res.status(400).json({ error: 'keyId and ownerId query parameters required' });
      return;
    }

    const stats = await getApiKeyStats(keyId as string, ownerId as string);
    if (stats) {
      res.json(stats);
    } else {
      res.status(404).json({ error: 'API key not found' });
    }
  } catch (error) {
    console.error('Get API key stats error:', error);
    res.status(500).json({ error: 'Failed to get API key stats' });
  }
}
