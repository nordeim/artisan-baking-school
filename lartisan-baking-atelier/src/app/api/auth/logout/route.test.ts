import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "./route";

// Mock session module
vi.mock("@/lib/auth/session", () => ({
  destroySession: vi.fn(),
}));

import { destroySession } from "@/lib/auth/session";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (): Request => {
    return new Request("http://localhost/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  };

  describe("successful logout", () => {
    it("should clear all authentication cookies", async () => {
      // Arrange
      vi.mocked(destroySession).mockResolvedValue(undefined);

      // Act
      const request = createRequest();
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Logout successful");
      expect(destroySession).toHaveBeenCalledTimes(1);
    });

    it("should succeed when no session exists (idempotent)", async () => {
      // Arrange - session module handles missing cookies gracefully
      vi.mocked(destroySession).mockResolvedValue(undefined);

      // Act
      const request = createRequest();
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Logout successful");
    });
  });

  describe("error handling", () => {
    it("should handle session destruction errors gracefully", async () => {
      // Arrange
      vi.mocked(destroySession).mockRejectedValue(
        new Error("Session destruction failed"),
      );

      // Act
      const request = createRequest();
      const response = await POST(request);
      const data = await response.json();

      // Assert - still returns 200 as logout should not fail
      expect(response.status).toBe(200);
      expect(data.message).toBe("Logout successful");
    });
  });
});
