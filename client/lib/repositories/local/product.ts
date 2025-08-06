import type { Product } from "@shared/api";
import type { IProductRepository } from "../interfaces";
import { LocalStorageBaseRepository } from "./base";
import { mockProducts } from "../../mockData";

type CreateProductRequest = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "category"
>;

export class LocalProductRepository
  extends LocalStorageBaseRepository<Product, CreateProductRequest>
  implements IProductRepository
{
  constructor() {
    super("podocare_products", mockProducts);
  }

  async getByCategoryId(categoryId: string): Promise<Product[]> {
    return this.findByField("categoryId", categoryId);
  }

  async getActiveProducts(): Promise<Product[]> {
    await this.simulateNetworkDelay();
    const products = this.loadFromStorage();
    return products.filter((p) => p.status === "active");
  }

  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    await this.simulateNetworkDelay();
    const products = this.loadFromStorage();
    return products.filter((p) => p.stock <= threshold && p.status === "active");
  }

  async updateStock(
    id: string,
    quantity: number,
    reason: string,
  ): Promise<Product> {
    await this.simulateNetworkDelay();
    const product = await this.getById(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }

    const newStock = Math.max(0, product.stock + quantity);
    return this.update(id, { stock: newStock });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.searchByFields(["name", "description", "sku"], query);
  }

  async getProductStats(): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
  }> {
    await this.simulateNetworkDelay();
    const products = await this.getActiveProducts();
    return {
      total: products.length,
      lowStock: products.filter((p) => p.stock <= 5 && p.stock > 0).length,
      outOfStock: products.filter((p) => p.stock === 0).length,
    };
  }
}
