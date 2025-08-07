import React, { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Tag, Plus, Search, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
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

interface CreateCategoryRequest {
  name: string;
  status?: "active" | "inactive";
}

export function Categories() {
  const navigate = useNavigate();
  const pagination = useRepositoryPagination<ProductCategory>({
    initialPageSize: 10,
  });

  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [categoryFormData, setCategoryFormData] =
    useState<CreateCategoryRequest>({
      name: "",
      status: "active",
    });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAllCategories();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [pagination.currentPage, pagination.pageSize, pagination.searchTerm]);

  const buildQuery = (params: PaginatedSearchParams) => {
    const sp = new URLSearchParams();
    if (params.page) sp.append("page", String(params.page));
    if (params.limit) sp.append("limit", String(params.limit));
    if (params.search) sp.append("search", params.search);
    return sp.toString();
  };

  const loadAllCategories = async () => {
    try {
      const resp = await apiGet<
        ApiResponse<{
          data: ProductCategory[];
          total: number;
          page: number;
          limit: number;
        }>
      >("/product-category?page=1&limit=1000");
      if (!resp.error && resp.data) {
        setAllCategories(resp.data.data.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadCategories = async () => {
    await pagination.loadData(async (params: PaginatedSearchParams) => {
      const query = buildQuery(params);
      const resp = await apiGet<
        ApiResponse<{
          data: ProductCategory[];
          total: number;
          page: number;
          limit: number;
        }>
      >(`/product-category?${query}`);
      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Failed to fetch categories");
      }
      const { data, total, page, limit } = resp.data.data;
      return {
        items: data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      } as PaginatedResponse<ProductCategory>;
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!categoryFormData.name.trim()) {
      errors.name = "El nombre es requerido";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCategory = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const resp = await apiPost<ApiResponse<ProductCategory>>(
        "/product-category",
        categoryFormData,
      );
      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Failed to create category");
      }
      setIsAddDialogOpen(false);
      setCategoryFormData({ name: "", status: "active" });
      await loadAllCategories();
      await loadCategories();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !validateForm()) return;
    setIsLoading(true);
    try {
      const resp = await apiPut<ApiResponse<ProductCategory>>(
        `/product-category/${selectedCategory.id}`,
        categoryFormData,
      );
      if (resp.error || !resp.data) {
        throw new Error(resp.error || "Failed to update category");
      }
      setIsEditDialogOpen(false);
      setSelectedCategory(null);
      setCategoryFormData({ name: "", status: "active" });
      await loadAllCategories();
      await loadCategories();
    } catch (error) {
      console.error("Error editing category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category: ProductCategory) => {
    if (
      !confirm(
        `¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`,
      )
    )
      return;
    setIsLoading(true);
    try {
      const resp = await apiDelete<ApiResponse<any>>(
        `/product-category/${category.id}`,
      );
      if (resp.error) {
        toast({ title: resp.error, variant: "destructive" });
      } else {
        await loadAllCategories();
        await loadCategories();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (category: ProductCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({ name: category.name, status: category.status });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setCategoryFormData({ name: "", status: "active" });
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  return (
    <Layout title="Categorías" subtitle="Gestión de categorías de productos">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Productos
          </Button>
          <Button onClick={openAddDialog} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        </div>

        <Card className="card-modern">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorías..."
                  value={pagination.searchTerm}
                  onChange={(e) => pagination.setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Categorías
                  </p>
                  <p className="text-2xl font-bold">{allCategories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-modern">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Tag className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Categorías Activas
                  </p>
                  <p className="text-2xl font-bold">
                    {allCategories.filter((c) => c.status === "active").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Categorías ({pagination.totalItems})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pagination.isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: pagination.pageSize }).map((_, i) => (
                  <div key={i} className="loading-shimmer h-8 rounded" />
                ))}
              </div>
            ) : pagination.data.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  No se encontraron categorías
                </p>
                {!pagination.searchTerm && (
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Categoría
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.data.map((category) => (
                      <TableRow key={category.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              category.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {category.status === "active"
                              ? "Activa"
                              : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize}
                  onPageChange={pagination.goToPage}
                  onPageSizeChange={pagination.setPageSize}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Nueva Categoría
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Nombre *</Label>
              <Input
                id="add-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Nombre de la categoría"
                className={cn(formErrors.name && "border-destructive")}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={categoryFormData.status}
                onValueChange={(value) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    status: value as "active" | "inactive",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Categoría
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Categoría
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre *</Label>
              <Input
                id="edit-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    name: e.target.value,
                  })
                }
                placeholder="Nombre de la categoría"
                className={cn(formErrors.name && "border-destructive")}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={categoryFormData.status}
                onValueChange={(value) =>
                  setCategoryFormData({
                    ...categoryFormData,
                    status: value as "active" | "inactive",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditCategory} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

export default Categories;
