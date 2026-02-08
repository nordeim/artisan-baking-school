"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute";
import * as AuthProviderModule from "@/components/providers/AuthProvider";
import * as nextNavigation from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock AuthProvider
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute", () => {
  const mockPush = vi.fn();
  const mockPathname = "/dashboard";

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);

    // Setup pathname mock
    vi.mocked(nextNavigation.usePathname).mockReturnValue(mockPathname);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Authentication Check", () => {
    it("should render children when user is authenticated", () => {
      // Setup authenticated state
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
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("should redirect to login when user is not authenticated", async () => {
      // Setup unauthenticated state
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });

      // Content should not be rendered
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should show loading state while checking authentication", () => {
      // Setup loading state
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      // Should show loading spinner
      expect(screen.getByRole("status")).toBeInTheDocument();

      // Content should not be rendered yet
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  describe("Role-Based Access Control", () => {
    it("should render content when user has required role", () => {
      // Setup authenticated admin user
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin",
          role: "ADMIN",
        },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <div data-testid="admin-content">Admin Dashboard</div>
        </ProtectedRoute>,
      );

      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
    });

    it("should redirect when user does not have required role", async () => {
      // Setup authenticated regular user (not admin)
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          name: "User",
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <div data-testid="admin-content">Admin Dashboard</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });

      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });

    it("should handle USER role requirement", async () => {
      // Setup authenticated user
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          name: "User",
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="USER">
          <div data-testid="user-content">User Dashboard</div>
        </ProtectedRoute>,
      );

      expect(screen.getByTestId("user-content")).toBeInTheDocument();
    });
  });

  describe("Redirect with URL Preservation", () => {
    it("should preserve current pathname for redirect back", async () => {
      // Setup unauthenticated state
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      // Set current pathname
      vi.mocked(nextNavigation.usePathname).mockReturnValue(
        "/dashboard/settings",
      );

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          "/login?redirect=/dashboard/settings",
        );
      });
    });

    it("should not add redirect param when on login page", async () => {
      // Setup unauthenticated state
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      // Set current pathname to login
      vi.mocked(nextNavigation.usePathname).mockReturnValue("/login");

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        // Should not add redirect param when already on login
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null user object gracefully", async () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("should handle missing role field on user", async () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: { id: "1", email: "test@example.com", name: "Test" } as any,
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      // Should redirect because role check fails
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });

    it("should not redirect multiple times", async () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger another redirect
      rerender(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      // Should still only be called once
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible loading state", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
      );

      const loadingElement = screen.getByRole("status");
      expect(loadingElement).toHaveAttribute(
        "aria-label",
        "Loading authentication...",
      );
    });
  });
});
