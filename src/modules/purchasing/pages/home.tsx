"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileCheck2, PackageCheck, Truck } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateValue } from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";

import { PURCHASING_QUERY_KEYS, PURCHASING_ROUTES } from "../constants";
import {
  formatPurchasingCurrency,
  getPurchaseOrderStatusBadge,
} from "../ui";

export default function PurchasingHomePage() {
  const dashboardQuery = useQuery({
    queryFn: purchasingService.getDashboard,
    queryKey: PURCHASING_QUERY_KEYS.dashboard,
    staleTime: 60_000,
  });

  if (dashboardQuery.isPending) {
    return <LoadingState title="Cargando" />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        description={dashboardQuery.error.message}
        title="Error al cargar el panel de control"
      />
    );
  }

  const dashboard = dashboardQuery.data;

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
              href={PURCHASING_ROUTES.comparisons}
            >
              Comparar proveedores
            </Link>
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={PURCHASING_ROUTES.orders}
            >
              Órdenes de compra
            </Link>
          </>
        }
        description="Monitorea el estado de las órdenes de compra, solicitudes y recibos en tu empresa."
        eyebrow="Operaciones de compras"
        title="Compras"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Solicitudes de compra que esperan ser revisadas y aprobadas por los gerentes de la empresa."
          icon={ClipboardList}
          label="Solicitudes Pendientes"
          value={String(dashboard.pendingPurchaseRequests)}
        />
        <StatCard
          description="Decisiones de aprobación que todavía deben resolverse antes de continuar con la compra."
          icon={FileCheck2}
          label="Aprobaciones Pendientes"
          value={String(dashboard.pendingApprovals)}
        />
        <StatCard
          description="Ordenes de compra abiertas que esperan ser recibidas en el inventario."
          icon={Truck}
          label="Órdenes Abiertas"
          tone="accent"
          value={String(dashboard.openPurchaseOrders)}
        />
        <StatCard
          description="Ordenes recibidas parcialmente que esperan ser completadas en el inventario."
          icon={PackageCheck}
          label="Recibos Parciales"
          value={String(dashboard.partialPurchaseOrders.length)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Seguimiento de entregas
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Entregas esperadas retrasadas
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PURCHASING_ROUTES.orders}
            >
              Abrir todas las órdenes de compra
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {dashboard.delayedExpectedDeliveries.map((order) => {
              const badge = getPurchaseOrderStatusBadge(order.status);

              return (
                <Link
                  key={order.id}
                  className="block rounded-md border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                  href={PURCHASING_ROUTES.orderDetail(order.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{order.code}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        {order.supplier?.commercialName ||
                          order.supplier?.legalName ||
                          "Sin proveedor"}{" "}
                        · Entrega esperada {formatDateValue(order.expectedDeliveryDate)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-stone-600">
                    Total:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(order.total, order.currency)}
                    </span>
                  </p>
                </Link>
              );
            })}

            {dashboard.delayedExpectedDeliveries.length === 0 ? (
              <EmptyState
                description="No hay entregas retrasadas que mostrar. Todas las entregas esperadas están en camino."
                title="Nada demorado"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Recepción en almacén
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Recibos Recientes
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PURCHASING_ROUTES.receipts}
            >
              Abrir Historial
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {dashboard.recentReceipts.map((receipt) => (
              <Link
                key={receipt.id}
                className="block rounded-md border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                href={PURCHASING_ROUTES.orderDetail(receipt.purchaseOrderId)}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">{receipt.code}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {receipt.supplier?.commercialName ||
                        receipt.supplier?.legalName ||
                        "Sin proveedor"}{" "}
                      · {receipt.warehouse?.name || "Sin almacén"}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-stone-500">
                    {formatDateValue(receipt.receivedAt)}
                  </p>
                </div>
              </Link>
            ))}

            {dashboard.recentReceipts.length === 0 ? (
              <EmptyState
                description="Los recibos se registrarán aquí una vez que las órdenes de compra sean recibidas en inventario."
                title="No hay recibos recientes"
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
