import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileEditForm } from "./ProfileEditForm";

// Mock dependencies
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();
const mockClearProfileError = vi.fn();
const mockClearPasswordError = vi.fn();
const mockRefreshUser = vi.fn();

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "USER",
};

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    refreshUser: mockRefreshUser,
  }),
}));

vi.mock("@/lib/hooks/useUpdateProfile", () => ({
  useUpdateProfile: () => ({
    updateProfile: mockUpdateProfile,
    isLoading: false,
    error: null,
    clearError: mockClearProfileError,
  }),
}));

vi.mock("@/lib/hooks/useChangePassword", () => ({
  useChangePassword: () => ({
    changePassword: mockChangePassword,
    isLoading: false,
    error: null,
    clearError: mockClearPasswordError,
  }),
}));

describe("ProfileEditForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("renders profile form with all fields", () => {
      render(<ProfileEditForm />);

      expect(screen.getByText("Personal Information")).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /save changes/i }),
      ).toBeInTheDocument();
    });

    it("renders password section", () => {
      render(<ProfileEditForm />);

      // Use getAllByText since "Change Password" appears as heading and button
      expect(
        screen.getAllByText("Change Password").length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText(/^current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/^confirm new password/i),
      ).toBeInTheDocument();
    });

    it("pre-fills name field with user data", () => {
      render(<ProfileEditForm />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Test User");
    });
  });

  describe("Profile Update", () => {
    it("submits profile update form successfully", async () => {
      mockUpdateProfile.mockResolvedValue({ success: true });

      render(<ProfileEditForm />);

      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, "Updated Name");

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          name: "Updated Name",
        });
      });
    });

    it("validates name is required", async () => {
      render(<ProfileEditForm />);

      const nameInput = screen.getByLabelText(/name/i);
      await userEvent.clear(nameInput);

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/name must be at least 2 characters/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Password Change", () => {
    it("submits password change form successfully", async () => {
      mockChangePassword.mockResolvedValue({ success: true });

      render(<ProfileEditForm />);

      const currentPasswordInput = screen.getByLabelText(/^current password/i);
      const newPasswordInput = screen.getByLabelText(/^new password/i);
      const confirmPasswordInput = screen.getByLabelText(
        /^confirm new password/i,
      );

      await userEvent.type(currentPasswordInput, "currentpass123");
      await userEvent.type(newPasswordInput, "newpassword123");
      await userEvent.type(confirmPasswordInput, "newpassword123");

      const submitButton = screen.getByRole("button", {
        name: /change password/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: "currentpass123",
          newPassword: "newpassword123",
        });
      });
    });
  });
});
