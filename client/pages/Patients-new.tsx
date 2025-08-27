import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  User,
  FileText,
  X,
  Save,
  ArrowLeft,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Patient, CreatePatientRequest } from "@shared/api";
import { getMockAppointments, getMockPayments } from "@/lib/mockData";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { useRepositories } from "@/lib/repositories";

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

export function Patients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const repositories = useRepositories();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Repository-based pagination
  const pagination = useRepositoryPagination<Patient>({
    initialPageSize: 12,
  });

  // Form state for new/edit patient
  const [formData, setFormData] = useState<CreatePatientRequest>({
    firstName: "",
    lastName: "",
    documentId: "",
    phone: "",
    sex: "female",
    birthDate: "",
    clinicalNotes: "",
  });

  // Load patients data
  const loadPatients = useCallback(async () => {
    await pagination.loadData((params) => repositories.patients.getAll(params));
  }, [pagination, repositories.patients]);

  // Load patients on component mount and when pagination changes
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadPatients();
  }, [user, navigate, loadPatients]);

  // Reload when pagination state changes
  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [
    pagination.currentPage,
    pagination.pageSize,
    pagination.searchTerm,
    user,
    loadPatients,
  ]);

  const handleAddPatient = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await repositories.patients.create(formData);
      setIsAddDialogOpen(false);
      resetForm();
      // Refresh the list
      await loadPatients();
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  const handleEditPatient = async () => {
    if (!selectedPatient) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await repositories.patients.update(selectedPatient.id, formData);
      setIsEditDialogOpen(false);
      setSelectedPatient(null);
      resetForm();
      // Refresh the list
      await loadPatients();
    } catch (error) {
      console.error("Error updating patient:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      documentId: "",
      phone: "",
      sex: "female",
      birthDate: "",
      clinicalNotes: "",
    });
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      documentId: patient.documentId,
      phone: patient.phone,
      sex: patient.sex,
      birthDate: patient.birthDate,
      clinicalNotes: patient.clinicalNotes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getPatientAppointments = (patientId: string) => {
    return getMockAppointments().filter((apt) => apt.patientId === patientId);
  };

  const getPatientPayments = (patientId: string) => {
    const appointments = getPatientAppointments(patientId);
    const appointmentIds = appointments.map((apt) => apt.id);
    return getMockPayments().filter((payment) =>
      appointmentIds.includes(payment.appointmentId || ""),
    );
  };

  if (!user) return null;

  return (
    <Layout
      title="Gestión de Pacientes"
      subtitle="Administra la información de tus pacientes"
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
            Nuevo Paciente
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, DNI o teléfono..."
                  value={pagination.searchTerm}
                  onChange={(e) => pagination.setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagination.isLoading ? (
              // Loading skeletons
              Array.from({ length: pagination.pageSize }).map((_, i) => (
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
            ) : pagination.data.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {pagination.searchTerm
                    ? "No se encontraron pacientes"
                    : "No hay pacientes registrados"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {pagination.searchTerm
                    ? "Intenta con otros términos de búsqueda"
                    : "Comienza agregando tu primer paciente"}
                </p>
                {!pagination.searchTerm && (
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Paciente
                  </Button>
                )}
              </div>
            ) : (
              pagination.data.map((patient) => {
                const appointments = getPatientAppointments(patient.id);
                const lastAppointment = appointments.sort(
                  (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime(),
                )[0];

                return (
                  <Card
                    key={patient.id}
                    className="card-modern hover:shadow-lg transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {calculateAge(patient.birthDate)} años •{" "}
                              {patient.sex === "female"
                                ? "Femenino"
                                : patient.sex === "male"
                                  ? "Masculino"
                                  : "Otro"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="status-info">
                          {appointments.length} citas
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">DNI:</span>
                          <span className="font-medium">
                            {patient.documentId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Tel:</span>
                          <span className="font-medium">{patient.phone}</span>
                        </div>
                        {lastAppointment && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Última cita:
                            </span>
                            <span className="font-medium">
                              {new Date(
                                lastAppointment.date,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalle
                        </Button>
                        <Button
                          onClick={() => openEditDialog(patient)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination.totalItems > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.setPageSize}
              showPageSizeSelector={true}
              pageSizeOptions={[6, 12, 18, 24]}
            />
          )}
        </div>

        {/* Add Patient Dialog - keeping the same as before */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Nuevo Paciente
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
                    placeholder="María"
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
                    placeholder="González"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documentId">DNI *</Label>
                  <Input
                    id="documentId"
                    value={formData.documentId}
                    onChange={(e) =>
                      setFormData({ ...formData, documentId: e.target.value })
                    }
                    placeholder="12345678"
                    required
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sex">Sexo *</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value: "male" | "female" | "other") =>
                      setFormData({ ...formData, sex: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
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
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicalNotes">Notas Clínicas</Label>
                <Textarea
                  id="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, clinicalNotes: e.target.value })
                  }
                  placeholder="Historial médico, alergias, tratamientos previos..."
                  rows={3}
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
                onClick={handleAddPatient}
                className="btn-primary"
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.documentId ||
                  !formData.phone ||
                  !formData.birthDate
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Paciente
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Patient Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Paciente
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editDocumentId">DNI *</Label>
                  <Input
                    id="editDocumentId"
                    value={formData.documentId}
                    onChange={(e) =>
                      setFormData({ ...formData, documentId: e.target.value })
                    }
                    required
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editSex">Sexo *</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value: "male" | "female" | "other") =>
                      setFormData({ ...formData, sex: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editBirthDate">Fecha de Nacimiento *</Label>
                  <Input
                    id="editBirthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editClinicalNotes">Notas Clínicas</Label>
                <Textarea
                  id="editClinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={(e) =>
                    setFormData({ ...formData, clinicalNotes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedPatient(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditPatient}
                className="btn-primary"
                disabled={
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.documentId ||
                  !formData.phone ||
                  !formData.birthDate
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Patient Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Perfil del Paciente
              </DialogTitle>
            </DialogHeader>

            {selectedPatient && (
              <div className="space-y-6 py-4">
                {/* Patient Info */}
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
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          DNI
                        </Label>
                        <p className="font-medium">
                          {selectedPatient.documentId}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Teléfono
                        </Label>
                        <p className="font-medium">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Edad
                        </Label>
                        <p className="font-medium">
                          {calculateAge(selectedPatient.birthDate)} años
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Sexo
                        </Label>
                        <p className="font-medium">
                          {selectedPatient.sex === "female"
                            ? "Femenino"
                            : selectedPatient.sex === "male"
                              ? "Masculino"
                              : "Otro"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Estadísticas
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const appointments = getPatientAppointments(
                          selectedPatient.id,
                        );
                        const payments = getPatientPayments(selectedPatient.id);
                        const totalPaid = payments.reduce(
                          (sum, p) => sum + p.amount,
                          0,
                        );

                        return (
                          <>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Total de Citas
                              </Label>
                              <p className="font-medium">
                                {appointments.length}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Citas Completadas
                              </Label>
                              <p className="font-medium">
                                {
                                  appointments.filter(
                                    (a) => a.status === "completed",
                                  ).length
                                }
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Total Pagado
                              </Label>
                              <p className="font-medium">
                                S/ {totalPaid.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground text-sm">
                                Paciente desde
                              </Label>
                              <p className="font-medium">
                                {new Date(
                                  selectedPatient.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                {selectedPatient.clinicalNotes && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Notas Clínicas
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {selectedPatient.clinicalNotes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recent Appointments */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Citas Recientes
                  </h3>
                  {(() => {
                    const appointments = getPatientAppointments(
                      selectedPatient.id,
                    )
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
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
                                {new Date(
                                  appointment.date,
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {appointment.treatmentNotes || "Sin notas"}
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
                  if (selectedPatient) {
                    openEditDialog(selectedPatient);
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
                  setSelectedPatient(null);
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

export default Patients;
