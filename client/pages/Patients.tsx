import React, { useState, useEffect, useMemo } from "react";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Patient } from "@shared/api";
import {
  useAppointmentRepository,
  usePaymentRepository,
} from "@/lib/repositories";
import { PatientRepository } from "@/lib/api/patient";
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

export function Patients() {
  const { user } = useAuth();

  const navigate = useNavigate();
  const patientRepository = useMemo(() => new PatientRepository(), []);
  const appointmentRepository = useAppointmentRepository();
  const paymentRepository = usePaymentRepository();

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [backendError, setBackendError] = useState<string>("");

  // Repository-based pagination
  const pagination = useRepositoryPagination<Patient>({
    initialPageSize: 12,
  });

  // Form state for new/edit patient
  const [formData, setFormData] = useState<Patient>({
    documentType: "dni",
    documentNumber: "",
    firstName: "",
    paternalSurname: "",
    maternalSurname: "",
    gender: "f",
    phone: "",
    birthDate: "",
    balance: 0,
  });

  // Load patients whenever pagination state changes
  useEffect(() => {
    if (!user) return;
    loadPatients();
  }, [
    pagination.currentPage,
    pagination.pageSize,
    pagination.searchTerm,
    pagination.filters,
  ]);

  const loadPatients = async () => {
    await pagination.loadData((params) => patientRepository.getAll(params));
  };

  const resetForm = () => {
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
    });
  };

  const openEditDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData({
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      firstName: patient.firstName,
      paternalSurname: patient.paternalSurname,
      maternalSurname: patient.maternalSurname,
      gender: patient.gender,
      email: patient.email,
      phone: patient.phone || "",
      birthDate: patient.birthDate,
      allergy: patient.allergy,
      diabetic: patient.diabetic,
      hypertensive: patient.hypertensive,
      otherConditions: patient.otherConditions || "",
      firstNameNormalized: patient.firstNameNormalized,
      lastNameNormalized: patient.lastNameNormalized,
      balance: patient.balance,
      id: patient.id,
    });
    setIsEditDialogOpen(true);
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
            onClick={() => navigate("/patients/new")}
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
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="space-y-6">
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

          {/* Patients Card */}
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
                              {patient.firstName} {patient.paternalSurname}{" "}
                              {patient.maternalSurname}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {calculateAge(patient.birthDate)} años •{" "}
                              {patient.gender === "f"
                                ? "Femenino"
                                : patient.gender === "m"
                                  ? "Masculino"
                                  : "Otro"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="status-info">
                          Paciente
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">DNI:</span>
                          <span className="font-medium">
                            {patient.documentNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Tel:</span>
                          <span className="font-medium">{patient.phone}</span>
                        </div>
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
                          onClick={() => navigate(`/patients/${patient.id}/edit`)}
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

        </div>

      </div>
    </Layout>
  );
}

export default Patients;
