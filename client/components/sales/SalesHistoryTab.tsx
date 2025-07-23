import React from "react";
import {
  Clock,
  DollarSign,
  TrendingUp,
  User,
  Eye,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Sale } from "@shared/api";

interface SalesHistoryTabProps {
  salesStats: any;
  isLoadingSales: boolean;
  salesPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    data: Sale[];
    goToPage: (p: number) => void;
    setPageSize: (s: number) => void;
  };
  paymentMethodFilter: string;
  setPaymentMethodFilter: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
  viewSaleDetails: (sale: Sale) => void;
  formatDateTime: (d: string) => { date: string; time: string };
  getPaymentMethodLabel: (m: string) => string;
  setActiveTab: (t: "pos" | "history") => void;
  selectedSale: Sale | null;
  isViewSaleDialogOpen: boolean;
  setIsViewSaleDialogOpen: (v: boolean) => void;
}

export default function SalesHistoryTab({
  salesStats,
  isLoadingSales,
  salesPagination,
  paymentMethodFilter,
  setPaymentMethodFilter,
  dateFilter,
  setDateFilter,
  viewSaleDetails,
  formatDateTime,
  getPaymentMethodLabel,
  setActiveTab,
  selectedSale,
  isViewSaleDialogOpen,
  setIsViewSaleDialogOpen,
}: SalesHistoryTabProps) {
  return (
    <div className="flex-1 flex flex-col space-y-4">
      {salesStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ventas de Hoy</p>
                  <p className="font-semibold">{salesStats.today} ventas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendido Hoy</p>
                  <p className="font-semibold">S/ {salesStats.todayAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="font-semibold">S/ {(salesStats.todayAmount / salesStats.today || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="card-modern">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="yape">Yape</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="pos">POS</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filtrar por fecha"
              className="w-fit"
            />

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const today = new Date();
                  setPaymentMethodFilter("all");
                  setDateFilter(today.toISOString().split("T")[0]);
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-modern flex-1">
        <CardHeader>
          <CardTitle>Historial de Ventas ({salesPagination.totalItems})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingSales ? (
            <div className="space-y-4">
              {Array.from({ length: salesPagination.pageSize }).map((_, i) => (
                <div key={i} className="loading-shimmer h-16 rounded"></div>
              ))}
            </div>
          ) : salesPagination.totalItems === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay ventas</h3>
              <p className="text-muted-foreground mb-6">
                No se encontraron ventas con los filtros aplicados
              </p>
              <Button onClick={() => setActiveTab("pos")} className="btn-primary">
                Realizar Venta
              </Button>
            </div>
          ) : (
            <>
              <Pagination
                currentPage={salesPagination.currentPage}
                totalPages={salesPagination.totalPages}
                totalItems={salesPagination.totalItems}
                pageSize={salesPagination.pageSize}
                onPageChange={salesPagination.goToPage}
                onPageSizeChange={salesPagination.setPageSize}
                showPageSizeSelector
                pageSizeOptions={[10, 15, 25, 50]}
              />

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesPagination.data.map((sale) => {
                      const { date, time } = formatDateTime(sale.date);
                      const customer = sale.patient;
                      const customerName = customer
                        ? `${customer.firstName} ${customer.paternalSurname} ${customer.maternalSurname}`
                        : "Venta general";
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{date}</p>
                              <p className="text-sm text-muted-foreground">{time}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{customerName}</p>
                                {customer && (
                                  <p className="text-sm text-muted-foreground">
                                    {customer.documentType == "dni" ? "DNI" : "Pasaporte"}: {customer.documentNumber}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sale.saleItems.length} producto{sale.saleItems.length !== 1 ? "s" : ""}</p>
                              <p className="text-sm text-muted-foreground">
                                {sale.saleItems.slice(0, 2).map((item) => item.product?.name).join(", ")}
                                {sale.saleItems.length > 2 && "..."}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {sale.user?.firstName} {sale.user?.lastName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-primary">S/ {sale.totalAmount.toFixed(2)}</span>
                              <Badge variant="outline" className="w-fit">
                                {getPaymentMethodLabel(sale.paymentMethod || "")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button onClick={() => viewSaleDetails(sale)} variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isViewSaleDialogOpen} onOpenChange={setIsViewSaleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> Detalles de la Venta
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Información de la Venta</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-muted-foreground text-sm">Fecha y Hora</Label>
                      <p className="font-medium">{new Date(selectedSale.date).toLocaleString("es-ES")}</p>
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-muted-foreground text-sm">Método de Pago</Label>
                      <Badge variant="outline" className="mt-1 w-fit">
                        {getPaymentMethodLabel(selectedSale.paymentMethod || "")}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Total</Label>
                      <p className="font-bold text-xl text-primary">S/ {selectedSale.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Cliente</h3>
                  <div className="space-y-4">
                    {selectedSale.patient ? (
                      <>
                        <div>
                          <Label className="text-muted-foreground text-sm">Nombre</Label>
                          <p className="font-medium">
                            {selectedSale.patient.firstName} {selectedSale.patient.paternalSurname} {selectedSale.patient.maternalSurname}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-sm">
                            {selectedSale.patient.documentType === "dni" ? "DNI" : "Pasaporte"}
                          </Label>
                          <p className="font-medium">{selectedSale.patient.documentNumber}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-sm">Teléfono</Label>
                          <p className="font-medium">{selectedSale.patient.phone}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Venta general (sin cliente)</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-3">Productos Vendidos</h3>
                <div className="space-y-3 overflow-y-auto max-h-[300px]">
                  {selectedSale.saleItems.map((item) => (
                    <div
                      key={`${item.product?.id}-${item.quantity}`}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">S/ {item.price.toFixed(2)} c/u</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity} x S/ {item.price.toFixed(2)}</p>
                        <p className="font-bold text-primary">S/ {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsViewSaleDialogOpen(false)} className="btn-primary">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
