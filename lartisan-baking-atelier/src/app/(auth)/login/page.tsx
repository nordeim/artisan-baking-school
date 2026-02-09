"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

/**
 * LoginPageContent - Inner component with router access
 */
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSuccess = () => {
    // Get redirect parameter
    const redirectParam = searchParams.get("redirect");
    const redirectPath = redirectParam
      ? decodeURIComponent(redirectParam)
      : "/";

    // Redirect to intended destination
    router.push(redirectPath);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Please sign in to continue.
        </p>
      </div>

      {/* Login Form */}
      <LoginForm onSuccess={handleSuccess} />

      {/* Footer */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          Don&apos;t have an account?{" "}
        </span>
        <Link
          href="/register"
          className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}

/**
 * Loading state for login page
 */
function LoginPageLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div role="status" aria-label="Loading...">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

/**
 * LoginPage - User authentication page
 *
 * Features:
 * - LoginForm integration with onSuccess callback
 * - Redirect handling after successful login
 * - Link to registration page
 * - Loading state with Suspense
 * - Accessible with semantic HTML
 *
 * @example
 * ```tsx
 * // Navigate to: /login
 * // Or with redirect: /login?redirect=/dashboard
 * ```
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}
