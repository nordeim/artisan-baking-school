import { describe, it, expect, beforeEach, vi } from "vitest";
import { cookies } from "next/headers";
import {
  createSession,
  getSession,
  refreshSession,
  destroySession,
  type SessionData,
} from "./session";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock JWT module
vi.mock("./jwt", () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyAccessToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

// Import mocked functions after mock declaration
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

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

    // Set up default mock return values
    vi.mocked(signAccessToken).mockResolvedValue("mock-access-token");
    vi.mocked(signRefreshToken).mockResolvedValue("mock-refresh-token");
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
        "mock-access-token",
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
        "mock-refresh-token",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        }),
      );

      // Verify returned session data
      expect(result).toEqual({
        userId,
        email,
        role,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
    });

    it("should handle token generation errors gracefully", async () => {
      vi.mocked(signAccessToken).mockRejectedValue(
        new Error("Token generation failed"),
      );

      await expect(
        createSession({
          userId: "user-123",
          email: "test@example.com",
          role: "STUDENT",
        }),
      ).rejects.toThrow("Token generation failed");
    });
  });

  describe("getSession", () => {
    it("should return session data when valid access token exists", async () => {
      const payload = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      vi.mocked(verifyAccessToken).mockResolvedValue(payload);

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") {
          return { value: "valid-access-token" };
        }
        return undefined;
      });

      const session = await getSession();

      expect(session).toEqual({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        accessToken: "valid-access-token",
        refreshToken: "",
      });
      expect(verifyAccessToken).toHaveBeenCalledWith("valid-access-token");
    });

    it("should return null when no access token exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("should return null when access token is invalid and no refresh token", async () => {
      vi.mocked(verifyAccessToken).mockRejectedValue(
        new Error("Invalid token"),
      );

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") {
          return { value: "invalid.token" };
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

      // Set up mocks in order: first access token verification fails, then refresh works
      vi.mocked(verifyAccessToken).mockRejectedValueOnce(
        new Error("Invalid token"),
      );
      vi.mocked(verifyRefreshToken).mockResolvedValueOnce(refreshPayload);
      // When refreshSession calls createSession, these should return new tokens
      vi.mocked(signAccessToken).mockResolvedValueOnce("new-access-token");
      vi.mocked(signRefreshToken).mockResolvedValueOnce("new-refresh-token");

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "access_token") {
          return { value: "invalid.token" };
        }
        if (name === "refresh_token") {
          return { value: "valid-refresh-token" };
        }
        return undefined;
      });

      const session = await getSession();

      // When getSession calls refreshSession internally, it returns the result from createSession
      // which uses the mocked signAccessToken and signRefreshToken
      expect(session).toEqual({
        userId: refreshPayload.userId,
        email: refreshPayload.email,
        role: refreshPayload.role,
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      expect(verifyRefreshToken).toHaveBeenCalledWith("valid-refresh-token");
    });
  });

  describe("refreshSession", () => {
    it("should create new access token from valid refresh token", async () => {
      const payload = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      vi.mocked(verifyRefreshToken).mockResolvedValueOnce(payload);
      // When refreshSession calls createSession, it generates new tokens
      vi.mocked(signAccessToken).mockResolvedValueOnce("new-access-token");
      vi.mocked(signRefreshToken).mockResolvedValueOnce("new-refresh-token");

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "refresh_token") {
          return { value: "valid-refresh-token" };
        }
        return undefined;
      });

      const session = await refreshSession();

      expect(session).toEqual({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "access_token",
        "new-access-token",
        expect.any(Object),
      );
    });

    it("should throw error when no refresh token exists", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      await expect(refreshSession()).rejects.toThrow("No refresh token found");
    });

    it("should throw error for invalid refresh token", async () => {
      // Make verifyRefreshToken throw an error
      vi.mocked(verifyRefreshToken).mockRejectedValueOnce(
        new Error("Token verification failed"),
      );

      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === "refresh_token") {
          return { value: "invalid-refresh-token" };
        }
        return undefined;
      });

      // refreshSession catches the error and throws "Invalid refresh token"
      await expect(refreshSession()).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("destroySession", () => {
    it("should clear all session cookies", async () => {
      await destroySession();

      expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.delete).toHaveBeenCalledWith("access_token");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });

    it("should handle missing cookies gracefully without throwing", async () => {
      mockCookieStore.delete.mockImplementation(() => {
        throw new Error("Cookie not found");
      });

      // Should not throw even if cookies don't exist
      await expect(destroySession()).resolves.toBeUndefined();
      expect(mockCookieStore.delete).toHaveBeenCalledWith("access_token");
      expect(mockCookieStore.delete).toHaveBeenCalledWith("refresh_token");
    });
  });
});
