"use client";

import Link from "next/link";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileSpreadsheet, History, RefreshCcw } from "lucide-react";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import { priceListService } from "@/services/price-list-service";
import { supplierService } from "@/services/supplier-service";
import type { PriceListImportStatus } from "@/types";

import {
  PRICE_LISTS_ROUTES,
  PRICE_LIST_STATUS_LABELS,
} from "../constants";
import { PriceListStatusBadge } from "../status-badges";
import {
  fieldClassName,
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "../ui";

type PriceListsListPageProps = {
  canImport: boolean;
};

export default function PriceListsListPage({
  canImport,
}: PriceListsListPageProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState<"" | PriceListImportStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const importsQuery = useQuery({
    queryFn: async () =>
      priceListService.listImports({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        perPage: 12,
        search,
        sortBy: "createdAt",
        sortDirection: "desc",
        status: status || undefined,
        supplierId: supplierId || undefined,
      }),
    queryKey: ["price-lists", "imports", page, search, supplierId, status, dateFrom, dateTo],
  });

  const suppliersQuery = useQuery({
    queryFn: async () => {
      const result = await supplierService.listSuppliers({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["price-lists", "supplier-options"],
    staleTime: 60_000,
  });

  const records = importsQuery.data?.data ?? [];
  const pagination = importsQuery.data?.pagination;

  if (importsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando importaciones de listas de precios" />;
  }

  if (importsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void importsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={importsQuery.error.message}
        title="No se pudieron cargar las importaciones de listas de precios"
      />
    );
  }

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.history}>
              <History className="mr-2 h-4 w-4" />
              Historial de precios
            </Link>
            <ExportMenu
              buttonClassName={secondaryButtonClassName}
              disabled={records.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(records, {
                  columns: [
                    { header: "Proveedor", value: (row) => row.supplier.legalName },
                    { header: "Archivo", value: (row) => row.fileName },
                    { header: "Estado", value: (row) => PRICE_LIST_STATUS_LABELS[row.status] },
                    { header: "Filas", value: (row) => row.rowCount },
                    { header: "Mapeadas", value: (row) => row.mappedCount },
                    { header: "Pendientes", value: (row) => row.unmappedCount },
                    { header: "Importado", value: (row) => formatDateValue(row.createdAt) },
                    { header: "Aprobado", value: (row) => formatDateValue(row.approvedAt) },
                  ],
                  fileName: "listas-precios.xls",
                  subtitle: `Busqueda actual: ${search || "sin filtro"}`,
                  title: "Importaciones de listas de precios",
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(records, {
                  columns: [
                    { header: "Proveedor", value: (row) => row.supplier.legalName },
                    { header: "Archivo", value: (row) => row.fileName },
                    { header: "Estado", value: (row) => PRICE_LIST_STATUS_LABELS[row.status] },
                    { header: "Filas", value: (row) => row.rowCount },
                    { header: "Importado", value: (row) => formatDateValue(row.createdAt) },
                  ],
                  subtitle: `Busqueda actual: ${search || "sin filtro"}`,
                  title: "Importaciones de listas de precios",
                });
              }}
            />
            {canImport ? (
              <Link className={primaryButtonClassName} href={PRICE_LISTS_ROUTES.import}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importar lista de precios
              </Link>
            ) : null}
          </>
        }
        description="Revisa importaciones de archivos de proveedores, valida el progreso del mapeo y mueve listas aprobadas al historial vigente de precios."
        eyebrow="Compras"
        title="Listas de precios"
      />

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Archivos importados de proveedores
            </h2>
          </div>

          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void importsQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por archivo o proveedor"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSupplierId(event.target.value);
            }}
            value={supplierId}
          >
            <option value="">Todos los proveedores</option>
            {(suppliersQuery.data ?? []).map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.legalName}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus((event.target.value as PriceListImportStatus | "") ?? "");
            }}
            value={status}
          >
            <option value="">Cualquier Estado</option>
            {Object.entries(PRICE_LIST_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setDateFrom(event.target.value);
            }}
            type="date"
            value={dateFrom}
          />

          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setDateTo(event.target.value);
            }}
            type="date"
            value={dateTo}
          />
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          action={
            canImport ? (
              <Link className={primaryButtonClassName} href={PRICE_LISTS_ROUTES.import}>
                Importar primera lista de precios
              </Link>
            ) : null
          }
          description="Las listas de precios importadas apareceran aqui con su avance de mapeo, validacion y aprobacion."
          title="No hay importaciones de listas de precios para esta vista"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Proveedor</th>
                  <th className="px-5 py-4 font-semibold">Archivo</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Filas</th>
                  <th className="px-5 py-4 font-semibold">Importado</th>
                  <th className="px-5 py-4 font-semibold">Aprobado</th>
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-stone-200/80 align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-950">{record.supplier.legalName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                        {record.currency} · {record.sourceType}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-950">{record.fileName}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {record.rowCount} filas · {record.mappedCount} mapeadas ·{" "}
                        {record.unmappedCount} pendientes
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <PriceListStatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-stone-950">{record.rowCount}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {record.mappedCount} mapeadas / {record.unmappedCount} por resolver
                      </p>
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateValue(record.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateValue(record.approvedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className={secondaryButtonClassName}
                          href={PRICE_LISTS_ROUTES.detail(record.id)}
                        >
                          Ver
                        </Link>
                        <Link
                          className={secondaryButtonClassName}
                          href={PRICE_LISTS_ROUTES.mapping(record.id)}
                        >
                          Mapeo
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-5 py-4">
            <p className="text-sm text-stone-600">
              Mostrando pagina {pagination?.page ?? 1} de{" "}
              {pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1}
            </p>
            <div className="flex gap-2">
              <button
                className={secondaryButtonClassName}
                disabled={(pagination?.page ?? 1) <= 1}
                onClick={() => {
                  setPage((currentPage) => Math.max(1, currentPage - 1));
                }}
                type="button"
              >
                Anterior
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={
                  pagination
                    ? pagination.page * pagination.perPage >= pagination.total
                    : true
                }
                onClick={() => {
                  setPage((currentPage) => currentPage + 1);
                }}
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      )}

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Workflow
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Keep mapping feedback loops tight
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              The fastest cycle is import, resolve unmapped rows, validate, and approve.
              Every saved equivalence makes the next supplier file easier.
            </p>
          </div>

          <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.history}>
            Inspect history
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
