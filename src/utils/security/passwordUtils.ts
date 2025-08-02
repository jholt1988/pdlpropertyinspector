import bcrypt from 'bcryptjs';

/**
 * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive)
 * Browser-compatible alternative to crypto.randomInt
 */
export function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

// Password strength requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

/**
 * Validates password strength according to security requirements
 * @param password - The password to validate
 * @returns Object with validation result and specific requirements that failed
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  } else {
    score += 1;
  }

  // Check maximum length (prevent DoS attacks)
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Check for uppercase letters
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 1;
  }

  // Check for lowercase letters
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 1;
  }

  // Check for numbers
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/\d/.test(password)) {
    score += 1;
  }

  // Check for special characters
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }

  // Additional security checks
  if (password.toLowerCase().includes('password') || 
      password.toLowerCase().includes('123456') ||
      /(.)\1{2,}/.test(password)) {
    errors.push('Password contains common patterns and is not secure');
    score = Math.max(0, score - 2);
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(5, score), // Max score of 5
  };
}

/**
 * Hashes a password using bcrypt with salt rounds
 * @param password - Plain text password
 * @returns Promise resolving to hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password before hashing
  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new Error(`Password validation failed: ${validation.errors.join(', ')}`);
  }

  // Use 12 salt rounds for good balance between security and performance
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verifies a password against its hash
 * @param password - Plain text password
 * @param hash - Hashed password from database
 * @returns Promise resolving to boolean indicating if password is correct
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    // Log error for monitoring but don't reveal details to user
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generates a secure random password for temporary use
 * @param length - Desired password length (default: 12)
 * @returns Generated secure password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;
  let passwordArray: string[] = [];

  // Ensure at least one character from each category
  passwordArray.push(uppercase[getSecureRandomInt(uppercase.length)]);
  passwordArray.push(lowercase[getSecureRandomInt(lowercase.length)]);
  passwordArray.push(numbers[getSecureRandomInt(numbers.length)]);
  passwordArray.push(special[getSecureRandomInt(special.length)]);

  // Fill remaining length with random characters
  for (let i = passwordArray.length; i < length; i++) {
    passwordArray.push(allChars[getSecureRandomInt(allChars.length)]);
  }

  // Fisher-Yates shuffle for better randomness
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}