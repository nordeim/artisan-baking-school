import { describe, it, expect, beforeAll } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  type JWTPayload,
} from "./jwt";

describe("signAccessToken", () => {
  const payload: JWTPayload = {
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
  };

  it("should sign a valid access token", async () => {
    const token = await signAccessToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
  });

  it("should include payload data in token", async () => {
    const token = await signAccessToken(payload);
    const decoded = decodeToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it("should include issued at timestamp", async () => {
    const beforeSign = Math.floor(Date.now() / 1000);
    const token = await signAccessToken(payload);
    const afterSign = Math.floor(Date.now() / 1000);

    const decoded = decodeToken(token) as JWTPayload & { iat: number };
    expect(decoded.iat).toBeGreaterThanOrEqual(beforeSign);
    expect(decoded.iat).toBeLessThanOrEqual(afterSign);
  });

  it("should include expiration timestamp", async () => {
    const token = await signAccessToken(payload);
    const decoded = decodeToken(token) as JWTPayload & {
      exp: number;
      iat: number;
    };

    // Access token should expire in approximately 7 days
    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    const expectedExp = decoded.iat + sevenDaysInSeconds;

    expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5); // Allow 5 second tolerance
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
  });
});

describe("signRefreshToken", () => {
  const payload: JWTPayload = {
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
  };

  it("should sign a valid refresh token", async () => {
    const token = await signRefreshToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should have longer expiry than access token", async () => {
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    const accessDecoded = decodeToken(accessToken) as JWTPayload & {
      exp: number;
    };
    const refreshDecoded = decodeToken(refreshToken) as JWTPayload & {
      exp: number;
    };

    expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
  });

  it("should include refresh token expiry of ~30 days", async () => {
    const token = await signRefreshToken(payload);
    const decoded = decodeToken(token) as JWTPayload & {
      exp: number;
      iat: number;
    };

    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const expectedExp = decoded.iat + thirtyDaysInSeconds;

    expect(decoded.exp).toBeGreaterThanOrEqual(expectedExp - 5);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExp + 5);
  });
});

describe("verifyAccessToken", () => {
  const payload: JWTPayload = {
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
  };

  it("should verify a valid access token", async () => {
    const token = await signAccessToken(payload);
    const verified = await verifyAccessToken(token);

    expect(verified.userId).toBe(payload.userId);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
  });

  it("should reject an invalid token", async () => {
    await expect(verifyAccessToken("invalid.token.here")).rejects.toThrow();
  });

  it("should reject a token with wrong signature", async () => {
    const token = await signAccessToken(payload);
    const tamperedToken = token.slice(0, -10) + "tampered123";

    await expect(verifyAccessToken(tamperedToken)).rejects.toThrow();
  });

  it("should reject a refresh token when verifying access token", async () => {
    const refreshToken = await signRefreshToken(payload);

    // Refresh tokens are signed with different secret
    await expect(verifyAccessToken(refreshToken)).rejects.toThrow();
  });
});

describe("verifyRefreshToken", () => {
  const payload: JWTPayload = {
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
  };

  it("should verify a valid refresh token", async () => {
    const token = await signRefreshToken(payload);
    const verified = await verifyRefreshToken(token);

    expect(verified.userId).toBe(payload.userId);
    expect(verified.email).toBe(payload.email);
    expect(verified.role).toBe(payload.role);
  });

  it("should reject an invalid token", async () => {
    await expect(verifyRefreshToken("invalid.token.here")).rejects.toThrow();
  });

  it("should reject an access token when verifying refresh token", async () => {
    const accessToken = await signAccessToken(payload);

    // Access tokens are signed with different secret
    await expect(verifyRefreshToken(accessToken)).rejects.toThrow();
  });
});

describe("decodeToken", () => {
  const payload: JWTPayload = {
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
  };

  it("should decode a valid token", async () => {
    const token = await signAccessToken(payload);
    const decoded = decodeToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
  });

  it("should return null for invalid token format", () => {
    const decoded = decodeToken("not-a-valid-token");
    expect(decoded).toBeNull();
  });

  it("should return null for empty string", () => {
    const decoded = decodeToken("");
    expect(decoded).toBeNull();
  });

  it("should decode without verifying signature", async () => {
    const token = await signAccessToken(payload);
    const tamperedToken = token.slice(0, -5) + "xxxxx";

    // Should still decode (signature not checked)
    const decoded = decodeToken(tamperedToken);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
  });
});

describe("isTokenExpired", () => {
  const payload: JWTPayload = {
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
  };

  it("should return false for valid token", async () => {
    const token = await signAccessToken(payload);
    expect(isTokenExpired(token)).toBe(false);
  });

  it("should return true for expired token", async () => {
    // Create a token that expired 1 hour ago
    const expiredToken = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("-1h")
      .sign(
        new TextEncoder().encode(
          process.env.JWT_SECRET ||
            "fallback-secret-key-at-least-32-characters",
        ),
      );

    expect(isTokenExpired(expiredToken)).toBe(true);
  });

  it("should return true for invalid token", () => {
    expect(isTokenExpired("invalid")).toBe(true);
  });
});
