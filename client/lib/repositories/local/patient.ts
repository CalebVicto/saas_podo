import type { Patient, CreatePatientRequest } from "@shared/api";
import type { IPatientRepository } from "../interfaces";
import { LocalStorageBaseRepository } from "./base";
import { mockPatients } from "../../mockData";

export class LocalPatientRepository
  extends LocalStorageBaseRepository<Patient, CreatePatientRequest>
  implements IPatientRepository
{
  constructor() {
    super("podocare_patients", mockPatients);
  }

  async getByDocumentId(documentId: string): Promise<Patient | null> {
    await this.simulateNetworkDelay();
    const patients = this.loadFromStorage();
    return patients.find((p) => p.documentId === documentId) || null;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return this.searchByFields(
      ["firstName", "lastName", "documentId", "phone"],
      query,
    );
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
