"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/components/providers/AuthProvider";
import { useAdminStats } from "@/lib/hooks/useAdminStats";
import { useUserManagement } from "@/lib/hooks/useUserManagement";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Shield,
  UserPlus,
  Activity,
  Search,
  ChevronLeft,
  MoreHorizontal,
  Loader2,
  Trash2,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * Admin Dashboard - Protected admin panel
 *
 * Features:
 * - ProtectedRoute with requiredRole="ADMIN" (redirects non-admins to "/")
 * - Statistics cards showing user metrics
 * - User management table with search
 * - Role management dropdown
 * - Delete user functionality
 * - Responsive layout
 * - Loading states
 *
 * @example
 * ```tsx
 * // Access at /admin
 * // Automatically redirects to "/" if user is not ADMIN
 * ```
 */
export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN" unauthorizedPath="/">
      <AdminContent />
    </ProtectedRoute>
  );
}

/**
 * Admin dashboard content
 */
function AdminContent() {
  const { user } = useAuth();
  const {
    stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useAdminStats();
  const {
    users,
    totalUsers,
    isLoading: isUsersLoading,
    error: usersError,
    fetchUsers,
    updateUserRole,
    deleteUser,
  } = useUserManagement();

  const [searchQuery, setSearchQuery] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchUsers]);

  // Get initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle role change
  const handleRoleChange = async (
    userId: string,
    newRole: "USER" | "ADMIN",
  ) => {
    await updateUserRole(userId, newRole);
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      setDeletingUserId(userId);
      await deleteUser(userId);
      setDeletingUserId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="capitalize">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
              <span className="text-sm text-slate-600">{user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2">
            Manage users and view system statistics
          </p>
        </div>

        {/* Error Messages */}
        {(statsError || usersError) && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{statsError || usersError}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {isStatsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.totalUsers || 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {isStatsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.activeUsers || 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Users */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Admins</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {isStatsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.adminUsers || 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New This Month */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    New This Month
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {isStatsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      stats?.newUsersThisMonth || 0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <UserPlus className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isUsersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">
                        Joined
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((managedUser) => (
                      <tr key={managedUser.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-slate-200 text-slate-700">
                                {getInitials(managedUser.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-slate-900">
                              {managedUser.name || "Unnamed User"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {managedUser.email}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={managedUser.role}
                            onChange={(e) =>
                              handleRoleChange(
                                managedUser.id,
                                e.target.value as "USER" | "ADMIN",
                              )
                            }
                            disabled={managedUser.id === user?.id}
                            className="text-sm border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500">
                          {formatDate(managedUser.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(managedUser.id)}
                            disabled={
                              managedUser.id === user?.id ||
                              deletingUserId === managedUser.id
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingUserId === managedUser.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* User count */}
            <div className="mt-4 text-sm text-slate-500">
              Showing {users.length} of {totalUsers} users
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
