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
  getCuttingPlanStatusBadge,
} from "../ui";

export default function CuttingPlansListPage() {
  const [search, setSearch] = useState("");
  const plansQuery = useQuery({
    queryFn: () =>
      cuttingService.listPlans({
        page: 1,
        perPage: 20,
        search,
      }),
    queryKey: CUTTING_QUERY_KEYS.plans({ page: 1, perPage: 20, search }),
    staleTime: 60_000,
  });

  if (plansQuery.isPending) {
    return (
      <LoadingState
        title="Preparing cutting plans"
      />
    );
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        description={plansQuery.error.message}
        title="Cutting plans could not be loaded"
      />
    );
  }

  const plans = plansQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Approve plan-ready layouts, inspect remnant outputs, and open print-friendly views once the plan is commercially acceptable."
        eyebrow="Corte"
        title="Planes de corte"
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
            placeholder="Buscar por codigo de plan, corrida o material"
            value={search}
          />
        </label>
      </section>

      <section className="grid gap-4">
        {plans.map((plan) => {
          const badge = getCuttingPlanStatusBadge(plan.status);

          return (
            <Link
              key={plan.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={CUTTING_ROUTES.planDetail(plan.id)}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-stone-950">{plan.code}</h2>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {plan.material.name} · {plan.optimizationRun.code} · {plan.sheetCount} sheets
                  </p>
                </div>

                <div className="grid min-w-[15rem] gap-2 text-right">
                  <p className="text-sm text-stone-600">
                    Required area:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingArea(plan.totalRequiredAreaM2)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Waste area:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingArea(plan.totalWasteAreaM2)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Waste:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingPercent(plan.wastePercent)}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {plans.length === 0 ? (
          <EmptyState
            description="Generate a cutting plan from a completed optimization run to populate this list."
            title="No cutting plans yet"
          />
        ) : null}
      </section>
    </main>
  );
}
