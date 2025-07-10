import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import NotFound from "./pages/NotFound";

// Placeholder components for future implementation

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Main Application Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/new" element={<CreateAppointment />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/abonos" element={<Abonos />} />
          <Route path="/products" element={<Products />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/kardex" element={<Kardex />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/worker-types" element={<WorkerTypes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/settings" element={<Settings />} />

          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
