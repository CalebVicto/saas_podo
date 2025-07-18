import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { toast } from "@/hooks/use-toast";
import type { Product, Patient } from "@shared/api";
import { PatientRepository } from "@/lib/api/patient";
import { getProductList, createSale, CreateSaleRequest } from "@/lib/api/pos";

export default function Pos() {
  const pagination = useRepositoryPagination<Product>({ initialPageSize: 10 });
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    "efectivo" | "yape" | "transferencia" | "pos"
  >("efectivo");
  const [note, setNote] = useState("");

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  useEffect(() => {
    loadProducts();
  }, [pagination.currentPage, pagination.pageSize, pagination.searchTerm]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      await pagination.loadData((params) => getProductList(params));
    } catch (err) {
      toast({
        title: "Error al cargar productos",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadPatients = async () => {
    try {
      const repo = new PatientRepository();
      const resp = await repo.getAll({ page: 1, limit: 100 });
      setPatients(resp.items);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === product.id);
      if (found) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === id ? { ...i, quantity: Math.max(1, qty) } : i,
      ),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    const payload: CreateSaleRequest = {
      customerId: customerId || undefined,
      saleItems: cart.map((c) => ({
        productId: c.product.id,
        quantity: c.quantity,
        price: c.product.price,
      })),
      paymentMethod,
      note: note || "",
    };
    try {
      await createSale(payload);
      toast({ title: "Venta registrada" });
      setCart([]);
      setNote("");
    } catch (err: any) {
      toast({
        title: "Error al registrar venta",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="POS">
      <div className="p-6 space-y-6">
        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Productos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar..."
              value={pagination.searchTerm}
              onChange={(e) => pagination.setSearchTerm(e.target.value)}
            />
            {loadingProducts ? (
              <p>Cargando...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pagination.data.map((p) => (
                  <div
                    key={p.id}
                    className="border rounded p-2 flex flex-col"
                  >
                    <span className="font-medium flex-1">{p.name}</span>
                    <span className="text-sm">S/ {p.price}</span>
                    <Button className="mt-2" size="sm" onClick={() => addToCart(p)}>
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.goToPage}
                onPageSizeChange={pagination.setPageSize}
              />
            )}
          </CardContent>
        </Card>

        <Card className="card-modern">
          <CardHeader>
            <CardTitle>Carrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Select onValueChange={(v) => setCustomerId(v || undefined)}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Paciente opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Venta general</SelectItem>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.firstName} {p.paternalSurname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  setPaymentMethod(v as "efectivo" | "yape" | "transferencia" | "pos")
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="yape">Yape</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {cart.length === 0 ? (
              <p>No hay productos en el carrito</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell className="text-right">
                        S/ {item.product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              item.product.id,
                              Number(e.target.value),
                            )
                          }
                          className="w-16 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        S/ {(item.product.price * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          X
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Input
              placeholder="Nota (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>

            <Button onClick={handleSubmit} disabled={cart.length === 0} className="mt-2">
              Confirmar Venta
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
