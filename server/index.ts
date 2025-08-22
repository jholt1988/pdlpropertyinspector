import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import { handleEstimateRequest } from './handler';
import { isRedisReady } from './rateLimiterStore';
import { 
  handleCreateApiKey, 
  handleListApiKeys, 
  handleDeactivateApiKey, 
  handleGetApiKeyStats 
} from './routes/admin.js';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function startServer() {
  try {
    console.log('Starting server...');
    const app = express();
    app.use(bodyParser.json({ limit: '1mb' }));

    // Main estimate endpoint
    app.post('/api/estimate', async (req, res) => {
      return handleEstimateRequest(req, res);
    });

    // Admin endpoints for API key management
    app.post('/admin/api-keys', handleCreateApiKey);
    app.get('/admin/api-keys', handleListApiKeys);
    app.delete('/admin/api-keys', handleDeactivateApiKey);
    app.get('/admin/api-keys/stats', handleGetApiKeyStats);

    // Health check
    app.get('/health', async (req, res) => {
      const redisOk = await isRedisReady();
      return res.json({ status: 'ok', redis: redisOk ? 'connected' : 'not_configured' });
    });

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Estimate server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
