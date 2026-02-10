import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUpdateProfile } from "./useUpdateProfile";
import * as AuthProviderModule from "@/components/providers/AuthProvider";

// Mock AuthProvider
const mockRefreshUser = vi.fn();
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    refreshUser: mockRefreshUser,
  }),
}));

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Successful Profile Update", () => {
    it("updates profile successfully and refreshes user data", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Updated Name",
        role: "USER",
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({
          name: "Updated Name",
        });

        expect(response.success).toBe(true);
        expect(response.error).toBeUndefined();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "Updated Name" }),
      });

      expect(mockRefreshUser).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets loading state during API call", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockImplementationOnce(() => promise);

      const { result } = renderHook(() => useUpdateProfile());

      act(() => {
        result.current.updateProfile({ name: "Updated Name" });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ user: { id: "1" } }),
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles API error response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Name is required" }),
      });

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({
          name: "",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe("Name is required");
      });

      expect(result.current.error).toBe("Name is required");
      expect(result.current.isLoading).toBe(false);
    });

    it("handles network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({
          name: "Updated Name",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe("Network error");
      });

      expect(result.current.error).toBe("Network error");
    });

    it("handles generic errors without message", async () => {
      (global.fetch as any).mockRejectedValueOnce("Unknown error");

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({
          name: "Updated Name",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe("An error occurred");
      });
    });

    it("uses default error message when API returns no error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({
          name: "Updated Name",
        });

        expect(response.error).toBe("Failed to update profile");
      });
    });
  });

  describe("Clear Error", () => {
    it("clears error state", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Update failed" }),
      });

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        await result.current.updateProfile({ name: "" });
      });

      expect(result.current.error).toBe("Update failed");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty name update", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "1", name: "" } }),
      });

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({ name: "" });
        expect(response.success).toBe(true);
      });
    });

    it("handles long name updates", async () => {
      const longName = "A".repeat(100);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: { id: "1", name: longName } }),
      });

      const { result } = renderHook(() => useUpdateProfile());

      await act(async () => {
        const response = await result.current.updateProfile({ name: longName });
        expect(response.success).toBe(true);
      });
    });
  });
});
