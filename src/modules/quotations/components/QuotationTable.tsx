"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileStack, Pencil, RefreshCcw, ScanSearch, Trash2, Wrench } from "lucide-react";

import { ExportMenu } from "@/components/ui/export-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import {
  fieldClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { clientService } from "@/services/client-service";
import { quotationService } from "@/services/quotation-service";
import { getApiErrorMessage } from "@/utils";

import {
  QUOTATIONS_PERMISSIONS,
  QUOTATIONS_QUERY_KEYS,
  QUOTATIONS_ROUTES,
  QUOTATION_STATUS_LABELS,
} from "../constants";
import {
  formatQuotationCurrency,
  formatQuotationDate,
  formatQuotationPercent,
  getQuotationStatusBadge,
} from "../ui";

export function QuotationTable() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | keyof typeof QUOTATION_STATUS_LABELS>("");
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quotationToDelete, setQuotationToDelete] = useState<{
    code: string;
    id: string;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canUpdate = permissions.includes(QUOTATIONS_PERMISSIONS.update);
  const canDelete = permissions.includes(QUOTATIONS_PERMISSIONS.delete);
  const canViewCost = permissions.includes(QUOTATIONS_PERMISSIONS.viewCost);
  const canExportPdf = permissions.includes(QUOTATIONS_PERMISSIONS.exportPdf);

  const downloadPdf = async (quotationId: string, variant: "commercial" | "internal") => {
    setPdfError(null);
    setDownloadingPdf(`${quotationId}:${variant}`);
    try {
      await quotationService.downloadPdf(quotationId, variant);
    } catch (error) {
      setPdfError(getApiErrorMessage(error));
    } finally {
      setDownloadingPdf(null);
    }
  };

  const clientsQuery = useQuery({
    queryFn: async () => {
      const result = await clientService.listClients({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["quotations", "client-options"],
    staleTime: 60_000,
  });
  const quotationsQuery = useQuery({
    queryFn: async () =>
      quotationService.listQuotations({
        clientId: clientId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        perPage: 12,
        search,
        sortBy: "updatedAt",
        sortDirection: "desc",
        status: status || undefined,
      }),
    queryKey: QUOTATIONS_QUERY_KEYS.list({
      clientId,
      dateFrom,
      dateTo,
      page,
      search,
      status,
    }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (quotationId: string) => quotationService.deleteQuotation(quotationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["quotations"],
      });
      setQuotationToDelete(null);
    },
  });

  if (quotationsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando cotizaciones" />;
  }

  if (quotationsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void quotationsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={quotationsQuery.error.message}
        title="No se pudieron cargar las cotizaciones"
      />
    );
  }

  const records = quotationsQuery.data?.data ?? [];
  const pagination = quotationsQuery.data?.pagination;

  return (
    <>
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Registro de cotizaciones
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <ExportMenu
              buttonClassName={secondaryButtonClassName}
              disabled={records.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(records, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Estado", value: (row) => QUOTATION_STATUS_LABELS[row.status] },
                    { header: "Cliente", value: (row) => row.client.displayName },
                    { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                    { header: "Vigencia", value: (row) => formatQuotationDate(row.validUntil) },
                    { header: "Total venta", value: (row) => formatQuotationCurrency(row.totalSale, row.currency) },
                    {
                      header: "Margen",
                      value: (row) =>
                        canViewCost ? formatQuotationPercent(row.marginPercent) : "Restringido",
                    },
                  ],
                  fileName: "cotizaciones.xls",
                  title: "Cotizaciones",
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(records, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Estado", value: (row) => QUOTATION_STATUS_LABELS[row.status] },
                    { header: "Cliente", value: (row) => row.client.displayName },
                    { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                    { header: "Total venta", value: (row) => formatQuotationCurrency(row.totalSale, row.currency) },
                  ],
                  title: "Cotizaciones",
                });
              }}
            />
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void quotationsQuery.refetch();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por codigo, cliente o proyecto"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus((event.target.value as typeof status) ?? "");
            }}
            value={status}
          >
            <option value="">Cualquier Estado</option>
            {Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setClientId(event.target.value);
            }}
            value={clientId}
          >
            <option value="">Todos los clientes</option>
            {(clientsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
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
          description="Las cotizaciones apareceran aqui cuando las oportunidades comerciales entren al flujo del cotizador."
          title="No hay cotizaciones para la vista actual"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Cotizacion</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Cliente / Proyecto</th>
                  <th className="px-5 py-4 font-semibold">Vigencia</th>
                  <th className="px-5 py-4 font-semibold">Total venta</th>
                  {canViewCost ? (
                    <th className="px-5 py-4 font-semibold">Margen</th>
                  ) : null}
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const badge = getQuotationStatusBadge(record.status);

                  return (
                    <tr key={record.id} className="border-t border-stone-200/80 align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-950">{record.code}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          Actualizada {formatQuotationDate(record.updatedAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-stone-900">
                          {record.client.displayName}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {record.project
                            ? `${record.project.code} · ${record.project.title}`
                            : "Sin proyecto vinculado"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {formatQuotationDate(record.validUntil)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-900">
                        {formatQuotationCurrency(record.totalSale, record.currency)}
                      </td>
                      {canViewCost ? (
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {formatQuotationPercent(record.marginPercent)}
                          </span>
                        </td>
                      ) : null}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className={secondaryButtonClassName}
                            href={QUOTATIONS_ROUTES.view(record.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                          {canUpdate ? (
                            <>
                              <Link
                                className={secondaryButtonClassName}
                                href={QUOTATIONS_ROUTES.edit(record.id)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                              <Link
                                className={secondaryButtonClassName}
                                href={QUOTATIONS_ROUTES.builder(record.id)}
                              >
                                <Wrench className="mr-2 h-4 w-4" />
                                Cotizador
                              </Link>
                            </>
                          ) : null}
                          <Link
                            className={secondaryButtonClassName}
                            href={QUOTATIONS_ROUTES.preview(record.id)}
                          >
                            <ScanSearch className="mr-2 h-4 w-4" />
                            Vista previa
                          </Link>
                          {canExportPdf ? (
                            <button
                              className={secondaryButtonClassName}
                              disabled={Boolean(downloadingPdf)}
                              onClick={() => {
                                void downloadPdf(record.id, "commercial");
                              }}
                              type="button"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingPdf === `${record.id}:commercial` ? "Generando…" : "PDF comercial"}
                            </button>
                          ) : null}
                          {canExportPdf && canViewCost ? (
                            <button
                              className={secondaryButtonClassName}
                              disabled={Boolean(downloadingPdf)}
                              onClick={() => {
                                void downloadPdf(record.id, "internal");
                              }}
                              type="button"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {downloadingPdf === `${record.id}:internal` ? "Generando…" : "PDF interno"}
                            </button>
                          ) : null}
                          <Link
                            className={secondaryButtonClassName}
                            href={QUOTATIONS_ROUTES.versions(record.id)}
                          >
                            <FileStack className="mr-2 h-4 w-4" />
                            Versiones
                          </Link>
                          {canDelete ? (
                            <button
                              className={secondaryButtonClassName}
                              onClick={() => {
                                setQuotationToDelete({
                                  code: record.code,
                                  id: record.id,
                                });
                              }}
                              type="button"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-5 py-4 text-sm text-stone-600">
              <p>
                Pagina {pagination.page} de{" "}
                {Math.max(1, Math.ceil(pagination.total / pagination.perPage))}
              </p>
              <div className="flex gap-2">
                <button
                  className={secondaryButtonClassName}
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((currentPage) => Math.max(1, currentPage - 1));
                  }}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={pagination.page * pagination.perPage >= pagination.total}
                  onClick={() => {
                    setPage((currentPage) => currentPage + 1);
                  }}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <ConfirmDialog
        confirmLabel="Archivar cotizacion"
        description={
          quotationToDelete
            ? `Se archivara ${quotationToDelete.code}. Las versiones existentes y la auditoria se conservaran, pero la cotizacion saldra de los flujos activos.`
            : ""
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!quotationToDelete) {
            return;
          }

          deleteMutation.mutate(quotationToDelete.id);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setQuotationToDelete(null);
          }
        }}
        open={Boolean(quotationToDelete)}
        title="¿Archivar cotizacion?"
      />

      {deleteMutation.isError ? (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getApiErrorMessage(deleteMutation.error)}
        </div>
      ) : null}
      {pdfError ? (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {pdfError}
        </div>
      ) : null}
    </>
  );
}
