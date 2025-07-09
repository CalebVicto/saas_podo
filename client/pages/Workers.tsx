import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Save,
  Mail,
  Phone,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Worker,
  Appointment,
  Payment,
  Sale,
  SaleItem,
  CreateWorkerRequest,
} from "@shared/api";
import {
  getAllMockWorkers,
  getMockAppointments,
  getMockPayments,
  mockSales,
  mockSaleItems,
  getAllMockProducts,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

// Predefined worker types
const WORKER_TYPES = [
  "Podólogo",
  "Doctor",
  "Enfermero",
  "Masajista",
  "Fisioterapeuta",
  "Técnico en Podología",
  "Asistente",
];

interface User {
  id: string;
  role: "admin" | "worker";
}

interface CreateWorkerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization?: string;
  isActive: boolean;
}

export function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for new/edit worker
  const [formData, setFormData] = useState<CreateWorkerRequest>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    workerType: "",
    isActive: true,
    hasSystemAccess: false,
    systemPassword: "",
  });

  // Date range for stats filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Check user role
  const user = JSON.parse(localStorage.getItem("podocare_user") || "{}");
  const isAdmin = user.role === "admin";

  // Load workers on component mount
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadWorkers();
  }, [isAdmin, navigate]);

  // Filter workers based on search and filters
  useEffect(() => {
    let filtered = workers;

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(
        (worker) =>
          worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          worker.specialization
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((worker) => worker.isActive === isActive);
    }

    setFilteredWorkers(filtered);
  }, [workers, searchTerm, statusFilter]);

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockWorkers = getAllMockWorkers();
      setWorkers(mockWorkers);
    } catch (error) {
      console.error("Error loading workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorker = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newWorker: Worker = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setWorkers([...workers, newWorker]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding worker:", error);
    }
  };

  const handleEditWorker = async () => {
    if (!selectedWorker) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedWorker: Worker = {
        ...selectedWorker,
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      setWorkers(
        workers.map((w) => (w.id === selectedWorker.id ? updatedWorker : w)),
      );
      setIsEditDialogOpen(false);
      setSelectedWorker(null);
      resetForm();
    } catch (error) {
      console.error("Error updating worker:", error);
    }
  };

  const handleToggleStatus = async (workerId: string) => {
    try {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker) return;

      const updatedWorker = {
        ...worker,
        isActive: !worker.isActive,
        updatedAt: new Date().toISOString(),
      };

      setWorkers(workers.map((w) => (w.id === workerId ? updatedWorker : w)));
    } catch (error) {
      console.error("Error updating worker status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialization: "",
      workerType: "",
      isActive: true,
      hasSystemAccess: false,
      systemPassword: "",
    });
  };

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setFormData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: worker.phone,
      specialization: worker.specialization || "",
      workerType: worker.workerType || "",
      isActive: worker.isActive,
      hasSystemAccess: worker.hasSystemAccess || false,
      systemPassword: worker.systemPassword || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsViewDialogOpen(true);
  };

  const getWorkerStats = (
    workerId: string,
    startDate?: Date,
    endDate?: Date,
  ) => {
    const appointments = getMockAppointments().filter(
      (apt) => apt.workerId === workerId,
    );

    let filteredAppointments = appointments;
    if (startDate && endDate) {
      filteredAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.dateTime);
        return aptDate >= startDate && aptDate <= endDate;
      });
    }

    const completedAppointments = filteredAppointments.filter(
      (apt) => apt.status === "completed",
    );

    const appointmentIds = completedAppointments.map((apt) => apt.id);
    const payments = getMockPayments().filter((payment) =>
      appointmentIds.includes(payment.appointmentId || ""),
    );
    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate bonuses from sales
    const workerSales = mockSales.filter((sale) => sale.sellerId === workerId);
    const products = getAllMockProducts();

    let totalBonuses = 0;
    workerSales.forEach((sale) => {
      sale.items.forEach((item: SaleItem) => {
        const product = products.find((p) => p.id === item.productId);
        if (product?.bonusAmount) {
          // For simplicity, assume all sales qualify for bonus
          totalBonuses += product.bonusAmount * item.quantity;
        }
      });
    });

    const totalRevenue =
      totalEarnings +
      workerSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    return {
      totalAppointments: appointments.length,
      completedAppointments: completedAppointments.length,
      totalEarnings,
      totalBonuses,
      totalRevenue,
      thisMonthAppointments: appointments.filter(
        (apt) =>
          new Date(apt.dateTime).getMonth() === new Date().getMonth() &&
          new Date(apt.dateTime).getFullYear() === new Date().getFullYear(),
      ).length,
      salesCount: workerSales.length,
      averagePerAppointment:
        completedAppointments.length > 0
          ? totalRevenue / completedAppointments.length
          : 0,
    };
  };

  if (!isAdmin) return null;

  return (
    <Layout
      title="Gestión de Trabajadores"
      subtitle="Administra el personal de tu clínica"
    >
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Trabajador
          </Button>
        </div>

        {/* Date Range Filter */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <Label className="font-semibold">
                  Filtrar Estadísticas por Fecha:
                </Label>
              </div>
              <div className="flex gap-4 items-center">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-xs">
                    Desde
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-xs">
                    Hasta
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  size="sm"
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Total Trabajadores
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {workers.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Activos
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {workers.filter((w) => w.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <UserCheck className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Inactivos
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {workers.filter((w) => !w.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <UserX className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Citas Este Mes
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {
                      getMockAppointments().filter(
                        (apt) =>
                          new Date(apt.dateTime).getMonth() ===
                            new Date().getMonth() &&
                          new Date(apt.dateTime).getFullYear() ===
                            new Date().getFullYear(),
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o especialización..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="card-modern">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="loading-shimmer h-6 rounded"></div>
                    <div className="loading-shimmer h-4 rounded"></div>
                    <div className="loading-shimmer h-4 w-2/3 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredWorkers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm
                  ? "No se encontraron trabajadores"
                  : "No hay trabajadores registrados"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Comienza agregando tu primer trabajador"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Trabajador
                </Button>
              )}
            </div>
          ) : (
            filteredWorkers.map((worker) => {
              const dateRange =
                startDate && endDate
                  ? {
                      startDate: new Date(startDate),
                      endDate: new Date(endDate),
                    }
                  : undefined;
              const stats = getWorkerStats(
                worker.id,
                dateRange?.startDate,
                dateRange?.endDate,
              );

              return (
                <Card
                  key={worker.id}
                  className="card-modern hover:shadow-lg transition-all duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {worker.firstName} {worker.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {worker.specialization || "Sin especialización"}
                          </p>
                          {worker.workerType && (
                            <p className="text-xs text-primary font-medium">
                              {worker.workerType}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={
                            worker.isActive ? "status-success" : "status-error"
                          }
                        >
                          {worker.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                        {worker.hasSystemAccess && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-600"
                          >
                            Acceso Sistema
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium truncate">
                          {worker.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tel:</span>
                        <span className="font-medium">{worker.phone}</span>
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {stats.completedAppointments}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Citas completadas
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          S/ {stats.totalRevenue.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ingresos totales
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          S/ {stats.totalBonuses.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Bonos ganados
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">
                          {stats.salesCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Ventas</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => openViewDialog(worker)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        onClick={() => openEditDialog(worker)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span className="text-sm font-medium">Estado:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {worker.isActive ? "Activo" : "Inactivo"}
                        </span>
                        <Switch
                          checked={worker.isActive}
                          onCheckedChange={() => handleToggleStatus(worker.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add Worker Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Nuevo Trabajador
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Carlos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder="Rodríguez"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="carlos@podocare.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+51 987 654 321"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Especialización</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    placeholder="Podología General"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workerType">Tipo de Trabajador</Label>
                <Select
                  value={formData.workerType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      workerType: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Trabajador activo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasSystemAccess"
                    checked={formData.hasSystemAccess}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        hasSystemAccess: checked,
                        systemPassword: checked ? formData.systemPassword : "",
                      })
                    }
                  />
                  <Label htmlFor="hasSystemAccess">
                    Permitir acceso al sistema
                  </Label>
                </div>

                {formData.hasSystemAccess && (
                  <div className="space-y-2">
                    <Label htmlFor="systemPassword">
                      Contraseña del Sistema
                    </Label>
                    <Input
                      id="systemPassword"
                      type="password"
                      value={formData.systemPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          systemPassword: e.target.value,
                        })
                      }
                      placeholder="Contraseña para acceder al sistema"
                    />
                    <p className="text-xs text-muted-foreground">
                      Si se deja vacío, se generará una contraseña automática
                    </p>
                  </div>
                )}
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
                onClick={handleAddWorker}
                className="btn-primary"
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.email ||
                  !formData.phone
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Trabajador
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Worker Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Trabajador
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">Nombres *</Label>
                  <Input
                    id="editFirstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Apellidos *</Label>
                  <Input
                    id="editLastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Teléfono *</Label>
                  <Input
                    id="editPhone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSpecialization">Especialización</Label>
                  <Input
                    id="editSpecialization"
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editWorkerType">Tipo de Trabajador</Label>
                <Select
                  value={formData.workerType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      workerType: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editIsActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="editIsActive">Trabajador activo</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="editHasSystemAccess"
                    checked={formData.hasSystemAccess}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        hasSystemAccess: checked,
                        systemPassword: checked ? formData.systemPassword : "",
                      })
                    }
                  />
                  <Label htmlFor="editHasSystemAccess">
                    Permitir acceso al sistema
                  </Label>
                </div>

                {formData.hasSystemAccess && (
                  <div className="space-y-2">
                    <Label htmlFor="editSystemPassword">
                      Contraseña del Sistema
                    </Label>
                    <Input
                      id="editSystemPassword"
                      type="password"
                      value={formData.systemPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          systemPassword: e.target.value,
                        })
                      }
                      placeholder="Nueva contraseña (dejar vacío para mantener actual)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dejar vacío para mantener la contraseña actual
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedWorker(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditWorker}
                className="btn-primary"
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.email ||
                  !formData.phone
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Worker Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Perfil del Trabajador
              </DialogTitle>
            </DialogHeader>

            {selectedWorker && (
              <div className="space-y-6 py-4">
                {/* Worker Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Información Personal
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Nombre Completo
                        </Label>
                        <p className="font-medium">
                          {selectedWorker.firstName} {selectedWorker.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Email
                        </Label>
                        <p className="font-medium">{selectedWorker.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Teléfono
                        </Label>
                        <p className="font-medium">{selectedWorker.phone}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Especialización
                        </Label>
                        <p className="font-medium">
                          {selectedWorker.specialization ||
                            "Sin especialización"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Tipo de Trabajador
                        </Label>
                        <p className="font-medium">
                          {selectedWorker.workerType || "No especificado"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Estado
                        </Label>
                        <Badge
                          variant="outline"
                          className={
                            selectedWorker.isActive
                              ? "status-success"
                              : "status-error"
                          }
                        >
                          {selectedWorker.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Estadísticas de Rendimiento
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const dateRange =
                          startDate && endDate
                            ? {
                                startDate: new Date(startDate),
                                endDate: new Date(endDate),
                              }
                            : undefined;
                        const stats = getWorkerStats(
                          selectedWorker.id,
                          dateRange?.startDate,
                          dateRange?.endDate,
                        );
                        return (
                          <>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Total de Citas
                              </Label>
                              <p className="font-medium">
                                {stats.totalAppointments}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Citas Completadas
                              </Label>
                              <p className="font-medium">
                                {stats.completedAppointments}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Ingresos por Citas
                              </Label>
                              <p className="font-medium">
                                S/ {stats.totalEarnings.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Bonos por Medicamentos
                              </Label>
                              <p className="font-medium text-green-600">
                                S/ {stats.totalBonuses.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Total de Ventas
                              </Label>
                              <p className="font-medium">{stats.salesCount}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Ingresos Totales
                              </Label>
                              <p className="font-medium text-lg">
                                S/ {stats.totalRevenue.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Promedio por Cita
                              </Label>
                              <p className="font-medium">
                                S/ {stats.averagePerAppointment.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Trabajador desde
                              </Label>
                              <p className="font-medium">
                                {new Date(
                                  selectedWorker.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Recent Appointments */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Citas Recientes
                  </h3>
                  {(() => {
                    const appointments = getMockAppointments()
                      .filter((apt) => apt.workerId === selectedWorker.id)
                      .sort(
                        (a, b) =>
                          new Date(b.dateTime).getTime() -
                          new Date(a.dateTime).getTime(),
                      )
                      .slice(0, 5);

                    return appointments.length > 0 ? (
                      <div className="space-y-3">
                        {appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">
                                {appointment.patient?.firstName}{" "}
                                {appointment.patient?.lastName}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(
                                  appointment.dateTime,
                                ).toLocaleDateString()}{" "}
                                - {appointment.treatmentNotes || "Sin notas"}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                appointment.status === "completed" &&
                                  "status-success",
                                appointment.status === "scheduled" &&
                                  "status-info",
                                appointment.status === "cancelled" &&
                                  "status-error",
                              )}
                            >
                              {appointment.status === "completed" &&
                                "Completada"}
                              {appointment.status === "scheduled" &&
                                "Programada"}
                              {appointment.status === "cancelled" &&
                                "Cancelada"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No hay citas registradas
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedWorker) {
                    openEditDialog(selectedWorker);
                    setIsViewDialogOpen(false);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  setSelectedWorker(null);
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

export default Workers;
