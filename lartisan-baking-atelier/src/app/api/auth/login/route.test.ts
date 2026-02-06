import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Import mocked prisma after mock declaration
import { prisma } from "@/lib/prisma";

// Mock password verification
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));
import { verifyPassword } from "@/lib/auth/password";

// Mock session
vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
}));
import { createSession } from "@/lib/auth/session";

describe("POST /api/auth/login", () => {
  beforeEach(() => {
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
      const user = {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed-password",
        name: "Test User",
        role: "STUDENT",
        createdAt: new Date("2026-01-25T10:00:00Z"),
        updatedAt: new Date("2026-01-25T10:00:00Z"),
      } as import("@prisma/client").User;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        user: { id: user.id, email: user.email, role: user.role },
      });

      // Act
      const request = createRequest({
        email: "test@example.com",
        password: "SecurePass123!",
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
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(verifyPassword).toHaveBeenCalledWith(
        "SecurePass123!",
        "hashed-password",
      );
      expect(createSession).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it("should set authentication cookies on successful login", async () => {
      // Arrange
      const user = {
        id: "user-123",
        email: "cookie@example.com",
        passwordHash: "hashed-password",
        name: "Cookie Test",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as import("@prisma/client").User;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        user: { id: user.id, email: user.email, role: user.role },
      });

      // Act
      const request = createRequest({
        email: "cookie@example.com",
        password: "SecurePass123!",
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
      // Arrange
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

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
      expect(createSession).not.toHaveBeenCalled();
    });

    it("should return 401 for wrong password", async () => {
      // Arrange
      const user = {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed-password",
        name: "Test User",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as import("@prisma/client").User;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
      vi.mocked(verifyPassword).mockResolvedValue(false);

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
      expect(createSession).not.toHaveBeenCalled();
    });

    it("should return identical error message for all authentication failures", async () => {
      // Arrange - create user with specific password
      const user = {
        id: "user-123",
        email: "exists@example.com",
        passwordHash: "hashed-password",
        name: "Existing User",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as import("@prisma/client").User;

      // Act - test non-existent user
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const request1 = createRequest({
        email: "nonexistent@example.com",
        password: "AnyPass123!",
      });
      const response1 = await POST(request1);
      const data1 = await response1.json();

      // Act - test wrong password
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
      vi.mocked(verifyPassword).mockResolvedValue(false);
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
      const user = {
        id: "user-123",
        email: "secure@example.com",
        passwordHash: "super-secret-hashed-password",
        name: "Secure User",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as import("@prisma/client").User;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(createSession).mockResolvedValue({
        accessToken: "token",
        refreshToken: "refresh",
        user: { id: user.id, email: user.email, role: user.role },
      });

      // Act
      const request = createRequest({
        email: "secure@example.com",
        password: "SecurePass123!",
      });
      const response = await POST(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Assert
      expect(responseText).not.toContain("super-secret-hashed-password");
      expect(responseText).not.toContain("password");
      expect(responseText).not.toContain("passwordHash");
    });

    it("should handle database errors gracefully", async () => {
      // Arrange - mock prisma to simulate error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Act
      const request = createRequest({
        email: "test@example.com",
        password: "SomePassword123!",
      });
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("An unexpected error occurred");
    });
  });
});
