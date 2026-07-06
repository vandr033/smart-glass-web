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
  getProfileModeLabel,
  getProfileRunStatusBadge,
} from "../ui";

export default function ProfileOptimizationsListPage() {
  const [search, setSearch] = useState("");
  const optimizationsQuery = useQuery({
    queryFn: () =>
      profileOptimizationService.listOptimizations({
        page: 1,
        perPage: 20,
        search,
      }),
    queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.optimizations({
      page: 1,
      perPage: 20,
      search,
    }),
    staleTime: 60_000,
  });

  if (optimizationsQuery.isPending) {
    return <LoadingState title="Preparando optimizaciones de perfiles" />;
  }

  if (optimizationsQuery.isError) {
    return (
      <ErrorState
        description={optimizationsQuery.error.message}
        title="No se pudieron cargar las optimizaciones de perfiles"
      />
    );
  }

  const runs = optimizationsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <ExportMenu
            buttonClassName="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            disabled={runs.length === 0}
            onExportExcel={() => {
              exportRowsToExcel(runs, {
                columns: [
                  { header: "Codigo", value: (row) => row.code },
                  { header: "Estado", value: (row) => getProfileRunStatusBadge(row.status).label },
                  { header: "Modo", value: (row) => getProfileModeLabel(row.mode) },
                  { header: "Cotizacion", value: (row) => row.quotation?.code ?? "Sin cotizacion" },
                  { header: "Proyecto", value: (row) => row.project?.code ?? "Sin proyecto" },
                  { header: "Material", value: (row) => row.material.name },
                  {
                    header: "Longitud requerida",
                    value: (row) => formatProfileMetersFromMm(row.totalRequiredLengthMm),
                  },
                  {
                    header: "Longitud de barras",
                    value: (row) => formatProfileMetersFromMm(row.totalBarLengthMm),
                  },
                  { header: "Desperdicio", value: (row) => formatProfilePercent(row.wastePercent) },
                ],
                fileName: "optimizaciones-perfiles.xls",
                subtitle: `Busqueda actual: ${search || "sin filtro"}`,
                title: "Optimizaciones de perfiles",
              });
            }}
            onExportPdf={() => {
              exportRowsToPdf(runs, {
                columns: [
                  { header: "Codigo", value: (row) => row.code },
                  { header: "Estado", value: (row) => getProfileRunStatusBadge(row.status).label },
                  { header: "Modo", value: (row) => getProfileModeLabel(row.mode) },
                  { header: "Material", value: (row) => row.material.name },
                  {
                    header: "Longitud requerida",
                    value: (row) => formatProfileMetersFromMm(row.totalRequiredLengthMm),
                  },
                  { header: "Desperdicio", value: (row) => formatProfilePercent(row.wastePercent) },
                ],
                subtitle: `Busqueda actual: ${search || "sin filtro"}`,
                title: "Optimizaciones de perfiles",
              });
            }}
          />
        }
        description="Revisa estimaciones comerciales y ejecuciones operativas de perfiles de aluminio, compara uso de remanentes y abre cada corrida antes de generar el plan de corte."
        eyebrow="Operaciones"
        title="Optimizaciones de perfiles"
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
            placeholder="Buscar por corrida, cotizacion, proyecto o material"
            value={search}
          />
        </label>
      </section>

      <section className="grid gap-4">
        {runs.map((run) => {
          const badge = getProfileRunStatusBadge(run.status);

          return (
            <Link
              key={run.id}
              className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
              href={PROFILE_OPTIMIZATION_ROUTES.optimizationDetail(run.id)}
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
                    {getProfileModeLabel(run.mode)} · {run.quotation?.code ?? "Sin cotizacion"} ·{" "}
                    {run.material.name}
                  </p>
                </div>

                <div className="grid min-w-[16rem] gap-2 text-right">
                  <p className="text-sm text-stone-600">
                    Longitud requerida:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatProfileMetersFromMm(run.totalRequiredLengthMm)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Longitud de barras:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatProfileMetersFromMm(run.totalBarLengthMm)}
                    </span>
                  </p>
                  <p className="text-sm text-stone-600">
                    Desperdicio:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatProfilePercent(run.wastePercent)}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {runs.length === 0 ? (
          <EmptyState
            description="Ejecuta una optimizacion desde una cotizacion o registra una corrida manual para poblar este espacio."
            title="Todavia no hay optimizaciones de perfiles"
          />
        ) : null}
      </section>
    </main>
  );
}
