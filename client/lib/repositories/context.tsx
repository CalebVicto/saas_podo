import React, { createContext, useContext, ReactNode } from "react";
import type { IRepositories, RepositoryConfig } from "./interfaces";
import { RepositoryFactory, createDefaultRepositoryConfig } from "./factory";

// Repository Context
const RepositoryContext = createContext<IRepositories | null>(null);

// Repository Provider Props
interface RepositoryProviderProps {
  children: ReactNode;
  config?: RepositoryConfig;
  repositories?: IRepositories;
}

// Repository Provider Component
export function RepositoryProvider({
  children,
  config,
  repositories,
}: RepositoryProviderProps) {
  // Use provided repositories or create them from config
  const repos = React.useMemo(() => {
    if (repositories) {
      return repositories;
    }

    const repoConfig = config || createDefaultRepositoryConfig();
    const factory = new RepositoryFactory(repoConfig);
    return factory.createRepositories();
  }, [config, repositories]);

  return (
    <RepositoryContext.Provider value={repos}>
      {children}
    </RepositoryContext.Provider>
  );
}

// Repository Hook
export function useRepositories(): IRepositories {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error("useRepositories must be used within a RepositoryProvider");
  }
  return context;
}

// Individual repository hooks for convenience
export function usePatientRepository() {
  return useRepositories().patients;
}

export function useWorkerRepository() {
  return useRepositories().workers;
}

export function useAppointmentRepository() {
  return useRepositories().appointments;
}

export function useProductRepository() {
  return useRepositories().products;
}

export function useProductCategoryRepository() {
  return useRepositories().productCategories;
}

export function useProductMovementRepository() {
  return useRepositories().productMovements;
}

export function usePaymentRepository() {
  return useRepositories().payments;
}

export function useSaleRepository() {
  return useRepositories().sales;
}

export function useAbonoRepository() {
  return useRepositories().abonos;
}

export function usePackageRepository() {
  return useRepositories().packages;
}

export function usePatientPackageRepository() {
  return useRepositories().patientPackages;
}

// Utility hook for switching repository types at runtime
export function useRepositoryConfig() {
  const [config, setConfig] = React.useState<RepositoryConfig>(
    createDefaultRepositoryConfig(),
  );

  const switchToLocal = React.useCallback(() => {
    setConfig((prev) => ({ ...prev, type: "local" }));
  }, []);

  const switchToApi = React.useCallback(() => {
    setConfig((prev) => ({ ...prev, type: "api" }));
  }, []);

  const switchToHybrid = React.useCallback(() => {
    setConfig((prev) => ({ ...prev, type: "hybrid" }));
  }, []);

  return {
    config,
    setConfig,
    switchToLocal,
    switchToApi,
    switchToHybrid,
  };
}

// Development helper component for switching repository types
export function RepositoryDebugPanel() {
  const { config, switchToLocal, switchToApi, switchToHybrid } =
    useRepositoryConfig();

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg z-50">
      <h4 className="font-medium mb-2">Repository Mode</h4>
      <div className="flex gap-2">
        <button
          onClick={switchToLocal}
          className={`px-2 py-1 text-xs rounded ${
            config.type === "local"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          Local
        </button>
        <button
          onClick={switchToApi}
          className={`px-2 py-1 text-xs rounded ${
            config.type === "api"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          API
        </button>
        <button
          onClick={switchToHybrid}
          className={`px-2 py-1 text-xs rounded ${
            config.type === "hybrid"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          Hybrid
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Current: {config.type}
      </p>
    </div>
  );
}
