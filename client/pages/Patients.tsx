import React, { useEffect, useMemo } from "react";
import Layout from "@/components/Layout";
import { Pagination } from "@/components/ui/pagination";
import { useRepositoryPagination } from "@/hooks/use-repository-pagination";
import { useAuth } from "@/lib/auth";
import { PatientRepository } from "@/lib/api/patient";
import type { PatientListItem } from "@shared/api";

export default function Patients() {
  const { user } = useAuth();
  const repo = useMemo(() => new PatientRepository(), []);
  const pagination = useRepositoryPagination<PatientListItem>({ initialPageSize: 10 });

  const loadPatients = async () => {
    await pagination.loadData((params) => repo.getAll(params));
  };

  useEffect(() => {
    if (!user) return;
    loadPatients();
  }, [user, pagination.currentPage, pagination.pageSize]);

  if (!user) return null;

  return (
    <Layout title="Pacientes" subtitle="Listado de pacientes">
      <div className="p-6 space-y-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2">Documento</th>
                <th className="px-3 py-2">Nombres</th>
                <th className="px-3 py-2">Apellido Paterno</th>
                <th className="px-3 py-2">Apellido Materno</th>
                <th className="px-3 py-2">Teléfono</th>
                <th className="px-3 py-2">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {pagination.data.map((p) => (
                <tr key={p.id} className="border-b last:border-none">
                  <td className="px-3 py-2 whitespace-nowrap">{p.documentNumber}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{p.firstName}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{p.paternalSurname}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{p.maternalSurname}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{p.phone}</td>
                  <td className="px-3 py-2 whitespace-nowrap">S/. {p.balance.toFixed(2)}</td>
                </tr>
              ))}
              {pagination.isLoading && (
                <tr>
                  <td className="px-3 py-2" colSpan={6}>Cargando...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalItems > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
          />
        )}
      </div>
    </Layout>
  );
}
