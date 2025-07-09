import React, { useState, useEffect } from "react";
import {
  Package as PackageIcon,
  Plus,
  Search,
  Edit,
  Eye,
  Users,
  DollarSign,
  Calendar,
  FileText,
  Save,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Package, PatientPackage, PackageSession, Patient } from "@shared/api";
import {
  mockPackages,
  mockPatientPackages,
  mockPackageSessions,
  mockPatients,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

interface CreatePackageRequest {
  name: string;
  numberOfSessions: number;
  totalPrice: number;
  notes?: string;
}

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [packageSessions, setPackageSessions] = useState<PackageSession[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedPatientPackage, setSelectedPatientPackage] =
    useState<PatientPackage | null>(null);

  // Dialog states
  const [isAddPackageDialogOpen, setIsAddPackageDialogOpen] = useState(false);
  const [isEditPackageDialogOpen, setIsEditPackageDialogOpen] = useState(false);
  const [isViewPackageDialogOpen, setIsViewPackageDialogOpen] = useState(false);
  const [isViewPatientPackageDialogOpen, setIsViewPatientPackageDialogOpen] =
    useState(false);

  // Form state
  const [packageFormData, setPackageFormData] = useState<CreatePackageRequest>({
    name: "",
    numberOfSessions: 1,
    totalPrice: 0,
    notes: "",
  });

  useEffect(() => {
    // Load mock data
    try {
      setPackages(mockPackages);
      setPatientPackages(mockPatientPackages);
      setPackageSessions(mockPackageSessions);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  }, []);

  // Filter packages based on search
  useEffect(() => {
    let filtered = packages;

    if (searchTerm) {
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pkg.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredPackages(filtered);
  }, [packages, searchTerm]);

  const resetPackageForm = () => {
    setPackageFormData({
      name: "",
      numberOfSessions: 1,
      totalPrice: 0,
      notes: "",
    });
  };

  const handleAddPackage = () => {
    const newPackage: Package = {
      id: (packages.length + 1).toString(),
      ...packageFormData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPackages([...packages, newPackage]);
    setIsAddPackageDialogOpen(false);
    resetPackageForm();
  };

  const handleEditPackage = () => {
    if (!selectedPackage) return;

    const updatedPackage: Package = {
      ...selectedPackage,
      ...packageFormData,
      updatedAt: new Date().toISOString(),
    };

    setPackages(
      packages.map((p) => (p.id === selectedPackage.id ? updatedPackage : p)),
    );
    setIsEditPackageDialogOpen(false);
    resetPackageForm();
    setSelectedPackage(null);
  };

  const openEditPackageDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      numberOfSessions: pkg.numberOfSessions,
      totalPrice: pkg.totalPrice,
      notes: pkg.notes || "",
    });
    setIsEditPackageDialogOpen(true);
  };

  const openViewPackageDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsViewPackageDialogOpen(true);
  };

  const openViewPatientPackageDialog = (patientPkg: PatientPackage) => {
    setSelectedPatientPackage(patientPkg);
    setIsViewPatientPackageDialogOpen(true);
  };

  const getPackageUsage = (packageId: string) => {
    const patientPackagesCount = patientPackages.filter(
      (pp) => pp.packageId === packageId && pp.isActive,
    ).length;
    const totalRevenue = patientPackages
      .filter((pp) => pp.packageId === packageId)
      .reduce((sum, pp) => sum + (pp.package?.totalPrice || 0), 0);

    return { patientPackagesCount, totalRevenue };
  };

  const getSessionsUsed = (patientPackageId: string) => {
    return packageSessions.filter(
      (ps) => ps.patientPackageId === patientPackageId,
    ).length;
  };

  const activePackages = packages.filter((p) => p.isActive);
  const totalRevenue = patientPackages.reduce(
    (sum, pp) => sum + (pp.package?.totalPrice || 0),
    0,
  );
  const activePatientPackages = patientPackages.filter((pp) => pp.isActive);

  return (
    <Layout
      title="Paquetes y Sesiones"
      subtitle="Gestiona paquetes de tratamiento y seguimiento de sesiones"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PackageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Paquetes de Tratamiento
              </h1>
              <p className="text-muted-foreground">
                Gestiona paquetes y sesiones de tratamiento
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsAddPackageDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Paquete
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <PackageIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Paquetes Activos
                  </p>
                  <p className="font-semibold">{activePackages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pacientes con Paquetes
                  </p>
                  <p className="font-semibold">
                    {activePatientPackages.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Ingresos por Paquetes
                  </p>
                  <p className="font-semibold">S/ {totalRevenue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Sesiones Usadas
                  </p>
                  <p className="font-semibold">{packageSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="packages">Paquetes de Tratamiento</TabsTrigger>
            <TabsTrigger value="patient-packages">
              Paquetes de Pacientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4">
            {/* Search */}
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar paquete..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Packages Table */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Paquetes Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Sesiones</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Pacientes</TableHead>
                      <TableHead>Ingresos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.map((pkg) => {
                      const usage = getPackageUsage(pkg.id);
                      return (
                        <TableRow key={pkg.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pkg.name}</p>
                              {pkg.notes && (
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {pkg.notes}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {pkg.numberOfSessions} sesiones
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            S/ {pkg.totalPrice.toFixed(2)}
                          </TableCell>
                          <TableCell>{usage.patientPackagesCount}</TableCell>
                          <TableCell>
                            S/ {usage.totalRevenue.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={pkg.isActive ? "default" : "secondary"}
                            >
                              {pkg.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openViewPackageDialog(pkg)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => openEditPackageDialog(pkg)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patient-packages" className="space-y-4">
            {/* Patient Packages Table */}
            <Card className="card-modern">
              <CardHeader>
                <CardTitle>Paquetes de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Paquete</TableHead>
                      <TableHead>Sesiones Restantes</TableHead>
                      <TableHead>Sesiones Usadas</TableHead>
                      <TableHead>Fecha de Compra</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientPackages.map((patientPkg) => {
                      const sessionsUsed = getSessionsUsed(patientPkg.id);
                      const totalSessions =
                        patientPkg.package?.numberOfSessions || 0;
                      const progress =
                        totalSessions > 0
                          ? ((totalSessions - patientPkg.remainingSessions) /
                              totalSessions) *
                            100
                          : 0;

                      return (
                        <TableRow key={patientPkg.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {patientPkg.patient?.firstName}{" "}
                                {patientPkg.patient?.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                DNI: {patientPkg.patient?.documentId}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {patientPkg.package?.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                S/ {patientPkg.package?.totalPrice.toFixed(2)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium",
                                  patientPkg.remainingSessions === 0
                                    ? "text-destructive"
                                    : patientPkg.remainingSessions <= 2
                                      ? "text-warning"
                                      : "text-foreground",
                                )}
                              >
                                {patientPkg.remainingSessions}
                              </span>
                              {patientPkg.remainingSessions === 0 && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {patientPkg.remainingSessions <= 2 &&
                                patientPkg.remainingSessions > 0 && (
                                  <AlertCircle className="w-4 h-4 text-warning" />
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{sessionsUsed}</span>
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              patientPkg.purchasedAt,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                patientPkg.remainingSessions === 0
                                  ? "default"
                                  : patientPkg.isActive
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {patientPkg.remainingSessions === 0
                                ? "Completado"
                                : patientPkg.isActive
                                  ? "Activo"
                                  : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() =>
                                openViewPatientPackageDialog(patientPkg)
                              }
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Package Dialog */}
        <Dialog
          open={isAddPackageDialogOpen}
          onOpenChange={setIsAddPackageDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nuevo Paquete de Tratamiento
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="packageName">Nombre del Paquete *</Label>
                <Input
                  id="packageName"
                  value={packageFormData.name}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Tratamiento Completo de Hongos"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numberOfSessions">Número de Sesiones *</Label>
                  <Input
                    id="numberOfSessions"
                    type="number"
                    min="1"
                    value={packageFormData.numberOfSessions}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        numberOfSessions: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalPrice">Precio Total *</Label>
                  <Input
                    id="totalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={packageFormData.totalPrice}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        totalPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageNotes">Notas</Label>
                <Textarea
                  id="packageNotes"
                  value={packageFormData.notes}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Descripción del paquete, incluye diagnóstico, tratamiento y seguimiento..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddPackageDialogOpen(false);
                  resetPackageForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddPackage}
                className="btn-primary"
                disabled={
                  !packageFormData.name ||
                  packageFormData.numberOfSessions < 1 ||
                  packageFormData.totalPrice <= 0
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Paquete
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Package Dialog */}
        <Dialog
          open={isEditPackageDialogOpen}
          onOpenChange={setIsEditPackageDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Paquete
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editPackageName">Nombre del Paquete *</Label>
                <Input
                  id="editPackageName"
                  value={packageFormData.name}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editNumberOfSessions">
                    Número de Sesiones *
                  </Label>
                  <Input
                    id="editNumberOfSessions"
                    type="number"
                    min="1"
                    value={packageFormData.numberOfSessions}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        numberOfSessions: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="editTotalPrice">Precio Total *</Label>
                  <Input
                    id="editTotalPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={packageFormData.totalPrice}
                    onChange={(e) =>
                      setPackageFormData({
                        ...packageFormData,
                        totalPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editPackageNotes">Notas</Label>
                <Textarea
                  id="editPackageNotes"
                  value={packageFormData.notes}
                  onChange={(e) =>
                    setPackageFormData({
                      ...packageFormData,
                      notes: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditPackageDialogOpen(false);
                  resetPackageForm();
                  setSelectedPackage(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditPackage}
                className="btn-primary"
                disabled={
                  !packageFormData.name ||
                  packageFormData.numberOfSessions < 1 ||
                  packageFormData.totalPrice <= 0
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Package Dialog */}
        <Dialog
          open={isViewPackageDialogOpen}
          onOpenChange={setIsViewPackageDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles del Paquete
              </DialogTitle>
            </DialogHeader>

            {selectedPackage && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedPackage.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedPackage.numberOfSessions} sesiones por S/{" "}
                    {selectedPackage.totalPrice.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Número de Sesiones
                    </Label>
                    <p className="font-medium text-lg">
                      {selectedPackage.numberOfSessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Precio Total
                    </Label>
                    <p className="font-medium text-lg">
                      S/ {selectedPackage.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Precio por Sesión
                    </Label>
                    <p className="font-medium text-lg">
                      S/{" "}
                      {(
                        selectedPackage.totalPrice /
                        selectedPackage.numberOfSessions
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Estado
                    </Label>
                    <Badge
                      variant={
                        selectedPackage.isActive ? "default" : "secondary"
                      }
                    >
                      {selectedPackage.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                {selectedPackage.notes && (
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Notas
                    </Label>
                    <div className="bg-muted/30 p-4 rounded-lg mt-2">
                      <p className="text-sm">{selectedPackage.notes}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Creado
                    </Label>
                    <p>
                      {new Date(selectedPackage.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Actualizado
                    </Label>
                    <p>
                      {new Date(selectedPackage.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPackage) {
                    openEditPackageDialog(selectedPackage);
                    setIsViewPackageDialogOpen(false);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => {
                  setIsViewPackageDialogOpen(false);
                  setSelectedPackage(null);
                }}
                className="btn-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Patient Package Dialog */}
        <Dialog
          open={isViewPatientPackageDialogOpen}
          onOpenChange={setIsViewPatientPackageDialogOpen}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Detalles del Paquete del Paciente
              </DialogTitle>
            </DialogHeader>

            {selectedPatientPackage && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedPatientPackage.patient?.firstName}{" "}
                    {selectedPatientPackage.patient?.lastName}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedPatientPackage.package?.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Sesiones Restantes
                    </Label>
                    <p className="font-medium text-lg text-primary">
                      {selectedPatientPackage.remainingSessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Total de Sesiones
                    </Label>
                    <p className="font-medium text-lg">
                      {selectedPatientPackage.package?.numberOfSessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Precio Pagado
                    </Label>
                    <p className="font-medium text-lg">
                      S/ {selectedPatientPackage.package?.totalPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Fecha de Compra
                    </Label>
                    <p className="font-medium">
                      {new Date(
                        selectedPatientPackage.purchasedAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Sessions History */}
                <div>
                  <Label className="text-muted-foreground text-sm">
                    Historial de Sesiones
                  </Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {packageSessions
                      .filter(
                        (ps) =>
                          ps.patientPackageId === selectedPatientPackage.id,
                      )
                      .map((session) => (
                        <div
                          key={session.id}
                          className="border rounded-lg p-3 bg-card"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {new Date(session.usedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge variant="outline">Completada</Badge>
                          </div>
                          {session.notes && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {session.notes}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setIsViewPatientPackageDialogOpen(false);
                  setSelectedPatientPackage(null);
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
