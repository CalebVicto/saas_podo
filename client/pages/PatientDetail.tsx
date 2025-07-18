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
  yape: { label: "Yape", icon: CreditCard },
  plin: { label: "Plin", icon: CreditCard },
  transfer: { label: "Transferencia", icon: CreditCard },
  card: { label: "Tarjeta", icon: CreditCard },
};

const balanceMethodConfig = {
  efectivo: { label: "Efectivo", icon: Wallet },
  yape: { label: "Yape", icon: CreditCard },
  transferencia: { label: "Transferencia", icon: CreditCard },
  pos: { label: "POS", icon: CreditCard },
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
    "efectivo",
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
      setPaymentMethod("efectivo");
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
      (total, a) => total + a.remainingAmount,
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
          <config.icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      );
    }

    // Package status
    if (status === "active") {
      return (
        <Badge variant="default" className="text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Activo
        </Badge>
      );
    } else if (status === "completed") {
      return (
        <Badge variant="secondary" className="text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completado
        </Badge>
      );
    } else if (status === "expired") {
      return (
        <Badge variant="outline" className="text-xs">
          <XCircle className="w-3 h-3 mr-1" />
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
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Paciente no encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                El paciente que buscas no existe o ha sido eliminado.
              </p>
              <Button onClick={() => navigate("/patients")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
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
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/patients")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Pacientes
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${patient.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Button>
        </div>

        {/* Patient Basic Information */}
        <Card className="card-modern shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
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
                      <BadgeIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{patient.documentType} {patient.documentNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {calculateAge(patient.birthDate)} años (
                        {formatDate(patient.birthDate)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="capitalize">{patient.gender == "m" ? "Masculino" : "Femenino"}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
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
                        <Tag className="w-3 h-3 mr-1" />
                        {tag.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">
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

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium">
                      Saldo
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(stats?.currentAbonoBalance || 0)}
                  </p>
                  <p className="text-xs text-green-600">Abonos disponibles</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-800 font-medium">
                      Paquetes
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats?.activePackages || 0}
                  </p>
                  <p className="text-xs text-purple-600">Activos</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-800 font-medium">
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
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">
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
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger
                    value="appointments"
                    className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Calendar className="w-4 h-4" />
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
                    <ShoppingBag className="w-4 h-4" />
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
                    <Wallet className="w-4 h-4" />
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
                    <PackageOpen className="w-4 h-4" />
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
              <TabsContent value="appointments" className="p-6 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Historial de Citas</h3>
                  <Button
                    onClick={() => navigate("/appointments/new")}
                    size="sm"
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Cita
                  </Button>
                </div>

                {appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">
                      No hay citas registradas
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Este paciente aún no tiene citas en el sistema.
                    </p>
                    <Button
                      onClick={() => navigate("/appointments/new")}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
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
                            className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start justify-between relative">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold">
                                    {formatDateTime(appointment.createdAt)}
                                  </h4>
                                  {getStatusBadge(appointment.status, "appointment")}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {appointment.userId && (
                                    <div>
                                      <p className="text-muted-foreground">Trabajador:</p>
                                      <p className="font-medium">
                                        {appointment.userId.firstName} {appointment.userId.lastName}
                                      </p>
                                    </div>
                                  )}

                                  {appointment.duration && (
                                    <div>
                                      <p className="text-muted-foreground">Duración:</p>
                                      <p className="font-medium">{appointment.duration} minutos</p>
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
                                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
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
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales" className="p-6 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Historial de Ventas</h3>
                  <Button
                    onClick={() => navigate("/sales")}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Venta
                  </Button>
                </div>

                {sales.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">
                      No hay ventas registradas
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Este paciente no ha realizado compras de productos.
                    </p>
                    <Button
                      onClick={() => navigate("/sales")}
                      variant="outline"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
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
                                  <h4 className="font-semibold text-base">
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
                                  <p className="text-muted-foreground mb-1">
                                    {totalProducts} producto(s):
                                  </p>
                                  <div className="space-y-1">
                                    {sale.saleItems.map((item: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex justify-between items-center"
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
                                <div className="pt-2 border-t">
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
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* Abonos Tab */}
              <TabsContent value="abonos" className="p-6 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Abonos y Saldo</h3>
                  <Button
                    onClick={() => setFormViewAddBalance(true)}
                    size="sm"
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Abono
                  </Button>
                </div>

                {/* Balance Summary */}
                {stats?.currentAbonoBalance &&
                  stats.currentAbonoBalance > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Wallet className="w-6 h-6 text-green-600" />
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
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">
                      No hay abonos registrados
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Este paciente no ha realizado prepagos.
                    </p>
                    <Button
                      onClick={() => navigate("/abonos")}
                      variant="outline"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Registrar Primer Abono
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {abonos
                      .sort(
                        (a, b) =>
                          new Date(b.registeredAt).getTime() -
                          new Date(a.registeredAt).getTime(),
                      )
                      .map((abono) => (
                        <div
                          key={abono.id}
                          className={cn(
                            "border rounded-lg p-4 transition-colors",
                            abono.remainingAmount > 0 && abono.isActive
                              ? "bg-green-50 border-green-200"
                              : "hover:bg-muted/30",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">
                                  Abono {abono.method.toUpperCase()}
                                </h4>
                                <Badge
                                  variant={
                                    abono.isActive && abono.remainingAmount > 0
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {abono.isActive && abono.remainingAmount > 0
                                    ? "Activo"
                                    : abono.remainingAmount === 0
                                      ? "Agotado"
                                      : "Inactivo"}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(abono.registeredAt)}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Monto Original:
                                  </p>
                                  <p className="font-bold text-lg">
                                    {formatCurrency(abono.amount)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Monto Usado:
                                  </p>
                                  <p className="font-medium text-red-600">
                                    {formatCurrency(abono.usedAmount)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Monto Restante:
                                  </p>
                                  <p className="font-medium text-green-600">
                                    {formatCurrency(abono.remainingAmount)}
                                  </p>
                                </div>
                              </div>

                              {abono.notes && (
                                <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                                  <p className="text-muted-foreground">
                                    Notas:
                                  </p>
                                  <p>{abono.notes}</p>
                                </div>
                              )}

                              {/* Usage History */}
                              {abonoUsage.filter(
                                (usage) => usage.abonoId === abono.id,
                              ).length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Historial de uso:
                                    </p>
                                    <div className="space-y-1">
                                      {abonoUsage
                                        .filter(
                                          (usage) => usage.abonoId === abono.id,
                                        )
                                        .map((usage) => (
                                          <div
                                            key={usage.id}
                                            className="flex justify-between text-xs"
                                          >
                                            <span>
                                              {formatDate(usage.usedAt)} -{" "}
                                              {usage.notes || "Uso de abono"}
                                            </span>
                                            <span className="font-medium text-red-600">
                                              -{formatCurrency(usage.amount)}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                            </div>

                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* Packages Tab */}
              <TabsContent value="packages" className="p-6 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Paquetes de Sesiones
                  </h3>
                  <Button
                    onClick={() => navigate("/packages")}
                    size="sm"
                    variant="outline"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Ver Paquetes
                  </Button>
                </div>

                {patientPackages.length === 0 ? (
                  <div className="text-center py-12">
                    <PackageOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h4 className="text-lg font-semibold mb-2">
                      No hay paquetes asignados
                    </h4>
                    <p className="text-muted-foreground mb-4">
                      Este paciente no tiene paquetes de sesiones.
                    </p>
                    <Button
                      onClick={() => navigate("/packages")}
                      variant="outline"
                    >
                      <Package className="w-4 h-4 mr-2" />
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
                          patientPackage.package?.numberOfSessions || 0;
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
                                <div className="flex items-center gap-3 mb-2">
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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm mb-3">
                                  <div>
                                    <p className="text-muted-foreground">
                                      Precio Total:
                                    </p>
                                    <p className="font-bold text-lg">
                                      {formatCurrency(
                                        patientPackage.package?.totalPrice || 0,
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
                                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Progreso</span>
                                    <span>
                                      {Math.round(progressPercentage)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${progressPercentage}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>

                                {patientPackage.package?.notes && (
                                  <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                                    <p className="text-muted-foreground">
                                      Descripción:
                                    </p>
                                    <p>{patientPackage.package.notes}</p>
                                  </div>
                                )}
                              </div>

                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
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
              <Plus className="w-5 h-5" />
              Nuevo Abono
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
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
                        <config.icon className="w-4 h-4" />
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
                setPaymentMethod("efectivo");
              }}
              disabled={isSavingBalance}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddBalance} disabled={isSavingBalance}>
              {isSavingBalance ? (
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
    </Layout>
  );
}

export default PatientDetail;
