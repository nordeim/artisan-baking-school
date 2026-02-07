import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock the session module
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

// Import after mocking
import { getSession } from "@/lib/auth/session";
import { middleware, config } from "./middleware";

describe("Middleware", () => {
  const mockGetSession = vi.mocked(getSession);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create mock request
  function createMockRequest(
    pathname: string,
    method = "GET",
    cookies = "",
  ): NextRequest {
    const url = new URL(`http://localhost:3000${pathname}`);
    const req = {
      url: url.toString(),
      nextUrl: url,
      method,
      cookies: {
        get: (name: string) => {
          const match = cookies.match(new RegExp(`${name}=([^;]+)`));
          return match ? { name, value: match[1] } : undefined;
        },
        getAll: () => [],
        set: () => {},
        delete: () => {},
        has: () => false,
        clear: () => {},
        toString: () => cookies,
      },
      headers: new Headers(),
      body: null,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      formData: () => Promise.resolve(new FormData()),
      clone: () => createMockRequest(pathname, method, cookies),
    } as unknown as NextRequest;

    return req;
  }

  describe("Public Routes", () => {
    it("should allow access to home page without authentication", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/");

      const response = await middleware(req);

      expect(response).toBeUndefined();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should allow access to courses page without authentication", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/courses");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow access to login page without authentication", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/login");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow access to register page without authentication", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/register");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow access to auth API endpoints without authentication", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/api/auth/login", "POST");

      const response = await middleware(req);

      expect(response).toBeUndefined();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("should allow access to _next static files", async () => {
      const req = createMockRequest("/_next/static/chunks/main.js");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow access to favicon", async () => {
      const req = createMockRequest("/favicon.ico");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });
  });

  describe("Protected Routes - Redirects", () => {
    it("should redirect dashboard to login when no session", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/dashboard");

      const response = await middleware(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(307);
      expect(response?.headers.get("location")).toBe(
        "http://localhost:3000/login?from=%2Fdashboard",
      );
    });

    it("should redirect checkout to login when no session", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/checkout");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("/login");
    });

    it("should redirect learn routes to login when no session", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/learn/baking-basics");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("/login");
    });

    it("should preserve original pathname in redirect URL", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/dashboard/courses/baking-101");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain(
        "from=%2Fdashboard%2Fcourses%2Fbaking-101",
      );
    });

    it("should preserve query parameters in redirect", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/checkout?courseId=123");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("courseId%3D123");
    });
  });

  describe("Protected Routes - API Responses", () => {
    it("should return 401 JSON for protected API without session", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/api/orders", "GET");

      const response = await middleware(req);

      expect(response?.status).toBe(401);
      const body = await response?.json();
      expect(body).toEqual({
        error: "Unauthorized",
        message: "Authentication required",
      });
    });

    it("should return 401 for cart API without session", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/api/cart/items", "GET");

      const response = await middleware(req);

      expect(response?.status).toBe(401);
    });
  });

  describe("Admin Routes", () => {
    it("should redirect to login when no session accessing admin", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/admin");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("/login");
    });

    it("should return 403 for admin routes when user is not admin", async () => {
      mockGetSession.mockResolvedValue({
        userId: "user-123",
        email: "user@example.com",
        role: "STUDENT",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/admin/dashboard");

      const response = await middleware(req);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response?.status).toBe(403);
    });

    it("should return 403 JSON for admin API when user is not admin", async () => {
      mockGetSession.mockResolvedValue({
        userId: "user-123",
        email: "user@example.com",
        role: "STUDENT",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/api/admin/users", "GET");

      const response = await middleware(req);

      expect(response?.status).toBe(403);
      const body = await response?.json();
      expect(body).toEqual({
        error: "Forbidden",
        message: "Admin access required",
      });
    });

    it("should allow admin routes when user has ADMIN role", async () => {
      mockGetSession.mockResolvedValue({
        userId: "admin-123",
        email: "admin@example.com",
        role: "ADMIN",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/admin/dashboard");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow admin API when user has ADMIN role", async () => {
      mockGetSession.mockResolvedValue({
        userId: "admin-123",
        email: "admin@example.com",
        role: "ADMIN",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/api/admin/courses", "POST");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });
  });

  describe("Authenticated Access to Protected Routes", () => {
    it("should allow dashboard access with valid session", async () => {
      mockGetSession.mockResolvedValue({
        userId: "user-123",
        email: "user@example.com",
        role: "STUDENT",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/dashboard");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow checkout access with valid session", async () => {
      mockGetSession.mockResolvedValue({
        userId: "user-123",
        email: "user@example.com",
        role: "STUDENT",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/checkout");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow learn routes with valid session", async () => {
      mockGetSession.mockResolvedValue({
        userId: "user-123",
        email: "user@example.com",
        role: "STUDENT",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/learn/advanced-sourdough");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should allow orders API with valid session", async () => {
      mockGetSession.mockResolvedValue({
        userId: "user-123",
        email: "user@example.com",
        role: "STUDENT",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/api/orders/history", "GET");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed cookies gracefully", async () => {
      mockGetSession.mockRejectedValue(new Error("Invalid token"));
      const req = createMockRequest("/dashboard");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("/login");
    });

    it("should handle database errors gracefully", async () => {
      mockGetSession.mockRejectedValue(new Error("Database connection failed"));
      const req = createMockRequest("/dashboard");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("/login");
    });

    it("should handle nested protected routes", async () => {
      mockGetSession.mockResolvedValue(null);
      const req = createMockRequest("/dashboard/profile/settings");

      const response = await middleware(req);

      expect(response?.headers.get("location")).toContain("/login");
      expect(response?.headers.get("location")).toContain(
        "from=%2Fdashboard%2Fprofile%2Fsettings",
      );
    });

    it("should handle nested admin routes", async () => {
      mockGetSession.mockResolvedValue({
        userId: "admin-123",
        email: "admin@example.com",
        role: "ADMIN",
        accessToken: "token",
        refreshToken: "refresh",
      });
      const req = createMockRequest("/admin/courses/create");

      const response = await middleware(req);

      expect(response).toBeUndefined();
    });

    it("should handle API routes with different HTTP methods", async () => {
      mockGetSession.mockResolvedValue(null);

      const getReq = createMockRequest("/api/cart", "GET");
      const postReq = createMockRequest("/api/cart", "POST");
      const deleteReq = createMockRequest("/api/cart", "DELETE");

      const getRes = await middleware(getReq);
      const postRes = await middleware(postReq);
      const deleteRes = await middleware(deleteReq);

      expect(getRes?.status).toBe(401);
      expect(postRes?.status).toBe(401);
      expect(deleteRes?.status).toBe(401);
    });
  });

  describe("Config Export", () => {
    it("should export correct matcher configuration", () => {
      expect(config).toHaveProperty("matcher");
      expect(Array.isArray(config.matcher)).toBe(true);

      // Matcher uses negation pattern to exclude static files
      // and match everything else (including protected/admin routes)
      const matchers = config.matcher as string[];
      expect(matchers.length).toBeGreaterThan(0);
      // Should exclude _next/static and _next/image
      expect(matchers[0]).toContain("_next/static");
      expect(matchers[0]).toContain("_next/image");
      expect(matchers[0]).toContain("favicon.ico");
    });
  });
});
