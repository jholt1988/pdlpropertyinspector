import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '../src/utils/security/passwordUtils';

describe('validatePasswordStrength', () => {
  it('accepts a strong password', () => {
    const result = validatePasswordStrength('StrongPass1!');
    expect(result.isValid).toBe(true);
  });

  it('rejects password missing uppercase', () => {
    const result = validatePasswordStrength('weakpass1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('rejects short password', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters long');
  });

  it('rejects common patterns', () => {
    const result = validatePasswordStrength('password123!');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Password contains common patterns and is not secure');
  });
});
