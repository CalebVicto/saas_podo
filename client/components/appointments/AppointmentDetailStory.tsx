import React from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, UserCheck, CheckCircle, XCircle, Clock, DollarSign, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@shared/time";

type AnyAppt = any;

const toMoney = (n?: number | null) => Number(n || 0).toFixed(2);
const getQty = (p: any) => Number(p.quantity ?? p.qty ?? 1);

// Normaliza paciente/worker con tu API (patient || patientId / worker || userId)
const getPatient = (a: AnyAppt) => a.patient ?? a.patientId ?? {};
const getWorker = (a: AnyAppt) => a.worker ?? a.userId ?? {};

const calcProductsTotal = (products: any[] = []) =>
  products.reduce((acc, p) => acc + Number(p.price || 0) * getQty(p), 0);

const calcTotal = (a: any) => {
  const base =
    Number(a.appointmentPrice || 0) + Number(a.treatmentPrice || 0);
  return base + calcProductsTotal(a.products);
};


const StatusDot: React.FC<{ status: "registered" | "paid" | "canceled" }> = ({ status }) => {
  const map = {
    registered: { Icon: Clock, text: "Registrada" },
    paid: { Icon: CheckCircle, text: "Pagada" },
    canceled: { Icon: XCircle, text: "Cancelada" },
  } as const;
  const { Icon, text } = map[status] ?? map.registered;
  return (
    <span className="inline-flex items-center gap-2">
      <Icon className={cn("w-4 h-4", status === "paid" ? "text-green-600" : status === "canceled" ? "text-destructive" : "text-muted-foreground")} />
      {text}
    </span>
  );
};

export const AppointmentDetailStory: React.FC<{
  appt: AnyAppt;
  statusConfig: any;
}> = ({ appt, statusConfig }) => {
  const patient = getPatient(appt);
  const worker = getWorker(appt);

  // fecha/hora fuente: prioriza dateTime si existe; si no, createdAt
  const dateSource = appt.dateTime ?? appt.createdAt;

  const total = appt.appointmentPrice;

  return (
    <Tabs defaultValue="horizontal" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="horizontal">Vista Horizontal</TabsTrigger>
        <TabsTrigger value="vertical">Vista Vertical</TabsTrigger>
      </TabsList>

      {/* ====================== H O R I Z O N T A L ====================== */}
      <TabsContent value="horizontal" className="space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda */}
          <div className="space-y-4">
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" /> Información de la Cita
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatDate(dateSource)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="font-medium">{formatTime(dateSource)}</p>
                </div>
                {/* Duración removed per new requirements */}
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <Badge
                    variant="outline"
                    className={cn("mt-1", statusConfig[appt.status]?.className)}
                  >
                    <StatusDot status={appt.status} />
                  </Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" /> Diagnóstico y Tratamiento
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Diagnóstico</p>
                  <p className="font-medium">{appt.diagnosis || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tratamiento</p>
                  <p className="font-medium">{appt.treatment || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="space-y-4">
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-primary" /> Paciente
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="font-medium">
                    {patient.documentType?.toUpperCase() || "—"} {patient.documentNumber || ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{patient.phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">
                    {[patient.firstName, patient.paternalSurname, patient.maternalSurname]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <UserCheck className="w-4 h-4 text-primary" /> Profesional
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Nombre</p>
                  <p className="font-medium">
                    {[worker.firstName, worker.lastName].filter(Boolean).join(" ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usuario</p>
                  <p className="font-medium">{worker.username || "—"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" /> Paquetes
              </h3>
              <div className="space-y-2">
                {Array.isArray((appt as any).patientPackageDetails) && (appt as any).patientPackageDetails.length > 0 ? (
                  (appt as any).patientPackageDetails.map((ppd: any) => {
                    const pkg = ppd?.patientPackageId?.packageId || ppd?.package || null;
                    const name = pkg?.name || "(sin paquete)";
                    const coverage = ppd?.coverage != null ? `Cobertura: ${ppd.coverage}` : null;
                    const debt = ppd?.debt != null ? `Deuda: S/ ${Number(ppd.debt).toFixed(2)}` : null;
                    const totalSessions = pkg?.sessions ?? pkg?.sessionsCount ?? null;
                    const remaining = ppd?.patientPackageId?.remainingSessions ?? ppd?.remainingSessions ?? null;
                    const sessionsText = totalSessions != null || remaining != null
                      ? `Sesiones: ${totalSessions ?? "?"}${remaining != null ? ` / restantes: ${remaining}` : ""}`
                      : null;

                    return (
                      <div key={ppd.id || name} className="text-sm">
                        <div className="font-medium">{name}</div>
                        <div className="text-muted-foreground text-xs">{[coverage, debt, sessionsText].filter(Boolean).join(' · ') || '—'}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">—</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Productos + Totales + Pago */}
        <section className="space-y-4">
          {/* Productos */}
          {(appt.products?.length ?? 0) > 0 && (
            <div className="rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Productos</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio (S/)</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal (S/)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appt.products.map((p: any) => {
                      const qty = getQty(p);
                      const subtotal = Number(p.price || 0) * qty;
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell className="text-right">{toMoney(p.price)}</TableCell>
                          <TableCell className="text-right">{qty}</TableCell>
                          <TableCell className="text-right">{toMoney(subtotal)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-semibold">
                        Total productos
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        S/ {toMoney(calcProductsTotal(appt.products))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Totales */}
          <div className="rounded-xl border p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Productos</p>
                <p className="text-lg font-semibold">S/ {toMoney(calcProductsTotal(appt.products))}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Consulta</p>
                <p className="text-lg font-semibold">S/ {toMoney(appt.treatmentPrice)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">S/ {toMoney(total)}</p>
              </div>
            </div>
          </div>

          {/* Pago */}
          {appt.status === "paid" && (
            <div className="rounded-xl border p-4 bg-green-50">
              <h3 className="font-semibold flex items-center gap-2 mb-2 text-green-700">
                <DollarSign className="w-4 h-4" /> Pago Registrado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Método</p>
                  <p className="font-medium capitalize">{appt.paymentMethod || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de pago</p>
                  <p className="font-medium">
                    {appt.paymentDate ? new Date(appt.paymentDate).toLocaleString("es-PE") : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Monto</p>
                  <p className="font-medium">S/ {toMoney(total)}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </TabsContent>

      {/* ====================== V E R T I C A L ====================== */}
      <TabsContent value="vertical" className="space-y-6">
        {/* Encabezado tipo ficha */}
        <section className="rounded-xl border p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Historia Clínica</h3>
              <p className="text-sm text-muted-foreground">
                ID: {appt.id}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("gap-2", statusConfig[appt.status]?.className)}
            >
              <StatusDot status={appt.status} />
            </Badge>
          </div>
        </section>

        {/* Secciones apiladas */}
        <section className="rounded-xl border p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Cita
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Fecha</p>
              <p className="font-medium">{formatDate(dateSource)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hora</p>
              <p className="font-medium">{formatTime(dateSource)}</p>
            </div>
            {/* Duración removed per new requirements */}
            <div>
              <p className="text-muted-foreground">Estado</p>
              <p className="font-medium"><StatusDot status={appt.status} /></p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Paciente
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Nombre completo</p>
              <p className="font-medium">
                {[patient.firstName, patient.paternalSurname, patient.maternalSurname]
                  .filter(Boolean).join(" ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Documento</p>
              <p className="font-medium">
                {patient.documentType?.toUpperCase() || "—"} {patient.documentNumber || ""}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-medium">{patient.phone || "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Profesional
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="md:col-span-2">
              <p className="text-muted-foreground">Nombre</p>
              <p className="font-medium">
                {[worker.firstName, worker.lastName].filter(Boolean).join(" ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Usuario</p>
              <p className="font-medium">{worker.username || "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Diagnóstico y Tratamiento
          </h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Diagnóstico</p>
              <p className="font-medium">{appt.diagnosis || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tratamiento</p>
              <p className="font-medium">{appt.treatment || "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Paquetes
          </h4>
          <div className="space-y-2">
            {Array.isArray((appt as any).patientPackageDetails) && (appt as any).patientPackageDetails.length > 0 ? (
              (appt as any).patientPackageDetails.map((ppd: any) => {
                const pkg = ppd?.patientPackageId?.packageId || ppd?.package || null;
                const name = pkg?.name || "(sin paquete)";
                const coverage = ppd?.coverage != null ? `Cobertura: ${ppd.coverage}` : null;
                const debt = ppd?.debt != null ? `Deuda: S/ ${Number(ppd.debt).toFixed(2)}` : null;
                const totalSessions = pkg?.sessions ?? pkg?.sessionsCount ?? null;
                const remaining = ppd?.patientPackageId?.remainingSessions ?? ppd?.remainingSessions ?? null;
                const sessionsText = totalSessions != null || remaining != null
                  ? `Sesiones: ${totalSessions ?? "?"}${remaining != null ? ` / restantes: ${remaining}` : ""}`
                  : null;

                return (
                  <div key={ppd.id || name} className="text-sm">
                    <div className="font-medium">{name}</div>
                    <div className="text-muted-foreground text-xs">{[coverage, debt, sessionsText].filter(Boolean).join(' · ') || '—'}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )}
          </div>
        </section>

        {(appt.products?.length ?? 0) > 0 && (
          <div className="rounded-xl border p-4">
            <h3 className="font-semibold mb-3">Productos</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio (S/)</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Subtotal (S/)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appt.products.map((p: any) => {
                    const qty = getQty(p);
                    const subtotal = Number(p.price || 0) * qty;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell className="text-right">{toMoney(p.price)}</TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                        <TableCell className="text-right">{toMoney(subtotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total productos
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      S/ {toMoney(calcProductsTotal(appt.products))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}


        <section className="rounded-xl border p-4">
          <h4 className="font-semibold mb-3">Resumen Económico</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Productos</p>
              <p className="text-lg font-semibold">S/ {toMoney(calcProductsTotal(appt.products))}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Consulta</p>
              <p className="text-lg font-semibold">S/ {toMoney(appt.treatmentPrice)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">S/ {toMoney(total)}</p>
            </div>
          </div>

          {appt.status === "paid" && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm bg-green-50 border border-green-200 p-4 rounded-lg">
              <div>
                <p className="text-muted-foreground">Método</p>
                <p className="font-medium capitalize">{appt.paymentMethod || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha de pago</p>
                <p className="font-medium">
                  {appt.paymentDate ? new Date(appt.paymentDate).toLocaleString("es-PE") : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monto</p>
                <p className="font-medium">S/ {toMoney(total)}</p>
              </div>
            </div>
          )}
        </section>
      </TabsContent>
    </Tabs>
  );
};
