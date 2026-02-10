import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useChangePassword } from "./useChangePassword";

describe("useChangePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe("Successful Password Change", () => {
    it("changes password successfully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "oldpassword123",
          newPassword: "newpassword456",
        });

        expect(response.success).toBe(true);
        expect(response.error).toBeUndefined();
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: "oldpassword123",
          newPassword: "newpassword456",
        }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets loading state during API call", async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockImplementationOnce(() => promise);

      const { result } = renderHook(() => useChangePassword());

      act(() => {
        result.current.changePassword({
          currentPassword: "oldpass",
          newPassword: "newpass",
        });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles incorrect current password", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Current password is incorrect" }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "wrongpassword",
          newPassword: "newpassword456",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe("Current password is incorrect");
      });

      expect(result.current.error).toBe("Current password is incorrect");
    });

    it("handles weak password error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "Password must be at least 8 characters",
          }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "oldpassword123",
          newPassword: "123",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe("Password must be at least 8 characters");
      });
    });

    it("handles network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "oldpassword123",
          newPassword: "newpassword456",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe("Network error");
      });

      expect(result.current.error).toBe("Network error");
    });

    it("handles generic errors without message", async () => {
      (global.fetch as any).mockRejectedValueOnce("Unknown error");

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "oldpassword123",
          newPassword: "newpassword456",
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

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "oldpassword123",
          newPassword: "newpassword456",
        });

        expect(response.error).toBe("Failed to change password");
      });
    });
  });

  describe("Clear Error", () => {
    it("clears error state", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Change failed" }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        await result.current.changePassword({
          currentPassword: "old",
          newPassword: "new",
        });
      });

      expect(result.current.error).toBe("Change failed");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty password fields", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Password is required" }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "",
          newPassword: "",
        });

        expect(response.success).toBe(false);
      });
    });

    it("handles very long passwords", async () => {
      const longPassword = "A".repeat(200);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: longPassword,
          newPassword: "newpassword456",
        });

        expect(response.success).toBe(true);
      });
    });

    it("handles same password error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "New password must be different from current password",
          }),
      });

      const { result } = renderHook(() => useChangePassword());

      await act(async () => {
        const response = await result.current.changePassword({
          currentPassword: "samepassword",
          newPassword: "samepassword",
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe(
          "New password must be different from current password",
        );
      });
    });
  });
});
