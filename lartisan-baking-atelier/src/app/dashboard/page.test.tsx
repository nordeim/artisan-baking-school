import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import DashboardPage from "./page";
import * as AuthProviderModule from "@/components/providers/AuthProvider";
import * as ProtectedRouteModule from "@/components/auth/ProtectedRoute";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

// Mock the LogoutButton component
vi.mock("@/components/auth/LogoutButton", () => ({
  LogoutButton: ({ variant, size }: { variant?: string; size?: string }) => (
    <button data-testid="logout-button" data-variant={variant} data-size={size}>
      Logout
    </button>
  ),
}));

// Mock AuthProvider
const mockUseAuth = vi.fn();
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("DashboardPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    // Setup router mock
    (useRouter as any).mockReturnValue({ push: mockPush });
    (usePathname as any).mockReturnValue("/dashboard");
  });

  describe("Loading State", () => {
    it("renders loading spinner when authentication is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });

      render(<DashboardPage />);

      expect(
        screen.getByRole("status", { name: /loading authentication/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Unauthenticated State", () => {
    it("redirects to login when user is not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fdashboard");
      });
    });

    it("redirects to login without redirect param when pathname matches fallback", async () => {
      (usePathname as any).mockReturnValue("/login");
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Authenticated State", () => {
    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      role: "USER",
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        isAuthenticated: true,
      });
    });

    it("renders dashboard content when user is authenticated", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });

      expect(screen.getByText(/welcome back, test user/i)).toBeInTheDocument();
    });

    it("displays user profile information", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Profile")).toBeInTheDocument();
      });

      expect(screen.getByText("Test User")).toBeInTheDocument();
      // Email appears twice - use getAllByText and check at least one exists
      expect(
        screen.getAllByText("test@example.com").length,
      ).toBeGreaterThanOrEqual(1);
      // Role badge uses "user" class and role details also show "user"
      expect(screen.getAllByText("user").length).toBeGreaterThanOrEqual(1);
    });

    it("displays avatar with user initials", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("TU")).toBeInTheDocument(); // Initials
      });
    });

    it("displays logout button in header", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByTestId("logout-button").length).toBeGreaterThan(
          0,
        );
      });
    });

    it("displays user ID with truncation", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("User ID:")).toBeInTheDocument();
      });

      expect(screen.getByText(/user-123\.\.\./)).toBeInTheDocument();
    });

    it("displays account details section", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Member since:")).toBeInTheDocument();
      });

      expect(screen.getByText("Email:")).toBeInTheDocument();
      expect(screen.getByText("Role:")).toBeInTheDocument();
    });

    it("displays quick stats section", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("Completed")).toBeInTheDocument();
        expect(screen.getByText("Status")).toBeInTheDocument();
      });

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("displays recent activity section", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Recent Activity")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/no recent activity to display/i),
      ).toBeInTheDocument();
    });

    it("displays account actions section", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Account Actions")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Manage your account settings"),
      ).toBeInTheDocument();
    });

    it("uses default fallback when user has no name", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: null },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/welcome back, test@example.com/i),
        ).toBeInTheDocument();
      });
    });

    it("displays admin badge for admin users", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: "ADMIN" },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // "admin" appears in both badge and role details
        expect(screen.getAllByText("admin").length).toBeGreaterThanOrEqual(1);
      });
    });

    it("displays user badge for regular users", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: "USER" },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        // "user" appears in both badge and role details
        expect(screen.getAllByText("user").length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("Avatar Initials", () => {
    it("generates correct initials for single name", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "John",
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("J")).toBeInTheDocument();
      });
    });

    it("generates correct initials for multiple names", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "John Michael Smith",
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("JM")).toBeInTheDocument();
      });
    });

    it("uses 'U' as fallback when name is null", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: null,
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("U")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles user without role gracefully", async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          role: null,
        },
        isLoading: false,
        isAuthenticated: true,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
      });
    });

    it("handles missing user gracefully", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });
});
