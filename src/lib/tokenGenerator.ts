import crypto from 'crypto';

/**
 * Generate a random token for public order sharing
 * Uses crypto.randomBytes for secure random generation
 * Returns a URL-safe base64 string (32 bytes = 43 characters)
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
