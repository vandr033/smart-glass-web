"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";
import type { PurchasingComparisonScoreBreakdown } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { PURCHASING_PERMISSIONS, PURCHASING_QUERY_KEYS, PURCHASING_ROUTES } from "../constants";
import {
  formatPurchasingCurrency,
  formatPurchasingPercent,
  getComparisonStrategyLabel,
  getPurchaseRequestItemStatusBadge,
  getSupplierComparisonStatusBadge,
  parseComparisonResult,
  parseSelectedCombination,
} from "../ui";

type PurchasingComparisonDetailPageProps = {
  comparisonId: string;
};

export default function PurchasingComparisonDetailPage({
  comparisonId,
}: PurchasingComparisonDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [actionNotes, setActionNotes] = useState("");

  const canApprove = permissions.includes(PURCHASING_PERMISSIONS.approve);
  const canCreatePo = permissions.includes(PURCHASING_PERMISSIONS.createPo);

  const comparisonQuery = useQuery({
    queryFn: () => purchasingService.getSupplierComparisonById(comparisonId),
    queryKey: PURCHASING_QUERY_KEYS.comparisonDetail(comparisonId),
    staleTime: 30_000,
  });
  const approveMutation = useMutation({
    mutationFn: () =>
      purchasingService.approveSupplierComparison(comparisonId, {
        notes: actionNotes.trim() || null,
      }),
    onSuccess: async () => {
      setActionNotes("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: PURCHASING_QUERY_KEYS.comparisonDetail(comparisonId),
        }),
        queryClient.invalidateQueries({
          queryKey: PURCHASING_QUERY_KEYS.comparisons({}),
        }),
      ]);
    },
  });
  const createOrdersMutation = useMutation({
    mutationFn: () => purchasingService.createPurchaseOrdersFromComparison(comparisonId),
  });
  const isScoreBreakdownEntry = (
    value: unknown,
  ): value is PurchasingComparisonScoreBreakdown => {
    return (
      value !== null &&
      typeof value === "object" &&
      "criterionLabel" in value &&
      "normalizedScore" in value
    );
  };

  if (comparisonQuery.isPending) {
    return <LoadingState title="Cargando comparación de proveedores" />;
  }

  if (comparisonQuery.isError) {
    return (
      <ErrorState
        description={comparisonQuery.error.message}
        title="No se pudo cargar la comparación de proveedores"
      />
    );
  }

  const comparison = comparisonQuery.data;
  const badge = getSupplierComparisonStatusBadge(comparison.status);
  const result = parseComparisonResult(comparison.resultJson);
  const selectedCombination = parseSelectedCombination(comparison.selectedCombinationJson);
  const createdOrders = createOrdersMutation.data ?? [];

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PURCHASING_ROUTES.comparisons}>
              Volver a comparaciones
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PURCHASING_ROUTES.requestDetail(comparison.purchaseRequest.id)}
            >
              Abrir solicitud
            </Link>
          </>
        }
        description="Revisa la matriz de proveedores, valida la estrategia seleccionada y aprueba el resultado antes de emitir las órdenes de compra."
        eyebrow="Compras"
        title={comparison.purchaseRequest.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-stone-700">
            {comparison.scoringConfig?.name || "Puntaje predeterminado"}
          </span>
          <span className="text-sm text-stone-500">
            Generado {formatDateValue(comparison.createdAt)}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Estrategia seleccionada
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {getComparisonStrategyLabel(
                selectedCombination?.selectedStrategy ||
                  result?.selectedStrategy ||
                  "best_weighted_score_per_item",
              )}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Líneas de solicitud
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {comparison.purchaseRequestDetail.items.length}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Proveedores seleccionados
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {selectedCombination?.supplierIds.length ?? 0}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Aprobado el
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateValue(comparison.approvedAt)}
            </p>
          </div>
        </div>

        {result?.warnings.length ? (
          <div className="mt-5 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {result.warnings.join(" ")}
          </div>
        ) : null}
      </section>

      {(canApprove || canCreatePo) ? (
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid min-w-[18rem] flex-1 gap-2">
              <span className="text-sm font-medium text-stone-700">Notas de la acción</span>
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setActionNotes(event.target.value);
                }}
                placeholder="Observación opcional para la aprobación o emisión"
                value={actionNotes}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {canApprove ? (
                <button
                  className={secondaryButtonClassName}
                  disabled={approveMutation.isPending}
                  onClick={() => {
                    void approveMutation.mutateAsync();
                  }}
                  type="button"
                >
                  Aprobar comparación
                </button>
              ) : null}
              {canCreatePo ? (
                <button
                  className={primaryButtonClassName}
                  disabled={createOrdersMutation.isPending}
                  onClick={() => {
                    void createOrdersMutation.mutateAsync();
                  }}
                  type="button"
                >
                  Crear órdenes de compra
                </button>
              ) : null}
            </div>
          </div>

          {approveMutation.error || createOrdersMutation.error ? (
            <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(approveMutation.error || createOrdersMutation.error)}
            </div>
          ) : null}

          {createdOrders.length > 0 ? (
            <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-900">
                Las órdenes de compra fueron creadas correctamente.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {createdOrders.map((order) => (
                  <Link
                    key={order.id}
                    className="inline-flex items-center rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400"
                    href={PURCHASING_ROUTES.orderDetail(order.id)}
                  >
                    {order.code}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {result?.singleSupplierOptions.length ? (
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Candidatos de proveedor único
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.singleSupplierOptions.map((candidate) => {
              const supplier =
                comparison.options.find((option) => option.supplierId === candidate.supplierId)
                  ?.supplier || null;

              return (
                <div
                  key={candidate.supplierId}
                  className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4"
                >
                  <p className="text-sm font-semibold text-stone-950">
                    {supplier?.commercialName || supplier?.legalName || "Proveedor"}
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    Puntaje promedio: {formatPurchasingPercent(candidate.averageScore)}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Precio total: {formatPurchasingCurrency(candidate.totalPrice)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Matriz comparativa
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Opciones de proveedor por ítem solicitado
          </h2>
        </div>

        {comparison.purchaseRequestDetail.items.map((item) => {
          const itemBadge = getPurchaseRequestItemStatusBadge(item.status);
          const options = comparison.options.filter(
            (option) => option.purchaseRequestItemId === item.id,
          );

          return (
            <section
              key={item.id}
              className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">
                      {item.material.name}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${itemBadge.className}`}
                    >
                      {itemBadge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {item.quantity} {item.unit} · {item.material.code}
                  </p>
                </div>
                <p className="text-sm text-stone-500">
                  Proveedor seleccionado:{" "}
                  {item.selectedSupplier?.commercialName ||
                    item.selectedSupplier?.legalName ||
                    "Sin seleccionar"}
                </p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {options.map((option) => (
                  (() => {
                    const scoreBreakdownEntries = Array.isArray(option.scoreBreakdownJson)
                      ? option.scoreBreakdownJson.reduce<PurchasingComparisonScoreBreakdown[]>(
                          (entries, entry) => {
                            if (isScoreBreakdownEntry(entry)) {
                              entries.push(entry);
                            }

                            return entries;
                          },
                          [],
                        )
                      : [];

                    return (
                      <div
                        key={option.id}
                        className={`rounded-md border px-4 py-4 ${
                          option.isSelected
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-stone-200 bg-stone-50"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-stone-950">
                              {option.supplier?.commercialName ||
                                option.supplier?.legalName ||
                                "Proveedor"}
                            </p>
                            <p className="mt-1 text-xs text-stone-600">
                              Entrega: {option.deliveryDays ?? "No definida"} día(s) · Crédito:{" "}
                              {option.availableCredit === null
                                ? "No disponible"
                                : option.availableCredit
                                  ? "Disponible"
                                  : "No disponible"}
                            </p>
                          </div>
                          {option.isSelected ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Seleccionado
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-[1rem] bg-white px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                              Precio unitario
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatPurchasingCurrency(option.unitPrice)}
                            </p>
                          </div>
                          <div className="rounded-[1rem] bg-white px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                              Precio total
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatPurchasingCurrency(option.totalPrice)}
                            </p>
                          </div>
                          <div className="rounded-[1rem] bg-white px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                              Puntaje del proveedor
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatPurchasingPercent(option.supplierScore)}
                            </p>
                          </div>
                          <div className="rounded-[1rem] bg-white px-3 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                              Puntaje final ponderado
                            </p>
                            <p className="mt-2 text-sm font-semibold text-stone-950">
                              {formatPurchasingPercent(option.finalScore)}
                            </p>
                          </div>
                        </div>

                        {scoreBreakdownEntries.length > 0 ? (
                          <div className="mt-4 rounded-[1rem] bg-white px-4 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                              Desglose del puntaje
                            </p>
                            <div className="mt-3 space-y-2">
                              {scoreBreakdownEntries.map((entry, index) => (
                                <div
                                  key={`${option.id}-${index}`}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <span className="text-stone-600">{entry.criterionLabel}</span>
                                  <span className="font-medium text-stone-950">
                                    {formatPurchasingPercent(entry.normalizedScore)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()
                ))}
              </div>

              {options.length === 0 ? (
                <div className="mt-5">
                  <EmptyState
                    description="No se pudo construir una opción de proveedor para este material con la equivalencia y los precios actuales."
                    title="No hay opciones de proveedor"
                  />
                </div>
              ) : null}
            </section>
          );
        })}
      </section>
    </main>
  );
}
