import React, { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CalendarPlus,
  Clock,
  User,
  Users,
  FileText,
  Save,
  ArrowLeft,
  Search,
  Check,
  Plus,
  Edit3,
  Trash2,
  X,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Bell,
  AlertCircle,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarDays,
  List,
  Grid3X3,
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Patient,
  Worker,
  ScheduleAppointmentRequest,
  ScheduledAppointment,
} from "@shared/api";
import { usePatientRepository, useWorkerRepository } from "@/lib/repositories";
import { FutureAppointmentRepository } from "@/lib/api/future-appointment";
import Layout from "@/components/Layout";

// Calendar imports
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  View,
  Views,
} from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addDays,
  startOfDay,
  endOfDay,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup the localizer for react-big-calendar with date-fns
const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface SearchableSelectProps {
  items: (Patient | Worker)[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  displayField: (item: Patient | Worker) => string;
  searchFields: (item: Patient | Worker) => string[];
  emptyText: string;
  onCreateNew?: () => void;
  createNewText?: string;
}

function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder,
  displayField,
  searchFields,
  emptyText,
  onCreateNew,
  createNewText,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;

    return items.filter((item) =>
      searchFields(item).some((field) =>
        field.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [items, searchTerm, searchFields]);

  const selectedItem = items.find((item) => item.id === value);

  const handleSelect = (item: Patient | Worker) => {
    onValueChange(item.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start font-normal"
      >
        {selectedItem ? (
          <span className="truncate">{displayField(selectedItem)}</span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{placeholder}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {onCreateNew && (
              <Button
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
                variant="outline"
                className="w-full flex items-center gap-2 border-dashed border-primary text-primary hover:bg-primary/5"
              >
                <UserPlus className="w-4 h-4" />
                {createNewText || "Crear nuevo"}
              </Button>
            )}

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{emptyText}</p>
                  {onCreateNew && (
                    <p className="text-sm mt-2">
                      ¿No encuentras lo que buscas?{" "}
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onCreateNew();
                        }}
                        className="text-primary hover:underline"
                      >
                        Crear nuevo
                      </button>
                    </p>
                  )}
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      value === item.id && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{displayField(item)}</p>
                        {"email" in item && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {item.email}
                          </p>
                        )}
                        {"documentNumber" in item && (
                          <p className="text-sm text-muted-foreground">
                            DNI: {(item as any).documentNumber}
                          </p>
                        )}
                        {"phone" in item && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {(item as any).phone}
                          </p>
                        )}
                        {"specialization" in item && item.specialization && (
                          <p className="text-sm text-muted-foreground">
                            {item.specialization}
                          </p>
                        )}
                      </div>
                      {value === item.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Create Patient Modal Component
function CreatePatientModal({
  isOpen,
  onClose,
  onPatientCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (patient: Patient) => void;
}) {
  const patientRepo = usePatientRepository();
  const [formData, setFormData] = useState<Patient & { clinicalNotes?: string }>({
    documentType: "dni",
    documentNumber: "",
    firstName: "",
    paternalSurname: "",
    maternalSurname: "",
    gender: "f",
    phone: "",
    birthDate: "",
    balance: 0,
    clinicalNotes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Nombre es requerido";
    }
    if (!formData.paternalSurname.trim()) {
      newErrors.paternalSurname = "Apellido paterno es requerido";
    }
    if (!formData.maternalSurname.trim()) {
      newErrors.maternalSurname = "Apellido materno es requerido";
    }
    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = "DNI es requerido";
    } else if (!/^\d{8}$/.test(formData.documentNumber)) {
      newErrors.documentNumber = "DNI debe tener 8 dígitos";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Teléfono es requerido";
    } else if (!/^\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Teléfono debe tener 9 dígitos";
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "Fecha de nacimiento es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const newPatient = await patientRepo.create(formData);
      onPatientCreated(newPatient);
      onClose();

      // Reset form
      setFormData({
          documentType: "dni",
          documentNumber: "",
          firstName: "",
          paternalSurname: "",
          maternalSurname: "",
          gender: "f",
          phone: "",
          birthDate: "",
          balance: 0,
          clinicalNotes: "",
        });
      setErrors({});
    } catch (error) {
      console.error("Error creating patient:", error);
      toast({ title: "Error al crear el paciente. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Crear Nuevo Paciente
          </DialogTitle>
          <DialogDescription>
            Completa la información básica del paciente para poder programar la
            cita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={cn(errors.firstName && "border-destructive")}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paternalSurname">Apellido Paterno *</Label>
              <Input
                id="paternalSurname"
                value={formData.paternalSurname}
                onChange={(e) =>
                  setFormData({ ...formData, paternalSurname: e.target.value })
                }
                className={cn(errors.paternalSurname && "border-destructive")}
              />
              {errors.paternalSurname && (
                <p className="text-sm text-destructive">{errors.paternalSurname}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maternalSurname">Apellido Materno *</Label>
              <Input
                id="maternalSurname"
                value={formData.maternalSurname}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maternalSurname: e.target.value,
                  })
                }
                className={cn(errors.maternalSurname && "border-destructive")}
              />
              {errors.maternalSurname && (
                <p className="text-sm text-destructive">
                  {errors.maternalSurname}
                </p>
              )}
            </div>

            {/* Empty placeholder for layout alignment */}
            <div></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentNumber">DNI *</Label>
              <Input
                id="documentNumber"
                value={formData.documentNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documentNumber: e.target.value,
                  })
                }
                placeholder="12345678"
                maxLength={8}
                className={cn(errors.documentNumber && "border-destructive")}
              />
              {errors.documentNumber && (
                <p className="text-sm text-destructive">{errors.documentNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="987654321"
                maxLength={9}
                className={cn(errors.phone && "border-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: "m" | "f") =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="f">Femenino</SelectItem>
                  <SelectItem value="m">Masculino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                className={cn(errors.birthDate && "border-destructive")}
              />
              {errors.birthDate && (
                <p className="text-sm text-destructive">{errors.birthDate}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicalNotes">Notas Clínicas</Label>
            <Textarea
              id="clinicalNotes"
              value={formData.clinicalNotes || ""}
              onChange={(e) =>
                setFormData({ ...formData, clinicalNotes: e.target.value })
              }
              placeholder="Información médica relevante, alergias, etc."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Creando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Paciente
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Calendar Event Interface
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledAppointment;
}


// Get current user
const useAuth = () => {
  const [user] = useState(() => {
    const stored = localStorage.getItem("podocare_user");
    return stored ? JSON.parse(stored) : null;
  });
  return { user };
};

export function ScheduleAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const patientRepo = usePatientRepository();
  const workerRepo = useWorkerRepository();
  const appointmentRepo = useMemo(() => new FutureAppointmentRepository(), []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [scheduledAppointments, setScheduledAppointments] = useState<
    ScheduledAppointment[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<ScheduledAppointment | null>(null);

  // Calendar state
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<ScheduledAppointment | null>(null);
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState<ScheduleAppointmentRequest>({
    patientId: "",
    workerId: user?.id || "",
    scheduledDateTime: "",
    duration: 60,
    reason: "",
    treatmentNotes: "",
    observation: "",
    priority: "medium",
    reminderEnabled: true,
    reminderDays: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [calendarDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const month = calendarDate.getMonth() + 1;
      const year = calendarDate.getFullYear();
      const [patientsResp, workersResp, appointmentsResp] = await Promise.all([
        patientRepo.getAll({ page: 1, limit: 100 }),
        workerRepo.getAll({ page: 1, limit: 100 }),
        appointmentRepo.getMonthly(month, year),
      ]);
      setPatients(patientsResp.items);
      setWorkers(workersResp.items);
      const mapped = appointmentsResp.map((apt) => ({
        ...apt,
        patient: patientsResp.items.find((p) => p.id === apt.patientId),
        worker: workersResp.items.find((w) => w.id === apt.workerId),
      }));
      setScheduledAppointments(mapped);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error al cargar datos", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter appointments based on user role and filters
  const filteredAppointments = useMemo(() => {
    let filtered = scheduledAppointments;

    // Role-based filtering
    if (user?.role === "worker") {
      filtered = filtered.filter((apt) => apt.workerId === user.id);
    }

    // Worker filter
    if (workerFilter !== "all") {
      filtered = filtered.filter((apt) => apt.workerId === workerFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    return filtered;
  }, [scheduledAppointments, user, workerFilter, statusFilter]);

  // Convert appointments to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredAppointments.map((appointment) => {
      const start = new Date(appointment.dateTime);
      const end = new Date(start.getTime() + appointment.duration * 60000);

      return {
        id: appointment.id,
        title: `${appointment.patient?.firstName} ${appointment.patient?.paternalSurname} ${appointment.patient?.maternalSurname}`,
        start,
        end,
        resource: appointment,
      };
    });
  }, [filteredAppointments]);

  // Get appointments for a specific day
  const getDayAppointments = useCallback(
    (date: Date) => {
      return filteredAppointments
        .filter((appointment) =>
          isSameDay(new Date(appointment.dateTime), date),
        )
        .sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        );
    },
    [filteredAppointments],
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = "Selecciona un paciente";
    }
    if (!formData.workerId) {
      newErrors.workerId = "Selecciona un trabajador";
    }
    if (!formData.scheduledDateTime) {
      newErrors.scheduledDateTime = "Selecciona fecha y hora";
    } else {
      const appointmentDate = new Date(formData.scheduledDateTime);
      const now = new Date();
      if (appointmentDate <= now) {
        newErrors.scheduledDateTime = "La fecha debe ser en el futuro";
      }
    }
    if (!formData.reason?.trim()) {
      newErrors.reason = "Describe el motivo de la cita";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingAppointment) {
        const updated = await appointmentRepo.update(editingAppointment.id, formData);
        const patient = patients.find((p) => p.id === updated.patientId);
        const worker = workers.find((w) => w.id === updated.workerId);
        setScheduledAppointments(
          scheduledAppointments.map((apt) =>
            apt.id === editingAppointment.id
              ? { ...updated, patient, worker }
              : apt,
          ),
        );
        setEditingAppointment(null);
      } else {
        const created = await appointmentRepo.create(formData);
        const patient = patients.find((p) => p.id === created.patientId);
        const worker = workers.find((w) => w.id === created.workerId);
        setScheduledAppointments([
          { ...created, patient, worker },
          ...scheduledAppointments,
        ]);
      }

      // Reset form
      setFormData({
        patientId: "",
        workerId: user?.id || "",
        scheduledDateTime: "",
        duration: 60,
        reason: "",
        treatmentNotes: "",
        observation: "",
        priority: "medium",
        reminderEnabled: true,
        reminderDays: 1,
      });

      toast({
        title: editingAppointment
          ? "Cita actualizada exitosamente"
          : "Cita programada exitosamente",
      });
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast({ title: "Error al programar la cita. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAppointment = (appointment: ScheduledAppointment) => {
    setFormData({
      patientId: appointment.patientId,
      workerId: appointment.workerId,
      scheduledDateTime: appointment.dateTime,
      duration: appointment.duration,
      reason: appointment.reason,
      treatmentNotes: appointment.treatmentNotes || "",
      observation: appointment.observation || "",
      priority: appointment.priority,
      reminderEnabled: appointment.reminderEnabled,
      reminderDays: appointment.reminderDays,
    });
    setEditingAppointment(appointment);
  };

  const handleCancelEdit = () => {
    setEditingAppointment(null);
    setFormData({
      patientId: "",
      workerId: user?.id || "",
      scheduledDateTime: "",
      duration: 60,
      reason: "",
      treatmentNotes: "",
      observation: "",
      priority: "medium",
      reminderEnabled: true,
      reminderDays: 1,
    });
  };

  const handleChangeStatus = async (
    appointmentId: string,
    newStatus: "scheduled" | "canceled" | "completed",
  ) => {
    try {
      const updated = await appointmentRepo.update(appointmentId, {
        status: newStatus,
      });
      const patient = patients.find((p) => p.id === updated.patientId);
      const worker = workers.find((w) => w.id === updated.workerId);
      setScheduledAppointments(
        scheduledAppointments.map((apt) =>
          apt.id === appointmentId ? { ...updated, patient, worker } : apt,
        ),
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Error al actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta cita?")) {
      try {
        await appointmentRepo.delete(appointmentId);
        setScheduledAppointments(
          scheduledAppointments.filter((apt) => apt.id !== appointmentId),
        );
      } catch (error) {
        console.error("Error deleting appointment:", error);
        toast({
          title: "Error al eliminar la cita",
          variant: "destructive",
        });
      }
    }
  };

  const handlePatientCreated = (newPatient: Patient) => {
    setPatients([newPatient, ...patients]);
    setFormData({ ...formData, patientId: newPatient.id });
  };

  const handleCalendarEventClick = (event: CalendarEvent) => {
    setSelectedAppointment(event.resource);
    setShowAppointmentDetail(true);
  };

  const handleCalendarNavigate = (newDate: Date) => {
    setCalendarDate(newDate);
  };

  const handleCalendarViewChange = (newView: View) => {
    setCalendarView(newView);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "canceled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Custom event style function for calendar
  const eventStyleGetter = (event: CalendarEvent) => {
    const appointment = event.resource;
    let backgroundColor = "#3174ad";
    let borderColor = "#265985";

    switch (appointment.status) {
      case "scheduled":
        backgroundColor = "#2563eb";
        borderColor = "#1d4ed8";
        break;
      case "completed":
        backgroundColor = "#16a34a";
        borderColor = "#15803d";
        break;
      case "canceled":
        backgroundColor = "#dc2626";
        borderColor = "#b91c1c";
        break;
    }

    switch (appointment.priority) {
      case "high":
        borderColor = "#dc2626";
        break;
      case "medium":
        borderColor = "#ca8a04";
        break;
      case "low":
        borderColor = "#16a34a";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "2px",
        borderStyle: "solid",
        color: "white",
        fontSize: "12px",
        borderRadius: "4px",
      },
    };
  };

  // Custom component for calendar events
  const CalendarEvent = ({ event }: { event: CalendarEvent }) => {
    const appointment = event.resource;
    return (
      <div className="p-1">
        <div className="font-semibold text-xs truncate">
          {appointment.patient?.firstName} {appointment.patient?.paternalSurname}{" "}
          {appointment.patient?.maternalSurname}
        </div>
        <div className="text-xs opacity-90 truncate">{appointment.reason}</div>
        {appointment.worker && (
          <div className="text-xs opacity-75 truncate">
            {appointment.worker.firstName} {appointment.worker.lastName}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout title="Programar Citas" subtitle="Gestión de citas futuras">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="loading-shimmer h-16 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Programar Citas" subtitle="Gestión de citas futuras">
      <div className="h-full flex flex-col">
        <div className="p-6 flex-1 space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate("/appointments")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Citas
            </Button>

            {editingAppointment && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50">
                  Editando cita
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancelar edición
                </Button>
              </div>
            )}
          </div>

          {/* Main Content with Tabs */}
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="schedule" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger
                  value="schedule"
                  className="flex items-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4" />
                  {editingAppointment ? "Editar Cita" : "Programar Cita"}
                </TabsTrigger>
                <TabsTrigger
                  value="calendar"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Vista Calendario
                </TabsTrigger>
                <TabsTrigger value="agenda" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Agenda Diaria
                </TabsTrigger>
                <TabsTrigger
                  value="upcoming"
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  Lista ({scheduledAppointments.length})
                </TabsTrigger>
              </TabsList>

              {/* Schedule Tab */}
              <TabsContent value="schedule" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Scheduling Form */}
                  <div className="lg:col-span-2">
                    <Card className="card-modern shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                        <CardTitle className="flex items-center gap-2">
                          <CalendarPlus className="w-6 h-6 text-primary" />
                          {editingAppointment
                            ? "Editar Cita Programada"
                            : "Programar Nueva Cita"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        {/* Patient and Worker Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Paciente *</Label>
                            <SearchableSelect
                              items={patients}
                              value={formData.patientId}
                              onValueChange={(value) => {
                                setFormData({ ...formData, patientId: value });
                                if (errors.patientId) {
                                  setErrors({ ...errors, patientId: "" });
                                }
                              }}
                              placeholder="Seleccionar paciente"
                              displayField={(item) => {
                                const patient = item as Patient;
                                return `${patient.firstName} ${patient.paternalSurname} ${patient.maternalSurname}`;
                              }}
                              searchFields={(item) => {
                                const patient = item as Patient;
                                return [
                                  patient.firstName,
                                  patient.paternalSurname,
                                  patient.maternalSurname,
                                  patient.documentNumber,
                                  patient.phone || "",
                                ];
                              }}
                              emptyText="No se encontraron pacientes"
                              onCreateNew={() => setShowCreatePatient(true)}
                              createNewText="Crear nuevo paciente"
                            />
                            {errors.patientId && (
                              <p className="text-sm text-destructive">
                                {errors.patientId}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label>Trabajador Asignado *</Label>
                            <SearchableSelect
                              items={workers}
                              value={formData.workerId}
                              onValueChange={(value) => {
                                setFormData({ ...formData, workerId: value });
                                if (errors.workerId) {
                                  setErrors({ ...errors, workerId: "" });
                                }
                              }}
                              placeholder="Seleccionar trabajador"
                              displayField={(item) => {
                                const worker = item as Worker;
                                return `${worker.firstName} ${worker.lastName}`;
                              }}
                              searchFields={(item) => {
                                const worker = item as Worker;
                                return [
                                  worker.firstName,
                                  worker.lastName,
                                  worker.email,
                                  worker.specialization || "",
                                ];
                              }}
                              emptyText="No se encontraron trabajadores"
                            />
                            {errors.workerId && (
                              <p className="text-sm text-destructive">
                                {errors.workerId}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Date, Time and Duration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="scheduledDateTime">
                              Fecha y Hora *
                            </Label>
                            <Input
                              id="scheduledDateTime"
                              type="datetime-local"
                              value={formData.scheduledDateTime}
                              min={getMinDateTime()}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  scheduledDateTime: e.target.value,
                                });
                                if (errors.scheduledDateTime) {
                                  setErrors({
                                    ...errors,
                                    scheduledDateTime: "",
                                  });
                                }
                              }}
                              className={cn(
                                errors.scheduledDateTime &&
                                  "border-destructive",
                              )}
                            />
                            {errors.scheduledDateTime && (
                              <p className="text-sm text-destructive">
                                {errors.scheduledDateTime}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="duration">Duración *</Label>
                            <Select
                              value={formData.duration.toString()}
                              onValueChange={(value) =>
                                setFormData({
                                  ...formData,
                                  duration: parseInt(value),
                                })
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

                        {/* Priority */}
                        <div className="space-y-2">
                          <Label htmlFor="priority">Prioridad</Label>
                          <Select
                            value={formData.priority}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setFormData({ ...formData, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baja</SelectItem>
                              <SelectItem value="medium">Media</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Reason */}
                        <div className="space-y-2">
                          <Label htmlFor="reason">Motivo de la Cita *</Label>
                          <Input
                            id="reason"
                            value={formData.reason}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                reason: e.target.value,
                              });
                              if (errors.reason) {
                                setErrors({ ...errors, reason: "" });
                              }
                            }}
                            placeholder="Ej: Revisión general, Seguimiento, Tratamiento específico..."
                            className={cn(
                              errors.reason && "border-destructive",
                            )}
                          />
                          {errors.reason && (
                            <p className="text-sm text-destructive">
                              {errors.reason}
                            </p>
                          )}
                        </div>

                        {/* Treatment Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="treatmentNotes">
                            Notas de Tratamiento
                          </Label>
                          <Textarea
                            id="treatmentNotes"
                            value={formData.treatmentNotes || ""}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                treatmentNotes: e.target.value,
                              });
                            }}
                            placeholder="Tratamiento planificado, procedimientos específicos..."
                            rows={3}
                          />
                        </div>

                        {/* Reminder Settings */}
                        <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-blue-600" />
                            <Label className="font-medium text-blue-800">
                              Configuración de Recordatorio
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="reminderEnabled"
                              checked={formData.reminderEnabled}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  reminderEnabled: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            <Label htmlFor="reminderEnabled">
                              Enviar recordatorio al paciente
                            </Label>
                          </div>

                          {formData.reminderEnabled && (
                            <div className="space-y-2">
                              <Label htmlFor="reminderDays">
                                Días antes de la cita
                              </Label>
                              <Select
                                value={formData.reminderDays.toString()}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    reminderDays: parseInt(value),
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1 día antes</SelectItem>
                                  <SelectItem value="2">
                                    2 días antes
                                  </SelectItem>
                                  <SelectItem value="3">
                                    3 días antes
                                  </SelectItem>
                                  <SelectItem value="7">
                                    1 semana antes
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Observations */}
                        <div className="space-y-2">
                          <Label htmlFor="observations">
                            Observaciones Adicionales
                          </Label>
                          <Textarea
                            id="observations"
                            value={formData.observation || ""}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                observation: e.target.value,
                              });
                            }}
                            placeholder="Notas especiales, instrucciones, preparación requerida..."
                            rows={3}
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSchedule}
                            disabled={isSaving}
                            size="lg"
                            className="btn-primary flex items-center gap-2 flex-1"
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                {editingAppointment
                                  ? "Actualizando..."
                                  : "Programando..."}
                              </>
                            ) : (
                              <>
                                {editingAppointment ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <CalendarPlus className="w-4 h-4" />
                                )}
                                {editingAppointment
                                  ? "Actualizar Cita"
                                  : "Programar Cita"}
                              </>
                            )}
                          </Button>

                          <Button
                            variant="secondary"
                            onClick={() => {
                              console.log("Draft saved:", formData);
                              toast({ title: "Borrador guardado exitosamente" });
                            }}
                            disabled={isSaving}
                            size="lg"
                            className="flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Guardar Borrador
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary Sidebar */}
                  <div className="lg:col-span-1">
                    <Card className="card-modern shadow-lg sticky top-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Resumen
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {formData.patientId && (
                          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <User className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">Paciente</p>
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  const patient = patients.find(
                                    (p) => p.id === formData.patientId,
                                  );
                                  return patient
                                    ? `${patient.firstName} ${patient.paternalSurname} ${patient.maternalSurname}`
                                    : "";
                                })()}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.workerId && (
                          <div className="flex items-center gap-3 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                            <Users className="w-5 h-5 text-secondary" />
                            <div>
                              <p className="font-medium text-sm">Trabajador</p>
                              <p className="text-sm text-muted-foreground">
                                {(() => {
                                  const worker = workers.find(
                                    (w) => w.id === formData.workerId,
                                  );
                                  return worker
                                    ? `${worker.firstName} ${worker.lastName}`
                                    : "";
                                })()}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.scheduledDateTime && (
                          <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-lg border border-accent/20">
                            <Clock className="w-5 h-5 text-accent" />
                            <div>
                              <p className="font-medium text-sm">
                                Fecha y Hora
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  formData.scheduledDateTime,
                                ).toLocaleString("es-ES", {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                ({formData.duration} min)
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.reason && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800">
                                Motivo
                              </p>
                              <p className="text-sm text-blue-600">
                                {formData.reason}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <MapPin className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">Prioridad</p>
                            <Badge
                              className={cn(
                                "text-xs mt-1",
                                getPriorityColor(formData.priority),
                              )}
                            >
                              {formData.priority === "low"
                                ? "Baja"
                                : formData.priority === "medium"
                                  ? "Media"
                                  : "Alta"}
                            </Badge>
                          </div>
                        </div>

                        {!formData.patientId &&
                          !formData.workerId &&
                          !formData.scheduledDateTime && (
                            <div className="text-center py-8 text-muted-foreground">
                              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>Completa los datos para ver el resumen</p>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Calendar View Tab */}
              <TabsContent value="calendar" className="space-y-6">
                <Card className="card-modern shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        Vista Calendario
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        {/* Filters */}
                        {user?.role === "admin" && (
                          <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <Select
                              value={workerFilter}
                              onValueChange={setWorkerFilter}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Filtrar por trabajador" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  Todos los trabajadores
                                </SelectItem>
                                {workers.map((worker) => (
                                  <SelectItem key={worker.id} value={worker.id}>
                                    {worker.firstName} {worker.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="scheduled">
                              Programadas
                            </SelectItem>
                            <SelectItem value="completed">
                              Completadas
                            </SelectItem>
                            <SelectItem value="canceled">
                              Canceladas
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="calendar-container"
                      style={{ height: "600px" }}
                    >
                      <BigCalendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        view={calendarView}
                        onView={handleCalendarViewChange}
                        date={calendarDate}
                        onNavigate={handleCalendarNavigate}
                        onSelectEvent={handleCalendarEventClick}
                        eventPropGetter={eventStyleGetter}
                        components={{
                          event: CalendarEvent,
                        }}
                        messages={{
                          allDay: "Todo el día",
                          previous: "Anterior",
                          next: "Siguiente",
                          today: "Hoy",
                          month: "Mes",
                          week: "Semana",
                          day: "Día",
                          agenda: "Agenda",
                          date: "Fecha",
                          time: "Hora",
                          event: "Evento",
                          noEventsInRange:
                            "No hay citas en este rango de fechas",
                          showMore: (total) => `+ Ver ${total} más`,
                        }}
                        culture="es"
                        className="rbc-calendar"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Daily Agenda Tab */}
              <TabsContent value="agenda" className="space-y-6">
                <Card className="card-modern shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-primary" />
                        Agenda Diaria
                      </CardTitle>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCalendarDate(addDays(calendarDate, -1))
                          }
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="font-medium min-w-40 text-center">
                          {format(calendarDate, "eeee, dd MMMM yyyy", {
                            locale: es,
                          })}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCalendarDate(addDays(calendarDate, 1))
                          }
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCalendarDate(new Date())}
                        >
                          Hoy
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const dayAppointments = getDayAppointments(calendarDate);

                      if (dayAppointments.length === 0) {
                        return (
                          <div className="text-center py-12 text-muted-foreground">
                            <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">
                              No hay citas programadas para esta fecha
                            </p>
                            <p className="text-sm">
                              Selecciona otro día o programa una nueva cita.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {dayAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowAppointmentDetail(true);
                              }}
                            >
                              <div className="flex flex-col items-center gap-1 min-w-16">
                                <div className="text-lg font-bold text-primary">
                                  {format(
                                    new Date(appointment.dateTime),
                                    "HH:mm",
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {appointment.duration}min
                                </div>
                              </div>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      {appointment.patient?.firstName}{" "}
                                      {appointment.patient?.paternalSurname}{" "}
                                      {appointment.patient?.maternalSurname}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      DNI: {appointment.patient?.documentNumber} • Tel: {
                                        appointment.patient?.phone
                                      }
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge
                                      className={cn(
                                        "text-xs flex items-center gap-1",
                                        getStatusColor(appointment.status),
                                      )}
                                    >
                                      {getStatusIcon(appointment.status)}
                                      {appointment.status === "scheduled"
                                        ? "Programada"
                                        : appointment.status === "completed"
                                          ? "Completada"
                                          : "Cancelada"}
                                    </Badge>
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        getPriorityColor(appointment.priority),
                                      )}
                                    >
                                      {appointment.priority === "low"
                                        ? "Baja"
                                        : appointment.priority === "medium"
                                          ? "Media"
                                          : "Alta"}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-medium text-blue-800">
                                      Motivo:
                                    </p>
                                    <p className="text-blue-600">
                                      {appointment.reason}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-green-800">
                                      Trabajador:
                                    </p>
                                    <p className="text-green-600">
                                      {appointment.worker?.firstName}{" "}
                                      {appointment.worker?.lastName}
                                    </p>
                                  </div>
                                </div>

                                {appointment.treatmentNotes && (
                                  <div className="text-sm">
                                    <p className="font-medium text-purple-800">
                                      Notas de tratamiento:
                                    </p>
                                    <p className="text-purple-600">
                                      {appointment.treatmentNotes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Upcoming Appointments Tab */}
              <TabsContent value="upcoming" className="space-y-6">
                <Card className="card-modern shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <List className="w-6 h-6 text-primary" />
                      Citas Programadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {scheduledAppointments.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">
                          No hay citas programadas
                        </p>
                        <p className="text-sm">
                          Ve a la pestaña "Programar Cita" para crear la primera
                          cita.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {scheduledAppointments
                          .sort(
                            (a, b) =>
                              new Date(a.dateTime).getTime() -
                              new Date(b.dateTime).getTime(),
                          )
                          .map((appointment) => (
                            <div
                              key={appointment.id}
                              className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-lg">
                                        {appointment.patient?.firstName}{" "}
                                        {appointment.patient?.paternalSurname}{" "}
                                        {appointment.patient?.maternalSurname}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        DNI: {appointment.patient?.documentNumber} • {" "}
                                        Tel: {appointment.patient?.phone}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Badge
                                        className={cn(
                                          "text-xs flex items-center gap-1",
                                          getStatusColor(appointment.status),
                                        )}
                                      >
                                        {getStatusIcon(appointment.status)}
                                        {appointment.status === "scheduled"
                                          ? "Programada"
                                          : appointment.status === "completed"
                                            ? "Completada"
                                            : "Cancelada"}
                                      </Badge>
                                      <Badge
                                        className={cn(
                                          "text-xs",
                                          getPriorityColor(
                                            appointment.priority,
                                          ),
                                        )}
                                      >
                                        {appointment.priority === "low"
                                          ? "Baja"
                                          : appointment.priority === "medium"
                                            ? "Media"
                                            : "Alta"}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                      <span>
                                        {new Date(
                                          appointment.dateTime,
                                        ).toLocaleString("es-ES", {
                                          weekday: "short",
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="w-4 h-4 text-muted-foreground" />
                                      <span>
                                        {appointment.worker?.firstName}{" "}
                                        {appointment.worker?.lastName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <span>{appointment.duration} min</span>
                                    </div>
                                  </div>

                                  <div className="text-sm">
                                    <p className="font-medium text-blue-800">
                                      Motivo:
                                    </p>
                                    <p className="text-blue-600">
                                      {appointment.reason}
                                    </p>
                                  </div>

                                  {appointment.treatmentNotes && (
                                    <div className="text-sm">
                                      <p className="font-medium text-green-800">
                                        Notas de tratamiento:
                                      </p>
                                      <p className="text-green-600">
                                        {appointment.treatmentNotes}
                                      </p>
                                    </div>
                                  )}

                                  {appointment.reminderEnabled && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600">
                                      <Bell className="w-4 h-4" />
                                      <span>
                                        Recordatorio {appointment.reminderDays}{" "}
                                        día(s) antes
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 ml-4">
                                  {appointment.status === "scheduled" && (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleEditAppointment(appointment)
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        Editar
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          handleChangeStatus(
                                            appointment.id,
                                            "completed",
                                          )
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
                                      >
                                        <CheckCircle className="w-3 h-3" />
                                        Completar
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          handleChangeStatus(
                                            appointment.id,
                                            "canceled",
                                          )
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="flex items-center gap-1 text-red-600 border-red-600 hover:bg-red-50"
                                      >
                                        <XCircle className="w-3 h-3" />
                                        Cancelar
                                      </Button>
                                    </>
                                  )}

                                  {appointment.status === "canceled" && (
                                    <Button
                                      onClick={() =>
                                        handleChangeStatus(
                                          appointment.id,
                                          "scheduled",
                                        )
                                      }
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-1 text-blue-600 border-blue-600 hover:bg-blue-50"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      Reactivar
                                    </Button>
                                  )}

                                  <Button
                                    onClick={() =>
                                      handleDeleteAppointment(appointment.id)
                                    }
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Create Patient Modal */}
      <CreatePatientModal
        isOpen={showCreatePatient}
        onClose={() => setShowCreatePatient(false)}
        onPatientCreated={handlePatientCreated}
      />

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Dialog
          open={showAppointmentDetail}
          onOpenChange={setShowAppointmentDetail}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Detalles de la Cita
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-primary">Paciente</Label>
                  <div className="p-3 bg-primary/5 rounded-lg">
                    <p className="font-medium">
                      {selectedAppointment.patient?.firstName}{" "}
                      {selectedAppointment.patient?.paternalSurname}{" "}
                      {selectedAppointment.patient?.maternalSurname}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      DNI: {selectedAppointment.patient?.documentNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tel: {selectedAppointment.patient?.phone}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-secondary">
                    Trabajador
                  </Label>
                  <div className="p-3 bg-secondary/5 rounded-lg">
                    <p className="font-medium">
                      {selectedAppointment.worker?.firstName}{" "}
                      {selectedAppointment.worker?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.worker?.specialization}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.worker?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-accent">
                    Fecha y Hora
                  </Label>
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="font-medium">
                      {new Date(
                        selectedAppointment.dateTime,
                      ).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        selectedAppointment.dateTime,
                      ).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({selectedAppointment.duration} minutos)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium">Estado y Prioridad</Label>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex gap-2 mb-2">
                      <Badge
                        className={cn(
                          "text-xs flex items-center gap-1",
                          getStatusColor(selectedAppointment.status),
                        )}
                      >
                        {getStatusIcon(selectedAppointment.status)}
                        {selectedAppointment.status === "scheduled"
                          ? "Programada"
                          : selectedAppointment.status === "completed"
                            ? "Completada"
                            : "Cancelada"}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs",
                          getPriorityColor(selectedAppointment.priority),
                        )}
                      >
                        {selectedAppointment.priority === "low"
                          ? "Baja"
                          : selectedAppointment.priority === "medium"
                            ? "Media"
                            : "Alta"}
                      </Badge>
                    </div>
                    {selectedAppointment.reminderEnabled && (
                      <p className="text-xs text-muted-foreground">
                        Recordatorio: {selectedAppointment.reminderDays} día(s)
                        antes
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-blue-600">
                  Motivo de la Cita
                </Label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p>{selectedAppointment.reason}</p>
                </div>
              </div>

              {selectedAppointment.treatmentNotes && (
                <div className="space-y-2">
                  <Label className="font-medium text-green-600">
                    Notas de Tratamiento
                  </Label>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p>{selectedAppointment.treatmentNotes}</p>
                  </div>
                </div>
              )}

              {selectedAppointment.observation && (
                <div className="space-y-2">
                  <Label className="font-medium text-purple-600">
                    Observaciones
                  </Label>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p>{selectedAppointment.observation}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAppointmentDetail(false)}
              >
                Cerrar
              </Button>
              {selectedAppointment.status === "scheduled" && (
                <Button
                  onClick={() => {
                    handleEditAppointment(selectedAppointment);
                    setShowAppointmentDetail(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Cita
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Calendar Styles */}
      <style>{`
        .rbc-calendar {
          font-family: "Inter", system-ui, sans-serif;
        }

        .rbc-header {
          background-color: hsl(var(--primary) / 0.1);
          border-bottom: 1px solid hsl(var(--border));
          padding: 8px;
          font-weight: 600;
          color: hsl(var(--primary));
        }

        .rbc-month-view {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-date-cell {
          padding: 4px 8px;
          font-size: 14px;
          color: hsl(var(--foreground));
        }

        .rbc-date-cell.rbc-off-range {
          color: hsl(var(--muted-foreground));
        }

        .rbc-today {
          background-color: hsl(var(--primary) / 0.1);
        }

        .rbc-event {
          border-radius: 4px;
          border: none;
          padding: 2px 4px;
          font-size: 11px;
          font-weight: 500;
        }

        .rbc-event:focus {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }

        .rbc-toolbar {
          margin-bottom: 16px;
          padding: 0 8px;
        }

        .rbc-toolbar button {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 14px;
          color: hsl(var(--foreground));
          transition: all 0.2s;
        }

        .rbc-toolbar button:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
        }

        .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }

        .rbc-toolbar .rbc-toolbar-label {
          font-size: 18px;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 16px;
        }

        .rbc-time-view .rbc-time-header {
          border-bottom: 1px solid hsl(var(--border));
        }

        .rbc-time-view .rbc-time-content {
          border-left: 1px solid hsl(var(--border));
        }

        .rbc-time-slot {
          border-top: 1px solid hsl(var(--border));
          color: hsl(var(--muted-foreground));
        }

        .rbc-current-time-indicator {
          background-color: hsl(var(--destructive));
          height: 2px;
        }

        .rbc-agenda-view table {
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          overflow: hidden;
        }

        .rbc-agenda-view .rbc-agenda-date-cell,
        .rbc-agenda-view .rbc-agenda-time-cell,
        .rbc-agenda-view .rbc-agenda-event-cell {
          padding: 12px;
          border-right: 1px solid hsl(var(--border));
        }

        .rbc-show-more {
          background: hsl(var(--muted));
          color: hsl(var(--muted-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          cursor: pointer;
        }

        .rbc-show-more:hover {
          background: hsl(var(--muted) / 0.8);
        }
      `}</style>
    </Layout>
  );
}

export default ScheduleAppointment;
