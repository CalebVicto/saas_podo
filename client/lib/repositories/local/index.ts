import type {
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
  IProductCategoryRepository,
  IProductMovementRepository,
  IPaymentRepository,
  ISaleRepository,
  IAbonoRepository,
  IPackageRepository,
  IPatientPackageRepository,
} from "../interfaces";
import { LocalStorageBaseRepository } from "./base";
import {
  mockProductCategories,
  mockProductMovements,
  mockPayments,
  mockSales,
  mockAbonos,
  mockAbonoUsage,
  mockPackages,
  mockPatientPackages,
  mockPackageSessions,
} from "../../mockData";

// Product Category Repository
export class LocalProductCategoryRepository
  extends LocalStorageBaseRepository<
    ProductCategory,
    Omit<ProductCategory, "id" | "createdAt" | "updatedAt">
  >
  implements IProductCategoryRepository
{
  constructor() {
    super("podocare_product_categories", mockProductCategories);
  }

  async getCategoriesWithProductCount(): Promise<
    (ProductCategory & { productCount: number })[]
  > {
    await this.simulateNetworkDelay();
    const categories = this.loadFromStorage();
    const products = JSON.parse(
      localStorage.getItem("podocare_products") || "[]",
    );

    return categories.map((category) => ({
      ...category,
      productCount: products.filter(
        (p: any) => p.categoryId === category.id && p.isActive,
      ).length,
    }));
  }
}

// Product Movement Repository
export class LocalProductMovementRepository
  implements IProductMovementRepository
{
  private storageKey = "podocare_product_movements";

  constructor() {
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(mockProductMovements),
      );
    }
  }

  private simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  async getAll(): Promise<ProductMovement[]> {
    await this.simulateNetworkDelay();
    return JSON.parse(localStorage.getItem(this.storageKey) || "[]");
  }

  async getByProductId(productId: string): Promise<ProductMovement[]> {
    await this.simulateNetworkDelay();
    const movements = await this.getAll();
    return movements.filter((m) => m.productId === productId);
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<ProductMovement[]> {
    await this.simulateNetworkDelay();
    const movements = await this.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);

    return movements.filter((m) => {
      const moveDate = new Date(m.createdAt);
      return moveDate >= start && moveDate <= end;
    });
  }

  async create(
    movement: Omit<ProductMovement, "id" | "createdAt" | "product">,
  ): Promise<ProductMovement> {
    await this.simulateNetworkDelay();
    const movements = await this.getAll();
    const newMovement: ProductMovement = {
      ...movement,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    movements.push(newMovement);
    localStorage.setItem(this.storageKey, JSON.stringify(movements));
    return newMovement;
  }
}

// Payment Repository
export class LocalPaymentRepository
  extends LocalStorageBaseRepository<Payment, CreatePaymentRequest>
  implements IPaymentRepository
{
  constructor() {
    super("podocare_payments", mockPayments);
  }

  async getByAppointmentId(appointmentId: string): Promise<Payment[]> {
    return this.findByField("appointmentId", appointmentId);
  }

  async getBySaleId(saleId: string): Promise<Payment[]> {
    return this.findByField("saleId", saleId);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    await this.simulateNetworkDelay();
    const payments = this.loadFromStorage();
    return payments.filter((p) => {
      if (!p.paidAt) return false;
      const paidDate = new Date(p.paidAt);
      return paidDate >= new Date(startDate) && paidDate <= new Date(endDate);
    });
  }

  async getByMethod(method: Payment["method"]): Promise<Payment[]> {
    return this.findByField("method", method);
  }

  async getIncomeStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  }> {
    await this.simulateNetworkDelay();
    const payments = this.loadFromStorage().filter(
      (p) => p.status === "completed",
    );
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      today: payments
        .filter((p) => p.paidAt && new Date(p.paidAt) >= today)
        .reduce((sum, p) => sum + p.amount, 0),
      thisWeek: payments
        .filter((p) => p.paidAt && new Date(p.paidAt) >= thisWeek)
        .reduce((sum, p) => sum + p.amount, 0),
      thisMonth: payments
        .filter((p) => p.paidAt && new Date(p.paidAt) >= thisMonth)
        .reduce((sum, p) => sum + p.amount, 0),
      total: payments.reduce((sum, p) => sum + p.amount, 0),
    };
  }
}

// Sale Repository
export class LocalSaleRepository
  extends LocalStorageBaseRepository<
    Sale,
    Omit<Sale, "id" | "createdAt" | "updatedAt" | "items" | "payment">
  >
  implements ISaleRepository
{
  constructor() {
    super("podocare_sales", mockSales);
  }

  async getByCustomerId(customerId: string): Promise<Sale[]> {
    return this.findByField("customerId", customerId);
  }

  async getBySellerId(sellerId: string): Promise<Sale[]> {
    return this.findByField("sellerId", sellerId);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    await this.simulateNetworkDelay();
    const sales = this.loadFromStorage();
    return this.filterByDateRange(sales, startDate, endDate, "createdAt");
  }

  async createSaleWithItems(
    sale: Omit<Sale, "id" | "createdAt" | "updatedAt" | "payment">,
    items: Omit<SaleItem, "id" | "saleId">[],
  ): Promise<Sale> {
    await this.simulateNetworkDelay();
    const newSale = await this.create(sale);

    // Store sale items separately
    const saleItemsKey = "podocare_sale_items";
    const existingItems = JSON.parse(
      localStorage.getItem(saleItemsKey) || "[]",
    );

    const newItems = items.map((item) => ({
      ...item,
      id: this.generateId(),
      saleId: newSale.id,
    }));

    localStorage.setItem(
      saleItemsKey,
      JSON.stringify([...existingItems, ...newItems]),
    );

    return {
      ...newSale,
      items: newItems,
    };
  }

  async getSaleStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    totalAmount: number;
  }> {
    await this.simulateNetworkDelay();
    const sales = this.loadFromStorage();
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      today: sales.filter((s) => new Date(s.createdAt) >= today).length,
      thisWeek: sales.filter((s) => new Date(s.createdAt) >= thisWeek).length,
      thisMonth: sales.filter((s) => new Date(s.createdAt) >= thisMonth).length,
      total: sales.length,
      totalAmount: sales.reduce((sum, s) => sum + s.totalAmount, 0),
    };
  }
}

// Abono Repository
export class LocalAbonoRepository
  extends LocalStorageBaseRepository<Abono, CreateAbonoRequest>
  implements IAbonoRepository
{
  constructor() {
    super("podocare_abonos", mockAbonos);
  }

  async getByPatientId(patientId: string): Promise<Abono[]> {
    return this.findByField("patientId", patientId);
  }

  async getActiveAbonosByPatientId(patientId: string): Promise<Abono[]> {
    await this.simulateNetworkDelay();
    const abonos = await this.getByPatientId(patientId);
    return abonos.filter((a) => a.isActive && a.remainingAmount > 0);
  }

  async useAbono(
    abonoId: string,
    amount: number,
    appointmentId?: string,
    saleId?: string,
    notes?: string,
  ): Promise<AbonoUsage> {
    await this.simulateNetworkDelay();
    const abono = await this.getById(abonoId);
    if (!abono) {
      throw new Error(`Abono with id ${abonoId} not found`);
    }

    if (amount > abono.remainingAmount) {
      throw new Error("Insufficient abono balance");
    }

    // Update abono balance
    const newRemainingAmount = abono.remainingAmount - amount;
    const newUsedAmount = abono.usedAmount + amount;
    await this.update(abonoId, {
      usedAmount: newUsedAmount,
      remainingAmount: newRemainingAmount,
      isActive: newRemainingAmount > 0,
    });

    // Create usage record
    const usageKey = "podocare_abono_usage";
    const existingUsage = JSON.parse(localStorage.getItem(usageKey) || "[]");
    const newUsage: AbonoUsage = {
      id: this.generateId(),
      abonoId,
      appointmentId,
      saleId,
      amount,
      usedAt: new Date().toISOString(),
      notes,
    };

    localStorage.setItem(
      usageKey,
      JSON.stringify([...existingUsage, newUsage]),
    );
    return newUsage;
  }

  async getPatientAbonoBalance(patientId: string): Promise<number> {
    const activeAbonos = await this.getActiveAbonosByPatientId(patientId);
    return activeAbonos.reduce(
      (total, abono) => total + abono.remainingAmount,
      0,
    );
  }

  async getAbonoUsageHistory(abonoId: string): Promise<AbonoUsage[]> {
    await this.simulateNetworkDelay();
    const usageKey = "podocare_abono_usage";
    const allUsage: AbonoUsage[] = JSON.parse(
      localStorage.getItem(usageKey) || "[]",
    );
    return allUsage.filter((usage) => usage.abonoId === abonoId);
  }
}

// Package Repository
export class LocalPackageRepository
  extends LocalStorageBaseRepository<
    Package,
    Omit<Package, "id" | "createdAt" | "updatedAt">
  >
  implements IPackageRepository
{
  constructor() {
    super("podocare_packages", mockPackages);
  }

  async getActivePackages(): Promise<Package[]> {
    await this.simulateNetworkDelay();
    const packages = this.loadFromStorage();
    return packages.filter((p) => p.isActive);
  }
}

// Patient Package Repository
export class LocalPatientPackageRepository
  extends LocalStorageBaseRepository<
    PatientPackage,
    Omit<PatientPackage, "id" | "completedAt" | "package" | "patient">
  >
  implements IPatientPackageRepository
{
  constructor() {
    super("podocare_patient_packages", mockPatientPackages);
  }

  async getByPatientId(patientId: string): Promise<PatientPackage[]> {
    return this.findByField("patientId", patientId);
  }

  async getActiveByPatientId(patientId: string): Promise<PatientPackage[]> {
    await this.simulateNetworkDelay();
    const packages = await this.getByPatientId(patientId);
    return packages.filter((p) => p.isActive && p.remainingSessions > 0);
  }

  async useSession(
    patientPackageId: string,
    appointmentId: string,
    notes?: string,
  ): Promise<PackageSession> {
    await this.simulateNetworkDelay();
    const patientPackage = await this.getById(patientPackageId);
    if (!patientPackage) {
      throw new Error(`Patient package with id ${patientPackageId} not found`);
    }

    if (patientPackage.remainingSessions <= 0) {
      throw new Error("No remaining sessions in this package");
    }

    // Update remaining sessions
    const newRemainingSessions = patientPackage.remainingSessions - 1;
    await this.update(patientPackageId, {
      remainingSessions: newRemainingSessions,
      completedAt:
        newRemainingSessions === 0 ? new Date().toISOString() : undefined,
    });

    // Create session record
    const sessionsKey = "podocare_package_sessions";
    const existingSessions = JSON.parse(
      localStorage.getItem(sessionsKey) || "[]",
    );
    const newSession: PackageSession = {
      id: this.generateId(),
      patientPackageId,
      appointmentId,
      usedAt: new Date().toISOString(),
      notes,
    };

    localStorage.setItem(
      sessionsKey,
      JSON.stringify([...existingSessions, newSession]),
    );
    return newSession;
  }

  async getSessionHistory(patientPackageId: string): Promise<PackageSession[]> {
    await this.simulateNetworkDelay();
    const sessionsKey = "podocare_package_sessions";
    const allSessions: PackageSession[] = JSON.parse(
      localStorage.getItem(sessionsKey) || "[]",
    );
    return allSessions.filter(
      (session) => session.patientPackageId === patientPackageId,
    );
  }
}

// Export all repositories
export { LocalPatientRepository } from "./patient";
export { LocalWorkerRepository } from "./worker";
export { LocalAppointmentRepository } from "./appointment";
export { LocalProductRepository } from "./product";
