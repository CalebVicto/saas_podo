// Re-export all repository interfaces and implementations
export * from "./interfaces";
export * from "./factory";
export * from "./context";

// Re-export specific repositories for direct imports
export { LocalPatientRepository } from "./local/patient";
export { LocalWorkerRepository } from "./local/worker";
export { LocalAppointmentRepository } from "./local/appointment";
export { LocalProductRepository } from "./local/product";
export * from "./local";
export * from "./api";
