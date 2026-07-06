"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import {
  fieldClassName,
  formatDateOnlyValue,
  sectionClassName,
} from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";

import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASING_QUERY_KEYS,
  PURCHASING_ROUTES,
} from "../constants";
import {
  formatPurchasingCurrency,
  getPurchaseOrderStatusBadge,
} from "../ui";

export default function PurchasingOrdersListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<keyof typeof PURCHASE_ORDER_STATUS_LABELS | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const ordersQuery = useQuery({
    queryFn: () =>
      purchasingService.listPurchaseOrders({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        perPage: 20,
        search,
        status: status || undefined,
      }),
    queryKey: PURCHASING_QUERY_KEYS.orders({
      dateFrom,
      dateTo,
      page: 1,
      perPage: 20,
      search,
      status,
    }),
    staleTime: 30_000,
  });

  if (ordersQuery.isPending) {
    return <LoadingState title="Cargando ordenes de compra" />;
  }

  if (ordersQuery.isError) {
    return (
      <ErrorState
        description={ordersQuery.error.message}
        title="No se pudieron cargar las ordenes de compra"
      />
    );
  }

  const orders = ordersQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.requests}
            >
              Solicitudes de compra
            </Link>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.receipts}
            >
              Historial de recepciones
            </Link>
            <ExportMenu
              buttonClassName="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              disabled={orders.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(orders, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Estado", value: (row) => getPurchaseOrderStatusBadge(row.status).label },
                    {
                      header: "Proveedor",
                      value: (row) =>
                        row.supplier?.commercialName || row.supplier?.legalName || "Sin proveedor",
                    },
                    { header: "Solicitud", value: (row) => row.purchaseRequest?.code ?? "Sin solicitud" },
                    { header: "Fecha", value: (row) => formatDateOnlyValue(row.orderDate) },
                    {
                      header: "Entrega esperada",
                      value: (row) => formatDateOnlyValue(row.expectedDeliveryDate),
                    },
                    { header: "Total", value: (row) => formatPurchasingCurrency(row.total, row.currency) },
                  ],
                  fileName: "ordenes-compra.xls",
                  title: "Ordenes de compra",
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(orders, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Estado", value: (row) => getPurchaseOrderStatusBadge(row.status).label },
                    {
                      header: "Proveedor",
                      value: (row) =>
                        row.supplier?.commercialName || row.supplier?.legalName || "Sin proveedor",
                    },
                    { header: "Fecha", value: (row) => formatDateOnlyValue(row.orderDate) },
                    { header: "Total", value: (row) => formatPurchasingCurrency(row.total, row.currency) },
                  ],
                  title: "Ordenes de compra",
                });
              }}
            />
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={PURCHASING_ROUTES.ordersNew}
            >
              Nueva orden de compra
            </Link>
          </>
        }
        description="Da seguimiento a compromisos con proveedores, ventanas estimadas de entrega, totales de orden y todo lo pendiente de confirmacion o recepcion."
        eyebrow="Compras"
        title="Ordenes de compra"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-stone-700">Buscar</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Buscar por codigo de orden, proveedor o solicitud"
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
              {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Desde</span>
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
            <span className="text-sm font-medium text-stone-700">Hasta</span>
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
        {orders.map((order) => {
          const badge = getPurchaseOrderStatusBadge(order.status);

          return (
            <Link
              key={order.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={PURCHASING_ROUTES.orderDetail(order.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-stone-950">{order.code}</h2>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {order.supplier?.commercialName || order.supplier?.legalName || "Sin proveedor"}
                    {order.purchaseRequest ? ` · ${order.purchaseRequest.code}` : ""}
                  </p>
                </div>

                <div className="grid gap-2 text-right text-sm text-stone-600">
                  <p>
                    Fecha:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatDateOnlyValue(order.orderDate)}
                    </span>
                  </p>
                  <p>
                    Entrega esperada:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatDateOnlyValue(order.expectedDeliveryDate)}
                    </span>
                  </p>
                  <p>
                    Total:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(order.total, order.currency)}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {orders.length === 0 ? (
          <EmptyState
            description="Crea una orden manual o genera una desde un comparativo aprobado para poblar esta cola."
            title="No se encontraron ordenes de compra"
          />
        ) : null}
      </section>
    </main>
  );
}
