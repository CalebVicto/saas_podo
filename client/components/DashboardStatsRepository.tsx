import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import {
  usePatientRepository,
  useAppointmentRepository,
  usePaymentRepository,
  useProductRepository,
} from "@/lib/repositories";

// Simple component demonstrating repository usage for dashboard stats
export const DashboardStatsRepository: React.FC = () => {
  const patientRepo = usePatientRepository();
  const appointmentRepo = useAppointmentRepository();
  const paymentRepo = usePaymentRepository();
  const productRepo = useProductRepository();

  const [stats, setStats] = useState({
    patients: { total: 0, newThisMonth: 0 },
    appointments: { today: 0, completed: 0, scheduled: 0 },
    income: { today: 0, thisMonth: 0 },
    products: { lowStock: 0, outOfStock: 0 },
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Use repositories to get real-time stats
      const [patientStats, appointmentStats, incomeStats, productStats] =
        await Promise.all([
          patientRepo.getPatientStats(),
          appointmentRepo.getAppointmentStats(),
          paymentRepo.getIncomeStats(),
          productRepo.getProductStats(),
        ]);

      setStats({
        patients: patientStats,
        appointments: appointmentStats,
        income: incomeStats,
        products: productStats,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-20" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.patients.total}</div>
          <p className="text-xs text-muted-foreground">
            +{stats.patients.newThisMonth} this month
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
          <div className="text-2xl font-bold">{stats.appointments.today}</div>
          <p className="text-xs text-muted-foreground">
            {stats.appointments.completed} completed,{" "}
            {stats.appointments.scheduled} scheduled
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Income</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            S/. {stats.income.today.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            S/. {stats.income.thisMonth.toFixed(2)} this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.products.lowStock}</div>
          <p className="text-xs text-muted-foreground">
            {stats.products.outOfStock} out of stock
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Example of how you would replace the old stats in Dashboard.tsx:
//
// Old way (in Dashboard.tsx):
// const mockStats: DashboardStats = { ... };
//
// New way (in Dashboard.tsx):
// import { DashboardStatsRepository } from "@/components/DashboardStatsRepository";
//
// Then replace the stats cards with:
// <DashboardStatsRepository />
//
// Benefits:
// - Real-time data from repositories
// - Automatic loading states
// - Error handling
// - Easy to test by mocking repositories
// - Consistent data access pattern
