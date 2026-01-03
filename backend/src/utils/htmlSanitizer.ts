/**
 * HTML Sanitization utilities for email templates.
 * Prevents XSS attacks by escaping special HTML characters.
 */

/**
 * Escapes HTML special characters to prevent XSS.
 * Use this for any user-provided data that will be included in HTML emails.
 */
export function escapeHtml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }

  const str = String(unsafe);

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#x60;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escapes HTML and truncates to a maximum length.
 * Useful for displaying user input in emails where space is limited.
 */
export function escapeAndTruncate(
  unsafe: string | null | undefined,
  maxLength: number
): string {
  const escaped = escapeHtml(unsafe);
  if (escaped.length <= maxLength) {
    return escaped;
  }
  return escaped.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitizes a wallet address for display in emails.
 * Validates format and escapes for HTML.
 */
export function sanitizeWalletAddress(address: string | null | undefined): string {
  if (!address) {
    return '';
  }

  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return escapeHtml(address);
  }

  // Already safe format, but escape anyway for consistency
  return escapeHtml(address);
}

/**
 * Sanitizes an email address for display in emails.
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) {
    return '';
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return escapeHtml(email);
  }

  return escapeHtml(email);
}

/**
 * Sanitizes a URL for use in href attributes.
 * Only allows http, https, and mailto protocols.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  const trimmed = url.trim();

  // Only allow safe protocols
  if (
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('mailto:')
  ) {
    return '';
  }

  // Escape HTML characters in URL
  return escapeHtml(trimmed);
}

/**
 * Formats a price safely for display in emails.
 */
export function formatPriceSafe(cents: number): string {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return '$0.00';
  }
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Formats a transaction hash safely for display.
 */
export function formatTxHashSafe(hash: string | null | undefined): string {
  if (!hash) {
    return '';
  }

  // Validate transaction hash format (0x followed by 64 hex chars)
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return escapeHtml(hash);
  }

  return escapeHtml(hash);
}
