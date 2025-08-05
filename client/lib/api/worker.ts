import { apiGet } from "@/lib/auth";
import type { Worker, PaginatedResponse, PaginatedSearchParams, ApiResponse } from "@shared/api";

interface WorkerListResponse {
  state: string;
  message: string;
  data: {
    data: Worker[];
    total: number;
    page: number;
    limit: number;
  };
}

export class WorkerRepository {
  private buildQuery(params?: PaginatedSearchParams): string {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.search) searchParams.append("search", params.search);
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  }

  async getAll(params?: PaginatedSearchParams): Promise<PaginatedResponse<Worker>> {
    const query = this.buildQuery(params);
    const resp = await apiGet<WorkerListResponse>(`/worker${query}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch workers");
    }
    const { data: items, total, page, limit } = resp.data.data;
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
