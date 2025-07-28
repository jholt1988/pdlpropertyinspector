import { describe, it, expect } from 'vitest';
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

describe('RateLimiter', () => {
it('remaining attempts and reset time reflect earliest attempt', () => {
  const rules = { windowMs: 1000, maxAttempts: 5, blockDurationMs: 10000 };
  const limiter = new RateLimiter(rules);
  withMockedTime(0, advance => {
    const r1 = limiter.checkLimit('user', false);
    expect(r1.remaining).toBe(4);
    expect(r1.resetTime).toBe(0 + rules.windowMs);

    advance(200);
    const r2 = limiter.checkLimit('user', false);
    expect(r2.remaining).toBe(3);
    expect(r2.resetTime).toBe(0 + rules.windowMs);

    advance(rules.windowMs + 1);
    const status = limiter.getStatus('user');
    expect(status.remaining).toBe(5);
    expect(status.resetTime).toBeGreaterThan(0 + rules.windowMs);
  });
});

it('limiter blocks after exceeding attempts', () => {
  const rules = { windowMs: 1000, maxAttempts: 2, blockDurationMs: 5000 };
  const limiter = new RateLimiter(rules);
  withMockedTime(0, advance => {
    limiter.checkLimit('block', false);
    advance(10);
    limiter.checkLimit('block', false);
    advance(10);
    const res = limiter.checkLimit('block', false);
    expect(res.allowed).toBe(false);
    expect(res.blocked).toBe(true);
    expect(res.remaining).toBe(0);
    expect(res.resetTime).toBe(20 + rules.blockDurationMs);
  });
});
});
