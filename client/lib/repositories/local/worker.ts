import type { Worker, CreateWorkerRequest } from "@shared/api";
import type { IWorkerRepository } from "../interfaces";
import { LocalStorageBaseRepository } from "./base";
import { mockWorkers } from "../../mockData";

export class LocalWorkerRepository
  extends LocalStorageBaseRepository<Worker, CreateWorkerRequest>
  implements IWorkerRepository
{
  constructor() {
    super("podocare_workers", mockWorkers);
  }

  async getActiveWorkers(): Promise<Worker[]> {
    await this.simulateNetworkDelay();
    const workers = this.loadFromStorage();
    return workers.filter((w) => w.isActive);
  }

  async getByEmail(email: string): Promise<Worker | null> {
    await this.simulateNetworkDelay();
    const workers = this.loadFromStorage();
    return workers.find((w) => w.email === email) || null;
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<Worker> {
    return this.update(id, { isActive });
  }
}
