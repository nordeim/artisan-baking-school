"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { LogoutButton } from "./LogoutButton";
import * as AuthProviderModule from "@/components/providers/AuthProvider";
import * as nextNavigation from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock AuthProvider
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("LogoutButton", () => {
  const mockLogout = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup AuthProvider mock
    vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
      user: {
        id: "1",
        email: "test@example.com",
        name: "Test User",
        role: "USER",
      },
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: mockLogout,
      refreshUser: vi.fn(),
    });

    // Setup router mock
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render logout button with default text", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Logout");
    });

    it("should render with custom text", () => {
      render(<LogoutButton>Sign Out</LogoutButton>);

      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Sign Out");
    });

    it("should render with icon by default", () => {
      render(<LogoutButton />);

      // Check for LogOut icon (using aria-hidden)
      const icon = document.querySelector("svg");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("should not render icon when showIcon is false", () => {
      render(<LogoutButton showIcon={false} />);

      const icon = document.querySelector("svg");
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe("Logout Flow", () => {
    it("should call logout from AuthProvider when clicked", async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it("should show loading state during logout", async () => {
      // Keep logout pending to test loading state
      mockLogout.mockImplementation(() => new Promise(() => {}));

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      // Button should be disabled and show loading state
      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      expect(button).toHaveTextContent("Logging out...");
    });

    it("should redirect to home page after successful logout", async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("should redirect to custom path when specified", async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton redirectTo="/login" />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("should handle logout errors gracefully", async () => {
      mockLogout.mockRejectedValueOnce(new Error("Network error"));

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      // Should still try to redirect even on error (per AuthProvider behavior)
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });

      // Should redirect anyway since AuthProvider clears user on error
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Button Variants", () => {
    it("should apply default variant", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      expect(button).toHaveClass("bg-primary"); // default variant class
    });

    it("should apply ghost variant when specified", () => {
      render(<LogoutButton variant="ghost" />);

      const button = screen.getByRole("button", { name: /logout/i });
      expect(button).toHaveClass("hover:bg-accent"); // ghost variant class
    });

    it("should apply outline variant when specified", () => {
      render(<LogoutButton variant="outline" />);

      const button = screen.getByRole("button", { name: /logout/i });
      expect(button).toHaveClass("border-input"); // outline variant class
    });

    it("should apply custom className", () => {
      render(<LogoutButton className="custom-class" />);

      const button = screen.getByRole("button", { name: /logout/i });
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      expect(button).toHaveAttribute("type", "button");
    });

    it("should be disabled during logout", async () => {
      mockLogout.mockImplementation(() => new Promise(() => {}));

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });

      // Initial state
      expect(button).not.toBeDisabled();

      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it("should support keyboard activation", async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });
      button.focus();
      fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should prevent multiple concurrent logout attempts", async () => {
      mockLogout.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<LogoutButton />);

      const button = screen.getByRole("button", { name: /logout/i });

      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it("should call custom onSuccess callback when provided", async () => {
      const mockOnSuccess = vi.fn();
      mockLogout.mockResolvedValueOnce(undefined);

      render(<LogoutButton onSuccess={mockOnSuccess} />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("should call custom onError callback when logout fails", async () => {
      const mockOnError = vi.fn();
      const error = new Error("Logout failed");
      mockLogout.mockRejectedValueOnce(error);

      render(<LogoutButton onError={mockOnError} />);

      const button = screen.getByRole("button", { name: /logout/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });
  });
});
