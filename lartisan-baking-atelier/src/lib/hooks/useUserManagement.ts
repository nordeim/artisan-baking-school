"use client";

import { useState, useCallback } from "react";

/**
 * User data structure for management
 */
export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

/**
 * User list response
 */
export interface UserListResponse {
  users: ManagedUser[];
  total: number;
}

/**
 * useUserManagement - Hook for managing users as admin
 *
 * Features:
 * - Fetch user list with pagination
 * - Update user role
 * - Delete user
 * - Search/filter users
 * - Loading and error states
 * - Optimistic updates
 *
 * @example
 * ```tsx
 * const { users, isLoading, updateUserRole, deleteUser } = useUserManagement();
 *
 * const handleRoleChange = async (userId: string, newRole: string) => {
 *   const result = await updateUserRole(userId, newRole);
 *   if (result.success) {
 *     // Show success
 *   }
 * };
 * ```
 */
export function useUserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);

  /**
   * Fetch users list
   */
  const fetchUsers = useCallback(async (search?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/admin/users${queryParams}`);
      const data = await response.json();

      if (response.ok && data.users) {
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update user role
   */
  const updateUserRole = useCallback(
    async (userId: string, newRole: "USER" | "ADMIN") => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        });

        const data = await response.json();

        if (response.ok) {
          // Update local state
          setUsers((prev) =>
            prev.map((user) =>
              user.id === userId ? { ...user, role: newRole } : user,
            ),
          );
          return { success: true };
        } else {
          setError(data.error || "Failed to update user role");
          return { success: false, error: data.error };
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Delete user
   */
  const deleteUser = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove from local state
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        setTotalUsers((prev) => prev - 1);
        return { success: true };
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete user");
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    users,
    totalUsers,
    isLoading,
    error,
    fetchUsers,
    updateUserRole,
    deleteUser,
    clearError,
  };
}
