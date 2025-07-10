import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  Edit,
  Trash2,
  BarChart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Tag,
  FileText,
  AlertTriangle,
  Activity,
  ShoppingCart,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Product, ProductMovement } from "@shared/api";
import {
  getAllMockProducts,
  getMockProductCategories,
  mockProductMovements,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

interface ProductStats {
  totalSold: number;
  revenueGenerated: number;
  lastMovementDate: string;
  averageMonthlySales: number;
  stockTurnover: number;
  profitMargin: number;
}

// Mock sales data for demonstration
const mockMonthlySales = [
  { month: "Ene", sales: 25, revenue: 1250 },
  { month: "Feb", sales: 32, revenue: 1600 },
  { month: "Mar", sales: 18, revenue: 900 },
  { month: "Abr", sales: 45, revenue: 2250 },
  { month: "May", sales: 38, revenue: 1900 },
  { month: "Jun", sales: 42, revenue: 2100 },
];

export function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProductData(id);
    }
  }, [id]);

  const loadProductData = async (productId: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Load product data
      const products = getAllMockProducts();
      const foundProduct = products.find((p) => p.id === productId);

      if (!foundProduct) {
        navigate("/products");
        return;
      }

      // Load related data
      const categoriesData = getMockProductCategories();
      const movementsData = mockProductMovements.filter(
        (m) => m.productId === productId,
      );

      // Calculate statistics
      const totalSold = movementsData
        .filter((m) => m.type === "exit")
        .reduce((sum, m) => sum + m.quantity, 0);

      const revenueGenerated = totalSold * foundProduct.price;

      const lastMovement = movementsData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

      const productStats: ProductStats = {
        totalSold,
        revenueGenerated,
        lastMovementDate: lastMovement?.createdAt || foundProduct.createdAt,
        averageMonthlySales: Math.round(totalSold / 6), // Assuming 6 months of data
        stockTurnover: totalSold / foundProduct.stock || 0,
        profitMargin: 25, // Mock profit margin
      };

      setProduct(foundProduct);
      setCategories(categoriesData);
      setMovements(movementsData);
      setStats(productStats);
    } catch (error) {
      console.error("Error loading product data:", error);
      navigate("/products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to edit mode or open edit dialog
    console.log("Edit product:", product?.id);
    alert(
      "Funcionalidad de edición disponible en la página principal de productos",
    );
  };

  const handleDelete = () => {
    if (!product) return;

    if (
      confirm(
        `¿Estás seguro de que quieres eliminar el producto "${product.name}"?`,
      )
    ) {
      console.log("Delete product:", product.id);
      navigate("/products");
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "entry":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "exit":
        return <Minus className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "entry":
        return "text-green-600";
      case "exit":
        return "text-red-600";
      default:
        return "text-blue-600";
    }
  };

  const getStockStatus = () => {
    if (!product)
      return { status: "normal", color: "text-green-600", text: "Normal" };

    if (product.stock === 0) {
      return { status: "out", color: "text-red-600", text: "Agotado" };
    } else if (product.stock <= 10) {
      return { status: "low", color: "text-yellow-600", text: "Stock Bajo" };
    } else {
      return { status: "normal", color: "text-green-600", text: "Normal" };
    }
  };

  if (isLoading) {
    return (
      <Layout
        title="Detalle del Producto"
        subtitle="Información completa del producto"
      >
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

  if (!product || !stats) {
    return (
      <Layout
        title="Producto no encontrado"
        subtitle="El producto solicitado no existe"
      >
        <div className="p-6">
          <Card className="card-modern">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Producto no encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                El producto que buscas no existe o ha sido eliminado.
              </p>
              <Button onClick={() => navigate("/products")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Productos
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <Layout title={product.name} subtitle="Información detallada del producto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Productos
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Product Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Info */}
          <div className="lg:col-span-2">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" />
                  {product.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">SKU</Label>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Categoría
                    </Label>
                    <p className="font-medium">
                      {product.category?.name || "Sin categoría"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Precio
                    </Label>
                    <p className="font-medium text-primary">
                      S/ {product.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Stock Actual
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium", stockStatus.color)}>
                        {product.stock} unidades
                      </p>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", stockStatus.color)}
                      >
                        {stockStatus.text}
                      </Badge>
                    </div>
                  </div>
                  {product.bonusAmount && (
                    <div>
                      <Label className="text-sm text-muted-foreground">
                        Comisión por Venta
                      </Label>
                      <p className="font-medium text-green-600">
                        S/ {product.bonusAmount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Estado
                    </Label>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                {product.description && (
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Descripción
                    </Label>
                    <p className="text-sm">{product.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Creado
                    </Label>
                    <p>{new Date(product.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Última actualización
                    </Label>
                    <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Vendido
                    </p>
                    <p className="text-2xl font-bold">{stats.totalSold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Ingresos Generados
                    </p>
                    <p className="text-2xl font-bold">
                      S/ {stats.revenueGenerated.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue/10 rounded-lg">
                    <BarChart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Promedio Mensual
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.averageMonthlySales}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-modern">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Rotación de Stock
                    </p>
                    <p className="text-2xl font-bold">
                      {stats.stockTurnover.toFixed(1)}x
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="movements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="movements">Movimientos de Stock</TabsTrigger>
            <TabsTrigger value="sales">Ventas Mensuales</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          </TabsList>

          {/* Stock Movements */}
          <TabsContent value="movements" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Historial de Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {movements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">
                      No hay movimientos registrados
                    </p>
                    <p className="text-sm">
                      Los movimientos de stock aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Stock Anterior</TableHead>
                          <TableHead>Stock Nuevo</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Referencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime(),
                          )
                          .map((movement) => (
                            <TableRow key={movement.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getMovementIcon(movement.type)}
                                  <span
                                    className={cn(
                                      "font-medium capitalize",
                                      getMovementColor(movement.type),
                                    )}
                                  >
                                    {movement.type === "entry"
                                      ? "Entrada"
                                      : "Salida"}
                                  </span>
                                </div>
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
                              <TableCell>{movement.reason}</TableCell>
                              <TableCell>{movement.previousStock}</TableCell>
                              <TableCell>{movement.newStock}</TableCell>
                              <TableCell>
                                {new Date(
                                  movement.createdAt,
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {movement.reference || "N/A"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Sales */}
          <TabsContent value="sales" className="space-y-4">
            <Card className="card-modern">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Ventas por Mes (Últimos 6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMonthlySales.map((month, index) => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {month.month}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {month.sales} unidades vendidas
                          </p>
                          <p className="text-sm text-muted-foreground">
                            S/ {month.revenue.toFixed(2)} en ingresos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {index > 0 && (
                          <div className="flex items-center gap-1">
                            {month.sales > mockMonthlySales[index - 1].sales ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            )}
                            <span
                              className={cn(
                                "text-xs font-medium",
                                month.sales > mockMonthlySales[index - 1].sales
                                  ? "text-green-600"
                                  : "text-red-600",
                              )}
                            >
                              {(
                                ((month.sales -
                                  mockMonthlySales[index - 1].sales) /
                                  mockMonthlySales[index - 1].sales) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Métricas de Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Margen de Ganancia
                    </span>
                    <span className="font-semibold">{stats.profitMargin}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Última Venta
                    </span>
                    <span className="font-semibold">
                      {new Date(stats.lastMovementDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Días en Inventario
                    </span>
                    <span className="font-semibold">
                      {Math.round(365 / (stats.stockTurnover || 1))} días
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Valor del Inventario
                    </span>
                    <span className="font-semibold">
                      S/ {(product.stock * product.price).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-modern">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas y Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.stock <= 10 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Stock Bajo
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Considera reabastecer este producto pronto.
                      </p>
                    </div>
                  )}

                  {stats.stockTurnover > 3 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Alta Rotación
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Producto con excelente desempeño de ventas.
                      </p>
                    </div>
                  )}

                  {stats.stockTurnover < 1 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">
                          Baja Rotación
                        </span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        Considera estrategias para aumentar las ventas.
                      </p>
                    </div>
                  )}

                  {stats.revenueGenerated > 5000 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Alto Rendimiento
                        </span>
                      </div>
                      <p className="text-xs text-blue-700 mt-1">
                        Producto estrella en generación de ingresos.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("text-sm font-medium", className)}>{children}</div>;
}

export default ProductDetail;
