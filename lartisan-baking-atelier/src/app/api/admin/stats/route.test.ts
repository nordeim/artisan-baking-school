import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "./route";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful retrieval", () => {
    it("should return statistics when request is valid", async () => {
      // Arrange
      const mockStats = {
        totalUsers: 150,
        activeUsers: 85,
        adminUsers: 5,
        newUsersThisMonth: 23,
      };

      // Mock each count call
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(mockStats.totalUsers) // total users
        .mockResolvedValueOnce(mockStats.activeUsers) // active users
        .mockResolvedValueOnce(mockStats.adminUsers) // admin users
        .mockResolvedValueOnce(mockStats.newUsersThisMonth); // new users this month

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.stats).toEqual(mockStats);
      expect(prisma.user.count).toHaveBeenCalledTimes(4);
    });

    it("should handle zero users gracefully", async () => {
      // Arrange
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(0) // total users
        .mockResolvedValueOnce(0) // active users
        .mockResolvedValueOnce(0) // admin users
        .mockResolvedValueOnce(0); // new users this month

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.stats).toEqual({
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        newUsersThisMonth: 0,
      });
    });

    it("should calculate active users based on session expiry", async () => {
      // Arrange
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(75) // active (with recent sessions)
        .mockResolvedValueOnce(3) // admin
        .mockResolvedValueOnce(10); // new this month

      // Act
      await GET();

      // Assert - Verify active users query includes session filter
      const activeUsersCall = vi.mocked(prisma.user.count).mock.calls[1];
      expect(activeUsersCall[0]).toMatchObject({
        where: {
          sessions: {
            some: {
              expires: {
                gt: expect.any(Date),
              },
            },
          },
        },
      });
    });

    it("should calculate new users based on createdAt this month", async () => {
      // Arrange
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(15);

      // Act
      await GET();

      // Assert - Verify new users query uses first day of month
      const newUsersCall = vi.mocked(prisma.user.count).mock.calls[3];
      expect(newUsersCall[0]).toMatchObject({
        where: {
          createdAt: {
            gte: expect.any(Date),
          },
        },
      });
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      // Arrange
      vi.mocked(prisma.user.count).mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("An unexpected error occurred");
    });

    it("should handle partial query failures", async () => {
      // Arrange - Fail on second query (active users)
      vi.mocked(prisma.user.count)
        .mockResolvedValueOnce(100) // total succeeds
        .mockRejectedValueOnce(new Error("Session query failed")) // active fails
        .mockResolvedValueOnce(3) // admin (won't reach)
        .mockResolvedValueOnce(10); // new (won't reach)

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe("An unexpected error occurred");
    });
  });
});
