"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  ReactNode,
  useCallback,
} from "react";
import { client } from "@/lib/api/client.gen";
import { logout as logoutUtil } from "@/lib/utils/auth";
import { getCurrentUserInfoAuthMeGet } from "@/lib/api/sdk.gen";
import { getApiBaseUrl } from "@/lib/constants";

interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    logoutUtil();
    setUser(null);
    client.setConfig({
      baseUrl: getApiBaseUrl(),
      credentials: "include",
    });

    // Clear browser history and redirect to home
    if (typeof window !== "undefined") {
      // Replace current history entry so back button doesn't work
      window.history.replaceState(null, "", "/");
      // Push a new state to prevent going back
      window.history.pushState(null, "", "/");

      // Prevent back button navigation
      const preventBack = () => {
        window.history.pushState(null, "", "/");
      };

      window.addEventListener("popstate", preventBack);

      // Clean up after 1 second (user should be on home page by then)
      setTimeout(() => {
        window.removeEventListener("popstate", preventBack);
      }, 1000);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await getCurrentUserInfoAuthMeGet();

      if (response?.response?.ok && response.data) {
        setUser(response.data as User);
      } else if (response?.response?.status === 401) {
        console.log("Unauthorized - redirecting to login");
        setUser(null);
        // If we're on a dashboard page and get 401, redirect to home
        if (
          typeof window !== "undefined" &&
          window.location.pathname.startsWith("/dashboard")
        ) {
          window.location.href = "/";
        }
      } else if (response?.response?.status === 403) {
        // Account deactivated or blocked
        console.log("Account blocked or deactivated");
        setUser(null);
        logout();
        if (typeof window !== "undefined") {
          window.location.href = "/blocked?reason=account_deactivated";
        }
      } else {
        console.error(
          "Failed to fetch user, status:",
          response?.response?.status,
        );
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
      // If we're on a dashboard page and get an error, redirect to home
      if (
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/dashboard")
      ) {
        window.location.href = "/";
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Run before child useEffects so SDK calls (monitors, etc.) use /api/v1 on Vercel.
  useLayoutEffect(() => {
    client.setConfig({
      baseUrl: getApiBaseUrl(),
      credentials: "include",
    });
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${getApiBaseUrl()}/auth/login/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      credentials: "include", // Receive httpOnly cookie
    });

    if (!response.ok) {
      const error = await response.json();

      // Handle blocked/deactivated accounts
      if (response.status === 403) {
        if (typeof window !== "undefined") {
          window.location.href = "/blocked?reason=account_deactivated";
        }
        throw new Error("Account blocked or deactivated");
      }

      throw new Error(error.detail || "Login failed");
    }

    // Cookie is automatically set by backend
    await fetchCurrentUser();
  };

  const register = async (email: string, password: string) => {
    const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();

      // Handle blocked emails
      if (response.status === 403) {
        throw new Error("This email address is not allowed to register");
      }

      throw new Error(error.detail || "Registration failed");
    }

    return response.json();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
