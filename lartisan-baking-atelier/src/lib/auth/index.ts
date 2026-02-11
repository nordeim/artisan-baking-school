// Re-export all auth utilities
export * from "./jwt";
export * from "./password";
export * from "./session";

import { generateSecureToken } from "./password";

/**
 * Generates a password reset token for a user
 * Creates a cryptographically secure token that can be used
 * for password reset flows
 *
 * @param userId - The user ID to associate with the token
 * @returns A secure random token string
 *
 * @example
 * const token = generatePasswordResetToken('user_123');
 * // Returns: 'a3f5b2c8d1e4...' (64 hex characters)
 */
export function generatePasswordResetToken(userId: string): string {
  // Combine userId with random token for additional security
  const randomPart = generateSecureToken(32);
  const timestamp = Date.now().toString(36);
  return `${userId}:${timestamp}:${randomPart}`;
}
