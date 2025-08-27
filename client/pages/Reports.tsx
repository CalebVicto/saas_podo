import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar,
  DollarSign,
  Users,
  ShoppingBag,
  FileText,
  Eye,
  Wallet,
  Smartphone,
  CreditCard,
  ArrowUpDown,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getMockPayments,
  getMockAppointments,
  getMockSales,
  getAllMockWorkers,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

interface ReportFilters {
  startDate: string;
  endDate: string;
  workerId: string;
  paymentMethod: string;
  reportType: "income" | "appointments" | "products";
}

interface IncomeData {
  date: string;
  appointments: number;
  sales: number;
  total: number;
}

interface WorkerPerformance {
  workerId: string;
  workerName: string;
  appointments: number;
  income: number;
  avgPerAppointment: number;
}

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

export function Reports() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    workerId: "all",
    paymentMethod: "all",
    reportType: "income",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<{
    incomeData: IncomeData[];
    workerPerformance: WorkerPerformance[];
    paymentMethodData: PaymentMethodData[];
    summary: {
      totalIncome: number;
      totalAppointments: number;
      totalSales: number;
      avgIncomePerDay: number;
    };
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Get reference data
  const workers = getAllMockWorkers();
  const payments = getMockPayments();
  const appointments = getMockAppointments();
  const sales = getMockSales();

  // Check user role
  const user = JSON.parse(localStorage.getItem("podocare_user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
  }, [isAdmin, navigate]);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);

      // Filter payments by date range
      const filteredPayments = payments.filter((payment) => {
        const paymentDate = new Date(payment.paidAt || payment.createdAt);
        return paymentDate >= startDate && paymentDate <= endDate;
      });

      // Filter appointments by date range and worker
      let filteredAppointments = appointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        const dateMatch =
          appointmentDate >= startDate && appointmentDate <= endDate;
        const workerMatch =
          filters.workerId === "all" ||
          appointment.workerId === filters.workerId;
        return dateMatch && workerMatch && appointment.status === "completed";
      });

      // Generate daily income data
      const incomeData: IncomeData[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];

        const dayAppointments = filteredAppointments.filter((apt) =>
          apt.date.startsWith(dateStr),
        );

        const dayPayments = filteredPayments.filter((payment) => {
          const paymentDate = payment.paidAt || payment.createdAt;
          return paymentDate.startsWith(dateStr);
        });

        const appointmentIncome = dayPayments
          .filter((p) => p.appointmentId)
          .reduce((sum, p) => sum + p.amount, 0);

        const salesIncome = dayPayments
          .filter((p) => p.saleId)
          .reduce((sum, p) => sum + p.amount, 0);

        incomeData.push({
          date: dateStr,
          appointments: appointmentIncome,
          sales: salesIncome,
          total: appointmentIncome + salesIncome,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate worker performance data
      const workerPerformance: WorkerPerformance[] = workers
        .map((worker) => {
          const workerAppointments = filteredAppointments.filter(
            (apt) => apt.workerId === worker.id,
          );

          const workerPayments = filteredPayments.filter((payment) =>
            workerAppointments.some((apt) => apt.id === payment.appointmentId),
          );

          const income = workerPayments.reduce((sum, p) => sum + p.amount, 0);

          return {
            workerId: worker.id,
            workerName: `${worker.firstName} ${worker.lastName}`,
            appointments: workerAppointments.length,
            income,
            avgPerAppointment:
              workerAppointments.length > 0
                ? income / workerAppointments.length
                : 0,
          };
        })
        .filter((wp) => wp.appointments > 0);

      // Generate payment method data
      const paymentMethodCounts: Record<
        string,
        { count: number; amount: number }
      > = {};

      let methodPayments = filteredPayments;
      if (filters.paymentMethod !== "all") {
        methodPayments = filteredPayments.filter(
          (p) => p.method === filters.paymentMethod,
        );
      }

      methodPayments.forEach((payment) => {
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

      const paymentMethodData: PaymentMethodData[] = Object.entries(
        paymentMethodCounts,
      ).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage:
          totalMethodAmount > 0 ? (data.amount / totalMethodAmount) * 100 : 0,
      }));

      // Calculate summary
      const totalIncome = filteredPayments.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      const totalAppointments = filteredAppointments.length;
      const totalSales = filteredPayments.filter((p) => p.saleId).length;
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      );
      const avgIncomePerDay = totalIncome / daysDiff;

      setReportData({
        incomeData,
        workerPerformance,
        paymentMethodData,
        summary: {
          totalIncome,
          totalAppointments,
          totalSales,
          avgIncomePerDay,
        },
      });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";

    // Add summary
    csvContent += "REPORTE DE INGRESOS\\n";
    csvContent += `Período,${filters.startDate} a ${filters.endDate}\\n`;
    csvContent += `Total Ingresos,S/ ${reportData.summary.totalIncome.toFixed(2)}\\n`;
    csvContent += `Total Citas,${reportData.summary.totalAppointments}\\n`;
    csvContent += `Total Ventas,${reportData.summary.totalSales}\\n`;
    csvContent += `Promedio por Día,S/ ${reportData.summary.avgIncomePerDay.toFixed(2)}\\n\\n`;

    // Add daily income data
    csvContent += "INGRESOS DIARIOS\\n";
    csvContent += "Fecha,Citas,Ventas,Total\\n";
    reportData.incomeData.forEach((row) => {
      csvContent += `${row.date},${row.appointments.toFixed(2)},${row.sales.toFixed(2)},${row.total.toFixed(2)}\\n`;
    });

    csvContent += "\\n";

    // Add worker performance
    csvContent += "RENDIMIENTO POR TRABAJADOR\\n";
    csvContent += "Trabajador,Citas,Ingresos,Promedio por Cita\\n";
    reportData.workerPerformance.forEach((row) => {
      csvContent += `${row.workerName},${row.appointments},${row.income.toFixed(2)},${row.avgPerAppointment.toFixed(2)}\\n`;
    });

    csvContent += "\\n";

    // Add payment methods
    csvContent += "MÉTODOS DE PAGO\\n";
    csvContent += "Método,Cantidad,Monto,Porcentaje\\n";
    reportData.paymentMethodData.forEach((row) => {
      csvContent += `${row.method},${row.count},${row.amount.toFixed(2)},${row.percentage.toFixed(1)}%\\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reporte_ingresos_${filters.startDate}_${filters.endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMethodLabel = (method: string) => {
    const labels = {
      cash: "Efectivo",
      transfer: "Transferencia",
      yape: "Yape",
      pos: "POS",
      plin: "Plin",
      balance: "Saldo",
    };
    return labels[method as keyof typeof labels] || method;
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
      transfer: {
        label: "🏦 Transferencia",
        icon: ArrowUpDown,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        iconBg: "bg-orange-100",
      },
      yape: {
        label: "📱 Yape",
        icon: Smartphone,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        iconBg: "bg-purple-100",
      },
      pos: {
        label: "💳 POS",
        icon: CreditCard,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        iconBg: "bg-indigo-100",
      },
      plin: {
        label: "📲 Plin",
        icon: Smartphone,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        iconBg: "bg-blue-100",
      },
      balance: {
        label: "🪙 Saldo",
        icon: Wallet,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        iconBg: "bg-yellow-100",
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

  if (!isAdmin) return null;

  return (
    <Layout
      title="Reportes e Informes"
      subtitle="Analiza el rendimiento financiero de tu clínica"
    >
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="flex gap-3">
            {reportData && (
              <>
                <Button
                  onClick={() => setIsPreviewOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Vista Previa
                </Button>
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Exportar CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Filtros del Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workerId">Trabajador</Label>
                <Select
                  value={filters.workerId}
                  onValueChange={(value) =>
                    setFilters({ ...filters, workerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los trabajadores</SelectItem>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.firstName} {worker.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select
                  value={filters.paymentMethod}
                  onValueChange={(value) =>
                    setFilters({ ...filters, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los métodos</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                    <SelectItem value="plin">Plin</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                    <SelectItem value="balance">Saldo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className="btn-primary w-full flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-5 h-5" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Results */}
        {reportData && (
          <>
            {/* Payment Method Summary Cards */}
            {reportData.paymentMethodData.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Resumen por Método de Pago
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {reportData.paymentMethodData.length} métodos activos
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  {reportData.paymentMethodData.map((method) => {
                    const config =
                      getPaymentMethodConfig()[
                        method.method as keyof ReturnType<
                          typeof getPaymentMethodConfig
                        >
                      ] || getPaymentMethodConfig().other;
                    const IconComponent = config.icon;
                    return (
                      <Card
                        key={method.method}
                        className="card-modern hover:shadow-md transition-all duration-200"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className={cn("p-2 rounded-lg", config.iconBg)}
                            >
                              <IconComponent
                                className={cn("w-5 h-5", config.color)}
                              />
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {method.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {config.label}
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              S/ {method.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {method.count} transacciones
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="card-modern">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Ingresos Totales
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        S/ {reportData.summary.totalIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Citas
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {reportData.summary.totalAppointments}
                      </p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-xl">
                      <Calendar className="w-6 h-6 text-secondary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Total Ventas
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {reportData.summary.totalSales}
                      </p>
                    </div>
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <ShoppingBag className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Promedio Diario
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        S/ {reportData.summary.avgIncomePerDay.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Worker Performance */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Rendimiento por Trabajador
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.workerPerformance.map((worker) => (
                      <div
                        key={worker.workerId}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{worker.workerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {worker.appointments} citas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            S/ {worker.income.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            S/ {worker.avgPerAppointment.toFixed(2)} / cita
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Métodos de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.paymentMethodData.map((method) => (
                      <div key={method.method} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {getMethodLabel(method.method)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {method.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{method.count} transacciones</span>
                          <span>S/ {method.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Income Table */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Ingresos Diarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Ingresos por Citas</TableHead>
                        <TableHead>Ingresos por Ventas</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.incomeData
                        .filter((day) => day.total > 0)
                        .map((day) => (
                          <TableRow key={day.date}>
                            <TableCell>
                              {new Date(day.date).toLocaleDateString("es-ES", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </TableCell>
                            <TableCell>
                              S/ {day.appointments.toFixed(2)}
                            </TableCell>
                            <TableCell>S/ {day.sales.toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">
                              S/ {day.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Report Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Vista Previa del Reporte
              </DialogTitle>
            </DialogHeader>

            {reportData && (
              <div className="space-y-6 py-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Reporte de Ingresos
                  </h2>
                  <p className="text-muted-foreground">
                    Período: {filters.startDate} a {filters.endDate}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">
                      Ingresos Totales
                    </Label>
                    <p className="text-xl font-bold">
                      S/ {reportData.summary.totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Total de Citas
                    </Label>
                    <p className="text-xl font-bold">
                      {reportData.summary.totalAppointments}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Total de Ventas
                    </Label>
                    <p className="text-xl font-bold">
                      {reportData.summary.totalSales}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">
                      Promedio Diario
                    </Label>
                    <p className="text-xl font-bold">
                      S/ {reportData.summary.avgIncomePerDay.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">
                    Rendimiento por Trabajador
                  </h3>
                  <div className="space-y-2">
                    {reportData.workerPerformance.map((worker) => (
                      <div
                        key={worker.workerId}
                        className="flex justify-between text-sm p-2 bg-muted/30 rounded"
                      >
                        <span>{worker.workerName}</span>
                        <span>
                          {worker.appointments} citas - S/{" "}
                          {worker.income.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Métodos de Pago</h3>
                  <div className="space-y-2">
                    {reportData.paymentMethodData.map((method) => (
                      <div
                        key={method.method}
                        className="flex justify-between text-sm p-2 bg-muted/30 rounded"
                      >
                        <span>{getMethodLabel(method.method)}</span>
                        <span>
                          {method.count} transacciones - S/{" "}
                          {method.amount.toFixed(2)} (
                          {method.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Cerrar
              </Button>
              <Button onClick={exportToCSV} className="btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Reports;
