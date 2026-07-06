"use client";

import Link from "next/link";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import { materialService } from "@/services/material-service";
import { priceListService } from "@/services/price-list-service";
import { supplierService } from "@/services/supplier-service";

import { PRICE_LISTS_ROUTES } from "../constants";
import {
  fieldClassName,
  formatCurrencyValue,
  formatDateValue,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "../ui";

export default function PriceListHistoryPage() {
  const [page, setPage] = useState(1);
  const [supplierId, setSupplierId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const historyQuery = useQuery({
    queryFn: () =>
      priceListService.getPriceHistory({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        materialId: materialId || undefined,
        page,
        perPage: 20,
        supplierId: supplierId || undefined,
      }),
    queryKey: ["price-lists", "history", page, supplierId, materialId, dateFrom, dateTo],
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
    queryKey: ["price-lists", "history-suppliers"],
    staleTime: 60_000,
  });

  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["price-lists", "history-materials"],
    staleTime: 60_000,
  });

  if (historyQuery.isLoading) {
    return <LoadingState cards={3} title="Cargando historial de precios" />;
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void historyQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={historyQuery.error.message}
        title="No se pudo cargar el historial de precios"
      />
    );
  }

  const records = historyQuery.data?.data ?? [];
  const pagination = historyQuery.data?.pagination;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <ExportMenu
              buttonClassName={secondaryButtonClassName}
              disabled={records.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(records, {
                  columns: [
                    { header: "Fecha", value: (row) => formatDateValue(row.createdAt) },
                    { header: "Proveedor", value: (row) => row.supplier.legalName },
                    { header: "Material", value: (row) => row.material.name },
                    {
                      header: "Precio anterior",
                      value: (row) => formatCurrencyValue(row.oldPrice, row.oldCurrency ?? row.newCurrency),
                    },
                    {
                      header: "Precio nuevo",
                      value: (row) => formatCurrencyValue(row.newPrice, row.newCurrency),
                    },
                    {
                      header: "Variacion",
                      value: (row) =>
                        row.changePercent === null
                          ? "Nuevo"
                          : `${row.changePercent > 0 ? "+" : ""}${row.changePercent.toFixed(2)}%`,
                    },
                  ],
                  fileName: "historial-precios.xls",
                  title: "Historial de precios",
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(records, {
                  columns: [
                    { header: "Fecha", value: (row) => formatDateValue(row.createdAt) },
                    { header: "Proveedor", value: (row) => row.supplier.legalName },
                    { header: "Material", value: (row) => row.material.name },
                    {
                      header: "Precio nuevo",
                      value: (row) => formatCurrencyValue(row.newPrice, row.newCurrency),
                    },
                    {
                      header: "Variacion",
                      value: (row) =>
                        row.changePercent === null
                          ? "Nuevo"
                          : `${row.changePercent > 0 ? "+" : ""}${row.changePercent.toFixed(2)}%`,
                    },
                  ],
                  title: "Historial de precios",
                });
              }}
            />
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.list}>
              Volver a importaciones
            </Link>
          </>
        }
        description="Sigue cada actualizacion aprobada de precios, compara valores anteriores y nuevos, y vuelve a la importacion de origen cuando algo no cuadre."
        eyebrow="Historial"
        title="Historial de precios"
      />

      <section className={sectionClassName}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
              setMaterialId(event.target.value);
            }}
            value={materialId}
          >
            <option value="">Cualquier Material</option>
            {(materialsQuery.data ?? []).map((material) => (
              <option key={material.id} value={material.id}>
                {material.code} · {material.name}
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
          description="Las importaciones aprobadas dejaran aqui su trazabilidad completa cuando los precios de proveedores empiecen a cambiar con el tiempo."
          icon={BarChart3}
          title="No hay cambios de precio para los filtros actuales"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Fecha</th>
                  <th className="px-5 py-4 font-semibold">Proveedor</th>
                  <th className="px-5 py-4 font-semibold">Material</th>
                  <th className="px-5 py-4 font-semibold">Precio anterior</th>
                  <th className="px-5 py-4 font-semibold">Precio nuevo</th>
                  <th className="px-5 py-4 font-semibold">Cambio</th>
                  <th className="px-5 py-4 font-semibold">Importacion</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-stone-200/80 align-top">
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateValue(record.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-950">{record.supplier.legalName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-950">{record.material.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                        {record.material.code}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {formatCurrencyValue(record.oldPrice, record.oldCurrency ?? record.newCurrency)}
                    </td>
                    <td className="px-5 py-4 text-stone-950">
                      {formatCurrencyValue(record.newPrice, record.newCurrency)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          (record.changePercent ?? 0) > 0
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {record.changePercent === null
                          ? "New"
                          : `${record.changePercent > 0 ? "+" : ""}${record.changePercent.toFixed(2)}%`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {record.import ? (
                        <Link
                          className={secondaryButtonClassName}
                          href={PRICE_LISTS_ROUTES.detail(record.import.id)}
                        >
                          Ver importacion
                        </Link>
                      ) : (
                        <span className="text-stone-500">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-5 py-4">
            <p className="text-sm text-stone-600">
              Pagina {pagination?.page ?? 1} de{" "}
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
    </main>
  );
}
