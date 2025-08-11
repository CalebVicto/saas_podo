import type {
  Appointment,
  CreateAppointmentRequest,
  PaginatedResponse,
  PaginatedSearchParams,
} from "@shared/api";
import type { IAppointmentRepository } from "../interfaces";
import { LocalStorageBaseRepository } from "./base";
import { mockAppointments } from "../../mockData";

export class LocalAppointmentRepository
  extends LocalStorageBaseRepository<Appointment, CreateAppointmentRequest>
  implements IAppointmentRepository
{
  constructor() {
    super("podocare_appointments", mockAppointments);
  }

  async getAll(
    params?: PaginatedSearchParams,
  ): Promise<PaginatedResponse<Appointment>> {
    await this.simulateNetworkDelay();
    let appointments = this.loadFromStorage();

    // Búsqueda general
    if (params?.search) {
      const searchQuery = params.search.toLowerCase();
      appointments = appointments.filter((apt) =>
        Object.values(apt).some(
          (val) =>
            typeof val === "string" &&
            val.toLowerCase().includes(searchQuery),
        ),
      );
    }

    // Filtrado por estado
    if (params?.status) {
      appointments = appointments.filter((apt) => apt.status === params.status);
    }

    // Filtrado por trabajador
    if (params?.userId) {
      appointments = appointments.filter((apt) => apt.workerId === params.userId);
    }

    // Filtrado por fecha específica
    if (params?.date) {
      appointments = this.filterByDateRange(
        appointments,
        params.date,
        params.date,
        "dateTime",
      );
    }

    return this.paginateResults(appointments, params);
  }

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    return this.findByField("patientId", patientId);
  }

  async getByWorkerId(workerId: string): Promise<Appointment[]> {
    return this.findByField("workerId", workerId);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    await this.simulateNetworkDelay();
    const appointments = this.loadFromStorage();
    return this.filterByDateRange(appointments, startDate, endDate, "dateTime");
  }

  async getByStatus(status: Appointment["status"]): Promise<Appointment[]> {
    return this.findByField("status", status);
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    await this.simulateNetworkDelay();
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
    return this.getByDateRange(startOfDay, endOfDay);
  }

  async updateStatus(
    id: string,
    status: Appointment["status"],
  ): Promise<Appointment> {
    return this.update(id, { status });
  }

  async getAppointmentStats(): Promise<{
    today: number;
    completed: number;
    scheduled: number;
    total: number;
  }> {
    await this.simulateNetworkDelay();
    const [todayAppointments, allAppointments] = await Promise.all([
      this.getTodaysAppointments(),
      this.getAll(),
    ]);

    return {
      today: todayAppointments.length,
      completed: todayAppointments.filter((a) => a.status === "completed")
        .length,
      scheduled: todayAppointments.filter((a) => a.status === "scheduled")
        .length,
      total: allAppointments.length,
    };
  }
}
