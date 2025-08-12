import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import {
  Calendar,
  Plus,
  Search,
  Edit,
  Eye,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Save,
  DollarSign,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";

// 🔗 APIs
import { Appointment, CreateAppointmentRequest, Patient, PatientListItem } from "@shared/api";
import { todayISODate } from "@shared/time";
import { AppointmentRepository } from "@/lib/api/appointment";
import { PatientRepository } from "@/lib/api/patient";
import { WorkerRepository } from "@/lib/api/worker";
import { AppointmentDetailStory } from "@/components/appointments/AppointmentDetailStory";

/* =========================
 *  Tipos y Hooks de Auth
 * ========================= */
interface User {
  id: string;
  role: "admin" | "worker";
  // Si manejas multi-tenant y necesitas enviar tenantId, agrega:
  // tenantId?: string;
}

const useAuth = () => {
  const [user] = useState<User | null>(() => {
    const stored = localStorage.getItem("podocare_user");
    return stored ? JSON.parse(stored) : null;
  });
  return { user };
};

/* =========================
 *  Config visual de estados
 * ========================= */
const statusConfig = {
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

export function Appointments() {
  /* =========================
   *  Setup & repos
   * ========================= */
  const { user } = useAuth();
  const navigate = useNavigate();

  const appointmentRepository = useMemo(() => new AppointmentRepository(), []);
  const patientRepository = useMemo(() => new PatientRepository(), []);
  const workerRepository = useMemo(() => new WorkerRepository(), []);
  const today = todayISODate();

  /* =========================
   *  Filtros y estado UI
   * ========================= */
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(today);
  const [workerFilter, setWorkerFilter] = useState<string>("all");

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);

  // Paginación basada en repos
  const pagination = useRepositoryPagination<Appointment>({
    initialPageSize: 15,
  });

  /* =========================
   *  Formularios
   * ========================= */
  // Form cita (crear/editar)
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    patientId: "",
    workerId: "",
    dateTime: "",
    duration: 60,
    treatmentNotes: "",
    diagnosis: "",
  });

  // Form pago — SOLO método (según UpdatePaymentDto)
  const [paymentFormData, setPaymentFormData] = useState<{
    method: "cash" | "transfer" | "yape" | "pos";
  }>({
    method: "cash",
  });

  /* =========================
   *  Effects: carga inicial y cambios en filtros/paginación
   * ========================= */
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage,
    pagination.pageSize,
    pagination.searchTerm,
    statusFilter,
    dateFilter,
    workerFilter,
  ]);

  /* =========================
   *  Data loaders
   * ========================= */
  const loadInitialData = async () => {
    try {
      const [patientsResponse, workersResponse] = await Promise.all([
        patientRepository.getAll({ limit: 1000 }),
        workerRepository.getAll({ limit: 1000 }),
      ]);
      setPatients(patientsResponse.items);
      setWorkers(workersResponse.items);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadAppointments = async () => {
    const filters: any = {
      ...pagination.filters,
    };

    if (statusFilter !== "all") filters.status = statusFilter;
    if (dateFilter) filters.date = dateFilter;

    // Si es worker, solo ve sus citas a menos que admin filtre uno
    if (workerFilter !== "all") {
      filters.userId = workerFilter;
    } else if (user?.role === "worker") {
      filters.userId = user.id;
    }

    // Actualiza los filtros y fuerza a que la carga use los más recientes
    pagination.setFilters(filters);
    await pagination.loadData((params) =>
      appointmentRepository.getAll({ ...params, ...filters }),
    );
  };

  /* =========================
   *  Actions: CRUD citas
   * ========================= */
  const handleAddAppointment = async () => {
    try {
      await appointmentRepository.create(formData);
      setIsAddDialogOpen(false);
      resetForm();
      await loadAppointments();
      toast({ title: "Cita creada exitosamente" });
    } catch (error) {
      console.error("Error adding appointment:", error);
      toast({ title: "Error al crear la cita", variant: "destructive" });
    }
  };

  const handleEditAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      await appointmentRepository.update(selectedAppointment.id, formData);
      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
      resetForm();
      await loadAppointments();
      toast({ title: "Cita actualizada" });
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast({ title: "Error al actualizar la cita", variant: "destructive" });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await appointmentRepository.delete(appointmentId);
      await loadAppointments();
      toast({ title: "Cita cancelada exitosamente" });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast({ title: "Error al cancelar la cita", variant: "destructive" });
    }
  };

  /* =========================
   *  Pago: abrir y enviar
   * ========================= */
  const openPaymentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPaymentFormData({ method: "cash" });
    setIsPaymentDialogOpen(true);
  };

  // ⚠️ Requiere que tu AppointmentRepository tenga:
  // async updatePayment(id: string, data: { paymentMethod: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance"; tenantId?: string }) {
  //   return this.client.put(`/appointment/${id}/payment`, data);
  // }
  const handlePaymentSubmit = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentRepository.updatePayment(selectedAppointment.id, {
        paymentMethod: paymentFormData.method,
        // tenantId: user?.tenantId, // <-- Descomenta si manejas tenantId en el frontend
      });

      toast({ title: "Pago registrado exitosamente" });

      // Cerrar y refrescar
      setIsPaymentDialogOpen(false);
      setSelectedAppointment(null);
      setPaymentFormData({ method: "cash" });
      await loadAppointments();
    } catch (error) {
      console.error("Error registrando pago:", error);
      toast({ title: "Error al registrar el pago", variant: "destructive" });
    }
  };

  /* =========================
   *  Utils UI
   * ========================= */
  const resetForm = () => {
    setFormData({
      patientId: "",
      workerId: "",
      dateTime: "",
      duration: 60,
      treatmentNotes: "",
      diagnosis: "",
    });
  };

  const openEditDialog = (appointment: Appointment) => {
    navigate(`/appointments/${appointment.id}/edit`);
  };

  const openViewDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString("es-ES", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  // Para tarjetas de “Hoy”
  const appointments = pagination.data;

  if (!user) return null;

  /* =========================
   *  Render
   * ========================= */
  return (
    <Layout
      title="Gestión de Citas"
      subtitle="Programa y administra las citas de tus pacientes"
    >
      <div className="p-6 space-y-6">
        {/* ===== Header Actions ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>

          <Button
            onClick={() => navigate("/appointments/new")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Cita
          </Button>
        </div>

        {/* ===== Quick Stats ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hoy</p>
                  <p className="font-semibold">
                    {appointments.filter((a) => a.dateTime?.startsWith(today)).length} citas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagadas</p>
                  <p className="font-semibold">
                    {appointments.filter((a) => a.status === "paid").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registradas</p>
                  <p className="font-semibold">
                    {appointments.filter((a) => a.status === "registered").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Canceladas</p>
                  <p className="font-semibold">
                    {appointments.filter((a) => a.status === "canceled").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Filtros ===== */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, trabajador..."
                  value={pagination.searchTerm}
                  onChange={(e) => pagination.setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="registered">Registradas</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="canceled">Canceladas</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrar por fecha"
              />

              {user.role === "admin" && (
                <Select value={workerFilter} onValueChange={setWorkerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Trabajador" />
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
              )}

              <Button
                variant="outline"
                onClick={() => {
                  pagination.setSearchTerm("");
                  setStatusFilter("all");
                  setDateFilter("");
                  setWorkerFilter("all");
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===== Tabla de Citas ===== */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Citas ({pagination.totalItems})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pagination.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-16 rounded"></div>
                ))}
              </div>
            ) : pagination.data.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No hay citas
                </h3>
                <p className="text-muted-foreground mb-6">
                  {pagination.searchTerm || statusFilter !== "all" || dateFilter
                    ? "No se encontraron citas con los filtros aplicados"
                    : "No hay citas programadas"}
                </p>
                <Button
                  onClick={() => navigate("/appointments/new")}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Programar Primera Cita
                </Button>
              </div>
            ) : (
              <>
                {/* Paginación */}
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.goToPage}
                  onPageSizeChange={pagination.setPageSize}
                  showPageSizeSelector={true}
                  pageSizeOptions={[10, 15, 25, 50]}
                />

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha & Hora</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Trabajador</TableHead>
                        <TableHead>Diagnóstico</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.data.map((appointment) => {
                        const { date, time } = formatDateTime(
                          appointment.dateTime || appointment.createdAt,
                        );
                        const statusInfo = statusConfig[appointment.status];
                        const StatusIcon = statusInfo?.icon || Clock;

                        return (
                          <TableRow
                            key={appointment.id}
                            className={cn(
                              "cursor-pointer",
                              appointment.status === "canceled" && "opacity-50"
                            )}
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium">{date}</p>
                                <p className="text-sm text-muted-foreground">{time}</p>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {appointment.patient?.firstName} {appointment.patient?.paternalSurname} {appointment.patient?.maternalSurname}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {appointment.patient?.phone}
                                  </p>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {appointment.worker?.firstName} {appointment.worker?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.worker?.username}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell>{appointment.diagnosis}</TableCell>

                            <TableCell>
                              <span className="text-sm">S/ {appointment.appointmentPrice}</span>
                            </TableCell>

                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("gap-1", statusInfo?.className || "")}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo?.label || "Desconocido"}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => openViewDialog(appointment)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>

                                {appointment.status === "registered" && (
                                  <>
                                    <Button
                                      onClick={() => openEditDialog(appointment)}
                                      variant="outline"
                                      size="sm"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      onClick={() => openPaymentDialog(appointment)}
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                                    >
                                      <DollarSign className="w-4 h-4" />
                                    </Button>

                                    <Button
                                      onClick={() => handleDeleteAppointment(appointment.id)}
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ===== Diálogo: Crear Cita ===== */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Nueva Cita
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">Paciente *</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.paternalSurname} {patient.maternalSurname} -{" "}
                          {patient.documentType}: {patient.documentNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workerId">Trabajador *</Label>
                  <Select
                    value={formData.workerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, workerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar trabajador" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.firstName} {worker.lastName} - {worker.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateTime">Fecha y Hora *</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dateTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatmentNotes">Notas del Tratamiento</Label>
                <Textarea
                  id="treatmentNotes"
                  value={formData.treatmentNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, treatmentNotes: e.target.value })
                  }
                  placeholder="Describe el tratamiento planificado..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                  placeholder="Diagnóstico preliminar o confirmado"
                />
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
                onClick={handleAddAppointment}
                className="btn-primary"
                disabled={
                  !formData.patientId || !formData.workerId || !formData.dateTime
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Programar Cita
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== Diálogo: Editar Cita ===== */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Cita
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPatientId">Paciente *</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, patientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.paternalSurname} {patient.maternalSurname} - {patient.documentType}: {patient.documentNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editWorkerId">Trabajador *</Label>
                  <Select
                    value={formData.workerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, workerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.firstName} {worker.lastName} - {worker.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editDateTime">Fecha y Hora *</Label>
                  <Input
                    id="editDateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dateTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editDuration">Duración (minutos) *</Label>
                  <Select
                    value={formData.duration.toString()}
                    onValueChange={(value) =>
                      setFormData({ ...formData, duration: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTreatmentNotes">Notas del Tratamiento</Label>
                <Textarea
                  id="editTreatmentNotes"
                  value={formData.treatmentNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, treatmentNotes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDiagnosis">Diagnóstico</Label>
                <Input
                  id="editDiagnosis"
                  value={formData.diagnosis}
                  onChange={(e) =>
                    setFormData({ ...formData, diagnosis: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedAppointment(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditAppointment}
                className="btn-primary"
                disabled={
                  !formData.patientId || !formData.workerId || !formData.dateTime
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ===== Diálogo: Ver Cita ===== */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent
            className="
      w-[95vw] sm:w-full
      sm:max-w-[980px] md:max-w-[1040px]
      p-0
    "
          >
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="flex items-center justify-between pr-6">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Detalle de Cita (Historia Clínica)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedAppointment) {
                        openEditDialog(selectedAppointment);
                        setIsViewDialogOpen(false);
                      }
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  {/* opcional */}
                  {/* <Button size="sm" onClick={() => window.print()} className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            Imprimir
          </Button> */}
                </div>
              </DialogTitle>
            </DialogHeader>

            {/* Contenedor con scroll y padding interno */}
            <div className="max-h-[78vh] overflow-y-auto px-6 pb-6 pt-4">
              {selectedAppointment && (
                <AppointmentDetailStory
                  appt={selectedAppointment}
                  statusConfig={statusConfig}
                />
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedAppointment(null);
                  }}
                  className="btn-primary"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>



        {/* ===== Diálogo: Pago ===== */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Registrar Pago
              </DialogTitle>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4 py-4">
                {/* Info de la cita */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">
                    {selectedAppointment.patient?.firstName}{" "}
                    {selectedAppointment.patient?.paternalSurname}{" "}
                    {selectedAppointment.patient?.maternalSurname} -{" "}
                    {selectedAppointment.patient?.documentType}:{" "}
                    {selectedAppointment.patient?.documentNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedAppointment.dateTime).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(selectedAppointment.dateTime).toLocaleTimeString(
                      "es-ES",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>

                {/* Form de pago (solo método) */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago *</Label>
                  <Select
                    value={paymentFormData.method}
                    onValueChange={(value: "cash" | "transfer" | "yape" | "pos") =>
                      setPaymentFormData({ method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="pos">POS (tarjeta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPaymentDialogOpen(false);
                  setSelectedAppointment(null);
                  setPaymentFormData({ method: "cash" });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePaymentSubmit}
                className="btn-primary"
                disabled={!selectedAppointment}
              >
                <Save className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Appointments;
