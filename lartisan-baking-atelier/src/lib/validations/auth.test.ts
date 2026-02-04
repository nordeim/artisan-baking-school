import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "./auth";

describe("loginSchema", () => {
  it("should validate correct login data", () => {
    const validData = {
      email: "test@example.com",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject empty email", () => {
    const invalidData = {
      email: "",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject invalid email format", () => {
    const invalidData = {
      email: "invalid-email",
      password: "Password123!",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const invalidData = {
      email: "test@example.com",
      password: "short",
    };

    const result = loginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should accept rememberMe field", () => {
    const validData = {
      email: "test@example.com",
      password: "Password123!",
      rememberMe: true,
    };

    const result = loginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  const validRegistration = {
    name: "John Doe",
    email: "john@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
    pdpaConsent: true,
  };

  it("should validate correct registration data", () => {
    const result = registerSchema.safeParse(validRegistration);
    expect(result.success).toBe(true);
  });

  it("should reject short name", () => {
    const invalidData = {
      ...validRegistration,
      name: "A",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase", () => {
    const invalidData = {
      ...validRegistration,
      password: "password123!",
      confirmPassword: "password123!",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const invalidData = {
      ...validRegistration,
      password: "Password!",
      confirmPassword: "Password!",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject password without special character", () => {
    const invalidData = {
      ...validRegistration,
      password: "Password123",
      confirmPassword: "Password123",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject mismatched passwords", () => {
    const invalidData = {
      ...validRegistration,
      confirmPassword: "DifferentPassword123!",
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject missing PDPA consent", () => {
    const invalidData = {
      ...validRegistration,
      pdpaConsent: false,
    };

    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should accept optional marketing consent", () => {
    const validData = {
      ...validRegistration,
      marketingConsent: true,
    };

    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("should validate email for password reset", () => {
    const validData = {
      email: "test@example.com",
    };

    const result = forgotPasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const invalidData = {
      email: "not-an-email",
    };

    const result = forgotPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const validReset = {
    token: "valid-reset-token",
    password: "NewPassword123!",
    confirmPassword: "NewPassword123!",
  };

  it("should validate password reset data", () => {
    const result = resetPasswordSchema.safeParse(validReset);
    expect(result.success).toBe(true);
  });

  it("should reject missing token", () => {
    const invalidData = {
      ...validReset,
      token: "",
    };

    const result = resetPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject mismatched passwords", () => {
    const invalidData = {
      ...validReset,
      confirmPassword: "DifferentPassword123!",
    };

    const result = resetPasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const validChange = {
    currentPassword: "CurrentPassword123!",
    newPassword: "NewPassword123!",
    confirmNewPassword: "NewPassword123!",
  };

  it("should validate password change data", () => {
    const result = changePasswordSchema.safeParse(validChange);
    expect(result.success).toBe(true);
  });

  it("should reject same current and new password", () => {
    const invalidData = {
      currentPassword: "SamePassword123!",
      newPassword: "SamePassword123!",
      confirmNewPassword: "SamePassword123!",
    };

    const result = changePasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject mismatched new passwords", () => {
    const invalidData = {
      ...validChange,
      confirmNewPassword: "DifferentPassword123!",
    };

    const result = changePasswordSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
