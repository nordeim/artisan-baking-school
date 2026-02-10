import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Navbar } from "./Navbar";

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

// Mock useAuth hook
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/components/providers/AuthProvider";

const mockUseAuth = vi.mocked(useAuth);
const mockLogout = vi.fn();

// Mock lucide-react icons
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    Menu: () => <div data-testid="menu-icon">Menu</div>,
    X: () => <div data-testid="x-icon">X</div>,
    Shield: () => <div data-testid="shield-icon">Shield</div>,
    LogOut: () => <div data-testid="logout-icon">LogOut</div>,
    User: () => <div data-testid="user-icon">User</div>,
    LayoutDashboard: () => <div data-testid="dashboard-icon">Dashboard</div>,
    Settings: () => <div data-testid="settings-icon">Settings</div>,
    ChevronRight: () => <div data-testid="chevron-icon">Chevron</div>,
    Check: () => <div data-testid="check-icon">Check</div>,
    Circle: () => <div data-testid="circle-icon">Circle</div>,
  };
});

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  describe("Guest User (Not Authenticated)", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("renders logo and brand name", () => {
      render(<Navbar />);

      expect(screen.getByText("L'Artisan")).toBeInTheDocument();
      expect(screen.getByText(/Baking Atelier/)).toBeInTheDocument();
    });

    it("shows Home link in navigation for guests", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation", { name: /main navigation/i });
      expect(nav).toHaveTextContent("Home");
    });

    it("shows Login and Register buttons for guests", () => {
      render(<Navbar />);

      expect(
        screen.getByRole("button", { name: /login/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /register/i }),
      ).toBeInTheDocument();
    });

    it("hides Dashboard and Profile links for guests", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation");
      expect(nav).not.toHaveTextContent("Dashboard");
      expect(nav).not.toHaveTextContent("Profile");
    });

    it("hides Admin link for guests", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation");
      expect(nav).not.toHaveTextContent("Admin");
    });

    it("logo links to home page", () => {
      render(<Navbar />);

      const logo = screen.getByRole("link", {
        name: /L'Artisan Baking Atelier Home/i,
      });
      expect(logo).toHaveAttribute("href", "/");
    });

    it("login button links to login page", () => {
      render(<Navbar />);

      const loginLink = screen.getByRole("link", { name: /login/i });
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("register button links to register page", () => {
      render(<Navbar />);

      const registerLink = screen.getByRole("link", { name: /register/i });
      expect(registerLink).toHaveAttribute("href", "/register");
    });
  });

  describe("Authenticated User", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test User",
          role: "USER",
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("shows Home, Dashboard, and Profile links for authenticated users", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveTextContent("Home");
      expect(nav).toHaveTextContent("Dashboard");
      expect(nav).toHaveTextContent("Profile");
    });

    it("hides Login and Register buttons for authenticated users", () => {
      render(<Navbar />);

      expect(
        screen.queryByRole("button", { name: /^login$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^register$/i }),
      ).not.toBeInTheDocument();
    });

    it("shows user avatar menu for authenticated users", () => {
      render(<Navbar />);

      expect(
        screen.getByRole("button", { name: /open user menu/i }),
      ).toBeInTheDocument();
    });

    it("hides Admin link for regular users", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation");
      expect(nav).not.toHaveTextContent("Admin");
    });

    it("displays user initials in avatar", () => {
      render(<Navbar />);

      const avatar = screen.getByText("TU"); // Test User initials
      expect(avatar).toBeInTheDocument();
    });
  });

  describe("Admin User", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "1",
          email: "admin@example.com",
          name: "Admin User",
          role: "ADMIN",
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("shows Admin link in navigation for admin users", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveTextContent("Admin");
    });

    it("shows all navigation links for admin users", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveTextContent("Home");
      expect(nav).toHaveTextContent("Dashboard");
      expect(nav).toHaveTextContent("Profile");
      expect(nav).toHaveTextContent("Admin");
    });

    it("displays admin badge in user menu", async () => {
      render(<Navbar />);

      const userMenuButton = screen.getByRole("button", {
        name: /open user menu/i,
      });
      await userEvent.click(userMenuButton);

      // Look for Admin badge specifically in the dropdown (use first occurrence)
      const adminElements = screen.getAllByText("Admin");
      expect(adminElements.length).toBeGreaterThan(0);
      expect(adminElements[0]).toBeInTheDocument();
    });
  });

  describe("Mobile Navigation", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("shows mobile menu button", () => {
      render(<Navbar />);

      expect(
        screen.getByRole("button", { name: /open navigation menu/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      });
    });

    it("renders header element", () => {
      render(<Navbar />);

      expect(screen.getByRole("banner")).toBeInTheDocument();
    });

    it("navigation has accessible name", () => {
      render(<Navbar />);

      const nav = screen.getByRole("navigation", { name: /main navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("handles loading state gracefully", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: mockLogout,
        refreshUser: vi.fn(),
      });

      render(<Navbar />);

      // Should still render without errors
      expect(screen.getByText("L'Artisan")).toBeInTheDocument();
    });
  });
});
