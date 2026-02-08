import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";

// Mock useAuth hook
vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/components/providers/AuthProvider";

const mockUseAuth = vi.mocked(useAuth);

describe("RegisterForm", () => {
  const mockRegister = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: vi.fn(),
      register: mockRegister,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  describe("rendering", () => {
    it("renders registration form with all fields", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });

    it("renders password visibility toggles", () => {
      render(<RegisterForm />);

      expect(
        screen.getAllByRole("button", { name: /show password/i }).length,
      ).toBe(2);
    });

    it("renders link to login page", () => {
      render(<RegisterForm />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
        "href",
        "/login",
      );
    });

    it("renders password strength indicator", () => {
      render(<RegisterForm />);

      expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("validates name is required", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("validates name minimum length", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(nameInput, "A");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/name must be at least 2 characters/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("validates email format", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(emailInput, "invalid-email");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/please enter a valid email/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("validates password minimum length", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(passwordInput, "123");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/password must be at least 8 characters/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("validates password strength requirements", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);

      // Type weak password
      await user.type(passwordInput, "weakpass");

      await waitFor(
        () => {
          expect(screen.getByText(/add a number/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });

    it("validates confirm password matches", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(passwordInput, "password123");
      await user.type(confirmInput, "differentpass");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/passwords do not match/i),
          ).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("submission", () => {
    it("submits form with valid data", async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterForm onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockRegister).toHaveBeenCalledWith({
            name: "John Doe",
            email: "john@example.com",
            password: "StrongPass123!",
            confirmPassword: "StrongPass123!",
          });
        },
        { timeout: 3000 },
      );
    });

    it("calls onSuccess callback after successful registration", async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({ success: true });

      render(<RegisterForm onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(mockOnSuccess).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it("displays error when email already exists", async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({
        success: false,
        error: "Email already registered",
      });

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/email already registered/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it("disables submit button while loading", async () => {
      mockUseAuth.mockReturnValue({
        login: vi.fn(),
        register: mockRegister,
        isLoading: true,
        isAuthenticated: false,
        user: null,
        logout: vi.fn(),
        refreshUser: vi.fn(),
      });

      render(<RegisterForm />);

      const submitButton = screen.getByRole("button", {
        name: /creating account/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValueOnce(new Error("Network error"));

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/an error occurred during registration/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("password visibility", () => {
    it("toggles password field visibility", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(
        /^password$/i,
      ) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole("button", {
        name: /show password/i,
      });

      expect(passwordInput.type).toBe("password");

      await user.click(toggleButtons[0]);

      expect(passwordInput.type).toBe("text");
    });

    it("toggles confirm password field visibility independently", async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const confirmInput = screen.getByLabelText(
        /confirm password/i,
      ) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole("button", {
        name: /show password/i,
      });

      expect(confirmInput.type).toBe("password");

      await user.click(toggleButtons[1]);

      expect(confirmInput.type).toBe("text");
    });
  });

  describe("accessibility", () => {
    it("has accessible form labels", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute("type", "text");
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "type",
        "password",
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        "type",
        "password",
      );
    });

    it("displays errors with role alert", async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce({
        success: false,
        error: "Email already registered",
      });

      render(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "existing@example.com");
      await user.type(passwordInput, "StrongPass123!");
      await user.type(confirmInput, "StrongPass123!");
      await user.click(submitButton);

      await waitFor(
        () => {
          const errorAlert = screen.getByRole("alert");
          expect(errorAlert).toHaveTextContent(/email already registered/i);
        },
        { timeout: 5000 },
      );
    });
  });
});
