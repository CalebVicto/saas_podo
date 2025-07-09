import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  Users,
  FileText,
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
import { cn } from "@/lib/utils";
import { getAllMockWorkers } from "@/lib/mockData";
import Layout from "@/components/Layout";

interface WorkerType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateWorkerTypeRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

function useAuth() {
  const user = JSON.parse(localStorage.getItem("podocare_user") || "{}");
  return { user };
}

export default function WorkerTypes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workerTypes, setWorkerTypes] = useState<WorkerType[]>([]);
  const [filteredWorkerTypes, setFilteredWorkerTypes] = useState<WorkerType[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkerType, setSelectedWorkerType] =
    useState<WorkerType | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for new/edit worker type
  const [formData, setFormData] = useState<CreateWorkerTypeRequest>({
    name: "",
    description: "",
    isActive: true,
  });

  // Check user role
  const isAdmin = user.role === "admin";

  // Load worker types on component mount
  useEffect(() => {
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    loadWorkerTypes();
  }, [isAdmin, navigate]);

  // Filter worker types based on search
  useEffect(() => {
    let filtered = workerTypes;

    if (searchTerm) {
      filtered = filtered.filter(
        (workerType) =>
          workerType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workerType.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredWorkerTypes(filtered);
  }, [workerTypes, searchTerm]);

  const loadWorkerTypes = async () => {
    setIsLoading(true);
    try {
      // Initialize with default worker types
      const defaultWorkerTypes: WorkerType[] = [
        {
          id: "1",
          name: "Podólogo",
          description:
            "Especialista en tratamiento de pies y patologías podológicas",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Doctor",
          description: "Médico general con conocimientos en podología",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "3",
          name: "Enfermero",
          description:
            "Personal de enfermería especializado en cuidados podológicos",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "4",
          name: "Masajista",
          description: "Especialista en masajes terapéuticos para pies",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "5",
          name: "Fisioterapeuta",
          description: "Especialista en fisioterapia y rehabilitación",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "6",
          name: "Técnico en Podología",
          description:
            "Técnico especializado en procedimientos podológicos básicos",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "7",
          name: "Asistente",
          description: "Personal de apoyo en consultas y procedimientos",
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      setWorkerTypes(defaultWorkerTypes);
    } catch (error) {
      console.error("Error loading worker types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorkerType = async () => {
    try {
      const newWorkerType: WorkerType = {
        id: (workerTypes.length + 1).toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setWorkerTypes([...workerTypes, newWorkerType]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding worker type:", error);
    }
  };

  const handleUpdateWorkerType = async () => {
    if (!selectedWorkerType) return;

    try {
      const updatedWorkerType: WorkerType = {
        ...selectedWorkerType,
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      setWorkerTypes(
        workerTypes.map((wt) =>
          wt.id === selectedWorkerType.id ? updatedWorkerType : wt,
        ),
      );
      setIsEditDialogOpen(false);
      setSelectedWorkerType(null);
      resetForm();
    } catch (error) {
      console.error("Error updating worker type:", error);
    }
  };

  const handleDeleteWorkerType = async (workerTypeId: string) => {
    if (
      !confirm("¿Estás seguro de que quieres eliminar este tipo de trabajador?")
    ) {
      return;
    }

    try {
      setWorkerTypes(workerTypes.filter((wt) => wt.id !== workerTypeId));
    } catch (error) {
      console.error("Error deleting worker type:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      isActive: true,
    });
  };

  const openEditDialog = (workerType: WorkerType) => {
    setSelectedWorkerType(workerType);
    setFormData({
      name: workerType.name,
      description: workerType.description || "",
      isActive: workerType.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const getWorkerTypeUsage = (workerTypeId: string) => {
    const workers = getAllMockWorkers();
    const workerType = workerTypes.find((wt) => wt.id === workerTypeId);
    if (!workerType) return 0;

    return workers.filter((w) => w.workerType === workerType.name).length;
  };

  if (!isAdmin) return null;

  return (
    <Layout
      title="Tipos de Trabajador"
      subtitle="Gestiona los tipos de trabajador disponibles"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Tipos de Trabajador
              </h1>
              <p className="text-muted-foreground">
                Configura los tipos de trabajador disponibles
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Tipo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total de Tipos
                  </p>
                  <p className="font-semibold">{workerTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Users className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipos Activos</p>
                  <p className="font-semibold">
                    {workerTypes.filter((wt) => wt.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trabajadores</p>
                  <p className="font-semibold">{getAllMockWorkers().length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tipo de trabajador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Worker Types Table */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>
              Tipos de Trabajador ({filteredWorkerTypes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-16 rounded"></div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Trabajadores</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkerTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No se encontraron tipos de trabajador</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWorkerTypes.map((workerType) => {
                      const usage = getWorkerTypeUsage(workerType.id);
                      return (
                        <TableRow key={workerType.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{workerType.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  workerType.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {workerType.description || "Sin descripción"}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {usage} trabajadores
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                workerType.isActive ? "default" : "secondary"
                              }
                            >
                              {workerType.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openEditDialog(workerType)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteWorkerType(workerType.id)
                                }
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                disabled={usage > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Worker Type Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nuevo Tipo de Trabajador
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Especialista en Pies"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción del tipo de trabajador..."
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
                onClick={handleAddWorkerType}
                className="btn-primary"
                disabled={!formData.name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Crear Tipo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Worker Type Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Tipo de Trabajador
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Nombre *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Descripción</Label>
                <Textarea
                  id="editDescription"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
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
                  setSelectedWorkerType(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateWorkerType}
                className="btn-primary"
                disabled={!formData.name.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
