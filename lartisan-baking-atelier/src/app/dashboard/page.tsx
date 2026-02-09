"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, User, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

/**
 * Dashboard page - Protected user dashboard
 *
 * Features:
 * - Wrapped in ProtectedRoute (requires authentication)
 * - Displays user information from AuthContext
 * - Shows user role badge
 * - Includes LogoutButton
 * - Responsive layout with cards
 * - Loading states handled by ProtectedRoute
 * - No hydration mismatches (client-side only)
 *
 * @example
 * ```tsx
 * // Access at /dashboard
 * // Automatically redirects to /login?redirect=/dashboard if not authenticated
 * ```
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

/**
 * Dashboard content component
 * Separated for cleaner ProtectedRoute wrapper
 */
function DashboardContent() {
  const { user } = useAuth();

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

  // Format date (mock join date based on user ID for demo)
  const joinDate = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            <LogoutButton variant="outline" size="sm" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src="" alt={user?.name || "User avatar"} />
                  <AvatarFallback className="text-xl bg-slate-900 text-white">
                    {getInitials(user?.name || null)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-slate-900">
                  {user?.name || "User"}
                </h2>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="mt-2">
                  <Badge
                    variant={user?.role === "ADMIN" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user?.role?.toLowerCase() || "user"}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Account Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">User ID:</span>
                  <span className="text-slate-900 font-mono text-xs">
                    {user?.id?.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-900">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Role:</span>
                  <span className="text-slate-900 capitalize">
                    {user?.role?.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Member since:</span>
                  <span className="text-slate-900">{joinDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-slate-900">0</div>
                  <p className="text-sm text-slate-500">Projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-slate-900">0</div>
                  <p className="text-sm text-slate-500">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-slate-900">
                    Active
                  </div>
                  <p className="text-sm text-slate-500">Status</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Your recent actions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <p>No recent activity to display.</p>
                  <p className="text-sm mt-1">Your actions will appear here.</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <LogoutButton />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
