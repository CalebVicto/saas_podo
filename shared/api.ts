// Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "worker";
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// Patient Types
export interface Patient {
  id?: any;
  documentType: "dni" | "passport";
  documentNumber: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  gender: "m" | "f";
  email?: string;
  phone?: string;
  birthDate: string;
  allergy?: string;
  diabetic?: boolean;
  hypertensive?: boolean;
  otherConditions?: string;
  firstNameNormalized?: string;
  lastNameNormalized?: string;
  balance: number;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  documentId: string;
  phone: string;
  sex: "male" | "female" | "other";
  birthDate: string;
  clinicalNotes?: string;
}

export interface UpdatePatientDto {
  documentType?: "dni" | "passport";
  documentNumber?: string;
  firstName?: string;
  paternalSurname?: string;
  maternalSurname?: string;
  gender?: "m" | "f";
  email?: string;
  phone?: string;
  birthDate?: string;
  allergy?: string;
  diabetic?: boolean;
  hypertensive?: boolean;
  otherConditions?: string;
}

export interface UpdatePatientBalanceDto {
  amount: number;
  type: "credit" | "debit";
  description?: string;
  paymentMethod: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance";
  userId: string;
}

// Worker Types
export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  specialization?: string;
  workerType?: string;
  isActive: boolean;
  hasSystemAccess?: boolean;
  systemPassword?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization?: string;
  workerType?: string;
  isActive: boolean;
  hasSystemAccess?: boolean;
  systemPassword?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  workerId: string;
  date?: string;
  treatmentNotes?: string;
  diagnosis?: string;
  treatment?: string;
  treatmentPrice?: number;
  appointmentPrice?: number;
  status: "registered" | "paid" | "canceled" | "completed" | "scheduled";
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  worker?: Worker;
  observation?: string;
  payment?: Payment;
  saleId?: string;
  products?: { id: string; name: string; price: number }[];
}

export interface CreateAppointmentRequest {
  patientId: string;
  workerId: string;
  dateTime: string;
  treatmentNotes?: string;
  diagnosis?: string;
  observation?: string;
  treatmentPrice?: number;
}

export interface ScheduleAppointmentRequest {
  patientId: string;
  workerId: string;
  date: string;
  reason: string;
  treatmentNotes?: string;
  additionalObservations?: string;
  priority: "low" | "medium" | "high";
  reminderEnabled: boolean;
  reminderDays: number;
}

export interface ScheduledAppointment extends Appointment {
  reason: string;
  priority: "low" | "medium" | "high";
  reminderEnabled: boolean;
  reminderDays: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledAppointment;
}

// Payment Types
export interface Payment {
  id: string;
  appointmentId?: string;
  saleId?: string;
  amount: number;
  method: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance";
  status: "pending" | "completed" | "failed";
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  appointmentId?: string;
  saleId?: string;
  amount: number;
  method: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance";
}

export interface PaymentStats {
  range: {
    from: string;
    to: string;
  };
  totals: {
    _id: string | null;
    amountAll: number;
    amountCompleted: number;
    countAll: number;
    countCompleted: number;
    countPending: number;
    countFailed: number;
  };
  today: {
    _id: string | null;
    amount: number;
    count: number;
  };
  byMethod: Record<string, { amount: number; count: number }>;
}

// Abonos (Partial Payments) Types
export interface Abono {
  id: string;
  patientId: string;
  amount: number;
  method: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance";
  notes?: string;
  registeredAt: string;
  usedAmount: number; // Amount already used from this abono
  remainingAmount: number; // Amount still available
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
}

export interface CreateAbonoRequest {
  patientId: string;
  amount: number;
  method: "cash" | "transfer" | "yape" | "pos" | "plin" | "balance";
  notes?: string;
}

export interface AbonoUsage {
  id: string;
  abonoId: string;
  appointmentId?: string;
  saleId?: string;
  amount: number;
  usedAt: string;
  notes?: string;
  abono?: Abono;
  appointment?: Appointment;
  sale?: Sale;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  sku?: string;
  status: "active" | "inactive";
  commission?: number; // Commission percentage for sales
  createdAt: string;
  updatedAt: string;
  category?: ProductCategory;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ProductMovement {
  id: string;
  productId: string;
  date: string;
  type: 'entrada' | 'salida';
  quantity: number;
  costUnit: number;
  totalCost: number;
  salePrice?: number;
  stockAfter: number;
  relatedTable: string;
  relatedId: string;
  userId: string;
  referenceKardexId: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

// productId
// date
// type
// quantity
// costUnit
// totalCost
// stockAfter
// relatedTable
// relatedId
// userId
// referenceKardexId
// createdAt
// updatedAt

// Simplified movement returned by the Kardex endpoint
export interface KardexMovement {
  id: string;
  productId: string;
  quantity: number;
  type: "in" | "out";
  date: string;
  userId: string;
  relatedDocument?: string;
}

// Package & Session Types
export interface Package {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  sessions?: number;
  status?: "active" | "inactive";
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientPackage {
  id: string;
  patientId: string;
  packageId: string;
  remainingSessions: number;
  purchasedAt: string;
  completedAt?: string;
  isActive: boolean;
  package?: Package;
  patient?: Patient;
}

export interface PackageSession {
  id: string;
  patientPackageId: string;
  appointmentId: string;
  usedAt: string;
  notes?: string;
  patientPackage?: PatientPackage;
  appointment?: Appointment;
}

// Sales Types
export interface Sale {
  id: string;
  saleItems: SaleItem[];
  totalAmount: number;
  patientId?: string;
  appointmentId?: string;
  appointment?: Appointment;
  sellerId: string;
  date: string;
  createdAt?: string;
  payment?: Payment;
  paymentMethod?: string;
  patient?: Patient;
  user?: Worker;
  state?: 'activa' | 'anulada';
  canceledBy?: any;
  canceledAt?: Date;
  cancelReason?: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

// Purchase Types
export interface Purchase {
  id: string;
  supplierId: string;
  userId: string;
  date: string;
  products: PurchaseItem[];
}

export interface PurchaseItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: Product;
}

// Dashboard Types
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  todayIncome: number;
  lowStockAlerts: number;
  monthlyIncomeData: MonthlyIncomeData[];
  appointmentTrends: AppointmentTrendData[];
}

export interface MonthlyIncomeData {
  month: string;
  consultations: number;
  products: number;
  total: number;
}

export interface AppointmentTrendData {
  date: string;
  appointments: number;
}

// Report Types
export interface IncomeReport {
  dateRange: {
    start: string;
    end: string;
  };
  totalIncome: number;
  incomeByWorker: WorkerIncomeData[];
  incomeByPaymentMethod: PaymentMethodIncomeData[];
  incomeByType: {
    consultations: number;
    products: number;
  };
}

export interface WorkerIncomeData {
  workerId: string;
  workerName: string;
  income: number;
  appointmentCount: number;
}

export interface PaymentMethodIncomeData {
  method: string;
  amount: number;
  count: number;
}

// Demo/Legacy Types (for compatibility)
export interface DemoResponse {
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams {
  search?: string;
  [key: string]: any;
}

export interface PaginatedSearchParams extends PaginationParams, SearchParams { }

// Patient listing data returned by the real API

export interface PatientListItem {
  id: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  gender: string;
  firstNameNormalized: string;
  lastNameNormalized: string;
  email: null;
  phone: null;
  birthDate: string;
  allergy: null;
  diabetic: boolean;
  hypertensive: boolean;
  otherConditions: string;
  balance: number;
}

export interface PatientListResponse {
  state: string;
  message: string;
  data: {
    data: Patient[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface PatientDetailStatistics {
  patient: Patient;
  appointments: Appointment[];
  sales: Sale[];
  abonos: Abono[];
  abonoUsage: AbonoUsage[];
  patientPackages: PatientPackage[];
}
