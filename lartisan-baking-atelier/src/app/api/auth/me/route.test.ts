import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

// Mock session module
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "@/lib/auth/session";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (): Request => {
    return new Request("http://localhost/api/auth/me", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  };

  describe("successful retrieval", () => {
    it("should return user data when valid session exists", async () => {
      // Arrange
      const sessionData = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      const user = {
        id: "user-123",
        email: "test@example.com",
        passwordHash: "hashed-password",
        name: "Test User",
        role: "STUDENT",
        createdAt: new Date("2026-01-25T10:00:00.000Z"),
      };

      vi.mocked(getSession).mockResolvedValue(sessionData as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      });
      expect(getSession).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: sessionData.userId },
      });
    });

    it("should not include password hash in response", async () => {
      // Arrange
      const sessionData = {
        userId: "user-123",
        email: "secure@example.com",
        role: "STUDENT",
      };

      const user = {
        id: "user-123",
        email: "secure@example.com",
        passwordHash: "super-secret-hash",
        name: "Secure User",
        role: "STUDENT",
        createdAt: new Date(),
      };

      vi.mocked(getSession).mockResolvedValue(sessionData as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Assert
      expect(responseText).not.toContain("super-secret-hash");
      expect(responseText).not.toContain("passwordHash");
    });
  });

  describe("unauthorized access", () => {
    it("should return 401 when no session exists", async () => {
      // Arrange
      vi.mocked(getSession).mockResolvedValue(null);

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when user not found in database", async () => {
      // Arrange
      const sessionData = {
        userId: "deleted-user-123",
        email: "deleted@example.com",
        role: "STUDENT",
      };

      vi.mocked(getSession).mockResolvedValue(sessionData as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Arrange
      const sessionData = {
        userId: "user-123",
        email: "test@example.com",
        role: "STUDENT",
      };

      vi.mocked(getSession).mockResolvedValue(sessionData as any);
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error("Database error"),
      );

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("An unexpected error occurred");
    });
  });
});
