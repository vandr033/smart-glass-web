"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ClipboardCheck, Factory, PackageSearch } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateOnlyValue } from "@/modules/commercial/ui";
import { productionService } from "@/services/production-service";

import {
  PRODUCTION_PERMISSIONS,
  PRODUCTION_QUERY_KEYS,
  PRODUCTION_ROUTES,
} from "../constants";
import {
  formatProductionArea,
  formatProductionPercent,
  getProductionJobStatusBadge,
  getProductionPriorityBadge,
} from "../ui";

const isOpenJob = (status: string) => !["CANCELLED", "COMPLETED"].includes(status);

const getDueLabel = (plannedEndDate: string | null, now: number) => {
  if (!plannedEndDate) {
    return "Sin fecha de vencimiento";
  }

  const dueDate = new Date(plannedEndDate);
  const diffDays = Math.ceil(
    (dueDate.getTime() - now) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day(s) overdue`;
  }

  if (diffDays === 0) {
    return "Vence hoy";
  }

  return `Due in ${diffDays} day(s)`;
};

export default function ProductionHomePage() {
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(PRODUCTION_PERMISSIONS.create);
  const [now] = useState(() => Date.now());

  const jobsQuery = useQuery({
    queryFn: () =>
      productionService.listJobs({
        page: 1,
        perPage: 100,
        sortBy: "updatedAt",
        sortDirection: "desc",
      }),
    queryKey: PRODUCTION_QUERY_KEYS.jobs({
      page: 1,
      perPage: 100,
      sortBy: "updatedAt",
      sortDirection: "desc",
    }),
    staleTime: 60_000,
  });

  if (jobsQuery.isPending) {
    return <LoadingState title="Preparando el espacio de producción" />;
  }

  if (jobsQuery.isError) {
    return (
      <ErrorState
        description={jobsQuery.error.message}
        title="No se pudo cargar el espacio de produccion"
      />
    );
  }

  const jobs = jobsQuery.data.data;
  const activeJobs = jobs.filter((job) => ["IN_PROGRESS", "PAUSED", "READY"].includes(job.status));
  const urgentJobs = jobs.filter((job) => job.priority === "URGENT" && isOpenJob(job.status));
  const pendingTasks = jobs.reduce((sum, job) => sum + job.pendingTaskCount, 0);
  const dueSoonJobs = jobs
    .filter((job) => isOpenJob(job.status) && job.plannedEndDate)
    .filter((job) => {
      const dueDate = new Date(job.plannedEndDate as string);
      const diffDays = Math.ceil(
        (dueDate.getTime() - now) / (1000 * 60 * 60 * 24),
      );

      return diffDays <= 7;
    })
    .sort((left, right) => {
      const leftValue = left.plannedEndDate ? new Date(left.plannedEndDate).getTime() : 0;
      const rightValue = right.plannedEndDate ? new Date(right.plannedEndDate).getTime() : 0;
      return leftValue - rightValue;
    })
    .slice(0, 5);
  const wasteSignals = jobs
    .filter((job) => job.wasteReport)
    .sort((left, right) => {
      const leftVariance = Math.abs(left.wasteReport?.varianceAreaM2 ?? 0);
      const rightVariance = Math.abs(right.wasteReport?.varianceAreaM2 ?? 0);
      return rightVariance - leftVariance;
    })
    .slice(0, 5);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PRODUCTION_ROUTES.jobs}
            >
              Ordenes de produccion
            </Link>
            {canCreate ? (
              <Link
                className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
                href={PRODUCTION_ROUTES.jobsNew}
              >
                Nueva orden de produccion
              </Link>
            ) : null}
          </>
        }
        description="Sigue las órdenes provenientes de cotizaciones y corte, detecta a tiempo los riesgos de fecha y mantén visibles el consumo de materiales, los controles de calidad y el desperdicio."
        eyebrow="Operaciones"
        title="Produccion"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Todas las órdenes de producción registradas actualmente en el sistema."
          icon={Factory}
          label="Órdenes totales"
          value={String(jobsQuery.data.pagination.total)}
        />
        <StatCard
          description="Órdenes listas, activas o pausadas temporalmente en planta."
          icon={ClipboardCheck}
          label="Cola activa"
          tone="accent"
          value={String(activeJobs.length)}
        />
        <StatCard
          description="Órdenes urgentes abiertas que requieren atención inmediata en producción."
          icon={AlertTriangle}
          label="Órdenes urgentes"
          value={String(urgentJobs.length)}
        />
        <StatCard
          description="Tareas pendientes, en proceso o bloqueadas en todas las órdenes visibles."
          icon={PackageSearch}
          label="Tareas pendientes"
          value={String(pendingTasks)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Seguimiento de fechas
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Órdenes próximas a vencer
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PRODUCTION_ROUTES.jobs}
            >
              Open all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {dueSoonJobs.map((job) => {
              const statusBadge = getProductionJobStatusBadge(job.status);
              const priorityBadge = getProductionPriorityBadge(job.priority);

              return (
                <Link
                  key={job.id}
                  className="block rounded-md border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                  href={PRODUCTION_ROUTES.jobDetail(job.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-stone-950">{job.code}</p>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.className}`}
                        >
                          {priorityBadge.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-600">
                        {job.project?.title ?? job.quotation?.code ?? "Orden manual"} ·{" "}
                        {job.pendingTaskCount} tarea(s) pendiente(s)
                      </p>
                    </div>
                    <div className="text-right text-xs text-stone-500">
                      <p>{formatDateOnlyValue(job.plannedEndDate)}</p>
                      <p className="mt-1 font-semibold text-rose-700">
                        {getDueLabel(job.plannedEndDate, now)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}

            {dueSoonJobs.length === 0 ? (
              <EmptyState
                description="Las órdenes abiertas con fecha planificada de finalización durante la próxima semana aparecerán aquí automáticamente."
                title="No hay fechas próximas"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Seguimiento de desperdicio
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Órdenes con variaciones
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PRODUCTION_ROUTES.jobs}
            >
              Ver órdenes
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {wasteSignals.map((job) => (
              <Link
                key={job.id}
                className="block rounded-md border border-stone-200 px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
                href={PRODUCTION_ROUTES.jobWaste(job.id)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">{job.code}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {job.cuttingPlan?.code ?? "Sin plan de corte"} ·{" "}
                      {job.wasteReport?.hasActualWasteData
                        ? "Desperdicio real registrado"
                        : "Solo estimación teórica"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-stone-500">
                    <p>
                      Variación{" "}
                      <span className="font-semibold text-stone-950">
                        {formatProductionArea(job.wasteReport?.varianceAreaM2 ?? 0)}
                      </span>
                    </p>
                    <p className="mt-1">
                      {formatProductionPercent(job.wasteReport?.variancePercent ?? 0)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {wasteSignals.length === 0 ? (
              <EmptyState
                description="Los reportes de desperdicio aparecerán aquí cuando las órdenes con planes de corte registren consumo o recalculen el desperdicio."
                title="Aún no hay señales de desperdicio"
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
