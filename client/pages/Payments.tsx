import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Eye,
  DollarSign,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Smartphone,
  Building,
  Banknote,
  Wallet,
  ArrowUpDown,
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
import { Payment, CreatePaymentRequest, Appointment, Sale } from "@shared/api";
import { getMockPayments, getMockAppointments, getMockSales } from "@/lib/mockData";
import { AppointmentDetailStory } from "@/components/appointments/AppointmentDetailStory";
import { apiGet, ApiResponse } from "@/lib/auth";
import Layout from "@/components/Layout";
import {
  Pagination,
  usePagination,
  paginateArray,
} from "@/components/ui/pagination";

interface User {
  id: string;
  role: "admin" | "worker";
}

const useAuth = () => {
  const [user] = useState<User | null>(() => {
    const stored = localStorage.getItem("podocare_user");
    return stored ? JSON.parse(stored) : null;
  });
  return { user };
};

const paymentMethodConfig = {
  cash: {
    label: "Efectivo",
    icon: Banknote,
    className: "bg-green-100 text-green-800 border-green-200",
    cardColor: "text-green-600",
    cardBg: "bg-green-50",
    iconBg: "bg-green-100",
  },
  yape: {
    label: "Yape",
    icon: Smartphone,
    className: "bg-purple-100 text-purple-800 border-purple-200",
    cardColor: "text-purple-600",
    cardBg: "bg-purple-50",
    iconBg: "bg-purple-100",
  },
  plin: {
    label: "Plin",
    icon: Smartphone,
    className: "bg-blue-100 text-blue-800 border-blue-200",
    cardColor: "text-blue-600",
    cardBg: "bg-blue-50",
    iconBg: "bg-blue-100",
  },
  transfer: {
    label: "Transferencia",
    icon: ArrowUpDown,
    className: "bg-orange-100 text-orange-800 border-orange-200",
    cardColor: "text-orange-600",
    cardBg: "bg-orange-50",
    iconBg: "bg-orange-100",
  },
  card: {
    label: "Tarjeta",
    icon: CreditCard,
    className: "bg-gray-100 text-gray-800 border-gray-200",
    cardColor: "text-indigo-600",
    cardBg: "bg-indigo-50",
    iconBg: "bg-indigo-100",
  },
};

const statusConfig = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    className: "status-warning",
  },
  completed: {
    label: "Completado",
    icon: CheckCircle,
    className: "status-success",
  },
  failed: {
    label: "Fallido",
    icon: XCircle,
    className: "status-error",
  },
};

const appointmentStatusConfig = {
  registered: {
    label: "Registrada",
    icon: Clock,
    className: "status-info",
  },
  paid: {
    label: "Pagada",
    icon: CheckCircle,
    className: "status-success",
  },
  canceled: {
    label: "Cancelada",
    icon: XCircle,
    className: "status-error",
  },
};

export function Payments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination
  const pagination = usePagination({
    totalItems: filteredPayments.length,
    initialPageSize: 15,
  });

  // Get available data
  const appointments = getMockAppointments();
  const sales = getMockSales();

  // Form state for new payment
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    appointmentId: "",
    saleId: "",
    amount: 0,
    method: "cash",
  });

  // Load payments on component mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadPayments();
  }, [user, navigate]);

  // Filter payments based on search and filters
  useEffect(() => {
    let filtered = payments;

    // Text search - search by amount or related appointment/sale info
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.amount.toString().includes(searchTerm) ||
          payment.method.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.method === methodFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((payment) => {
        const paymentDate = payment.paidAt || payment.createdAt;
        return paymentDate.startsWith(dateFilter);
      });
    }

    setFilteredPayments(filtered);
    // Reset pagination when filters change
    pagination.resetPagination();
  }, [
    payments,
    searchTerm,
    methodFilter,
    statusFilter,
    dateFilter,
    pagination,
  ]);

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const resp = await apiGet<
        ApiResponse<{ data: any[]; total: number; page: number; limit: number }>
      >("/payment");
      if (!resp.error && resp.data) {
        const raw = resp.data.data.data || [];
        const items: Payment[] = raw.map((p: any) => ({
          id: p.id,
          amount: p.totalAmount,
          method: p.paymentType,
          status: p.status,
          paidAt: p.date,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          appointmentId:
            p.referenceTable === "Appointment" ? p.referenceId : undefined,
          saleId: p.referenceTable === "Sale" ? p.referenceId : undefined,
        }));
        setPayments(items);
      }
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPayment: Payment = {
        id: Date.now().toString(),
        ...formData,
        status: "completed",
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPayments([...payments, newPayment]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      appointmentId: "",
      saleId: "",
      amount: 0,
      method: "cash",
    });
  };

  const openViewDialog = async (payment: Payment) => {
    try {
      if (payment.appointmentId) {
        const resp = await apiGet<ApiResponse<Appointment>>(
          `/appointment/${payment.appointmentId}`,
        );
        if (!resp.error && resp.data) {
          setSelectedAppointment(resp.data.data);
          setIsAppointmentDialogOpen(true);
          return;
        }
      } else if (payment.saleId) {
        const resp = await apiGet<ApiResponse<Sale>>(
          `/sale/${payment.saleId}`,
        );
        if (!resp.error && resp.data) {
          setSelectedSale(resp.data.data);
          setIsSaleDialogOpen(true);
          return;
        }
      }
      setSelectedPayment(payment);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Error loading detail:", error);
      setSelectedPayment(payment);
      setIsViewDialogOpen(true);
    }
  };

  const getPaymentSource = (payment: Payment) => {
    if (payment.appointmentId) {
      return { type: "appointment" as const, label: "Cita" };
    } else if (payment.saleId) {
      return { type: "sale" as const, label: "Venta" };
    }
    return { type: "other" as const, label: "Pago directo" };
  };

  // Calculate stats
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const todayAmount = payments
    .filter((p) => {
      const paymentDate = p.paidAt || p.createdAt;
      return paymentDate.startsWith(new Date().toISOString().split("T")[0]);
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const completedPayments = payments.filter((p) => p.status === "completed");
  const pendingPayments = payments.filter((p) => p.status === "pending");

  // Calculate daily income by payment method
  const getDailyPaymentMethodStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = payments.filter((p) => {
      const paymentDate = p.paidAt || p.createdAt;
      return paymentDate.startsWith(today) && p.status === "completed";
    });

    const methodStats: Record<string, { amount: number; count: number }> = {};

    // Initialize all methods
    Object.keys(paymentMethodConfig).forEach((method) => {
      methodStats[method] = { amount: 0, count: 0 };
    });

    // Calculate stats for today's payments
    todayPayments.forEach((payment) => {
      if (methodStats[payment.method]) {
        methodStats[payment.method].amount += payment.amount;
        methodStats[payment.method].count += 1;
      }
    });

    return methodStats;
  };

  const dailyMethodStats = getDailyPaymentMethodStats();

  if (!user) return null;

  return (
    <Layout
      title="Gestión de Pagos"
      subtitle="Administra los pagos de citas y ventas de productos"
    >
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
          </div>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Registrar Pago
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Recaudado
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    S/ {totalAmount.toFixed(2)}
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
                    Ingresos Hoy
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    S/ {todayAmount.toFixed(2)}
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
                    Pagos Completados
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {completedPayments.length}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Pagos Pendientes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {pendingPayments.length}
                  </p>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Payment Method Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              💰 Ingresos de Hoy por Método de Pago
            </h3>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(paymentMethodConfig).map(([method, config]) => {
              const stats = dailyMethodStats[method];
              const IconComponent = config.icon;
              return (
                <Card
                  key={method}
                  className="card-modern hover:shadow-md transition-all duration-200"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={cn("p-2 rounded-lg", config.iconBg)}>
                        <IconComponent
                          className={cn("w-5 h-5", config.cardColor)}
                        />
                      </div>
                      {stats.count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {stats.count}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {method === "cash" && "💵"}
                        {method === "yape" && "📱"}
                        {method === "plin" && "📲"}
                        {method === "card" && "💳"}
                        {method === "transfer" && "🏦"} {config.label}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        S/ {stats.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.count} {stats.count === 1 ? "pago" : "pagos"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por monto, método..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="plin">Plin</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrar por fecha"
              />

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setMethodFilter("all");
                  setStatusFilter("all");
                  setDateFilter("");
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>
              Pagos ({filteredPayments.length}
              {filteredPayments.length !== payments.length &&
                ` de ${payments.length}`}
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-16 rounded"></div>
                ))}
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No hay pagos
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ||
                  methodFilter !== "all" ||
                  statusFilter !== "all" ||
                  dateFilter
                    ? "No se encontraron pagos con los filtros aplicados"
                    : "No hay pagos registrados"}
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Primer Pago
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginateArray(
                        filteredPayments.sort(
                          (a, b) =>
                            new Date(b.paidAt || b.createdAt).getTime() -
                            new Date(a.paidAt || a.createdAt).getTime(),
                        ),
                        pagination.currentPage,
                        pagination.pageSize,
                      ).map((payment) => {
                        const methodInfo = paymentMethodConfig[payment.method];
                        const statusInfo = statusConfig[payment.status];
                        const source = getPaymentSource(payment);
                        const MethodIcon = methodInfo.icon;
                        const StatusIcon = statusInfo.icon;

                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {new Date(
                                    payment.paidAt || payment.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    payment.paidAt || payment.createdAt,
                                  ).toLocaleTimeString("es-ES", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-lg font-semibold text-foreground">
                                S/ {payment.amount.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("gap-1", methodInfo.className)}
                              >
                                <MethodIcon className="w-3 h-3" />
                                {methodInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("gap-1", statusInfo.className)}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">
                                  {source.label}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {source.type === "appointment" &&
                                    "Consulta médica"}
                                  {source.type === "sale" &&
                                    "Venta de productos"}
                                  {source.type === "other" && "Pago directo"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => openViewDialog(payment)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={filteredPayments.length}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.goToPage}
                  onPageSizeChange={pagination.setPageSize}
                  showPageSizeSelector={true}
                  pageSizeOptions={[10, 15, 25, 50]}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Payment Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Registrar Nuevo Pago
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Pago</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={formData.appointmentId ? "default" : "outline"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        appointmentId: "",
                        saleId: "",
                      })
                    }
                    className="h-20 flex-col gap-2"
                  >
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">Pago de Cita</span>
                  </Button>
                  <Button
                    variant={formData.saleId ? "default" : "outline"}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        appointmentId: "",
                        saleId: "",
                      })
                    }
                    className="h-20 flex-col gap-2"
                  >
                    <DollarSign className="w-6 h-6" />
                    <span className="text-sm">Pago de Venta</span>
                  </Button>
                </div>
              </div>

              {!formData.appointmentId && !formData.saleId && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="appointmentId">
                      Seleccionar Cita (Opcional)
                    </Label>
                    <Select
                      value={formData.appointmentId}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          appointmentId: value,
                          saleId: "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cita..." />
                      </SelectTrigger>
                      <SelectContent>
                        {appointments
                          .filter((apt) => apt.status === "completed")
                          .map((appointment) => (
                            <SelectItem
                              key={appointment.id}
                              value={appointment.id}
                            >
                              {appointment.patient?.firstName}{" "}
                              {appointment.patient?.lastName} -{" "}
                              {new Date(
                                appointment.dateTime,
                              ).toLocaleDateString()}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saleId">Seleccionar Venta (Opcional)</Label>
                    <Select
                      value={formData.saleId}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          saleId: value,
                          appointmentId: "",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar venta..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sales.map((sale) => (
                          <SelectItem key={sale.id} value={sale.id}>
                            Venta #{sale.id} - S/ {sale.totalAmount.toFixed(2)}{" "}
                            - {new Date(sale.date).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Monto *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Método de Pago *</Label>
                  <Select
                    value={formData.method}
                    onValueChange={(value: Payment["method"]) =>
                      setFormData({ ...formData, method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="plin">Plin</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddPayment}
                className="btn-primary"
                disabled={formData.amount <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
            </div>
        </DialogContent>
        </Dialog>

        {/* View Appointment Dialog */}
        <Dialog
          open={isAppointmentDialogOpen}
          onOpenChange={setIsAppointmentDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Detalle de la Cita
              </DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <AppointmentDetailStory
                appt={selectedAppointment}
                statusConfig={appointmentStatusConfig}
              />
            )}
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setIsAppointmentDialogOpen(false)}
                className="btn-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Sale Dialog */}
        <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Detalle de la Venta
              </DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Fecha</Label>
                    <p className="font-medium mt-1">
                      {new Date(selectedSale.date).toLocaleString("es-PE")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Método de Pago
                    </Label>
                    <p className="font-medium mt-1 capitalize">
                      {selectedSale.paymentMethod || "—"}
                    </p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSale.saleItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          S/ {item.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-right font-bold">
                  Total: S/ {selectedSale.totalAmount.toFixed(2)}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setIsSaleDialogOpen(false)}
                className="btn-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Payment Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles del Pago
              </DialogTitle>
            </DialogHeader>

            {selectedPayment && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    S/ {selectedPayment.amount.toFixed(2)}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-2",
                      statusConfig[selectedPayment.status].className,
                    )}
                  >
                    {statusConfig[selectedPayment.status].label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Método de Pago
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const methodInfo =
                          paymentMethodConfig[selectedPayment.method];
                        const MethodIcon = methodInfo.icon;
                        return (
                          <>
                            <MethodIcon className="w-4 h-4" />
                            <span className="font-medium">
                              {methodInfo.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Fecha de Pago
                    </Label>
                    <p className="font-medium mt-1">
                      {new Date(
                        selectedPayment.paidAt || selectedPayment.createdAt,
                      ).toLocaleString("es-ES")}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-sm">
                    Concepto
                  </Label>
                  <div className="bg-muted/30 p-4 rounded-lg mt-2">
                    {(() => {
                      const source = getPaymentSource(selectedPayment);
                      return (
                        <div>
                          <p className="font-medium">{source.label}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {source.type === "appointment" && "Consulta médica"}
                            {source.type === "sale" && "Venta de productos"}
                            {source.type === "other" && "Pago directo"}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                  <p>ID del pago: {selectedPayment.id}</p>
                  <p>
                    Creado el:{" "}
                    {new Date(selectedPayment.createdAt).toLocaleString(
                      "es-ES",
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setSelectedPayment(null);
                }}
                className="btn-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Payments;
