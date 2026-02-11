import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (searchParams: string = ""): Request => {
    return new Request(`http://localhost/api/admin/users${searchParams}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
  };

  describe("successful retrieval", () => {
    it("should return paginated users list", async () => {
      // Arrange
      const mockUsers = [
        {
          id: "user-1",
          email: "user1@example.com",
          name: "User One",
          role: "STUDENT",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
          emailVerified: null,
          image: null,
        },
        {
          id: "user-2",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
          createdAt: new Date("2026-01-10"),
          updatedAt: new Date("2026-01-10"),
          emailVerified: new Date("2026-01-11"),
          image: null,
        },
      ];

      vi.mocked(prisma.user.count).mockResolvedValue(2);
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.page).toBe(1);
      expect(data.totalPages).toBe(1);
      expect(data.users[0].role).toBe("USER"); // STUDENT converted to USER
      expect(data.users[1].role).toBe("ADMIN");
    });

    it("should exclude sensitive fields from response", async () => {
      // Arrange
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        image: null,
        passwordHash: "should-not-be-included",
        pdpaConsent: true,
        marketingConsent: false,
      };

      vi.mocked(prisma.user.count).mockResolvedValue(1);
      vi.mocked(prisma.user.findMany).mockResolvedValue([mockUser] as any);

      // Act
      const request = createRequest();
      const response = await GET(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Assert
      expect(responseText).not.toContain("passwordHash");
      expect(responseText).not.toContain("pdpaConsent");
      expect(responseText).not.toContain("marketingConsent");
    });

    it("should support search by email", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(1);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const request = createRequest("?search=test@example.com");
      await GET(request);

      // Assert
      const countCall = vi.mocked(prisma.user.count).mock.calls[0];
      expect(countCall[0]).toMatchObject({
        where: {
          OR: [
            { email: { contains: "test@example.com", mode: "insensitive" } },
            { name: { contains: "test@example.com", mode: "insensitive" } },
          ],
        },
      });
    });

    it("should support search by name", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(1);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const request = createRequest("?search=John+Doe");
      await GET(request);

      // Assert
      const countCall = vi.mocked(prisma.user.count).mock.calls[0];
      expect(countCall[0]).toMatchObject({
        where: {
          OR: [
            { email: { contains: "John Doe", mode: "insensitive" } },
            { name: { contains: "John Doe", mode: "insensitive" } },
          ],
        },
      });
    });

    it("should support role filter", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(1);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const request = createRequest("?role=ADMIN");
      await GET(request);

      // Assert
      const countCall = vi.mocked(prisma.user.count).mock.calls[0];
      expect(countCall[0]).toMatchObject({
        where: { role: "ADMIN" },
      });
    });

    it("should support pagination", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(50);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const request = createRequest("?page=2&limit=10");
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(data.page).toBe(2);
      expect(data.totalPages).toBe(5); // 50 users / 10 per page
      const findManyCall = vi.mocked(prisma.user.findMany).mock.calls[0];
      expect(findManyCall[0]).toMatchObject({
        skip: 10, // (page - 1) * limit = (2-1) * 10
        take: 10,
      });
    });

    it("should default to page 1 and limit 20", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const request = createRequest();
      await GET(request);

      // Assert
      const findManyCall = vi.mocked(prisma.user.findMany).mock.calls[0];
      expect(findManyCall[0]).toMatchObject({
        skip: 0,
        take: 20,
      });
    });

    it("should sort by createdAt descending", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockResolvedValue(0);
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);

      // Act
      const request = createRequest();
      await GET(request);

      // Assert
      const findManyCall = vi.mocked(prisma.user.findMany).mock.calls[0];
      expect(findManyCall[0]).toMatchObject({
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("validation", () => {
    it("should reject invalid page parameter", async () => {
      // Act
      const request = createRequest("?page=invalid");
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject negative page parameter", async () => {
      // Act
      const request = createRequest("?page=-1");
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject limit exceeding 100", async () => {
      // Act
      const request = createRequest("?limit=200");
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("should reject invalid role parameter", async () => {
      // Act
      const request = createRequest("?role=INVALID_ROLE");
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockRejectedValue(
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
