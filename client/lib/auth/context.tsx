import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenStorage } from "./storage";
import { validateToken } from "./api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "worker";
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedToken = tokenStorage.getToken();
      const storedUser = tokenStorage.getUser();

      if (storedToken && storedUser) {
        // Validate token with the server
        const isValid = await validateToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          setUser(storedUser);
        } else {
          // Token is invalid, clear storage
          tokenStorage.clear();
        }
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      tokenStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      // Mock login for demo - replace with real API call
      const response = await mockLogin(email, password);

      if (!response) {
        throw new Error("Invalid credentials");
      }

      const { user, accessToken, refreshToken } = response;

      // Store tokens and user data
      tokenStorage.setToken(accessToken);
      tokenStorage.setUser(user);
      if (refreshToken) {
        tokenStorage.setRefreshToken(refreshToken);
      }

      setToken(accessToken);
      setUser(user);

      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
    // Redirect to login page
    window.location.href = "/login";
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // In a real app, call your refresh token endpoint
      // const response = await refreshTokenAPI(refreshToken);
      // For now, just re-validate the current token
      const currentToken = tokenStorage.getToken();
      if (currentToken) {
        const isValid = await validateToken(currentToken);
        if (!isValid) {
          logout();
        }
      }
    } catch (error) {
      console.error("Failed to refresh auth:", error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Mock login function - replace with real API call
const mockLogin = async (
  email: string,
  password: string,
): Promise<LoginResponse | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock users for demo
  const users = [
    {
      id: "1",
      email: "admin@podocare.com",
      password: "admin123",
      name: "Dr. María González",
      role: "admin" as const,
    },
    {
      id: "2",
      email: "worker@podocare.com",
      password: "worker123",
      name: "Carlos Rodríguez",
      role: "worker" as const,
    },
  ];

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return null;
  }

  // Generate mock JWT token (in production, this comes from your server)
  const accessToken = `mock_jwt_token_${user.id}_${Date.now()}`;
  const refreshToken = `mock_refresh_token_${user.id}_${Date.now()}`;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};
