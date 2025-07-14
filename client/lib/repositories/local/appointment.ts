import type { Appointment, CreateAppointmentRequest } from "@shared/api";
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
