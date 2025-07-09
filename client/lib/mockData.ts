import {
  Patient,
  Worker,
  Appointment,
  Payment,
  Product,
  ProductCategory,
  ProductMovement,
  Package,
  PatientPackage,
  PackageSession,
  Sale,
  SaleItem,
  Abono,
  AbonoUsage,
} from "@shared/api";

// Mock Patients
export const mockPatients: Patient[] = [
  {
    id: "1",
    firstName: "María",
    lastName: "González López",
    documentId: "12345678",
    phone: "+51 987 654 321",
    sex: "female",
    birthDate: "1985-03-15",
    clinicalNotes:
      "Paciente con diabetes tipo 2. Revisar estado de uñas regularmente. Último tratamiento: eliminación de callos plantares.",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "2",
    firstName: "Carlos",
    lastName: "Rodríguez Mendez",
    documentId: "87654321",
    phone: "+51 987 123 456",
    sex: "male",
    birthDate: "1978-07-22",
    clinicalNotes:
      "Atleta amateur. Problemas recurrentes con fascitis plantar. Usa plantillas ortopédicas personalizadas.",
    createdAt: "2024-01-10T09:15:00Z",
    updatedAt: "2024-01-18T11:45:00Z",
  },
  {
    id: "3",
    firstName: "Ana",
    lastName: "García Torres",
    documentId: "11223344",
    phone: "+51 998 765 432",
    sex: "female",
    birthDate: "1992-11-08",
    clinicalNotes:
      "Uñas encarnadas recurrentes. Trabajo requiere estar de pie muchas horas. Recomendado cambio de calzado.",
    createdAt: "2024-01-05T16:20:00Z",
    updatedAt: "2024-01-22T10:15:00Z",
  },
  {
    id: "4",
    firstName: "Roberto",
    lastName: "Silva Vargas",
    documentId: "55667788",
    phone: "+51 976 543 210",
    sex: "male",
    birthDate: "1965-04-30",
    clinicalNotes:
      "Paciente mayor con callos y durezas. Circulación reducida. Tratamientos suaves recomendados.",
    createdAt: "2023-12-20T13:45:00Z",
    updatedAt: "2024-01-16T15:30:00Z",
  },
  {
    id: "5",
    firstName: "Lucía",
    lastName: "Fernández Castro",
    documentId: "99887766",
    phone: "+51 965 432 109",
    sex: "female",
    birthDate: "1988-09-12",
    clinicalNotes:
      "Hongos en uñas (onicomicosis). En tratamiento antifúngico. Control mensual requerido.",
    createdAt: "2024-01-08T12:00:00Z",
    updatedAt: "2024-01-19T09:20:00Z",
  },
];

// Mock Workers
export const mockWorkers: Worker[] = [
  {
    id: "1",
    firstName: "Dr. Patricia",
    lastName: "Morales Sánchez",
    email: "patricia.morales@podocare.com",
    phone: "+51 987 111 222",
    specialization: "Podología Quirúrgica",
    isActive: true,
    createdAt: "2023-06-01T08:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    firstName: "Carlos",
    lastName: "Rodríguez Lima",
    email: "carlos.rodriguez@podocare.com",
    phone: "+51 987 333 444",
    specialization: "Podología General",
    isActive: true,
    createdAt: "2023-08-15T09:00:00Z",
    updatedAt: "2024-01-10T14:20:00Z",
  },
  {
    id: "3",
    firstName: "Dra. Elena",
    lastName: "Vásquez Ramos",
    email: "elena.vasquez@podocare.com",
    phone: "+51 987 555 666",
    specialization: "Podología Deportiva",
    isActive: true,
    createdAt: "2023-09-01T08:30:00Z",
    updatedAt: "2024-01-12T16:45:00Z",
  },
  {
    id: "4",
    firstName: "Miguel",
    lastName: "Torres Herrera",
    email: "miguel.torres@podocare.com",
    phone: "+51 987 777 888",
    specialization: "Podología Pediátrica",
    isActive: false,
    createdAt: "2023-05-10T07:45:00Z",
    updatedAt: "2023-12-20T12:00:00Z",
  },
];

// Mock Product Categories
export const mockProductCategories: ProductCategory[] = [
  {
    id: "1",
    name: "Cremas y Lociones",
    description: "Productos tópicos para el cuidado de pies",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Antimicóticos",
    description: "Medicamentos para tratar hongos",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "3",
    name: "Desinfectantes",
    description: "Productos de limpieza y desinfección",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "4",
    name: "Instrumentos",
    description: "Herramientas e instrumentos podológicos",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "5",
    name: "Plantillas",
    description: "Plantillas ortopédicas y de soporte",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z",
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Crema Hidratante para Pies",
    description: "Crema intensiva para hidratar y suavizar la piel de los pies",
    categoryId: "1",
    price: 25.5,
    stock: 15,
    sku: "CHP001",
    bonusAmount: 5.0,
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    category: mockProductCategories[0],
  },
  {
    id: "2",
    name: "Antimicótico Tópico",
    description: "Crema antifúngica para el tratamiento de hongos en pies",
    categoryId: "2",
    price: 35.0,
    stock: 8,
    sku: "AMT002",
    bonusAmount: 8.0,
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-20T14:20:00Z",
    category: mockProductCategories[1],
  },
  {
    id: "3",
    name: "Alcohol Isopropílico 70%",
    description: "Desinfectante para instrumental y superficies",
    categoryId: "3",
    price: 12.0,
    stock: 25,
    sku: "ALC003",
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-18T09:15:00Z",
    category: mockProductCategories[2],
  },
  {
    id: "4",
    name: "Kit de Instrumentos Básicos",
    description: "Alicates, lima y cortauñas profesionales",
    categoryId: "4",
    price: 120.0,
    stock: 5,
    sku: "KIT004",
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-10T16:45:00Z",
    category: mockProductCategories[3],
  },
  {
    id: "5",
    name: "Plantillas Ortopédicas",
    description: "Plantillas de gel para soporte y comodidad",
    categoryId: "5",
    price: 45.0,
    stock: 12,
    sku: "PLT005",
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-12T11:30:00Z",
    category: mockProductCategories[4],
  },
  {
    id: "6",
    name: "Loción Exfoliante",
    description: "Loción para eliminar células muertas y suavizar callos",
    categoryId: "1",
    price: 28.0,
    stock: 3,
    sku: "LEX006",
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-22T08:45:00Z",
    category: mockProductCategories[0],
  },
  {
    id: "7",
    name: "Spray Antimicótico",
    description: "Spray para prevenir y tratar hongos en pies y calzado",
    categoryId: "2",
    price: 18.5,
    stock: 20,
    sku: "SAM007",
    isActive: true,
    createdAt: "2023-06-01T00:00:00Z",
    updatedAt: "2024-01-16T13:20:00Z",
    category: mockProductCategories[1],
  },
];

// Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientId: "1",
    workerId: "1",
    dateTime: "2024-01-25T09:00:00Z",
    duration: 60,
    treatmentNotes: "Tratamiento de callos plantares y revisión general",
    diagnosis: "Hiperqueratosis plantar bilateral",
    status: "completed",
    createdAt: "2024-01-20T10:00:00Z",
    updatedAt: "2024-01-25T10:00:00Z",
    patient: mockPatients[0],
    worker: mockWorkers[0],
  },
  {
    id: "2",
    patientId: "2",
    workerId: "2",
    dateTime: "2024-01-25T11:30:00Z",
    duration: 45,
    treatmentNotes: "Revisión de fascitis plantar y ajuste de plantillas",
    diagnosis: "Fascitis plantar crónica",
    status: "completed",
    createdAt: "2024-01-22T14:30:00Z",
    updatedAt: "2024-01-25T12:15:00Z",
    patient: mockPatients[1],
    worker: mockWorkers[1],
  },
  {
    id: "3",
    patientId: "3",
    workerId: "1",
    dateTime: "2024-01-26T10:00:00Z",
    duration: 30,
    treatmentNotes: "Tratamiento de uña encarnada",
    diagnosis: "Onicocriptosis en hallux derecho",
    status: "scheduled",
    createdAt: "2024-01-24T09:15:00Z",
    updatedAt: "2024-01-24T09:15:00Z",
    patient: mockPatients[2],
    worker: mockWorkers[0],
  },
  {
    id: "4",
    patientId: "4",
    workerId: "3",
    dateTime: "2024-01-26T14:00:00Z",
    duration: 60,
    treatmentNotes: "Limpieza general y tratamiento de durezas",
    status: "scheduled",
    createdAt: "2024-01-23T16:20:00Z",
    updatedAt: "2024-01-23T16:20:00Z",
    patient: mockPatients[3],
    worker: mockWorkers[2],
  },
  {
    id: "5",
    patientId: "5",
    workerId: "2",
    dateTime: "2024-01-27T09:30:00Z",
    duration: 45,
    treatmentNotes: "Control de tratamiento antimicótico",
    diagnosis: "Onicomicosis en tratamiento",
    status: "scheduled",
    createdAt: "2024-01-24T11:45:00Z",
    updatedAt: "2024-01-24T11:45:00Z",
    patient: mockPatients[4],
    worker: mockWorkers[1],
  },
];

// Mock Payments
export const mockPayments: Payment[] = [
  {
    id: "1",
    appointmentId: "1",
    amount: 80.0,
    method: "cash",
    status: "completed",
    paidAt: "2024-01-25T10:00:00Z",
    createdAt: "2024-01-25T10:00:00Z",
    updatedAt: "2024-01-25T10:00:00Z",
  },
  {
    id: "2",
    appointmentId: "2",
    amount: 65.0,
    method: "yape",
    status: "completed",
    paidAt: "2024-01-25T12:15:00Z",
    createdAt: "2024-01-25T12:15:00Z",
    updatedAt: "2024-01-25T12:15:00Z",
  },
  {
    id: "3",
    saleId: "1",
    amount: 25.5,
    method: "card",
    status: "completed",
    paidAt: "2024-01-24T15:30:00Z",
    createdAt: "2024-01-24T15:30:00Z",
    updatedAt: "2024-01-24T15:30:00Z",
  },
  {
    id: "4",
    saleId: "2",
    amount: 53.5,
    method: "transfer",
    status: "completed",
    paidAt: "2024-01-23T11:20:00Z",
    createdAt: "2024-01-23T11:20:00Z",
    updatedAt: "2024-01-23T11:20:00Z",
  },
];

// Mock Sales
export const mockSales: Sale[] = [
  {
    id: "1",
    items: [],
    totalAmount: 25.5,
    customerId: "1",
    sellerId: "1",
    createdAt: "2024-01-24T15:30:00Z",
    updatedAt: "2024-01-24T15:30:00Z",
  },
  {
    id: "2",
    items: [],
    totalAmount: 53.5,
    customerId: "3",
    sellerId: "2",
    createdAt: "2024-01-23T11:20:00Z",
    updatedAt: "2024-01-23T11:20:00Z",
  },
];

// Mock Sale Items
export const mockSaleItems: SaleItem[] = [
  {
    id: "1",
    saleId: "1",
    productId: "1",
    quantity: 1,
    unitPrice: 25.5,
    totalPrice: 25.5,
    product: mockProducts[0],
  },
  {
    id: "2",
    saleId: "2",
    productId: "2",
    quantity: 1,
    unitPrice: 35.0,
    totalPrice: 35.0,
    product: mockProducts[1],
  },
  {
    id: "3",
    saleId: "2",
    productId: "7",
    quantity: 1,
    unitPrice: 18.5,
    totalPrice: 18.5,
    product: mockProducts[6],
  },
];

// Update sales with items
mockSales[0].items = [mockSaleItems[0]];
mockSales[1].items = [mockSaleItems[1], mockSaleItems[2]];

// Add payments to appointments
mockAppointments[0].payment = mockPayments[0];
mockAppointments[1].payment = mockPayments[1];

// Add payments to sales
mockSales[0].payment = mockPayments[2];
mockSales[1].payment = mockPayments[3];

// Mock Product Movements (Kardex)
export const mockProductMovements: ProductMovement[] = [
  {
    id: "1",
    productId: "1",
    type: "entry",
    quantity: 20,
    reason: "Compra inicial",
    previousStock: 0,
    newStock: 20,
    createdAt: "2024-01-01T08:00:00Z",
    createdBy: "admin@podocare.com",
    product: mockProducts[0],
  },
  {
    id: "2",
    productId: "1",
    type: "exit",
    quantity: 5,
    reason: "Venta",
    previousStock: 20,
    newStock: 15,
    reference: "1",
    createdAt: "2024-01-15T14:30:00Z",
    createdBy: "worker@podocare.com",
    product: mockProducts[0],
  },
  {
    id: "3",
    productId: "2",
    type: "entry",
    quantity: 15,
    reason: "Reposición de stock",
    previousStock: 0,
    newStock: 15,
    createdAt: "2024-01-01T08:00:00Z",
    createdBy: "admin@podocare.com",
    product: mockProducts[1],
  },
  {
    id: "4",
    productId: "2",
    type: "exit",
    quantity: 7,
    reason: "Venta múltiple",
    previousStock: 15,
    newStock: 8,
    reference: "2",
    createdAt: "2024-01-20T11:15:00Z",
    createdBy: "worker@podocare.com",
    product: mockProducts[1],
  },
  {
    id: "5",
    productId: "3",
    type: "entry",
    quantity: 30,
    reason: "Compra mayorista",
    previousStock: 0,
    newStock: 30,
    createdAt: "2024-01-01T08:00:00Z",
    createdBy: "admin@podocare.com",
    product: mockProducts[2],
  },
  {
    id: "6",
    productId: "3",
    type: "exit",
    quantity: 5,
    reason: "Uso interno",
    previousStock: 30,
    newStock: 25,
    createdAt: "2024-01-10T09:30:00Z",
    createdBy: "admin@podocare.com",
    product: mockProducts[2],
  },
  {
    id: "7",
    productId: "6",
    type: "entry",
    quantity: 10,
    reason: "Compra inicial",
    previousStock: 0,
    newStock: 10,
    createdAt: "2024-01-01T08:00:00Z",
    createdBy: "admin@podocare.com",
    product: mockProducts[5],
  },
  {
    id: "8",
    productId: "6",
    type: "exit",
    quantity: 7,
    reason: "Ventas varias",
    previousStock: 10,
    newStock: 3,
    createdAt: "2024-01-22T15:45:00Z",
    createdBy: "worker@podocare.com",
    product: mockProducts[5],
  },
];

// Mock Packages
export const mockPackages: Package[] = [
  {
    id: "1",
    name: "Podology Starter Pack",
    numberOfSessions: 3,
    totalPrice: 120.0,
    notes:
      "Paquete inicial de podología con evaluación completa y tratamiento básico",
    isActive: true,
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-01T08:00:00Z",
  },
  {
    id: "2",
    name: "Advanced Therapy",
    numberOfSessions: 6,
    totalPrice: 200.0,
    notes: "Terapia avanzada para tratamientos especializados y complejos",
    isActive: true,
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-01T08:00:00Z",
  },
  {
    id: "3",
    name: "Foot Massage Combo",
    numberOfSessions: 5,
    totalPrice: 150.0,
    notes: "Combinación de masajes terapéuticos y tratamientos relajantes",
    isActive: true,
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-01T08:00:00Z",
  },
];

// Mock Patient Packages
export const mockPatientPackages: PatientPackage[] = [
  {
    id: "1",
    patientId: "1",
    packageId: "1",
    remainingSessions: 2,
    purchasedAt: "2024-01-15T10:00:00Z",
    isActive: true,
    package: mockPackages[0],
    patient: mockPatients[0],
  },
  {
    id: "2",
    patientId: "2",
    packageId: "2",
    remainingSessions: 4,
    purchasedAt: "2024-01-10T14:00:00Z",
    isActive: true,
    package: mockPackages[1],
    patient: mockPatients[1],
  },
  {
    id: "3",
    patientId: "3",
    packageId: "3",
    remainingSessions: 3,
    purchasedAt: "2024-01-05T09:00:00Z",
    isActive: true,
    package: mockPackages[2],
    patient: mockPatients[2],
  },
];

// Mock Package Sessions
export const mockPackageSessions: PackageSession[] = [
  {
    id: "1",
    patientPackageId: "1",
    appointmentId: "1",
    usedAt: "2024-01-15T14:30:00Z",
    notes: "Primera sesión - evaluación inicial",
    patientPackage: mockPatientPackages[0],
    appointment: mockAppointments[0],
  },
  {
    id: "2",
    patientPackageId: "1",
    appointmentId: "2",
    usedAt: "2024-01-20T11:15:00Z",
    notes: "Segunda sesión - inicio del tratamiento",
    patientPackage: mockPatientPackages[0],
    appointment: mockAppointments[1],
  },
  {
    id: "3",
    patientPackageId: "2",
    appointmentId: "3",
    usedAt: "2024-01-18T09:45:00Z",
    notes: "Primera sesión de cuidado de uñas",
    patientPackage: mockPatientPackages[1],
    appointment: mockAppointments[2],
  },
];

// All mock data is already exported above, no need to re-export

// Helper functions for mock data management
export const getMockPatients = () => [...mockPatients];
export const getMockWorkers = () => mockWorkers.filter((w) => w.isActive);
export const getAllMockWorkers = () => [...mockWorkers];
export const getMockProducts = () => mockProducts.filter((p) => p.isActive);
export const getAllMockProducts = () => [...mockProducts];
export const getMockAppointments = () => [...mockAppointments];
export const getMockPayments = () => [...mockPayments];
export const getMockSales = () => [...mockSales];
export const getMockProductCategories = () => [...mockProductCategories];

// Statistics helpers
export const getPatientStats = () => ({
  total: mockPatients.length,
  newThisMonth: mockPatients.filter(
    (p) => new Date(p.createdAt).getMonth() === new Date().getMonth(),
  ).length,
});

export const getAppointmentStats = () => {
  const today = new Date().toDateString();
  const todayAppointments = mockAppointments.filter(
    (a) => new Date(a.dateTime).toDateString() === today,
  );

  return {
    today: todayAppointments.length,
    completed: todayAppointments.filter((a) => a.status === "completed").length,
    scheduled: todayAppointments.filter((a) => a.status === "scheduled").length,
    total: mockAppointments.length,
  };
};

export const getIncomeStats = () => {
  const today = new Date().toDateString();
  const todayPayments = mockPayments.filter(
    (p) => p.paidAt && new Date(p.paidAt).toDateString() === today,
  );

  return {
    today: todayPayments.reduce((sum, p) => sum + p.amount, 0),
    total: mockPayments.reduce((sum, p) => sum + p.amount, 0),
    thisMonth: mockPayments
      .filter(
        (p) =>
          p.paidAt && new Date(p.paidAt).getMonth() === new Date().getMonth(),
      )
      .reduce((sum, p) => sum + p.amount, 0),
  };
};

export const getProductStats = () => ({
  total: mockProducts.length,
  lowStock: mockProducts.filter((p) => p.stock <= 5).length,
  outOfStock: mockProducts.filter((p) => p.stock === 0).length,
});
