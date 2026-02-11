import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  updateRoleSchema,
  uiRoleToDbRole,
  dbRoleToUiRole,
  userIdSchema,
} from "@/lib/validations/admin";
import type {
  ManagedUser,
  UpdateUserRoleResponse,
  DeleteUserResponse,
} from "@/lib/types/admin";

const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Validation failed",
  NOT_FOUND: "User not found",
  SELF_OPERATION: "Cannot modify your own account",
  LAST_ADMIN: "Cannot delete the last admin user",
  SERVER_ERROR: "An unexpected error occurred",
} as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/users/{id}/role
 * Updates a user's role
 * Requires ADMIN role (enforced by middleware)
 *
 * @param request - Request with { role: "USER" | "ADMIN" } body
 * @param params - Route params with user id
 * @returns {UpdateUserRoleResponse} Updated user data
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Get current admin session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse user ID from params
    const { id: userId } = await params;

    // Validate user ID
    const idValidation = userIdSchema.safeParse(userId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: "Invalid user ID" },
        { status: 400 },
      );
    }

    // Prevent self-role-change
    if (userId === session.userId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SELF_OPERATION },
        { status: 403 },
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: "Invalid JSON" },
        { status: 400 },
      );
    }

    const validationResult = updateRoleSchema.safeParse(body);
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

    const { role: uiRole } = validationResult.data;
    const dbRole = uiRoleToDbRole(uiRole);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        image: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 },
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: dbRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        image: true,
      },
    });

    const managedUser: ManagedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: dbRoleToUiRole(updatedUser.role),
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
      emailVerified: updatedUser.emailVerified?.toISOString() || null,
      image: updatedUser.image,
    };

    return NextResponse.json(
      {
        success: true,
        user: managedUser,
        message: `User role updated to ${uiRole}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update user role error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users/{id}
 * Deletes a user account
 * Requires ADMIN role (enforced by middleware)
 *
 * Safety checks:
 * - Cannot delete self
 * - Cannot delete last admin
 *
 * @param request - Request object
 * @param params - Route params with user id
 * @returns {DeleteUserResponse} Success confirmation
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Get current admin session
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse user ID from params
    const { id: userId } = await params;

    // Validate user ID
    const idValidation = userIdSchema.safeParse(userId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: "Invalid user ID" },
        { status: 400 },
      );
    }

    // Prevent self-deletion
    if (userId === session.userId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.SELF_OPERATION },
        { status: 403 },
      );
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NOT_FOUND },
        { status: 404 },
      );
    }

    // Safety check: Cannot delete the last admin
    if (userToDelete.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.LAST_ADMIN },
          { status: 403 },
        );
      }
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
