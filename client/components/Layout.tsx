import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("podocare_sidebar_collapsed");
    return stored ? JSON.parse(stored) : false;
  });
  const [viewMode, setViewMode] = useState<"admin" | "worker">(
    user?.role || "worker",
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setViewMode(user.role);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    // Navigation will be handled automatically by the logout function
  };

  const handleSwitchView = () => {
    if (user?.role === "admin") {
      setViewMode(viewMode === "admin" ? "worker" : "admin");
    }
  };

  const handleToggleCollapse = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem(
      "podocare_sidebar_collapsed",
      JSON.stringify(newCollapsed),
    );
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="h-screen bg-background flex overflow-hidden m-0 p-0">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
        viewMode={viewMode}
        onSwitchView={user.role === "admin" ? handleSwitchView : undefined}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className={`bg-card border-b border-border p-4 lg:p-6 flex-shrink-0 shadow-sm relative ${
            viewMode === "admin"
              ? "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-blue-600"
              : "before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-green-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden hover:bg-accent transition-colors"
                title="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Desktop Collapse Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className="hidden lg:flex hover:bg-accent transition-colors"
                title={
                  sidebarCollapsed ? "Expandir sidebar" : "Contraer sidebar"
                }
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </Button>
              {title && (
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.role === "admin" ? "Administrador" : "Trabajador"}
                  {viewMode !== user.role && (
                    <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 rounded">
                      Vista {viewMode === "admin" ? "Admin" : "Trabajador"}
                    </span>
                  )}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">
                  {user.name.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
