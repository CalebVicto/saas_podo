import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Users,
  FileText,
  Save,
  ArrowLeft,
  Search,
  Check,
  Package,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Stethoscope,
  Pill,
  PackageOpen,
  DollarSign,
  FileEdit,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  CreateAppointmentRequest,
  Patient,
  Worker,
  Product,
  PatientPackage,
  PackageSession,
} from "@shared/api";
import {
  getMockPatients,
  getMockWorkers,
  getAllMockProducts,
  mockPatientPackages,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

// Predefined diagnosis options
const PREDEFINED_DIAGNOSES = [
  "Onicomicosis",
  "Uñas encarnadas",
  "Fascitis plantar",
  "Callosidades plantares",
  "Helomas (callos duros)",
  "Hiperqueratosis",
  "Pie diabético",
  "Verrugas plantares",
  "Grietas en talones",
  "Metatarsalgia",
  "Espolón calcáneo",
  "Neuroma de Morton",
  "Dedos en garra",
  "Hallux valgus (juanetes)",
  "Pie plano",
  "Pie cavo",
];

// Predefined treatment options
const PREDEFINED_TREATMENTS = [
  "Cuidado general de uñas",
  "Tratamiento de onicomicosis",
  "Curación de uñas encarnadas",
  "Eliminación de callosidades",
  "Desbridamiento de hiperqueratosis",
  "Aplicación de medicamentos tópicos",
  "Confección de plantillas ortopédicas",
  "Vendajes y curaciones",
  "Masaje terapéutico",
  "Ejercicios de fisioterapia",
  "Educación sobre cuidado del pie",
  "Recomendaciones de calzado",
  "Seguimiento y control",
  "Tratamiento con láser",
  "Crioterapia",
];

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

interface SearchableTextInputProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  label: string;
}

function SearchableTextInput({
  options,
  value,
  onValueChange,
  placeholder,
  label,
}: SearchableTextInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState(value);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const handleOptionSelect = (option: string) => {
    setInputValue(option);
    onValueChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onValueChange(newValue);
  };

  return (
    <>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setIsOpen(true)}
        >
          <Search className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Seleccionar {label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron opciones</p>
                  <p className="text-sm">
                    Puedes escribir un valor personalizado
                  </p>
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    className="p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {value === option && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-xs text-muted-foreground text-center">
              También puedes escribir un valor personalizado directamente en el
              campo
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateAppointment() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<CreateAppointmentRequest>({
    patientId: "",
    workerId: "",
    dateTime: "",
    duration: 60,
    treatmentNotes: "",
    diagnosis: "",
    observations: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Products state
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ product: Product; quantity: number }>
  >([]);

  // Package state
  const [selectedPackage, setSelectedPackage] = useState<PatientPackage | null>(
    null,
  );
  const [usePackageSession, setUsePackageSession] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockPatients = getMockPatients();
      const mockWorkers = getMockWorkers();
      const mockProducts = getAllMockProducts();
      setPatients(mockPatients);
      setWorkers(mockWorkers);
      setProducts(mockProducts);
      setPatientPackages(mockPatientPackages);
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
    if (!formData.dateTime) {
      newErrors.dateTime = "Selecciona fecha y hora";
    } else {
      const appointmentDate = new Date(formData.dateTime);
      const now = new Date();
      if (appointmentDate < now) {
        newErrors.dateTime = "La fecha no puede ser en el pasado";
      }
    }
    if (!formData.treatmentNotes?.trim()) {
      newErrors.treatmentNotes = "Describe el tratamiento";
    }
    if (!formData.diagnosis?.trim()) {
      newErrors.diagnosis = "Ingresa el diagnóstico";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, this would save to the backend
      console.log("Appointment created:", formData);

      // Navigate back to appointments list
      navigate("/appointments");
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error al crear la cita. Inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // At least 30 minutes from now
    return now.toISOString().slice(0, 16);
  };

  // Product functions
  const addProduct = (product: Product) => {
    const existingProduct = selectedProducts.find(
      (sp) => sp.product.id === product.id,
    );
    if (existingProduct) {
      setSelectedProducts(
        selectedProducts.map((sp) =>
          sp.product.id === product.id
            ? { ...sp, quantity: sp.quantity + 1 }
            : sp,
        ),
      );
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(
      selectedProducts.filter((sp) => sp.product.id !== productId),
    );
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
    } else {
      setSelectedProducts(
        selectedProducts.map((sp) =>
          sp.product.id === productId ? { ...sp, quantity } : sp,
        ),
      );
    }
  };

  // Package functions
  const getAvailablePackages = (): PatientPackage[] => {
    if (!formData.patientId) return [];
    return patientPackages.filter(
      (pp) =>
        pp.patientId === formData.patientId &&
        pp.isActive &&
        pp.remainingSessions > 0,
    );
  };

  const handlePackageSelection = (patientPackage: PatientPackage) => {
    if (selectedPackage?.id === patientPackage.id) {
      // If clicking the same package, deselect it
      setSelectedPackage(null);
      setUsePackageSession(false);
    } else {
      setSelectedPackage(patientPackage);
      setUsePackageSession(true);
    }
  };

  const clearPackageSelection = () => {
    setSelectedPackage(null);
    setUsePackageSession(false);
  };

  if (isLoading) {
    return (
      <Layout title="Nueva Cita" subtitle="Programar nueva cita médica">
        <div className="p-6">
          <div className="max-w-4xl mx-auto space-y-6">
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
    <Layout title="Nueva Cita" subtitle="Programar nueva cita médica">
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

          {/* Form */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="card-modern h-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    Nueva Cita Médica
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
                      <TabsTrigger
                        value="general"
                        className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md"
                      >
                        <Stethoscope className="w-4 h-4" />
                        General
                      </TabsTrigger>
                      <TabsTrigger
                        value="products"
                        className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md"
                      >
                        <Pill className="w-4 h-4" />
                        Productos
                      </TabsTrigger>
                      <TabsTrigger
                        value="package"
                        className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md"
                      >
                        <PackageOpen className="w-4 h-4" />
                        Paquete
                      </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent
                      value="general"
                      className="space-y-6 mt-6 animate-in fade-in-50 duration-300"
                    >
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
                          <Label>Trabajador *</Label>
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
                          <Label htmlFor="dateTime">Fecha y Hora *</Label>
                          <Input
                            id="dateTime"
                            type="datetime-local"
                            value={formData.dateTime}
                            min={getMinDateTime()}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                dateTime: e.target.value,
                              });
                              if (errors.dateTime) {
                                setErrors({ ...errors, dateTime: "" });
                              }
                            }}
                            className={cn(
                              errors.dateTime && "border-destructive",
                            )}
                          />
                          {errors.dateTime && (
                            <p className="text-sm text-destructive">
                              {errors.dateTime}
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

                      {/* Diagnosis */}
                      <div className="space-y-2">
                        <Label htmlFor="diagnosis">Diagnóstico *</Label>
                        <SearchableTextInput
                          options={PREDEFINED_DIAGNOSES}
                          value={formData.diagnosis || ""}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              diagnosis: value,
                            });
                            if (errors.diagnosis) {
                              setErrors({ ...errors, diagnosis: "" });
                            }
                          }}
                          placeholder="Selecciona o escribe un diagnóstico..."
                          label="diagnóstico"
                        />
                        {errors.diagnosis && (
                          <p className="text-sm text-destructive">
                            {errors.diagnosis}
                          </p>
                        )}
                      </div>

                      {/* Treatment */}
                      <div className="space-y-2">
                        <Label htmlFor="treatmentNotes">Tratamiento *</Label>
                        <SearchableTextInput
                          options={PREDEFINED_TREATMENTS}
                          value={formData.treatmentNotes || ""}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              treatmentNotes: value,
                            });
                            if (errors.treatmentNotes) {
                              setErrors({ ...errors, treatmentNotes: "" });
                            }
                          }}
                          placeholder="Selecciona o describe el tratamiento..."
                          label="tratamiento"
                        />
                        {errors.treatmentNotes && (
                          <p className="text-sm text-destructive">
                            {errors.treatmentNotes}
                          </p>
                        )}
                      </div>

                      {/* Observations */}
                      <div className="space-y-2">
                        <Label htmlFor="observations">Observaciones</Label>
                        <Textarea
                          id="observations"
                          value={formData.observations || ""}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              observations: e.target.value,
                            });
                          }}
                          placeholder="Observaciones adicionales, notas especiales..."
                          rows={3}
                        />
                      </div>
                    </TabsContent>

                    {/* Products Tab */}
                    <TabsContent
                      value="products"
                      className="space-y-6 mt-6 animate-in fade-in-50 duration-300"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-semibold">
                            Productos para esta cita
                          </Label>
                          <Badge variant="outline">
                            {selectedProducts.length} seleccionados
                          </Badge>
                        </div>

                        {/* Product Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {products.map((product) => (
                            <div
                              key={product.id}
                              className="border rounded-lg p-4 hover:bg-muted/30 transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {product.name}
                                  </h4>
                                  {product.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {product.description}
                                    </p>
                                  )}
                                  <p className="text-sm font-medium text-primary mt-2">
                                    S/ {product.price.toFixed(2)}
                                  </p>
                                  {product.bonusAmount && (
                                    <p className="text-xs text-green-600">
                                      Bono: S/ {product.bonusAmount.toFixed(2)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  onClick={() => addProduct(product)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Selected Products */}
                        {selectedProducts.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-base font-semibold">
                              Productos Seleccionados
                            </Label>
                            <div className="space-y-2">
                              {selectedProducts.map(({ product, quantity }) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-3 bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg transition-all duration-300 hover:shadow-sm"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      S/ {product.price.toFixed(2)} c/u
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() =>
                                        updateProductQuantity(
                                          product.id,
                                          quantity - 1,
                                        )
                                      }
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="font-medium w-8 text-center">
                                      {quantity}
                                    </span>
                                    <Button
                                      onClick={() =>
                                        updateProductQuantity(
                                          product.id,
                                          quantity + 1,
                                        )
                                      }
                                      size="sm"
                                      variant="outline"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => removeProduct(product.id)}
                                      size="sm"
                                      variant="destructive"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                Total: S/{" "}
                                {selectedProducts
                                  .reduce(
                                    (sum, sp) =>
                                      sum + sp.product.price * sp.quantity,
                                    0,
                                  )
                                  .toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Package Tab */}
                    <TabsContent
                      value="package"
                      className="space-y-6 mt-6 animate-in fade-in-50 duration-300"
                    >
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">
                          Paquetes Disponibles para este Paciente
                        </Label>

                        {(() => {
                          const availablePackages = getAvailablePackages();

                          if (!formData.patientId) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>
                                  Selecciona un paciente para ver sus paquetes
                                </p>
                              </div>
                            );
                          }

                          if (availablePackages.length === 0) {
                            return (
                              <div className="text-center py-8 text-muted-foreground">
                                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Este paciente no tiene paquetes activos</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              {availablePackages.map((patientPackage) => (
                                <div
                                  key={patientPackage.id}
                                  className={cn(
                                    "border rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02]",
                                    selectedPackage?.id === patientPackage.id
                                      ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary shadow-md scale-[1.02]"
                                      : "hover:bg-muted/30",
                                  )}
                                  onClick={() =>
                                    handlePackageSelection(patientPackage)
                                  }
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium">
                                        {patientPackage.package?.name}
                                      </h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Sesiones restantes:{" "}
                                        {patientPackage.remainingSessions}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Total del paquete: S/{" "}
                                        {patientPackage.package?.totalPrice.toFixed(
                                          2,
                                        )}
                                      </p>
                                    </div>
                                    {selectedPackage?.id ===
                                      patientPackage.id && (
                                      <Badge variant="default">
                                        Seleccionado
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}

                              {selectedPackage && usePackageSession && (
                                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm animate-in fade-in-50 duration-500">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Check className="w-5 h-5 text-green-600" />
                                      <span className="font-medium text-green-800">
                                        Usando sesión del paquete
                                      </span>
                                    </div>
                                    <Button
                                      onClick={clearPackageSelection}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 hover:bg-red-100 text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <p className="text-sm text-green-700">
                                    Esta cita utilizará 1 sesión del paquete "
                                    {selectedPackage.package?.name}". Sesiones
                                    restantes después de esta cita:{" "}
                                    {selectedPackage.remainingSessions - 1}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Summary Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                <Card className="card-modern shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Resumen de la Cita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Info */}
                    {formData.patientId && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20 transition-all duration-300">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">Paciente</p>
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
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20 transition-all duration-300">
                        <Users className="w-5 h-5 text-secondary" />
                        <div>
                          <p className="font-medium">Trabajador</p>
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

                    {formData.dateTime && (
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20 transition-all duration-300">
                        <Clock className="w-5 h-5 text-accent" />
                        <div>
                          <p className="font-medium">Fecha y Hora</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(formData.dateTime).toLocaleString(
                              "es-ES",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
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

                    {/* Diagnosis & Treatment */}
                    {(formData.diagnosis || formData.treatmentNotes) && (
                      <div className="space-y-3 pt-4 border-t">
                        {formData.diagnosis && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <Stethoscope className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800">
                                Diagnóstico
                              </p>
                              <p className="text-sm text-blue-600">
                                {formData.diagnosis}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.treatmentNotes && (
                          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <FileEdit className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-800">
                                Tratamiento
                              </p>
                              <p className="text-sm text-green-600">
                                {formData.treatmentNotes}
                              </p>
                            </div>
                          </div>
                        )}

                        {formData.observations && (
                          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-amber-800">
                                Observaciones
                              </p>
                              <p className="text-sm text-amber-600">
                                {formData.observations}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Products Summary */}
                    {selectedProducts.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-5 h-5 text-primary" />
                          <p className="font-medium">
                            Productos ({selectedProducts.length})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {selectedProducts.map(({ product, quantity }) => (
                            <div
                              key={product.id}
                              className="flex justify-between items-center p-2 bg-muted/50 rounded"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Cant: {quantity}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-primary">
                                S/ {(product.price * quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
                          <span className="font-medium">
                            Subtotal productos:
                          </span>
                          <span className="font-bold text-primary">
                            S/{" "}
                            {selectedProducts
                              .reduce(
                                (sum, sp) =>
                                  sum + sp.product.price * sp.quantity,
                                0,
                              )
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Package Summary */}
                    {selectedPackage && usePackageSession && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-green-600" />
                          <p className="font-medium text-green-800">
                            Paquete Asignado
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="font-medium text-green-800">
                            {selectedPackage.package?.name}
                          </p>
                          <p className="text-sm text-green-600">
                            Sesiones restantes:{" "}
                            {selectedPackage.remainingSessions - 1}
                          </p>
                          <p className="text-xs text-green-500 mt-1">
                            Se usará 1 sesión de este paquete
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Total Cost Estimation */}
                    {(selectedProducts.length > 0 ||
                      (selectedPackage && usePackageSession)) && (
                      <div className="pt-4 border-t">
                        <div className="flex items-center gap-2 mb-3">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <p className="font-medium">Estimación de Costo</p>
                        </div>
                        <div className="space-y-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          {selectedProducts.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-sm">Productos:</span>
                              <span className="text-sm font-medium">
                                S/{" "}
                                {selectedProducts
                                  .reduce(
                                    (sum, sp) =>
                                      sum + sp.product.price * sp.quantity,
                                    0,
                                  )
                                  .toFixed(2)}
                              </span>
                            </div>
                          )}
                          {selectedPackage && usePackageSession && (
                            <div className="flex justify-between">
                              <span className="text-sm">
                                Sesión de paquete:
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                Incluido
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-green-300 font-bold text-green-800">
                            <span>Total estimado:</span>
                            <span>
                              S/{" "}
                              {selectedProducts
                                .reduce(
                                  (sum, sp) =>
                                    sum + sp.product.price * sp.quantity,
                                  0,
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="btn-primary flex items-center gap-3 min-w-[180px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Registrar Cita
                </>
              )}
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                // Save draft functionality could be implemented here
                console.log("Draft saved:", formData);
                alert("Borrador guardado exitosamente");
              }}
              disabled={isSaving}
              size="lg"
              className="flex items-center gap-3 min-w-[180px] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Save className="w-5 h-5" />
              Guardar Borrador
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default CreateAppointment;
