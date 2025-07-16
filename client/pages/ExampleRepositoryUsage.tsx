import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Building, Package, Calendar } from "lucide-react";
import {
  usePatientRepository,
  useWorkerRepository,
  useProductRepository,
  useAppointmentRepository,
} from "@/lib/repositories";
import type { Patient, Worker, Product, Appointment } from "@shared/api";
import Layout from "@/components/Layout";

// Example component demonstrating how to use repositories
const ExampleRepositoryUsage: React.FC = () => {
  // Get repositories using hooks
  const patientRepo = usePatientRepository();
  const workerRepo = useWorkerRepository();
  const productRepo = useProductRepository();
  const appointmentRepo = useAppointmentRepository();

  // Component state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load data using repositories
  const loadData = async () => {
    setLoading(true);
    try {
      // Use repositories to fetch data
      const [patientsData, workersData, productsData, appointmentsData] =
        await Promise.all([
          patientRepo.getAll(),
          workerRepo.getActiveWorkers(),
          productRepo.getActiveProducts(),
          appointmentRepo.getTodaysAppointments(),
        ]);

      setPatients(patientsData);
      setWorkers(workersData);
      setProducts(productsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality using repository
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await patientRepo.searchPatients(searchTerm);
      setPatients(searchResults);
    } catch (error) {
      console.error("Error searching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Create new patient using repository
  const handleCreatePatient = async () => {
    try {
      const newPatient = await patientRepo.create({
        documentType: "dni",
        documentNumber: `${Date.now()}`,
        firstName: "New",
        paternalSurname: "Patient",
        maternalSurname: "Demo",
        gender: "m",
        phone: "+51 999 999 999",
        birthDate: "1990-01-01",
        otherConditions: "Created via repository pattern",
        balance: 0,
      });

      setPatients([...patients, newPatient]);
    } catch (error) {
      console.error("Error creating patient:", error);
    }
  };

  // Get statistics using repository
  const [stats, setStats] = useState<{
    patientStats: any;
    appointmentStats: any;
    productStats: any;
  } | null>(null);

  const loadStats = async () => {
    try {
      const [patientStats, appointmentStats, productStats] = await Promise.all([
        patientRepo.getPatientStats(),
        appointmentRepo.getAppointmentStats(),
        productRepo.getProductStats(),
      ]);

      setStats({ patientStats, appointmentStats, productStats });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  useEffect(() => {
    loadData();
    loadStats();
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Repository Usage Example</h1>
          <Button onClick={loadData} disabled={loading}>
            Refresh Data
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.patientStats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.patientStats.newThisMonth} new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Appointments
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.appointmentStats.today}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.appointmentStats.completed} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.productStats.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.productStats.lowStock} low stock
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Workers</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workers.length}</div>
                <p className="text-xs text-muted-foreground">Active workers</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Actions */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex gap-2">
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleCreatePatient}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>

        {/* Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patients */}
          <Card>
            <CardHeader>
              <CardTitle>Patients ({patients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-12 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {patients.slice(0, 10).map((patient) => (
                    <div
                      key={patient.id}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {patient.firstName} {patient.paternalSurname} {patient.maternalSurname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.documentNumber} • {patient.phone}
                        </p>
                      </div>
                      <Badge variant="outline">{patient.sex}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle>Products ({products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {products.slice(0, 10).map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {product.stock} • S/. {product.price}
                      </p>
                    </div>
                    <Badge
                      variant={product.stock <= 5 ? "destructive" : "default"}
                    >
                      {product.stock <= 5 ? "Low Stock" : "In Stock"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repository Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use Repositories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">1. Import Repository Hooks</h4>
              <pre className="bg-muted p-2 rounded text-sm">
                {`import { usePatientRepository } from "@/lib/repositories";`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">2. Use Repository in Component</h4>
              <pre className="bg-muted p-2 rounded text-sm">
                {`const patientRepo = usePatientRepository();
const patients = await patientRepo.getAll();`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">3. Available Repository Methods</h4>
              <ul className="text-sm space-y-1 ml-4">
                <li>• getAll() - Get all items</li>
                <li>• getById(id) - Get single item</li>
                <li>• create(data) - Create new item</li>
                <li>• update(id, data) - Update item</li>
                <li>• delete(id) - Delete item</li>
                <li>• Custom methods per repository</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ExampleRepositoryUsage;
