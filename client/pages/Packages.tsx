import { Pagination } from "@/components/ui/pagination";
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
import { Switch } from "@/components/ui/switch";
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
import { apiGet, apiPost, apiPut, type ApiResponse } from "@/lib/auth";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { toast } from "@/hooks/use-toast";

interface CreatePackageRequest {
  name: string;
  numberOfSessions: number;
  totalPrice: number;
  notes?: string;
}

export default function Packages() {
  const [showStats, setShowStats] = useState(false);
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
  const [packageFormData, setPackageFormData] = useState<CreatePackageRequest & { status: boolean }>({
    name: "",
    numberOfSessions: 1,
    totalPrice: 0,
    notes: "",
    status: true,
  });
  <div className="space-y-2">
    <Label htmlFor="editPackageStatus">Estado</Label>
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">Inactivo</span>
      <Switch
        id="editPackageStatus"
        checked={packageFormData.status}
        onCheckedChange={(checked) => setPackageFormData({ ...packageFormData, status: checked })}
      />
      <span className="text-muted-foreground">Activo</span>
    </div>
  </div>

  // Paginación estilo Products
  const pagination = useRepositoryPagination<any>({ initialPageSize: 10 });

  // Cargar paquetes desde la API con paginación
  useEffect(() => {
    pagination.loadData(async (params) => {
      const resp = await apiGet<ApiResponse<any>>(
        `/package?page=${params.page}&limit=${params.limit}&search=${encodeURIComponent(pagination.searchTerm)}`,
        undefined
      );
      if (resp.error || resp.data?.state === "error") {
        toast({
          title: "Error al cargar paquetes",
          description: resp.data?.message || resp.error || "Ocurrió un error inesperado.",
          variant: "destructive",
        });
        return {
          items: [],
          total: 0,
          page: params.page,
          limit: params.limit,
          totalPages: 1,
        };
      }
      const apiData = resp.data?.data;
      return {
        items: apiData?.data || [],
        total: apiData?.total || 0,
        page: apiData?.page || params.page,
        limit: apiData?.limit || params.limit,
        totalPages: Math.ceil((apiData?.total || 0) / (apiData?.limit || params.limit)),
      };
    });
  }, [pagination.currentPage, pagination.pageSize, pagination.searchTerm]);

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
      status: true,
    });
  };

  // Crear paquete usando la API
  const handleAddPackage = async () => {
    try {
      const resp = await apiPost<ApiResponse<Package>>("/package", {
        name: packageFormData.name,
        description: packageFormData.notes || "",
        price: packageFormData.totalPrice,
        sessions: packageFormData.numberOfSessions,
      });

      // Si la API responde con error (por ejemplo, nombre duplicado)
      if (resp.error || (resp.data && resp.data.state === "error")) {
        toast({
          title: "Error al crear paquete",
          description:
            resp.data?.message || resp.error || "Ocurrió un error inesperado.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Paquete creado",
        description: `El paquete "${packageFormData.name}" fue creado exitosamente.`,
        variant: "default",
      });
      setIsAddPackageDialogOpen(false);
      resetPackageForm();
      // Recargar la lista de paquetes
      pagination.loadData(async (params) => {
        const resp = await apiGet<ApiResponse<any>>(
          `/package?page=${params.page}&limit=${params.limit}&search=${encodeURIComponent(pagination.searchTerm)}`,
          undefined
        );
        if (resp.error || resp.data?.state === "error") {
          toast({
            title: "Error al cargar paquetes",
            description: resp.data?.message || resp.error || "Ocurrió un error inesperado.",
            variant: "destructive",
          });
          return {
            items: [],
            total: 0,
            page: params.page,
            limit: params.limit,
            totalPages: 1,
          };
        }
        const apiData = resp.data?.data;
        return {
          items: apiData?.data || [],
          total: apiData?.total || 0,
          page: apiData?.page || params.page,
          limit: apiData?.limit || params.limit,
          totalPages: Math.ceil((apiData?.total || 0) / (apiData?.limit || params.limit)),
        };
      });
    } catch (error: any) {
      toast({
        title: "Error de red",
        description: error?.message || "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
      console.error("Error creando paquete:", error);
    }
  };

  const handleEditPackage = async () => {
    if (!selectedPackage) return;
    try {
      const resp = await apiPut<ApiResponse<Package>>(
        `/package/${selectedPackage.id}`,
        {
          name: packageFormData.name,
          description: packageFormData.notes || "",
          price: packageFormData.totalPrice,
          sessions: packageFormData.numberOfSessions,
          status: packageFormData.status ? "active" : "inactive",
        }
      );
      if (resp.error || (resp.data && resp.data.state === "error")) {
        toast({
          title: "Error al editar paquete",
          description:
            resp.data?.message || resp.error || "Ocurrió un error inesperado.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Paquete actualizado",
        description: resp.data?.message || "El paquete fue editado exitosamente.",
        variant: "default",
      });
      setIsEditPackageDialogOpen(false);
      resetPackageForm();
      setSelectedPackage(null);
      // Recargar la lista de paquetes
      pagination.loadData(async (params) => {
        const resp = await apiGet<ApiResponse<any>>(
          `/package?page=${params.page}&limit=${params.limit}&search=${encodeURIComponent(pagination.searchTerm)}`,
          undefined
        );
        if (resp.error || resp.data?.state === "error") {
          toast({
            title: "Error al cargar paquetes",
            description: resp.data?.message || resp.error || "Ocurrió un error inesperado.",
            variant: "destructive",
          });
          return {
            items: [],
            total: 0,
            page: params.page,
            limit: params.limit,
            totalPages: 1,
          };
        }
        const apiData = resp.data?.data;
        return {
          items: apiData?.data || [],
          total: apiData?.total || 0,
          page: apiData?.page || params.page,
          limit: apiData?.limit || params.limit,
          totalPages: Math.ceil((apiData?.total || 0) / (apiData?.limit || params.limit)),
        };
      });
    } catch (error: any) {
      toast({
        title: "Error de red",
        description: error?.message || "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
      console.error("Error editando paquete:", error);
    }
  };

  const openEditPackageDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPackageFormData({
      name: pkg.name || "",
      numberOfSessions: pkg.sessions || 1,
      totalPrice: pkg.price || 0,
      notes: pkg.description || "",
      status: pkg.status === "active",
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
      .reduce((sum, pp) => sum + (pp.package?.price || 0), 0);

    return { patientPackagesCount, totalRevenue };
  };

  const getSessionsUsed = (patientPackageId: string) => {
    return packageSessions.filter(
      (ps) => ps.patientPackageId === patientPackageId,
    ).length;
  };

  const activePackages = packages.filter((p) => p.isActive);
  const totalRevenue = patientPackages.reduce(
    (sum, pp) => sum + (pp.package?.price || 0),
    0,
  );
  const activePatientPackages = patientPackages.filter((pp) => pp.isActive);

  return (
    <Layout
      title="Paquetes"
      subtitle="Gestiona paquetes de tratamiento"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PackageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
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
        {showStats && (
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
        )}

        {/* Search */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paquete..."
                value={pagination.searchTerm}
                onChange={(e) => pagination.setSearchTerm(e.target.value)}
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

            {/* Paginador */}
            <div className="">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                onPageChange={pagination.goToPage}
                onPageSizeChange={pagination.setPageSize}
              />
            </div>

            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Sesiones</TableHead>
                  <TableHead>Precio</TableHead>
                  {/* <TableHead>Pacientes</TableHead> */}
                  {/* <TableHead>Ingresos</TableHead> */}
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.data.map((pkg) => {
                  const usage = getPackageUsage(pkg.id);
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          {pkg.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {pkg.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pkg.sessions} sesiones
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        S/ {pkg.price?.toFixed(2)}
                      </TableCell>
                      {/* <TableCell>{usage.patientPackagesCount}</TableCell> */}
                      {/* <TableCell>
                        S/ {usage.totalRevenue.toFixed(2)}
                      </TableCell> */}
                      <TableCell>
                        <Badge
                          variant={pkg.status === "active" ? "default" : "secondary"}
                        >
                          {pkg.status === "active" ? "Activo" : "Inactivo"}
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
                <Label htmlFor="packageNotes">Descripción</Label>
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
                <Label htmlFor="editPackageNotes">Descripción</Label>
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
                    {selectedPackage.sessions} sesiones por S/{" "}
                    {selectedPackage.price.toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Número de Sesiones
                    </Label>
                    <p className="font-medium text-lg">
                      {selectedPackage.sessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Precio Total
                    </Label>
                    <p className="font-medium text-lg">
                      S/ {selectedPackage.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Precio por Sesión
                    </Label>
                    <p className="font-medium text-lg">
                      S/{" "}
                      {(
                        selectedPackage.price /
                        selectedPackage.sessions
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
                      Descripción
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
                    {selectedPatientPackage.patient?.paternalSurname}
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
                      {selectedPatientPackage.package?.sessions}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">
                      Precio Pagado
                    </Label>
                    <p className="font-medium text-lg">
                      S/ {selectedPatientPackage.package?.price.toFixed(2)}
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
