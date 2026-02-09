"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

/**
 * RegisterPageContent - Inner component with router access
 */
function RegisterPageContent() {
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join us today! Create your account to get started.
        </p>
      </div>

      {/* Register Form */}
      <RegisterForm onSuccess={handleSuccess} />

      {/* Footer */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/login"
          className="font-medium underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

/**
 * Loading state for register page
 */
function RegisterPageLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div role="status" aria-label="Loading...">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

/**
 * RegisterPage - User registration page
 *
 * Features:
 * - RegisterForm integration with onSuccess callback
 * - Redirect handling after successful registration
 * - Link to login page
 * - Loading state with Suspense
 * - Accessible with semantic HTML
 *
 * @example
 * ```tsx
 * // Navigate to: /register
 * // Or with redirect: /register?redirect=/dashboard
 * ```
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageLoading />}>
      <RegisterPageContent />
    </Suspense>
  );
}
