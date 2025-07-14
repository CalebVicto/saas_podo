import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Award,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Package,
  Activity,
  BarChart,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { Worker, Appointment, Payment, Sale, SaleItem } from "@shared/api";
import {
  getAllMockWorkers,
  getMockAppointments,
  getMockPayments,
  mockSales,
  mockSaleItems,
  getAllMockProducts,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

interface WorkerStats {
  totalAppointments: number;
  revenueGenerated: number;
  bonusFromMedications: number;
  packagesAttended: number;
  averageRating: number;
  completionRate: number;
  monthlyAppointments: { month: string; count: number; revenue: number }[];
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

// Mock monthly performance data
const mockMonthlyPerformance = [
  { month: "Ene", appointments: 45, revenue: 2250, bonus: 180 },
  { month: "Feb", appointments: 52, revenue: 2600, bonus: 210 },
  { month: "Mar", appointments: 38, revenue: 1900, bonus: 150 },
  { month: "Abr", appointments: 61, revenue: 3050, bonus: 245 },
  { month: "May", appointments: 48, revenue: 2400, bonus: 190 },
  { month: "Jun", appointments: 55, revenue: 2750, bonus: 220 },
];

export function WorkerDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<WorkerStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("6"); // months
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadWorkerData(id);
    }
  }, [id]);

  const loadWorkerData = async (workerId: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Load worker data
      const workers = getAllMockWorkers();
      const foundWorker = workers.find((w) => w.id === workerId);

      if (!foundWorker) {
        navigate("/workers");
        return;
      }

      // Load related data
      const appointmentsData = getMockAppointments().filter(
        (a) => a.workerId === workerId,
      );
      const paymentsData = getMockPayments().filter((p) =>
        appointmentsData.some((a) => a.id === p.appointmentId),
      );
      const salesData = mockSales.filter((s) => s.sellerId === workerId);
      const products = getAllMockProducts();

      // Calculate statistics
      const totalAppointments = appointmentsData.length;
      const completedAppointments = appointmentsData.filter(
        (a) => a.status === "completed",
      ).length;

      const revenueGenerated = paymentsData
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate bonus from medication sales
      let bonusFromMedications = 0;
      salesData.forEach((sale) => {
        const saleItems = mockSaleItems.filter((si) => si.saleId === sale.id);
        saleItems.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (product?.bonusAmount) {
            bonusFromMedications += product.bonusAmount * item.quantity;
          }
        });
      });

      // Calculate payment method breakdown
      const paymentMethodCounts: Record<
        string,
        { count: number; amount: number }
      > = {};
      paymentsData
        .filter((p) => p.status === "completed")
        .forEach((payment) => {
          if (!paymentMethodCounts[payment.method]) {
            paymentMethodCounts[payment.method] = { count: 0, amount: 0 };
          }
          paymentMethodCounts[payment.method].count++;
          paymentMethodCounts[payment.method].amount += payment.amount;
        });

      const totalMethodAmount = Object.values(paymentMethodCounts).reduce(
        (sum, data) => sum + data.amount,
        0,
      );

      const paymentMethodBreakdown = Object.entries(paymentMethodCounts).map(
        ([method, data]) => ({
          method,
          count: data.count,
          amount: data.amount,
          percentage:
            totalMethodAmount > 0 ? (data.amount / totalMethodAmount) * 100 : 0,
        }),
      );

      const workerStats: WorkerStats = {
        totalAppointments,
        revenueGenerated,
        bonusFromMedications,
        packagesAttended: Math.floor(totalAppointments * 0.3), // Mock: 30% are package sessions
        averageRating: 4.7, // Mock rating
        completionRate: (completedAppointments / totalAppointments) * 100 || 0,
        monthlyAppointments: mockMonthlyPerformance,
        paymentMethodBreakdown,
      };

      setWorker(foundWorker);
      setAppointments(appointmentsData);
      setPayments(paymentsData);
      setSales(salesData);
      setStats(workerStats);
    } catch (error) {
      console.error("Error loading worker data:", error);
      navigate("/workers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    console.log("Edit worker:", worker?.id);
    alert(
      "Funcionalidad de edición disponible en la página principal de trabajadores",
    );
  };

  const handleDelete = () => {
    if (!worker) return;

    if (
      confirm(
        `¿Estás seguro de que quieres eliminar al trabajador "${worker.firstName} ${worker.lastName}"?`,
      )
    ) {
      console.log("Delete worker:", worker.id);
      navigate("/workers");
    }
  };

  const toggleStatus = () => {
    if (!worker) return;
    setWorker({ ...worker, isActive: !worker.isActive });
  };

  const getRecentAppointments = () => {
    return appointments
      .sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      )
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

  if (isLoading) {
    return (
      <Layout
        title="Detalle del Trabajador"
        subtitle="Información completa del trabajador"
      >
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
      <Layout
        title="Trabajador no encontrado"
        subtitle="El trabajador solicitado no existe"
      >
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
    <Layout
      title={`${worker.firstName} ${worker.lastName}`}
      subtitle="Perfil completo del trabajador"
    >
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
                worker.isActive
                  ? "text-red-600 hover:text-red-700"
                  : "text-green-600 hover:text-green-700",
              )}
            >
              {worker.isActive ? (
                <UserX className="w-4 h-4" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {worker.isActive ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Worker Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Worker Info */}
          <div className="lg:col-span-2">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary text-lg">
                      {worker.firstName.charAt(0)}
                      {worker.lastName.charAt(0)}
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
                    <Label className="text-sm text-muted-foreground">
                      Correo Electrónico
                    </Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{worker.email}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Teléfono
                    </Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">{worker.phone}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Especialización
                    </Label>
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-muted-foreground" />
                      <p className="font-medium">
                        {worker.specialization || "No especificada"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Estado
                    </Label>
                    <Badge
                      variant={worker.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {worker.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Acceso al Sistema
                    </Label>
                    <Badge
                      variant={worker.hasSystemAccess ? "default" : "outline"}
                      className="text-xs"
                    >
                      {worker.hasSystemAccess ? "Autorizado" : "Sin acceso"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Tipo de Trabajador
                    </Label>
                    <p className="font-medium">
                      {worker.workerType || "No especificado"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground pt-4 border-t">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Fecha de Registro
                    </Label>
                    <p>{new Date(worker.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Última Actualización
                    </Label>
                    <p>{new Date(worker.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Citas</p>
                    <p className="text-2xl font-bold">
                      {stats.totalAppointments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ingresos Generados
                    </p>
                    <p className="text-2xl font-bold">
                      S/ {stats.revenueGenerated.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue/10 rounded-lg">
                    <Award className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Comisiones por Medicamentos
                    </p>
                    <p className="text-2xl font-bold">
                      S/ {stats.bonusFromMedications.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple/10 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Paquetes Atendidos
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.packagesAttended}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Tasa de Finalización
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.completionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
                  {mockMonthlyPerformance.map((month, index) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {month.month}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {month.appointments} citas
                          </p>
                          <p className="text-sm text-muted-foreground">
                            S/ {month.revenue} en ingresos • S/ {month.bonus} en
                            comisiones
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {index > 0 && (
                          <div className="flex items-center gap-1">
                            {month.appointments >
                            mockMonthlyPerformance[index - 1].appointments ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                            )}
                            <span
                              className={cn(
                                "text-xs font-medium",
                                month.appointments >
                                  mockMonthlyPerformance[index - 1].appointments
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {(
                                ((month.appointments -
                                  mockMonthlyPerformance[index - 1]
                                    .appointments) /
                                  mockMonthlyPerformance[index - 1]
                                    .appointments) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
                    <p className="text-lg font-medium">
                      No hay citas registradas
                    </p>
                    <p className="text-sm">
                      Las citas del trabajador aparecerán aquí
                    </p>
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
                            (p) => p.appointmentId === appointment.id,
                          );
                          return (
                            <TableRow key={appointment.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {appointment.patient?.firstName}{" "}
                                    {appointment.patient?.lastName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    DNI: {appointment.patient?.documentId}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {new Date(
                                      appointment.dateTime,
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      appointment.dateTime,
                                    ).toLocaleTimeString([], {
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
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    getStatusColor(appointment.status),
                                  )}
                                >
                                  {getStatusText(appointment.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm max-w-xs truncate">
                                  {appointment.treatmentNotes ||
                                    "No especificado"}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <p className="font-medium">
                                  S/ {payment?.amount.toFixed(2) || "0.00"}
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
                    <span className="text-sm text-muted-foreground">
                      Calificación Promedio
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {stats.averageRating}
                      </span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Citas por Mes (Promedio)
                    </span>
                    <span className="font-semibold">
                      {(stats.totalAppointments / 6).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Ingresos por Cita
                    </span>
                    <span className="font-semibold">
                      S/{" "}
                      {(
                        stats.revenueGenerated / stats.totalAppointments
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Comisión Total
                    </span>
                    <span className="font-semibold">
                      S/ {stats.bonusFromMedications.toFixed(2)}
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
                    <span className="text-sm text-muted-foreground">
                      Tiempo Promedio por Cita
                    </span>
                    <span className="font-semibold">60 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Pacientes Únicos
                    </span>
                    <span className="font-semibold">
                      {Math.floor(stats.totalAppointments * 0.7)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Citas Repetidas
                    </span>
                    <span className="font-semibold">
                      {Math.floor(stats.totalAppointments * 0.3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Días Trabajados (Total)
                    </span>
                    <span className="font-semibold">
                      {Math.floor(stats.totalAppointments / 3)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("text-sm font-medium", className)}>{children}</div>;
}

export default WorkerDetail;
