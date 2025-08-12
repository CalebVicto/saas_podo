import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/auth";
import type { ScheduleAppointmentRequest, ScheduledAppointment, ApiResponse } from "@shared/api";

interface MonthlyGroup {
  date: string;
  appointments: any[];
}

export class FutureAppointmentRepository {
  private mapAppointment(data: any): ScheduledAppointment {
    return {
      id: data.id,
      patientId: data.patientId,
      workerId: data.workerId,
      dateTime: data.date,
      duration: data.duration,
      status: data.status,
      reason: data.reason,
      treatmentNotes: data.treatmentNotes || "",
      observation: data.additionalObservations || "",
      priority: data.priority || "medium",
      reminderEnabled: Array.isArray(data.reminderDays) && data.reminderDays.length > 0,
      reminderDays: Array.isArray(data.reminderDays) && data.reminderDays.length > 0 ? data.reminderDays[0] : 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as ScheduledAppointment;
  }

  async getMonthly(month: number, year: number): Promise<ScheduledAppointment[]> {
    const resp = await apiGet<ApiResponse<MonthlyGroup[]>>(
      `/future-appointment/monthly?month=${month}&year=${year}`,
    );
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to fetch appointments");
    }
    const groups = resp.data.data;
    const appointments: ScheduledAppointment[] = [];
    for (const day of groups) {
      for (const apt of day.appointments) {
        appointments.push(this.mapAppointment(apt));
      }
    }
    return appointments;
  }

  async create(data: ScheduleAppointmentRequest): Promise<ScheduledAppointment> {
    const payload: any = {
      patientId: data.patientId,
      workerId: data.workerId,
      date: data.scheduledDateTime,
      duration: data.duration,
      priority: data.priority,
      reason: data.reason,
      treatmentNotes: data.treatmentNotes,
      additionalObservations: data.observation,
      reminderDays: data.reminderEnabled ? [data.reminderDays] : [],
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const resp = await apiPost<ApiResponse<any>>("/future-appointment", payload);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to create appointment");
    }
    return this.mapAppointment(resp.data.data);
  }

  async update(id: string, data: Partial<ScheduleAppointmentRequest> & { status?: string }): Promise<ScheduledAppointment> {
    const payload: any = {
      date: data.scheduledDateTime,
      duration: data.duration,
      priority: data.priority,
      reason: data.reason,
      treatmentNotes: data.treatmentNotes,
      additionalObservations: data.observation,
      reminderDays: data.reminderEnabled !== undefined ? (data.reminderEnabled ? [data.reminderDays] : []) : undefined,
      status: data.status,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
    const resp = await apiPut<ApiResponse<any>>(`/future-appointment/${id}`, payload);
    if (resp.error || !resp.data) {
      throw new Error(resp.error || "Failed to update appointment");
    }
    return this.mapAppointment(resp.data.data);
  }

  async delete(id: string): Promise<void> {
    const resp = await apiDelete<ApiResponse<void>>(`/future-appointment/${id}`);
    if (resp.error) {
      throw new Error(resp.error);
    }
  }
}

