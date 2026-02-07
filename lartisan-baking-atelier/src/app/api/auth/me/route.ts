import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  SERVER_ERROR: "An unexpected error occurred",
} as const;

/**
 * GET /api/auth/me
 * Returns the current authenticated user's data
 * Requires valid session via HTTP-only cookies
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from cookies
    const session = await getSession();

    // Check if session exists
    if (!session) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 },
      );
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    // If user not found in database
    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 },
      );
    }

    // Return sanitized user data (exclude password hash)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
