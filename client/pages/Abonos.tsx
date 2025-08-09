import React, { useState, useEffect, useMemo } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Eye,
  User,
  Calendar,
  CreditCard,
  Wallet,
  Receipt,
  Clock,
  CheckCircle,
  ArrowRight,
  Edit,
  Trash2,
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
import { Abono, AbonoUsage, Patient, CreateAbonoRequest } from "@shared/api";
import {
  getMockAbonos,
  getMockAbonoUsage,
  getMockPatients,
  getPatientAbonoBalance,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

const paymentMethodConfig = {
  cash: { label: "Efectivo", icon: Wallet },
  yape: { label: "Yape", icon: CreditCard },
  plin: { label: "Plin", icon: CreditCard },
  transfer: { label: "Transferencia", icon: CreditCard },
  pos: { label: "POS", icon: CreditCard },
  balance: { label: "Saldo", icon: Wallet },
};

interface SearchableSelectProps {
  items: Patient[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

function PatientSearchableSelect({
  items,
  value,
  onValueChange,
  placeholder,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(
      (patient) =>
        patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.documentId.includes(searchTerm),
    );
  }, [items, searchTerm]);

  const selectedPatient = items.find((item) => item.id === value);

  const handleSelect = (patient: Patient) => {
    onValueChange(patient.id);
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
        {selectedPatient ? (
          <span className="truncate">
            {selectedPatient.firstName} {selectedPatient.lastName}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Seleccionar Paciente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron pacientes
                </div>
              ) : (
                filteredItems.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                      value === patient.id && "border-primary bg-primary/5",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {patient.firstName} {patient.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          DNI: {patient.documentId}
                        </p>
                      </div>
                      {value === patient.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
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

export function Abonos() {
  const navigate = useNavigate();
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [abonoUsage, setAbonoUsage] = useState<AbonoUsage[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredAbonos, setFilteredAbonos] = useState<Abono[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedAbono, setSelectedAbono] = useState<Abono | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state for new abono
  const [formData, setFormData] = useState<CreateAbonoRequest>({
    patientId: "",
    amount: 0,
    method: "cash",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [abonos, searchTerm, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockAbonos = getMockAbonos();
      const mockUsage = getMockAbonoUsage();
      const mockPatients = getMockPatients();
      setAbonos(mockAbonos);
      setAbonoUsage(mockUsage);
      setPatients(mockPatients);
    } catch (error) {
      console.error("Error loading abonos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...abonos];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (abono) =>
          abono.patient?.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          abono.patient?.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          abono.patient?.documentId.includes(searchTerm) ||
          abono.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(
          (abono) => abono.isActive && abono.remainingAmount > 0,
        );
      } else if (statusFilter === "exhausted") {
        filtered = filtered.filter((abono) => abono.remainingAmount === 0);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((abono) => !abono.isActive);
      }
    }

    setFilteredAbonos(filtered);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = "Selecciona un paciente";
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Ingresa un monto válido";
    }
    if (!formData.method) {
      newErrors.method = "Selecciona un método de pago";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newAbono: Abono = {
        id: Date.now().toString(),
        patientId: formData.patientId,
        amount: formData.amount,
        method: formData.method,
        notes: formData.notes,
        registeredAt: new Date().toISOString(),
        usedAmount: 0,
        remainingAmount: formData.amount,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        patient: patients.find((p) => p.id === formData.patientId),
      };

      setAbonos([newAbono, ...abonos]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating abono:", error);
      toast({ title: "Error al crear el abono. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      amount: 0,
      method: "cash",
      notes: "",
    });
    setErrors({});
  };

  const handleViewDetails = (abono: Abono) => {
    setSelectedAbono(abono);
    setIsDetailsDialogOpen(true);
  };

  const getAbonoUsageForAbono = (abonoId: string): AbonoUsage[] => {
    return abonoUsage.filter((usage) => usage.abonoId === abonoId);
  };

  const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (abono: Abono) => {
    if (!abono.isActive) {
      return <Badge variant="secondary">Inactivo</Badge>;
    }
    if (abono.remainingAmount === 0) {
      return <Badge variant="outline">Agotado</Badge>;
    }
    return <Badge variant="default">Activo</Badge>;
  };

  if (isLoading) {
    return (
      <Layout title="Abonos" subtitle="Gestión de prepagos de pacientes">
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

  const totalActiveBalance = abonos
    .filter((abono) => abono.isActive)
    .reduce((sum, abono) => sum + abono.remainingAmount, 0);

  return (
    <Layout title="Abonos" subtitle="Gestión de prepagos de pacientes">
      <div className="p-6 space-y-6">
        {/* Header with stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Saldo Total Activo
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(totalActiveBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Abonos Activos
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {
                      abonos.filter((a) => a.isActive && a.remainingAmount > 0)
                        .length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agotados</p>
                  <p className="text-xl font-bold text-orange-600">
                    {abonos.filter((a) => a.remainingAmount === 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Abonos</p>
                  <p className="text-xl font-bold text-blue-600">
                    {abonos.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="exhausted">Agotados</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/*  */}
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Abono
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Lista de Abonos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Monto Original</TableHead>
                  <TableHead>Usado</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAbonos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No se encontraron abonos</p>
                        <p className="text-sm">
                          Crea el primer abono para comenzar
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAbonos.map((abono) => (
                    <TableRow key={abono.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {abono.patient?.firstName} {abono.patient?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            DNI: {abono.patient?.documentId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(abono.amount)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(abono.usedAmount)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(abono.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {React.createElement(
                            paymentMethodConfig[abono.method].icon,
                            { className: "w-4 h-4" },
                          )}
                          {paymentMethodConfig[abono.method].label}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(abono.registeredAt)}
                      </TableCell>
                      <TableCell>{getStatusBadge(abono)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(abono)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Abono Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nuevo Abono
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <PatientSearchableSelect
                  items={patients}
                  value={formData.patientId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, patientId: value });
                    if (errors.patientId) {
                      setErrors({ ...errors, patientId: "" });
                    }
                  }}
                  placeholder="Seleccionar paciente"
                />
                {errors.patientId && (
                  <p className="text-sm text-destructive">{errors.patientId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ""}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseFloat(e.target.value)
                        : 0;
                      setFormData({ ...formData, amount: value });
                      if (errors.amount) {
                        setErrors({ ...errors, amount: "" });
                      }
                    }}
                    placeholder="0.00"
                    className={cn(
                      "pl-10",
                      errors.amount && "border-destructive",
                    )}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Método de Pago *</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      method: value as CreateAbonoRequest["method"],
                    });
                    if (errors.method) {
                      setErrors({ ...errors, method: "" });
                    }
                  }}
                >
                  <SelectTrigger
                    className={cn(errors.method && "border-destructive")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodConfig).map(
                      ([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                {errors.method && (
                  <p className="text-sm text-destructive">{errors.method}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas adicionales sobre el abono..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  "Crear Abono"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Abono Details Dialog */}
        <Dialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalles del Abono
              </DialogTitle>
            </DialogHeader>

            {selectedAbono && (
              <div className="space-y-6 py-4">
                {/* Abono Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Paciente
                    </Label>
                    <p className="font-medium">
                      {selectedAbono.patient?.firstName}{" "}
                      {selectedAbono.patient?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      DNI: {selectedAbono.patient?.documentId}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Estado
                    </Label>
                    {getStatusBadge(selectedAbono)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Monto Original
                    </Label>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedAbono.amount)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Monto Usado
                    </Label>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(selectedAbono.usedAmount)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Monto Restante
                    </Label>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedAbono.remainingAmount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Método de Pago
                    </Label>
                    <div className="flex items-center gap-2">
                      {React.createElement(
                        paymentMethodConfig[selectedAbono.method].icon,
                        { className: "w-4 h-4" },
                      )}
                      {paymentMethodConfig[selectedAbono.method].label}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Fecha de Registro
                    </Label>
                    <p>{formatDate(selectedAbono.registeredAt)}</p>
                  </div>
                </div>

                {selectedAbono.notes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Notas
                    </Label>
                    <p className="text-sm bg-muted p-3 rounded-lg">
                      {selectedAbono.notes}
                    </p>
                  </div>
                )}

                {/* Usage History */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Historial de Uso
                  </Label>
                  <div className="border rounded-lg">
                    {getAbonoUsageForAbono(selectedAbono.id).length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aún no se ha usado este abono</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {getAbonoUsageForAbono(selectedAbono.id).map(
                          (usage) => (
                            <div key={usage.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {formatCurrency(usage.amount)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(usage.usedAt)}
                                  </p>
                                  {usage.notes && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {usage.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  {usage.appointmentId && (
                                    <Badge variant="secondary">Cita</Badge>
                                  )}
                                  {usage.saleId && (
                                    <Badge variant="outline">Venta</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
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

export default Abonos;
