import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RepositoryProvider, RepositoryDebugPanel } from "@/lib/repositories";
import { AuthProvider, ProtectedRoute, initializeApi } from "@/lib/auth";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Payments from "./pages/Payments";
import Workers from "./pages/Workers";
import WorkerTypes from "./pages/WorkerTypes";
import Products from "./pages/Products";
import Packages from "./pages/Packages";
import Kardex from "./pages/Kardex";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Sales from "./pages/Sales";
import CreateAppointment from "./pages/CreateAppointment";
import ScheduleAppointment from "./pages/ScheduleAppointment";
import Abonos from "./pages/Abonos";
import PatientDetail from "./pages/PatientDetail";
import CreatePatient from "./pages/CreatePatient";
import ProductDetail from "./pages/ProductDetail";
import WorkerDetail from "./pages/WorkerDetail";
import Categories from "./pages/Categories";
import UserAccounts from "./pages/UserAccounts";
import ServicePackages from "./pages/ServicePackages";
import NotFound from "./pages/NotFound";
import ExampleRepositoryUsage from "./pages/ExampleRepositoryUsage";

// Placeholder components for future implementation

const queryClient = new QueryClient();

// Initialize the authenticated API with token expiration handler
// This will be called automatically on 401 responses
const handleTokenExpired = () => {
  // Clear auth storage and redirect to login
  const { tokenStorage } = require("@/lib/auth");
  tokenStorage.clear();
  window.location.href = "/login";
};

initializeApi("http://localhost:3000/api", handleTokenExpired);

const App = () => (
  <AuthProvider>
    <RepositoryProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to dashboard if authenticated, otherwise to login */}
              <Route
                path="/"
                element={
                  <ProtectedRoute fallbackPath="/login">
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />

              {/* Main Application Routes - All Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients"
                element={
                  <ProtectedRoute>
                    <Patients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/new"
                element={
                  <ProtectedRoute>
                    <CreatePatient />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patients/:id"
                element={
                  <ProtectedRoute>
                    <PatientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments/new"
                element={
                  <ProtectedRoute>
                    <CreateAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments/schedule"
                element={
                  <ProtectedRoute>
                    <ScheduleAppointment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/abonos"
                element={
                  <ProtectedRoute>
                    <Abonos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <ProtectedRoute>
                    <Categories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/packages"
                element={
                  <ProtectedRoute>
                    <Packages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kardex"
                element={
                  <ProtectedRoute>
                    <Kardex />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workers"
                element={
                  <ProtectedRoute>
                    <Workers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workers/:id"
                element={
                  <ProtectedRoute>
                    <WorkerDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker-types"
                element={
                  <ProtectedRoute>
                    <WorkerTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-accounts"
                element={
                  <ProtectedRoute requireRole="admin">
                    <UserAccounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-packages"
                element={
                  <ProtectedRoute>
                    <ServicePackages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/repository-example"
                element={
                  <ProtectedRoute>
                    <ExampleRepositoryUsage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <RepositoryDebugPanel />
        </TooltipProvider>
      </QueryClientProvider>
    </RepositoryProvider>
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
