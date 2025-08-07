import React, { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  Settings as SettingsIcon,
  Building,
  CreditCard,
  DollarSign,
  User,
  Lock,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Layout from "@/components/Layout";

export function Settings() {
  const [clinicSettings, setClinicSettings] = useState({
    name: "PodoCare Clínica Podológica",
    address: "Av. Principal 123, Lima, Perú",
    phone: "+51 987 654 321",
    email: "contacto@podocare.com",
    description: "Clínica especializada en tratamientos podológicos avanzados",
  });

  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    yape: true,
    plin: true,
    transfer: true,
    card: false,
  });

  const [currencySettings, setCurrencySettings] = useState({
    currency: "PEN",
    symbol: "S/",
    decimals: 2,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClinicSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In a real app, this would save to the backend
      console.log("Clinic settings saved:", clinicSettings);
    } catch (error) {
      console.error("Error saving clinic settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Payment settings saved:", paymentMethods);
    } catch (error) {
      console.error("Error saving payment settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({ title: "La nueva contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({ title: "Contraseña cambiada exitosamente" });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({ title: "Error al cambiar la contraseña", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout
      title="Configuración"
      subtitle="Administra la configuración de tu clínica"
    >
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Clinic Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Información de la Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinicName">Nombre de la Clínica</Label>
                <Input
                  id="clinicName"
                  value={clinicSettings.name}
                  onChange={(e) =>
                    setClinicSettings({
                      ...clinicSettings,
                      name: e.target.value,
                    })
                  }
                  placeholder="Nombre de tu clínica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicPhone">Teléfono</Label>
                <Input
                  id="clinicPhone"
                  value={clinicSettings.phone}
                  onChange={(e) =>
                    setClinicSettings({
                      ...clinicSettings,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+51 987 654 321"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinicEmail">Email</Label>
                <Input
                  id="clinicEmail"
                  type="email"
                  value={clinicSettings.email}
                  onChange={(e) =>
                    setClinicSettings({
                      ...clinicSettings,
                      email: e.target.value,
                    })
                  }
                  placeholder="contacto@tuClinica.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicAddress">Dirección</Label>
                <Input
                  id="clinicAddress"
                  value={clinicSettings.address}
                  onChange={(e) =>
                    setClinicSettings({
                      ...clinicSettings,
                      address: e.target.value,
                    })
                  }
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicDescription">Descripción</Label>
              <Textarea
                id="clinicDescription"
                value={clinicSettings.description}
                onChange={(e) =>
                  setClinicSettings({
                    ...clinicSettings,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción de tu clínica..."
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveClinicSettings}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Información
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configura qué métodos de pago están disponibles en tu clínica
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label className="font-medium">Efectivo</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagos en efectivo
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.cash}
                  onCheckedChange={(checked) =>
                    setPaymentMethods({ ...paymentMethods, cash: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label className="font-medium">Yape</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagos con Yape
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.yape}
                  onCheckedChange={(checked) =>
                    setPaymentMethods({ ...paymentMethods, yape: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label className="font-medium">Plin</Label>
                  <p className="text-sm text-muted-foreground">
                    Pagos con Plin
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.plin}
                  onCheckedChange={(checked) =>
                    setPaymentMethods({ ...paymentMethods, plin: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label className="font-medium">Transferencia</Label>
                  <p className="text-sm text-muted-foreground">
                    Transferencias bancarias
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.transfer}
                  onCheckedChange={(checked) =>
                    setPaymentMethods({ ...paymentMethods, transfer: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <Label className="font-medium">Tarjeta</Label>
                  <p className="text-sm text-muted-foreground">
                    Tarjetas de crédito/débito
                  </p>
                </div>
                <Switch
                  checked={paymentMethods.card}
                  onCheckedChange={(checked) =>
                    setPaymentMethods({ ...paymentMethods, card: checked })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSavePaymentSettings}
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Métodos de Pago
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Configuración de Moneda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  value={currencySettings.currency}
                  onChange={(e) =>
                    setCurrencySettings({
                      ...currencySettings,
                      currency: e.target.value,
                    })
                  }
                  placeholder="PEN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Símbolo</Label>
                <Input
                  id="symbol"
                  value={currencySettings.symbol}
                  onChange={(e) =>
                    setCurrencySettings({
                      ...currencySettings,
                      symbol: e.target.value,
                    })
                  }
                  placeholder="S/"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals">Decimales</Label>
                <Input
                  id="decimals"
                  type="number"
                  min="0"
                  max="4"
                  value={currencySettings.decimals}
                  onChange={(e) =>
                    setCurrencySettings({
                      ...currencySettings,
                      decimals: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Vista previa: {currencySettings.symbol}
                {(123.45).toFixed(currencySettings.decimals)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm,
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleChangePassword}
                disabled={
                  isSaving ||
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
                className="btn-primary flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Cambiar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* System Information */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">
                  Versión de PodoCare
                </Label>
                <p className="font-medium">v1.0.0</p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Última actualización
                </Label>
                <p className="font-medium">
                  {new Date().toLocaleDateString("es-ES")}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Base de datos</Label>
                <p className="font-medium">Conectada</p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  Respaldo automático
                </Label>
                <p className="font-medium">Activo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Settings;
