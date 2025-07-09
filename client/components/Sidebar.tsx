import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Activity,
  Users,
  Calendar,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
  Bell,
  UserCheck,
  Package,
  BarChart,
  Plus,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  role: "admin" | "worker";
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
  viewMode?: "admin" | "worker";
  onSwitchView?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  user,
  onLogout,
  viewMode = user.role,
  onSwitchView,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Admin sees only maintenance/configuration modules
  const adminMenuItems = [
    { icon: Activity, label: "Dashboard", path: "/dashboard" },
    { icon: ShoppingBag, label: "Productos", path: "/products" },
    { icon: BarChart, label: "Kardex", path: "/kardex" },
    { icon: Package, label: "Paquetes", path: "/packages" },
    { icon: Users, label: "Trabajadores", path: "/workers" },
    { icon: UserCheck, label: "Tipos de Trabajador", path: "/worker-types" },
    { icon: TrendingUp, label: "Reportes", path: "/reports" },
    { icon: Settings, label: "Configuración", path: "/settings" },
  ];

  // Worker sees appointments, patients, treatments
  const workerMenuItems = [
    { icon: Activity, label: "Dashboard", path: "/dashboard" },
    { icon: Users, label: "Pacientes", path: "/patients" },
    { icon: Calendar, label: "Citas", path: "/appointments" },
    { icon: DollarSign, label: "Pagos", path: "/payments" },
    { icon: ShoppingCart, label: "Ventas / POS", path: "/sales" },
  ];

  const menuItems = viewMode === "admin" ? adminMenuItems : workerMenuItems;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen w-80 bg-sidebar border-r border-sidebar-border z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto lg:h-screen",
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sidebar-primary rounded-lg">
                <Activity className="w-6 h-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">
                  Podo<span className="text-sidebar-primary">Care</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema Podológico
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-semibold">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sidebar-foreground truncate">
                  {user.name}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.role === "admin" ? "Administrador" : "Trabajador"}
                  {viewMode !== user.role && (
                    <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 rounded">
                      Vista {viewMode === "admin" ? "Admin" : "Trabajador"}
                    </span>
                  )}
                </p>
              </div>
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Switch View Button (Admin Only) */}
            {user.role === "admin" && onSwitchView && (
              <div className="mt-3">
                <button
                  onClick={onSwitchView}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    Cambiar a Vista{" "}
                    {viewMode === "admin" ? "Trabajador" : "Admin"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Create Appointment Button (Worker Only) */}
          {viewMode === "worker" && (
            <div className="p-4">
              <Button
                onClick={() => handleNavigation("/appointments/new")}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                size="lg"
              >
                <CalendarPlus className="w-5 h-5 mr-2" />
                <span className="font-semibold">Nueva Cita</span>
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={cn("sidebar-item w-full", isActive && "active")}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={onLogout}
              className="sidebar-item w-full text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
