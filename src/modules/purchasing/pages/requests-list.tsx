"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { fieldClassName, sectionClassName } from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";

import {
  PURCHASE_REQUEST_SOURCE_LABELS,
  PURCHASE_REQUEST_STATUS_LABELS,
  PURCHASING_QUERY_KEYS,
  PURCHASING_ROUTES,
} from "../constants";
import {
  formatPurchasingCurrency,
  getPurchaseRequestSourceLabel,
  getPurchaseRequestStatusBadge,
} from "../ui";

export default function PurchasingRequestsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<keyof typeof PURCHASE_REQUEST_STATUS_LABELS | "">("");
  const [sourceType, setSourceType] = useState<
    keyof typeof PURCHASE_REQUEST_SOURCE_LABELS | ""
  >("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const requestsQuery = useQuery({
    queryFn: () =>
      purchasingService.listPurchaseRequests({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        perPage: 20,
        search,
        sourceType: sourceType || undefined,
        status: status || undefined,
      }),
    queryKey: PURCHASING_QUERY_KEYS.requests({
      dateFrom,
      dateTo,
      page: 1,
      perPage: 20,
      search,
      sourceType,
      status,
    }),
    staleTime: 30_000,
  });

  if (requestsQuery.isPending) {
    return <LoadingState title="Cargando solicitudes de compra" />;
  }

  if (requestsQuery.isError) {
    return (
      <ErrorState
        description={requestsQuery.error.message}
        title="No se pudieron cargar las solicitudes de compra"
      />
    );
  }

  const requests = requestsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.comparisons}
            >
              Comparativos
            </Link>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.orders}
            >
              Órdenes de compra
            </Link>
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={PURCHASING_ROUTES.requestsNew}
            >
              Nueva solicitud
            </Link>
          </>
        }
        description="Revisa la demanda de compras proveniente de cotizaciones, planes de corte, faltantes de inventario y registros manuales antes de comparar proveedores o emitir órdenes."
        eyebrow="Compras"
        title="Solicitudes de compra"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-stone-700">Buscar</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Buscar por codigo de solicitud u origen"
              value={search}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Estado</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
              }}
              value={status}
            >
              <option value="">Cualquier Estado</option>
              {Object.entries(PURCHASE_REQUEST_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Source</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setSourceType(event.target.value as typeof sourceType);
              }}
              value={sourceType}
            >
              <option value="">All sources</option>
              {Object.entries(PURCHASE_REQUEST_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">From date</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setDateFrom(event.target.value);
              }}
              type="date"
              value={dateFrom}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">To date</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setDateTo(event.target.value);
              }}
              type="date"
              value={dateTo}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4">
        {requests.map((request) => {
          const badge = getPurchaseRequestStatusBadge(request.status);

          return (
            <Link
              key={request.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={PURCHASING_ROUTES.requestDetail(request.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-stone-950">{request.code}</h2>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {getPurchaseRequestSourceLabel(request.sourceType)}
                    {request.sourceReferenceLabel || request.sourceId
                      ? ` · ${request.sourceReferenceLabel || request.sourceId}`
                      : ""}
                  </p>
                </div>

                <div className="grid gap-2 text-right text-sm text-stone-600">
                  <p>
                    Items:{" "}
                    <span className="font-semibold text-stone-950">
                      {request.totals.itemCount}
                    </span>
                  </p>
                  <p>
                    Selected suppliers:{" "}
                    <span className="font-semibold text-stone-950">
                      {request.totals.selectedSupplierCount}
                    </span>
                  </p>
                  <p>
                    Estimated subtotal:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(request.totals.estimatedSubtotal)}
                    </span>
                  </p>
                </div>
              </div>

              {request.notes ? (
                <p className="mt-4 text-sm leading-6 text-stone-600">{request.notes}</p>
              ) : null}
            </Link>
          );
        })}

        {requests.length === 0 ? (
          <EmptyState
          description="Prueba ampliando los filtros o crea una solicitud manual desde la página de ingreso de compras."
            title="No purchase requests found"
          />
        ) : null}
      </section>
    </main>
  );
}
