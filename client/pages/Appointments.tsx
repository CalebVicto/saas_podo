import React, { useState, useEffect, useMemo } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  Search,
  Filter,
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
import { Appointment, CreateAppointmentRequest, PatientListItem, Payment } from "@shared/api";
import { AppointmentRepository } from "@/lib/api/appointment";
import { PatientRepository } from "@/lib/api/patient";
import { WorkerRepository } from "@/lib/api/worker";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";

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
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    className: "status-error",
  },
};

export function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const appointmentRepository = useMemo(() => new AppointmentRepository(), []);
  const patientRepository = useMemo(() => new PatientRepository(), []);
  const workerRepository = useMemo(() => new WorkerRepository(), []);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);

  // Repository-based pagination
  const pagination = useRepositoryPagination<Appointment>({
    initialPageSize: 15,
  });

  // Form state for new/edit appointment
  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    patientId: "",
    workerId: "",
    dateTime: "",
    duration: 60,
    treatmentNotes: "",
    diagnosis: "",
  });

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    method: "cash" as const,
    notes: "",
  });

  // Load initial data
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadInitialData();
  }, [user, navigate]);

  // Load appointments whenever pagination or filters change
  useEffect(() => {
    loadAppointments();
  }, [
    pagination.currentPage,
    pagination.pageSize,
    pagination.searchTerm,
    statusFilter,
    dateFilter,
    workerFilter,
  ]);

  const loadInitialData = async () => {
    try {
      // Load patients and workers for dropdowns
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

    // Add custom filters
    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }
    if (dateFilter) {
      filters.date = dateFilter;
    }
    if (workerFilter !== "all") {
      filters.userId = workerFilter;
    } else if (user?.role === "worker") {
      // Workers only see their own appointments
      filters.userId = user.id;
    }

    pagination.setFilters(filters);
    await pagination.loadData((params) => appointmentRepository.getAll(params));
  };

  const handleAddAppointment = async () => {
    try {
      await appointmentRepository.create(formData);
      setIsAddDialogOpen(false);
      resetForm();
      // Refresh the data
      await loadAppointments();
    } catch (error) {
      console.error("Error adding appointment:", error);
    }
  };

  const handleEditAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await appointmentRepository.update(selectedAppointment.id, formData);
      setIsEditDialogOpen(false);
      setSelectedAppointment(null);
      resetForm();
      // Refresh the data
      await loadAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
    }
  };

  const handleUpdateStatus = async (
    appointmentId: string,
    newStatus: Appointment["status"],
  ) => {
    try {
      await appointmentRepository.update(appointmentId, { status: newStatus });
      // Refresh the data
      await loadAppointments();
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  const openPaymentDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPaymentFormData({
      amount: 0,
      method: "cash",
      notes: "",
    });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedAppointment || paymentFormData.amount <= 0) return;

    try {
      // In a real app, this would create a payment record
      const payment: Payment = {
        id: Date.now().toString(),
        amount: paymentFormData.amount,
        method: paymentFormData.method,
        status: "completed",
        notes: paymentFormData.notes,
        appointmentId: selectedAppointment.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Payment created:", payment);

      // Close dialog and reset
      setIsPaymentDialogOpen(false);
      setSelectedAppointment(null);
      setPaymentFormData({
        amount: 0,
        method: "cash",
        notes: "",
      });

      // Show success message
      toast({ title: "Pago registrado exitosamente" });
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({ title: "Error al registrar el pago", variant: "destructive" });
    }
  };

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
    setSelectedAppointment(appointment);
    setFormData({
      patientId: appointment.patientId,
      workerId: appointment.workerId,
      dateTime: appointment.dateTime.slice(0, 16), // Format for datetime-local input
      duration: appointment.duration,
      treatmentNotes: appointment.treatmentNotes || "",
      diagnosis: appointment.diagnosis || "",
    });
    setIsEditDialogOpen(true);
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

  // Get today's date for filtering
  const today = new Date().toISOString().split("T")[0];
  const appointments = pagination.data;

  if (!user) return null;

  return (
    <Layout
      title="Gestión de Citas"
      subtitle="Programa y administra las citas de tus pacientes"
    >
      <div className="p-6 space-y-6">
        {/* Header Actions */}
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

        {/* Quick Stats */}
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
                    {
                      appointments.filter((a) => a.dateTime?.startsWith(today))
                        .length
                    }{" "}
                    citas
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
                    {
                      appointments.filter((a) => a.status === "paid")
                        .length
                    }
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
                    {
                      appointments.filter((a) => a.status === "registered")
                        .length
                    }
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
                    {
                      appointments.filter((a) => a.status === "cancelled")
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                  <SelectItem value="cancelled">Canceladas</SelectItem>
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

        {/* Appointments Table */}
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
                  onClick={() => setIsAddDialogOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Programar Primera Cita
                </Button>
              </div>
            ) : (
              <>
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
                          appointment.dateTime,
                        );
                        const statusInfo = statusConfig[appointment.status];
                        const StatusIcon = statusInfo?.icon || Clock;

                        return (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{date}</p>
                                <p className="text-sm text-muted-foreground">
                                  {time}
                                </p>
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
                                {appointment.status === "registered" && (
                                  <>
                                    <Button
                                      onClick={() =>
                                        handleUpdateStatus(
                                          appointment.id,
                                          "paid",
                                        )
                                      }
                                      variant="outline"
                                      size="sm"
                                      className="text-success border-success hover:bg-success hover:text-success-foreground"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleUpdateStatus(
                                          appointment.id,
                                          "cancelled",
                                        )
                                      }
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

                {/* Pagination */}
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Appointment Dialog */}
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
                          {worker.firstName} {worker.lastName} -{" "}
                          {worker.specialization}
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
                  <Label htmlFor="duration">Duraci��n (minutos) *</Label>
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
                  placeholder="Diagn��stico preliminar o confirmado"
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
                  !formData.patientId ||
                  !formData.workerId ||
                  !formData.dateTime
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Programar Cita
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Appointment Dialog */}
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
                          {patient.firstName} {patient.lastName} -{" "}
                          {patient.documentId}
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
                          {worker.firstName} {worker.lastName} -{" "}
                          {worker.specialization}
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
                <Label htmlFor="editTreatmentNotes">
                  Notas del Tratamiento
                </Label>
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
                  !formData.patientId ||
                  !formData.workerId ||
                  !formData.dateTime
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Appointment Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles de la Cita
              </DialogTitle>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Información de la Cita
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Fecha y Hora
                        </Label>
                        <p className="font-medium">
                          {(() => {
                            const { date, time } = formatDateTime(
                              selectedAppointment.dateTime,
                            );
                            return `${date} a las ${time}`;
                          })()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Duración
                        </Label>
                        <p className="font-medium">
                          {selectedAppointment.duration} minutos
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Estado
                        </Label>
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1",
                            statusConfig[selectedAppointment.status].className,
                          )}
                        >
                          {statusConfig[selectedAppointment.status].label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Participantes
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Paciente
                        </Label>
                        <p className="font-medium">
                          {selectedAppointment.patient?.firstName}{" "}
                          {selectedAppointment.patient?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAppointment.patient?.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Trabajador
                        </Label>
                        <p className="font-medium">
                          {selectedAppointment.worker?.firstName}{" "}
                          {selectedAppointment.worker?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAppointment.worker?.specialization}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAppointment.diagnosis && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Diagnóstico
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm">{selectedAppointment.diagnosis}</p>
                    </div>
                  </div>
                )}

                {selectedAppointment.treatmentNotes && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Notas del Tratamiento
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {selectedAppointment.treatmentNotes}
                      </p>
                    </div>
                  </div>
                )}

                {selectedAppointment.payment && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Información de Pago
                    </h3>
                    <div className="bg-success/10 p-4 rounded-lg border border-success/20">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Monto pagado:</span>
                        <span className="font-semibold text-success">
                          S/ {selectedAppointment.payment.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm">Método:</span>
                        <span className="text-sm font-medium capitalize">
                          {selectedAppointment.payment.method}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
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
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Registrar Pago
              </DialogTitle>
            </DialogHeader>

            {selectedAppointment && (
              <div className="space-y-4 py-4">
                {/* Appointment Info */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="font-medium">
                    {selectedAppointment.patient?.firstName}{" "}
                    {selectedAppointment.patient?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(
                      selectedAppointment.dateTime,
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(selectedAppointment.dateTime).toLocaleTimeString(
                      "es-ES",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>

                {/* Payment Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentAmount">Monto *</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentFormData.amount}
                      onChange={(e) =>
                        setPaymentFormData({
                          ...paymentFormData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Método de Pago *</Label>
                    <Select
                      value={paymentFormData.method}
                      onValueChange={(value: any) =>
                        setPaymentFormData({
                          ...paymentFormData,
                          method: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="yape">Yape</SelectItem>
                        <SelectItem value="plin">Plin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentNotes">Notas</Label>
                    <Textarea
                      id="paymentNotes"
                      value={paymentFormData.notes}
                      onChange={(e) =>
                        setPaymentFormData({
                          ...paymentFormData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Notas adicionales sobre el pago..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsPaymentDialogOpen(false);
                  setSelectedAppointment(null);
                  setPaymentFormData({
                    amount: 0,
                    method: "cash",
                    notes: "",
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePaymentSubmit}
                className="btn-primary"
                disabled={!selectedAppointment || paymentFormData.amount <= 0}
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
