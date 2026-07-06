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
import { profileOptimizationService } from "@/services/profile-optimization-service";

import {
  PROFILE_OPTIMIZATION_QUERY_KEYS,
  PROFILE_OPTIMIZATION_ROUTES,
} from "../constants";
import {
  formatProfileMetersFromMm,
  formatProfilePercent,
  getProfilePlanStatusBadge,
} from "../ui";

export default function ProfileCuttingPlansListPage() {
  const [search, setSearch] = useState("");
  const plansQuery = useQuery({
    queryFn: () =>
      profileOptimizationService.listPlans({
        page: 1,
        perPage: 20,
        search,
      }),
    queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.plans({
      page: 1,
      perPage: 20,
      search,
    }),
    staleTime: 60_000,
  });

  if (plansQuery.isPending) {
    return <LoadingState title="Preparando planes de corte de perfiles" />;
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        description={plansQuery.error.message}
        title="No se pudieron cargar los planes de corte de perfiles"
      />
    );
  }

  const plans = plansQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <ExportMenu
            buttonClassName="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            disabled={plans.length === 0}
            onExportExcel={() => {
              exportRowsToExcel(plans, {
                columns: [
                  { header: "Codigo", value: (row) => row.code },
                  { header: "Estado", value: (row) => getProfilePlanStatusBadge(row.status).label },
                  { header: "Material", value: (row) => row.material.name },
                  { header: "Optimizacion", value: (row) => row.optimizationRun.code },
                  { header: "Barras", value: (row) => row.totalBars },
                  {
                    header: "Longitud requerida",
                    value: (row) => formatProfileMetersFromMm(row.totalRequiredLengthMm),
                  },
                  {
                    header: "Longitud de desperdicio",
                    value: (row) => formatProfileMetersFromMm(row.totalWasteLengthMm),
                  },
                  { header: "Desperdicio", value: (row) => formatProfilePercent(row.wastePercent) },
                ],
                fileName: "planes-corte-perfiles.xls",
                subtitle: `Busqueda actual: ${search || "sin filtro"}`,
                title: "Planes de corte de perfiles",
              });
            }}
            onExportPdf={() => {
              exportRowsToPdf(plans, {
                columns: [
                  { header: "Codigo", value: (row) => row.code },
                  { header: "Estado", value: (row) => getProfilePlanStatusBadge(row.status).label },
                  { header: "Material", value: (row) => row.material.name },
                  { header: "Barras", value: (row) => row.totalBars },
                  { header: "Desperdicio", value: (row) => formatProfilePercent(row.wastePercent) },
                ],
                subtitle: `Busqueda actual: ${search || "sin filtro"}`,
                title: "Planes de corte de perfiles",
              });
            }}
          />
        }
        description="Inspecciona los planes de corte por barra, revisa salidas de remanente y enlaza el trabajo con compras o produccion cuando la ejecucion este lista."
        eyebrow="Operaciones"
        title="Planes de corte de perfiles"
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-4">
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Buscar
          </span>
          <input
            className="rounded-md border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder="Buscar por plan, optimizacion o material"
            value={search}
          />
        </label>
      </section>

      <section className="grid gap-4">
        {plans.map((plan) => {
          const badge = getProfilePlanStatusBadge(plan.status);

          return (
            <Link
              key={plan.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={PROFILE_OPTIMIZATION_ROUTES.planDetail(plan.id)}
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
                    {plan.material.name} · {plan.optimizationRun.code} · {plan.totalBars} barras
                  </p>
                </div>

                <div className="grid min-w-[16rem] gap-2 text-right">
                  <p className="text-sm text-stone-600">
                    Longitud requerida:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatProfileMetersFromMm(plan.totalRequiredLengthMm)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Longitud de desperdicio:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatProfileMetersFromMm(plan.totalWasteLengthMm)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Desperdicio:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatProfilePercent(plan.wastePercent)}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {plans.length === 0 ? (
          <EmptyState
            description="Genera un plan de corte a partir de una optimizacion completada para poblar esta lista."
            title="Todavia no hay planes de corte de perfiles"
          />
        ) : null}
      </section>
    </main>
  );
}
