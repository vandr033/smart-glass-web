"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
} from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";
import { supplierService } from "@/services/supplier-service";
import { getApiErrorMessage } from "@/utils";

import { PURCHASING_QUERY_KEYS, PURCHASING_ROUTES } from "../constants";
import {
  getPurchaseRequestStatusBadge,
  getSupplierComparisonStatusBadge,
} from "../ui";

type PurchasingRequestComparePageProps = {
  requestId: string;
};

export default function PurchasingRequestComparePage({
  requestId,
}: PurchasingRequestComparePageProps) {
  const router = useRouter();
  const [scoringConfigId, setScoringConfigId] = useState("");

  const requestQuery = useQuery({
    queryFn: () => purchasingService.getPurchaseRequestById(requestId),
    queryKey: PURCHASING_QUERY_KEYS.requestDetail(requestId),
    staleTime: 30_000,
  });
  const scoringConfigsQuery = useQuery({
    queryFn: supplierService.listSupplierScoringConfigs,
    queryKey: ["purchasing", "compare", requestId, "scoring-configs"],
    staleTime: 60_000,
  });
  const comparisonsQuery = useQuery({
    queryFn: () =>
      purchasingService.listSupplierComparisons({
        page: 1,
        perPage: 10,
        purchaseRequestId: requestId,
      }),
    queryKey: PURCHASING_QUERY_KEYS.comparisons({
      page: 1,
      perPage: 10,
      purchaseRequestId: requestId,
    }),
    staleTime: 30_000,
  });
  const compareMutation = useMutation({
    mutationFn: () =>
      purchasingService.compareSuppliersForPurchaseRequest(requestId, {
        scoringConfigId: scoringConfigId || undefined,
      }),
    onSuccess: (comparison) => {
      router.push(PURCHASING_ROUTES.comparisonDetail(comparison.id));
    },
  });

  if (requestQuery.isPending || scoringConfigsQuery.isPending || comparisonsQuery.isPending) {
    return <LoadingState title="Preparando comparativo de proveedores" />;
  }

  if (requestQuery.isError || scoringConfigsQuery.isError || comparisonsQuery.isError) {
    return (
      <ErrorState
        description={
          requestQuery.error?.message ||
          scoringConfigsQuery.error?.message ||
          comparisonsQuery.error?.message ||
          "No se pudo cargar la configuración del comparativo de proveedores."
        }
        title="El comparativo de proveedores no está disponible"
      />
    );
  }

  const request = requestQuery.data;
  const requestBadge = getPurchaseRequestStatusBadge(request.status);
  const existingComparisons = comparisonsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className={secondaryButtonClassName}
              href={PURCHASING_ROUTES.requestDetail(request.id)}
            >
              Volver a Pedidos
            </Link>
            <Link className={secondaryButtonClassName} href={PURCHASING_ROUTES.comparisons}>
              Comparison History
            </Link>
          </>
        }
        description="Selecciona la configuración de evaluación de proveedores, genera una matriz comparativa y revisa corridas anteriores de la misma necesidad."
        eyebrow="Purchasing"
        title={`Compare Suppliers for ${request.code}`}
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${requestBadge.className}`}
          >
            {requestBadge.label}
          </span>
          <span className="text-sm text-stone-700">{request.items.length} request line(s)</span>
        </div>

        {request.status !== "APPROVED" ? (
          <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This request is not approved yet. If approval is required before PO creation,
            the comparison service will block until approval is completed.
          </div>
        ) : null}

        {compareMutation.error ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(compareMutation.error)}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Scoring configuration</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setScoringConfigId(event.target.value);
              }}
              value={scoringConfigId}
            >
              <option value="">Use purchasing default</option>
              {scoringConfigsQuery.data.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                  {config.isDefault ? " · Default" : ""}
                </option>
              ))}
            </select>
          </label>

          <button
            className={primaryButtonClassName}
            disabled={compareMutation.isPending || request.items.length === 0}
            onClick={() => {
              void compareMutation.mutateAsync();
            }}
            type="button"
          >
            Run Comparison
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Existing Runs
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Previous comparisons for this request
          </h2>
        </div>

        {existingComparisons.map((comparison) => {
          const badge = getSupplierComparisonStatusBadge(comparison.status);

          return (
            <Link
              key={comparison.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={PURCHASING_ROUTES.comparisonDetail(comparison.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">
                      {comparison.scoringConfig?.name || "Default scoring"}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    Selected suppliers: {comparison.selectedSuppliersCount}
                  </p>
                </div>
                <p className="text-sm text-stone-500">{comparison.createdAt}</p>
              </div>
            </Link>
          );
        })}

        {existingComparisons.length === 0 ? (
          <EmptyState
                description="Aún no se ha generado un comparativo de proveedores para esta solicitud."
            title="No comparison history"
          />
        ) : null}
      </section>
    </main>
  );
}
