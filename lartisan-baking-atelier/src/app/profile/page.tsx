"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, User, Settings, Shield, LogOut } from "lucide-react";
import Link from "next/link";

/**
 * Profile page - Protected user profile management
 *
 * Features:
 * - Wrapped in ProtectedRoute (requires authentication)
 * - Displays user avatar and basic info
 * - Hosts ProfileEditForm for editing
 * - Navigation sidebar with quick links
 * - Back button to dashboard
 * - Responsive layout (sidebar on desktop, stacked on mobile)
 * - Loading states handled by ProtectedRoute
 * - No hydration mismatches (client-side only)
 *
 * @example
 * ```tsx
 * // Access at /profile
 * // Automatically redirects to /login?redirect=/profile if not authenticated
 * ```
 */
export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

/**
 * Profile content component
 * Separated for cleaner ProtectedRoute wrapper
 */
function ProfileContent() {
  const { user, logout } = useAuth();

  // Get initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Navigation */}
          <div className="lg:col-span-3 space-y-6">
            {/* User Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="" alt={user.name || "User avatar"} />
                    <AvatarFallback className="text-2xl bg-slate-900 text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {user.name || "User"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize bg-slate-100 text-slate-700">
                      {user.role?.toLowerCase() || "user"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Links */}
            <Card>
              <CardContent className="p-0">
                <nav className="flex flex-col">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Separator />
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-900 bg-slate-50"
                  >
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <Separator />
                  {user.role === "ADMIN" && (
                    <>
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                      <Separator />
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Profile Form */}
          <div className="lg:col-span-9">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Profile Settings
              </h1>
              <p className="text-slate-500 mt-1">
                Manage your account information and security settings
              </p>
            </div>

            <ProfileEditForm />
          </div>
        </div>
      </main>
    </div>
  );
}
