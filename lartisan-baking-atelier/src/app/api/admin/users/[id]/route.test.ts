import { describe, it, expect, beforeEach, vi } from "vitest";
import { PUT, DELETE } from "./route";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock session
vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

describe("Admin User Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAdminSession = {
    userId: "admin-user-123",
    email: "admin@example.com",
    role: "ADMIN",
  };

  const createRequest = (body?: object): Request => {
    return new Request("http://localhost/api/admin/users/user-456/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe("PUT /api/admin/users/{id}/role", () => {
    describe("successful updates", () => {
      it("should update user role to ADMIN", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-456",
          email: "user@example.com",
          name: "Test User",
          role: "STUDENT",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
          emailVerified: null,
          image: null,
        } as any);
        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-456",
          email: "user@example.com",
          name: "Test User",
          role: "ADMIN",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date(),
          emailVerified: null,
          image: null,
        } as any);

        const request = createRequest({ role: "ADMIN" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user.role).toBe("ADMIN");
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-456" },
          data: { role: "ADMIN" },
          select: expect.any(Object),
        });
      });

      it("should update user role to USER (STUDENT in DB)", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-456",
          email: "user@example.com",
          name: "Test User",
          role: "ADMIN",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date("2026-01-15"),
          emailVerified: null,
          image: null,
        } as any);
        vi.mocked(prisma.user.update).mockResolvedValue({
          id: "user-456",
          email: "user@example.com",
          name: "Test User",
          role: "STUDENT",
          createdAt: new Date("2026-01-15"),
          updatedAt: new Date(),
          emailVerified: null,
          image: null,
        } as any);

        const request = createRequest({ role: "USER" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user.role).toBe("USER");
        expect(prisma.user.update).toHaveBeenCalledWith({
          where: { id: "user-456" },
          data: { role: "STUDENT" }, // Converted USER -> STUDENT
          select: expect.any(Object),
        });
      });
    });

    describe("security checks", () => {
      it("should prevent self-role-change", async () => {
        // Arrange - trying to change own role
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);

        const request = createRequest({ role: "USER" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "admin-user-123" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(403);
        expect(data.error).toBe("Cannot modify your own account");
        expect(prisma.user.update).not.toHaveBeenCalled();
      });

      it("should return 401 without session", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(null);

        const request = createRequest({ role: "ADMIN" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      });
    });

    describe("validation errors", () => {
      it("should reject invalid role values", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);

        const request = createRequest({ role: "INVALID_ROLE" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation failed");
      });

      it("should reject missing role field", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);

        const request = createRequest({});
        const response = await PUT(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error).toBe("Validation failed");
      });

      it("should return 404 for non-existent user", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const request = createRequest({ role: "ADMIN" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "non-existent" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(404);
        expect(data.error).toBe("User not found");
      });
    });

    describe("error handling", () => {
      it("should handle database errors gracefully", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockRejectedValue(
          new Error("Database error"),
        );

        const request = createRequest({ role: "ADMIN" });
        const response = await PUT(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toBe("An unexpected error occurred");
      });
    });
  });

  describe("DELETE /api/admin/users/{id}", () => {
    const createDeleteRequest = (): Request => {
      return new Request("http://localhost/api/admin/users/user-456", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    };

    describe("successful deletion", () => {
      it("should delete a regular user", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "user-456",
          role: "STUDENT",
        } as any);
        vi.mocked(prisma.user.delete).mockResolvedValue({
          id: "user-456",
        } as any);

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe("User deleted successfully");
        expect(prisma.user.delete).toHaveBeenCalledWith({
          where: { id: "user-456" },
        });
      });

      it("should delete an admin user when other admins exist", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "admin-456",
          role: "ADMIN",
        } as any);
        vi.mocked(prisma.user.count).mockResolvedValue(2); // 2 admins exist
        vi.mocked(prisma.user.delete).mockResolvedValue({
          id: "admin-456",
        } as any);

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "admin-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe("security checks", () => {
      it("should prevent self-deletion", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "admin-user-123" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(403);
        expect(data.error).toBe("Cannot modify your own account");
        expect(prisma.user.delete).not.toHaveBeenCalled();
      });

      it("should prevent deleting the last admin", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: "admin-456",
          role: "ADMIN",
        } as any);
        vi.mocked(prisma.user.count).mockResolvedValue(1); // Only 1 admin exists

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "admin-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(403);
        expect(data.error).toBe("Cannot delete the last admin user");
        expect(prisma.user.delete).not.toHaveBeenCalled();
      });

      it("should return 401 without session", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(null);

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(data.error).toBe("Unauthorized");
      });
    });

    describe("validation errors", () => {
      it("should return 404 for non-existent user", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "non-existent" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(404);
        expect(data.error).toBe("User not found");
      });
    });

    describe("error handling", () => {
      it("should handle database errors gracefully", async () => {
        // Arrange
        vi.mocked(getSession).mockResolvedValue(mockAdminSession as any);
        vi.mocked(prisma.user.findUnique).mockRejectedValue(
          new Error("Database error"),
        );

        const request = createDeleteRequest();
        const response = await DELETE(request, {
          params: Promise.resolve({ id: "user-456" }),
        });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(data.error).toBe("An unexpected error occurred");
      });
    });
  });
});
