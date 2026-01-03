import { logger } from './logger';

/**
 * Sanitizes error messages for client responses.
 * In production, internal error details are hidden to prevent information disclosure.
 * In development, full error messages are shown for debugging.
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage: string = 'An error occurred'
): string {
  // In development, show the actual error message
  if (process.env.NODE_ENV !== 'production') {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
  }

  // In production, log the full error but return a generic message
  if (error instanceof Error) {
    // Log the actual error for debugging
    logger.error('Sanitized error:', {
      message: error.message,
      stack: error.stack,
    });
  }

  // Return the fallback message for production
  return fallbackMessage;
}

/**
 * Creates a safe error response object.
 * Includes error code for client-side handling without exposing internals.
 */
export function createErrorResponse(
  error: unknown,
  fallbackMessage: string,
  code?: string
): { error: string; code?: string } {
  const response: { error: string; code?: string } = {
    error: sanitizeErrorMessage(error, fallbackMessage),
  };

  if (code) {
    response.code = code;
  }

  return response;
}

/**
 * List of safe error messages that can be passed through to clients
 * These are user-facing messages that don't expose internal details
 */
const SAFE_ERROR_PATTERNS = [
  /^Invalid.*required$/i,
  /^Missing required/i,
  /^Not found/i,
  /^Unauthorized/i,
  /^Forbidden/i,
  /^Already exists/i,
  /^Wallet address/i,
  /^Invalid wallet/i,
  /^Invalid email/i,
  /^Password must/i,
  /^NFT not available/i,
  /^Cart/i,
  /^Listing/i,
  /^Offer/i,
];

/**
 * Checks if an error message is safe to expose to clients
 */
export function isSafeErrorMessage(message: string): boolean {
  return SAFE_ERROR_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Gets a safe error message, passing through known safe messages
 * and sanitizing unknown ones
 */
export function getSafeErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof Error) {
    if (isSafeErrorMessage(error.message)) {
      return error.message;
    }
  }

  if (typeof error === 'string') {
    if (isSafeErrorMessage(error)) {
      return error;
    }
  }

  return sanitizeErrorMessage(error, fallbackMessage);
}
