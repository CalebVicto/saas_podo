import { tokenStorage } from "./storage";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export class AuthenticatedFetch {
  private baseURL: string;
  private onTokenExpired?: () => void;

  constructor(baseURL = "", onTokenExpired?: () => void) {
    this.baseURL = baseURL;
    this.onTokenExpired = onTokenExpired;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = tokenStorage.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;

    // Handle 401 Unauthorized
    if (status === 401) {
      if (this.onTokenExpired) {
        this.onTokenExpired();
      }
      return {
        status,
        error: "Session expired. Please log in again.",
      };
    }

    // Handle other error status codes
    if (!response.ok) {
      let errorMessage = `Request failed with status ${status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      return {
        status,
        error: errorMessage,
      };
    }

    // Handle successful response
    try {
      const data = await response.json();
      return {
        status,
        data,
      };
    } catch {
      // Response might not be JSON (e.g., 204 No Content)
      return {
        status,
        data: null as T,
      };
    }
  }

  async get<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
      ...options,
    });

    return this.handleResponse<T>(response);
  }
}

// Create a default instance
let defaultApiInstance: AuthenticatedFetch | null = null;

export function createAuthenticatedApi(
  baseURL = "",
  onTokenExpired?: () => void,
): AuthenticatedFetch {
  return new AuthenticatedFetch(baseURL, onTokenExpired);
}

export function getDefaultApi(): AuthenticatedFetch {
  if (!defaultApiInstance) {
    throw new Error(
      "Default API instance not initialized. Call initializeApi first.",
    );
  }
  return defaultApiInstance;
}

export function initializeApi(
  baseURL = "",
  onTokenExpired?: () => void,
): AuthenticatedFetch {
  defaultApiInstance = new AuthenticatedFetch(baseURL, onTokenExpired);
  return defaultApiInstance;
}

// Convenience functions using the default instance
export async function apiGet<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  return getDefaultApi().get<T>(endpoint, options);
}

export async function apiPost<T>(
  endpoint: string,
  data?: any,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  return getDefaultApi().post<T>(endpoint, data, options);
}

export async function apiPut<T>(
  endpoint: string,
  data?: any,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  return getDefaultApi().put<T>(endpoint, data, options);
}

export async function apiPatch<T>(
  endpoint: string,
  data?: any,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  return getDefaultApi().patch<T>(endpoint, data, options);
}

export async function apiDelete<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  return getDefaultApi().delete<T>(endpoint, options);
}

// Token validation function
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginSuccess {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

export interface VerifyTokenSuccess {
  valid: boolean;
  data: {
    id: string;
    username: string;
    name: string;
    lastName: string;
    role: string;
    iat: number;
    exp: number;
  };
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<ApiResponse<LoginSuccess>> {
  return apiPost<LoginSuccess>("/auth/login", { username, password });
}

export async function verifyTokenRequest(): Promise<ApiResponse<VerifyTokenSuccess>> {
  return apiGet<VerifyTokenSuccess>("/auth/verify");
}

// Refresh token function
export async function refreshToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
} | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}
