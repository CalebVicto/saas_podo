import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: "admin" | "worker";
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requireRole,
  fallbackPath = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requireRole && user?.role !== requireRole) {
    // If user doesn't have required role, redirect to dashboard or show unauthorized
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Acceso No Autorizado
          </h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a esta página.
          </p>
          <button onClick={() => window.history.back()} className="btn-primary">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
