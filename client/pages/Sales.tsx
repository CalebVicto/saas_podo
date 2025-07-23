// ---------------------------------------------------------------------------
// Sales page: point of sale (POS) and sales history
// ---------------------------------------------------------------------------

// React & routing
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Icons
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

// UI components
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
import { Pagination } from "@/components/ui/pagination";

import POSTab from "@/components/sales/POSTab";
import SalesHistoryTab from "@/components/sales/SalesHistoryTab";
// Utilities & helpers
import { cn } from "@/lib/utils";
import { apiGet, apiPost } from "@/lib/auth";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { PatientRepository } from "@/lib/api/patient";

// Layout
import Layout from "@/components/Layout";

// Shared types
import {
  Product,
  ProductCategory,
  Patient,
  Sale,
  ApiResponse,
  PaginatedResponse,
  PaginatedSearchParams,
} from "@shared/api";

import { se } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface SalesStats {
  today: number;
  todayAmount: number;
  thisMonth: number;
  thisMonthAmount: number;
}

// Simple localStorage based auth
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

  // -----------------------------------------------------------------------
  // UI state
  // -----------------------------------------------------------------------
  // Active tab state
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");

  // POS-related state
  // Products will be loaded via pagination hook
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const patientRepository = useMemo(() => new PatientRepository(), []);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleForm, setSaleForm] = useState<SaleForm>({
    items: [],
    totalAmount: 0,
    paymentMethod: "efectivo",
    notes: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);

  // -----------------------------------------------------------------------
  // Pagination for products
  const productPagination = useRepositoryPagination<Product>({
    initialPageSize: 10,
  });

  // -----------------------------------------------------------------------
  // Sales History state
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [salesSearchTerm, setSalesSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // Formato yyyy-MM-dd
  });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isViewSaleDialogOpen, setIsViewSaleDialogOpen] = useState(false);

  // Repository-based pagination for sales history
  const salesPagination = useRepositoryPagination<Sale>({
    initialPageSize: 15,
  });

  // -----------------------------------------------------------------------
  // Effects
  // -----------------------------------------------------------------------
  // Redirect to login if no stored user and load sales history
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadSalesData();
    loadSalesStats();
  }, [
    user,
    navigate,
    salesPagination.currentPage,
    salesPagination.pageSize,
    salesSearchTerm,
    dateFilter,
    paymentMethodFilter,
  ]);

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

  // Load patients when the selector modal is open or the search term changes
  useEffect(() => {
    if (!isPatientModalOpen) return;

    const fetchPatients = async () => {
      setIsLoadingPatients(true);
      try {
        const result = await patientRepository.getAll({
          limit: 100,
          page: 1,
          search: patientSearchTerm || undefined,
        });
        setPatientResults(result.items);
      } catch (error) {
        console.error("Error fetching patients:", error);
        setPatientResults([]);
      } finally {
        setIsLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [isPatientModalOpen, patientSearchTerm, patientRepository]);

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

  useEffect(() => {
    if (!user) return;

    if (categories.length === 0) {
      loadCategories(); // solo una vez
    }

    loadData(); // cada vez que cambia searchTerm o paginación
  }, [
    user,
    searchTerm,
    selectedCategory,
    productPagination.currentPage,
    productPagination.pageSize,
  ]);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadCategories = async () => {
    try {
      const categoryResp = await apiGet<
        ApiResponse<{
          data: ProductCategory[];
          total: number;
          page: number;
          limit: number;
        }>
      >("/product-category?page=1&limit=100");

      if (categoryResp.error || !categoryResp.data) {
        throw new Error(categoryResp.error || "Failed to fetch categories");
      }

      setCategories(categoryResp.data.data.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadData = async () => {
    setIsLoadingProducts(true);
    setProductError(null);

    try {
      await productPagination.loadData(
        async (params: PaginatedSearchParams) => {
          const searchParams = new URLSearchParams();
          if (params.page) searchParams.append("page", String(params.page));
          if (params.limit) searchParams.append("limit", String(params.limit));
          if (searchTerm) searchParams.append("search", searchTerm);
          if (selectedCategory !== "all")
            searchParams.append("categoryId", selectedCategory);

          const resp = await apiGet<
            ApiResponse<{
              data: Product[];
              total: number;
              page: number;
              limit: number;
            }>
          >(`/product?${searchParams.toString()}`);

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
        },
      );
    } catch (error) {
      console.error("Error loading data:", error);
      setProductError(
        "Error al cargar los productos. Por favor, recarga la página.",
      );
      setCategories([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadSalesData = async () => {
    setIsLoadingSales(true);
    try {
      await salesPagination.loadData(async (params: PaginatedSearchParams) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", String(params.page));
        if (params.limit) searchParams.append("limit", String(params.limit));
        if (salesSearchTerm) searchParams.append("search", salesSearchTerm);

        if (dateFilter) {
          searchParams.append("startDate", dateFilter);
          searchParams.append("endDate", dateFilter);
        }

        if (paymentMethodFilter !== "all")
          searchParams.append("paymentMethod", paymentMethodFilter);
        // if (user?.id) searchParams.append("userId", user.id);

        const resp = await apiGet<
          ApiResponse<{
            data: Sale[];
            total: number;
            page: number;
            limit: number;
          }>
        >(`/sale?${searchParams.toString()}`);

        if (resp.error || !resp.data) {
          throw new Error(resp.error || "Failed to fetch sales");
        }

        const { data, total, page, limit } = resp.data.data;
        return {
          items: data,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        } as PaginatedResponse<Sale>;
      });
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const loadSalesStats = async () => {
    try {
      const resp = await apiGet<ApiResponse<SalesStats>>("/sale/stats");
      if (resp.data && !resp.error) {
        setSalesStats(resp.data.data);
      }
    } catch (error) {
      console.error("Error fetching sales stats:", error);
    }
  };

  const handleClearFiltersPOS = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    productPagination.goToPage(1);
  };

  const filteredProducts = productPagination.data;

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
        customerId: undefined,
        notes: "",
      });
      setSelectedPatient(null);
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

      console.log("Sale processed successfully:", resp.data.data);
      setCompletedSale(resp.data.data);

      // Refresh data
      await loadData();
      await loadSalesData();
      await loadSalesStats();

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

  // -----------------------------------------------------------------------
  // Sales History Functions
  const viewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewSaleDialogOpen(true);
  };

  // -----------------------------------------------------------------------
  // Helper functions
  // -----------------------------------------------------------------------

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
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <ShoppingCart className="w-4 h-4" />
                Punto de Venta
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-md"
              >
                <History className="w-4 h-4" />
                Mis Ventas
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content based on active tab */}
        {activeTab === "pos" ? (
          <POSTab
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            productPagination={productPagination}
            filteredProducts={filteredProducts}
            isLoadingProducts={isLoadingProducts}
            productError={productError}
            addToCart={addToCart}
            updateCartItemQuantity={updateCartItemQuantity}
            removeFromCart={removeFromCart}
            cart={cart}
            selectedPatient={selectedPatient}
            setSelectedPatient={setSelectedPatient}
            saleForm={saleForm}
            setSaleForm={setSaleForm}
            isPatientModalOpen={isPatientModalOpen}
            setIsPatientModalOpen={setIsPatientModalOpen}
            patientSearchTerm={patientSearchTerm}
            setPatientSearchTerm={setPatientSearchTerm}
            patientResults={patientResults}
            isLoadingPatients={isLoadingPatients}
            handleClearFiltersPOS={handleClearFiltersPOS}
            setIsConfirmDialogOpen={setIsConfirmDialogOpen}
          />
        ) : (
          <SalesHistoryTab
            salesStats={salesStats}
            isLoadingSales={isLoadingSales}
            salesPagination={salesPagination}
            paymentMethodFilter={paymentMethodFilter}
            setPaymentMethodFilter={setPaymentMethodFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            viewSaleDetails={viewSaleDetails}
            formatDateTime={formatDateTime}
            getPaymentMethodLabel={getPaymentMethodLabel}
            setActiveTab={setActiveTab}
            selectedSale={selectedSale}
            isViewSaleDialogOpen={isViewSaleDialogOpen}
            setIsViewSaleDialogOpen={setIsViewSaleDialogOpen}
          />
        )
        }
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
                    {selectedPatient
                      ? `${selectedPatient.firstName} ${selectedPatient.paternalSurname}`
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

        {/* Patient Select Dialog */}
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
                        <p className="text-sm text-muted-foreground">
                          {patient.documentNumber}
                        </p>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsPatientModalOpen(false)}
              >
                Cerrar
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
                {/* <Check className="w-5 h-5" /> */}
                {/* Venta Completada */}
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
                  <p className="text-muted-foreground">Venta Completada</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Método de pago:</span>
                    <span>
                      {getPaymentMethodLabel(completedSale.paymentMethod || "")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>
                      {new Date(completedSale.date).toLocaleString("es-ES", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles de la Venta
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
                          {new Date(selectedSale.date).toLocaleString("es-ES")}
                        </p>
                      </div>
                      <div className="flex flex-col">
                        <Label className="text-muted-foreground text-sm">
                          Método de Pago
                        </Label>
                        <Badge variant="outline" className="mt-1 w-fit">
                          {getPaymentMethodLabel(
                            selectedSale.paymentMethod || "",
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
                    <div className="space-y-4">
                      {selectedSale.patient ? (
                        <>
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              Nombre
                            </Label>
                            <p className="font-medium">
                              {selectedSale.patient.firstName}{" "}
                              {selectedSale.patient.paternalSurname}{" "}
                              {selectedSale.patient.maternalSurname}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              {selectedSale.patient.documentType === "dni"
                                ? "DNI"
                                : "Pasaporte"}
                            </Label>
                            <p className="font-medium">
                              {selectedSale.patient.documentNumber}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              Teléfono
                            </Label>
                            <p className="font-medium">
                              {selectedSale.patient.phone}
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
                  <div className="space-y-3 overflow-y-auto max-h-[300px]">
                    {selectedSale.saleItems.map((item) => (
                      <div
                        key={`${item.product?.id}-${item.quantity}`}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{item.product?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              S/ {item.price.toFixed(2)} c/u
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity} x S/ {item.price.toFixed(2)}
                          </p>
                          <p className="font-bold text-primary">
                            S/ {(item.price * item.quantity).toFixed(2)}
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
