import { z } from "zod";

/**
 * Admin API Validation Schemas
 * Uses Zod for type-safe validation with detailed error messages
 */

/**
 * Role values in the database (from Prisma schema)
 */
export const ROLE_VALUES = ["STUDENT", "ADMIN", "INSTRUCTOR"] as const;

/**
 * Role values exposed to the frontend (STUDENT is shown as USER in UI)
 */
export const UI_ROLE_VALUES = ["USER", "ADMIN"] as const;

/**
 * Update user role schema - validates role update requests
 * Accepts UI role values and converts to DB values
 */
export const updateRoleSchema = z.object({
  role: z
    .enum(["USER", "ADMIN"])
    .refine((val) => val === "USER" || val === "ADMIN", {
      message: "Role must be either USER or ADMIN",
    }),
});

/**
 * User list query schema - validates query parameters for user listing
 */
export const userListQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(ROLE_VALUES).optional(),
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
});

/**
 * User ID param schema - validates route parameters
 */
export const userIdSchema = z.string().min(1, "User ID is required");

// Type inference from schemas
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;

/**
 * Converts UI role to database role
 * USER -> STUDENT
 * ADMIN -> ADMIN
 */
export function uiRoleToDbRole(uiRole: "USER" | "ADMIN"): "STUDENT" | "ADMIN" {
  return uiRole === "USER" ? "STUDENT" : "ADMIN";
}

/**
 * Converts database role to UI role
 * STUDENT -> USER
 * ADMIN -> ADMIN
 * INSTRUCTOR -> USER (fallback)
 */
export function dbRoleToUiRole(dbRole: string): "USER" | "ADMIN" {
  return dbRole === "ADMIN" ? "ADMIN" : "USER";
}
