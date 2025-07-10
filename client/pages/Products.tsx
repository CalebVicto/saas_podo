import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Eye,
  Trash2,
  AlertTriangle,
  Tag,
  DollarSign,
  BarChart,
  Save,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  HelpCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Product, ProductCategory, ProductMovement } from "@shared/api";
import {
  getAllMockProducts,
  getMockProductCategories,
  mockProductMovements,
} from "@/lib/mockData";
import Layout from "@/components/Layout";

interface CreateProductRequest {
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  bonusAmount?: number;
  stock: number;
  sku: string;
  isActive: boolean;
}

interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isViewProductDialogOpen, setIsViewProductDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for new/edit product
  const [productFormData, setProductFormData] = useState<CreateProductRequest>({
    name: "",
    description: "",
    categoryId: "",
    price: 0,
    bonusAmount: 0,
    stock: 0,
    sku: "",
    isActive: true,
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category?.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (product) => product.categoryId === categoryFilter,
      );
    }

    // Stock filter
    if (stockFilter !== "all") {
      if (stockFilter === "low") {
        filtered = filtered.filter((product) => product.stock <= 5);
      } else if (stockFilter === "out") {
        filtered = filtered.filter((product) => product.stock === 0);
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockProducts = getAllMockProducts();
      const mockCategories = getMockProductCategories();
      setProducts(mockProducts);
      setCategories(mockCategories);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const category = categories.find(
        (c) => c.id === productFormData.categoryId,
      );
      const newProduct: Product = {
        id: Date.now().toString(),
        ...productFormData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category,
      };

      setProducts([...products, newProduct]);
      setIsAddProductDialogOpen(false);
      resetProductForm();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const category = categories.find(
        (c) => c.id === productFormData.categoryId,
      );
      const updatedProduct: Product = {
        ...selectedProduct,
        ...productFormData,
        updatedAt: new Date().toISOString(),
        category,
      };

      setProducts(
        products.map((p) => (p.id === selectedProduct.id ? updatedProduct : p)),
      );
      setIsEditProductDialogOpen(false);
      setSelectedProduct(null);
      resetProductForm();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?"))
      return;

    try {
      setProducts(products.filter((p) => p.id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleAddCategory = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newCategory: ProductCategory = {
        id: Date.now().toString(),
        ...categoryFormData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCategories([...categories, newCategory]);
      setIsAddCategoryDialogOpen(false);
      resetCategoryForm();
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedCategory: ProductCategory = {
        ...selectedCategory,
        ...categoryFormData,
        updatedAt: new Date().toISOString(),
      };

      setCategories(
        categories.map((c) =>
          c.id === selectedCategory.id ? updatedCategory : c,
        ),
      );
      setIsEditCategoryDialogOpen(false);
      setSelectedCategory(null);
      resetCategoryForm();
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      description: "",
      categoryId: "",
      price: 0,
      bonusAmount: 0,
      stock: 0, // Stock will always start at 0, managed through Kardex
      sku: "",
      isActive: true,
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
    });
  };

  const openEditProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId,
      price: product.price,
      bonusAmount: product.bonusAmount || 0,
      stock: product.stock, // Keep original stock, not editable
      sku: product.sku,
      isActive: product.isActive,
    });
    setIsEditProductDialogOpen(true);
  };

  const openViewProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsViewProductDialogOpen(true);
  };

  const getProductMovements = (productId: string): ProductMovement[] => {
    return mockProductMovements
      .filter((movement) => movement.productId === productId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  };

  const openEditCategoryDialog = (category: ProductCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsEditCategoryDialogOpen(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Sin stock", className: "status-error" };
    if (stock <= 5) return { label: "Stock bajo", className: "status-warning" };
    return { label: "En stock", className: "status-success" };
  };

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const lowStockProducts = products.filter((p) => p.stock <= 5).length;
  const outOfStockProducts = products.filter((p) => p.stock === 0).length;
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.price * p.stock,
    0,
  );

  return (
    <Layout
      title="Gestión de Productos"
      subtitle="Administra el inventario de medicamentos y suministros"
    >
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => setIsAddProductDialogOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-semibold">{totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <BarChart className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="font-semibold">{activeProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="font-semibold">{lowStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <X className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sin Stock</p>
                  <p className="font-semibold">{outOfStockProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-modern">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">
                    S/ {totalInventoryValue.toFixed(0)}
                  </p>
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
                  placeholder="Buscar producto o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="out">Sin stock</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                  setStockFilter("all");
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>
              Productos ({filteredProducts.length}
              {filteredProducts.length !== products.length &&
                ` de ${products.length}`}
              )
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-16 rounded"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No hay productos
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ||
                  categoryFilter !== "all" ||
                  stockFilter !== "all"
                    ? "No se encontraron productos con los filtros aplicados"
                    : "No hay productos registrados"}
                </p>
                <Button
                  onClick={() => setIsAddProductDialogOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock);

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-sm text-muted-foreground">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {product.sku}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {product.category?.name || "Sin categoría"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              S/ {product.price.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "font-medium",
                                product.stock <= 5 && product.stock > 0
                                  ? "text-warning"
                                  : product.stock === 0
                                    ? "text-destructive"
                                    : "text-foreground",
                              )}
                            >
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={stockStatus.className}
                            >
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() =>
                                  navigate(`/products/${product.id}`)
                                }
                                variant="outline"
                                size="sm"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => openEditProductDialog(product)}
                                variant="outline"
                                size="sm"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteProduct(product.id)}
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Product Dialog */}
        <Dialog
          open={isAddProductDialogOpen}
          onOpenChange={setIsAddProductDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Nuevo Producto
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={productFormData.name}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        name: e.target.value,
                      })
                    }
                    placeholder="Crema Hidratante"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={productFormData.sku}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        sku: e.target.value,
                      })
                    }
                    placeholder="CHP001"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descripción del producto..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoría *</Label>
                  <Select
                    value={productFormData.categoryId}
                    onValueChange={(value) =>
                      setProductFormData({
                        ...productFormData,
                        categoryId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="25.50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bonusAmount">Bono por Medicamento</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Este bono se aplica cuando el paciente compra este
                          medicamento por primera vez.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="bonusAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.bonusAmount}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      bonusAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="5.00"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> El stock inicial se establecerá a 0.
                  Usa el módulo Kardex para agregar inventario.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProductDialogOpen(false);
                  resetProductForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddProduct}
                className="btn-primary"
                disabled={
                  !productFormData.name ||
                  !productFormData.sku ||
                  !productFormData.categoryId ||
                  productFormData.price <= 0
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Producto
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Product Dialog */}
        <Dialog
          open={isEditProductDialogOpen}
          onOpenChange={setIsEditProductDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Producto
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Nombre *</Label>
                  <Input
                    id="editName"
                    value={productFormData.name}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editSku">SKU *</Label>
                  <Input
                    id="editSku"
                    value={productFormData.sku}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        sku: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editDescription">Descripción</Label>
                <Textarea
                  id="editDescription"
                  value={productFormData.description}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCategoryId">Categoría *</Label>
                  <Select
                    value={productFormData.categoryId}
                    onValueChange={(value) =>
                      setProductFormData({
                        ...productFormData,
                        categoryId: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Precio *</Label>
                  <Input
                    id="editPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="editBonusAmount">Bono por Medicamento</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Este bono se aplica cuando el paciente compra este
                          medicamento por primera vez.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="editBonusAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.bonusAmount}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      bonusAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="5.00"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Stock actual:</strong> {selectedProduct?.stock || 0}{" "}
                  unidades
                  <br />
                  <strong>Nota:</strong> El stock solo se puede modificar
                  através del módulo Kardex.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditProductDialogOpen(false);
                  setSelectedProduct(null);
                  resetProductForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditProduct}
                className="btn-primary"
                disabled={
                  !productFormData.name ||
                  !productFormData.sku ||
                  !productFormData.categoryId ||
                  productFormData.price <= 0
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Product Dialog */}
        <Dialog
          open={isViewProductDialogOpen}
          onOpenChange={setIsViewProductDialogOpen}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Detalles del Producto
              </DialogTitle>
            </DialogHeader>

            {selectedProduct && (
              <div className="py-4">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-muted-foreground">
                    SKU: {selectedProduct.sku}
                  </p>
                </div>

                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">
                      Información General
                    </TabsTrigger>
                    <TabsTrigger value="movements">
                      Movimientos (Kardex)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Categoría
                        </Label>
                        <p className="font-medium">
                          {selectedProduct.category?.name || "Sin categoría"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Precio
                        </Label>
                        <p className="font-medium text-lg">
                          S/ {selectedProduct.price.toFixed(2)}
                        </p>
                      </div>
                      {selectedProduct.bonusAmount &&
                        selectedProduct.bonusAmount > 0 && (
                          <div>
                            <Label className="text-muted-foreground text-sm">
                              Bono por Primera Compra
                            </Label>
                            <p className="font-medium text-lg text-green-600">
                              S/ {selectedProduct.bonusAmount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Stock Actual
                        </Label>
                        <p
                          className={cn(
                            "font-medium text-lg",
                            selectedProduct.stock <= 5 &&
                              selectedProduct.stock > 0
                              ? "text-warning"
                              : selectedProduct.stock === 0
                                ? "text-destructive"
                                : "text-foreground",
                          )}
                        >
                          {selectedProduct.stock}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Estado
                        </Label>
                        <Badge
                          variant="outline"
                          className={
                            getStockStatus(selectedProduct.stock).className
                          }
                        >
                          {getStockStatus(selectedProduct.stock).label}
                        </Badge>
                      </div>
                    </div>

                    {selectedProduct.description && (
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Descripción
                        </Label>
                        <div className="bg-muted/30 p-4 rounded-lg mt-2">
                          <p className="text-sm">
                            {selectedProduct.description}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Creado
                        </Label>
                        <p>
                          {new Date(
                            selectedProduct.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Actualizado
                        </Label>
                        <p>
                          {new Date(
                            selectedProduct.updatedAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="movements" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-primary" />
                        Historial de Movimientos
                      </h4>
                    </div>

                    {(() => {
                      const movements = getProductMovements(selectedProduct.id);

                      if (movements.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>
                              No hay movimientos registrados para este producto
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {movements.map((movement) => (
                            <div
                              key={movement.id}
                              className="border rounded-lg p-4 bg-card"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {movement.type === "entry" ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                  )}
                                  <span
                                    className={cn(
                                      "font-medium text-sm",
                                      movement.type === "entry"
                                        ? "text-green-600"
                                        : "text-red-600",
                                    )}
                                  >
                                    {movement.type === "entry"
                                      ? "ENTRADA"
                                      : "SALIDA"}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {movement.quantity} unidades
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {new Date(
                                    movement.createdAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    Stock Anterior:
                                  </span>
                                  <span className="ml-1 font-medium">
                                    {movement.previousStock}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Stock Nuevo:
                                  </span>
                                  <span className="ml-1 font-medium">
                                    {movement.newStock}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Motivo:
                                  </span>
                                  <span className="ml-1 font-medium">
                                    {movement.reason}
                                  </span>
                                </div>
                              </div>

                              {movement.reference && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Referencia: {movement.reference}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedProduct) {
                    openEditProductDialog(selectedProduct);
                    setIsViewProductDialogOpen(false);
                  }
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                onClick={() => {
                  setIsViewProductDialogOpen(false);
                  setSelectedProduct(null);
                }}
                className="btn-primary"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog
          open={isAddCategoryDialogOpen}
          onOpenChange={setIsAddCategoryDialogOpen}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Nueva Categoría
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Nombre *</Label>
                <Input
                  id="categoryName"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Cremas y Lociones"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Descripción</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descripción de la categoría..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddCategoryDialogOpen(false);
                  resetCategoryForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddCategory}
                className="btn-primary"
                disabled={!categoryFormData.name}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Categoría
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog
          open={isEditCategoryDialogOpen}
          onOpenChange={setIsEditCategoryDialogOpen}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Editar Categoría
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Nombre *</Label>
                <Input
                  id="editCategoryName"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editCategoryDescription">Descripción</Label>
                <Textarea
                  id="editCategoryDescription"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditCategoryDialogOpen(false);
                  setSelectedCategory(null);
                  resetCategoryForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditCategory}
                className="btn-primary"
                disabled={!categoryFormData.name}
              >
                <Save className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export default Products;
