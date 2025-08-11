import React, { useState, useEffect, useMemo } from "react";
import { toast } from "@/components/ui/use-toast";
import {
  BarChart,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Save,
  Filter,
  Check,
  X,
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
import { Product, ProductMovement, KardexMovement, Purchase, Sale } from "@shared/api";
import { apiGet, apiPost, type ApiResponse } from "@/lib/auth";
import Layout from "@/components/Layout";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { Pagination } from "@/components/ui/pagination";
import { PaginatedSearchParams, PaginatedResponse } from "@shared/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SearchableProductSelectProps {
  products: Product[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

function SearchableProductSelect({
  products,
  value,
  onValueChange,
  placeholder,
}: SearchableProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;

    return products.filter((product) =>
      [
        product.name,
        product.sku,
        product.category?.name,
        product.description,
      ].some((field) =>
        field?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [products, searchTerm]);

  const selectedProduct = products.find((product) => product.id === value);

  const handleSelect = (product: Product) => {
    onValueChange(product.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full justify-start font-normal py-6 relative"
      >
        {selectedProduct ? (
          <>
            <div className="flex flex-col items-start">
              <span className="truncate font-medium">{selectedProduct.name}</span>
              <span className="text-xs text-muted-foreground">
                Stock: {selectedProduct.stock} | SKU: {selectedProduct.sku}
              </span>
            </div>

            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onValueChange("all");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </span>

          </>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Seleccionar Producto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, categoría o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron productos</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className="p-3 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>SKU: {product.sku}</span>
                          <span>Stock: {product.stock}</span>
                          <span>Categoría: {product.category?.name}</span>
                          <span className="font-medium text-primary">
                            S/ {product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {value === product.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CreateMovementRequest {
  productId: string;
  quantity: number;
  price: number;
}

export default function Kardex() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddMovementDialogOpen, setIsAddMovementDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isViewSaleDialogOpen, setIsViewSaleDialogOpen] = useState(false);

  const kardexPagination = useRepositoryPagination<ProductMovement>({
    initialPageSize: 15,
  });

  const [movementFormData, setMovementFormData] =
    useState<CreateMovementRequest>({
      productId: "",
      quantity: 0,
      price: 0,
    });

  const [summary, setSummary] = useState<{
    totalEntries: number;
    totalExits: number;
    totalInventoryValue: number;
    lowStock: any[];
  } | null>(null);


  useEffect(() => {
    loadData();
    loadSummary();
  }, []);

  useEffect(() => {
    kardexPagination.goToPage(1);
  }, [searchTerm, productFilter, typeFilter]);

  useEffect(() => {
    loadData(); // tu wrapper que llama kardexPagination.loadData(...)
  }, [
    kardexPagination.currentPage,
    kardexPagination.pageSize,
    searchTerm,
    productFilter,
    typeFilter,
  ]);


  const loadData = async () => {
    setIsLoading(true);
    try {
      const productResp = await apiGet<ApiResponse<{
        data: Product[];
        total: number;
        page: number;
        limit: number;
      }>>("/product?page=1&limit=1000");

      if (!productResp.data || productResp.data.state !== "success") {
        throw new Error(productResp.error || "No se pudieron cargar productos");
      }

      setProducts(productResp.data.data.data);

      await kardexPagination.loadData(async (params: PaginatedSearchParams) => {
        const query = new URLSearchParams();
        query.set("page", String(params.page));
        query.set("limit", String(params.limit));
        if (searchTerm) query.set("search", searchTerm);
        if (productFilter !== "all") query.set("productId", productFilter);
        if (typeFilter !== "all") query.set("type", typeFilter);

        const response = await apiGet<ApiResponse<{
          data: ProductMovement[];
          total: number;
          page: number;
          limit: number;
        }>>(`/kardex?${query.toString()}`);

        if (!response.data || response.data.state !== "success") {
          throw new Error(response.error || "No se pudo cargar el kardex");
        }

        const { data, total, page, limit } = response.data.data;

        return {
          items: data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        } as PaginatedResponse<ProductMovement>;
      });

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const resp = await apiGet<ApiResponse<{
        totalEntries: number;
        totalExits: number;
        totalInventoryValue: number;
        lowStock: any[];
      }>>("/kardex/summary");

      if (!resp.data || resp.data.state !== "success") {
        throw new Error(resp.error || "No se pudo obtener el resumen");
      }

      setSummary(resp.data.data);
    } catch (error) {
      console.error("Error al obtener resumen:", error);
    }
  };


  const getLinkRelativeTable = (relatedTable: "Purchase" | "PurchaseReturn" | "Sale", relatedId: string) => {
    const baseRoutes: Record<typeof relatedTable, string> = {
      Purchase: "/purchase",
      PurchaseReturn: "/purchase-return",
      Sale: "/sale"
    };

    const labelMap: Record<typeof relatedTable, string> = {
      Purchase: "Compra",
      PurchaseReturn: "Devolución",
      Sale: "Venta"
    };

    return (
      <a
        href={`${baseRoutes[relatedTable]}/${relatedId}`}
        className="text-primary hover:underline"
        target="_blank"
      >
        Ver {labelMap[relatedTable]}
      </a>
    );
  };

  const viewSaleDetails = async (saleId: string) => {
    try {
      const resp = await apiGet<ApiResponse<Sale>>(`/sale/${saleId}`);
      if (resp.data && resp.data.state === "success") {
        setSelectedSale(resp.data.data);
        setIsViewSaleDialogOpen(true);
      } else {
        toast({ title: "No se pudo cargar la venta", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error loading sale:", error);
      toast({ title: "Error al cargar la venta", variant: "destructive" });
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: "Efectivo",
      transfer: "Transferencia",
      yape: "Yape",
      pos: "POS",
      plin: "Plin",
      balance: "Saldo",
    } as const;
    return labels[method as keyof typeof labels] || method;
  };


  const resetMovementForm = () => {
    setMovementFormData({
      productId: "",
      quantity: 0,
      price: 0,
    });
  };

  const exportToExcel = (data: ProductMovement[], fileNamePrefix: string) => {
    const exportData = data.map((movement) => {
      const product = products.find((p) => p.id === movement.productId);
      return {
        Fecha: new Date(movement.date || movement.createdAt).toLocaleString(
          "es-PE",
        ),
        Producto: product?.name || "Desconocido",
        Tipo: movement.type,
        Cantidad: movement.quantity,
        "Costo Unitario": movement.costUnit,
        "Costo Total": movement.totalCost,
        "Stock Nuevo": movement.stockAfter,
        CostoVenta: movement.type === "salida" && movement.salePrice !== null
          ? movement.salePrice
          : "",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kardex");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${fileNamePrefix}_${timestamp}.xlsx`;

    saveAs(blob, filename);
  };

  const handleExportAll = async () => {
    try {
      const query = new URLSearchParams();
      query.set("page", "1");
      query.set("limit", "100000");
      if (searchTerm) query.set("search", searchTerm);
      if (productFilter !== "all") query.set("productId", productFilter);
      if (typeFilter !== "all") query.set("type", typeFilter);

      const response = await apiGet<ApiResponse<{
        data: ProductMovement[];
        total: number;
        page: number;
        limit: number;
      }>>(`/kardex?${query.toString()}`);

      if (!response.data || response.data.state !== "success") {
        throw new Error(response.error || "No se pudo exportar el kardex");
      }

      exportToExcel(response.data.data.data, "kardex_completo");
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error("Error al exportar:", error);
      toast({ title: "Error al exportar todos los movimientos", variant: "destructive" });
    }
  };

  const handleExportCurrentPage = () => {
    exportToExcel(kardexPagination.data, "kardex_pagina_actual");
    setIsExportDialogOpen(false);
  };


  const handleAddMovement = async () => {
    if (!movementFormData.productId || movementFormData.quantity < 0 || movementFormData.price < 0) return;

    try {

      const resp = await apiPost<ApiResponse<Purchase>>("/purchase", {
        "productId": movementFormData.productId,
        "supplierId": null,
        "quantity": movementFormData.quantity,
        "price": movementFormData.price,
      });

      if (!resp.data || resp.data.state !== "success") {
        throw new Error(resp.error || resp.data?.message || "Failed to create purchase");
      }


      setIsAddMovementDialogOpen(false);
      resetMovementForm();
      await loadData();
      await loadSummary();
    } catch (error) {
      console.error("Error adding movement:", error);
      toast({ title: "Error al registrar el movimiento", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Kardex" subtitle="Control de inventario y movimientos">
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
      title="Kardex"
      subtitle="Control de inventario y movimientos de stock"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Control de Inventario
              </h1>
              <p className="text-muted-foreground">
                Gestiona entradas y salidas de productos
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              resetMovementForm();
              setIsAddMovementDialogOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Movimiento
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Entradas (Productos)
                  </p>
                  <p className="font-semibold">
                    {summary?.totalEntries ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Salidas (Productos)</p>
                  <p className="font-semibold">
                    {summary?.totalExits ?? "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">
                    S/ {summary?.totalInventoryValue.toFixed(2) ?? "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <FileText className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo ({`< 6`})</p>
                  <p className="font-semibold">{summary?.lowStock.length ?? '-'} <span className="text-xs text-muted-foreground">UNI</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-modern">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <SearchableProductSelect
                  products={products}
                  value={productFilter}
                  onValueChange={setProductFilter}
                  placeholder="Filtrar producto..."
                />

              </div>

              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="salida">Salidas</SelectItem>

                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsExportDialogOpen(true)}>
                  <Filter className="w-4 h-4" />
                  Exportar
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>
              Movimientos de Inventario ({kardexPagination.data.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Pagination
              currentPage={kardexPagination.currentPage}
              totalPages={kardexPagination.totalPages}
              totalItems={kardexPagination.totalItems}
              pageSize={kardexPagination.pageSize}
              onPageChange={kardexPagination.goToPage}
              onPageSizeChange={kardexPagination.setPageSize}
              showPageSizeSelector={true}
              pageSizeOptions={[10, 15, 25, 50]}
              className="my-2"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">Costo Compra (c/u)</TooltipTrigger>
                        <TooltipContent>Precio unitario de compra</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">Costo Venta (c/u)</TooltipTrigger>
                        <TooltipContent>Precio unitario de venta aplicado a esta salida</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-default">Costo Total</TooltipTrigger>
                        <TooltipContent>Precio total de la compra o venta</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-center">Stock Nuevo</TableHead>
                  <TableHead className="">Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kardexPagination.totalItems === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay movimientos registrados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  kardexPagination.data.
                    map((movement) => {
                      const product = products.find((p) => p.id === movement.productId);
                      const movementDate = movement.date || movement.createdAt;

                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {new Date(movementDate).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(movementDate).toLocaleTimeString(
                                  "es-ES",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{product?.name || "Desconocido"}</TableCell>
                          <TableCell>
                            <Badge variant={movement.type === "entrada" ? "default" : "destructive"}>
                              {movement.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{movement.quantity}</TableCell>
                          <TableCell className="text-center">S/ {movement.costUnit}</TableCell>
                          <TableCell className="text-center">
                            {movement.type === "salida" && movement.salePrice !== null
                              ? `S/ ${movement.salePrice.toFixed(2)}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-center">S/ {movement.totalCost}</TableCell>
                          <TableCell className="text-center">{movement.stockAfter}</TableCell>
                          <TableCell>
                            {movement.relatedTable === "Sale" && movement.relatedId ? (
                              <button
                                onClick={() => viewSaleDetails(movement.relatedId)}
                                className="text-primary hover:underline"
                              >
                                Ver Venta
                              </button>
                            ) : movement.relatedTable && movement.relatedId ? (
                              <span className="text-sm text-muted-foreground">
                                {
                                  movement.relatedTable == "Sale" ?
                                    getLinkRelativeTable(
                                      movement.relatedTable as "Purchase" | "PurchaseReturn" | "Sale",
                                      movement.relatedId,
                                    ) : 'N/A'
                                }
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Sale Details Dialog */}
        <Dialog
          open={isViewSaleDialogOpen}
          onOpenChange={setIsViewSaleDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Venta</DialogTitle>
            </DialogHeader>

            {selectedSale && (
              <div className="space-y-6 py-4">
                {selectedSale.state === "anulada" && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                    <Badge variant="destructive" className="w-fit">Venta Anulada</Badge>
                    {selectedSale.cancelReason && (
                      <p className="text-sm text-muted-foreground italic">
                        Motivo: {selectedSale.cancelReason}
                      </p>
                    )}
                    {selectedSale.canceledAt && (
                      <p className="text-sm text-muted-foreground">
                        Fecha de anulación:{" "}
                        {new Date(selectedSale.canceledAt).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                    {selectedSale.canceledBy && (
                      <p className="text-sm text-muted-foreground">
                        Anulado por: <span className="font-medium">{selectedSale.canceledBy.firstName} {selectedSale.canceledBy.lastName}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Información de la Venta</h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">Fecha y Hora</Label>
                        <p className="font-medium">
                          {new Date(selectedSale.date).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <Label className="text-muted-foreground text-sm">Método de Pago</Label>
                        <Badge variant="outline" className="mt-1 w-fit">
                          {getPaymentMethodLabel(selectedSale.paymentMethod || "")}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">Total</Label>
                        <p className="font-bold text-xl text-primary">
                          S/ {selectedSale.totalAmount.toFixed(2)}
                        </p>
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
                              {selectedSale.patient.firstName}{" "}
                              {selectedSale.patient.paternalSurname}{" "}
                              {selectedSale.patient.maternalSurname}
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
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium">
                          S/ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Movement Dialog */}
        <Dialog
          open={isAddMovementDialogOpen}
          onOpenChange={setIsAddMovementDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nuevo Entrada de Inventario
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2" style={{ gridColumnStart: 1, gridColumnEnd: 3 }}>
                  <Label htmlFor="productId">Producto *</Label>
                  <SearchableProductSelect
                    products={products}
                    value={movementFormData.productId}
                    onValueChange={(value) =>
                      setMovementFormData({
                        ...movementFormData,
                        productId: value,
                      })
                    }
                    placeholder="Buscar y seleccionar producto..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={movementFormData.quantity}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={movementFormData.price}
                    onChange={(e) => {
                      console.log('parseFloat(e.target.value)', parseFloat(e.target.value))
                      setMovementFormData({
                        ...movementFormData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }}
                    placeholder="0.00"
                    step={0.01}
                    required
                  />
                </div>

                {movementFormData.productId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Precio de venta</Label>
                      <div className="p-2 bg-muted/30 rounded text-sm">
                        S/{" "}
                        {products.find((p) => p.id === movementFormData.productId)?.price.toFixed(2) ??
                          "0.00"}
                      </div>
                    </div>

                    {movementFormData.price >
                      (products.find((p) => p.id === movementFormData.productId)?.price || 0) && (
                        <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm font-medium border border-red-300">
                          ⚠️ El precio de compra es mayor que el precio de venta. Verifica los valores antes de guardar.
                        </div>
                      )}
                  </>
                )}

              </div>

              {movementFormData.productId && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium">Previsualización:</p>
                  <p className="text-sm text-muted-foreground">
                    Stock actual:{" "}
                    {products.find((p) => p.id === movementFormData.productId)
                      ?.stock || 0}{" "}
                    →{" "}
                    <span className="font-medium">
                      {(products.find(
                        (p) => p.id === movementFormData.productId,
                      )?.stock || 0) + movementFormData.quantity
                      }
                    </span>
                  </p>
                </div>
              )}

              {(movementFormData.price > 0 && movementFormData.quantity) ? (
                <div className="p-3 pr-4 bg-emerald-100 rounded-lg flex justify-between">
                  <span className="text-lg">TOTAL</span>
                  <span className="text-lg">S/ {(movementFormData.price * movementFormData.quantity).toFixed(2)} </span>
                </div>
              ) : null}

            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddMovementDialogOpen(false);
                  resetMovementForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddMovement}
                className="btn-primary"
                disabled={
                  !movementFormData.productId ||
                  movementFormData.quantity < 0 ||
                  movementFormData.price < 0
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Registrar Movimiento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>¿Qué desea exportar?</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExportCurrentPage}
              >
                Exportar página actual
              </Button>

              <Button
                className="w-full btn-primary"
                onClick={handleExportAll}
              >
                Exportar todos los movimientos
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
