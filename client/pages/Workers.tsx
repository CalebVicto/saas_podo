import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Edit,
  Eye,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Layout from "@/components/Layout";
import {
  Pagination,
  usePagination,
} from "@/components/ui/pagination";
import { apiGet, apiPut, apiPost } from "@/lib/auth";

interface WorkerStats {
  totalAppointments: number;
  completedAppointments: number;
  thisMonthAppointments: number;
  totalEarnings: number;
  totalRevenue: number;
  totalCommissions: number;
  salesCount: number;
  averagePerAppointment: number;
}

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
  stats: WorkerStats;
}

interface CreateWorkerRequest {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: "admin" | "trabajador";
  active: boolean;
}

interface WorkersResponse {
  state: string;
  message: string;
  data: {
    data: Worker[];
    total: number;
    page: number;
    limit: number;
  };
}

export function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateWorkerRequest>({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    role: "trabajador",
    active: true,
  });

  const pagination = usePagination({
    totalItems: filteredWorkers.length,
    initialPageSize: 9,
  });

  const user = JSON.parse(localStorage.getItem("podocare_user") || "{}");
  const isAdmin = user.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadWorkers();
  }, [isAdmin, navigate, startDate, endDate]);

  useEffect(() => {
    let filtered = workers;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (w) =>
          w.firstName.toLowerCase().includes(term) ||
          w.lastName.toLowerCase().includes(term) ||
          w.username.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "all") {
      const active = statusFilter === "active";
      filtered = filtered.filter((w) => w.active === active);
    }
    setFilteredWorkers(filtered);
    pagination.resetPagination();
  }, [workers, searchTerm, statusFilter, pagination]);

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "1000" });
      if (startDate) params.append("statsStart", startDate);
      if (endDate) params.append("statsEnd", endDate);
      const resp = await apiGet<WorkersResponse>(`/user?${params.toString()}`);
      if (!resp.error && resp.data) {
        setWorkers(resp.data.data.data);
      }
    } catch (error) {
      console.error("Error loading workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const worker = workers.find((w) => w.id === id);
    if (!worker) return;
    try {
      const resp = await apiPut(`/user/${id}`, { active: !worker.active });
      if (!resp.error) {
        setWorkers(
          workers.map((w) =>
            w.id === id ? { ...w, active: !w.active } : w,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating worker status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      role: "trabajador",
      active: true,
    });
  };

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setFormData({
      firstName: worker.firstName,
      lastName: worker.lastName,
      username: worker.username,
      password: "",
      role: worker.role,
      active: worker.active,
    });
    setIsEditDialogOpen(true);
  };

  const handleAddWorker = async () => {
    try {
      const payload = {
        ...formData,
        tenantId: user.tenantId,
        newPassword: true,
      };
      const resp = await apiPost("/user", payload);
      if (!resp.error) {
        setIsAddDialogOpen(false);
        resetForm();
        loadWorkers();
      }
    } catch (error) {
      console.error("Error adding worker:", error);
    }
  };

  const handleEditWorker = async () => {
    if (!selectedWorker) return;
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        role: formData.role,
        active: formData.active,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      const resp = await apiPut(`/user/${selectedWorker.id}`, payload);
      if (!resp.error) {
        setIsEditDialogOpen(false);
        setSelectedWorker(null);
        resetForm();
        loadWorkers();
      }
    } catch (error) {
      console.error("Error updating worker:", error);
    }
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
                    {workers.filter((w) => w.active).length}
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
                    {workers.filter((w) => !w.active).length}
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
                    {workers.reduce(
                      (sum, w) => sum + (w.stats?.thisMonthAppointments ?? 0),
                      0,
                    )}
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
                  placeholder="Buscar por nombre o usuario..."
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
            </div>
          </CardContent>
        </Card>

        {/* Workers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && <p>Cargando...</p>}
          {!isLoading && filteredWorkers.length === 0 && (
            <p className="text-center text-muted-foreground">
              No se encontraron trabajadores.
            </p>
          )}

          {filteredWorkers
            .slice(pagination.startIndex, pagination.endIndex)
            .map((worker) => {
              const stats = worker.stats;
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
                          <p className="text-sm text-muted-foreground capitalize">
                            {worker.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            worker.active ? "status-success" : "status-error"
                          }
                        >
                          {worker.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Usuario:</span>
                        <span className="font-medium truncate">
                          {worker.username}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Rol:</span>
                        <span className="font-medium capitalize">
                          {worker.role}
                        </span>
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
                          S/ {stats.totalCommissions.toFixed(0)}
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
                        onClick={() => navigate(`/workers/${worker.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalle
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
                          {worker.active ? "Activo" : "Inactivo"}
                        </span>
                        <Switch
                          checked={worker.active}
                          onCheckedChange={() => handleToggleStatus(worker.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Pagination */}
        {filteredWorkers.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={filteredWorkers.length}
            pageSize={pagination.pageSize}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            showPageSizeSelector={true}
            pageSizeOptions={[6, 9, 12, 18]}
          />
        )}

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
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="carlos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="******"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as "admin" | "trabajador",
                    })
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
                <Label htmlFor="active">Activo</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddWorker}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Worker Dialog */}
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
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder="Carlos"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Apellidos *</Label>
                  <Input
                    id="edit-lastName"
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
                <Label htmlFor="edit-username">Usuario *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="carlos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Contraseña</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="******"
                />
              </div>

              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      role: value as "admin" | "trabajador",
                    })
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
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleEditWorker}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Workers;

