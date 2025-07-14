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
  PaginationParams,
  PaginatedSearchParams,
} from "@shared/api";

// Base repository interface for common CRUD operations
export interface BaseRepository<T, TCreate> {
  getAll(params?: PaginatedSearchParams): Promise<PaginatedResponse<T>>;
  getById(id: string): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: Partial<TCreate>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Patient Repository Interface
export interface IPatientRepository
  extends BaseRepository<Patient, CreatePatientRequest> {
  getByDocumentId(documentId: string): Promise<Patient | null>;
  searchPatients(
    params: PaginatedSearchParams,
  ): Promise<PaginatedResponse<Patient>>;
  getPatientStats(): Promise<{
    total: number;
    newThisMonth: number;
    newThisWeek: number;
  }>;
}

// Worker Repository Interface
export interface IWorkerRepository
  extends BaseRepository<Worker, CreateWorkerRequest> {
  getActiveWorkers(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Worker>>;
  getByEmail(email: string): Promise<Worker | null>;
  updateActiveStatus(id: string, isActive: boolean): Promise<Worker>;
}

// Appointment Repository Interface
export interface IAppointmentRepository
  extends BaseRepository<Appointment, CreateAppointmentRequest> {
  getByPatientId(
    patientId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Appointment>>;
  getByWorkerId(
    workerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Appointment>>;
  getByDateRange(
    startDate: string,
    endDate: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Appointment>>;
  getByStatus(
    status: Appointment["status"],
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Appointment>>;
  getTodaysAppointments(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Appointment>>;
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
  getByCategoryId(
    categoryId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Product>>;
  getActiveProducts(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Product>>;
  getLowStockProducts(
    threshold?: number,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Product>>;
  updateStock(id: string, quantity: number, reason: string): Promise<Product>;
  searchProducts(
    params: PaginatedSearchParams,
  ): Promise<PaginatedResponse<Product>>;
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
  getAll(
    params?: PaginatedSearchParams,
  ): Promise<PaginatedResponse<ProductMovement>>;
  getByProductId(
    productId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ProductMovement>>;
  getByDateRange(
    startDate: string,
    endDate: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ProductMovement>>;
  create(
    movement: Omit<ProductMovement, "id" | "createdAt" | "product">,
  ): Promise<ProductMovement>;
}

// Payment Repository Interface
export interface IPaymentRepository
  extends BaseRepository<Payment, CreatePaymentRequest> {
  getByAppointmentId(
    appointmentId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Payment>>;
  getBySaleId(
    saleId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Payment>>;
  getByDateRange(
    startDate: string,
    endDate: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Payment>>;
  getByMethod(
    method: Payment["method"],
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Payment>>;
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
  getByCustomerId(
    customerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Sale>>;
  getBySellerId(
    sellerId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Sale>>;
  getByDateRange(
    startDate: string,
    endDate: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Sale>>;
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
  getByPatientId(
    patientId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Abono>>;
  getActiveAbonosByPatientId(
    patientId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Abono>>;
  useAbono(
    abonoId: string,
    amount: number,
    appointmentId?: string,
    saleId?: string,
    notes?: string,
  ): Promise<AbonoUsage>;
  getPatientAbonoBalance(patientId: string): Promise<number>;
  getAbonoUsageHistory(
    abonoId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<AbonoUsage>>;
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
