import React from "react";
import {
  Search,
  X,
  Package,
  User,
  Minus,
  Plus,
  Calculator,
  ShoppingCart,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Patient, Product } from "@shared/api";

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface POSTabProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  categories: { id: string | number; name: string }[];
  productPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    data: Product[];
    goToPage: (p: number) => void;
    setPageSize: (s: number) => void;
  };
  filteredProducts: Product[];
  isLoadingProducts: boolean;
  productError: string | null;
  addToCart: (product: Product, event?: React.MouseEvent) => void;
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  cart: CartItem[];
  selectedPatient: Patient | null;
  setSelectedPatient: (p: Patient | null) => void;
  saleForm: {
    paymentMethod: string;
    totalAmount: number;
    customerId?: string;
  };
  setSaleForm: (f: any) => void;
  isPatientModalOpen: boolean;
  setIsPatientModalOpen: (v: boolean) => void;
  patientSearchTerm: string;
  setPatientSearchTerm: (v: string) => void;
  patientResults: Patient[];
  isLoadingPatients: boolean;
  handleClearFiltersPOS: () => void;
  setIsConfirmDialogOpen: (v: boolean) => void;
}

export default function POSTab({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  productPagination,
  filteredProducts,
  isLoadingProducts,
  productError,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  cart,
  selectedPatient,
  setSelectedPatient,
  saleForm,
  setSaleForm,
  isPatientModalOpen,
  setIsPatientModalOpen,
  patientSearchTerm,
  setPatientSearchTerm,
  patientResults,
  isLoadingPatients,
  handleClearFiltersPOS,
  setIsConfirmDialogOpen,
}: POSTabProps) {
  return (
    <div className="flex-1 flex gap-6" style={{ overflowY: "hidden" }}>
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Search and Filters */}
        <Card className="card-modern mb-2">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {/* Limpiar Filtros */}
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 transform -translate-y-1/2"
                  onClick={handleClearFiltersPOS}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Array.isArray(categories) &&
                    categories
                      .filter(
                        (category: any) =>
                          category && category.id && category.name,
                      )
                      .map((category: any) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <Pagination
          currentPage={productPagination.currentPage}
          totalPages={productPagination.totalPages}
          totalItems={productPagination.totalItems}
          pageSize={productPagination.pageSize}
          onPageChange={productPagination.goToPage}
          onPageSizeChange={productPagination.setPageSize}
          showPageSizeSelector={true}
          pageSizeOptions={[10, 15, 25, 50]}
        />

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pt-2">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">Cargando productos...</p>
              </div>
            </div>
          ) : productError ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <p className="text-destructive font-medium">Error al cargar</p>
                  <p className="text-sm text-muted-foreground">{productError}</p>
                </div>
                <Button onClick={productPagination.goToPage} variant="outline" size="sm">
                  Reintentar
                </Button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Package className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-muted-foreground font-medium">No hay productos</p>
                  <p className="text-sm text-muted-foreground">No se encontraron productos disponibles</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={(e) => addToCart(product, e)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.stock} - S/ {product.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout */}
        {cart.length > 0 && (
          <Card className="card-modern">
            <CardContent className="p-4 space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente (Opcional)</Label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {selectedPatient.firstName} {selectedPatient.paternalSurname}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPatient.documentNumber}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSaleForm({ ...saleForm, customerId: undefined });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsPatientModalOpen(true)}
                    className="w-full justify-start"
                  >
                    <User className="w-4 h-4 mr-2" /> Seleccionar paciente
                  </Button>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Método de Pago</Label>
                <Select
                  value={saleForm.paymentMethod}
                  onValueChange={(value: any) => setSaleForm({ ...saleForm, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="yape">Yape</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">S/ {saleForm.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => setIsConfirmDialogOpen(true)}
                className="w-full btn-primary h-12 text-lg font-semibold"
                disabled={cart.length === 0}
              >
                <Calculator className="w-5 h-5 mr-2" />
                Procesar Venta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - Cart */}
      <Card className="card-modern h-full">
        <CardContent className="p-4 space-y-4 h-full overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay productos en el carrito</p>
              <p className="text-sm text-muted-foreground">Haz clic en los productos para agregarlos</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-3 border border-border rounded-lg"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                  <p className="text-xs text-muted-foreground">S/ {item.product.price.toFixed(2)} c/u</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>

                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-sm">S/ {item.subtotal.toFixed(2)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 p-1 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Patient Modal */}
      <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Seleccionar Paciente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isLoadingPatients ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : patientResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron pacientes
                </div>
              ) : (
                patientResults.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSaleForm({ ...saleForm, customerId: patient.id });
                      setIsPatientModalOpen(false);
                      setPatientSearchTerm("");
                    }}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 flex justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {patient.firstName} {patient.paternalSurname}
                      </p>
                      <p className="text-sm text-muted-foreground">{patient.documentNumber}</p>
                    </div>
                    {selectedPatient?.id === patient.id && <Check className="w-5 h-5 text-primary" />}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsPatientModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

