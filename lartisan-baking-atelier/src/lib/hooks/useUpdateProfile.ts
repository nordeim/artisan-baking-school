"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * Profile update credentials
 */
export interface UpdateProfileCredentials {
  name: string;
}

/**
 * Profile update result
 */
export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

/**
 * useUpdateProfile - Hook for updating user profile
 *
 * Features:
 * - Updates user display name
 * - Refreshes user data in AuthContext after update
 * - Loading state management
 * - Error handling with typed responses
 * - Automatic user state synchronization
 *
 * @example
 * ```tsx
 * const { updateProfile, isLoading, error } = useUpdateProfile();
 *
 * const handleSubmit = async (data: UpdateProfileCredentials) => {
 *   const result = await updateProfile(data);
 *   if (result.success) {
 *     // Show success message
 *   } else {
 *     // Show error: result.error
 *   }
 * };
 * ```
 */
export function useUpdateProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshUser } = useAuth();

  const updateProfile = useCallback(
    async (
      credentials: UpdateProfileCredentials,
    ): Promise<UpdateProfileResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.user) {
          // Refresh user data in AuthContext
          await refreshUser();
          return { success: true };
        } else {
          const errorMessage = data.error || "Failed to update profile";
          setError(errorMessage);
          return { success: false, error: errorMessage };
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
    [refreshUser],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateProfile,
    isLoading,
    error,
    clearError,
  };
}
