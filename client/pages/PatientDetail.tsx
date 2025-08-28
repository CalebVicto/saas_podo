import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Calendar,
  MapPin,
  Tag,
  Clock,
  CreditCard,
  Package,
  Wallet,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  FileText,
  ShoppingBag,
  Pill,
  DollarSign,
  Plus,
  Minus,
  Users,
  Receipt,
  PackageOpen,
  History,
  TrendingUp,
  Badge as BadgeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Patient,
  Appointment,
  Sale,
  Abono,
  AbonoUsage,
  PatientPackage,
  PatientDetailStatistics,
} from "@shared/api";
import { PatientRepository } from "@/lib/api/patient";
import Layout from "@/components/Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

const appointmentStatusConfig = {
  registered: {
    label: "Registrada",
    icon: Clock,
    className: "status-info",
    color: "blue",
  },
  paid: {
    label: "Pagada",
    icon: CheckCircle,
    className: "status-success",
    color: "green",
  },
  // cancelled: {
  //   label: "Cancelada",
  //   icon: XCircle,
  //   className: "status-error",
  //   color: "red",
  // },
  // no_show: {
  //   label: "No Asistió",
  //   icon: AlertCircle,
  //   className: "status-warning",
  //   color: "yellow",
  // },
};

const paymentMethodConfig = {
  cash: { label: "Efectivo", icon: Wallet },
  transfer: { label: "Transferencia", icon: CreditCard },
  yape: { label: "Yape", icon: CreditCard },
  pos: { label: "POS", icon: CreditCard },
  plin: { label: "Plin", icon: CreditCard },
  balance: { label: "Saldo", icon: Wallet },
};

const balanceMethodConfig = {
  cash: { label: "Efectivo", icon: Wallet },
  yape: { label: "Yape", icon: CreditCard },
  transfer: { label: "Transferencia", icon: CreditCard },
  pos: { label: "POS", icon: CreditCard },
  plin: { label: "Plin", icon: CreditCard },
  balance: { label: "Saldo", icon: Wallet },
};

export function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [abonoUsage, setAbonoUsage] = useState<AbonoUsage[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const repository = useMemo(() => new PatientRepository(), []);
  const [activeTab, setActiveTab] = useState("appointments");
  const [formViewAddBalance, setFormViewAddBalance] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof balanceMethodConfig>(
    "cash",
  );
  const [description, setDescription] = useState("");
  const [isSavingBalance, setIsSavingBalance] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  const loadPatientData = async () => {
    if (!id) {
      navigate("/patients");
      return;
    }

    setIsLoading(true);
    try {
      const detail: PatientDetailStatistics =
        await repository.getDetailStatistics(id);
      setPatient(detail.patient);
      setAppointments(detail.appointments || []);
      setSales(detail.sales || []);
      setAbonos(detail.abonos || []);
      setAbonoUsage(detail.abonoUsage || []);
      setPatientPackages(detail.patientPackages || []);
    } catch (error) {
      console.error("Error loading patient data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

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

  const handleAddBalance = async () => {
    if (!id) return;
    if (!amount || amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un monto mayor a cero",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setIsSavingBalance(true);
    try {
      await repository.updateBalance(id, {
        amount,
        type: "credit",
        description,
        paymentMethod,
        userId: user.id,
      });
      toast({ title: "Abono registrado" });
      setFormViewAddBalance(false);
      setAmount(0);
      setDescription("");
      setPaymentMethod("cash");
      await loadPatientData();
    } catch (err: any) {
      toast({
        title: "Error al registrar abono",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingBalance(false);
    }
  };

  // Statistics calculations
  const stats = useMemo(() => {
    if (!patient) return null;

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "paid",
    ).length;
    const totalSpent = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const currentAbonoBalance = abonos.reduce(
      (total, a) => total + a.amount,
      0,
    );
    const activePackages = patientPackages.filter((pp) => pp.isActive).length;

    return {
      totalAppointments,
      completedAppointments,
      totalSpent,
      currentAbonoBalance,
      activePackages,
    };
  }, [patient, appointments, sales, patientPackages]);

  const getPatientTags = () => {
    const tags = [];
    if (stats?.activePackages && stats.activePackages > 0) {
      tags.push({ label: "Tiene Paquetes", color: "blue" });
    }
    if (stats?.currentAbonoBalance && stats.currentAbonoBalance > 0) {
      tags.push({ label: "Tiene Saldo", color: "green" });
    }
    // if (appointments.some((a) => a.status === "scheduled")) {
    //   tags.push({ label: "Cita Pendiente", color: "orange" });
    // }
    return tags;
  };

  const getStatusBadge = (status: string, type: "appointment" | "package") => {
    if (type === "appointment") {
      const config =
        appointmentStatusConfig[status as keyof typeof appointmentStatusConfig];
      if (!config) return null;

      return (
        <Badge
          variant="secondary"
          className={cn(
            "text-xs",
            config.color === "blue" && "bg-blue-100 text-blue-800",
            config.color === "green" && "bg-green-100 text-green-800",
            config.color === "red" && "bg-red-100 text-red-800",
            config.color === "yellow" && "bg-yellow-100 text-yellow-800",
          )}
        >
          <config.icon className="mr-1 h-3 w-3" />
          {config.label}
        </Badge>
      );
    }

    // Package status
    if (status === "active") {
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="mr-1 h-3 w-3" />
          Activo
        </Badge>
      );
    } else if (status === "completed") {
      return (
        <Badge variant="secondary" className="text-xs">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completado
        </Badge>
      );
    } else if (status === "expired") {
      return (
        <Badge variant="outline" className="text-xs">
          <XCircle className="mr-1 h-3 w-3" />
          Expirado
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Layout title="Detalle del Paciente" subtitle="Cargando información...">
        <div className="p-6">
          <div className="space-y-6">
            <div className="loading-shimmer h-32 rounded-lg"></div>
            <div className="loading-shimmer h-64 rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!patient) {
    return (
      <Layout
        title="Paciente No Encontrado"
        subtitle="El paciente solicitado no existe"
      >
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                Paciente no encontrado
              </h3>
              <p className="mb-4 text-muted-foreground">
                El paciente que buscas no existe o ha sido eliminado.
              </p>
              <Button onClick={() => navigate("/patients")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Pacientes
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${patient.firstName} ${patient.paternalSurname} ${patient.maternalSurname}`}
      subtitle="Historial completo del paciente"
    >
      <div className="space-y-6 p-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Pacientes
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${patient.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            onClick={() => navigate(`/appointments/new?patientId=${patient.id}`)}
            size="sm"
            className="btn-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>

        {/* Patient Basic Information */}
        <Card className="card-modern shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                    {patient.firstName.charAt(0)}
                    {patient.paternalSurname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">
                    {patient.firstName} {patient.paternalSurname}
                  </h1>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BadgeIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.documentType} {patient.documentNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {calculateAge(patient.birthDate)} años (
                        {formatDate(patient.birthDate)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{patient.gender == "m" ? "Masculino" : "Femenino"}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getPatientTags().map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          tag.color === "blue" && "bg-blue-100 text-blue-800",
                          tag.color === "green" &&
                          "bg-green-100 text-green-800",
                          tag.color === "orange" &&
                          "bg-orange-100 text-orange-800",
                        )}
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Citas
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.totalAppointments || 0}
                  </p>
                  <p className="text-xs text-blue-600">
                    {stats?.completedAppointments || 0} completadas
                  </p>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Saldo
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(stats?.currentAbonoBalance || 0)}
                  </p>
                  <p className="text-xs text-green-600">Abonos disponibles</p>
                </div>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">
                      Paquetes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats?.activePackages || 0}
                  </p>
                  <p className="text-xs text-purple-600">Activos</p>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Total
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCurrency(stats?.totalSpent || 0)}
                  </p>
                  <p className="text-xs text-orange-600">Gastado</p>
                </div>
              </div>
            </div>

            {/* Clinical Notes */}
            {patient.otherConditions && (
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="mb-1 font-medium text-amber-800">
                      Notas Clínicas
                    </h4>
                    <p className="text-sm text-amber-700">
                      {patient.otherConditions}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs with Detailed Information */}
        <Card className="card-modern shadow-lg">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-4 rounded-lg bg-muted/50 p-1">
                  <TabsTrigger
                    value="appointments"
                    className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Calendar className="h-4 w-4" />
                    Citas
                    {appointments.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 text-xs">
                        {appointments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="sales"
                    className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Ventas
                    {sales.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 text-xs">
                        {sales.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="abonos"
                    className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Wallet className="h-4 w-4" />
                    Abonos
                    {abonos.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 text-xs">
                        {abonos.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="packages"
                    className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <PackageOpen className="h-4 w-4" />
                    Paquetes
                    {patientPackages.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 text-xs">
                        {patientPackages.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-4 p-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Historial de Citas</h3>
                </div>

                {appointments.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                    <h4 className="mb-2 text-lg font-semibold">
                      No hay citas registradas
                    </h4>
                    <p className="mb-4 text-muted-foreground">
                      Este paciente aún no tiene citas en el sistema.
                    </p>
                    <Button
                      onClick={() => navigate(`/appointments/new?patientId=${patient.id}`)}
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Programar Primera Cita
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((appointment: any) => {
                        const paymentLabel = paymentMethodConfig[appointment.paymentMethod]?.label ?? appointment.paymentMethod;
                        const productCount = appointment.products?.length || 0;

                        return (
                          <div
                            key={appointment.id}
                            className="rounded-lg border p-4 transition-colors hover:bg-muted/30"
                          >
                            <div className="relative flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                  <h4 className="font-semibold">
                                    {formatDateTime(appointment.createdAt)}
                                  </h4>
                                  {getStatusBadge(appointment.status, "appointment")}
                                </div>

                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                  {appointment.userId && (
                                    <div>
                                      <p className="text-muted-foreground">Trabajador:</p>
                                      <p className="font-medium">
                                        {appointment.userId.firstName} {appointment.userId.lastName}
                                      </p>
                                    </div>
                                  )}



                                  {appointment.diagnosis && (
                                    <div>
                                      <p className="text-muted-foreground">Diagnóstico:</p>
                                      <p className="font-medium">{appointment.diagnosis}</p>
                                    </div>
                                  )}

                                  {appointment.treatment && (
                                    <div>
                                      <p className="text-muted-foreground">Tratamiento:</p>
                                      <p className="font-medium">{appointment.treatment}</p>
                                    </div>
                                  )}

                                  {appointment.treatmentPrice && (
                                    <div>
                                      <p className="text-muted-foreground">Precio Tratamiento:</p>
                                      <p className="font-medium">
                                        {formatCurrency(appointment.treatmentPrice)}
                                      </p>
                                    </div>
                                  )}

                                  {productCount > 0 && (
                                    <div>
                                      <p className="text-muted-foreground">Productos comprados:</p>
                                      <p className="font-medium">{productCount} producto(s)</p>
                                    </div>
                                  )}
                                </div>

                                {appointment.status === "paid" && (
                                  <div className="mt-3 rounded border border-green-200 bg-green-50 p-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-green-800">Pagado ({paymentLabel}):</span>
                                      <span className="font-bold text-green-900">
                                        {formatCurrency(appointment.appointmentPrice || 0)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <Button variant="ghost"
                                onClick={() => navigate(`/appointments/${appointment.id}`)}
                                size="sm" style={{ position: "absolute", top: "0", right: "0" }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales" className="space-y-4 p-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Historial de Ventas</h3>
                  <Button
                    onClick={() => navigate("/sales")}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Venta
                  </Button>
                </div>

                {sales.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                    <h4 className="mb-2 text-lg font-semibold">
                      No hay ventas registradas
                    </h4>
                    <p className="mb-4 text-muted-foreground">
                      Este paciente no ha realizado compras de productos.
                    </p>
                    <Button
                      onClick={() => navigate("/sales")}
                      variant="outline"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Registrar Venta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sales
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sale: any) => {
                        const totalProducts = sale.saleItems?.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0
                        );
                        const paymentLabel =
                          paymentMethodConfig[sale.paymentMethod]?.label || sale.paymentMethod;

                        return (
                          <div
                            key={sale.id}
                            className={cn(
                              "border rounded-lg p-4 transition-colors relative",
                              sale.paymentMethod
                                ? "hover:bg-muted/30"
                                : "bg-red-50 border-red-200"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                {/* Fecha + Estado */}
                                <div className="flex items-center gap-3">
                                  <h4 className="text-base font-semibold">
                                    Venta del {formatDate(sale.date)}
                                  </h4>
                                  {sale.paymentMethod ? (
                                    <Badge variant="default" className="text-xs">
                                      Pagado ({paymentLabel})
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">
                                      No pagado
                                    </Badge>
                                  )}
                                </div>

                                {/* Productos */}
                                <div className="text-sm">
                                  <p className="mb-1 text-muted-foreground">
                                    {totalProducts} producto(s):
                                  </p>
                                  <div className="space-y-1">
                                    {sale.saleItems.map((item: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between"
                                      >
                                        <span>
                                          {item.product?.name} × {item.quantity}
                                        </span>
                                        <span className="font-medium">
                                          {formatCurrency(item.quantity * item.price)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Nota (si hay) */}
                                {sale.note && sale.note.trim() !== "" && (
                                  <div className="text-sm">
                                    <p className="text-muted-foreground">Nota:</p>
                                    <p className="font-medium">{sale.note}</p>
                                  </div>
                                )}

                                {/* Total */}
                                <div className="border-t pt-2">
                                  <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span className="text-primary">
                                      {formatCurrency(sale.totalAmount)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Button variant="ghost" size="sm" style={{ position: "absolute", top: "10px", right: "10px" }}
                                onClick={() => navigate(`/sales/${sale.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Abonos Tab */}
              <TabsContent value="abonos" className="space-y-4 p-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Abonos y Saldo</h3>
                  <Button
                    onClick={() => setFormViewAddBalance(true)}
                    size="sm"
                    className="btn-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Abono
                  </Button>
                </div>

                {/* Balance Summary */}
                {stats?.currentAbonoBalance &&
                  stats.currentAbonoBalance > 0 && (
                    <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-bold text-green-800">
                              Saldo Disponible
                            </h4>
                            <p className="text-sm text-green-600">
                              Listo para usar en próximas citas
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(stats.currentAbonoBalance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {abonos.length === 0 ? (
                  <div className="py-12 text-center">
                    <Wallet className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                    <h4 className="mb-2 text-lg font-semibold">
                      No hay abonos registrados
                    </h4>
                    <p className="mb-4 text-muted-foreground">
                      Este paciente no ha realizado prepagos.
                    </p>
                    <Button
                      onClick={() => setFormViewAddBalance(true)}
                      variant="outline"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Registrar Primer Abono
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {abonos
                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((abono: any) => {
                        const paymentLabel =
                          paymentMethodConfig[abono.paymentMethod]?.label || abono.paymentMethod;
                        const isCredit = abono.type === "credit";
                        const typeLabel = isCredit ? "Entrada" : "Salida";
                        const amountSign = isCredit ? "+" : "-";
                        const bgColor = isCredit
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200";
                        const amountColor = isCredit ? "text-green-900" : "text-red-900";

                        return (
                          <div
                            key={abono.id}
                            className={`border rounded-lg p-4 transition-colors ${bgColor} relative`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                {/* Encabezado */}
                                <div className="flex items-center gap-3">
                                  <Badge variant="default" className="text-xs">
                                    {formatDate(abono.createdAt)}
                                  </Badge>
                                  <h4 className="text-base font-semibold">
                                    {typeLabel} por <span className="uppercase">{paymentLabel}</span>
                                  </h4>
                                </div>

                                {/* Descripción y monto */}
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                  <div>
                                    <p className="text-muted-foreground">Monto:</p>
                                    <p className={`font-bold text-lg ${amountColor}`}>
                                      {amountSign} {formatCurrency(abono.amount)}
                                    </p>
                                  </div>

                                  {abono.description && (
                                    <div>
                                      <p className="text-muted-foreground">Descripción:</p>
                                      <p className="font-medium">{abono.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button variant="ghost" size="sm"
                                onClick={() => navigate(`/abonos/${abono.id}`)}
                                style={{ position: "absolute", top: "10px", right: "10px" }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Packages Tab */}
              <TabsContent value="packages" className="space-y-4 p-6 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Paquetes de Sesiones
                  </h3>
                  <Button
                    onClick={() => navigate("/packages")}
                    size="sm"
                    variant="outline"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Ver Paquetes
                  </Button>
                </div>

                {patientPackages.length === 0 ? (
                  <div className="py-12 text-center">
                    <PackageOpen className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                    <h4 className="mb-2 text-lg font-semibold">
                      No hay paquetes asignados
                    </h4>
                    <p className="mb-4 text-muted-foreground">
                      Este paciente no tiene paquetes de sesiones.
                    </p>
                    <Button
                      onClick={() => navigate("/packages")}
                      variant="outline"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Explorar Paquetes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientPackages
                      .sort(
                        (a, b) =>
                          new Date(b.purchasedAt).getTime() -
                          new Date(a.purchasedAt).getTime(),
                      )
                      .map((patientPackage) => {
                        const totalSessions =
                          patientPackage.package?.sessions || 0;
                        const usedSessions =
                          totalSessions - patientPackage.remainingSessions;
                        const progressPercentage =
                          (usedSessions / totalSessions) * 100;

                        return (
                          <div
                            key={patientPackage.id}
                            className={cn(
                              "border rounded-lg p-4 transition-colors",
                              patientPackage.isActive &&
                                patientPackage.remainingSessions > 0
                                ? "bg-blue-50 border-blue-200"
                                : "hover:bg-muted/30",
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-3">
                                  <h4 className="font-semibold">
                                    {patientPackage.package?.name}
                                  </h4>
                                  {getStatusBadge(
                                    patientPackage.isActive &&
                                      patientPackage.remainingSessions > 0
                                      ? "active"
                                      : patientPackage.remainingSessions === 0
                                        ? "completed"
                                        : "expired",
                                    "package",
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    Comprado:{" "}
                                    {formatDate(patientPackage.purchasedAt)}
                                  </span>
                                </div>

                                <div className="mb-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                                  <div>
                                    <p className="text-muted-foreground">
                                      Precio Total:
                                    </p>
                                    <p className="text-lg font-bold">
                                      {formatCurrency(
                                        patientPackage.package?.price || 0,
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Sesiones Usadas:
                                    </p>
                                    <p className="font-medium">
                                      {usedSessions} de {totalSessions}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Sesiones Restantes:
                                    </p>
                                    <p className="font-medium text-blue-600">
                                      {patientPackage.remainingSessions}
                                    </p>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                    <span>Progreso</span>
                                    <span>
                                      {Math.round(progressPercentage)}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full rounded-full bg-gray-200">
                                    <div
                                      className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                                      style={{
                                        width: `${progressPercentage}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {patientPackage.package?.notes && (
                                  <div className="mt-2 rounded bg-muted/50 p-2 text-sm">
                                    <p className="text-muted-foreground">
                                      Descripción:
                                    </p>
                                    <p>{patientPackage.package.notes}</p>
                                  </div>
                                )}
                              </div>

                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create Abono Dialog */}
      <Dialog open={formViewAddBalance} onOpenChange={setFormViewAddBalance}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Abono
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount || ""}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseFloat(e.target.value)
                      : 0;
                    setAmount(value);
                  }}
                  placeholder="0.00"
                  className={cn("pl-10")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Método de Pago *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as keyof typeof balanceMethodConfig)
                }
              >
                <SelectTrigger
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(balanceMethodConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notas adicionales sobre el abono..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFormViewAddBalance(false);
                setAmount(0);
                setDescription("");
                setPaymentMethod("cash");
              }}
              disabled={isSavingBalance}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddBalance} disabled={isSavingBalance}>
              {isSavingBalance ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Guardando...
                </>
              ) : (
                "Crear Abono"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default PatientDetail;
