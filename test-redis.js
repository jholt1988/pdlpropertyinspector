import 'dotenv/config';
import IORedis from 'ioredis';

console.log('Testing Redis connection...');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Not set');

if (!process.env.REDIS_URL) {
  console.error('REDIS_URL environment variable is not set');
  process.exit(1);
}

const redis = new IORedis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    console.log(`Retry attempt ${times}`);
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: 3
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
});

redis.on('ready', () => {
  console.log('✅ Redis ready for commands!');
  testRedis();
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
  process.exit(1);
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

async function testRedis() {
  try {
    // Test basic commands
    console.log('Testing PING...');
    const pong = await redis.ping();
    console.log('PING response:', pong);
    
    console.log('Testing SET/GET...');
    await redis.set('test:key', 'test-value');
    const value = await redis.get('test:key');
    console.log('Retrieved value:', value);
    
    await redis.del('test:key');
    console.log('✅ All Redis tests passed!');
    
    redis.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  }
}
