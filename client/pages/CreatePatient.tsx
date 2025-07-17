import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, User } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { Patient } from "@shared/api";
import { PatientRepository } from "@/lib/api/patient";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";


export default function CreatePatient() {
  const navigate = useNavigate();
  const repository = useMemo(() => new PatientRepository(), []);

  const [formData, setFormData] = useState<Patient>({
    documentType: "dni",
    documentNumber: "",
    firstName: "",
    paternalSurname: "",
    maternalSurname: "",
    gender: "m",
    phone: "",
    birthDate: "",
    email: "",
    allergy: "",
    diabetic: false,
    hypertensive: false,
    otherConditions: "",
    balance: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [backendError, setBackendError] = useState<string>("");

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);


  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.documentType) errs.documentType = "Campo requerido";
    if (!formData.firstName.trim()) errs.firstName = "Campo requerido";
    if (!formData.paternalSurname.trim())
      errs.paternalSurname = "Campo requerido";
    if (!formData.maternalSurname.trim())
      errs.maternalSurname = "Campo requerido";
    if (!formData.documentNumber.trim())
      errs.documentNumber = "Campo requerido";
    if (!formData.phone?.trim()) errs.phone = "Campo requerido";
    if (!formData.birthDate) errs.birthDate = "Campo requerido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBackendError("");
    if (!validate()) return;
    try {
      await repository.create(formData);
      setSuccessDialogOpen(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setBackendError(msg);
      setErrorDialogOpen(true);
    }
  };

  return (
    <Layout title="Nuevo Paciente" subtitle="Registrar nuevo paciente">
      <div className="p-6 space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate("/patients")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Pacientes
        </Button>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-6 h-6 text-primary" /> Datos del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Tipo de Documento */}
                <div className="space-y-2">
                  <Label htmlFor="documentType">Tipo Documento *</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value: "dni" | "passport") =>
                      setFormData({ ...formData, documentType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.documentType && (
                    <p className="text-sm text-destructive">
                      {errors.documentType}
                    </p>
                  )}
                </div>

                {/* Documento */}
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Nº Documento *</Label>
                  <Input
                    id="documentNumber"
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        documentNumber: e.target.value,
                      })
                    }
                  />
                  {errors.documentNumber && (
                    <p className="text-sm text-destructive">
                      {errors.documentNumber}
                    </p>
                  )}
                </div>

                {/* Nombres */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="firstName">Nombres *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                {/* Apellido Paterno */}
                <div className="space-y-2 w-full">
                  <Label htmlFor="paternalSurname">Apellido Paterno *</Label>
                  <Input
                    id="paternalSurname"
                    value={formData.paternalSurname}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paternalSurname: e.target.value,
                      })
                    }
                  />
                  {errors.paternalSurname && (
                    <p className="text-sm text-destructive">
                      {errors.paternalSurname}
                    </p>
                  )}
                </div>

                {/* Apellido Materno */}
                <div className="space-y-2">
                  <Label htmlFor="maternalSurname">Apellido Materno *</Label>
                  <Input
                    id="maternalSurname"
                    value={formData.maternalSurname}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maternalSurname: e.target.value,
                      })
                    }
                  />
                  {errors.maternalSurname && (
                    <p className="text-sm text-destructive">
                      {errors.maternalSurname}
                    </p>
                  )}
                </div>

                {/* Telefono */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                {/* Sexo */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Sexo *</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: "m" | "f") =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="f">Femenino</SelectItem>
                      <SelectItem value="m">Masculino</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-destructive">{errors.gender}</p>
                  )}
                </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                  />
                  {errors.birthDate && (
                    <p className="text-sm text-destructive">
                      {errors.birthDate}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Diabetico */}
                <div className="space-y-2">
                  <Label htmlFor="diabetic">Diabético</Label>
                  <Select
                    value={formData.diabetic ? "yes" : "no"}
                    onValueChange={(val) =>
                      setFormData({ ...formData, diabetic: val === "yes" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hipertenso */}
                <div className="space-y-2">
                  <Label htmlFor="hypertensive">Hipertenso</Label>
                  <Select
                    value={formData.hypertensive ? "yes" : "no"}
                    onValueChange={(val) =>
                      setFormData({ ...formData, hypertensive: val === "yes" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Sí</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Alergias */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="allergy">Alergias</Label>
                  <Input
                    id="allergy"
                    value={formData.allergy}
                    onChange={(e) =>
                      setFormData({ ...formData, allergy: e.target.value })
                    }
                  />
                </div>

              </div>
              <div className="space-y-2">
                <Label htmlFor="otherConditions">Otras Condiciones</Label>
                <Textarea
                  id="otherConditions"
                  value={formData.otherConditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      otherConditions: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/patients")}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="btn-primary">
                  <Save className="w-4 h-4 mr-2" /> Guardar Paciente
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>


      {/* Modal de éxito */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Paciente creado</AlertDialogTitle>
            <AlertDialogDescription>
              El paciente fue registrado correctamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => {
              setSuccessDialogOpen(false);
              navigate("/patients");
            }}>Aceptar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de error */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription className="text-destructive">
              {backendError || "Ocurrió un error al registrar el paciente."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setErrorDialogOpen(false)}>Cerrar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Layout>
  );
}
