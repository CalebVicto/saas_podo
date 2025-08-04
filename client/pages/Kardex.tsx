import React, { useState, useEffect, useMemo } from "react";
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
import { Product, ProductMovement, KardexMovement, Purchase } from "@shared/api";
import { apiGet, apiPost, type ApiResponse } from "@/lib/auth";
import Layout from "@/components/Layout";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { Pagination } from "@/components/ui/pagination";
import { PaginatedSearchParams, PaginatedResponse } from "@shared/api";

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
  const kardexPagination = useRepositoryPagination<ProductMovement>({
    initialPageSize: 15,
  });

  const [movementFormData, setMovementFormData] =
    useState<CreateMovementRequest>({
      productId: "",
      quantity: 0,
      price: 0,
    });

  useEffect(() => {
    loadData();
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


  const resetMovementForm = () => {
    setMovementFormData({
      productId: "",
      quantity: 0,
      price: 0,
    });
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
    } catch (error) {
      console.error("Error adding movement:", error);
      alert("Error al registrar el movimiento");
    }
  };

  const getTotalEntries = () => {
    return movements
      .filter((m) => m.type === "entrada")
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getTotalExits = () => {
    return movements
      .filter((m) => m.type === "salida")
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getTotalValue = () => {
    return products.reduce((sum, p) => sum + p.price * p.stock, 0);
  };

  const getProductWithLowStock = () => {
    return products.filter((p) => p.stock <= 5 && p.stock > 0).length;
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
                    Total Entradas
                  </p>
                  <p className="font-semibold">{getTotalEntries()}</p>
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
                  <p className="text-sm text-muted-foreground">Total Salidas</p>
                  <p className="font-semibold">{getTotalExits()}</p>
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
                    S/ {getTotalValue().toFixed(0)}
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
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="font-semibold">{getProductWithLowStock()}</p>
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
                <Button variant="outline" className="flex items-center gap-2">
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
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo Unitario</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Stock Nuevo</TableHead>
                  <TableHead>Referencia</TableHead>
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

                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {new Date(
                                  movement.createdAt,
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(movement.createdAt).toLocaleTimeString(
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
                          <TableCell className="text-center">{movement.costUnit}</TableCell>
                          <TableCell className="text-center">{movement.totalCost}</TableCell>
                          <TableCell className="text-center">{movement.stockAfter}</TableCell>
                          <TableCell>
                            {(movement.relatedTable && movement.relatedId) && (
                              <span className="text-sm text-muted-foreground">
                                {getLinkRelativeTable(movement.relatedTable as any, movement.relatedId)}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
      </div>
    </Layout>
  );
}
