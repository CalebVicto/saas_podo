import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
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
  Payment,
} from "@shared/api";
import {
  getMockPatients,
  getMockAppointments,
  getMockSales,
  getMockAbonos,
  getMockAbonoUsage,
  mockPatientPackages,
  getPatientAbonoBalance,
  getMockPayments,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

const appointmentStatusConfig = {
  scheduled: {
    label: "Programada",
    icon: Clock,
    className: "status-info",
    color: "blue",
  },
  completed: {
    label: "Completada",
    icon: CheckCircle,
    className: "status-success",
    color: "green",
  },
  cancelled: {
    label: "Cancelada",
    icon: XCircle,
    className: "status-error",
    color: "red",
  },
  no_show: {
    label: "No Asistió",
    icon: AlertCircle,
    className: "status-warning",
    color: "yellow",
  },
};

const paymentMethodConfig = {
  cash: { label: "Efectivo", icon: Wallet },
  yape: { label: "Yape", icon: CreditCard },
  plin: { label: "Plin", icon: CreditCard },
  transfer: { label: "Transferencia", icon: CreditCard },
  card: { label: "Tarjeta", icon: CreditCard },
};

export function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [abonoUsage, setAbonoUsage] = useState<AbonoUsage[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");

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
      await new Promise((resolve) => setTimeout(resolve, 500));

      const allPatients = getMockPatients();
      const foundPatient = allPatients.find((p) => p.id === id);

      if (!foundPatient) {
        navigate("/patients");
        return;
      }

      setPatient(foundPatient);

      // Load related data
      const allAppointments = getMockAppointments();
      const patientAppointments = allAppointments.filter(
        (a) => a.patientId === id,
      );
      setAppointments(patientAppointments);

      const allSales = getMockSales();
      const patientSales = allSales.filter((s) => s.customerId === id);
      setSales(patientSales);

      const allAbonos = getMockAbonos();
      const patientAbonos = allAbonos.filter((a) => a.patientId === id);
      setAbonos(patientAbonos);

      const allAbonoUsage = getMockAbonoUsage();
      setAbonoUsage(allAbonoUsage);

      const allPatientPackages = mockPatientPackages;
      const patientPackageList = allPatientPackages.filter(
        (pp) => pp.patientId === id,
      );
      setPatientPackages(patientPackageList);

      const allPayments = getMockPayments();
      setPayments(allPayments);
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

  // Statistics calculations
  const stats = useMemo(() => {
    if (!patient) return null;

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (a) => a.status === "completed",
    ).length;
    const totalSpent = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const currentAbonoBalance = getPatientAbonoBalance(patient.id);
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
    if (appointments.some((a) => a.status === "scheduled")) {
      tags.push({ label: "Cita Pendiente", color: "orange" });
    }
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
      title={`${patient.firstName} ${patient.lastName}`}
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
                    {patient.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BadgeIcon className="w-4 h-4 text-muted-foreground" />
                      <span>DNI: {patient.documentId}</span>
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
                      <span className="capitalize">{patient.sex}</span>
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
            {patient.clinicalNotes && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">
                      Notas Clínicas
                    </h4>
                    <p className="text-sm text-amber-700">
                      {patient.clinicalNotes}
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
                      .sort(
                        (a, b) =>
                          new Date(b.dateTime).getTime() -
                          new Date(a.dateTime).getTime(),
                      )
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">
                                  {formatDateTime(appointment.dateTime)}
                                </h4>
                                {getStatusBadge(
                                  appointment.status,
                                  "appointment",
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Trabajador:
                                  </p>
                                  <p className="font-medium">
                                    {appointment.worker?.firstName}{" "}
                                    {appointment.worker?.lastName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Duración:
                                  </p>
                                  <p className="font-medium">
                                    {appointment.duration} minutos
                                  </p>
                                </div>
                                {appointment.diagnosis && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Diagnóstico:
                                    </p>
                                    <p className="font-medium">
                                      {appointment.diagnosis}
                                    </p>
                                  </div>
                                )}
                                {appointment.treatmentNotes && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Tratamiento:
                                    </p>
                                    <p className="font-medium">
                                      {appointment.treatmentNotes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {appointment.payment && (
                                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-800">
                                      Pagado:
                                    </span>
                                    <span className="font-bold text-green-900">
                                      {formatCurrency(
                                        appointment.payment.amount,
                                      )}
                                    </span>
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
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .map((sale) => (
                        <div
                          key={sale.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">
                                  Venta #{sale.id}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {formatDate(sale.createdAt)}
                                </Badge>
                              </div>

                              <div className="space-y-2">
                                <div className="text-sm">
                                  <p className="text-muted-foreground">
                                    Productos:
                                  </p>
                                  <div className="space-y-1">
                                    {sale.items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="flex justify-between"
                                      >
                                        <span>
                                          {item.product?.name} x{item.quantity}
                                        </span>
                                        <span className="font-medium">
                                          {formatCurrency(item.totalPrice)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-2 border-t">
                                  <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span className="text-primary">
                                      {formatCurrency(sale.totalAmount)}
                                    </span>
                                  </div>
                                </div>

                                {sale.payment && (
                                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-green-800">
                                        Pagado (
                                        {
                                          paymentMethodConfig[
                                            sale.payment.method
                                          ]?.label
                                        }
                                        ):
                                      </span>
                                      <span className="font-bold text-green-900">
                                        {formatCurrency(sale.payment.amount)}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
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

              {/* Abonos Tab */}
              <TabsContent value="abonos" className="p-6 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Abonos y Saldo</h3>
                  <Button
                    onClick={() => navigate("/abonos")}
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
    </Layout>
  );
}

export default PatientDetail;
