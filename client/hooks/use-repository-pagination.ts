import { useState, useEffect, useCallback } from "react";
import type { PaginatedResponse, PaginatedSearchParams } from "@shared/api";

export interface UseRepositoryPaginationProps {
  initialPageSize?: number;
  initialPage?: number;
}

export interface UseRepositoryPaginationReturn<T> {
  // Data
  data: T[];
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  // Pagination state
  currentPage: number;
  pageSize: number;

  // Search and filters
  searchTerm: string;
  filters: Record<string, any>;

  // Actions
  setSearchTerm: (search: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  refresh: () => void;

  // For manual data loading
  loadData: (
    fetchFunction: (
      params: PaginatedSearchParams,
    ) => Promise<PaginatedResponse<T>>,
  ) => Promise<void>;
}

export function useRepositoryPagination<T>({
  initialPageSize = 15,
  initialPage = 1,
}: UseRepositoryPaginationProps = {}): UseRepositoryPaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [searchTerm, setSearchTermState] = useState("");
  const [filters, setFiltersState] = useState<Record<string, any>>({});
  const [data, setData] = useState<T[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual data loading function that components can call
  const loadData = useCallback(
    async (
      fetchFunction: (
        params: PaginatedSearchParams,
      ) => Promise<PaginatedResponse<T>>,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const params: PaginatedSearchParams = {
          page: currentPage,
          limit: pageSize,
          search: searchTerm || undefined,
          ...filters,
        };

        const response = await fetchFunction(params);

        setData(response.items);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, pageSize, searchTerm, filters],
  );

  const setSearchTerm = useCallback((search: string) => {
    setSearchTermState(search);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const setFilters = useCallback((newFilters: Record<string, any>) => {
    setFiltersState(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setCurrentPage(Math.max(1, totalPages));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const refresh = useCallback(() => {
    // This will be implemented by the component using this hook
  }, []);

  return {
    // Data
    data,
    totalItems,
    totalPages,
    isLoading,
    error,

    // Pagination state
    currentPage,
    pageSize,

    // Search and filters
    searchTerm,
    filters,

    // Actions
    setSearchTerm,
    setFilters,
    goToPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    refresh,

    // For manual data loading
    loadData,
  };
}
