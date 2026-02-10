import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPage from "./page";

// Mock dependencies
const mockPush = vi.fn();
const mockFetch = vi.fn();

const mockAdminUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin User",
  role: "ADMIN",
};

const mockUsers = [
  {
    id: "user-1",
    email: "user1@example.com",
    name: "User One",
    role: "USER",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "user-2",
    email: "user2@example.com",
    name: "User Two",
    role: "ADMIN",
    createdAt: "2024-01-02T00:00:00Z",
  },
];

const mockStats = {
  totalUsers: 100,
  activeUsers: 85,
  adminUsers: 5,
  newUsersThisMonth: 12,
};

// Mock window.confirm
Object.defineProperty(window, "confirm", {
  writable: true,
  value: vi.fn(),
});

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockAdminUser,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/admin",
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    global.fetch = mockFetch;

    // Default successful responses
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ stats: mockStats }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ users: mockUsers, total: 2 }),
      });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Page Rendering", () => {
    it("renders admin dashboard for admin users", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Manage users and view system statistics"),
      ).toBeInTheDocument();
    });

    it("shows admin badge in header", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("Admin")).toBeInTheDocument();
      });
    });
  });

  describe("Statistics Cards", () => {
    it("displays all statistics cards", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("Total Users")).toBeInTheDocument();
        expect(screen.getByText("Active Users")).toBeInTheDocument();
        expect(screen.getByText("Admins")).toBeInTheDocument();
        expect(screen.getByText("New This Month")).toBeInTheDocument();
      });
    });

    it("displays correct statistics values", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
      });
    });
  });

  describe("User Management Table", () => {
    it("displays user management section", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("User Management")).toBeInTheDocument();
      });

      expect(
        screen.getByText("Manage user accounts and permissions"),
      ).toBeInTheDocument();
    });

    it("displays users in table", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("User One")).toBeInTheDocument();
        expect(screen.getByText("User Two")).toBeInTheDocument();
      });

      expect(screen.getByText("user1@example.com")).toBeInTheDocument();
      expect(screen.getByText("user2@example.com")).toBeInTheDocument();
    });

    it("displays user role dropdowns", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        const roleSelects = screen.getAllByRole("combobox");
        expect(roleSelects.length).toBeGreaterThanOrEqual(2);
      });
    });

    it("displays user count", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/showing 2 of 2 users/i)).toBeInTheDocument();
      });
    });
  });

  describe("Search Functionality", () => {
    it("has search input field", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search users..."),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("has back to dashboard button", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/back to dashboard/i)).toBeInTheDocument();
      });

      const backLink = screen.getByText(/back to dashboard/i);
      expect(backLink.closest("a")).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("Avatar Initials", () => {
    it("displays correct initials for users", async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText("UO")).toBeInTheDocument();
        expect(screen.getByText("UT")).toBeInTheDocument();
      });
    });
  });
});
