import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";

// Mock useAuth hook
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/components/providers/AuthProvider";

const mockUseAuth = vi.mocked(useAuth);

describe("LoginForm", () => {
  const mockLogin = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("renders login form with email and password fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it("renders password visibility toggle", () => {
      render(<LoginForm />);

      expect(
        screen.getByRole("button", { name: /show password/i }),
      ).toBeInTheDocument();
    });

    it("renders link to register page", () => {
      render(<LoginForm />);

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
        "href",
        "/register",
      );
    });
  });

  describe("validation", () => {
    it("validates email format", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "invalid-email");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email/i),
        ).toBeInTheDocument();
      });
    });

    it("validates email is required", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it("validates password minimum length", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(passwordInput, "123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i),
        ).toBeInTheDocument();
      });
    });

    it("validates password is required", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });
  });

  describe("submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({ success: true });

      render(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("calls onSuccess callback after successful login", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({ success: true });

      render(<LoginForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("shows loading state during submission", async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100),
          ),
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: /signing in/i }),
          ).toBeDisabled();
        },
        { timeout: 2000 },
      );
    });

    it("displays error on invalid credentials", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({
        success: false,
        error: "Invalid credentials",
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it("disables submit button while loading", async () => {
      mockUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /signing in/i });
      expect(submitButton).toBeDisabled();
    });

    it("clears error when user starts typing again", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({
        success: false,
        error: "Invalid credentials",
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      // Submit to trigger error
      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrong");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Type again to clear error
      await user.clear(passwordInput);
      await user.type(passwordInput, "new");

      await waitFor(() => {
        expect(
          screen.queryByText(/invalid credentials/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("password visibility", () => {
    it("toggles password visibility", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(
        /^password$/i,
      ) as HTMLInputElement;
      const toggleButton = screen.getByRole("button", {
        name: /show password/i,
      });

      expect(passwordInput.type).toBe("password");

      await user.click(toggleButton);

      expect(passwordInput.type).toBe("text");
      expect(
        screen.getByRole("button", { name: /hide password/i }),
      ).toBeInTheDocument();

      await user.click(toggleButton);

      expect(passwordInput.type).toBe("password");
    });
  });

  describe("error handling", () => {
    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Network error"));

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/an error occurred during login/i),
        ).toBeInTheDocument();
      });
    });

    it("handles rate limiting errors", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({
        success: false,
        error: "Too many attempts. Please try again later.",
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/too many attempts. please try again later/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("has accessible form labels", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "type",
        "password",
      );
    });

    it("has accessible password toggle button", () => {
      render(<LoginForm />);

      const toggleButton = screen.getByRole("button", {
        name: /show password/i,
      });
      expect(toggleButton).toHaveAttribute("type", "button");
      expect(toggleButton).toHaveAttribute("aria-label", "Show password");
    });

    it("displays errors with role alert", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce({
        success: false,
        error: "Invalid credentials",
      });

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert");
        expect(errorAlert).toHaveTextContent(/invalid credentials/i);
      });
    });
  });
});
