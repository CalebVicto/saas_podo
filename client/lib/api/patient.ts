import { apiGet, apiPost, apiPut } from "@/lib/auth";
import type {
  PatientListItem,
  PatientListResponse,
  PaginatedResponse,
  PaginatedSearchParams,
  Patient,
  UpdatePatientDto,
  UpdatePatientBalanceDto,
  ApiResponse,
  PatientDetailStatistics,
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
  ): Promise<PaginatedResponse<Patient>> {
    const query = this.buildQuery(params);
    const resp = await apiGet<PatientListResponse>(`/patient${query}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch patients");
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

  async create(data: Patient): Promise<Patient> {
    const resp = await apiPost<ApiResponse<Patient>>("/patient", data);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to create patient");
    }
    return resp.data.data;
  }

  async getById(id: string): Promise<Patient> {
    const resp = await apiGet<ApiResponse<Patient>>(`/patient/${id}`);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch patient");
    }
    return resp.data.data;
  }

  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    const resp = await apiPut<ApiResponse<Patient>>(`/patient/${id}`, data);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to update patient");
    }
    return resp.data.data;
  }

  async getDetailStatistics(id: string): Promise<PatientDetailStatistics> {
    const resp = await apiGet<ApiResponse<PatientDetailStatistics>>(
      `/patient/${id}/detail-statistics`,
    );
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch patient detail");
    }
    return resp.data.data;
  }

  async updateBalance(
    patientId: string,
    data: UpdatePatientBalanceDto,
  ): Promise<void> {
    const resp = await apiPost<ApiResponse<any>>(
      `/patient/updateBalance/${patientId}`,
      data,
    );
    if (resp.error) {
      throw new Error(resp.error);
    }
  }
}
