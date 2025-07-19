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
  History,
  Filter,
  Calendar,
  Eye,
  TrendingUp,
  BarChart3,
  Clock,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Product,
  ProductCategory,
  Sale,
  ApiResponse,
  PaginatedResponse,
  PaginatedSearchParams,
} from "@shared/api";
import { apiGet, apiPost } from "@/lib/auth";
import {
  getMockPatients,
  getWorkerSales,
  getAllSalesWithDetails,
  getWorkerSalesStats,
} from "@/lib/mockData";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface SaleForm {
  customerId?: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: "efectivo" | "yape" | "transferencia" | "pos";
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

  // Active tab state
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");

  // POS-related state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    items: [],
    totalAmount: 0,
    paymentMethod: "efectivo",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  // Pagination for products
  const productPagination = useRepositoryPagination<Product>({
    initialPageSize: 10,
  });

  // Sales History state
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isViewSaleDialogOpen, setIsViewSaleDialogOpen] = useState(false);

  // Repository-based pagination for sales history
  const salesPagination = useRepositoryPagination<Sale>({
    initialPageSize: 15,
  });

  // Load data on component mount
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadData();
    loadSalesData();
  }, [user, navigate]);

  // Reload products when filters or pagination change
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [
    user,
    searchTerm,
    selectedCategory,
    productPagination.currentPage,
    productPagination.pageSize,
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    productPagination.goToPage(1);
  }, [searchTerm, selectedCategory]);

  // Update sale form when cart changes (POS mode)
  useEffect(() => {
    try {
      const totalAmount = cart.reduce((sum, item) => {
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
        totalAmount: Math.max(0, totalAmount),
      }));
    } catch (error) {
      console.error("Error updating sale form:", error);
      setSaleForm((prev) => ({
        ...prev,
        items: [],
        totalAmount: 0,
      }));
    }
  }, [cart]);

  // Filter sales based on search and filters
  useEffect(() => {
    let filtered = sales;

    // Text search
    if (salesSearchTerm) {
      filtered = filtered.filter((sale) => {
        const customer = sale.customer;
        const customerName = customer
          ? `${customer.firstName} ${customer.lastName}`
          : "Venta general";
        const products = sale.items
          .map((item) => item.product?.name || "")
          .join(" ");
        const saleId = sale.id;

        return (
          customerName.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
          products.toLowerCase().includes(salesSearchTerm.toLowerCase()) ||
          saleId.toLowerCase().includes(salesSearchTerm.toLowerCase())
        );
      });
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((sale) =>
        sale.createdAt.startsWith(dateFilter),
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(
        (sale) => sale.payment?.method === paymentMethodFilter,
      );
    }

    setFilteredSales(filtered);
    // Reset pagination when filters change
    // salesPagination.resetPagination();
  }, [
    sales,
    salesSearchTerm,
    dateFilter,
    paymentMethodFilter,
    salesPagination,
  ]);

  const loadData = async () => {
    setIsLoadingProducts(true);
    setProductError(null);

    try {
      await productPagination.loadData(async (params: PaginatedSearchParams) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", String(params.page));
        if (params.limit) searchParams.append("limit", String(params.limit));
        if (searchTerm) searchParams.append("search", searchTerm);
        if (selectedCategory !== "all")
          searchParams.append("categoryId", selectedCategory);

        const resp = await apiGet<ApiResponse<{
          data: Product[];
          total: number;
          page: number;
          limit: number;
        }>>(`/product?${searchParams.toString()}`);

        if (resp.error || !resp.data) {
          throw new Error(resp.error || "Failed to fetch products");
        }

        const { data, total, page, limit } = resp.data.data;
        return {
          items: data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        } as PaginatedResponse<Product>;
      });

      setProducts(productPagination.data);

      // Load categories from API
      const categoryResp = await apiGet<ApiResponse<{
        data: ProductCategory[];
        total: number;
        page: number;
        limit: number;
      }>>("/product-category?page=1&limit=100");

      if (categoryResp.error || !categoryResp.data) {
        throw new Error(categoryResp.error || "Failed to fetch categories");
      }

      setCategories(categoryResp.data.data);

      // Patients are still loaded from mock data
      const mockPatients = getMockPatients();
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

  const loadSalesData = async () => {
    setIsLoadingSales(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Load sales based on user role
      let salesData: Sale[] = [];
      if (user?.role === "admin") {
        salesData = getAllSalesWithDetails();
      } else {
        // Worker only sees their own sales
        salesData = getWorkerSales(user?.id || "");
      }

      setSales(salesData);
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const filteredProducts = products;

  // POS Functions
  const addToCart = (product: Product, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

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
          const newQuantity = Math.min(
            existingItem.quantity + 1,
            product.stock,
          );
          if (newQuantity === existingItem.quantity) {
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
        paymentMethod: "efectivo",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      window.location.reload();
    }
  };

  const processSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const resp = await apiPost<ApiResponse<Sale>>("/sale", {
        customerId: saleForm.customerId,
        saleItems: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        paymentMethod: saleForm.paymentMethod,
        note: saleForm.notes || "",
      });

      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Error al procesar la venta");
      }

      setCompletedSale(resp.data.data);

      clearCart();
      setIsConfirmDialogOpen(false);
      setIsCompleteDialogOpen(true);

      // Refresh sales data
      loadSalesData();
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("Error al procesar la venta. Inténtalo de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Sales History Functions
  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewSaleDialogOpen(true);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      efectivo: "Efectivo",
      yape: "Yape",
      transferencia: "Transferencia",
      pos: "POS",
    };
    return labels[method as keyof typeof labels] || method;
  };

  // Get sales statistics for current user
  const salesStats = user ? getWorkerSalesStats(user.id) : null;

  if (!user) {
    return null;
  }

  return (
    <Layout title="Ventas" subtitle="Punto de venta y historial de ventas">
      <div className="h-full flex flex-col p-6">
        {/* Header with Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "pos" | "history")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger
                value="pos"
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Punto de Venta
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <History className="w-4 h-4" />
                Mis Ventas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Sales Statistics (shown in both modes) */}
        {salesStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ventas Totales
                    </p>
                    <p className="font-semibold">{salesStats.total}</p>
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
                    <p className="text-sm text-muted-foreground">
                      Total Vendido
                    </p>
                    <p className="font-semibold">
                      S/ {salesStats.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hoy</p>
                    <p className="font-semibold">{salesStats.today} ventas</p>
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
                    <p className="text-sm text-muted-foreground">Este Mes</p>
                    <p className="font-semibold">
                      S/ {salesStats.thisMonthAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "pos" ? (
          // POS Mode
          <div className="flex-1 flex gap-6">
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
                        <SelectItem value="all">
                          Todas las categorías
                        </SelectItem>
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

              {/* Products Grid */}
              <div className="flex-1 overflow-y-auto">
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-4">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="text-muted-foreground">
                        Cargando productos...
                      </p>
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
                            customerId:
                              value === "no-customer" ? undefined : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-customer">
                            Sin cliente
                          </SelectItem>
                          {Array.isArray(patients) &&
                            patients
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
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="yape">Yape</SelectItem>
                          <SelectItem value="transferencia">
                            Transferencia
                          </SelectItem>
                          <SelectItem value="pos">POS</SelectItem>
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
          </div>
        ) : (
          // Sales History Mode
          <div className="flex-1 flex flex-col space-y-4">
            {/* Filters */}
            <Card className="card-modern">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente, producto..."
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    placeholder="Filtrar por fecha"
                  />

                  <Select
                    value={paymentMethodFilter}
                    onValueChange={setPaymentMethodFilter}
                  >
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

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSalesSearchTerm("");
                      setDateFilter("");
                      setPaymentMethodFilter("all");
                    }}
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sales Table */}
            <Card className="card-modern flex-1">
              <CardHeader>
                <CardTitle>
                  Historial de Ventas ({salesPagination.totalItems})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSales ? (
                  <div className="space-y-4">
                    {Array.from({ length: salesPagination.pageSize }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="loading-shimmer h-16 rounded"
                        ></div>
                      ),
                    )}
                  </div>
                ) : salesPagination.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No hay ventas
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {salesSearchTerm ||
                      dateFilter ||
                      paymentMethodFilter !== "all"
                        ? "No se encontraron ventas con los filtros aplicados"
                        : "No tienes ventas registradas"}
                    </p>
                    <Button
                      onClick={() => setActiveTab("pos")}
                      className="btn-primary"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Realizar Primera Venta
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Productos</TableHead>
                            <TableHead>Método de Pago</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesPagination.data.map((sale) => {
                            const { date, time } = formatDateTime(
                              sale.createdAt,
                            );
                            const customer = sale.customer;
                            const customerName = customer
                              ? `${customer.firstName} ${customer.lastName}`
                              : "Venta general";

                            return (
                              <TableRow key={sale.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{date}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {time}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                      <User className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        {customerName}
                                      </p>
                                      {customer && (
                                        <p className="text-sm text-muted-foreground">
                                          {customer.documentId}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">
                                      {sale.items.length} producto
                                      {sale.items.length !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {sale.items
                                        .slice(0, 2)
                                        .map((item) => item.product?.name)
                                        .join(", ")}
                                      {sale.items.length > 2 && "..."}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {getPaymentMethodLabel(
                                      sale.payment?.method || "",
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-lg text-primary">
                                    S/ {sale.totalAmount.toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    onClick={() => viewSaleDetails(sale)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <Pagination
                      currentPage={salesPagination.currentPage}
                      totalPages={salesPagination.totalPages}
                      totalItems={salesPagination.totalItems}
                      pageSize={salesPagination.pageSize}
                      onPageChange={salesPagination.goToPage}
                      onPageSizeChange={salesPagination.setPageSize}
                      showPageSizeSelector={true}
                      pageSizeOptions={[10, 15, 25, 50]}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

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
                    {saleForm.customerId && Array.isArray(patients)
                      ? (() => {
                          const customer = patients.find(
                            (p: any) => p && p.id === saleForm.customerId,
                          );
                          return customer
                            ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim()
                            : "Cliente no encontrado";
                        })()
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

            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setIsCompleteDialogOpen(false);
                  setCompletedSale(null);
                  setActiveTab("history");
                }}
                variant="outline"
              >
                Ver Ventas
              </Button>
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

        {/* View Sale Details Dialog */}
        <Dialog
          open={isViewSaleDialogOpen}
          onOpenChange={setIsViewSaleDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles de la Venta #{selectedSale?.id}
              </DialogTitle>
            </DialogHeader>

            {selectedSale && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Información de la Venta
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Fecha y Hora
                        </Label>
                        <p className="font-medium">
                          {new Date(selectedSale.createdAt).toLocaleString(
                            "es-ES",
                          )}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Método de Pago
                        </Label>
                        <Badge variant="outline" className="mt-1">
                          {getPaymentMethodLabel(
                            selectedSale.payment?.method || "",
                          )}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Total
                        </Label>
                        <p className="font-bold text-xl text-primary">
                          S/ {selectedSale.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      Cliente
                    </h3>
                    <div className="space-y-3">
                      {selectedSale.customer ? (
                        <>
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              Nombre
                            </Label>
                            <p className="font-medium">
                              {selectedSale.customer.firstName}{" "}
                              {selectedSale.customer.lastName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              DNI
                            </Label>
                            <p className="font-medium">
                              {selectedSale.customer.documentId}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              Teléfono
                            </Label>
                            <p className="font-medium">
                              {selectedSale.customer.phone}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          Venta general (sin cliente)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">
                    Productos Vendidos
                  </h3>
                  <div className="space-y-3">
                    {selectedSale.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              S/ {item.unitPrice.toFixed(2)} c/u
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity} x S/ {item.unitPrice.toFixed(2)}
                          </p>
                          <p className="font-bold text-primary">
                            S/ {item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setIsViewSaleDialogOpen(false);
                  setSelectedSale(null);
                }}
                className="btn-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Sales;
