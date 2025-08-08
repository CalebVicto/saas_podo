import React, { createContext, useContext, useEffect, useState } from "react";
import { tokenStorage } from "./storage";
import { loginRequest, verifyTokenRequest } from "./api";

export type Role = "admin" | "worker";

export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: Role;
  name: string;
  email?: string;
  tenantId: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  verifyToken: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  isAdmin: () => boolean;
  isTrabajador: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    initializeAuth();
  }, []);

  const mapRole = (role: string): Role =>
    role === "trabajador" ? "worker" : (role as Role);

  const verifyToken = async () => {
    try {
      const { data } = await verifyTokenRequest();
      if (data?.valid) {
        const d = data.data;
        const mapped: User = {
          id: d.id,
          username: d.username,
          firstName: d.name,
          lastName: d.lastName,
          role: mapRole(d.role),
          name: `${d.name} ${d.lastName}`,
          email: d.username,
          tenantId: d.tenantId,
        };
        setUser(mapped);
        tokenStorage.setUser(mapped);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Failed to verify token:", err);
      logout();
    }
  };

  const initializeAuth = async () => {
    const storedToken = tokenStorage.getToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    await verifyToken();
    setIsLoading(false);
  };

  const login = async (username: string, password: string): Promise<User> => {
    const response = await loginRequest(username, password);
    if (response.error || !response.data) {
      throw new Error(response.error || "Login failed");
    }
    const { token: accessToken, user: u } = response.data;
    const mapped: User = {
      id: u.id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      role: mapRole(u.role),
      name: `${u.firstName} ${u.lastName}`,
      email: u.username,
      tenantId:u.tenantId
    };
    tokenStorage.setToken(accessToken);
    tokenStorage.setUser(mapped);
    localStorage.setItem("podocare_view_mode", mapped.role);
    setToken(accessToken);
    setUser(mapped);
    return mapped;
  };

  const logout = () => {
    tokenStorage.clear();
    localStorage.removeItem("podocare_view_mode");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const refreshAuth = async () => {
    await verifyToken();
  };

  const isAdmin = () => user?.role === "admin";
  const isTrabajador = () =>
    user?.role === "worker";

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    verifyToken,
    refreshAuth,
    isAdmin,
    isTrabajador,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
