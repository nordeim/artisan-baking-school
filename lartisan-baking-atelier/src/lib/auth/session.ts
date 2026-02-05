import { cookies } from "next/headers";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JWTPayload,
} from "./jwt";

/**
 * Session data structure returned after successful authentication
 */
export interface SessionData {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Cookie configuration for secure session management
 */
const COOKIE_CONFIG = {
  accessToken: {
    name: "access_token" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  refreshToken: {
    name: "refresh_token" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
};

/**
 * Get cookie options based on environment
 */
function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

/**
 * Creates a new session for a user
 * Generates access and refresh tokens, sets HTTP-only cookies
 *
 * @param payload - User data to encode in tokens
 * @returns SessionData with tokens and user info
 *
 * @example
 * const session = await createSession({
 *   userId: 'user-123',
 *   email: 'test@example.com',
 *   role: 'STUDENT'
 * });
 */
export async function createSession(payload: JWTPayload): Promise<SessionData> {
  const cookieStore = await cookies();

  // Generate tokens
  const accessToken = await signAccessToken(payload);
  const refreshToken = await signRefreshToken(payload);

  // Set HTTP-only cookies
  cookieStore.set(
    COOKIE_CONFIG.accessToken.name,
    accessToken,
    getCookieOptions(COOKIE_CONFIG.accessToken.maxAge),
  );

  cookieStore.set(
    COOKIE_CONFIG.refreshToken.name,
    refreshToken,
    getCookieOptions(COOKIE_CONFIG.refreshToken.maxAge),
  );

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    accessToken,
    refreshToken,
  };
}

/**
 * Gets the current session from cookies
 * Validates access token, attempts refresh if expired
 *
 * @returns SessionData if valid session exists, null otherwise
 *
 * @example
 * const session = await getSession();
 * if (session) {
 *   console.log(session.userId); // 'user-123'
 * }
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();

  const accessTokenCookie = cookieStore.get(COOKIE_CONFIG.accessToken.name);

  if (!accessTokenCookie?.value) {
    return null;
  }

  try {
    // Try to verify access token
    const payload = await verifyAccessToken(accessTokenCookie.value);
    const refreshTokenCookie = cookieStore.get(COOKIE_CONFIG.refreshToken.name);

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      accessToken: accessTokenCookie.value,
      refreshToken: refreshTokenCookie?.value || "",
    };
  } catch {
    // Access token is invalid or expired, try to refresh
    try {
      return await refreshSession();
    } catch {
      return null;
    }
  }
}

/**
 * Refreshes the session using the refresh token
 * Creates new access and refresh tokens
 *
 * @returns New SessionData with fresh tokens
 * @throws Error if no refresh token or refresh token is invalid
 *
 * @example
 * try {
 *   const newSession = await refreshSession();
 * } catch (error) {
 *   // Redirect to login
 * }
 */
export async function refreshSession(): Promise<SessionData> {
  const cookieStore = await cookies();

  const refreshTokenCookie = cookieStore.get(COOKIE_CONFIG.refreshToken.name);

  if (!refreshTokenCookie?.value) {
    throw new Error("No refresh token found");
  }

  try {
    // Verify refresh token
    const payload = await verifyRefreshToken(refreshTokenCookie.value);

    // Create new session with fresh tokens
    return await createSession(payload);
  } catch (error) {
    // Clear invalid cookies
    destroySession();
    throw new Error("Invalid refresh token");
  }
}

/**
 * Destroys the current session
 * Clears both access and refresh token cookies
 *
 * @example
 * await destroySession();
 * // User is now logged out
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();

  try {
    cookieStore.delete(COOKIE_CONFIG.accessToken.name);
  } catch {
    // Cookie might not exist, ignore error
  }

  try {
    cookieStore.delete(COOKIE_CONFIG.refreshToken.name);
  } catch {
    // Cookie might not exist, ignore error
  }
}
