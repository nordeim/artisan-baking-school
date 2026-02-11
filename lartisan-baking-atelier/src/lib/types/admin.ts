/**
 * Admin Types
 * TypeScript type definitions for admin functionality
 */

/**
 * User role in database
 */
export type DbRole = "STUDENT" | "ADMIN" | "INSTRUCTOR";

/**
 * User role in UI (exposed to frontend)
 * STUDENT is shown as USER in the UI for clarity
 */
export type UiRole = "USER" | "ADMIN";

/**
 * Admin dashboard statistics
 */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

/**
 * User data structure for management (sanitized - no sensitive data)
 * Matches the ManagedUser interface in useUserManagement.ts
 */
export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  role: UiRole;
  createdAt: string;
  updatedAt?: string;
  emailVerified?: string | null;
  image?: string | null;
}

/**
 * User list response with pagination
 */
export interface UserListResponse {
  users: ManagedUser[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Admin stats API response
 */
export interface AdminStatsResponse {
  stats: AdminStats;
}

/**
 * Update user role API response
 */
export interface UpdateUserRoleResponse {
  success: boolean;
  user: ManagedUser;
  message: string;
}

/**
 * Delete user API response
 */
export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

/**
 * Error response structure
 */
export interface AdminErrorResponse {
  error: string;
  details?: Record<string, string | string[]>;
}
