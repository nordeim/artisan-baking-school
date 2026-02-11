"use client";

import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-void flex items-center justify-center px-4">
          <div className="w-full max-w-md space-y-6">
            <Skeleton variant="text" className="w-3/4 h-8 mx-auto" />
            <Skeleton variant="text" className="w-1/2 h-4 mx-auto" />
            <div className="space-y-4">
              <Skeleton variant="rounded" className="w-full h-12" />
              <Skeleton variant="rounded" className="w-full h-12" />
              <Skeleton variant="rounded" className="w-full h-10" />
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
