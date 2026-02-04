import { SignJWT, jwtVerify } from "jose/node";

/**
 * JWT Authentication Utilities
 * Uses Jose library for JWT signing and verification
 * Supports access tokens (short-lived) and refresh tokens (long-lived)
 */

// JWT Secrets from environment variables
const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-at-least-32-characters",
);

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ||
    "fallback-refresh-secret-key-at-least-32-chars",
);

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "7d"; // 7 days
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Signs a new access token
 *
 * @param payload - User data to encode in token
 * @returns Promise resolving to JWT string
 *
 * @example
 * const token = await signAccessToken({
 *   userId: '123',
 *   email: 'user@example.com',
 *   role: 'STUDENT'
 * });
 */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(ACCESS_TOKEN_SECRET);
}

/**
 * Signs a new refresh token
 *
 * @param payload - User data to encode in token
 * @returns Promise resolving to JWT string
 *
 * @example
 * const refreshToken = await signRefreshToken({
 *   userId: '123',
 *   email: 'user@example.com',
 *   role: 'STUDENT'
 * });
 */
export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(REFRESH_TOKEN_SECRET);
}

/**
 * Verifies an access token
 *
 * @param token - JWT string to verify
 * @returns Promise resolving to decoded payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * const payload = await verifyAccessToken(token);
 * console.log(payload.userId); // '123'
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET);
  return payload as JWTPayload;
}

/**
 * Verifies a refresh token
 *
 * @param token - JWT string to verify
 * @returns Promise resolving to decoded payload
 * @throws Error if token is invalid or expired
 *
 * @example
 * const payload = await verifyRefreshToken(refreshToken);
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET);
  return payload as JWTPayload;
}

/**
 * Decodes a token without verifying
 * Useful for getting payload without validation (e.g., for debugging)
 *
 * @param token - JWT string to decode
 * @returns Decoded payload or null if invalid format
 *
 * @example
 * const payload = decodeToken(token);
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;

    const payload = JSON.parse(
      Buffer.from(base64Payload, "base64").toString("utf-8"),
    );
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Checks if a token is expired
 *
 * @param token - JWT string to check
 * @returns boolean indicating if token is expired
 *
 * @example
 * const isExpired = isTokenExpired(token);
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !("exp" in payload)) return true;

  const exp = (payload as JWTPayload & { exp: number }).exp;
  return Date.now() >= exp * 1000;
}
