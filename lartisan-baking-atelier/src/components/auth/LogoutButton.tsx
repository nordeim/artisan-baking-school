"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

/**
 * LogoutButton props
 */
interface LogoutButtonProps {
  /** Button content (defaults to "Logout") */
  children?: React.ReactNode;
  /** Visual variant of the button */
  variant?: VariantProps<typeof buttonVariants>["variant"];
  /** Size of the button */
  size?: VariantProps<typeof buttonVariants>["size"];
  /** Whether to show the logout icon */
  showIcon?: boolean;
  /** Path to redirect after logout (defaults to "/") */
  redirectTo?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback fired after successful logout */
  onSuccess?: () => void;
  /** Callback fired if logout fails */
  onError?: (error: Error) => void;
}

/**
 * LogoutButton - Handles user logout with loading states and redirect
 *
 * Features:
 * - Calls logout from AuthProvider
 * - Shows loading state with spinner
 * - Redirects to specified path after logout
 * - Supports custom callbacks for success/error
 * - Accessible with proper ARIA attributes
 * - Prevents concurrent logout attempts
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LogoutButton />
 *
 * // Custom variant and redirect
 * <LogoutButton
 *   variant="ghost"
 *   redirectTo="/login"
 *   onSuccess={() => console.log("Logged out")}
 * />
 *
 * // Without icon
 * <LogoutButton showIcon={false}>Sign Out</LogoutButton>
 * ```
 */
export function LogoutButton({
  children = "Logout",
  variant = "default",
  size = "default",
  showIcon = true,
  redirectTo = "/",
  className,
  onSuccess,
  onError,
}: LogoutButtonProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    // Prevent multiple concurrent logout attempts
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();

      // Call success callback if provided
      onSuccess?.();

      // Redirect to specified path
      router.push(redirectTo);
    } catch (error) {
      // Log error for debugging
      console.error("Logout error:", error);

      // Call error callback if provided
      if (onError && error instanceof Error) {
        onError(error);
      }

      // Still redirect since AuthProvider clears user state on error
      router.push(redirectTo);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router, redirectTo, onSuccess, onError, isLoggingOut]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      aria-label={
        isLoggingOut
          ? "Logging out..."
          : typeof children === "string"
            ? children
            : "Logout"
      }
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Logging out...
        </>
      ) : (
        <>
          {showIcon && <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />}
          {children}
        </>
      )}
    </Button>
  );
}
