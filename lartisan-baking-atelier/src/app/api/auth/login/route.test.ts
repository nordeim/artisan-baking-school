import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import * as sessionModule from "@/lib/auth/session";

// Mock the session module
vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
}));

describe("POST /api/auth/login", () => {
  const mockCreateSession = sessionModule.createSession as vi.Mock;

  beforeEach(async () => {
    await prisma.user.deleteMany();
    vi.clearAllMocks();
  });

  const createRequest = (body: unknown): Request => {
    return new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  describe("successful login", () => {
    it("should login with valid credentials and return user data", async () => {
      // Arrange
      const password = "SecurePass123!";
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash,
          name: "Test User",
          pdpaConsent: true,
          pdpaConsentDate: new Date(),
        },
      });

      mockCreateSession.mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: { id: user.id, email: user.email, role: user.role },
      });

      // Act
      const request = createRequest({
        email: "test@example.com",
        password: password,
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Login successful");
      expect(data.user).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      });
      expect(mockCreateSession).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it("should set authentication cookies on successful login", async () => {
      // Arrange
      const password = "SecurePass123!";
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email: "cookie@example.com",
          passwordHash,
          name: "Cookie Test",
          pdpaConsent: true,
          pdpaConsentDate: new Date(),
        },
      });

      mockCreateSession.mockResolvedValue({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        user: { id: user.id, email: user.email, role: user.role },
      });

      // Act
      const request = createRequest({
        email: "cookie@example.com",
        password: password,
      });
      const response = await POST(request);
      const setCookieHeader = response.headers.get("Set-Cookie");

      // Assert
      expect(setCookieHeader).toBeTruthy();
      expect(setCookieHeader).toContain("auth-token=access-token-123");
      expect(setCookieHeader).toContain("refresh-token=refresh-token-456");
      expect(setCookieHeader).toContain("HttpOnly");
      expect(setCookieHeader).toContain("SameSite=strict");
    });
  });

  describe("invalid credentials", () => {
    it("should return 401 for non-existent user", async () => {
      // Act
      const request = createRequest({
        email: "nonexistent@example.com",
        password: "SomePassword123!",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid email or password");
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it("should return 401 for wrong password", async () => {
      // Arrange
      const passwordHash = await hashPassword("CorrectPass123!");
      await prisma.user.create({
        data: {
          email: "test@example.com",
          passwordHash,
          name: "Test User",
          pdpaConsent: true,
          pdpaConsentDate: new Date(),
        },
      });

      // Act
      const request = createRequest({
        email: "test@example.com",
        password: "WrongPassword123!",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Invalid email or password");
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it("should return identical error message for all authentication failures", async () => {
      // Arrange - create user with specific password
      const passwordHash = await hashPassword("SecretPass123!");
      await prisma.user.create({
        data: {
          email: "exists@example.com",
          passwordHash,
          name: "Existing User",
          pdpaConsent: true,
          pdpaConsentDate: new Date(),
        },
      });

      // Act - test non-existent user
      const request1 = createRequest({
        email: "nonexistent@example.com",
        password: "AnyPass123!",
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();

      // Act - test wrong password
      const request2 = createRequest({
        email: "exists@example.com",
        password: "WrongPass123!",
      });
      const response2 = await POST(request2);
      const data2 = await response2.json();

      // Assert - both should have identical messages
      expect(data1.error).toBe(data2.error);
      expect(data1.error).toBe("Invalid email or password");
    });
  });

  describe("validation errors", () => {
    it("should return 400 for missing email", async () => {
      // Act
      const request = createRequest({
        password: "SomePassword123!",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBeDefined();
    });

    it("should return 400 for invalid email format", async () => {
      // Act
      const request = createRequest({
        email: "not-an-email",
        password: "SomePassword123!",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 for missing password", async () => {
      // Act
      const request = createRequest({
        email: "test@example.com",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 for password too short", async () => {
      // Act
      const request = createRequest({
        email: "test@example.com",
        password: "short",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should return 400 for invalid JSON", async () => {
      // Act
      const request = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(data.details).toBe("Invalid JSON");
    });
  });

  describe("security and data sanitization", () => {
    it("should not include password hash in response", async () => {
      // Arrange
      const password = "SecurePass123!";
      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          email: "secure@example.com",
          passwordHash,
          name: "Secure User",
          pdpaConsent: true,
          pdpaConsentDate: new Date(),
        },
      });

      mockCreateSession.mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        user: { id: user.id, email: user.email, role: user.role },
      });

      // Act
      const request = createRequest({
        email: "secure@example.com",
        password: password,
      });
      const response = await POST(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Assert
      expect(responseText).not.toContain(passwordHash);
      expect(responseText).not.toContain("password");
      expect(responseText).not.toContain("passwordHash");
    });

    // Note: Database error handling is tested in integration tests
    // This test would require mocking at module level which conflicts with
    // the real prisma client used by other tests
    it.skip("should handle database errors gracefully", async () => {
      // Skipped - requires module-level mocking incompatible with other tests
      // The route does handle errors with 500 status as shown in the implementation
    });
  });
});
