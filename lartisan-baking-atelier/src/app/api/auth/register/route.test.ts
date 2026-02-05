import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock session
vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn().mockResolvedValue({
    userId: "user-123",
    email: "test@example.com",
    role: "STUDENT",
    accessToken: "access-token",
    refreshToken: "refresh-token",
  }),
}));

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validRegistration = {
    name: "John Doe",
    email: "john@example.com",
    password: "SecurePass123!",
    confirmPassword: "SecurePass123!",
    pdpaConsent: true,
    marketingConsent: false,
  };

  it("should register new user successfully", async () => {
    // Mock no existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-123",
      email: validRegistration.email,
      name: validRegistration.name,
      role: "STUDENT",
      passwordHash: "hashed-password",
      pdpaConsent: true,
      pdpaConsentDate: new Date(),
      marketingConsent: false,
      createdAt: new Date(),
    } as never);

    const request = createRequest(validRegistration);
    const response = await POST(request);

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.user).toMatchObject({
      id: "user-123",
      email: validRegistration.email,
      name: validRegistration.name,
      role: "STUDENT",
    });
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    // Mock existing user
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "existing-user",
      email: validRegistration.email,
      name: "Existing User",
    } as never);

    const request = createRequest(validRegistration);
    const response = await POST(request);

    expect(response.status).toBe(409);

    const data = await response.json();
    expect(data.error).toBe("Email already registered");
  });

  it("should validate password strength", async () => {
    const weakPasswordData = {
      ...validRegistration,
      password: "weak",
      confirmPassword: "weak",
    };

    const request = createRequest(weakPasswordData);
    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
    expect(data.details).toBeDefined();
  });

  it("should require PDPA consent", async () => {
    const noConsentData = {
      ...validRegistration,
      pdpaConsent: false,
    };

    const request = createRequest(noConsentData);
    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should reject mismatched passwords", async () => {
    const mismatchedPasswords = {
      ...validRegistration,
      confirmPassword: "DifferentPass123!",
    };

    const request = createRequest(mismatchedPasswords);
    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should reject invalid email format", async () => {
    const invalidEmail = {
      ...validRegistration,
      email: "not-an-email",
    };

    const request = createRequest(invalidEmail);
    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should reject missing required fields", async () => {
    const incompleteData = {
      email: "test@example.com",
      password: "SecurePass123!",
    };

    const request = createRequest(incompleteData);
    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe("Validation failed");
  });

  it("should sanitize user data in response", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-123",
      email: validRegistration.email,
      name: validRegistration.name,
      role: "STUDENT",
      passwordHash: "should-not-be-in-response",
      pdpaConsent: true,
      pdpaConsentDate: new Date(),
      marketingConsent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
      image: null,
      phone: null,
      bio: null,
      birthday: null,
    } as never);

    const request = createRequest(validRegistration);
    const response = await POST(request);

    const data = await response.json();

    // Should not include sensitive fields
    expect(data.user.passwordHash).toBeUndefined();
    expect(data.user.pdpaConsentDate).toBeUndefined();
    expect(data.user.emailVerified).toBeUndefined();

    // Should include public fields
    expect(data.user.id).toBeDefined();
    expect(data.user.email).toBe(validRegistration.email);
    expect(data.user.name).toBe(validRegistration.name);
    expect(data.user.role).toBe("STUDENT");
  });

  it("should store hashed password in database", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    let capturedPasswordHash: string | undefined;
    vi.mocked(prisma.user.create).mockImplementation(async (args) => {
      capturedPasswordHash = (args.data as { passwordHash: string })
        .passwordHash;
      return {
        id: "user-123",
        email: validRegistration.email,
        name: validRegistration.name,
        role: "STUDENT",
        passwordHash: capturedPasswordHash,
        pdpaConsent: true,
        pdpaConsentDate: new Date(),
        marketingConsent: false,
        createdAt: new Date(),
      } as never;
    });

    const request = createRequest(validRegistration);
    await POST(request);

    expect(capturedPasswordHash).toBeDefined();
    expect(capturedPasswordHash).not.toBe(validRegistration.password);
    // Should be a bcrypt hash
    expect(capturedPasswordHash).toMatch(/^\$2[aby]\$/);
  });

  it("should set session cookies on successful registration", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-123",
      email: validRegistration.email,
      name: validRegistration.name,
      role: "STUDENT",
      passwordHash: "hashed",
      pdpaConsent: true,
      pdpaConsentDate: new Date(),
      marketingConsent: false,
      createdAt: new Date(),
    } as never);

    const { createSession } = await import("@/lib/auth/session");

    const request = createRequest(validRegistration);
    await POST(request);

    expect(createSession).toHaveBeenCalledWith({
      userId: "user-123",
      email: validRegistration.email,
      role: "STUDENT",
    });
  });
});
