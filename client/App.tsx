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
const handleTokenExpired = () => {
  // This will be handled by the AuthProvider
  window.location.href = "/login";
};

initializeApi("", handleTokenExpired);

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
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/new" element={<CreateAppointment />} />
              <Route
                path="/appointments/schedule"
                element={<ScheduleAppointment />}
              />
              <Route path="/payments" element={<Payments />} />
              <Route path="/abonos" element={<Abonos />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/packages" element={<Packages />} />
              <Route path="/kardex" element={<Kardex />} />
              <Route path="/workers" element={<Workers />} />
              <Route path="/workers/:id" element={<WorkerDetail />} />
              <Route path="/worker-types" element={<WorkerTypes />} />
              <Route path="/user-accounts" element={<UserAccounts />} />
              <Route path="/service-packages" element={<ServicePackages />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/settings" element={<Settings />} />
              <Route
                path="/repository-example"
                element={<ExampleRepositoryUsage />}
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
