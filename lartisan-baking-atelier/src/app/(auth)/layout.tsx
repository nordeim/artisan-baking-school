"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";
import { Suspense, ReactNode } from "react";

/**
 * AuthLayout - Shared layout for authentication pages
 *
 * Features:
 * - Centers content with flexbox
 * - Card-based container styling
 * - Redirects authenticated users
 * - Supports redirect parameter after login
 * - Shows loading state while checking auth
 * - Accessible with semantic HTML
 *
 * @example
 * ```tsx
 * // app/(auth)/login/page.tsx
 * export default function LoginPage() {
 *   return (
 *     <AuthLayout>
 *       <LoginForm />
 *     </AuthLayout>
 *   );
 * }
 * ```
 */
interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayoutContent({ children }: AuthLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) {
      return;
    }

    // Redirect authenticated users
    if (isAuthenticated) {
      const redirectParam = searchParams.get("redirect");
      const redirectPath = redirectParam
        ? decodeURIComponent(redirectParam)
        : "/";
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div role="status" aria-label="Loading...">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div role="status" aria-label="Redirecting...">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  // Render children for unauthenticated users
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <div role="status" aria-label="Loading...">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      }
    >
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </Suspense>
  );
}
