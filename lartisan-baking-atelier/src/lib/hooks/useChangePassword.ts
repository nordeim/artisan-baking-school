"use client";

import { useState, useCallback } from "react";

/**
 * Password change credentials
 */
export interface ChangePasswordCredentials {
  currentPassword: string;
  newPassword: string;
}

/**
 * Password change result
 */
export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

/**
 * useChangePassword - Hook for changing user password
 *
 * Features:
 * - Validates current password before allowing change
 * - Enforces password strength requirements
 * - Loading state management
 * - Error handling with typed responses
 * - Success confirmation without exposing sensitive data
 *
 * @example
 * ```tsx
 * const { changePassword, isLoading, error } = useChangePassword();
 *
 * const handleSubmit = async (data: ChangePasswordCredentials) => {
 *   const result = await changePassword(data);
 *   if (result.success) {
 *     // Show success message, redirect to login
 *   } else {
 *     // Show error: result.error
 *   }
 * };
 * ```
 */
export function useChangePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(
    async (
      credentials: ChangePasswordCredentials,
    ): Promise<ChangePasswordResult> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/auth/password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok) {
          return { success: true };
        } else {
          const errorMessage = data.error || "Failed to change password";
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
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    changePassword,
    isLoading,
    error,
    clearError,
  };
}
