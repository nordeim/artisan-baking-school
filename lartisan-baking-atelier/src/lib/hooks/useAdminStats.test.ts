import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAdminStats } from "./useAdminStats";

describe("useAdminStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Successful Data Fetching", () => {
    it("fetches admin stats successfully", async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        adminUsers: 5,
        newUsersThisMonth: 12,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stats: mockStats }),
      });

      const { result } = renderHook(() => useAdminStats());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.stats).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBeNull();
    });

    it("makes request to correct endpoint", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            stats: {
              totalUsers: 10,
              activeUsers: 8,
              adminUsers: 2,
              newUsersThisMonth: 1,
            },
          }),
      });

      renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/admin/stats");
      });
    });
  });

  describe("Error Handling", () => {
    it("handles API error response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Access denied" }),
      });

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Access denied");
      expect(result.current.stats).toBeNull();
    });

    it("handles network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });

    it("handles generic errors without message", async () => {
      (global.fetch as any).mockRejectedValueOnce("Unknown error");

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("An error occurred");
    });

    it("uses default error message when API returns no error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to fetch admin statistics");
    });
  });

  describe("Refetch Functionality", () => {
    it("refetches stats when refetch is called", async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        adminUsers: 5,
        newUsersThisMonth: 12,
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ stats: mockStats }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              stats: { ...mockStats, totalUsers: 150 },
            }),
        });

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.stats?.totalUsers).toBe(100);
      });

      // Refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.stats?.totalUsers).toBe(150);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Loading State", () => {
    it("sets loading to true initially", () => {
      (global.fetch as any).mockImplementation(
        () => new Promise(() => {}), // Never resolve
      );

      const { result } = renderHook(() => useAdminStats());

      expect(result.current.isLoading).toBe(true);
    });

    it("sets loading to false after successful fetch", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            stats: {
              totalUsers: 10,
              activeUsers: 8,
              adminUsers: 2,
              newUsersThisMonth: 1,
            },
          }),
      });

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("sets loading to false after error", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("API Error"));

      const { result } = renderHook(() => useAdminStats());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
