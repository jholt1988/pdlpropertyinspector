import DOMPurify from 'dompurify';

/**
 * Email validation regex (RFC 5322 compliant)
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Phone number validation regex (supports various formats)
 */
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

/**
 * Name validation regex (letters, spaces, hyphens, apostrophes)
 */
const NAME_REGEX = /^[a-zA-Z\s\-\'\.]{2,50}$/;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param input - Raw HTML input
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Remove all HTML tags for maximum security
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitizes general text input
 * @param input - Raw text input
 * @returns Sanitized text string
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .substring(0, 1000); // Limit length to prevent abuse
}

/**
 * Validates and sanitizes email address
 * @param email - Email address to validate
 * @returns Validation result with sanitized email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const sanitizedEmail = sanitizeText(email.toLowerCase());
  
  if (!EMAIL_REGEX.test(sanitizedEmail)) {
    errors.push('Please enter a valid email address');
  }

  if (sanitizedEmail.length > 254) {
    errors.push('Email address is too long');
  }

  // Check for potentially malicious patterns
  if (sanitizedEmail.includes('..') || sanitizedEmail.startsWith('.') || sanitizedEmail.endsWith('.')) {
    errors.push('Email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedEmail,
  };
}

/**
 * Validates and sanitizes phone number
 * @param phone - Phone number to validate
 * @returns Validation result with sanitized phone
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || typeof phone !== 'string') {
    return { isValid: true, errors: [], sanitizedValue: '' }; // Phone is optional
  }

  // Remove all non-digit characters except + at the beginning
  const sanitizedPhone = phone.replace(/[^\d+]/g, '');
  
  if (sanitizedPhone && !PHONE_REGEX.test(sanitizedPhone)) {
    errors.push('Please enter a valid phone number');
  }

  if (sanitizedPhone.length > 16) {
    errors.push('Phone number is too long');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedPhone,
  };
}

/**
 * Validates and sanitizes name fields
 * @param name - Name to validate
 * @param fieldName - Field name for error messages
 * @returns Validation result with sanitized name
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  const errors: string[] = [];
  
  if (!name || typeof name !== 'string') {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const sanitizedName = sanitizeText(name);
  
  if (!NAME_REGEX.test(sanitizedName)) {
    errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
  }

  if (sanitizedName.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters long`);
  }

  if (sanitizedName.length > 50) {
    errors.push(`${fieldName} must not exceed 50 characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizedName,
  };
}

/**
 * Validates user registration data
 * @param userData - User registration data
 * @returns Validation result for all fields
 */
export function validateRegistrationData(userData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  company?: string;
}): ValidationResult & { sanitizedData?: any } {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Validate name
  const nameValidation = validateName(userData.name, 'Full name');
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  } else {
    sanitizedData.name = nameValidation.sanitizedValue;
  }

  // Validate email
  const emailValidation = validateEmail(userData.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  } else {
    sanitizedData.email = emailValidation.sanitizedValue;
  }

  // Validate password confirmation
  if (userData.password !== userData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  // Validate phone (optional)
  if (userData.phone) {
    const phoneValidation = validatePhone(userData.phone);
    if (!phoneValidation.isValid) {
      errors.push(...phoneValidation.errors);
    } else {
      sanitizedData.phone = phoneValidation.sanitizedValue;
    }
  }

  // Validate company (optional)
  if (userData.company) {
    const sanitizedCompany = sanitizeText(userData.company);
    if (sanitizedCompany.length > 100) {
      errors.push('Company name must not exceed 100 characters');
    } else {
      sanitizedData.company = sanitizedCompany;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}

/**
 * Validates login credentials
 * @param email - Email address
 * @param password - Password
 * @returns Validation result
 */
export function validateLoginCredentials(email: string, password: string): ValidationResult & { sanitizedData?: any } {
  const errors: string[] = [];
  const sanitizedData: any = {};

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push('Please enter a valid email address');
  } else {
    sanitizedData.email = emailValidation.sanitizedValue;
  }

  // Basic password validation (don't reveal strength requirements during login)
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length > 128) {
    errors.push('Invalid credentials'); // Don't reveal specific length limits
  } else {
    sanitizedData.password = password; // Don't sanitize password during login
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined,
  };
}