import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 15, 25, 50],
  className,
}: PaginationProps) {
  // Calculate displayed range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Show pages 2, 3, 4, 5 and ellipsis + last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ellipsis + last 4 pages
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first + ellipsis + current-1, current, current+1 + ellipsis + last
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const goToPreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const goToNextPage = () =>
    onPageChange(Math.min(totalPages, currentPage + 1));

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col md:flex-row items-center justify-between gap-4",
        className,
      )}
    >
      {/* Desktop: info y selector */}
      <div className="hidden md:flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
        <div>
          Mostrando {startItem}-{endItem} de {totalItems} elementos
        </div>
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Elementos por página:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Mobile: paginador minimalista */}
      <div className="w-full flex md:hidden justify-center items-center">
        {totalPages > 1 && (
          <div className="flex items-center gap-2 w-full justify-center py-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="rounded-full p-0 h-8 w-8 text-gray-400"
              title="Primera página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="rounded-full p-0 h-8 w-8 text-gray-400"
              title="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="px-2 text-gray-400">...</span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={cn(
                      "rounded-full h-8 w-8 flex items-center justify-center font-semibold transition",
                      currentPage === page
                        ? "bg-[#5dc4bf] text-white shadow"
                        : "bg-transparent text-gray-500 hover:bg-gray-100"
                    )}
                    style={{ minWidth: 32 }}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="rounded-full p-0 h-8 w-8 text-gray-400"
              title="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="rounded-full p-0 h-8 w-8 text-gray-400"
              title="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop: paginador clásico */}
      {totalPages > 1 && (
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={goToFirstPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToLastPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Hook for managing pagination state
export interface UsePaginationProps {
  totalItems: number;
  initialPageSize?: number;
  initialPage?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  resetPagination: () => void;
}

export function usePagination({
  totalItems,
  initialPageSize = 15,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Ensure current page is valid when totalItems or pageSize changes
  React.useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [totalItems, pageSize, currentPage]);

  const goToPage = React.useCallback(
    (page: number) => {
      const maxPage = Math.ceil(totalItems / pageSize);
      setCurrentPage(Math.max(1, Math.min(page, maxPage)));
    },
    [totalItems, pageSize],
  );

  const setPageSize = React.useCallback((size: number) => {
    setPageSizeState(size);
    // Reset to first page when changing page size
    setCurrentPage(1);
  }, []);

  const goToFirstPage = React.useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = React.useCallback(() => {
    const maxPage = Math.ceil(totalItems / pageSize);
    setCurrentPage(Math.max(1, maxPage));
  }, [totalItems, pageSize]);

  const goToNextPage = React.useCallback(() => {
    const maxPage = Math.ceil(totalItems / pageSize);
    setCurrentPage((prev) => Math.min(prev + 1, maxPage));
  }, [totalItems, pageSize]);

  const goToPreviousPage = React.useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPagination = React.useCallback(() => {
    setCurrentPage(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    setPageSize,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    resetPagination,
  };
}

// Utility function to paginate an array
export function paginateArray<T>(
  array: T[],
  currentPage: number,
  pageSize: number,
): T[] {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return array.slice(startIndex, endIndex);
}
