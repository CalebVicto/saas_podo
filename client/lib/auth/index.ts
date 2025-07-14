// Auth context and provider
export { AuthProvider, useAuth } from "./context";
export type { User, LoginResponse, AuthContextType } from "./context";

// Token storage utilities
export { tokenStorage, createTokenStorage } from "./storage";
export {
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  getStoredUser,
  setStoredUser,
  clearAuthStorage,
} from "./storage";

// API utilities
export {
  AuthenticatedFetch,
  createAuthenticatedApi,
  getDefaultApi,
  initializeApi,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  validateToken,
  refreshToken,
} from "./api";
export type { ApiResponse } from "./api";

// Protected route component
export { ProtectedRoute } from "./ProtectedRoute";
