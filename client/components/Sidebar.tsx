import React, { useState } from "react";
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
  Wallet,
  ChevronLeft,
  ChevronRight,
  Menu,
  Tag,
  FolderOpen,
  UserSquare,
  Briefcase,
  FileText,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface MenuSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
  }[];
}

export function Sidebar({
  isOpen,
  onClose,
  user,
  onLogout,
  viewMode = user.role,
  onSwitchView,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  // Admin menu organized by sections
  const adminSections: MenuSection[] = [
    {
      id: "overview",
      title: "Vista General",
      icon: Activity,
      items: [{ icon: Activity, label: "Dashboard", path: "/dashboard" }],
    },
    {
      id: "products",
      title: "Productos e Inventario",
      icon: Package,
      items: [
        { icon: ShoppingBag, label: "Productos", path: "/products" },
        { icon: Tag, label: "Categorías", path: "/categories" },
        { icon: BarChart, label: "Kardex", path: "/kardex" },
        { icon: FolderOpen, label: "Paquetes", path: "/packages" },
      ],
    },
    {
      id: "users",
      title: "Usuarios y Personal",
      icon: Users,
      items: [
        { icon: Users, label: "Trabajadores", path: "/workers" },
        {
          icon: UserSquare,
          label: "Tipos de Trabajador",
          path: "/worker-types",
        },
        {
          icon: UserCheck,
          label: "Cuentas de Usuario",
          path: "/user-accounts",
        },
      ],
    },
    {
      id: "services",
      title: "Servicios",
      icon: Calendar,
      items: [
        { icon: Calendar, label: "Citas", path: "/appointments" },
        {
          icon: Briefcase,
          label: "Paquetes y Sesiones",
          path: "/service-packages",
        },
      ],
    },
    {
      id: "reports",
      title: "Reportes y Configuración",
      icon: FileText,
      items: [
        { icon: TrendingUp, label: "Reportes Financieros", path: "/reports" },
        { icon: Settings, label: "Configuración", path: "/settings" },
      ],
    },
  ];

  // Worker menu organized by sections
  const workerSections: MenuSection[] = [
    {
      id: "overview",
      title: "Vista General",
      icon: Activity,
      items: [{ icon: Activity, label: "Dashboard", path: "/dashboard" }],
    },
    {
      id: "patients",
      title: "Pacientes y Citas",
      icon: Users,
      items: [
        { icon: Users, label: "Pacientes", path: "/patients" },
        { icon: Calendar, label: "Citas", path: "/appointments" },
        {
          icon: CalendarPlus,
          label: "Programar Cita",
          path: "/appointments/schedule",
        },
      ],
    },
    {
      id: "sales",
      title: "Ventas y Pagos",
      icon: CreditCard,
      items: [
        { icon: ShoppingCart, label: "Ventas / POS", path: "/pos" },
        { icon: DollarSign, label: "Pagos", path: "/payments" },
        { icon: Wallet, label: "Abonos", path: "/abonos" },
      ],
    },
  ];

  const sections = viewMode === "admin" ? adminSections : workerSections;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); // Close sidebar on mobile after navigation
  };

  const isPathActive = (path: string) => location.pathname === path;

  const getSectionActiveState = (section: MenuSection) => {
    return section.items.some((item) => isPathActive(item.path));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 transform transition-all duration-300 ease-in-out shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto lg:h-screen lg:flex-shrink-0",
          isCollapsed ? "lg:w-20" : "lg:w-80",
          "w-80", // Always full width on mobile
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with Toggle */}
          <div
            className={cn(
              "border-b border-sidebar-border flex items-center",
              isCollapsed ? "p-4 justify-center" : "p-6",
            )}
          >
            {!isCollapsed && (
              <div className="flex items-center gap-3 flex-1">
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
            )}

            {/* Desktop Toggle Button */}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className={cn(
                  "hidden lg:flex text-muted-foreground hover:text-foreground transition-colors",
                  isCollapsed && "w-10 h-10 p-0",
                )}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </Button>
            )}

            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden text-muted-foreground"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          {!isCollapsed && (
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
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.role === "admin" ? "Admin" : "Trabajador"}
                    </Badge>
                    {viewMode !== user.role && (
                      <Badge variant="outline" className="text-xs">
                        Vista {viewMode === "admin" ? "Admin" : "Trabajador"}
                      </Badge>
                    )}
                  </div>
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
          )}

          {/* Collapsed User Avatar */}
          {isCollapsed && (
            <div className="p-4 border-b border-sidebar-border flex justify-center">
              <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-semibold">
                  {user.name.charAt(0)}
                </span>
              </div>
            </div>
          )}

          {/* Create Appointment Button (Worker Only) */}
          {viewMode === "worker" && (
            <div className={cn("p-4", isCollapsed && "px-2")}>
              <Button
                onClick={() => handleNavigation("/appointments/new")}
                className={cn(
                  "bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]",
                  isCollapsed ? "w-12 h-12 p-0 ml-2" : "w-full",
                )}
                size={isCollapsed ? "sm" : "lg"}
              >
                <CalendarPlus
                  className={cn("w-5 h-5", !isCollapsed && "mr-2")}
                />
                {!isCollapsed && (
                  <span className="font-semibold">Nueva Cita</span>
                )}
              </Button>
            </div>
          )}

          {/* Navigation Sections */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin">
            <div className={cn("space-y-1", isCollapsed ? "p-2" : "p-4")}>
              {sections.map((section) => {
                const isSectionActive = getSectionActiveState(section);
                const SectionIcon = section.icon;

                return (
                  <div
                    key={section.id}
                    className="relative"
                    onMouseEnter={() => setHoveredSection(section.id)}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    {/* Section Header */}
                    {!isCollapsed && (
                      <div className="flex items-center gap-2 px-3 py-2 mb-2 mt-4 first:mt-0">
                        <SectionIcon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                          {section.title}
                        </span>
                        <div className="flex-1 h-px bg-border ml-2"></div>
                      </div>
                    )}

                    {/* Section Items */}
                    <div className={cn("space-y-1", isCollapsed && "mb-4")}>
                      {section.items.map((item) => {
                        const isActive = isPathActive(item.path);
                        const ItemIcon = item.icon;

                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            className={cn(
                              "group w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-[1.02]",
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                              isCollapsed && "justify-center px-2",
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <ItemIcon
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isActive && "text-sidebar-primary-foreground",
                              )}
                            />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                            {isActive && !isCollapsed && (
                              <div className="ml-auto w-2 h-2 bg-sidebar-primary-foreground rounded-full"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Collapsed Tooltip */}
                    {isCollapsed && hoveredSection === section.id && (
                      <div className="absolute left-full top-0 ml-2 z-50 bg-popover border border-border rounded-lg shadow-lg p-3 min-w-48">
                        <div className="flex items-center gap-2 mb-2">
                          <SectionIcon className="w-4 h-4 text-primary" />
                          <span className="font-medium text-popover-foreground">
                            {section.title}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = isPathActive(item.path);
                            return (
                              <div
                                key={item.path}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1 rounded text-sm",
                                  isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-popover-foreground",
                                )}
                              >
                                <ItemIcon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div
            className={cn(
              "border-t border-sidebar-border",
              isCollapsed ? "p-2" : "p-4",
            )}
          >
            <button
              onClick={onLogout}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.02]",
                isCollapsed && "justify-center px-2",
              )}
              title={isCollapsed ? "Cerrar Sesión" : undefined}
            >
              <LogOut className="w-5 h-5" />
              {!isCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
