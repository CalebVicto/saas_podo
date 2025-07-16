import type {
  Patient,
  Worker,
  CreateWorkerRequest,
  Appointment,
  CreateAppointmentRequest,
  Product,
  ProductCategory,
  ProductMovement,
  Payment,
  CreatePaymentRequest,
  Sale,
  SaleItem,
  Abono,
  CreateAbonoRequest,
  AbonoUsage,
  Package,
  PatientPackage,
  PackageSession,
} from "@shared/api";
import type {
  IPatientRepository,
  IWorkerRepository,
  IAppointmentRepository,
  IProductRepository,
  IProductCategoryRepository,
  IProductMovementRepository,
  IPaymentRepository,
  ISaleRepository,
  IAbonoRepository,
  IPackageRepository,
  IPatientPackageRepository,
  RepositoryConfig,
} from "../interfaces";
import { ApiBaseRepository } from "./base";

// Patient Repository
export class ApiPatientRepository
  extends ApiBaseRepository<Patient, Patient>
  implements IPatientRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/patient");
  }

  async getByDocumentId(documentId: string): Promise<Patient | null> {
    const queryString = this.buildQueryString({ documentId });
    const patients = await this.requestArray<Patient>(`${queryString}`);
    return patients[0] || null;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    const queryString = this.buildQueryString({ search: query });
    return this.requestArray<Patient>(`${queryString}`);
  }

  async getPatientStats(): Promise<{
    total: number;
    newThisMonth: number;
    newThisWeek: number;
  }> {
    return this.requestSingle<{
      total: number;
      newThisMonth: number;
      newThisWeek: number;
    }>("/stats");
  }
}

// Worker Repository
export class ApiWorkerRepository
  extends ApiBaseRepository<Worker, CreateWorkerRequest>
  implements IWorkerRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/workers");
  }

  async getActiveWorkers(): Promise<Worker[]> {
    const queryString = this.buildQueryString({ active: true });
    return this.requestArray<Worker>(`${queryString}`);
  }

  async getByEmail(email: string): Promise<Worker | null> {
    const queryString = this.buildQueryString({ email });
    const workers = await this.requestArray<Worker>(`${queryString}`);
    return workers[0] || null;
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<Worker> {
    return this.requestSingle<Worker>(`/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  }
}

// Appointment Repository
export class ApiAppointmentRepository
  extends ApiBaseRepository<Appointment, CreateAppointmentRequest>
  implements IAppointmentRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/appointments");
  }

  async getByPatientId(patientId: string): Promise<Appointment[]> {
    const queryString = this.buildQueryString({ patientId });
    return this.requestArray<Appointment>(`${queryString}`);
  }

  async getByWorkerId(workerId: string): Promise<Appointment[]> {
    const queryString = this.buildQueryString({ workerId });
    return this.requestArray<Appointment>(`${queryString}`);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Appointment[]> {
    const queryString = this.buildQueryString({ startDate, endDate });
    return this.requestArray<Appointment>(`${queryString}`);
  }

  async getByStatus(status: Appointment["status"]): Promise<Appointment[]> {
    const queryString = this.buildQueryString({ status });
    return this.requestArray<Appointment>(`${queryString}`);
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    return this.requestArray<Appointment>("/today");
  }

  async updateStatus(
    id: string,
    status: Appointment["status"],
  ): Promise<Appointment> {
    return this.requestSingle<Appointment>(`/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async getAppointmentStats(): Promise<{
    today: number;
    completed: number;
    scheduled: number;
    total: number;
  }> {
    return this.requestSingle<{
      today: number;
      completed: number;
      scheduled: number;
      total: number;
    }>("/stats");
  }
}

// Product Repository
export class ApiProductRepository
  extends ApiBaseRepository<
    Product,
    Omit<Product, "id" | "createdAt" | "updatedAt" | "category">
  >
  implements IProductRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/products");
  }

  async getByCategoryId(categoryId: string): Promise<Product[]> {
    const queryString = this.buildQueryString({ categoryId });
    return this.requestArray<Product>(`${queryString}`);
  }

  async getActiveProducts(): Promise<Product[]> {
    const queryString = this.buildQueryString({ active: true });
    return this.requestArray<Product>(`${queryString}`);
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    const queryString = this.buildQueryString({ lowStock: threshold || 5 });
    return this.requestArray<Product>(`${queryString}`);
  }

  async updateStock(
    id: string,
    quantity: number,
    reason: string,
  ): Promise<Product> {
    return this.requestSingle<Product>(`/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ quantity, reason }),
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    const queryString = this.buildQueryString({ search: query });
    return this.requestArray<Product>(`${queryString}`);
  }

  async getProductStats(): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
  }> {
    return this.requestSingle<{
      total: number;
      lowStock: number;
      outOfStock: number;
    }>("/stats");
  }
}

// Product Category Repository
export class ApiProductCategoryRepository
  extends ApiBaseRepository<
    ProductCategory,
    Omit<ProductCategory, "id" | "createdAt" | "updatedAt">
  >
  implements IProductCategoryRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/product-categories");
  }

  async getCategoriesWithProductCount(): Promise<
    (ProductCategory & { productCount: number })[]
  > {
    return this.requestArray<ProductCategory & { productCount: number }>(
      "/with-counts",
    );
  }
}

// Product Movement Repository
export class ApiProductMovementRepository
  implements IProductMovementRepository
{
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: RepositoryConfig) {
    this.baseUrl = config.apiBaseUrl || "/api";
    this.headers = {
      "Content-Type": "application/json",
      ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
    };
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/product-movements${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
  }

  async getAll(): Promise<ProductMovement[]> {
    return this.request<ProductMovement[]>("");
  }

  async getByProductId(productId: string): Promise<ProductMovement[]> {
    return this.request<ProductMovement[]>(`?productId=${productId}`);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<ProductMovement[]> {
    return this.request<ProductMovement[]>(
      `?startDate=${startDate}&endDate=${endDate}`,
    );
  }

  async create(
    movement: Omit<ProductMovement, "id" | "createdAt" | "product">,
  ): Promise<ProductMovement> {
    return this.request<ProductMovement>("", {
      method: "POST",
      body: JSON.stringify(movement),
    });
  }
}

// Payment Repository
export class ApiPaymentRepository
  extends ApiBaseRepository<Payment, CreatePaymentRequest>
  implements IPaymentRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/payments");
  }

  async getByAppointmentId(appointmentId: string): Promise<Payment[]> {
    const queryString = this.buildQueryString({ appointmentId });
    return this.requestArray<Payment>(`${queryString}`);
  }

  async getBySaleId(saleId: string): Promise<Payment[]> {
    const queryString = this.buildQueryString({ saleId });
    return this.requestArray<Payment>(`${queryString}`);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    const queryString = this.buildQueryString({ startDate, endDate });
    return this.requestArray<Payment>(`${queryString}`);
  }

  async getByMethod(method: Payment["method"]): Promise<Payment[]> {
    const queryString = this.buildQueryString({ method });
    return this.requestArray<Payment>(`${queryString}`);
  }

  async getIncomeStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  }> {
    return this.requestSingle<{
      today: number;
      thisWeek: number;
      thisMonth: number;
      total: number;
    }>("/income-stats");
  }
}

// Sale Repository
export class ApiSaleRepository
  extends ApiBaseRepository<
    Sale,
    Omit<Sale, "id" | "createdAt" | "updatedAt" | "items" | "payment">
  >
  implements ISaleRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/sales");
  }

  async getByCustomerId(customerId: string): Promise<Sale[]> {
    const queryString = this.buildQueryString({ customerId });
    return this.requestArray<Sale>(`${queryString}`);
  }

  async getBySellerId(sellerId: string): Promise<Sale[]> {
    const queryString = this.buildQueryString({ sellerId });
    return this.requestArray<Sale>(`${queryString}`);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    const queryString = this.buildQueryString({ startDate, endDate });
    return this.requestArray<Sale>(`${queryString}`);
  }

  async createSaleWithItems(
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt" | "payment">,
    items: Omit<SaleItem, "id" | "saleId">[],
  ): Promise<Sale> {
    return this.requestSingle<Sale>("/with-items", {
      method: "POST",
      body: JSON.stringify({ sale, items }),
    });
  }

  async getSaleStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    totalAmount: number;
  }> {
    return this.requestSingle<{
      today: number;
      thisWeek: number;
      thisMonth: number;
      total: number;
      totalAmount: number;
    }>("/stats");
  }
}

// Abono Repository
export class ApiAbonoRepository
  extends ApiBaseRepository<Abono, CreateAbonoRequest>
  implements IAbonoRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/abonos");
  }

  async getByPatientId(patientId: string): Promise<Abono[]> {
    const queryString = this.buildQueryString({ patientId });
    return this.requestArray<Abono>(`${queryString}`);
  }

  async getActiveAbonosByPatientId(patientId: string): Promise<Abono[]> {
    const queryString = this.buildQueryString({ patientId, active: true });
    return this.requestArray<Abono>(`${queryString}`);
  }

  async useAbono(
    abonoId: string,
    amount: number,
    appointmentId?: string,
    saleId?: string,
    notes?: string,
  ): Promise<AbonoUsage> {
    return this.requestSingle<AbonoUsage>(`/${abonoId}/use`, {
      method: "POST",
      body: JSON.stringify({ amount, appointmentId, saleId, notes }),
    });
  }

  async getPatientAbonoBalance(patientId: string): Promise<number> {
    const result = await this.requestSingle<{ balance: number }>(
      `/patient/${patientId}/balance`,
    );
    return result.balance;
  }

  async getAbonoUsageHistory(abonoId: string): Promise<AbonoUsage[]> {
    return this.requestArray<AbonoUsage>(`/${abonoId}/usage`);
  }
}

// Package Repository
export class ApiPackageRepository
  extends ApiBaseRepository<
    Package,
    Omit<Package, "id" | "createdAt" | "updatedAt">
  >
  implements IPackageRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/packages");
  }

  async getActivePackages(): Promise<Package[]> {
    const queryString = this.buildQueryString({ active: true });
    return this.requestArray<Package>(`${queryString}`);
  }
}

// Patient Package Repository
export class ApiPatientPackageRepository
  extends ApiBaseRepository<
    PatientPackage,
    Omit<PatientPackage, "id" | "completedAt" | "package" | "patient">
  >
  implements IPatientPackageRepository
{
  constructor(config: RepositoryConfig) {
    super(config, "/patient-packages");
  }

  async getByPatientId(patientId: string): Promise<PatientPackage[]> {
    const queryString = this.buildQueryString({ patientId });
    return this.requestArray<PatientPackage>(`${queryString}`);
  }

  async getActiveByPatientId(patientId: string): Promise<PatientPackage[]> {
    const queryString = this.buildQueryString({ patientId, active: true });
    return this.requestArray<PatientPackage>(`${queryString}`);
  }

  async useSession(
    patientPackageId: string,
    appointmentId: string,
    notes?: string,
  ): Promise<PackageSession> {
    return this.requestSingle<PackageSession>(
      `/${patientPackageId}/use-session`,
      {
        method: "POST",
        body: JSON.stringify({ appointmentId, notes }),
      },
    );
  }

  async getSessionHistory(patientPackageId: string): Promise<PackageSession[]> {
    return this.requestArray<PackageSession>(`/${patientPackageId}/sessions`);
  }
}
