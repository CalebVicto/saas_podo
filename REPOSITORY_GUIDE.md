# Repository Pattern Implementation Guide

This guide shows how to use the centralized Repository Pattern implemented in this application.

## Overview

The Repository Pattern provides a centralized, clean way to access data by abstracting the data layer. You can easily switch between API calls, local storage, or any other data source without changing your component logic.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│   Repositories   │───▶│  Data Sources   │
│                 │    │   (Interfaces)   │    │ API/LocalStorage│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Using Repository Hooks in Components

```tsx
import {
  usePatientRepository,
  useAppointmentRepository,
} from "@/lib/repositories";

const MyComponent = () => {
  const patientRepo = usePatientRepository();
  const appointmentRepo = useAppointmentRepository();

  const [patients, setPatients] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const allPatients = await patientRepo.getAll();
      setPatients(allPatients);
    };
    loadData();
  }, []);

  return (
    <div>
      {patients.map((patient) => (
        <div key={patient.id}>{patient.firstName}</div>
      ))}
    </div>
  );
};
```

### 2. Available Repository Hooks

```tsx
// Core entity repositories
import {
  usePatientRepository,
  useWorkerRepository,
  useAppointmentRepository,
  useProductRepository,
  useProductCategoryRepository,
  usePaymentRepository,
  useSaleRepository,
  useAbonoRepository,
  usePackageRepository,
  usePatientPackageRepository,
} from "@/lib/repositories";

// Or get all repositories at once
import { useRepositories } from "@/lib/repositories";

const MyComponent = () => {
  const { patients, appointments, products } = useRepositories();
  // Use patients, appointments, products repositories
};
```

## Common Repository Methods

### Base CRUD Operations (Available on all repositories)

```tsx
const patientRepo = usePatientRepository();

// Get all items
const patients = await patientRepo.getAll();

// Get single item
const patient = await patientRepo.getById("patient-id");

// Create new item
const newPatient = await patientRepo.create({
  firstName: "John",
  lastName: "Doe",
  documentId: "12345678",
  phone: "+51 999 999 999",
  sex: "male",
  birthDate: "1990-01-01",
});

// Update existing item
const updatedPatient = await patientRepo.update("patient-id", {
  firstName: "Jane",
});

// Delete item
await patientRepo.delete("patient-id");
```

### Repository-Specific Methods

Each repository has additional methods specific to its domain:

```tsx
// Patient Repository
const patientRepo = usePatientRepository();
const patient = await patientRepo.getByDocumentId("12345678");
const searchResults = await patientRepo.searchPatients("john");
const stats = await patientRepo.getPatientStats();

// Appointment Repository
const appointmentRepo = useAppointmentRepository();
const todayAppointments = await appointmentRepo.getTodaysAppointments();
const patientAppointments = await appointmentRepo.getByPatientId("patient-id");
await appointmentRepo.updateStatus("appointment-id", "completed");

// Product Repository
const productRepo = useProductRepository();
const activeProducts = await productRepo.getActiveProducts();
const lowStockProducts = await productRepo.getLowStockProducts(5);
await productRepo.updateStock("product-id", -1, "Sale");

// Payment Repository
const paymentRepo = usePaymentRepository();
const incomeStats = await paymentRepo.getIncomeStats();
const appointmentPayments =
  await paymentRepo.getByAppointmentId("appointment-id");
```

## Converting Existing Components

### Before (Old Pattern)

```tsx
import { getMockPatients } from "@/lib/mockData";

const MyComponent = () => {
  const [patients, setPatients] = useState([]);

  const loadPatients = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    const mockPatients = getMockPatients();
    setPatients(mockPatients);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Rest of component...
};
```

### After (Repository Pattern)

```tsx
import { usePatientRepository } from "@/lib/repositories";

const MyComponent = () => {
  const patientRepo = usePatientRepository();
  const [patients, setPatients] = useState([]);

  const loadPatients = async () => {
    const allPatients = await patientRepo.getAll();
    setPatients(allPatients);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Rest of component...
};
```

## Repository Configuration

### Switching Data Sources

The app can switch between different data sources:

```tsx
// In App.tsx or root component
import { RepositoryProvider, createRepositoryConfig } from "@/lib/repositories";

// Local storage (default for development)
const localConfig = createRepositoryConfig("local");

// API endpoints
const apiConfig = createRepositoryConfig("api", {
  apiBaseUrl: "/api",
  apiKey: "your-api-key",
});

// Hybrid (API with local fallback)
const hybridConfig = createRepositoryConfig("hybrid", {
  apiBaseUrl: "/api",
  enableLocalFallback: true,
});

<RepositoryProvider config={localConfig}>
  <App />
</RepositoryProvider>;
```

### Environment-Based Configuration

The system automatically detects the appropriate repository type:

- **Development**: Uses local storage with mock data
- **Production**: Uses API endpoints
- **Testing**: Can easily mock repositories

## Error Handling

```tsx
const MyComponent = () => {
  const patientRepo = usePatientRepository();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const allPatients = await patientRepo.getAll();
      setPatients(allPatients);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle loading and error states...
};
```

## Testing with Repositories

Repositories make testing much easier:

```tsx
// In your test file
import { render } from "@testing-library/react";
import { RepositoryProvider } from "@/lib/repositories";
import MyComponent from "./MyComponent";

// Mock repository
const mockPatientRepo = {
  getAll: jest
    .fn()
    .mockResolvedValue([{ id: "1", firstName: "Test", lastName: "Patient" }]),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  // ... other methods
};

const mockRepositories = {
  patients: mockPatientRepo,
  // ... other repos
};

test("renders patients correctly", () => {
  render(
    <RepositoryProvider repositories={mockRepositories}>
      <MyComponent />
    </RepositoryProvider>,
  );

  // Assert component behavior
});
```

## Development Tools

### Repository Debug Panel

In development mode, use the debug panel to switch between repository types:

```tsx
import { RepositoryDebugPanel } from "@/lib/repositories";

// Already included in App.tsx
<RepositoryDebugPanel />;
```

This adds a floating panel in the bottom-right corner to switch between:

- Local Storage
- API
- Hybrid

### Example Component

Visit `/repository-example` in the app to see a comprehensive example of repository usage.

## Best Practices

1. **Always use repository hooks** instead of direct imports
2. **Handle loading and error states** in your components
3. **Use repository-specific methods** when available (e.g., `searchPatients` instead of filtering `getAll`)
4. **Keep components focused on UI logic** - let repositories handle data concerns
5. **Use TypeScript** for type safety across the data layer

## Migration Checklist

When converting existing components to use repositories:

- [ ] Replace `import { getMockData } from "@/lib/mockData"` with repository hooks
- [ ] Remove manual API fetch logic
- [ ] Replace direct mock data calls with repository methods
- [ ] Add proper error handling
- [ ] Update loading states to use repository promises
- [ ] Test component with different repository types

## Benefits

✅ **Clean Architecture**: Separation of concerns between UI and data access  
✅ **Easy Testing**: Mock repositories for unit tests  
✅ **Flexible Data Sources**: Switch between API, local storage, or mock data  
✅ **Type Safety**: Full TypeScript support across data layer  
✅ **Consistent API**: Same interface for all data operations  
✅ **Error Handling**: Centralized error handling patterns  
✅ **Development Tools**: Debug panel for switching data sources

This Repository Pattern implementation provides a solid foundation for scalable, maintainable data access in your React application.
