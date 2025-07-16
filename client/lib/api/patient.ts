import { apiGet } from "@/lib/auth";
import type {
  PatientListItem,
  PatientListResponse,
  PaginatedResponse,
  PaginatedSearchParams,
} from "@shared/api";

export class PatientRepository {
  private buildQuery(params?: PaginatedSearchParams): string {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.search) searchParams.append("search", params.search);
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  }

  async getAll(
    params?: PaginatedSearchParams,
  ): Promise<PaginatedResponse<PatientListItem>> {
    const query = this.buildQuery(params);
    const resp = await apiGet<PatientListResponse>(`/patient${query}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch patients");
    }
    const {
      data: items,
      total,
      page,
      limit,
    } = resp.data.data;
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

