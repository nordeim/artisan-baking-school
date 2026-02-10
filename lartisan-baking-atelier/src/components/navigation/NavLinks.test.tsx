import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavLinks } from "./NavLinks";
import * as AuthProvider from "@/components/providers/AuthProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("NavLinks", () => {
  describe("Guest Users", () => {
    beforeEach(() => {
      vi.spyOn(AuthProvider, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });
    });

    it("shows only Home link for guests", () => {
      render(<NavLinks />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("Profile")).not.toBeInTheDocument();
      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });

    it("calls onLinkClick when link is clicked", () => {
      const handleLinkClick = vi.fn();
      render(<NavLinks onLinkClick={handleLinkClick} />);

      const homeLink = screen.getByText("Home");
      homeLink.click();

      expect(handleLinkClick).toHaveBeenCalled();
    });
  });

  describe("Authenticated Users", () => {
    beforeEach(() => {
      vi.spyOn(AuthProvider, "useAuth").mockReturnValue({
        user: {
          id: "1",
          email: "user@example.com",
          name: "Test User",
          role: "USER",
        },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });
    });

    it("shows Home, Dashboard, and Profile links for users", () => {
      render(<NavLinks />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("hides Admin link for regular users", () => {
      render(<NavLinks />);

      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });

    it("marks current page link as active", () => {
      render(<NavLinks />);

      const dashboardLink = screen.getByText("Dashboard");
      expect(dashboardLink).toHaveAttribute("aria-current", "page");
    });

    it("applies active class name to current link", () => {
      render(<NavLinks activeClassName="font-bold" />);

      const dashboardLink = screen.getByText("Dashboard");
      expect(dashboardLink).toHaveClass("font-bold");
    });
  });

  describe("Admin Users", () => {
    beforeEach(() => {
      vi.spyOn(AuthProvider, "useAuth").mockReturnValue({
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
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });
    });

    it("shows all links including Admin for admins", () => {
      render(<NavLinks />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("Admin link has correct href", () => {
      render(<NavLinks />);

      const adminLink = screen.getByText("Admin");
      expect(adminLink.closest("a")).toHaveAttribute("href", "/admin");
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      vi.spyOn(AuthProvider, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });
    });

    it("renders semantic navigation element", () => {
      render(<NavLinks />);

      expect(
        screen.getByRole("navigation", { name: /main navigation/i }),
      ).toBeInTheDocument();
    });

    it("renders links in an unordered list", () => {
      render(<NavLinks />);

      const nav = screen.getByRole("navigation");
      expect(nav.querySelector("ul")).toBeInTheDocument();
      expect(nav.querySelectorAll("li").length).toBeGreaterThan(0);
    });
  });
});
