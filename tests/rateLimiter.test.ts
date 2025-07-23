import test from 'node:test';
import assert from 'node:assert/strict';
import { RateLimiter } from '../src/utils/security/rateLimiter.ts';

// Helper to temporarily mock Date.now
function withMockedTime<T>(start: number, fn: (advance: (ms: number) => void) => T): T {
  const originalNow = Date.now;
  let current = start;
  Date.now = () => current;
  const advance = (ms: number) => { current += ms; };
  try {
    return fn(advance);
  } finally {
    Date.now = originalNow;
  }
}

test('remaining attempts and reset time reflect earliest attempt', () => {
  const rules = { windowMs: 1000, maxAttempts: 5, blockDurationMs: 10000 };
  const limiter = new RateLimiter(rules);
  withMockedTime(0, advance => {
    const r1 = limiter.checkLimit('user', false);
    assert.equal(r1.remaining, 4);
    assert.equal(r1.resetTime, 0 + rules.windowMs);

    advance(200);
    const r2 = limiter.checkLimit('user', false);
    assert.equal(r2.remaining, 3);
    assert.equal(r2.resetTime, 0 + rules.windowMs);

    advance(rules.windowMs + 1);
    const status = limiter.getStatus('user');
    assert.equal(status.remaining, 5);
    assert.ok(status.resetTime > 0 + rules.windowMs);
  });
});

test('limiter blocks after exceeding attempts', () => {
  const rules = { windowMs: 1000, maxAttempts: 2, blockDurationMs: 5000 };
  const limiter = new RateLimiter(rules);
  withMockedTime(0, advance => {
    limiter.checkLimit('block', false);
    advance(10);
    limiter.checkLimit('block', false);
    advance(10);
    const res = limiter.checkLimit('block', false);
    assert.equal(res.allowed, false);
    assert.equal(res.blocked, true);
    assert.equal(res.remaining, 0);
    assert.equal(res.resetTime, 20 + rules.blockDurationMs);
  });
});
