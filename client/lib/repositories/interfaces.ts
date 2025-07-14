import type {
  Patient,
  CreatePatientRequest,
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
  ApiResponse,
  PaginatedResponse,
} from "@shared/api";

// Base repository interface for common CRUD operations
export interface BaseRepository<T, TCreate> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: Partial<TCreate>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Patient Repository Interface
export interface IPatientRepository
  extends BaseRepository<Patient, CreatePatientRequest> {
  getByDocumentId(documentId: string): Promise<Patient | null>;
  searchPatients(query: string): Promise<Patient[]>;
  getPatientStats(): Promise<{
    total: number;
    newThisMonth: number;
    newThisWeek: number;
  }>;
}

// Worker Repository Interface
export interface IWorkerRepository
  extends BaseRepository<Worker, CreateWorkerRequest> {
  getActiveWorkers(): Promise<Worker[]>;
  getByEmail(email: string): Promise<Worker | null>;
  updateActiveStatus(id: string, isActive: boolean): Promise<Worker>;
}

// Appointment Repository Interface
export interface IAppointmentRepository
  extends BaseRepository<Appointment, CreateAppointmentRequest> {
  getByPatientId(patientId: string): Promise<Appointment[]>;
  getByWorkerId(workerId: string): Promise<Appointment[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
  getByStatus(status: Appointment["status"]): Promise<Appointment[]>;
  getTodaysAppointments(): Promise<Appointment[]>;
  updateStatus(id: string, status: Appointment["status"]): Promise<Appointment>;
  getAppointmentStats(): Promise<{
    today: number;
    completed: number;
    scheduled: number;
    total: number;
  }>;
}

// Product Repository Interface
export interface IProductRepository
  extends BaseRepository<
    Product,
    Omit<Product, "id" | "createdAt" | "updatedAt" | "category">
  > {
  getByCategoryId(categoryId: string): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
  updateStock(id: string, quantity: number, reason: string): Promise<Product>;
  searchProducts(query: string): Promise<Product[]>;
  getProductStats(): Promise<{
    total: number;
    lowStock: number;
    outOfStock: number;
  }>;
}

// Product Category Repository Interface
export interface IProductCategoryRepository
  extends BaseRepository<
    ProductCategory,
    Omit<ProductCategory, "id" | "createdAt" | "updatedAt">
  > {
  getCategoriesWithProductCount(): Promise<
    (ProductCategory & { productCount: number })[]
  >;
}

// Product Movement Repository Interface
export interface IProductMovementRepository {
  getAll(): Promise<ProductMovement[]>;
  getByProductId(productId: string): Promise<ProductMovement[]>;
  getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<ProductMovement[]>;
  create(
    movement: Omit<ProductMovement, "id" | "createdAt" | "product">,
  ): Promise<ProductMovement>;
}

// Payment Repository Interface
export interface IPaymentRepository
  extends BaseRepository<Payment, CreatePaymentRequest> {
  getByAppointmentId(appointmentId: string): Promise<Payment[]>;
  getBySaleId(saleId: string): Promise<Payment[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Payment[]>;
  getByMethod(method: Payment["method"]): Promise<Payment[]>;
  getIncomeStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  }>;
}

// Sale Repository Interface
export interface ISaleRepository
  extends BaseRepository<
    Sale,
    Omit<Sale, "id" | "createdAt" | "updatedAt" | "items" | "payment">
  > {
  getByCustomerId(customerId: string): Promise<Sale[]>;
  getBySellerId(sellerId: string): Promise<Sale[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Sale[]>;
  createSaleWithItems(
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt" | "payment">,
    items: Omit<SaleItem, "id" | "saleId">[],
  ): Promise<Sale>;
  getSaleStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    totalAmount: number;
  }>;
}

// Abono Repository Interface
export interface IAbonoRepository
  extends BaseRepository<Abono, CreateAbonoRequest> {
  getByPatientId(patientId: string): Promise<Abono[]>;
  getActiveAbonosByPatientId(patientId: string): Promise<Abono[]>;
  useAbono(
    abonoId: string,
    amount: number,
    appointmentId?: string,
    saleId?: string,
    notes?: string,
  ): Promise<AbonoUsage>;
  getPatientAbonoBalance(patientId: string): Promise<number>;
  getAbonoUsageHistory(abonoId: string): Promise<AbonoUsage[]>;
}

// Package Repository Interface
export interface IPackageRepository
  extends BaseRepository<
    Package,
    Omit<Package, "id" | "createdAt" | "updatedAt">
  > {
  getActivePackages(): Promise<Package[]>;
}

// Patient Package Repository Interface
export interface IPatientPackageRepository
  extends BaseRepository<
    PatientPackage,
    Omit<PatientPackage, "id" | "completedAt" | "package" | "patient">
  > {
  getByPatientId(patientId: string): Promise<PatientPackage[]>;
  getActiveByPatientId(patientId: string): Promise<PatientPackage[]>;
  useSession(
    patientPackageId: string,
    appointmentId: string,
    notes?: string,
  ): Promise<PackageSession>;
  getSessionHistory(patientPackageId: string): Promise<PackageSession[]>;
}

// Aggregate repository interface for dependency injection
export interface IRepositories {
  patients: IPatientRepository;
  workers: IWorkerRepository;
  appointments: IAppointmentRepository;
  products: IProductRepository;
  productCategories: IProductCategoryRepository;
  productMovements: IProductMovementRepository;
  payments: IPaymentRepository;
  sales: ISaleRepository;
  abonos: IAbonoRepository;
  packages: IPackageRepository;
  patientPackages: IPatientPackageRepository;
}

// Repository factory interface
export interface IRepositoryFactory {
  createRepositories(): IRepositories;
}

// Repository configuration
export type RepositoryConfig = {
  type: "api" | "local" | "hybrid";
  apiBaseUrl?: string;
  apiKey?: string;
  enableLocalFallback?: boolean;
  localStoragePrefix?: string;
};
