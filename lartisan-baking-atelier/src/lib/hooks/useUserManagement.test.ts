import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUserManagement } from "./useUserManagement";

describe("useUserManagement", () => {
  const mockUsers = [
    {
      id: "user-1",
      email: "user1@example.com",
      name: "User One",
      role: "USER" as const,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "user-2",
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN" as const,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Fetch Users", () => {
    it("fetches users successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: mockUsers, total: 2 }),
      });

      const { result } = renderHook(() => useUserManagement());

      await act(async () => {
        await result.current.fetchUsers();
      });

      await waitFor(() => {
        expect(result.current.users).toHaveLength(2);
        expect(result.current.totalUsers).toBe(2);
      });

      expect(result.current.users[0].email).toBe("user1@example.com");
    });

    it("fetches users with search parameter", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: [mockUsers[0]], total: 1 }),
      });

      const { result } = renderHook(() => useUserManagement());

      await act(async () => {
        await result.current.fetchUsers("user1");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/users?search=user1",
      );
    });

    it("handles fetch error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Access denied" }),
      });

      const { result } = renderHook(() => useUserManagement());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.error).toBe("Access denied");
    });
  });

  describe("Update User Role", () => {
    it("updates user role successfully", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers, total: 2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { result } = renderHook(() => useUserManagement());

      // First fetch users
      await act(async () => {
        await result.current.fetchUsers();
      });

      // Then update role
      const response = await act(async () => {
        return await result.current.updateUserRole("user-1", "ADMIN");
      });

      expect(response.success).toBe(true);
      expect(result.current.users[0].role).toBe("ADMIN");
    });

    it("sends correct API request for role update", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useUserManagement());

      await act(async () => {
        await result.current.updateUserRole("user-1", "ADMIN");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/users/user-1/role",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "ADMIN" }),
        },
      );
    });

    it("handles role update error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Cannot modify own role" }),
      });

      const { result } = renderHook(() => useUserManagement());

      const response = await act(async () => {
        return await result.current.updateUserRole("user-1", "ADMIN");
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Cannot modify own role");
      expect(result.current.error).toBe("Cannot modify own role");
    });
  });

  describe("Delete User", () => {
    it("deletes user successfully", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers, total: 2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const { result } = renderHook(() => useUserManagement());

      // First fetch users
      await act(async () => {
        await result.current.fetchUsers();
      });

      // Then delete user
      const response = await act(async () => {
        return await result.current.deleteUser("user-1");
      });

      expect(response.success).toBe(true);
      expect(result.current.users).toHaveLength(1);
      expect(result.current.totalUsers).toBe(1);
      expect(result.current.users[0].id).toBe("user-2");
    });

    it("sends correct API request for delete", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useUserManagement());

      await act(async () => {
        await result.current.deleteUser("user-1");
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/admin/users/user-1", {
        method: "DELETE",
      });
    });

    it("handles delete error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Cannot delete last admin" }),
      });

      const { result } = renderHook(() => useUserManagement());

      const response = await act(async () => {
        return await result.current.deleteUser("user-1");
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe("Cannot delete last admin");
    });
  });

  describe("Loading States", () => {
    it("sets loading during fetch", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockImplementationOnce(() => promise);

      const { result } = renderHook(() => useUserManagement());

      act(() => {
        result.current.fetchUsers();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ users: mockUsers, total: 2 }),
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Clear Error", () => {
    it("clears error state", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Some error" }),
      });

      const { result } = renderHook(() => useUserManagement());

      await act(async () => {
        await result.current.fetchUsers();
      });

      expect(result.current.error).toBe("Some error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
