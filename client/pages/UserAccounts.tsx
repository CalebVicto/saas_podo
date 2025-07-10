import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCheck,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  User,
  Mail,
  Lock,
  Users,
  ToggleLeft,
  ToggleRight,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { User as UserType, Worker } from "@shared/api";
import { getAllMockWorkers } from "@/lib/mockData";
import Layout from "@/components/Layout";

interface SystemUser extends UserType {
  linkedWorkerId?: string;
  linkedWorker?: Worker;
  isActive: boolean;
  lastLogin?: string;
}

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: "admin" | "worker";
  linkedWorkerId?: string;
  isActive: boolean;
}

// Mock system users data
const mockSystemUsers: SystemUser[] = [
  {
    id: "user_1",
    name: "Administrador Principal",
    email: "admin@podocare.com",
    role: "admin",
    isActive: true,
    createdAt: "2024-01-01T00:00:00",
    updatedAt: "2024-01-15T10:30:00",
    lastLogin: "2024-01-24T14:22:00",
  },
  {
    id: "user_2",
    name: "Dr. Carlos Smith",
    email: "carlos.smith@podocare.com",
    role: "worker",
    linkedWorkerId: "worker_1",
    isActive: true,
    createdAt: "2024-01-02T00:00:00",
    updatedAt: "2024-01-20T09:15:00",
    lastLogin: "2024-01-24T08:45:00",
  },
  {
    id: "user_3",
    name: "Dra. Ana Johnson",
    email: "ana.johnson@podocare.com",
    role: "worker",
    linkedWorkerId: "worker_2",
    isActive: true,
    createdAt: "2024-01-03T00:00:00",
    updatedAt: "2024-01-18T16:20:00",
    lastLogin: "2024-01-23T17:30:00",
  },
  {
    id: "user_4",
    name: "María González",
    email: "maria.gonzalez@podocare.com",
    role: "worker",
    isActive: false,
    createdAt: "2024-01-10T00:00:00",
    updatedAt: "2024-01-22T11:45:00",
    lastLogin: "2024-01-20T13:15:00",
  },
];

export function UserAccounts() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<SystemUser[]>(mockSystemUsers);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLinkWorkerDialogOpen, setIsLinkWorkerDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state for new/edit user
  const [userFormData, setUserFormData] = useState<CreateUserRequest>({
    name: "",
    email: "",
    password: "",
    role: "worker",
    linkedWorkerId: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter users based on search term, role, and status
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const workersData = getAllMockWorkers();
      setWorkers(workersData);

      // Link workers to users
      const usersWithWorkers = users.map((user) => ({
        ...user,
        linkedWorker: user.linkedWorkerId
          ? workersData.find((w) => w.id === user.linkedWorkerId)
          : undefined,
      }));
      setUsers(usersWithWorkers);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!userFormData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!userFormData.email.trim()) {
      errors.email = "El correo electrónico es requerido";
    } else if (!/\S+@\S+\.\S+/.test(userFormData.email)) {
      errors.email = "El correo electrónico no es válido";
    }

    if (!selectedUser && !userFormData.password.trim()) {
      errors.password = "La contraseña es requerida";
    } else if (
      userFormData.password.trim() &&
      userFormData.password.length < 6
    ) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const linkedWorker = userFormData.linkedWorkerId
        ? workers.find((w) => w.id === userFormData.linkedWorkerId)
        : undefined;

      const newUser: SystemUser = {
        id: `user_${Date.now()}`,
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        linkedWorkerId: userFormData.linkedWorkerId || undefined,
        linkedWorker,
        isActive: userFormData.isActive,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUsers([...users, newUser]);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!validateForm() || !selectedUser) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const linkedWorker = userFormData.linkedWorkerId
        ? workers.find((w) => w.id === userFormData.linkedWorkerId)
        : undefined;

      const updatedUser: SystemUser = {
        ...selectedUser,
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        linkedWorkerId: userFormData.linkedWorkerId || undefined,
        linkedWorker,
        isActive: userFormData.isActive,
        updatedAt: new Date().toISOString(),
      };

      setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error("Error editing user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (user: SystemUser) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar al usuario "${user.name}"?`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (user: SystemUser) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updatedUser = {
        ...user,
        isActive: !user.isActive,
        updatedAt: new Date().toISOString(),
      };
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
    } catch (error) {
      console.error("Error toggling user status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkWorker = async (workerId: string) => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const linkedWorker = workers.find((w) => w.id === workerId);
      const updatedUser = {
        ...selectedUser,
        linkedWorkerId: workerId,
        linkedWorker,
        updatedAt: new Date().toISOString(),
      };

      setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      setIsLinkWorkerDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error linking worker:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkWorker = async (user: SystemUser) => {
    if (!confirm("¿Estás seguro de que quieres desvincular este trabajador?")) {
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updatedUser = {
        ...user,
        linkedWorkerId: undefined,
        linkedWorker: undefined,
        updatedAt: new Date().toISOString(),
      };
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
    } catch (error) {
      console.error("Error unlinking worker:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      linkedWorkerId: user.linkedWorkerId || "",
      isActive: user.isActive,
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openLinkWorkerDialog = (user: SystemUser) => {
    setSelectedUser(user);
    setIsLinkWorkerDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setUserFormData({
      name: "",
      email: "",
      password: "",
      role: "worker",
      linkedWorkerId: "",
      isActive: true,
    });
    setFormErrors({});
    setShowPassword(false);
  };

  const getUnlinkedWorkers = () => {
    const linkedWorkerIds = users
      .filter((u) => u.linkedWorkerId)
      .map((u) => u.linkedWorkerId);
    return workers.filter((w) => !linkedWorkerIds.includes(w.id));
  };

  if (isLoading && users.length === 0) {
    return (
      <Layout
        title="Cuentas de Usuario"
        subtitle="Gestión de usuarios del sistema"
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
      title="Cuentas de Usuario"
      subtitle="Gestión de usuarios del sistema"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/workers")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Trabajadores
            </Button>
          </div>
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="worker">Trabajador</SelectItem>
                </SelectContent>
              </Select>
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

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Usuarios
                  </p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Usuarios Activos
                  </p>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue/10 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Administradores
                  </p>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple/10 rounded-lg">
                  <LinkIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Usuarios Vinculados
                  </p>
                  <p className="text-2xl font-bold">
                    {users.filter((u) => u.linkedWorkerId).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Usuarios del Sistema ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  No se encontraron usuarios
                </p>
                <p className="text-sm">
                  {searchTerm
                    ? "Intenta ajustar tu búsqueda"
                    : "Crea tu primer usuario del sistema"}
                </p>
                {!searchTerm && (
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Trabajador Vinculado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin" ? "default" : "secondary"
                            }
                          >
                            {user.role === "admin"
                              ? "Administrador"
                              : "Trabajador"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.linkedWorker ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {user.linkedWorker.firstName}{" "}
                                {user.linkedWorker.lastName}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnlinkWorker(user)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Unlink className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                Sin vincular
                              </span>
                              {user.role === "worker" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openLinkWorkerDialog(user)}
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={user.isActive ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {user.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(user)}
                              className="p-1"
                            >
                              {user.isActive ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : "Nunca"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nuevo Usuario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nombre Completo *</Label>
              <Input
                id="add-name"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, name: e.target.value })
                }
                placeholder="Nombre completo del usuario"
                className={cn(formErrors.name && "border-destructive")}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Correo Electrónico *</Label>
              <Input
                id="add-email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                placeholder="usuario@podocare.com"
                className={cn(formErrors.email && "border-destructive")}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? "text" : "password"}
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Contraseña segura"
                  className={cn(formErrors.password && "border-destructive")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-destructive">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Rol *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value: "admin" | "worker") =>
                  setUserFormData({ ...userFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="worker">Trabajador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userFormData.role === "worker" && (
              <div className="space-y-2">
                <Label htmlFor="add-linkedWorker">
                  Vincular a Trabajador (Opcional)
                </Label>
                <Select
                  value={userFormData.linkedWorkerId}
                  onValueChange={(value) =>
                    setUserFormData({ ...userFormData, linkedWorkerId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar trabajador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin vincular</SelectItem>
                    {getUnlinkedWorkers().map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        {worker.firstName} {worker.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="add-active"
                checked={userFormData.isActive}
                onCheckedChange={(checked) =>
                  setUserFormData({ ...userFormData, isActive: checked })
                }
              />
              <Label htmlFor="add-active">Usuario activo</Label>
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
            <Button onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Usuario
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input
                id="edit-name"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, name: e.target.value })
                }
                placeholder="Nombre completo del usuario"
                className={cn(formErrors.name && "border-destructive")}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo Electrónico *</Label>
              <Input
                id="edit-email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                placeholder="usuario@podocare.com"
                className={cn(formErrors.email && "border-destructive")}
              />
              {formErrors.email && (
                <p className="text-sm text-destructive">{formErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">
                Nueva Contraseña (Dejar vacío para no cambiar)
              </Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Nueva contraseña"
                  className={cn(formErrors.password && "border-destructive")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {formErrors.password && (
                <p className="text-sm text-destructive">
                  {formErrors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol *</Label>
              <Select
                value={userFormData.role}
                onValueChange={(value: "admin" | "worker") =>
                  setUserFormData({ ...userFormData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="worker">Trabajador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={userFormData.isActive}
                onCheckedChange={(checked) =>
                  setUserFormData({ ...userFormData, isActive: checked })
                }
              />
              <Label htmlFor="edit-active">Usuario activo</Label>
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
            <Button onClick={handleEditUser} disabled={isLoading}>
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

      {/* Link Worker Dialog */}
      <Dialog
        open={isLinkWorkerDialogOpen}
        onOpenChange={setIsLinkWorkerDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Vincular Trabajador
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Selecciona un trabajador para vincular con el usuario "
              {selectedUser?.name}".
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getUnlinkedWorkers().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay trabajadores disponibles para vincular</p>
                </div>
              ) : (
                getUnlinkedWorkers().map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => handleLinkWorker(worker.id)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {worker.firstName.charAt(0)}
                          {worker.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {worker.firstName} {worker.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {worker.specialization || "Trabajador"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsLinkWorkerDialogOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default UserAccounts;
