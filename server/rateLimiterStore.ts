import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;

// Exponential backoff retry strategy up to 30s
function retryStrategy(times: number) {
  const delay = Math.min(1000 * 2 ** times, 30000);
  return delay;
}

// Lazy initialize redis client only when REDIS_URL is provided. If not, export
// safe no-op implementations so importing this module doesn't throw at load time.
let redisClient: IORedis | null = null;
if (REDIS_URL) {
  const isSSL = REDIS_URL.startsWith('rediss://');
  redisClient = new IORedis(REDIS_URL, {
    retryStrategy,
    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    ...(isSSL && {
      tls: {
        rejectUnauthorized: false, // For self-signed certificates
      }
    })
  });

  redisClient.on('connect', () => {
    console.log('Redis client connected');
  });
  redisClient.on('ready', () => {
    console.log('Redis client ready');
  });
  redisClient.on('error', (err) => {
    console.error('Redis error:', err?.message || err);
  });
  redisClient.on('close', () => {
    console.warn('Redis connection closed');
  });
  redisClient.on('reconnecting', (delay: number) => {
    console.log('Redis reconnecting, delay=', delay);
  });
} else {
  console.warn('REDIS_URL not set — Redis rate limiter disabled.');
}

interface Bucket {
  count: number;
  windowStart: number;
}

export async function getBucket(key: string): Promise<Bucket | null> {
  if (!redisClient) return null;
  const raw = await redisClient.get(`rate:${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Bucket;
  } catch (e) {
    return null;
  }
}

export async function setBucket(key: string, bucket: Bucket, ttlSeconds?: number): Promise<void> {
  if (!redisClient) return;
  const redisKey = `rate:${key}`;
  const value = JSON.stringify(bucket);
  if (ttlSeconds && ttlSeconds > 0) {
    await redisClient.set(redisKey, value, 'EX', Math.ceil(ttlSeconds));
    return;
  }
  await redisClient.set(redisKey, value);
}

export async function clearStore(): Promise<void> {
  if (!redisClient) return;
  // Safely delete only keys created by this rate limiter (rate:*). This avoids clearing unrelated keys.
  const pattern = 'rate:*';
  let cursor = '0';
  do {
    const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '1000');
    cursor = reply[0];
    const keys = reply[1] as string[];
    if (keys.length) {
      await redisClient.del(...keys);
    }
  } while (cursor !== '0');
}

export async function isRedisReady(): Promise<boolean> {
  if (!redisClient) return false;
  try {
    const pong = await redisClient.ping();
    return typeof pong === 'string' && pong.toLowerCase().includes('pong');
  } catch (e) {
    return false;
  }
}
