import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import RegisterPage from "./page";
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

// Mock RegisterForm component
vi.mock("@/components/auth/RegisterForm", () => ({
  RegisterForm: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div data-testid="register-form">
      <button onClick={onSuccess} data-testid="register-submit">
        Register Form
      </button>
    </div>
  ),
}));

describe("RegisterPage", () => {
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
    it("should render register form", () => {
      render(<RegisterPage />);
      expect(screen.getByTestId("register-form")).toBeInTheDocument();
    });

    it("should render page heading", () => {
      render(<RegisterPage />);
      expect(
        screen.getByRole("heading", { name: /create account/i }),
      ).toBeInTheDocument();
    });

    it("should render link to login page", () => {
      render(<RegisterPage />);
      const loginLink = screen.getByRole("link", { name: /sign in/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });

    it("should have descriptive text", () => {
      render(<RegisterPage />);
      expect(screen.getByText(/join us today/i)).toBeInTheDocument();
    });
  });

  describe("Redirect After Registration", () => {
    it("should redirect to home after successful registration without redirect param", () => {
      render(<RegisterPage />);
      const registerButton = screen.getByTestId("register-submit");
      fireEvent.click(registerButton);
      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should redirect to specified path when redirect param exists", () => {
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams("redirect=/dashboard") as unknown as ReturnType<
          typeof nextNavigation.useSearchParams
        >,
      );
      render(<RegisterPage />);
      const registerButton = screen.getByTestId("register-submit");
      fireEvent.click(registerButton);
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });

    it("should decode URL-encoded redirect param", () => {
      vi.mocked(nextNavigation.useSearchParams).mockReturnValue(
        new URLSearchParams(
          "redirect=%2Fdashboard%2Fsettings",
        ) as unknown as ReturnType<typeof nextNavigation.useSearchParams>,
      );
      render(<RegisterPage />);
      const registerButton = screen.getByTestId("register-submit");
      fireEvent.click(registerButton);
      expect(mockPush).toHaveBeenCalledWith("/dashboard/settings");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible heading", () => {
      render(<RegisterPage />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(/create account/i);
    });
  });
});
