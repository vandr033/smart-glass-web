"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils";

type DataTablePaginationProps = {
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  total: number;
};

const getPageCount = (pageSize: number, total: number): number => {
  return Math.max(1, Math.ceil(total / pageSize));
};

const getVisiblePages = (page: number, pageCount: number): number[] => {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (page <= 3) {
    return [1, 2, 3, 4, pageCount];
  }

  if (page >= pageCount - 2) {
    return [1, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [1, page - 1, page, page + 1, pageCount];
};

/**
 * Shared server-pagination controls used underneath the reusable DataTable.
 */
export function DataTablePagination({
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  total,
}: DataTablePaginationProps) {
  const pageCount = getPageCount(pageSize, total);
  const currentPage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(currentPage * pageSize, total);
  const visiblePages = getVisiblePages(currentPage, pageCount);

  return (
    <div className="flex flex-col gap-4 rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-stone-700">
          Mostrando <span className="font-semibold text-stone-950">{start}</span> a{" "}
          <span className="font-semibold text-stone-950">{end}</span> de{" "}
          <span className="font-semibold text-stone-950">{total}</span> registros
        </p>

        <label className="inline-flex items-center gap-3 text-sm text-stone-700">
          Filas por pagina
          <select
            className="h-9 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]"
            disabled={isLoading}
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
            }}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm font-semibold text-stone-700 transition hover:border-[color:var(--color-border-strong)] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => {
            onPageChange(currentPage - 1);
          }}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        <div className="flex items-center gap-2">
          {visiblePages.map((visiblePage, index) => {
            const previousPage = visiblePages[index - 1];
            const shouldRenderGap =
              previousPage !== undefined && visiblePage - previousPage > 1;

            return (
              <div key={visiblePage} className="flex items-center gap-2">
                {shouldRenderGap ? (
                  <span className="px-1 text-sm text-stone-500">…</span>
                ) : null}
                <button
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition",
                    visiblePage === currentPage
                      ? "border-[color:var(--color-primary)] bg-[var(--color-primary)] text-[color:var(--color-primary-contrast)]"
                      : "border-[color:var(--color-border)] bg-white text-stone-700 hover:border-[color:var(--color-border-strong)] hover:text-stone-950",
                  )}
                  disabled={isLoading}
                  onClick={() => {
                    onPageChange(visiblePage);
                  }}
                  type="button"
                >
                  {visiblePage}
                </button>
              </div>
            );
          })}
        </div>

        <button
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm font-semibold text-stone-700 transition hover:border-[color:var(--color-border-strong)] hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={currentPage >= pageCount || isLoading}
          onClick={() => {
            onPageChange(currentPage + 1);
          }}
          type="button"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
