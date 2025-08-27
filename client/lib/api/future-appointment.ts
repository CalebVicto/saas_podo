import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/auth";
import type {
  ScheduleAppointmentRequest,
  ScheduledAppointment,
  ApiResponse,
} from "@shared/api";

/**
 * La API real devuelve:
 * - monthly: { state, message, data: { "13": [ {...}, {...} ], "14": [ ... ] } }
 * - daily:   { state, message, data: [ {...}, {...} ] }
 *
 * Normalizamos:
 * - `date` (backend)  -> `dateTime` (frontend)
 * - `additionalObservations` -> `observation`
 * - `reminderDays`: si llega array, tomamos el primero; si llega número, lo envolvemos; si no llega, 0
 * - `reminderEnabled`: true si el array no está vacío
 */

function normalizeAppointment(raw: any): ScheduledAppointment {
  const rdArray: number[] = Array.isArray(raw?.reminderDays)
    ? raw.reminderDays
    : typeof raw?.reminderDays === "number"
      ? [raw.reminderDays]
      : [];

  const reminderDays = rdArray[0] ?? 0;

  return {
    id: raw.id,
    patientId: raw.patientId,
    workerId: raw.workerId,
    userId: raw.userId,
    date: raw.date, // viene "2025-08-13T14:00:00.000Z"
    status: raw.status ?? "scheduled",
    reason: raw.reason ?? "",
    treatmentNotes: raw.treatmentNotes ?? "",
    observation: raw.additionalObservations ?? "",
    priority: raw.priority ?? "medium",
    reminderEnabled: rdArray.length > 0,
    reminderDays,
    tenantId: raw.tenantId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  } as ScheduledAppointment;
}

export class FutureAppointmentRepository {
  /**
   * /future-appointment/monthly?year=YYYY&month=M
   * Respuesta: data = { "13": [ apt, apt ], "27": [ apt ] }
   */
  async getMonthly(month: number, year: number): Promise<ScheduledAppointment[]> {
    const resp = await apiGet<ApiResponse<Record<string, any[]>>>(
      `/future-appointment/monthly?month=${month}&year=${year}`);

    if (resp.error || !resp.data) {
      throw new Error(resp.error || "No se pudieron obtener las citas del mes");
    }

    const byDay = resp.data.data || {};
    const flat: any[] = [];
    for (const dayKey of Object.keys(byDay)) {
      const list = Array.isArray(byDay[dayKey]) ? byDay[dayKey] : [];
      for (const apt of list) flat.push(apt);
    }

    return flat.map(normalizeAppointment);
  }

  /**
   * /future-appointment/daily?date=YYYY-MM-DD
   */
  async getDaily(date?: string): Promise<ScheduledAppointment[]> {
    const ymd = date ?? new Date().toISOString().split("T")[0];

    const resp = await apiGet<ApiResponse<any[]>>(
      `/future-appointment/daily?date=${encodeURIComponent(ymd)}`,
    );

    if (resp.error || !resp.data) {
      throw new Error(resp.error || "No se pudieron obtener las citas del día");
    }

    const list = Array.isArray(resp.data.data) ? resp.data.data : [];
    return list.map(normalizeAppointment);
  }

  async create(data: ScheduleAppointmentRequest): Promise<ScheduledAppointment> {
    const payload: any = {
      patientId: data.patientId,
      workerId: data.workerId,
      date: data.date, // el backend espera "date"
  // duration removed
      priority: data.priority,
      reason: data.reason,
      treatmentNotes: data.treatmentNotes,
      additionalObservations: data.additionalObservations,
      reminderDays: data.reminderEnabled ? [data.reminderDays] : [], // array en backend
    };

    // limpia undefined
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const resp = await apiPost<ApiResponse<any>>(`/future-appointment`, payload);

    if (resp.error || !resp.data) {
      throw new Error(resp.error || "No se pudo crear la cita");
    }

    return normalizeAppointment(resp.data.data ?? resp.data);
  }

  async update(
    id: string,
    data: Partial<ScheduleAppointmentRequest> & { status?: string },
  ): Promise<ScheduledAppointment> {
    const payload: any = {
      date: data.date,
  // duration removed
      priority: data.priority,
      reason: data.reason,
      treatmentNotes: data.treatmentNotes,
      additionalObservations: data.additionalObservations,
      // si te mandan explícitamente el flag, lo respetas; si no, no tocas reminderDays
      reminderDays:
        data.reminderEnabled === undefined
          ? undefined
          : data.reminderEnabled
            ? [data.reminderDays]
            : [],
      status: data.status,
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const resp = await apiPut<ApiResponse<any>>(`/future-appointment/${id}`, payload);

    if (resp.error || !resp.data) {
      throw new Error(resp.error || "No se pudo actualizar la cita");
    }

    return normalizeAppointment(resp.data.data ?? resp.data);
  }

  async delete(id: string): Promise<void> {
    const resp = await apiDelete<ApiResponse<void>>(`/future-appointment/${id}`);
    if (resp.error) {
      throw new Error(resp.error || "No se pudo eliminar la cita");
    }
  }
}
