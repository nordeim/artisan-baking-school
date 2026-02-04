import bcrypt from "bcryptjs";

/**
 * Number of salt rounds for bcrypt hashing
 * Higher is more secure but slower
 * 12 is a good balance for production
 */
const SALT_ROUNDS = 12;

/**
 * Hashes a plain text password using bcrypt
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 *
 * @example
 * const hash = await hashPassword('myPassword123');
 * // Returns: '$2a$12$...' (bcrypt hash)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plain text password against a bcrypt hash
 *
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns Promise resolving to boolean indicating match
 *
 * @example
 * const isValid = await verifyPassword('myPassword123', storedHash);
 * // Returns: true or false
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure random token
 * Useful for password reset tokens, email verification, etc.
 *
 * @param length - Length of token in bytes (default: 32)
 * @returns Hex string representation of random bytes
 *
 * @example
 * const token = generateSecureToken(32);
 * // Returns: 'a3f5b2c8d1e4...' (64 hex characters)
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}
