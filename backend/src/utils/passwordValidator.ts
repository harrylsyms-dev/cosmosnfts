/**
 * Password validation utilities for strong password enforcement.
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates a password against security requirements.
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not in common password list
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }

  // Minimum length
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Maximum length (prevent DoS via long passwords)
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?`~)');
  }

  // Check against common passwords
  if (isCommonPassword(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more unique password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common passwords list (abbreviated - in production, use a more comprehensive list)
 */
const COMMON_PASSWORDS = new Set([
  'password123',
  'password1234',
  'password12345',
  '123456789012',
  'qwerty123456',
  'admin1234567',
  'letmein12345',
  'welcome12345',
  'monkey123456',
  'dragon123456',
  'master123456',
  'michael12345',
  'shadow123456',
  'sunshine1234',
  'princess1234',
  'football1234',
  'baseball1234',
  'iloveyou1234',
  'trustno12345',
  'superman1234',
  'batman123456',
  'passw0rd1234',
  'p@ssword1234',
  'p@ssw0rd1234',
  'changeme1234',
  'welcome1234!',
  'password1234!',
  'admin@123456',
  'root12345678',
]);

/**
 * Checks if password is in the common passwords list
 */
function isCommonPassword(password: string): boolean {
  // Check exact match
  if (COMMON_PASSWORDS.has(password)) {
    return true;
  }

  // Check if password contains common weak patterns
  const weakPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
    /^abc123/i,
  ];

  return weakPatterns.some(pattern => pattern.test(password));
}

/**
 * Generates a password strength score (0-100)
 */
export function getPasswordStrength(password: string): number {
  let score = 0;

  if (!password) return 0;

  // Length scoring (up to 30 points)
  score += Math.min(password.length * 2, 30);

  // Character variety scoring (up to 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Complexity bonus (up to 30 points)
  const uniqueChars = new Set(password).size;
  score += Math.min(uniqueChars * 2, 20);

  // Penalty for common patterns
  if (isCommonPassword(password.toLowerCase())) {
    score = Math.max(score - 50, 0);
  }

  // Penalty for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(score - 10, 0);
  }

  return Math.min(score, 100);
}

/**
 * Returns a human-readable password strength label
 */
export function getPasswordStrengthLabel(password: string): string {
  const score = getPasswordStrength(password);

  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Weak';
  return 'Very Weak';
}
