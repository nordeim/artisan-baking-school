import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

/**
 * POST /api/auth/logout
 * Logs out the current user by clearing all authentication cookies
 */
export async function POST(request: NextRequest) {
  try {
    // Clear all session cookies
    await destroySession();

    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  } catch (error) {
    // Log error but still return success
    // Logout should never fail from user perspective
    console.error("Logout error:", error);

    return NextResponse.json({ message: "Logout successful" }, { status: 200 });
  }
}
