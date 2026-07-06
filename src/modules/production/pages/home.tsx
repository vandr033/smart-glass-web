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
    return "No due date";
  }

  const dueDate = new Date(plannedEndDate);
  const diffDays = Math.ceil(
    (dueDate.getTime() - now) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day(s) overdue`;
  }

  if (diffDays === 0) {
    return "Due today";
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
    return <LoadingState title="Preparing production workspace" />;
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
        description="Track jobs flowing in from quotations and cutting, spot deadline risk early, and keep material consumption, quality checks, and waste signals visible from one place."
        eyebrow="Operations"
        title="Produccion"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="All production jobs currently registered in the system."
          icon={Factory}
          label="Total Jobs"
          value={String(jobsQuery.data.pagination.total)}
        />
        <StatCard
          description="Jobs that are ready, active, or temporarily paused on the floor."
          icon={ClipboardCheck}
          label="Active Queue"
          tone="accent"
          value={String(activeJobs.length)}
        />
        <StatCard
          description="Urgent jobs still open and needing immediate production attention."
          icon={AlertTriangle}
          label="Urgent Jobs"
          value={String(urgentJobs.length)}
        />
        <StatCard
          description="Tasks still pending, in progress, or blocked across all visible jobs."
          icon={PackageSearch}
          label="Pending Tasks"
          value={String(pendingTasks)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Deadline Watch
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Jobs due soon
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
                        {job.project?.title ?? job.quotation?.code ?? "Manual job"} ·{" "}
                        {job.pendingTaskCount} pending task(s)
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
                description="Open jobs with planned end dates in the next week will surface here automatically."
                title="No near-term deadlines"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Waste Watch
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Jobs with variance signals
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PRODUCTION_ROUTES.jobs}
            >
              View jobs
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
                      {job.cuttingPlan?.code ?? "No cutting plan"} ·{" "}
                      {job.wasteReport?.hasActualWasteData
                        ? "Actual waste recorded"
                        : "Theoretical estimate only"}
                    </p>
                  </div>
                  <div className="text-right text-xs text-stone-500">
                    <p>
                      Variance{" "}
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
                description="Waste reports will appear here after jobs with cutting plans begin recording production consumption or recalculating waste."
                title="No waste signals yet"
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
