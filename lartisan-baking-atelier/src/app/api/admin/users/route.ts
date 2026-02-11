import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { userListQuerySchema, dbRoleToUiRole } from "@/lib/validations/admin";
import type { ManagedUser } from "@/lib/types/admin";

const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Validation failed",
  SERVER_ERROR: "An unexpected error occurred",
} as const;

/**
 * GET /api/admin/users
 * Returns paginated list of users for admin management
 * Requires ADMIN role (enforced by middleware)
 *
 * Query Parameters:
 * - search: Filter by name or email (optional)
 * - role: Filter by role - STUDENT, ADMIN, INSTRUCTOR (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * @returns {UserListResponse} Paginated list of users
 */
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    // Validate query parameters
    const validationResult = userListQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const flattenedErrors = validationResult.error.flatten();
      return NextResponse.json(
        {
          error: ERROR_MESSAGES.VALIDATION_ERROR,
          details: flattenedErrors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const { search, role, page, limit } = validationResult.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Role filter
    if (role) {
      where.role = role;
    }

    // Search filter (name OR email, case-insensitive)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        {
          email: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    // Get total count and users in parallel
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
          image: true,
          // Explicitly exclude: passwordHash and sensitive fields
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Transform database users to API response format
    const managedUsers: ManagedUser[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: dbRoleToUiRole(user.role),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      emailVerified: user.emailVerified?.toISOString() || null,
      image: user.image,
    }));

    return NextResponse.json(
      {
        users: managedUsers,
        total,
        page,
        totalPages,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
