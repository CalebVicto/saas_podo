import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  User,
  CreditCard,
  Check,
  X,
  Package,
  DollarSign,
  Calculator,
  Receipt,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Product, Sale, SaleItem, Payment } from "@shared/api";
import {
  getAllMockProducts,
  getMockProductCategories,
  getMockPatients,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface SaleForm {
  customerId?: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: "cash" | "yape" | "plin" | "transfer" | "card";
  notes?: string;
}

interface User {
  id: string;
  name: string;
  role: "admin" | "worker";
}

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("podocare_user");
    return stored ? JSON.parse(stored) : null;
  });
  return { user };
};

export function Sales() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    items: [],
    totalAmount: 0,
    paymentMethod: "cash",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Load data on component mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  // Update sale form when cart changes
  useEffect(() => {
    try {
      const totalAmount = cart.reduce((sum, item) => {
        // Validate item data
        if (
          !item ||
          typeof item.subtotal !== "number" ||
          isNaN(item.subtotal)
        ) {
          console.warn("Invalid cart item:", item);
          return sum;
        }
        return sum + item.subtotal;
      }, 0);

      setSaleForm((prev) => ({
        ...prev,
        items: cart,
        totalAmount: Math.max(0, totalAmount), // Ensure non-negative
      }));
    } catch (error) {
      console.error("Error updating sale form:", error);
      // Reset to safe state if there's an error
      setSaleForm((prev) => ({
        ...prev,
        items: [],
        totalAmount: 0,
      }));
    }
  }, [cart]);

  const loadData = async () => {
    setIsLoadingProducts(true);
    setProductError(null);

    try {
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const allProducts = getAllMockProducts();
      const mockCategories = getMockProductCategories();
      const mockPatients = getMockPatients();

      // Validate products data
      if (!Array.isArray(allProducts)) {
        throw new Error("Invalid products data structure");
      }

      const mockProducts = allProducts.filter(
        (p) => p && p.isActive && p.stock > 0 && p.price > 0,
      );

      setProducts(mockProducts);
      setCategories(mockCategories || []);
      setPatients(mockPatients || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setProductError(
        "Error al cargar los productos. Por favor, recarga la página.",
      );
      setProducts([]);
      setCategories([]);
      setPatients([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product, event?: React.MouseEvent) => {
    // Prevent event bubbling if called from button
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Validate product data
    if (!product || !product.id || product.stock <= 0) {
      console.warn("Invalid product or no stock available:", product);
      return;
    }

    try {
      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.product.id === product.id,
        );

        if (existingItem) {
          // Update existing item
          const newQuantity = Math.min(
            existingItem.quantity + 1,
            product.stock,
          );
          if (newQuantity === existingItem.quantity) {
            // Already at max stock
            return prevCart;
          }

          return prevCart.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: newQuantity,
                  subtotal: newQuantity * product.price,
                }
              : item,
          );
        } else {
          // Add new item
          return [
            ...prevCart,
            {
              product,
              quantity: 1,
              subtotal: product.price,
            },
          ];
        }
      });
    } catch (error) {
      console.error("Error adding product to cart:", error);
    }
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const maxQuantity = item.product.stock;
          const quantity = Math.min(newQuantity, maxQuantity);
          return {
            ...item,
            quantity,
            subtotal: quantity * item.product.price,
          };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId),
    );
  };

  const clearCart = () => {
    try {
      setCart([]);
      setSaleForm({
        items: [],
        totalAmount: 0,
        paymentMethod: "cash",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Force reset even if there's an error
      window.location.reload();
    }
  };

  // Validate cart integrity
  const validateCart = () => {
    try {
      const validItems = cart.filter(
        (item) =>
          item &&
          item.product &&
          item.product.id &&
          typeof item.quantity === "number" &&
          item.quantity > 0 &&
          typeof item.subtotal === "number" &&
          item.subtotal >= 0,
      );

      if (validItems.length !== cart.length) {
        console.warn("Cart contains invalid items, cleaning up...");
        setCart(validItems);
      }
    } catch (error) {
      console.error("Error validating cart:", error);
      setCart([]);
    }
  };

  // Validate cart on changes
  useEffect(() => {
    if (cart.length > 0) {
      validateCart();
    }
  }, [cart.length]);

  const processSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create sale record
      const newSale: Sale = {
        id: Date.now().toString(),
        items: cart.map(
          (item, index): SaleItem => ({
            id: `${Date.now()}-${index}`,
            saleId: Date.now().toString(),
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.product.price,
            totalPrice: item.subtotal,
            product: item.product,
          }),
        ),
        totalAmount: saleForm.totalAmount,
        customerId: saleForm.customerId,
        sellerId: user?.id || "1", // Current authenticated user
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create payment record
      const payment: Payment = {
        id: (Date.now() + 1).toString(),
        saleId: newSale.id,
        amount: saleForm.totalAmount,
        method: saleForm.paymentMethod,
        status: "completed",
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newSale.payment = payment;
      setCompletedSale(newSale);

      // Clear cart and close dialogs
      clearCart();
      setIsConfirmDialogOpen(false);
      setIsCompleteDialogOpen(true);
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Error al procesar la venta. Inténtalo de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: "Efectivo",
      yape: "Yape",
      plin: "Plin",
      transfer: "Transferencia",
      card: "Tarjeta",
    };
    return labels[method as keyof typeof labels] || method;
  };

  // Prevent rendering if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <Layout title="Punto de Venta" subtitle="Venta de productos y medicamentos">
      <div className="h-full flex gap-6 p-6">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Search and Filters */}
          <Card className="card-modern">
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
                    {categories
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

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
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
                    <p className="text-destructive font-medium">
                      Error al cargar
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {productError}
                    </p>
                  </div>
                  <Button onClick={loadData} variant="outline" size="sm">
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-muted-foreground font-medium">
                      No hay productos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      No se encontraron productos disponibles
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="card-modern hover:shadow-lg transition-all duration-200"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Stock: {product.stock}
                          </Badge>
                        </div>

                        <div
                          className="cursor-pointer"
                          onClick={() => addToCart(product)}
                        >
                          <h3 className="font-semibold text-sm leading-tight hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {product.category?.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {product.sku}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            S/ {product.price.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0 hover:scale-110 transition-transform"
                            onClick={(e) => addToCart(product, e)}
                            disabled={product.stock <= 0}
                            title={
                              product.stock <= 0
                                ? "Sin stock"
                                : "Agregar al carrito"
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 flex flex-col space-y-4">
          {/* Cart Header */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Carrito ({cart.length})
                </span>
                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            <Card className="card-modern h-full">
              <CardContent className="p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay productos en el carrito
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Haz clic en los productos para agregarlos
                    </p>
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
                        <h4 className="font-medium text-sm truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          S/ {item.product.price.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            updateCartItemQuantity(
                              item.product.id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>

                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            updateCartItemQuantity(
                              item.product.id,
                              item.quantity + 1,
                            )
                          }
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          S/ {item.subtotal.toFixed(2)}
                        </p>
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
          </div>

          {/* Checkout */}
          {cart.length > 0 && (
            <Card className="card-modern">
              <CardContent className="p-4 space-y-4">
                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label htmlFor="customer">Cliente (Opcional)</Label>
                  <Select
                    value={saleForm.customerId || "no-customer"}
                    onValueChange={(value) =>
                      setSaleForm({
                        ...saleForm,
                        customerId: value === "no-customer" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-customer">Sin cliente</SelectItem>
                      {patients
                        .filter(
                          (patient: any) =>
                            patient && patient.id && patient.firstName,
                        )
                        .map((patient: any) => (
                          <SelectItem
                            key={patient.id}
                            value={patient.id.toString()}
                          >
                            {patient.firstName} {patient.lastName || ""}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Método de Pago</Label>
                  <Select
                    value={saleForm.paymentMethod}
                    onValueChange={(value: any) =>
                      setSaleForm({ ...saleForm, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="yape">Yape</SelectItem>
                      <SelectItem value="plin">Plin</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">
                      S/ {saleForm.totalAmount.toFixed(2)}
                    </span>
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

        {/* Confirm Sale Dialog */}
        <Dialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Confirmar Venta
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Resumen de la Venta</h3>
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {item.product.name} x{item.quantity}
                    </span>
                    <span>S/ {item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>
                    {saleForm.customerId
                      ? patients.find((p: any) => p.id === saleForm.customerId)
                          ?.firstName +
                        " " +
                        patients.find((p: any) => p.id === saleForm.customerId)
                          ?.lastName
                      : "Venta general"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Método de pago:</span>
                  <span>{getPaymentMethodLabel(saleForm.paymentMethod)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    S/ {saleForm.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={processSale}
                disabled={isProcessing}
                className="btn-primary flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirmar Venta
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sale Complete Dialog */}
        <Dialog
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <Check className="w-5 h-5" />
                Venta Completada
              </DialogTitle>
            </DialogHeader>

            {completedSale && (
              <div className="space-y-4 py-4 text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-success" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    S/ {completedSale.totalAmount.toFixed(2)}
                  </h3>
                  <p className="text-muted-foreground">
                    Venta #{completedSale.id}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Método de pago:</span>
                    <span>
                      {getPaymentMethodLabel(
                        completedSale.payment?.method || "",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>
                      {new Date(completedSale.createdAt).toLocaleString(
                        "es-ES",
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setIsCompleteDialogOpen(false);
                  setCompletedSale(null);
                }}
                className="btn-primary"
              >
                Nueva Venta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Sales;
