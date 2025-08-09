import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "@/lib/auth";
import type {
  Appointment,
  PaginatedResponse,
  PaginatedSearchParams,
  ApiResponse,
} from "@shared/api";

interface AppointmentListResponse {
  state: string;
  message: string;
  data: {
    data: any[];
    total: number;
    page: number;
    limit: number;
  };
}

export class AppointmentRepository {
  private buildQuery(params?: PaginatedSearchParams): string {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.search) searchParams.append("search", params.search);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (!['page', 'limit', 'search'].includes(key) && value !== undefined)
          searchParams.append(key, String(value));
      });
    }
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  }

  async getAll(params?: PaginatedSearchParams): Promise<PaginatedResponse<Appointment>> {
    const query = this.buildQuery(params);
    const resp = await apiGet<AppointmentListResponse>(`/appointment${query}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch appointments");
    }
    const { data: rawItems, total, page, limit } = resp.data.data;
    const items: Appointment[] = rawItems.map((item: any) => ({
      ...item,
      patientId: item.patientId?.id,
      patient: item.patientId,
      workerId: item.userId?.id,
      worker: item.userId,
      dateTime: item.createdAt,
    }));
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<Appointment> {
    const resp = await apiGet<ApiResponse<any>>(`/appointment/${id}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch appointment");
    }
    const item = resp.data.data as any;
    return {
      ...item,
      patientId: item.patientId?.id,
      patient: item.patientId,
      workerId: item.userId?.id,
      worker: item.userId,
      dateTime: item.createdAt,
    } as Appointment;
  }

  async create(data: any): Promise<Appointment> {
    const resp = await apiPost<ApiResponse<Appointment>>("/appointment", data);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to create appointment");
    }
    return resp.data.data;
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const resp = await apiPut<ApiResponse<Appointment>>(`/appointment/${id}`, data);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to update appointment");
    }
    return resp.data.data;
  }

  async delete(id: string): Promise<void> {
    const resp = await apiDelete<ApiResponse<void>>(`/appointment/${id}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to delete appointment");
    }
  }

  async updatePayment(
    id: string,
    data: {
      paymentMethod: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance";
      tenantId?: string;
    }
  ) {
    const resp = await apiPut<ApiResponse<void>>(`/appointment/${id}/payment`, data);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to update appointment payment");
    }
    return resp.data;
  }

}
