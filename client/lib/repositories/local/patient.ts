import type {
  Patient,
  PaginatedResponse,
  PaginatedSearchParams,
} from "@shared/api";
import type { IPatientRepository } from "../interfaces";
import { LocalStorageBaseRepository } from "./base";
import { mockPatients } from "../../mockData";

export class LocalPatientRepository
  extends LocalStorageBaseRepository<Patient, Patient>
  implements IPatientRepository
{
  constructor() {
    super("podocare_patients", mockPatients);
  }

  async getByDocumentId(documentNumber: string): Promise<Patient | null> {
    await this.simulateNetworkDelay();
    const patients = this.loadFromStorage();
    return patients.find((p) => p.documentNumber === documentNumber) || null;
  }

  async searchPatients(
    params: PaginatedSearchParams,
  ): Promise<PaginatedResponse<Patient>> {
    await this.simulateNetworkDelay();
    let patients = this.loadFromStorage();

    // Apply search filter
    if (params.search) {
      const searchQuery = params.search.toLowerCase();
      patients = patients.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(searchQuery) ||
          patient.paternalSurname.toLowerCase().includes(searchQuery) ||
          patient.maternalSurname.toLowerCase().includes(searchQuery) ||
          patient.documentNumber.toLowerCase().includes(searchQuery) ||
          (patient.phone || "").toLowerCase().includes(searchQuery),
      );
    }

    return this.paginateResults(patients, params);
  }

  async getPatientStats(): Promise<{
    total: number;
    newThisMonth: number;
    newThisWeek: number;
  }> {
    await this.simulateNetworkDelay();
    const patients = this.loadFromStorage();
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: patients.length,
      newThisMonth: patients.filter((p) => new Date(p.createdAt) >= thisMonth)
        .length,
      newThisWeek: patients.filter((p) => new Date(p.createdAt) >= thisWeek)
        .length,
    };
  }
}
