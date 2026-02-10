"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Admin statistics data structure
 */
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
}

/**
 * useAdminStats - Hook for fetching admin dashboard statistics
 *
 * Features:
 * - Fetches user statistics from API
 * - Loading state management
 * - Error handling
 * - Auto-refresh capability
 * - Cached data between renders
 *
 * @example
 * ```tsx
 * const { stats, isLoading, error, refetch } = useAdminStats();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <div>
 *     <StatCard label="Total Users" value={stats.totalUsers} />
 *     <StatCard label="Active Users" value={stats.activeUsers} />
 *   </div>
 * );
 * ```
 */
export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (response.ok && data.stats) {
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to fetch admin statistics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}
