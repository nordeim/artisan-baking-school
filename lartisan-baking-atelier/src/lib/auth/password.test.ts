import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, generateSecureToken } from "./password";

describe("hashPassword", () => {
  it("should hash password successfully", async () => {
    const password = "mySecurePassword123!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should generate bcrypt hash format", async () => {
    const password = "testPassword";
    const hash = await hashPassword(password);

    // Bcrypt hash format: $2a$12$...
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("should generate unique hashes for same password", async () => {
    const password = "samePassword";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // Due to salt, same password should produce different hashes
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty string", async () => {
    const hash = await hashPassword("");
    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("should handle long passwords", async () => {
    const longPassword = "a".repeat(100);
    const hash = await hashPassword(longPassword);

    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\$2[aby]\$/);
  });
});

describe("verifyPassword", () => {
  it("should return true for correct password", async () => {
    const password = "correctPassword123!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should return false for incorrect password", async () => {
    const password = "correctPassword123!";
    const wrongPassword = "wrongPassword456!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it("should return false for empty password", async () => {
    const password = "somePassword";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("", hash);
    expect(isValid).toBe(false);
  });

  it("should verify previously hashed password", async () => {
    // Hash a password, then verify it works
    const password = "testPassword123!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});

describe("generateSecureToken", () => {
  it("should generate token of correct length", () => {
    const token = generateSecureToken(32);
    // 32 bytes = 64 hex characters
    expect(token.length).toBe(64);
  });

  it("should generate unique tokens", () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);

    expect(token1).not.toBe(token2);
  });

  it("should generate valid hex string", () => {
    const token = generateSecureToken(32);

    // Should only contain hex characters
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("should use default length of 32", () => {
    const token = generateSecureToken();
    expect(token.length).toBe(64); // 32 bytes = 64 hex chars
  });

  it("should handle different lengths", () => {
    const token16 = generateSecureToken(16);
    expect(token16.length).toBe(32); // 16 bytes = 32 hex chars

    const token64 = generateSecureToken(64);
    expect(token64.length).toBe(128); // 64 bytes = 128 hex chars
  });
});
