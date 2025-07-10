import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Activity,
  FileText,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Package as PackageType,
  PatientPackage,
  PackageSession,
  Patient,
} from "@shared/api";
import { mockPatientPackages, getMockPatients } from "@/lib/mockData";
import Layout from "@/components/Layout";

interface CreatePackageRequest {
  name: string;
  numberOfSessions: number;
  totalPrice: number;
  notes?: string;
  isActive: boolean;
}

// Mock packages data
const mockPackages: PackageType[] = [
  {
    id: "package_1",
    name: "Tratamiento Básico Podológico",
    numberOfSessions: 4,
    totalPrice: 200,
    notes: "Incluye cuidado básico de uñas y pies",
    isActive: true,
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2024-01-01T00:00:00",
  },
  {
    id: "package_2",
    name: "Tratamiento Completo de Onicomicosis",
    numberOfSessions: 8,
    totalPrice: 480,
    notes: "Tratamiento especializado para hongos en uñas",
    isActive: true,
    createdAt: "2024-01-02T00:00:00",
    updatedAt: "2024-01-02T00:00:00",
  },
  {
    id: "package_3",
    name: "Rehabilitación Post-Cirugía",
    numberOfSessions: 6,
    totalPrice: 360,
    notes: "Cuidados especializados después de cirugía podológica",
    isActive: true,
    createdAt: "2024-01-03T00:00:00",
    updatedAt: "2024-01-03T00:00:00",
  },
  {
    id: "package_4",
    name: "Mantenimiento Diabético",
    numberOfSessions: 12,
    totalPrice: 600,
    notes: "Cuidado especializado para pies diabéticos",
    isActive: false,
    createdAt: "2024-01-04T00:00:00",
    updatedAt: "2024-01-20T00:00:00",
  },
];

// Mock package sessions data
const mockPackageSessions: PackageSession[] = [
  {
    id: "session_1",
    patientPackageId: "patient_package_1",
    appointmentId: "appointment_1",
    usedAt: "2024-01-15T10:00:00",
    notes: "Primera sesión - evaluación inicial",
  },
  {
    id: "session_2",
    patientPackageId: "patient_package_1",
    appointmentId: "appointment_2",
    usedAt: "2024-01-22T10:00:00",
    notes: "Segunda sesión - tratamiento aplicado",
  },
  {
    id: "session_3",
    patientPackageId: "patient_package_2",
    appointmentId: "appointment_3",
    usedAt: "2024-01-18T14:00:00",
    notes: "Sesión inicial de tratamiento",
  },
];

export function ServicePackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageType[]>(mockPackages);
  const [patientPackages, setPatientPackages] =
    useState<PatientPackage[]>(mockPatientPackages);
  const [packageSessions, setPackageSessions] =
    useState<PackageSession[]>(mockPackageSessions);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPackages, setFilteredPackages] =
    useState<PackageType[]>(packages);
  const [filteredPatientPackages, setFilteredPatientPackages] = useState<
    PatientPackage[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageStatusFilter, setPackageStatusFilter] = useState<string>("all");
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(
    null,
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for new/edit package
  const [packageFormData, setPackageFormData] = useState<CreatePackageRequest>({
    name: "",
    numberOfSessions: 1,
    totalPrice: 0,
    notes: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter packages based on search term and status
    let filtered = packages;

    if (searchTerm) {
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pkg.notes &&
            pkg.notes.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((pkg) => pkg.isActive === isActive);
    }

    setFilteredPackages(filtered);
  }, [packages, searchTerm, statusFilter]);

  useEffect(() => {
    // Filter patient packages
    let filtered = patientPackages;

    if (packageStatusFilter !== "all") {
      switch (packageStatusFilter) {
        case "active":
          filtered = filtered.filter(
            (pp) => pp.isActive && pp.remainingSessions > 0,
          );
          break;
        case "completed":
          filtered = filtered.filter(
            (pp) => pp.remainingSessions === 0 && pp.completedAt,
          );
          break;
        case "expired":
          filtered = filtered.filter((pp) => !pp.isActive);
          break;
      }
    }

    setFilteredPatientPackages(filtered);
  }, [patientPackages, packageStatusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const patientsData = getMockPatients();
      setPatients(patientsData);

      // Link packages to patient packages
      const enrichedPatientPackages = mockPatientPackages.map((pp) => ({
        ...pp,
        package: packages.find((p) => p.id === pp.packageId),
        patient: patientsData.find((p) => p.id === pp.patientId),
      }));
      setPatientPackages(enrichedPatientPackages);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!packageFormData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (packageFormData.numberOfSessions < 1) {
      errors.numberOfSessions = "Debe tener al menos 1 sesión";
    }

    if (packageFormData.totalPrice <= 0) {
      errors.totalPrice = "El precio debe ser mayor a 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPackage = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newPackage: PackageType = {
        id: `package_${Date.now()}`,
        name: packageFormData.name,
        numberOfSessions: packageFormData.numberOfSessions,
        totalPrice: packageFormData.totalPrice,
        notes: packageFormData.notes,
        isActive: packageFormData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPackages([...packages, newPackage]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding package:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPackage = async () => {
    if (!validateForm() || !selectedPackage) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedPackage: PackageType = {
        ...selectedPackage,
        name: packageFormData.name,
        numberOfSessions: packageFormData.numberOfSessions,
        totalPrice: packageFormData.totalPrice,
        notes: packageFormData.notes,
        isActive: packageFormData.isActive,
        updatedAt: new Date().toISOString(),
      };

      setPackages(
        packages.map((p) => (p.id === selectedPackage.id ? updatedPackage : p)),
      );
      setIsEditDialogOpen(false);
      setSelectedPackage(null);
      resetForm();
    } catch (error) {
      console.error("Error editing package:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (pkg: PackageType) => {
    const associatedPatientPackages = patientPackages.filter(
      (pp) => pp.packageId === pkg.id,
    );

    if (associatedPatientPackages.length > 0) {
      alert(
        `No se puede eliminar el paquete "${pkg.name}" porque tiene ${associatedPatientPackages.length} asignación(es) a pacientes.`,
      );
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar el paquete "${pkg.name}"?`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPackages(packages.filter((p) => p.id !== pkg.id));
    } catch (error) {
      console.error("Error deleting package:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePackageStatus = async (pkg: PackageType) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updatedPackage = {
        ...pkg,
        isActive: !pkg.isActive,
        updatedAt: new Date().toISOString(),
      };
      setPackages(packages.map((p) => (p.id === pkg.id ? updatedPackage : p)));
    } catch (error) {
      console.error("Error toggling package status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (pkg: PackageType) => {
    setSelectedPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      numberOfSessions: pkg.numberOfSessions,
      totalPrice: pkg.totalPrice,
      notes: pkg.notes || "",
      isActive: pkg.isActive,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setPackageFormData({
      name: "",
      numberOfSessions: 1,
      totalPrice: 0,
      notes: "",
      isActive: true,
    });
    setFormErrors({});
  };

  const getPackageStatusBadge = (patientPackage: PatientPackage) => {
    if (!patientPackage.isActive) {
      return (
        <Badge variant="secondary" className="text-xs">
          Expirado
        </Badge>
      );
    }
    if (patientPackage.remainingSessions === 0) {
      return (
        <Badge variant="outline" className="text-xs text-green-600">
          Completado
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="text-xs">
        Activo
      </Badge>
    );
  };

  const getSessionsUsed = (patientPackageId: string) => {
    return packageSessions.filter(
      (s) => s.patientPackageId === patientPackageId,
    ).length;
  };

  if (isLoading && packages.length === 0) {
    return (
      <Layout
        title="Paquetes y Sesiones"
        subtitle="Gestión de paquetes de servicios"
      >
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="loading-shimmer h-16 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Paquetes y Sesiones"
      subtitle="Gestión de paquetes de servicios"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/packages")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Paquetes
          </Button>
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Paquete
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Paquetes
                  </p>
                  <p className="text-2xl font-bold">{packages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green/10 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pacientes Asignados
                  </p>
                  <p className="text-2xl font-bold">{patientPackages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue/10 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Paquetes Activos
                  </p>
                  <p className="text-2xl font-bold">
                    {
                      patientPackages.filter(
                        (pp) => pp.isActive && pp.remainingSessions > 0,
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Sesiones Utilizadas
                  </p>
                  <p className="text-2xl font-bold">{packageSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="packages">Paquetes de Servicio</TabsTrigger>
            <TabsTrigger value="assignments">
              Asignaciones a Pacientes
            </TabsTrigger>
          </TabsList>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-4">
            {/* Search and Filters */}
            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paquetes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
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

            {/* Packages Table */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Paquetes de Servicio ({filteredPackages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPackages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      No se encontraron paquetes
                    </p>
                    <p className="text-sm">
                      {searchTerm
                        ? "Intenta ajustar tu búsqueda"
                        : "Crea tu primer paquete de servicios"}
                    </p>
                    {!searchTerm && (
                      <Button onClick={openAddDialog} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Paquete
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre del Paquete</TableHead>
                          <TableHead>Sesiones</TableHead>
                          <TableHead>Precio Total</TableHead>
                          <TableHead>Precio por Sesión</TableHead>
                          <TableHead>Asignados</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPackages.map((pkg) => {
                          const assignedCount = patientPackages.filter(
                            (pp) => pp.packageId === pkg.id,
                          ).length;
                          const pricePerSession = (
                            pkg.totalPrice / pkg.numberOfSessions
                          ).toFixed(2);

                          return (
                            <TableRow
                              key={pkg.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">{pkg.name}</div>
                                  {pkg.notes && (
                                    <div className="text-sm text-muted-foreground max-w-md truncate">
                                      {pkg.notes}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {pkg.numberOfSessions} sesiones
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  S/ {pkg.totalPrice.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  S/ {pricePerSession}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {assignedCount} pacientes
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      pkg.isActive ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {pkg.isActive ? "Activo" : "Inactivo"}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleTogglePackageStatus(pkg)
                                    }
                                    className="p-1"
                                  >
                                    <Switch checked={pkg.isActive} />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(pkg)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePackage(pkg)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patient Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            {/* Assignment Filters */}
            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label className="text-sm text-muted-foreground">
                      Filtrar por estado
                    </Label>
                  </div>
                  <Select
                    value={packageStatusFilter}
                    onValueChange={setPackageStatusFilter}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="completed">Completados</SelectItem>
                      <SelectItem value="expired">Expirados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Patient Packages Table */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Paquetes Asignados a Pacientes (
                  {filteredPatientPackages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPatientPackages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      No hay paquetes asignados
                    </p>
                    <p className="text-sm">
                      Los paquetes asignados a pacientes aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paciente</TableHead>
                          <TableHead>Paquete</TableHead>
                          <TableHead>Progreso</TableHead>
                          <TableHead>Fecha de Compra</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Última Sesión</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPatientPackages.map((patientPackage) => {
                          const sessionsUsed = getSessionsUsed(
                            patientPackage.id,
                          );
                          const totalSessions =
                            patientPackage.package?.numberOfSessions || 0;
                          const lastSession = packageSessions
                            .filter(
                              (s) => s.patientPackageId === patientPackage.id,
                            )
                            .sort(
                              (a, b) =>
                                new Date(b.usedAt).getTime() -
                                new Date(a.usedAt).getTime(),
                            )[0];

                          return (
                            <TableRow
                              key={patientPackage.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {patientPackage.patient?.firstName}{" "}
                                    {patientPackage.patient?.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    DNI: {patientPackage.patient?.documentId}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {patientPackage.package?.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {totalSessions} sesiones
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 bg-muted rounded-full h-2">
                                      <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${
                                            (sessionsUsed / totalSessions) * 100
                                          }%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {sessionsUsed}/{totalSessions}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {patientPackage.remainingSessions} restantes
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {new Date(
                                    patientPackage.purchasedAt,
                                  ).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getPackageStatusBadge(patientPackage)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {lastSession
                                    ? new Date(
                                        lastSession.usedAt,
                                      ).toLocaleDateString()
                                    : "Ninguna"}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="font-medium">
                                  S/{" "}
                                  {patientPackage.package?.totalPrice.toFixed(
                                    2,
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Package Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nuevo Paquete de Servicio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nombre del Paquete *</Label>
              <Input
                id="add-name"
                value={packageFormData.name}
                onChange={(e) =>
                  setPackageFormData({
                    ...packageFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Ej: Tratamiento Completo Podológico"
                className={cn(formErrors.name && "border-destructive")}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-sessions">Número de Sesiones *</Label>
                <Input
                  id="add-sessions"
                  type="number"
                  min="1"
                  value={packageFormData.numberOfSessions}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      numberOfSessions: parseInt(e.target.value) || 1,
                    })
                  }
                  className={cn(
                    formErrors.numberOfSessions && "border-destructive",
                  )}
                />
                {formErrors.numberOfSessions && (
                  <p className="text-sm text-destructive">
                    {formErrors.numberOfSessions}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-price">Precio Total *</Label>
                <Input
                  id="add-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={packageFormData.totalPrice}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      totalPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className={cn(formErrors.totalPrice && "border-destructive")}
                />
                {formErrors.totalPrice && (
                  <p className="text-sm text-destructive">
                    {formErrors.totalPrice}
                  </p>
                )}
              </div>
            </div>

            {packageFormData.numberOfSessions > 0 &&
              packageFormData.totalPrice > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Precio por sesión:</strong> S/{" "}
                    {(
                      packageFormData.totalPrice /
                      packageFormData.numberOfSessions
                    ).toFixed(2)}
                  </p>
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="add-notes">Descripción</Label>
              <Textarea
                id="add-notes"
                value={packageFormData.notes}
                onChange={(e) =>
                  setPackageFormData({
                    ...packageFormData,
                    notes: e.target.value,
                  })
                }
                placeholder="Descripción del paquete y servicios incluidos"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="add-active"
                checked={packageFormData.isActive}
                onCheckedChange={(checked) =>
                  setPackageFormData({ ...packageFormData, isActive: checked })
                }
              />
              <Label htmlFor="add-active">Paquete activo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddPackage} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Paquete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Paquete de Servicio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del Paquete *</Label>
              <Input
                id="edit-name"
                value={packageFormData.name}
                onChange={(e) =>
                  setPackageFormData({
                    ...packageFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Ej: Tratamiento Completo Podológico"
                className={cn(formErrors.name && "border-destructive")}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sessions">Número de Sesiones *</Label>
                <Input
                  id="edit-sessions"
                  type="number"
                  min="1"
                  value={packageFormData.numberOfSessions}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      numberOfSessions: parseInt(e.target.value) || 1,
                    })
                  }
                  className={cn(
                    formErrors.numberOfSessions && "border-destructive",
                  )}
                />
                {formErrors.numberOfSessions && (
                  <p className="text-sm text-destructive">
                    {formErrors.numberOfSessions}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Precio Total *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={packageFormData.totalPrice}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      totalPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                  className={cn(formErrors.totalPrice && "border-destructive")}
                />
                {formErrors.totalPrice && (
                  <p className="text-sm text-destructive">
                    {formErrors.totalPrice}
                  </p>
                )}
              </div>
            </div>

            {packageFormData.numberOfSessions > 0 &&
              packageFormData.totalPrice > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Precio por sesión:</strong> S/{" "}
                    {(
                      packageFormData.totalPrice /
                      packageFormData.numberOfSessions
                    ).toFixed(2)}
                  </p>
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Descripción</Label>
              <Textarea
                id="edit-notes"
                value={packageFormData.notes}
                onChange={(e) =>
                  setPackageFormData({
                    ...packageFormData,
                    notes: e.target.value,
                  })
                }
                placeholder="Descripción del paquete y servicios incluidos"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={packageFormData.isActive}
                onCheckedChange={(checked) =>
                  setPackageFormData({ ...packageFormData, isActive: checked })
                }
              />
              <Label htmlFor="edit-active">Paquete activo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditPackage} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default ServicePackages;
