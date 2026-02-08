"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/**
 * User data structure from authentication API
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration credentials
 */
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Auth context state and methods
 */
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    credentials: RegisterCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Auth context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Global authentication state management
 *
 * Features:
 * - Fetches current user on mount
 * - Provides login/logout methods
 * - Automatic session validation
 * - Loading states for auth operations
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * ```
 *
 * @example
 * ```tsx
 * // In any component
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = user !== null;

  /**
   * Fetch current user session
   */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setUser(null);
    }
  }, []);

  /**
   * Initial session check on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await fetchCurrentUser();
      setIsLoading(false);
    };

    initAuth();
  }, [fetchCurrentUser]);

  /**
   * Login user with credentials
   *
   * @param credentials - Email and password
   * @returns Success status and optional error message
   */
  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
          return { success: true };
        } else {
          return {
            success: false,
            error: data.error || "Invalid credentials",
          };
        }
      } catch (error) {
        console.error("Login error:", error);
        return {
          success: false,
          error: "An error occurred during login",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear user state, even if API fails
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh user data from API
   * Useful after profile updates or token refresh
   */
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchCurrentUser();
    setIsLoading(false);
  }, [fetchCurrentUser]);

  /**
   * Register new user
   *
   * @param credentials - Name, email, password, and confirmPassword
   * @returns Success status and optional error message
   */
  const register = useCallback(
    async (
      credentials: RegisterCredentials,
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok && data.user) {
          setUser(data.user);
          return { success: true };
        } else {
          return {
            success: false,
            error: data.error || "Registration failed",
          };
        }
      } catch (error) {
        console.error("Registration error:", error);
        return {
          success: false,
          error: "An error occurred during registration",
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook - Access authentication context
 *
 * Must be used within AuthProvider, throws error otherwise
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
