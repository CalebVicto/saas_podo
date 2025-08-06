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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Product,
  ProductCategory,
  PaginatedResponse,
  PaginatedSearchParams,
} from "@shared/api";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  type ApiResponse,
} from "@/lib/auth";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";

interface CreateProductRequest {
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  price: number;
  stock: number;
  sku?: string;
  imageUrl?: string;
  status: "active" | "inactive";
  commission?: number;
}

export function Products() {
  const navigate = useNavigate();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);

  // Pagination
  const pagination = useRepositoryPagination<Product>({
    initialPageSize: 15,
  });

  // Form state for new/edit product
  const [productFormData, setProductFormData] = useState<CreateProductRequest>({
    name: "",
    slug: "",
    description: "",
    categoryId: "",
    price: 0,
    stock: 0,
    sku: "",
    imageUrl: "",
    status: "active",
    commission: 0,
  });

  // Load data on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [
    pagination.currentPage,
    pagination.pageSize,
    searchTerm,
    categoryFilter,
    stockFilter,
  ]);

  // Reset to first page when filters change
  useEffect(() => {
    pagination.goToPage(1);
  }, [searchTerm, categoryFilter, stockFilter]);

  const loadCategories = async () => {
    try {
      const resp = await apiGet<ApiResponse<{
        data: ProductCategory[];
        total: number;
        page: number;
        limit: number;
      }>>("/product-category?page=1&limit=100");

      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Failed to fetch categories");
      }

      setCategories(resp.data.data.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadProducts = async () => {
    await pagination.loadData(async (params: PaginatedSearchParams) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append("page", String(params.page));
      if (params.limit) searchParams.append("limit", String(params.limit));
      if (searchTerm) searchParams.append("search", searchTerm);
      if (categoryFilter !== "all")
        searchParams.append("categoryId", categoryFilter);
      if (stockFilter === "low") searchParams.append("lowStock", "5");
      if (stockFilter === "out") searchParams.append("lowStock", "0");

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
  };

  const handleAddProduct = async () => {
    try {
      const resp = await apiPost<ApiResponse<Product>>("/product", {
        name: productFormData.name,
        description: productFormData.description,
        categoryId: productFormData.categoryId,
        price: productFormData.price,
        commission: productFormData.commission,
        sku: productFormData.sku,
      });

      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Failed to create product");
      }
      setIsAddProductDialogOpen(false);
      resetProductForm();
      await loadProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      const resp = await apiPut<ApiResponse<Product>>(
        `/product/${selectedProduct.id}`,
        productFormData,
      );

      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Failed to update product");
      }

      const updatedProduct = resp.data.data;
      setIsEditProductDialogOpen(false);
      setSelectedProduct(null);
      resetProductForm();
      await loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?"))
      return;

    try {
      await apiDelete<ApiResponse<any>>(`/product/${productId}`);
      await loadProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      slug: "",
      description: "",
      categoryId: "",
      price: 0,
      stock: 0, // Stock will always start at 0, managed through Kardex
      sku: "",
      imageUrl: "",
      status: "active",
      commission: 0,
    });
  };

  const openEditProductDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock, // Keep original stock, not editable
      sku: product.sku,
      imageUrl: product.imageUrl,
      status: product.status,
      commission: product.commission || 0,
    });
    setIsEditProductDialogOpen(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Sin stock", className: "status-error" };
    if (stock <= 5) return { label: "Stock bajo", className: "status-warning" };
    return { label: "En stock", className: "status-success" };
  };

  // Calculate stats
  const totalProducts = allProducts.length;
  const activeProducts = allProducts.filter((p) => p.status === "active").length;
  const lowStockProducts = allProducts.filter((p) => p.stock <= 5).length;
  const outOfStockProducts = allProducts.filter((p) => p.stock === 0).length;
  const totalInventoryValue = allProducts.reduce(
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
                  <SelectItem value="low">Stock bajo {`(< 6)`}</SelectItem>
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
              Productos ({pagination.pageSize}
              {` de ${pagination.totalItems}`}
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {pagination.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-16 rounded"></div>
                ))}
              </div>
            ) : pagination.data.length === 0 ? (
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
              <>
                <div className="overflow-x-auto">
                  {/* Pagination */}
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    pageSize={pagination.pageSize}
                    onPageChange={pagination.goToPage}
                    onPageSizeChange={pagination.setPageSize}
                    showPageSizeSelector={true}
                    pageSizeOptions={[10, 15, 25, 50]}
                    className="mt-2 mb-4"
                  />

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="text-center">Comisión</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagination.data.map((product) => {
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
                                {product.sku || '-'}
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
                            <TableCell className="text-center">
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
                            <TableCell className="text-center">

                              <span
                                className={cn("font-medium")}
                              >
                                {
                                  product.commission ?
                                    `S/ ${product.commission}`
                                    : '-'
                                }
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
                                  onClick={() =>
                                    handleDeleteProduct(product.id)
                                  }
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
              </>
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
                        slug: e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)+/g, ""),
                      })
                    }
                    placeholder="Crema Hidratante"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
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
                  <Label htmlFor="price">Precio Venta *</Label>
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
                  <Label htmlFor="commission">Comisión</Label>
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
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.commission}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      commission: parseFloat(e.target.value) || 0,
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
                  <Label htmlFor="editSku">SKU</Label>
                  <Input
                    id="editSku"
                    value={productFormData.sku}
                    onChange={(e) =>
                      setProductFormData({
                        ...productFormData,
                        sku: e.target.value,
                      })
                    }
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
                  <Label htmlFor="editCommission">Comisión</Label>
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
                  id="editCommission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productFormData.commission}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      commission: parseFloat(e.target.value) || 0,
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

      </div>
    </Layout>
  );
}

export default Products;
