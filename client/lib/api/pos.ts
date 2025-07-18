import { apiGet, apiPost } from "@/lib/auth";
import type { Product, PaginatedResponse, PaginatedSearchParams, Sale, ApiResponse } from "@shared/api";

interface ProductListApiResponse {
  data: {
    data: Product[];
    total: number;
    page: number;
    limit: number;
  };
}

export async function getProductList(params: PaginatedSearchParams = {}): Promise<PaginatedResponse<Product>> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));
  if (params.search) query.append("search", params.search);
  const resp = await apiGet<ProductListApiResponse>(`/product?${query.toString()}`);
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
  };
}

export interface CreateSaleRequest {
  customerId?: string;
  saleItems: { productId: string; quantity: number; price: number }[];
  paymentMethod: "efectivo" | "yape" | "transferencia" | "pos";
  note?: string;
}

export async function createSale(data: CreateSaleRequest): Promise<Sale> {
  const resp = await apiPost<ApiResponse<Sale>>("/sale", data);
  if (resp.error || !resp.data) {
    throw new Error(resp.error || "Failed to create sale");
  }
  return resp.data.data;
}
