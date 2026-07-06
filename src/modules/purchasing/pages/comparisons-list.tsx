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
  PURCHASING_QUERY_KEYS,
  PURCHASING_ROUTES,
  SUPPLIER_COMPARISON_STATUS_LABELS,
} from "../constants";
import { getSupplierComparisonStatusBadge } from "../ui";

export default function PurchasingComparisonsListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<keyof typeof SUPPLIER_COMPARISON_STATUS_LABELS | "">(
    "",
  );

  const comparisonsQuery = useQuery({
    queryFn: () =>
      purchasingService.listSupplierComparisons({
        page: 1,
        perPage: 20,
        search,
        status: status || undefined,
      }),
    queryKey: PURCHASING_QUERY_KEYS.comparisons({
      page: 1,
      perPage: 20,
      search,
      status,
    }),
    staleTime: 30_000,
  });

  if (comparisonsQuery.isPending) {
    return <LoadingState title="Loading supplier comparisons" />;
  }

  if (comparisonsQuery.isError) {
    return (
      <ErrorState
        description={comparisonsQuery.error.message}
        title="Supplier comparisons could not be loaded"
      />
    );
  }

  const comparisons = comparisonsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.requests}
            >
              Purchase Requests
            </Link>
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={PURCHASING_ROUTES.orders}
            >
              Purchase Orders
            </Link>
          </>
        }
        description="Review comparison runs, inspect selected supplier mixes, and open the detailed scoring matrix before procurement creates purchase orders."
        eyebrow="Purchasing"
        title="Supplier Comparisons"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">Search</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Buscar por codigo de solicitud o nombre de configuracion"
              value={search}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Status</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
              }}
              value={status}
            >
              <option value="">Cualquier Estado</option>
              {Object.entries(SUPPLIER_COMPARISON_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-4">
        {comparisons.map((comparison) => {
          const badge = getSupplierComparisonStatusBadge(comparison.status);

          return (
            <Link
              key={comparison.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={PURCHASING_ROUTES.comparisonDetail(comparison.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-stone-950">
                      {comparison.purchaseRequest.code}
                    </h2>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {comparison.scoringConfig?.name || "Default scoring"} ·{" "}
                    {comparison.selectedSuppliersCount} supplier(s)
                  </p>
                </div>
                <p className="text-sm text-stone-500">{comparison.createdAt}</p>
              </div>
            </Link>
          );
        })}

        {comparisons.length === 0 ? (
          <EmptyState
            description="Generate a supplier comparison from an approved request to start ranking supplier options here."
            title="No comparisons found"
          />
        ) : null}
      </section>
    </main>
  );
}
