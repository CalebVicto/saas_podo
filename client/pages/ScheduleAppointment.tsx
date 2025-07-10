import React, { useState, useEffect, useMemo } from "react";
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
  MapPin,
  Bell,
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
import { cn } from "@/lib/utils";
import { Patient, Worker } from "@shared/api";
import { getMockPatients, getMockWorkers } from "@/lib/mockData";
import Layout from "@/components/Layout";

interface ScheduleAppointmentRequest {
  patientId: string;
  workerId: string;
  scheduledDateTime: string;
  duration: number;
  reason: string;
  notes?: string;
  priority: "low" | "medium" | "high";
  reminderEnabled: boolean;
  reminderDays: number;
}

interface SearchableSelectProps {
  items: (Patient | Worker)[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  displayField: (item: Patient | Worker) => string;
  searchFields: (item: Patient | Worker) => string[];
  emptyText: string;
}

function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder,
  displayField,
  searchFields,
  emptyText,
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
        <DialogContent className="sm:max-w-[500px]">
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

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {emptyText}
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
                      <div>
                        <p className="font-medium">{displayField(item)}</p>
                        {"email" in item && (
                          <p className="text-sm text-muted-foreground">
                            {item.email}
                          </p>
                        )}
                        {"documentId" in item && (
                          <p className="text-sm text-muted-foreground">
                            DNI: {item.documentId}
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

// Mock upcoming appointments data
const mockUpcomingAppointments = [
  {
    id: "1",
    patientName: "María González",
    date: "2024-01-25",
    time: "10:00",
    worker: "Dr. Smith",
    reason: "Revisión general",
    priority: "medium" as const,
  },
  {
    id: "2",
    patientName: "Carlos Mendez",
    date: "2024-01-26",
    time: "14:30",
    worker: "Dr. Johnson",
    reason: "Tratamiento de onicomicosis",
    priority: "high" as const,
  },
  {
    id: "3",
    patientName: "Ana García",
    date: "2024-01-27",
    time: "09:15",
    worker: "Dr. Smith",
    reason: "Seguimiento",
    priority: "low" as const,
  },
];

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ScheduleAppointmentRequest>({
    patientId: "",
    workerId: user?.id || "",
    scheduledDateTime: "",
    duration: 60,
    reason: "",
    notes: "",
    priority: "medium",
    reminderEnabled: true,
    reminderDays: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockPatients = getMockPatients();
      const mockWorkers = getMockWorkers();
      setPatients(mockPatients);
      setWorkers(mockWorkers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, this would save to the backend
      console.log("Appointment scheduled:", formData);

      // Navigate back to appointments list
      navigate("/appointments");
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      alert("Error al programar la cita. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1); // At least 1 hour from now
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

  if (isLoading) {
    return (
      <Layout title="Programar Cita" subtitle="Agendar cita futura">
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
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
    <Layout title="Programar Cita" subtitle="Agendar cita futura">
      <div className="h-full flex flex-col">
        <div className="p-6 flex-1 space-y-6">
          {/* Header Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/appointments")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Citas
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scheduling Form */}
            <div className="lg:col-span-2">
              <Card className="card-modern shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarPlus className="w-6 h-6 text-primary" />
                    Programar Nueva Cita
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
                          return `${patient.firstName} ${patient.lastName}`;
                        }}
                        searchFields={(item) => {
                          const patient = item as Patient;
                          return [
                            patient.firstName,
                            patient.lastName,
                            patient.documentId,
                            patient.phone,
                          ];
                        }}
                        emptyText="No se encontraron pacientes"
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
                      <Label htmlFor="scheduledDateTime">Fecha y Hora *</Label>
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
                            setErrors({ ...errors, scheduledDateTime: "" });
                          }
                        }}
                        className={cn(
                          errors.scheduledDateTime && "border-destructive",
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
                        setFormData({ ...formData, reason: e.target.value });
                        if (errors.reason) {
                          setErrors({ ...errors, reason: "" });
                        }
                      }}
                      placeholder="Ej: Revisión general, Seguimiento, Tratamiento específico..."
                      className={cn(errors.reason && "border-destructive")}
                    />
                    {errors.reason && (
                      <p className="text-sm text-destructive">
                        {errors.reason}
                      </p>
                    )}
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
                            <SelectItem value="2">2 días antes</SelectItem>
                            <SelectItem value="3">3 días antes</SelectItem>
                            <SelectItem value="7">1 semana antes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, notes: e.target.value });
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
                          Programando...
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="w-4 h-4" />
                          Programar Cita
                        </>
                      )}
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() => {
                        console.log("Draft saved:", formData);
                        alert("Borrador guardado exitosamente");
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

            {/* Sidebar - Summary & Upcoming Appointments */}
            <div className="lg:col-span-1 space-y-6">
              {/* Summary */}
              <Card className="card-modern shadow-lg">
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
                              ? `${patient.firstName} ${patient.lastName}`
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
                        <p className="font-medium text-sm">Fecha y Hora</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(formData.scheduledDateTime).toLocaleString(
                            "es-ES",
                            {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}{" "}
                          ({formData.duration} min)
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.reason && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Motivo</p>
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

              {/* Upcoming Appointments */}
              <Card className="card-modern shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Próximas Citas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockUpcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {appointment.patientName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.date} • {appointment.time}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.reason}
                            </p>
                          </div>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ScheduleAppointment;
