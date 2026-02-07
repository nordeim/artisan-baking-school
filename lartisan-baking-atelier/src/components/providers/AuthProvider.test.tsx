import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthProvider";

// Mock fetch
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

// Test component that uses auth
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } =
    useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "not-loading"}</div>
      <div data-testid="authenticated">
        {isAuthenticated ? "authenticated" : "not-authenticated"}
      </div>
      <div data-testid="user">{user ? user.email : "no-user"}</div>
      <button
        data-testid="login-btn"
        onClick={() => login({ email: "test@test.com", password: "password" })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="refresh-btn" onClick={refreshUser}>
        Refresh
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with null user", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null }), { status: 200 }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });
    });

    it("should initialize with loading state", () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve(new Response(JSON.stringify({ user: null }))),
              100,
            ),
          ),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId("loading")).toHaveTextContent("loading");
    });

    it("should fetch current user on mount", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com",
        );
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/auth/me");
    });

    it("should set isAuthenticated when user exists", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "authenticated",
        );
      });
    });

    it("should set isAuthenticated to false when no user", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null }), { status: 200 }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "not-authenticated",
        );
      });
    });
  });

  describe("session validation", () => {
    it("should handle session validation failure", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "not-authenticated",
      );
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "not-authenticated",
      );
    });

    it("should handle malformed responses", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("invalid json", { status: 200 }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });
    });
  });

  describe("login", () => {
    it("should update user state after successful login", async () => {
      // Initial mount - no user
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null }), { status: 200 }),
      );

      // Login request
      const mockUser = {
        id: "user-123",
        email: "test@test.com",
        name: "Test User",
        role: "STUDENT",
      };

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user: mockUser,
            message: "Login successful",
          }),
          { status: 200 },
        ),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });

      // Click login
      await act(async () => {
        screen.getByTestId("login-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("test@test.com");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "authenticated",
      );
    });

    it("should not update user state on failed login", async () => {
      // Initial mount
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null }), { status: 200 }),
      );

      // Failed login
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: "Invalid credentials",
          }),
          { status: 401 },
        ),
      );

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });

      await act(async () => {
        screen.getByTestId("login-btn").click();
      });

      // User should still be null
      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });
    });
  });

  describe("logout", () => {
    it("should clear user state after logout", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
      };

      // Initial mount with user
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      // Logout request
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Logged out" }), {
          status: 200,
        }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Wait for user to be set
      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com",
        );
      });

      // Click logout
      await act(async () => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "not-authenticated",
      );
    });

    it("should handle logout errors gracefully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
      };

      // Initial mount with user
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      // Failed logout
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com",
        );
      });

      // Should still clear user locally even if API fails
      await act(async () => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });
    });
  });

  describe("refreshUser", () => {
    it("should refresh user data", async () => {
      // Initial mount
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: null }), { status: 200 }),
      );

      // Refresh request returns user
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
      };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
      });

      // Click refresh
      await act(async () => {
        screen.getByTestId("refresh-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com",
        );
      });
    });

    it("should clear user on refresh failure", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "STUDENT",
      };

      // Initial mount with user
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ user: mockUser }), { status: 200 }),
      );

      // Refresh fails
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent(
          "test@example.com",
        );
      });

      await act(async () => {
        screen.getByTestId("refresh-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      });
    });
  });

  describe("useAuth hook", () => {
    it("should throw when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      function ComponentWithoutProvider() {
        useAuth();
        return <div>Component</div>;
      }

      expect(() => render(<ComponentWithoutProvider />)).toThrow(
        "useAuth must be used within an AuthProvider",
      );

      consoleSpy.mockRestore();
    });
  });
});
