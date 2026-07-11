"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileCog, LayoutGrid, Scissors } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { cuttingService } from "@/services/cutting-service";

import { CUTTING_QUERY_KEYS, CUTTING_ROUTES } from "../constants";
import {
  formatCuttingArea,
  getCuttingPlanStatusBadge,
  getCuttingRunStatusBadge,
} from "../ui";

export default function CuttingHomePage() {
  const optimizationsQuery = useQuery({
    queryFn: () =>
      cuttingService.listOptimizations({
        page: 1,
        perPage: 5,
      }),
    queryKey: CUTTING_QUERY_KEYS.optimizations({ page: 1, perPage: 5 }),
    staleTime: 60_000,
  });
  const plansQuery = useQuery({
    queryFn: () =>
      cuttingService.listPlans({
        page: 1,
        perPage: 5,
      }),
    queryKey: CUTTING_QUERY_KEYS.plans({ page: 1, perPage: 5 }),
    staleTime: 60_000,
  });

  if (optimizationsQuery.isPending || plansQuery.isPending) {
    return (
      <LoadingState
        title="Preparando espacio de corte"
      />
    );
  }

  if (optimizationsQuery.isError || plansQuery.isError) {
    return (
      <ErrorState
        description={
          optimizationsQuery.error?.message ??
          plansQuery.error?.message ??
          "No se pudo cargar el espacio de corte."
        }
        title="Espacio de corte no disponible"
      />
    );
  }

  const recentRuns = optimizationsQuery.data.data;
  const recentPlans = plansQuery.data.data;
  const latestRun = recentRuns[0] ?? null;
  const latestPlan = recentPlans[0] ?? null;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={CUTTING_ROUTES.optimizations}
            >
              Ver optimizaciones
            </Link>
            <Link
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              href={CUTTING_ROUTES.plans}
            >
              Ver planes de corte
            </Link>
          </>
        }
        description="Revisa las optimizaciones de vidrio basadas en cotizaciones, las estimaciones de desperdicio, la demanda de láminas virtuales y los planes listos para aprobación."
        eyebrow="Operaciones"
        title="Corte de vidrio"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          description="Optimizaciones recientes registradas en el sistema."
          icon={LayoutGrid}
          label="Corridas de optimización"
          value={String(optimizationsQuery.data.pagination.total)}
        />
        <StatCard
          description="Planes de corte generados desde corridas completadas."
          icon={FileCog}
          label="Planes de corte"
          value={String(plansQuery.data.pagination.total)}
        />
        <StatCard
          description="Última superficie de desperdicio estimada."
          icon={Scissors}
          label="Último desperdicio"
          value={latestRun ? formatCuttingArea(latestRun.estimatedWasteAreaM2) : "0.00 m2"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Corridas recientes
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Historial de optimización
              </h2>
            </div>
            <Link className="text-sm font-semibold text-[color:var(--color-primary)]" href={CUTTING_ROUTES.optimizations}>
              Ver todas
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentRuns.map((run) => {
              const badge = getCuttingRunStatusBadge(run.status);

              return (
                <Link
                  key={run.id}
                  className="block rounded-md border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                  href={CUTTING_ROUTES.optimizationDetail(run.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{run.code}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        {run.quotation?.code ?? "Sin cotización"} · {run.material?.name ?? "Materiales mixtos"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </Link>
              );
            })}
            {recentRuns.length === 0 ? (
              <EmptyState
                description="Ejecuta una optimización basada en cotización o manual para comenzar a generar diseños de corte."
                title="Aún no hay corridas de optimización"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Planes recientes
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Cola de aprobación
              </h2>
            </div>
            <Link className="text-sm font-semibold text-[color:var(--color-primary)]" href={CUTTING_ROUTES.plans}>
              Ver todos
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentPlans.map((plan) => {
              const badge = getCuttingPlanStatusBadge(plan.status);

              return (
                <Link
                  key={plan.id}
                  className="block rounded-md border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                  href={CUTTING_ROUTES.planDetail(plan.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{plan.code}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        {plan.material.name} · {plan.sheetCount} láminas
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </Link>
              );
            })}
            {latestPlan === null ? (
              <EmptyState
                description="Genera un plan de corte desde una corrida completada para revisar aquí sus diseños."
                title="Aún no hay planes de corte"
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
