import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Edit,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Package,
  Activity,
  BarChart,
  Wallet,
  Smartphone,
  CreditCard,
  ArrowUpDown,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Appointment, Payment } from "@shared/api";
import { apiGet, apiPut } from "@/lib/auth";
import Layout from "@/components/Layout";

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: "admin" | "trabajador";
  tenantId: string;
  active: boolean;
  newPassword: boolean;
  createdAt: string;
  updatedAt: string;
  email?: string;
  phone?: string;
  specialization?: string;
  workerType?: string;
  hasSystemAccess?: boolean;
}

interface ApiResponse<T> {
  state: string;
  message: string;
  data: T;
}

interface WorkerStats {
  totalAppointments: number;
  revenueGenerated: number;
  commissionFromMedications: number;
  packagesAttended: number;
  averageRating: number;
  completionRate: number;
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    count: number;
    percentage?: number; // calculado en front
  }[];
  monthlyPerformance: {
    month: string;
    appointments: number;
    revenue: number;
    bonus: number;
  }[];
  averageAppointmentDuration: number; // min
  uniquePatients: number;
  repeatAppointments: number;
  totalWorkDays: number;
}

export function WorkerDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("6"); // months (string en UI)

  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    role: "trabajador" as "admin" | "trabajador",
    active: true,
  });

  useEffect(() => {
    if (id) {
      loadWorkerData(id, selectedPeriod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedPeriod]);

  const loadWorkerData = async (workerId: string, months = "6") => {
    setIsLoading(true);
    try {
      const [workerResp, appointmentsResp, paymentsResp, statsResp] =
        await Promise.all([
          apiGet<ApiResponse<Worker>>(`/worker/${workerId}`),
          apiGet<ApiResponse<Appointment[]>>(`/worker/${workerId}/appointments`),
          apiGet<ApiResponse<Payment[]>>(`/worker/${workerId}/payments`),
          apiGet<ApiResponse<WorkerStats>>(
            `/worker/${workerId}/stats?months=${Number(months)}`
          ),
        ]);

      if ((workerResp as any).error || !workerResp.data) {
        navigate("/workers");
        return;
      }

      setWorker(workerResp.data.data);

      if (!(appointmentsResp as any).error && appointmentsResp.data) {
        setAppointments(appointmentsResp.data.data || []);
      }

      if (!(paymentsResp as any).error && paymentsResp.data) {
        setPayments(paymentsResp.data.data || []);
      }

      if (!(statsResp as any).error && statsResp.data) {
        const statsData = statsResp.data.data;
        const totalMethodAmount = (statsData.paymentMethodBreakdown || []).reduce(
          (sum, m) => sum + (m?.amount || 0),
          0
        );
        const paymentMethodBreakdown = (statsData.paymentMethodBreakdown || []).map((m) => ({
          ...m,
          percentage: totalMethodAmount > 0 ? (Number(m?.amount || 0) / totalMethodAmount) * 100 : 0,
        }));
        setStats({ ...statsData, paymentMethodBreakdown });
      }
    } catch (error) {
      console.error("Error loading worker data:", error);
      navigate("/workers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (!worker) return;
    setFormData({
      firstName: worker.firstName || "",
      lastName: worker.lastName || "",
      username: worker.username || "",
      password: "",
      role: worker.role,
      active: worker.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditWorker = async () => {
    if (!worker) return;
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        role: formData.role,
        active: formData.active,
      };
      if (formData.password) payload.password = formData.password;

      const resp = await apiPut(`/user/${worker.id}`, payload);
      if (!(resp as any).error) {
        setWorker({
          ...worker,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          role: formData.role,
          active: formData.active,
          updatedAt: new Date().toISOString(),
        });
        setIsEditDialogOpen(false);
        toast({ title: "Trabajador actualizado correctamente" });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo actualizar", description: "Intenta de nuevo." });
    }
  };

  const toggleStatus = async () => {
    if (!worker) return;
    try {
      const resp = await apiPut(`/user/${worker.id}`, { active: !worker.active });
      if (!(resp as any).error) {
        setWorker({ ...worker, active: !worker.active });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "No se pudo cambiar el estado" });
    }
  };

  const getRecentAppointments = () => {
    return [...appointments]
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .slice(0, 10);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "scheduled":
        return "text-blue-600 bg-blue-100";
      case "cancelled":
        return "text-red-600 bg-red-100";
      case "no_show":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "scheduled":
        return "Programada";
      case "cancelled":
        return "Cancelada";
      case "no_show":
        return "No Asistió";
      default:
        return status;
    }
  };

  const getPaymentMethodConfig = () => {
    return {
      cash: {
        label: "💵 Efectivo",
        icon: Wallet,
        color: "text-green-600",
        bgColor: "bg-green-50",
        iconBg: "bg-green-100",
      },
      yape: {
        label: "📱 Yape",
        icon: Smartphone,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        iconBg: "bg-purple-100",
      },
      plin: {
        label: "📲 Plin",
        icon: Smartphone,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        iconBg: "bg-blue-100",
      },
      card: {
        label: "💳 Tarjeta",
        icon: CreditCard,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        iconBg: "bg-indigo-100",
      },
      transfer: {
        label: "🏦 Transferencia",
        icon: ArrowUpDown,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        iconBg: "bg-orange-100",
      },
      other: {
        label: "Otros",
        icon: PlusCircle,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        iconBg: "bg-gray-100",
      },
    };
  };

  const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString() : "—");
  const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);

  if (isLoading) {
    return (
      <Layout title="Detalle del Trabajador" subtitle="Información completa del trabajador">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="loading-shimmer h-16 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!worker || !stats) {
    return (
      <Layout title="Trabajador no encontrado" subtitle="El trabajador solicitado no existe">
        <div className="p-6">
          <Card className="card-modern">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Trabajador no encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                El trabajador que buscas no existe o ha sido eliminado.
              </p>
              <Button onClick={() => navigate("/workers")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Trabajadores
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${worker.firstName} ${worker.lastName}`} subtitle="Perfil completo del trabajador">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/workers")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Trabajadores
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={toggleStatus}
              className={cn(
                "flex items-center gap-2",
                worker.active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"
              )}
            >
              {worker.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              {worker.active ? "Desactivar" : "Activar"}
            </Button>
            <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Worker Overview */}
        <div className="grid grid-cols-1 gap-4">
          {/* Worker Info */}
          <div className="lg:col-span-2">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {worker.firstName?.charAt(0)}
                      {worker.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {worker.firstName} {worker.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {worker.specialization || "Trabajador"}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Correo Electrónico</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{worker.email || "No especificado"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Teléfono</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{worker.phone || "No especificado"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Rol</Label>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">
                        {worker.role === "admin" ? "Administrador" : "Trabajador"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Estado</Label> <br />
                    <Badge variant={worker.active ? "default" : "secondary"} className="text-xs">
                      {worker.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha de Registro</Label>
                    <p>{fmt(worker.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Última Actualización</Label>
                    <p>{fmt(worker.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Citas</p>
                    <p className="text-2xl font-bold">{Number(stats.totalAppointments || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos Generados</p>
                    <p className="text-2xl font-bold">
                      S/ {Number(stats.revenueGenerated || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comisiones por Medicamentos</p>
                    <p className="text-2xl font-bold">
                      S/ {Number(stats.commissionFromMedications || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paquetes Atendidos</p>
                    <p className="text-2xl font-bold">{Number(stats.packagesAttended || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tasa de Finalización</p>
                    <p className="text-2xl font-bold">
                      {Number(stats.completionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        {stats.paymentMethodBreakdown?.length > 0 && (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Ingresos por Método de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {stats.paymentMethodBreakdown.map((method, i) => {
                  const cfgMap = getPaymentMethodConfig();
                  const config =
                    cfgMap[method.method as keyof typeof cfgMap] || cfgMap.other;
                  const IconComponent = config.icon;
                  return (
                    <div
                      key={method.method || `method-${i}`}
                      className="flex flex-col items-center p-4 bg-muted/30 rounded-lg"
                    >
                      <div className={cn("p-3 rounded-full mb-3", config.iconBg)}>
                        <IconComponent className={cn("w-6 h-6", config.color)} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          {config.label}
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          S/ {Number(method.amount || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(method.count || 0)} pagos ({Number(method.percentage || 0).toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Analytics */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Rendimiento Mensual</TabsTrigger>
            <TabsTrigger value="appointments">Historial de Citas</TabsTrigger>
            <TabsTrigger value="analytics">Métricas Detalladas</TabsTrigger>
          </TabsList>

          {/* Monthly Performance */}
          <TabsContent value="performance" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rendimiento por Mes</h3>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Último año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.monthlyPerformance?.length ? (
                    <div className="space-y-4">
                      {stats.monthlyPerformance.map((m, i) => {
                        const prev = i > 0 ? stats.monthlyPerformance[i - 1] : null;
                        const trendUp = prev ? m.appointments > prev.appointments : null;
                        const pct =
                          prev && prev.appointments > 0
                            ? (((m.appointments - prev.appointments) / prev.appointments) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={`${m.month}-${i}`}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="font-semibold text-primary">{m.month}</span>
                              </div>
                              <div>
                                <p className="font-medium">{m.appointments} citas</p>
                                <p className="text-sm text-muted-foreground">
                                  S/ {Number(m.revenue || 0)} en ingresos • S/ {Number(m.bonus || 0)} en comisiones
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {prev && (
                                <div className="flex items-center gap-1">
                                  {trendUp ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                                  )}
                                  <span
                                    className={`text-xs font-medium ${trendUp ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Card className="card-modern">
                      <CardContent className="p-6 text-sm text-muted-foreground">
                        Sin datos de rendimiento mensual
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Appointments */}
          <TabsContent value="appointments" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Historial de Citas Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No hay citas registradas</p>
                    <p className="text-sm">Las citas del trabajador aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Tratamiento</TableHead>
                          <TableHead className="text-right">Ingreso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getRecentAppointments().map((appointment) => {
                          const payment = payments.find(
                            (p) => p.appointmentId === appointment.id
                          );
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {appointment.patient?.firstName} {appointment.patient?.paternalSurname}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    DNI: {appointment.patient?.documentNumber}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {new Date(appointment.dateTime).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(appointment.dateTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {appointment.duration} min
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={cn("text-xs", getStatusColor(appointment.status))}>
                                  {getStatusText(appointment.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm max-w-xs truncate">
                                  {appointment.treatmentNotes || "No especificado"}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <p className="font-medium">
                                  S/ {Number(payment?.amount || 0).toFixed(2)}
                                </p>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    Métricas de Productividad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Calificación Promedio</span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {Number(stats.averageRating || 0).toFixed(1)}
                      </span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Citas por Mes (Promedio)</span>
                    <span className="font-semibold">
                      {safeDiv(Number(stats.totalAppointments || 0), Number(selectedPeriod)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ingresos por Cita</span>
                    <span className="font-semibold">
                      S/ {safeDiv(Number(stats.revenueGenerated || 0), Number(stats.totalAppointments || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Comisión Total</span>
                    <span className="font-semibold">
                      S/ {Number(stats.commissionFromMedications || 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Estadísticas Generales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tiempo Promedio por Cita</span>
                    <span className="font-semibold">{Number(stats.averageAppointmentDuration || 0)} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pacientes Únicos</span>
                    <span className="font-semibold">{Number(stats.uniquePatients || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Citas Repetidas</span>
                    <span className="font-semibold">{Number(stats.repeatAppointments || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Días Trabajados (Total)</span>
                    <span className="font-semibold">{Number(stats.totalWorkDays || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Editar Trabajador
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Nombres *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Carlos"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Apellidos *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Rodríguez"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuario *</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="carlos"
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="******"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as "admin" | "trabajador" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trabajador">Trabajador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Activo</Label>
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditWorker}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default WorkerDetail;
