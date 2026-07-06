"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import {
  fieldClassName,
  formatDateOnlyValue,
  sectionClassName,
} from "@/modules/commercial/ui";
import { productionService } from "@/services/production-service";

import {
  PRODUCTION_JOB_PRIORITY_LABELS,
  PRODUCTION_JOB_STATUS_LABELS,
  PRODUCTION_PERMISSIONS,
  PRODUCTION_QUERY_KEYS,
  PRODUCTION_ROUTES,
} from "../constants";
import {
  formatProductionArea,
  getProductionJobStatusBadge,
  getProductionPriorityBadge,
} from "../ui";

export default function ProductionJobsListPage() {
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(PRODUCTION_PERMISSIONS.create);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<keyof typeof PRODUCTION_JOB_STATUS_LABELS | "">("");
  const [priority, setPriority] = useState<keyof typeof PRODUCTION_JOB_PRIORITY_LABELS | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const jobsQuery = useQuery({
    queryFn: () =>
      productionService.listJobs({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        perPage: 25,
        priority: priority || undefined,
        search,
        sortBy: "updatedAt",
        sortDirection: "desc",
        status: status || undefined,
      }),
    queryKey: PRODUCTION_QUERY_KEYS.jobs({
      dateFrom,
      dateTo,
      page: 1,
      perPage: 25,
      priority,
      search,
      sortBy: "updatedAt",
      sortDirection: "desc",
      status,
    }),
    staleTime: 30_000,
  });

  if (jobsQuery.isPending) {
    return <LoadingState title="Cargando ordenes de produccion" />;
  }

  if (jobsQuery.isError) {
    return (
      <ErrorState
        description={jobsQuery.error.message}
        title="No se pudieron cargar las ordenes de produccion"
      />
    );
  }

  const jobs = jobsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PRODUCTION_ROUTES.home}
            >
              Centro de produccion
            </Link>
            <ExportMenu
              buttonClassName="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              disabled={jobs.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(jobs, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Estado", value: (row) => getProductionJobStatusBadge(row.status).label },
                    { header: "Prioridad", value: (row) => getProductionPriorityBadge(row.priority).label },
                    { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                    { header: "Cotizacion", value: (row) => row.quotation?.code ?? "Sin cotizacion" },
                    { header: "Plan de corte", value: (row) => row.cuttingPlan?.code ?? "Sin plan de corte" },
                    { header: "Inicio planificado", value: (row) => formatDateOnlyValue(row.plannedStartDate) },
                    { header: "Fin planificado", value: (row) => formatDateOnlyValue(row.plannedEndDate) },
                    { header: "Items", value: (row) => row.itemCount },
                    { header: "Tareas", value: (row) => `${row.completedTaskCount}/${row.taskCount}` },
                  ],
                  fileName: "ordenes-produccion.xls",
                  title: "Ordenes de produccion",
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(jobs, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Estado", value: (row) => getProductionJobStatusBadge(row.status).label },
                    { header: "Prioridad", value: (row) => getProductionPriorityBadge(row.priority).label },
                    { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                    { header: "Inicio planificado", value: (row) => formatDateOnlyValue(row.plannedStartDate) },
                    { header: "Fin planificado", value: (row) => formatDateOnlyValue(row.plannedEndDate) },
                  ],
                  title: "Ordenes de produccion",
                });
              }}
            />
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
        description="Filtra ordenes por estado, prioridad o fecha objetivo y entra a tareas, controles de calidad y seguimiento de merma desde la cola principal."
        eyebrow="Produccion"
        title="Ordenes de produccion"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-stone-700">Buscar</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Buscar por codigo, notas, cotizacion o proyecto"
              value={search}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Estado</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setStatus(event.target.value as typeof status);
              }}
              value={status}
            >
              <option value="">Cualquier Estado</option>
              {Object.entries(PRODUCTION_JOB_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Prioridad</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setPriority(event.target.value as typeof priority);
              }}
              value={priority}
            >
              <option value="">Todas las prioridades</option>
              {Object.entries(PRODUCTION_JOB_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Desde</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setDateFrom(event.target.value);
              }}
              type="date"
              value={dateFrom}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Hasta</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setDateTo(event.target.value);
              }}
              type="date"
              value={dateTo}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4">
        {jobs.map((job) => {
          const statusBadge = getProductionJobStatusBadge(job.status);
          const priorityBadge = getProductionPriorityBadge(job.priority);

          return (
            <article
              key={job.id}
              className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      className="text-xl font-semibold text-stone-950 transition hover:text-[color:var(--color-primary)]"
                      href={PRODUCTION_ROUTES.jobDetail(job.id)}
                    >
                      {job.code}
                    </Link>
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

                  <p className="mt-2 text-sm text-stone-600">
                    {job.project?.title ?? "Sin proyecto"} · {job.quotation?.code ?? "Sin cotizacion"}{" "}
                    · {job.cuttingPlan?.code ?? "Sin plan de corte"}
                  </p>

                  {job.notes ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
                      {job.notes}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 text-right text-sm text-stone-600">
                  <p>
                    Inicio planificado:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatDateOnlyValue(job.plannedStartDate)}
                    </span>
                  </p>
                  <p>
                    Fin planificado:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatDateOnlyValue(job.plannedEndDate)}
                    </span>
                  </p>
                  <p>
                    Asignado:{" "}
                    <span className="font-semibold text-stone-950">
                      {job.assignedToUser?.name ?? "Sin asignar"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1rem] bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Items
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">{job.itemCount}</p>
                </div>
                <div className="rounded-[1rem] bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Tareas
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {job.completedTaskCount}/{job.taskCount}
                  </p>
                </div>
                <div className="rounded-[1rem] bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Tareas pendientes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {job.pendingTaskCount}
                  </p>
                </div>
                <div className="rounded-[1rem] bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Controles de calidad
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {job.qualityCheckCount}
                  </p>
                </div>
                <div className="rounded-[1rem] bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Variacion de merma
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {job.wasteReport
                      ? formatProductionArea(job.wasteReport.varianceAreaM2)
                      : "No calculada"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  className="text-sm font-semibold text-[color:var(--color-primary)]"
                  href={PRODUCTION_ROUTES.jobDetail(job.id)}
                >
                  Abrir orden
                </Link>
                <Link
                  className="text-sm font-semibold text-[color:var(--color-primary)]"
                  href={PRODUCTION_ROUTES.jobTasks(job.id)}
                >
                  Tareas
                </Link>
                <Link
                  className="text-sm font-semibold text-[color:var(--color-primary)]"
                  href={PRODUCTION_ROUTES.jobQuality(job.id)}
                >
                  Calidad
                </Link>
                <Link
                  className="text-sm font-semibold text-[color:var(--color-primary)]"
                  href={PRODUCTION_ROUTES.jobWaste(job.id)}
                >
                  Merma
                </Link>
              </div>
            </article>
          );
        })}

        {jobs.length === 0 ? (
          <EmptyState
            description="Crea una orden manual o genera una desde una cotizacion o plan de corte aprobado para empezar la cola de produccion."
            title="No se encontraron ordenes de produccion"
          />
        ) : null}
      </section>
    </main>
  );
}
