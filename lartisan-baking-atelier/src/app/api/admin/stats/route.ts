import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ERROR_MESSAGES = {
  SERVER_ERROR: "An unexpected error occurred",
} as const;

/**
 * GET /api/admin/stats
 * Returns admin dashboard statistics
 * Requires ADMIN role (enforced by middleware)
 *
 * @returns {AdminStatsResponse} Statistics object with user counts
 */
export async function GET() {
  try {
    // Get current date for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Execute all counts in parallel for performance
    const [totalUsers, activeUsers, adminUsers, newUsersThisMonth] =
      await Promise.all([
        // Total users count
        prisma.user.count(),

        // Active users (with sessions expiring in the future = active within last 30 days)
        prisma.user.count({
          where: {
            sessions: {
              some: {
                expires: {
                  gt: thirtyDaysAgo,
                },
              },
            },
          },
        }),

        // Admin users count
        prisma.user.count({
          where: {
            role: "ADMIN",
          },
        }),

        // New users this month
        prisma.user.count({
          where: {
            createdAt: {
              gte: firstDayOfMonth,
            },
          },
        }),
      ]);

    const stats = {
      totalUsers,
      activeUsers,
      adminUsers,
      newUsersThisMonth,
    };

    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 },
    );
  }
}
