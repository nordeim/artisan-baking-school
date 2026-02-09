import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import AuthLayout from "./layout";
import * as AuthProviderModule from "@/components/providers/AuthProvider";
import * as nextNavigation from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock AuthProvider
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("AuthLayout", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);

    // Setup search params mock (empty by default)
    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<
        typeof nextNavigation.useSearchParams
      >,
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render children content", () => {
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
        <AuthLayout>
          <div data-testid="auth-content">Auth Form</div>
        </AuthLayout>,
      );

      expect(screen.getByTestId("auth-content")).toBeInTheDocument();
    });

    it("should render with centered layout structure", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      const { container } = render(
        <AuthLayout>
          <div>Content</div>
        </AuthLayout>,
      );

      // Check for main container with flex centering
      const mainElement = container.querySelector("main");
      expect(mainElement).toHaveClass(
        "flex min-h-screen items-center justify-center",
      );
    });

    it("should render card-like container for content", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      const { container } = render(
        <AuthLayout>
          <div>Content</div>
        </AuthLayout>,
      );

      const cardElement = container.querySelector("[class*='rounded-lg']");
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe("Authenticated User Redirect", () => {
    it("should redirect to home when user is authenticated", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
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
        <AuthLayout>
          <div data-testid="auth-content">Auth Form</div>
        </AuthLayout>,
      );

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should redirect to specified path when redirect param exists", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      // Mock redirect param
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams("redirect=/dashboard") as unknown as ReturnType<
          typeof nextNavigation.useSearchParams
        >,
      );

      render(
        <AuthLayout>
          <div data-testid="auth-content">Auth Form</div>
        </AuthLayout>,
      );

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should decode URL-encoded redirect param", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: {
          id: "1",
          email: "test@example.com",
          name: "Test",
          role: "USER",
        },
        isLoading: false,
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      // Mock URL-encoded redirect param
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams(
          "redirect=%2Fdashboard%2Fsettings",
        ) as unknown as ReturnType<typeof nextNavigation.useSearchParams>,
      );

      render(
        <AuthLayout>
          <div data-testid="auth-content">Auth Form</div>
        </AuthLayout>,
      );

      expect(mockPush).toHaveBeenCalledWith("/dashboard/settings");
    });

    it("should show loading state while checking auth", () => {
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
        <AuthLayout>
          <div data-testid="auth-content">Auth Form</div>
        </AuthLayout>,
      );

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByTestId("auth-content")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have main landmark", () => {
      vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      const { container } = render(
        <AuthLayout>
          <div>Content</div>
        </AuthLayout>,
      );

      const mainElement = container.querySelector("main");
      expect(mainElement).toBeInTheDocument();
    });

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
        <AuthLayout>
          <div>Content</div>
        </AuthLayout>,
      );

      const loadingElement = screen.getByRole("status");
      expect(loadingElement).toHaveAttribute("aria-label", "Loading...");
    });
  });
});
