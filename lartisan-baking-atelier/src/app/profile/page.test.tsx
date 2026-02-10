import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "./page";
import { useRouter, usePathname } from "next/navigation";

// Mock dependencies
const mockLogout = vi.fn();
const mockPush = vi.fn();

interface MockUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

const mockUser: MockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "USER",
};

interface AuthState {
  user: MockUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: typeof mockLogout;
}

const mockUseAuth = vi.fn(
  (): AuthState => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    logout: mockLogout,
  }),
);

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/profile/ProfileEditForm", () => ({
  ProfileEditForm: () => (
    <div data-testid="profile-edit-form">Profile Edit Form Component</div>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/profile",
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      logout: mockLogout,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Protected Route Behavior", () => {
    it("renders loading spinner when authentication is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      expect(
        screen.getByRole("status", { name: /loading authentication/i }),
      ).toBeInTheDocument();
    });

    it("redirects to login when user is not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?redirect=%2Fprofile");
      });
    });
  });

  describe("Page Content", () => {
    it("renders profile page with all elements when authenticated", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        // Profile Settings appears twice - as heading and sidebar link
        expect(
          screen.getAllByText("Profile Settings").length,
        ).toBeGreaterThanOrEqual(1);
      });

      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(screen.getByTestId("profile-edit-form")).toBeInTheDocument();
    });

    it("displays user avatar with initials", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("TU")).toBeInTheDocument();
      });
    });

    it("displays user role badge", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("user")).toBeInTheDocument();
      });
    });

    it("renders back to dashboard button", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
      });
    });

    it("renders navigation sidebar with links", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Dashboard")).toBeInTheDocument();
        // Profile Settings appears twice - sidebar link and page heading
        expect(
          screen.getAllByText("Profile Settings").length,
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Logout")).toBeInTheDocument();
      });
    });

    it("renders profile description text", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(
          screen.getByText(
            /manage your account information and security settings/i,
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("back button links to dashboard", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const backLink = screen.getByRole("link", {
          name: /back to dashboard/i,
        });
        expect(backLink).toHaveAttribute("href", "/dashboard");
      });
    });

    it("dashboard link navigates to dashboard", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        const dashboardLink = screen.getByText("Dashboard");
        expect(dashboardLink.closest("a")).toHaveAttribute(
          "href",
          "/dashboard",
        );
      });
    });

    it("profile settings is current page (highlighted)", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        // Get all Profile Settings elements and find the one in the sidebar (the link)
        const profileSettingsElements = screen.getAllByText("Profile Settings");
        const sidebarLink = profileSettingsElements.find(
          (el) => el.closest("a")?.getAttribute("href") === "/profile",
        );
        expect(sidebarLink).toBeTruthy();
        expect(sidebarLink?.closest("a")).toHaveClass("bg-slate-50");
      });
    });
  });

  describe("Admin Features", () => {
    it("shows admin panel link for admin users", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: "ADMIN" },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Admin Panel")).toBeInTheDocument();
      });
    });

    it("hides admin panel link for regular users", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, role: "USER" },
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.queryByText("Admin Panel")).not.toBeInTheDocument();
      });
    });
  });

  describe("Logout Functionality", () => {
    it("calls logout when logout button is clicked", async () => {
      const user = userEvent.setup();
      mockLogout.mockResolvedValue(undefined);

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("Logout")).toBeInTheDocument();
      });

      const logoutButton = screen.getByText("Logout");
      await user.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("Avatar Initials", () => {
    it("generates correct initials for user with name", async () => {
      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("TU")).toBeInTheDocument();
      });
    });

    it("shows 'U' for user without name", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: null } as MockUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("U")).toBeInTheDocument();
      });
    });

    it("handles single name correctly", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: "John" } as MockUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("J")).toBeInTheDocument();
      });
    });

    it("handles multi-word name correctly", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: "John Michael Smith" } as MockUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("JM")).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles null user gracefully", () => {
      mockUseAuth.mockReturnValue({
        user: null as MockUser | null,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      const { container } = render(<ProfilePage />);
      // Should render without crashing, but content area may be empty
      expect(container).toBeTruthy();
    });

    it("displays email in fallback when name is null", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: null } as MockUser,
        isLoading: false,
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText("test@example.com")).toBeInTheDocument();
      });
    });
  });
});
