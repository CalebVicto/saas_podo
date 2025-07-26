import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Activity, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface LoginFormData {
  username: string;
  password: string;
}

export function Login() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(formData.username, formData.password);
      // Navigation will be handled automatically by the redirect above
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Credenciales inválidas. Por favor, verifica tu usuario y contraseña.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(""); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-secondary-light flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Brand Section */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-8">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-20"></div>
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl">
              <Activity className="w-20 h-20 text-primary mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Podo<span className="text-primary">Care</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Sistema de Gestión Podológica
              </p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-3xl font-bold text-foreground">
              Gestiona tu clínica con tecnología moderna
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Optimiza tus consultas, gestiona pacientes y aumenta la eficiencia
              de tu práctica podológica.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Gestión de Pacientes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Historiales completos y seguimiento
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Seguridad Avanzada
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Datos protegidos y respaldados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="card-modern p-8 lg:p-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4 lg:hidden">
                <Activity className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Iniciar Sesión
              </h2>
              <p className="text-muted-foreground">
                Accede a tu cuenta de PodoCare
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-foreground"
                >
                  Usuario
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="usuario"
                  required
                  className={cn(
                    "input-modern",
                    error && "border-destructive focus:border-destructive",
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className={cn(
                      "input-modern pr-12",
                      error && "border-destructive focus:border-destructive",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary h-12 text-base font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Usar Credenciales de Demo:
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      username: "cizquierdo",
                      password: "Test1234",
                    });
                    setError("");
                  }}
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  <span className="font-semibold">Administrador</span>
                  <span className="text-xs text-muted-foreground">
                    Acceso completo
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      username: "vizquierdo",
                      password: "Test1234",
                    });
                    setError("");
                  }}
                  className="flex flex-col gap-1 h-auto py-3"
                >
                  <span className="font-semibold">Trabajador</span>
                  <span className="text-xs text-muted-foreground">
                    Acceso limitado
                  </span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Haz clic para llenar automáticamente las credenciales
              </p>
            </div>

            {/* Branding */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                by <span className="font-semibold text-primary">Unify Tec</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
