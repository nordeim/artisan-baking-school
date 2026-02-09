import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import LoginPage from "./page";
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

// Mock LoginForm component
vi.mock("@/components/auth/LoginForm", () => ({
  LoginForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="login-form">
      <button onClick={onSuccess} data-testid="login-submit">
        Login Form
      </button>
    </div>
  ),
}));

describe("LoginPage", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(nextNavigation.useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);

    vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<
        typeof nextNavigation.useSearchParams
      >,
    );

    vi.mocked(AuthProviderModule.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render login form", () => {
      render(<LoginPage />);
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });

    it("should render page heading", () => {
      render(<LoginPage />);
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it("should render link to registration page", () => {
      render(<LoginPage />);
      const registerLink = screen.getByRole("link", {
        name: /create an account/i,
      });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("should have descriptive text", () => {
      render(<LoginPage />);
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });
  });

  describe("Redirect After Login", () => {
    it("should redirect to home after successful login without redirect param", () => {
      render(<LoginPage />);
      const loginButton = screen.getByTestId("login-submit");
      fireEvent.click(loginButton);
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should redirect to specified path when redirect param exists", () => {
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams("redirect=/dashboard") as unknown as ReturnType<
          typeof nextNavigation.useSearchParams
        >,
      );
      render(<LoginPage />);
      const loginButton = screen.getByTestId("login-submit");
      fireEvent.click(loginButton);
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should decode URL-encoded redirect param", () => {
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams(
          "redirect=%2Fdashboard%2Fsettings",
        ) as unknown as ReturnType<typeof nextNavigation.useSearchParams>,
      );
      render(<LoginPage />);
      const loginButton = screen.getByTestId("login-submit");
      fireEvent.click(loginButton);
      expect(mockPush).toHaveBeenCalledWith("/dashboard/settings");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible heading", () => {
      render(<LoginPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(/sign in/i);
    });
  });
});
