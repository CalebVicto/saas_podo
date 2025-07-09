import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Activity, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-secondary-light flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-secondary rounded-full blur-2xl opacity-20"></div>
          <div className="relative bg-white p-6 rounded-3xl shadow-2xl">
            <Activity className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-4">
          Página no encontrada
        </h2>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver atrás
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="btn-primary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
