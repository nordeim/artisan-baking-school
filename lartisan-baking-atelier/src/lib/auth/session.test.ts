import { describe, it, expect, beforeEach, vi } from "vitest";
import { cookies } from "next/headers";
import {
  createSession,
  getSession,
  refreshSession,
  destroySession,
  type SessionData,
} from "./session";
import { signAccessToken, signRefreshToken } from "./jwt";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Session Management", () => {
  let mockCookieStore: {
    set: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    [Symbol.iterator]: () => Iterator<[string, string]>;
    size: number;
    getAll: () => { name: string; value: string }[];
    has: (name: string) => boolean;
  };

  beforeEach(() => {
    mockCookieStore = {
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      [Symbol.iterator]: function* () {
        yield* [];
      },
      size: 0,
      getAll: () => [],
      has: () => false,
    };
    vi.mocked(cookies).mockReturnValue(
      Promise.resolve(
        mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>,
      ),
    );
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("should create session and set HTTP-only cookies", async () => {
      const userId = "user-123";
      const email = "test@example.com";
      const role = "STUDENT";

      const result = await createSession({ userId, email, role });

      // Verify both cookies are set
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);

      // Check access token cookie
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "access_token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: false, // false in test environment
          sameSite: "strict",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        }),
      );

      // Check refresh token cookie
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "refresh_token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        }),
      );

      // Verify returned session data
      expect(result).toMatchObject({
        userId,
        email,
        role,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it("should have correct cookie options in development", async () => {
      await createSession({
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      });

      // Check cookie options are correct
      const calls = mockCookieStore.set.mock.calls;
      calls.forEach((call) => {
        expect(call[2]).toMatchObject({
          httpOnly: true,
          secure: false, // false in development/test
          sameSite: "strict",
          path: "/",
        });
      });
    });
  });

  describe("getSession", () => {
    it("should return session data when valid access token exists", async () => {
      const payload = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      const accessToken = await signAccessToken(payload);

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") {
          return { value: accessToken };
        }
        return undefined;
      });

      const session = await getSession();

      expect(session).toMatchObject({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        accessToken: expect.any(String),
      });
    });

    it("should return null when no access token exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("should return null for invalid token", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") {
          return { value: "invalid.token.here" };
        }
        return undefined;
      });

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("should refresh session when access token is invalid but refresh token is valid", async () => {
      const refreshPayload = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      const refreshToken = await signRefreshToken(refreshPayload);

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") {
          return { value: "invalid.token" };
        }
        if (name === "refresh_token") {
          return { value: refreshToken };
        }
        return undefined;
      });

      // getSession should attempt refresh when access token is invalid
      // and return a new session with valid refresh token
      const session = await getSession();
      expect(session).toMatchObject({
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });
  });

  describe("refreshSession", () => {
    it("should create new access token from valid refresh token", async () => {
      const payload = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      const refreshToken = await signRefreshToken(payload);

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "refresh_token") {
          return { value: refreshToken };
        }
        return undefined;
      });

      const result = await refreshSession();

      expect(result).toMatchObject({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verify new cookies are set
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    });

    it("should throw error when no refresh token exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await expect(refreshSession()).rejects.toThrow("No refresh token found");
    });

    it("should throw error for invalid refresh token", async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "refresh_token") {
          return { value: "invalid.token" };
        }
        return undefined;
      });

      await expect(refreshSession()).rejects.toThrow();
    });
  });

  describe("destroySession", () => {
    it("should clear both access and refresh token cookies", async () => {
      await destroySession();

      expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.delete).toHaveBeenCalledWith("access_token");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });

    it("should handle gracefully if cookies don't exist", async () => {
      mockCookieStore.delete.mockImplementation(() => {
        // In real implementation, delete doesn't throw if cookie doesn't exist
        return undefined;
      });

      // Should not throw
      await expect(destroySession()).resolves.not.toThrow();
    });
  });

  describe("SessionData type", () => {
    it("should have correct structure", async () => {
      const session: SessionData = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
        accessToken: "access-token",
        refreshToken: "refresh-token",
      };

      expect(session.userId).toBe("user-123");
      expect(session.email).toBe("test@example.com");
      expect(session.role).toBe("STUDENT");
      expect(session.accessToken).toBe("access-token");
      expect(session.refreshToken).toBe("refresh-token");
    });
  });
});
