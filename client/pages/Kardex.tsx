import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  FileText,
  Clock,
  Save,
  Filter,
  Check,
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
import { Product, ProductMovement } from "@shared/api";
import { getAllMockProducts, mockProductMovements } from "@/lib/mockData";
import Layout from "@/components/Layout";

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
        className="w-full justify-start font-normal"
      >
        {selectedProduct ? (
          <div className="flex flex-col items-start">
            <span className="truncate font-medium">{selectedProduct.name}</span>
            <span className="text-xs text-muted-foreground">
              Stock: {selectedProduct.stock} | SKU: {selectedProduct.sku}
            </span>
          </div>
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
  type: "entry" | "exit";
  quantity: number;
  reason: string;
  reference?: string;
}

export default function Kardex() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<ProductMovement[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddMovementDialogOpen, setIsAddMovementDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [movementFormData, setMovementFormData] =
    useState<CreateMovementRequest>({
      productId: "",
      type: "entry",
      quantity: 0,
      reason: "",
      reference: "",
    });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = movements;

    if (searchTerm) {
      filtered = filtered.filter(
        (movement) =>
          movement.product?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movement.reference?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (productFilter !== "all") {
      filtered = filtered.filter(
        (movement) => movement.productId === productFilter,
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((movement) => movement.type === typeFilter);
    }

    setFilteredMovements(filtered);
  }, [movements, searchTerm, productFilter, typeFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const mockProducts = getAllMockProducts();
      setProducts(mockProducts);
      setMovements(mockProductMovements);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetMovementForm = () => {
    setMovementFormData({
      productId: "",
      type: "entry",
      quantity: 0,
      reason: "",
      reference: "",
    });
  };

  const handleAddMovement = async () => {
    if (!movementFormData.productId || movementFormData.quantity <= 0) return;

    try {
      const selectedProduct = products.find(
        (p) => p.id === movementFormData.productId,
      );
      if (!selectedProduct) return;

      const previousStock = selectedProduct.stock;
      const newStock =
        movementFormData.type === "entry"
          ? previousStock + movementFormData.quantity
          : Math.max(0, previousStock - movementFormData.quantity);

      const newMovement: ProductMovement = {
        id: (movements.length + 1).toString(),
        ...movementFormData,
        previousStock,
        newStock,
        createdAt: new Date().toISOString(),
        createdBy: "current-user@example.com", // In a real app, this would be the current user
        product: selectedProduct,
      };

      // Update product stock
      const updatedProducts = products.map((p) =>
        p.id === movementFormData.productId ? { ...p, stock: newStock } : p,
      );

      setProducts(updatedProducts);
      setMovements([newMovement, ...movements]);
      setIsAddMovementDialogOpen(false);
      resetMovementForm();
    } catch (error) {
      console.error("Error adding movement:", error);
      alert("Error al registrar el movimiento");
    }
  };

  const getTotalEntries = () => {
    return movements
      .filter((m) => m.type === "entry")
      .reduce((sum, m) => sum + m.quantity, 0);
  };

  const getTotalExits = () => {
    return movements
      .filter((m) => m.type === "exit")
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
            onClick={() => setIsAddMovementDialogOpen(true)}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar movimiento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los productos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="entry">Entradas</SelectItem>
                    <SelectItem value="exit">Salidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Movements Table */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>
              Movimientos de Inventario ({filteredMovements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Stock Anterior</TableHead>
                  <TableHead>Stock Nuevo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Referencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay movimientos registrados</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((movement) => (
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
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {movement.product?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {movement.product?.sku}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1",
                              movement.type === "entry"
                                ? "text-green-600 border-green-600"
                                : "text-red-600 border-red-600",
                            )}
                          >
                            {movement.type === "entry" ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {movement.type === "entry" ? "Entrada" : "Salida"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "font-medium",
                              movement.type === "entry"
                                ? "text-green-600"
                                : "text-red-600",
                            )}
                          >
                            {movement.type === "entry" ? "+" : "-"}
                            {movement.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{movement.previousStock}</TableCell>
                        <TableCell className="font-medium">
                          {movement.newStock}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{movement.reason}</span>
                        </TableCell>
                        <TableCell>
                          {movement.reference && (
                            <span className="text-sm text-muted-foreground">
                              {movement.reference}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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
                Nuevo Movimiento de Inventario
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Movimiento *</Label>
                  <Select
                    value={movementFormData.type}
                    onValueChange={(value: "entry" | "exit") =>
                      setMovementFormData({
                        ...movementFormData,
                        type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Entrada
                        </div>
                      </SelectItem>
                      <SelectItem value="exit">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          Salida
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
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
                  <Label htmlFor="reference">Referencia</Label>
                  <Input
                    id="reference"
                    value={movementFormData.reference}
                    onChange={(e) =>
                      setMovementFormData({
                        ...movementFormData,
                        reference: e.target.value,
                      })
                    }
                    placeholder="Factura #123, Venta #456..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo *</Label>
                <Textarea
                  id="reason"
                  value={movementFormData.reason}
                  onChange={(e) =>
                    setMovementFormData({
                      ...movementFormData,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Compra de inventario, venta, ajuste de inventario, pérdida..."
                  rows={3}
                  required
                />
              </div>

              {movementFormData.productId && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium">Previsualización:</p>
                  <p className="text-sm text-muted-foreground">
                    Stock actual:{" "}
                    {products.find((p) => p.id === movementFormData.productId)
                      ?.stock || 0}{" "}
                    →{" "}
                    <span className="font-medium">
                      {movementFormData.type === "entry"
                        ? (products.find(
                            (p) => p.id === movementFormData.productId,
                          )?.stock || 0) + movementFormData.quantity
                        : Math.max(
                            0,
                            (products.find(
                              (p) => p.id === movementFormData.productId,
                            )?.stock || 0) - movementFormData.quantity,
                          )}
                    </span>
                  </p>
                </div>
              )}
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
                  movementFormData.quantity <= 0 ||
                  !movementFormData.reason.trim()
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
