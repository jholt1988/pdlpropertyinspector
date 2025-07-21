/**
 * Rate limiter for protecting against brute force attacks
 */

export interface RateLimitRule {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts in the window
  blockDurationMs: number; // How long to block after exceeding limit
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  blocked: boolean;
}

export class RateLimiter {
  private attempts: Map<string, Array<{ timestamp: number; success: boolean }>> = new Map();
  private blockedUsers: Map<string, number> = new Map();

  constructor(private rules: RateLimitRule) {}

  /**
   * Checks if a request is allowed based on rate limiting rules
   * @param identifier - Unique identifier (e.g., IP address, user email)
   * @param success - Whether the attempt was successful (for failed login tracking)
   * @returns Rate limit result
   */
  checkLimit(identifier: string, success: boolean = false): RateLimitResult {
    const now = Date.now();
    
    // Check if user is currently blocked
    const blockedUntil = this.blockedUsers.get(identifier);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        blocked: true,
      };
    }

    // Remove expired blocks
    if (blockedUntil && now >= blockedUntil) {
      this.blockedUsers.delete(identifier);
      this.attempts.delete(identifier); // Reset attempts after block expires
    }

    // Get current attempts for this identifier
    const currentAttempts = this.attempts.get(identifier) || [];
    
    // Remove attempts outside the time window
    const windowStart = now - this.rules.windowMs;
    const validAttempts = currentAttempts.filter(attempt => attempt.timestamp >= windowStart);
    
    // Count failed attempts (for login protection)
    const failedAttempts = validAttempts.filter(attempt => !attempt.success);
    
    // Check if exceeded rate limit
    if (failedAttempts.length >= this.rules.maxAttempts) {
      // Block the user
      const blockUntil = now + this.rules.blockDurationMs;
      this.blockedUsers.set(identifier, blockUntil);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockUntil,
        blocked: true,
      };
    }

    // Add current attempt
    validAttempts.push({ timestamp: now, success });
    this.attempts.set(identifier, validAttempts);

    const remaining = Math.max(0, this.rules.maxAttempts - failedAttempts.length - 1);
    const resetTime = windowStart + this.rules.windowMs;

    return {
      allowed: true,
      remaining,
      resetTime,
      blocked: false,
    };
  }

  /**
   * Resets rate limit for a specific identifier (e.g., after successful login)
   * @param identifier - Unique identifier to reset
   */
  resetLimit(identifier: string): void {
    this.attempts.delete(identifier);
    this.blockedUsers.delete(identifier);
  }

  /**
   * Gets current status for an identifier without making an attempt
   * @param identifier - Unique identifier to check
   * @returns Current rate limit status
   */
  getStatus(identifier: string): RateLimitResult {
    const now = Date.now();
    
    // Check if user is currently blocked
    const blockedUntil = this.blockedUsers.get(identifier);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        blocked: true,
      };
    }

    const currentAttempts = this.attempts.get(identifier) || [];
    const windowStart = now - this.rules.windowMs;
    const validAttempts = currentAttempts.filter(attempt => attempt.timestamp >= windowStart);
    const failedAttempts = validAttempts.filter(attempt => !attempt.success);

    const remaining = Math.max(0, this.rules.maxAttempts - failedAttempts.length);
    const resetTime = windowStart + this.rules.windowMs;

    return {
      allowed: failedAttempts.length < this.rules.maxAttempts,
      remaining,
      resetTime,
      blocked: false,
    };
  }

  /**
   * Cleans up expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.rules.windowMs;

    // Clean up attempts
    for (const [identifier, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(attempt => attempt.timestamp >= windowStart);
      if (validAttempts.length === 0) {
        this.attempts.delete(identifier);
      } else {
        this.attempts.set(identifier, validAttempts);
      }
    }

    // Clean up expired blocks
    for (const [identifier, blockedUntil] of this.blockedUsers.entries()) {
      if (now >= blockedUntil) {
        this.blockedUsers.delete(identifier);
      }
    }
  }
}

// Create global rate limiters for different purposes
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5, // 5 failed login attempts
  blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes
});

export const registrationRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3, // 3 registration attempts per hour
  blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
});

export const passwordResetRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 3, // 3 password reset attempts per hour
  blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
});

// Cleanup expired entries every 5 minutes
setInterval(() => {
  loginRateLimiter.cleanup();
  registrationRateLimiter.cleanup();
  passwordResetRateLimiter.cleanup();
}, 5 * 60 * 1000);