"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { cuttingService } from "@/services/cutting-service";

import { CUTTING_QUERY_KEYS, CUTTING_ROUTES } from "../constants";
import {
  formatCuttingArea,
  formatCuttingPercent,
  getCuttingModeLabel,
  getCuttingRunStatusBadge,
} from "../ui";

export default function CuttingOptimizationsListPage() {
  const [search, setSearch] = useState("");
  const optimizationsQuery = useQuery({
    queryFn: () =>
      cuttingService.listOptimizations({
        page: 1,
        perPage: 20,
        search,
      }),
    queryKey: CUTTING_QUERY_KEYS.optimizations({ page: 1, perPage: 20, search }),
    staleTime: 60_000,
  });

  if (optimizationsQuery.isPending) {
    return (
      <LoadingState
        title="Preparing optimization list"
      />
    );
  }

  if (optimizationsQuery.isError) {
    return (
      <ErrorState
        description={optimizationsQuery.error.message}
        title="Optimization runs could not be loaded"
      />
    );
  }

  const runs = optimizationsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Review commercial estimation and operational purchase runs, compare waste, and open each layout before generating plans."
        eyebrow="Cutting"
        title="Optimization Runs"
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Search
          </span>
          <input
            className="rounded-md border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Buscar por corrida, cotizacion, proyecto o material"
            value={search}
          />
        </label>
      </section>

      <section className="grid gap-4">
        {runs.map((run) => {
          const badge = getCuttingRunStatusBadge(run.status);

          return (
            <Link
              key={run.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={CUTTING_ROUTES.optimizationDetail(run.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-stone-950">{run.code}</h2>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {getCuttingModeLabel(run.mode)} · {run.quotation?.code ?? "No quotation"} ·{" "}
                    {run.material?.name ?? "Mixed materials"}
                  </p>
                </div>

                <div className="grid min-w-[15rem] gap-2 text-right">
                  <p className="text-sm text-stone-600">
                    Required area:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingArea(run.totalRequiredAreaM2)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Sheet area:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingArea(run.totalSheetAreaM2)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Waste:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingPercent(run.wastePercent)}
                    </span>
                  </p>
                </div>
              </div>

              {run.errorMessage ? (
                <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {run.errorMessage}
                </div>
              ) : null}
            </Link>
          );
        })}

        {runs.length === 0 ? (
          <EmptyState
            description="Start from a quotation or post a manual optimization request to populate this workspace."
            title="No cutting optimization runs yet"
          />
        ) : null}
      </section>
    </main>
  );
}
