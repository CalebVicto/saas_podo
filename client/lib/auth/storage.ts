import type { User } from "./context";

const STORAGE_KEYS = {
  TOKEN: "podocare_access_token",
  REFRESH_TOKEN: "podocare_refresh_token",
  USER: "podocare_user",
} as const;

class TokenStorage {
  private useSessionStorage: boolean = false;

  constructor(useSessionStorage = false) {
    this.useSessionStorage = useSessionStorage;
  }

  private getStorage(): Storage {
    return this.useSessionStorage ? sessionStorage : localStorage;
  }

  setToken(token: string): void {
    try {
      this.getStorage().setItem(STORAGE_KEYS.TOKEN, token);
    } catch (error) {
      console.error("Failed to store access token:", error);
    }
  }

  getToken(): string | null {
    try {
      return this.getStorage().getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Failed to retrieve access token:", error);
      return null;
    }
  }

  setRefreshToken(refreshToken: string): void {
    try {
      this.getStorage().setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (error) {
      console.error("Failed to store refresh token:", error);
    }
  }

  getRefreshToken(): string | null {
    try {
      return this.getStorage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("Failed to retrieve refresh token:", error);
      return null;
    }
  }

  setUser(user: User): void {
    try {
      this.getStorage().setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error("Failed to store user data:", error);
    }
  }

  getUser(): User | null {
    try {
      const userData = this.getStorage().getItem(STORAGE_KEYS.USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to retrieve user data:", error);
      return null;
    }
  }

  clear(): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(STORAGE_KEYS.TOKEN);
      storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      storage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error("Failed to clear auth storage:", error);
    }
  }

  clearToken(): void {
    try {
      this.getStorage().removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Failed to clear access token:", error);
    }
  }

  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // For JWT tokens, you would decode and check expiration
      // For now, just check if token exists and is not empty
      return token.length > 0;
    } catch (error) {
      console.error("Failed to validate token:", error);
      return false;
    }
  }

  // Switch between localStorage and sessionStorage
  switchToSessionStorage(): void {
    if (!this.useSessionStorage) {
      // Migrate data from localStorage to sessionStorage
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const user = localStorage.getItem(STORAGE_KEYS.USER);

      this.useSessionStorage = true;

      if (token) this.setToken(token);
      if (refreshToken) this.setRefreshToken(refreshToken);
      if (user) this.setUser(JSON.parse(user));

      // Clear from localStorage
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  switchToLocalStorage(): void {
    if (this.useSessionStorage) {
      // Migrate data from sessionStorage to localStorage
      const token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
      const refreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const user = sessionStorage.getItem(STORAGE_KEYS.USER);

      this.useSessionStorage = false;

      if (token) this.setToken(token);
      if (refreshToken) this.setRefreshToken(refreshToken);
      if (user) this.setUser(JSON.parse(user));

      // Clear from sessionStorage
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    }
  }
}

// Export a default instance using localStorage
export const tokenStorage = new TokenStorage(false);

// Export factory function for custom storage type
export const createTokenStorage = (useSessionStorage = false) =>
  new TokenStorage(useSessionStorage);

// Utility functions for backwards compatibility
export const getStoredToken = () => tokenStorage.getToken();
export const setStoredToken = (token: string) => tokenStorage.setToken(token);
export const clearStoredToken = () => tokenStorage.clearToken();
export const getStoredUser = () => tokenStorage.getUser();
export const setStoredUser = (user: User) => tokenStorage.setUser(user);
export const clearAuthStorage = () => tokenStorage.clear();
