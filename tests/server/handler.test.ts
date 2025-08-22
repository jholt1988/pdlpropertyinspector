import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock fs read for apiKeys before importing handler
vi.mock('fs', async () => {
  const original = await vi.importActual('fs');
  return {
    ...original,
    readFileSync: () => JSON.stringify({ 'dev_api_key_example': { owner: 'dev' } }),
  };
});

// Mock dependencies
vi.mock('../../server/estimate', () => ({
  runEstimateAgent: vi.fn().mockResolvedValue({ mocked: true }),
}));
vi.mock('../../server/rateLimiterStore', () => ({
  getBucket: vi.fn().mockResolvedValue(null),
  setBucket: vi.fn().mockResolvedValue(undefined),
}));

import { handleEstimateRequest } from '../../server/handler';
import * as estimateMod from '../../server/estimate';

function makeReq(body: any, headers = {}) {
  return { body, headers, query: {} } as any;
}
function makeRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { json, status } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('handleEstimateRequest', () => {
  it('returns 401 when no api key provided', async () => {
    const req = makeReq({});
    const res = makeRes();
    await handleEstimateRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('calls runEstimateAgent on valid request', async () => {
    // Inject a dev api key into the server's apiKeys (read from file) by mocking readFileSync
    vi.mocked(require('fs').readFileSync).mockImplementation(() => JSON.stringify({ 'dev_api_key_example': { owner: 'dev' } }));

    const req = makeReq({ inventoryItems: [{ itemId: 'x' }], userLocation: { city: 'X', region: 'Y' } }, { 'x-api-key': 'dev_api_key_example' });
    const res = makeRes();
    await handleEstimateRequest(req, res);
    expect(estimateMod.runEstimateAgent).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});
