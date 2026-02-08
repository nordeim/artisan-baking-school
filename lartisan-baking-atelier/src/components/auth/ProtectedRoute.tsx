"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute props
 */
interface ProtectedRouteProps {
  /** Child components to render when authenticated */
  children: ReactNode;
  /** Required role for access (optional) */
  requiredRole?: "USER" | "ADMIN";
  /** Path to redirect when not authenticated (defaults to "/login") */
  fallbackPath?: string;
  /** Path to redirect when role check fails (defaults to "/") */
  unauthorizedPath?: string;
}

/**
 * ProtectedRoute - Guards routes requiring authentication
 *
 * Features:
 * - Checks authentication status from AuthProvider
 * - Redirects to login if not authenticated
 * - Supports role-based access control (USER/ADMIN)
 * - Shows loading state while checking auth
 * - Preserves original URL for redirect back after login
 * - Prevents hydration mismatches with client-side only rendering
 * - Handles edge cases gracefully (null user, missing role)
 *
 * @example
 * ```tsx
 * // Basic usage - requires authentication
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // Require admin role
 * <ProtectedRoute requiredRole="ADMIN">
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * // Custom fallback paths
 * <ProtectedRoute
 *   requiredRole="ADMIN"
 *   fallbackPath="/signin"
 *   unauthorizedPath="/unauthorized"
 * >
 *   <AdminContent />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = "/login",
  unauthorizedPath = "/",
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Don't check while auth state is loading
    if (isLoading) {
      return;
    }

    // Prevent multiple redirects
    if (hasChecked) {
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      // Build redirect URL with current path preserved
      const redirectParam =
        pathname !== fallbackPath
          ? `?redirect=${encodeURIComponent(pathname)}`
          : "";
      const redirectUrl = `${fallbackPath}${redirectParam}`;

      router.push(redirectUrl);
      setHasChecked(true);
      return;
    }

    // Check role requirement if specified
    if (requiredRole) {
      const userRole = user.role;

      if (!userRole || userRole !== requiredRole) {
        router.push(unauthorizedPath);
        setHasChecked(true);
        return;
      }
    }

    // Auth check passed
    setHasChecked(true);
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRole,
    router,
    pathname,
    fallbackPath,
    unauthorizedPath,
    hasChecked,
  ]);

  // Show loading spinner while checking authentication
  if (isLoading || !hasChecked) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div role="status" aria-label="Loading authentication...">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Don't render anything if role check fails (will redirect)
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  // Render children when authenticated and authorized
  return <>{children}</>;
}
