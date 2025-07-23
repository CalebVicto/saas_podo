import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Users,
  Calendar,
  CalendarPlus,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "worker";
}

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  todayIncome: number;
  lowStockAlerts: number;
  weeklyAppointments: number;
  monthlyIncome: number;
  activeWorkers: number;
  completedAppointments: number;
}

interface RecentActivity {
  id: string;
  type: "appointment" | "payment" | "patient";
  description: string;
  time: string;
  amount?: number;
}

// Mock data - in a real app this would come from API
const mockStats: DashboardStats = {
  totalPatients: 247,
  todayAppointments: 12,
  todayIncome: 1580,
  lowStockAlerts: 3,
  weeklyAppointments: 68,
  monthlyIncome: 45200,
  activeWorkers: 5,
  completedAppointments: 8,
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: "1",
    type: "appointment",
    description: "Cita completada con María López",
    time: "10:30 AM",
  },
  {
    id: "2",
    type: "payment",
    description: "Pago recibido - Tratamiento de uñas",
    time: "11:15 AM",
    amount: 120,
  },
  {
    id: "3",
    type: "patient",
    description: "Nuevo paciente registrado: Carlos Mendez",
    time: "12:00 PM",
  },
  {
    id: "4",
    type: "appointment",
    description: "Cita reagendada con Ana García",
    time: "1:45 PM",
  },
];

// useAuth moved to after imports

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color = "primary",
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "primary" | "secondary" | "accent" | "warning" | "destructive";
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-secondary/10 text-secondary border-secondary/20",
    accent: "bg-accent/10 text-accent border-accent/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <Card className="card-modern hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && trendValue && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp
                  className={cn(
                    "w-4 h-4",
                    trend === "up" ? "text-success" : "text-destructive",
                    trend === "down" && "rotate-180",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    trend === "up" ? "text-success" : "text-destructive",
                  )}
                >
                  {trendValue}
                </span>
                <span className="text-sm text-muted-foreground">vs. ayer</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-xl border", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Sidebar component moved to shared component

const useAuth = () => {
  const [user] = useState<User | null>(() => {
    const stored = localStorage.getItem("podocare_user");
    return stored ? JSON.parse(stored) : null;
  });
  return { user };
};

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [recentActivity, setRecentActivity] =
    useState<RecentActivity[]>(mockRecentActivity);

  return (
    <Layout title="Dashboard" subtitle="Resumen de tu clínica podológica">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Pacientes"
            value={stats.totalPatients}
            icon={Users}
            trend="up"
            trendValue="+12%"
            color="primary"
          />
          <StatCard
            title="Citas Hoy"
            value={`${stats.completedAppointments}/${stats.todayAppointments}`}
            icon={Calendar}
            trend="up"
            trendValue="+5%"
            color="secondary"
          />
          <StatCard
            title="Ingresos Hoy"
            value={`S/ ${stats.todayIncome.toLocaleString()}`}
            icon={DollarSign}
            trend="up"
            trendValue="+8%"
            color="accent"
          />
          <StatCard
            title="Stock Bajo"
            value={stats.lowStockAlerts}
            icon={AlertTriangle}
            color="warning"
          />
        </div>

        {/* Additional Stats Row */}
        {user.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Citas Semanales"
              value={stats.weeklyAppointments}
              icon={Clock}
              trend="up"
              trendValue="+15%"
              color="primary"
            />
            <StatCard
              title="Ingresos Mensuales"
              value={`S/ ${stats.monthlyIncome.toLocaleString()}`}
              icon={TrendingUp}
              trend="up"
              trendValue="+22%"
              color="secondary"
            />
            <StatCard
              title="Trabajadores Activos"
              value={stats.activeWorkers}
              icon={Users}
              color="accent"
            />
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        activity.type === "appointment" && "bg-primary",
                        activity.type === "payment" && "bg-secondary",
                        activity.type === "patient" && "bg-accent",
                      )}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                        {activity.amount &&
                          ` • S/ ${activity.amount.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "grid gap-3",
                  user?.role === "admin" ? "grid-cols-2" : "grid-cols-2",
                )}
              >
                <Button
                  onClick={() => navigate("/appointments/new")}
                  className="btn-primary h-20 flex-col gap-2"
                >
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Nueva Cita</span>
                </Button>
                <Button
                  onClick={() => navigate("/patients/new")}
                  variant="outline"
                  className="h-20 flex-col gap-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Nuevo Paciente</span>
                </Button>
                <Button
                  onClick={() => navigate("/sales")}
                  variant="outline"
                  className="h-20 flex-col gap-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <ShoppingBag className="w-6 h-6" />
                  <span className="text-sm">Vender Producto</span>
                </Button>
                {user?.role === "admin" ? (
                  <Button
                    onClick={() => navigate("/reports")}
                    variant="outline"
                    className="h-20 flex-col gap-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span className="text-sm">Ver Reportes</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/appointments/schedule")}
                    variant="outline"
                    className="h-20 flex-col gap-2 border-info text-info hover:bg-info hover:text-info-foreground"
                  >
                    <CalendarPlus className="w-6 h-6" />
                    <span className="text-sm">Programar Cita</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
