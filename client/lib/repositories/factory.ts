import type {
  IRepositories,
  IRepositoryFactory,
  RepositoryConfig,
} from "./interfaces";

// Local repositories
import {
  LocalPatientRepository,
  LocalWorkerRepository,
  LocalAppointmentRepository,
  LocalProductRepository,
  LocalProductCategoryRepository,
  LocalProductMovementRepository,
  LocalPaymentRepository,
  LocalSaleRepository,
  LocalAbonoRepository,
  LocalPackageRepository,
  LocalPatientPackageRepository,
} from "./local";

// API repositories
import {
  ApiPatientRepository,
  ApiWorkerRepository,
  ApiAppointmentRepository,
  ApiProductRepository,
  ApiProductCategoryRepository,
  ApiProductMovementRepository,
  ApiPaymentRepository,
  ApiSaleRepository,
  ApiAbonoRepository,
  ApiPackageRepository,
  ApiPatientPackageRepository,
} from "./api";

export class RepositoryFactory implements IRepositoryFactory {
  constructor(private config: RepositoryConfig) {}

  createRepositories(): IRepositories {
    switch (this.config.type) {
      case "api":
        return this.createApiRepositories();
      case "local":
        return this.createLocalRepositories();
      case "hybrid":
        return this.createHybridRepositories();
      default:
        throw new Error(`Unknown repository type: ${this.config.type}`);
    }
  }

  private createApiRepositories(): IRepositories {
    return {
      patients: new ApiPatientRepository(this.config),
      workers: new ApiWorkerRepository(this.config),
      appointments: new ApiAppointmentRepository(this.config),
      products: new ApiProductRepository(this.config),
      productCategories: new ApiProductCategoryRepository(this.config),
      productMovements: new ApiProductMovementRepository(this.config),
      payments: new ApiPaymentRepository(this.config),
      sales: new ApiSaleRepository(this.config),
      abonos: new ApiAbonoRepository(this.config),
      packages: new ApiPackageRepository(this.config),
      patientPackages: new ApiPatientPackageRepository(this.config),
    };
  }

  private createLocalRepositories(): IRepositories {
    return {
      patients: new LocalPatientRepository(),
      workers: new LocalWorkerRepository(),
      appointments: new LocalAppointmentRepository(),
      products: new LocalProductRepository(),
      productCategories: new LocalProductCategoryRepository(),
      productMovements: new LocalProductMovementRepository(),
      payments: new LocalPaymentRepository(),
      sales: new LocalSaleRepository(),
      abonos: new LocalAbonoRepository(),
      packages: new LocalPackageRepository(),
      patientPackages: new LocalPatientPackageRepository(),
    };
  }

  private createHybridRepositories(): IRepositories {
    // In hybrid mode, we could conditionally choose repositories
    // For now, we'll default to local with API fallback capability
    const localRepos = this.createLocalRepositories();

    // TODO: Implement fallback logic when API is unavailable
    // For example, wrap each repository with a HybridRepository that tries API first, then local

    return localRepos;
  }
}

// Utility functions for repository configuration
export function createRepositoryConfig(
  type: RepositoryConfig["type"] = "local",
  options: Partial<RepositoryConfig> = {},
): RepositoryConfig {
  return {
    type,
    apiBaseUrl: options.apiBaseUrl || "/api",
    apiKey: options.apiKey,
    enableLocalFallback: options.enableLocalFallback ?? true,
    localStoragePrefix: options.localStoragePrefix || "podocare_",
    ...options,
  };
}

// Auto-detect repository type based on environment
export function autoDetectRepositoryType(): RepositoryConfig["type"] {
  // Check if we're in development and have no API endpoints
  if (process.env.NODE_ENV === "development") {
    // Try to ping the API to see if it's available
    return "local"; // Default to local for development
  }

  // In production, prefer API
  return "api";
}

// Create a default configuration
export function createDefaultRepositoryConfig(): RepositoryConfig {
  const type = autoDetectRepositoryType();

  return createRepositoryConfig(type, {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api",
    apiKey: import.meta.env.VITE_API_KEY,
    enableLocalFallback: true,
  });
}
