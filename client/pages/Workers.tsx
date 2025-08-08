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
import { Pagination, usePagination } from "@/components/ui/pagination";
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
  stats?: Partial<WorkerStats>;
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

function formatDateLima(d: Date) {
  const lima = new Date(d.toLocaleString("en-US", { timeZone: "America/Lima" }));
  const y = lima.getFullYear();
  const m = String(lima.getMonth() + 1).padStart(2, "0");
  const day = String(lima.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getSafeStats(stats?: Partial<WorkerStats>): WorkerStats {
  return {
    totalAppointments: Number(stats?.totalAppointments ?? 0),
    completedAppointments: Number(stats?.completedAppointments ?? 0),
    thisMonthAppointments: Number(stats?.thisMonthAppointments ?? 0),
    totalEarnings: Number(stats?.totalEarnings ?? 0),
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    totalCommissions: Number(stats?.totalCommissions ?? 0),
    salesCount: Number(stats?.salesCount ?? 0),
    averagePerAppointment: Number(stats?.averagePerAppointment ?? 0),
  };
}

export function Workers() {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
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

  // Server-side pagination
  const pagination = usePagination({ totalItems, initialPageSize: 9 });

  const user = JSON.parse(localStorage.getItem("podocare_user") || "{}");
  const isAdmin = user.role === "admin";

  // Fechas por defecto (mes actual) en zona America/Lima
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(formatDateLima(firstDay));
    setEndDate(formatDateLima(lastDay));
  }, []);

  // Cargar del servidor cuando cambie: página, pageSize, fechas, búsqueda, estado
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, navigate, pagination.currentPage, pagination.pageSize, startDate, endDate, searchTerm, statusFilter]);

  const loadWorkers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.currentPage),
        limit: String(pagination.pageSize),
      });
      if (startDate) params.append("statsStart", startDate);
      if (endDate) params.append("statsEnd", endDate);
      if (searchTerm.trim()) params.append("q", searchTerm.trim());     // implementa en backend si aún no
      if (statusFilter !== "all") params.append("status", statusFilter); // implementa en backend si aún no

      const resp = await apiGet<WorkersResponse>(`/user?${params.toString()}`);
      if (!resp.error && resp.data) {
        const { data, total, page, limit } = resp.data.data;
        setWorkers(data || []);
        setTotalItems(Number(total || 0));

        // Asegura que el paginador quede alineado si el backend ajusta page/limit
        if (pagination.currentPage !== page) pagination.goToPage(page);
        if (pagination.pageSize !== limit) pagination.setPageSize(limit);
      }
    } catch (error) {
      console.error("Error loading workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Al cambiar búsqueda/estado, volver a la página 1
  useEffect(() => {
    pagination.goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, startDate, endDate]);

  const handleToggleStatus = async (id: string) => {
    const worker = workers.find((w) => w.id === id);
    if (!worker) return;
    try {
      const resp = await apiPut(`/user/${id}`, { active: !worker.active });
      if (!resp.error) {
        // Refresca la página actual del listado
        loadWorkers();
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
        // vuelve a cargar desde el inicio para que aparezca el nuevo
        pagination.goToPage(1);
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

  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize));

  return (
    <Layout title="Gestión de Trabajadores" subtitle="Administra el personal de tu clínica">
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>

          <Button onClick={() => setIsAddDialogOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Trabajador
          </Button>
        </div>

        {/* Date Range Filter */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-row gap-4 items-center">
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
                  autoComplete="off"
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
                  autoComplete="off"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="mt-6"
                size="sm"
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards (nota: suman solo la página actual a menos que tu API devuelva agregados globales) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Trabajadores (página)</p>
                  <p className="text-3xl font-bold text-foreground">{workers.length}</p>
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Activos (página)</p>
                  <p className="text-3xl font-bold text-foreground">{workers.filter((w) => w.active).length}</p>
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Inactivos (página)</p>
                  <p className="text-3xl font-bold text-foreground">{workers.filter((w) => !w.active).length}</p>
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Citas Este Mes (página)</p>
                  <p className="text-3xl font-bold text-foreground">
                    {workers.reduce((sum, w) => sum + getSafeStats(w.stats).thisMonthAppointments, 0)}
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
                  autoComplete="off"
                  name="search-field"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
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
          {!isLoading && workers.length === 0 && (
            <p className="text-center text-muted-foreground">No se encontraron trabajadores.</p>
          )}

          {workers.map((worker) => {
            const stats = getSafeStats(worker.stats);
            return (
              <Card key={worker.id} className="card-modern hover:shadow-lg transition-all duration-200">
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
                        <p className="text-sm text-muted-foreground capitalize">{worker.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={worker.active ? "status-success" : "status-error"}
                      >
                        {worker.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Usuario:</span>
                      <span className="font-medium truncate">{worker.username}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Rol:</span>
                      <span className="font-medium capitalize">{worker.role}</span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{stats.completedAppointments}</p>
                      <p className="text-xs text-muted-foreground">Citas completadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">S/ {Number(stats.totalRevenue).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Ingresos totales</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">S/ {Number(stats.totalCommissions).toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Bonos ganados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{stats.salesCount}</p>
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
                      <Switch checked={worker.active} onCheckedChange={() => handleToggleStatus(worker.id)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
            showPageSizeSelector
            pageSizeOptions={[6, 9, 12, 18]}
          />
        )}

        {/* Add Worker Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(o) => { setIsAddDialogOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Nuevo Trabajador
              </DialogTitle>
            </DialogHeader>

            {/* Anti-autofill */}
            <input type="text" name="fake-user" autoComplete="username" className="hidden" />
            <input type="password" name="fake-pass" autoComplete="new-password" className="hidden" />

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Carlos"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Rodríguez"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Usuario *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="carlos"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="******"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "trabajador" })}
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
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddWorker}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Worker Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(o) => {
            setIsEditDialogOpen(o);
            if (!o) {
              setSelectedWorker(null);
              resetForm();
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Editar Trabajador
              </DialogTitle>
            </DialogHeader>

            {/* Anti-autofill */}
            <input type="text" name="fake-user-edit" autoComplete="username" className="hidden" />
            <input type="password" name="fake-pass-edit" autoComplete="new-password" className="hidden" />

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
                <Label htmlFor="edit-password">Contraseña</Label>
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
                  onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "trabajador" })}
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
      </div>
    </Layout>
  );
}

export default Workers;
