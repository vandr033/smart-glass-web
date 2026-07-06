"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { CUTTING_ROUTES } from "@/modules/cutting/constants";
import {
  fieldClassName,
  formatDateOnlyValue,
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/modules/commercial/ui";
import { PROJECTS_ROUTES } from "@/modules/projects/constants";
import { QUOTATIONS_ROUTES } from "@/modules/quotations/constants";
import { productionService } from "@/services/production-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

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
  getProductionTaskStatusBadge,
  getProductionTaskTypeLabel,
  getQualityCheckStatusBadge,
} from "../ui";

type ProductionJobDetailPageProps = {
  jobId: string;
};

const invalidateProductionQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  jobId: string,
) => {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["production"],
    }),
    queryClient.invalidateQueries({
      queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
    }),
    queryClient.invalidateQueries({
      queryKey: PRODUCTION_QUERY_KEYS.jobTasks(jobId),
    }),
    queryClient.invalidateQueries({
      queryKey: PRODUCTION_QUERY_KEYS.jobConsumption(jobId),
    }),
    queryClient.invalidateQueries({
      queryKey: PRODUCTION_QUERY_KEYS.jobQuality(jobId),
    }),
    queryClient.invalidateQueries({
      queryKey: PRODUCTION_QUERY_KEYS.jobWaste(jobId),
    }),
  ]);
};

export default function ProductionJobDetailPage({
  jobId,
}: ProductionJobDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [assignedToUserId, setAssignedToUserId] = useState<string | null>(null);
  const [replaceExistingTasks, setReplaceExistingTasks] = useState(false);

  const canUpdate = permissions.includes(PRODUCTION_PERMISSIONS.update);
  const canDelete = permissions.includes(PRODUCTION_PERMISSIONS.delete);
  const canStart = permissions.includes(PRODUCTION_PERMISSIONS.start);
  const canComplete = permissions.includes(PRODUCTION_PERMISSIONS.complete);

  const jobQuery = useQuery({
    queryFn: () => productionService.getJobById(jobId),
    queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
    staleTime: 30_000,
  });
  const usersQuery = useQuery({
    enabled: canUpdate,
    queryFn: userService.getUserOptions,
    queryKey: ["production", "job-detail", jobId, "users"],
    staleTime: 60_000,
  });

  const refreshJob = async () => {
    await invalidateProductionQueries(queryClient, jobId);
  };

  const startMutation = useMutation({
    mutationFn: () => productionService.startJob(jobId),
    onSuccess: refreshJob,
  });
  const pauseMutation = useMutation({
    mutationFn: () => productionService.pauseJob(jobId),
    onSuccess: refreshJob,
  });
  const completeMutation = useMutation({
    mutationFn: () => productionService.completeJob(jobId),
    onSuccess: refreshJob,
  });
  const cancelMutation = useMutation({
    mutationFn: () => productionService.cancelJob(jobId),
    onSuccess: refreshJob,
  });
  const assignMutation = useMutation({
    mutationFn: () =>
      productionService.assignJob(
        jobId,
        assignedToUserId === null ? (jobQuery.data?.assignedToUser?.id ?? null) : (assignedToUserId || null),
      ),
    onSuccess: async () => {
      setAssignedToUserId(null);
      await refreshJob();
    },
  });
  const generateTasksMutation = useMutation({
    mutationFn: () => productionService.generateTasks(jobId, replaceExistingTasks),
    onSuccess: refreshJob,
  });
  const deleteMutation = useMutation({
    mutationFn: () => productionService.deleteJob(jobId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["production"],
      });
      router.push(PRODUCTION_ROUTES.jobs);
    },
  });

  const isUsersPending = canUpdate && usersQuery.isPending;
  const isUsersError = canUpdate && usersQuery.isError;

  if (jobQuery.isPending || isUsersPending) {
    return <LoadingState title="Loading production job" />;
  }

  if (jobQuery.isError || isUsersError) {
    return (
      <ErrorState
        description={
          jobQuery.error?.message ??
          usersQuery.error?.message ??
          "No se pudo cargar la orden de produccion."
        }
        title="La orden de produccion no esta disponible"
      />
    );
  }

  const job = jobQuery.data;
  const statusBadge = getProductionJobStatusBadge(job.status);
  const priorityBadge = getProductionPriorityBadge(job.priority);
  const activeError =
    startMutation.error ??
    pauseMutation.error ??
    completeMutation.error ??
    cancelMutation.error ??
    assignMutation.error ??
    generateTasksMutation.error ??
    deleteMutation.error;
  const recentConsumptions = job.materialConsumptions.slice(0, 5);
  const recentChecks = job.qualityChecks.slice(0, 5);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PRODUCTION_ROUTES.jobs}>
              Back to Jobs
            </Link>
            <Link className={secondaryButtonClassName} href={PRODUCTION_ROUTES.jobTasks(job.id)}>
              Tasks
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobQuality(job.id)}
            >
              Quality
            </Link>
            <Link className={secondaryButtonClassName} href={PRODUCTION_ROUTES.jobWaste(job.id)}>
              Waste
            </Link>
          </>
        }
        description="Revisa registros vinculados, gestiona el estado de la orden, asigna responsables de piso y mantien alineadas las senales de fabricacion, calidad y merma conforme avanza la produccion."
        eyebrow="Produccion"
        title={job.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
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
          <span className="text-sm text-stone-700">
            Assigned to {job.assignedToUser?.name ?? "no one yet"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Planned Start
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateOnlyValue(job.plannedStartDate)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Planned End
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateOnlyValue(job.plannedEndDate)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Actual Start
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateValue(job.actualStartDate)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Actual End
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateValue(job.actualEndDate)}
            </p>
          </div>
        </div>

        {job.notes ? (
          <div className="mt-5 rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">{job.notes}</p>
          </div>
        ) : null}

        {activeError ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(activeError)}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Job Actions
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Status, assignment, and task generation
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                className={secondaryButtonClassName}
                disabled={startMutation.isPending || !canStart || job.status === "IN_PROGRESS"}
                onClick={() => {
                  void startMutation.mutateAsync();
                }}
                type="button"
              >
                Start Job
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={pauseMutation.isPending || !canStart || job.status !== "IN_PROGRESS"}
                onClick={() => {
                  void pauseMutation.mutateAsync();
                }}
                type="button"
              >
                Pause Job
              </button>
              <button
                className={primaryButtonClassName}
                disabled={
                  completeMutation.isPending ||
                  !canComplete ||
                  ["CANCELLED", "COMPLETED", "DRAFT"].includes(job.status)
                }
                onClick={() => {
                  void completeMutation.mutateAsync();
                }}
                type="button"
              >
                Complete Job
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={
                  cancelMutation.isPending || !canUpdate || ["CANCELLED", "COMPLETED"].includes(job.status)
                }
                onClick={() => {
                  void cancelMutation.mutateAsync();
                }}
                type="button"
              >
                Cancel Job
              </button>
              {canDelete ? (
                <button
                  className={secondaryButtonClassName}
                  disabled={deleteMutation.isPending || !["DRAFT", "CANCELLED"].includes(job.status)}
                  onClick={() => {
                    void deleteMutation.mutateAsync();
                  }}
                  type="button"
                >
                  Delete Job
                </button>
              ) : null}
            </div>

            <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50 px-4 py-4">
              <div className="flex flex-wrap items-end gap-4">
                <label className="grid min-w-[18rem] flex-1 gap-2">
                  <span className="text-sm font-medium text-stone-700">Assigned user</span>
                  <select
                    className={fieldClassName}
                    disabled={!canUpdate}
                    onChange={(event) => {
                      setAssignedToUserId(event.target.value);
                    }}
                    value={assignedToUserId ?? job.assignedToUser?.id ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {(usersQuery.data ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} · {user.email}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className={primaryButtonClassName}
                  disabled={assignMutation.isPending || !canUpdate}
                  onClick={() => {
                    void assignMutation.mutateAsync();
                  }}
                  type="button"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Task Queue
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Generate a default task sequence from the job items when the floor needs a working
              checklist.
            </p>

            <label className="mt-4 flex items-center gap-3 text-sm text-stone-700">
              <input
                checked={replaceExistingTasks}
                onChange={(event) => {
                  setReplaceExistingTasks(event.target.checked);
                }}
                type="checkbox"
              />
              Replace existing tasks
            </label>

            <button
              className={`mt-4 w-full ${primaryButtonClassName}`}
              disabled={generateTasksMutation.isPending || !canUpdate}
              onClick={() => {
                void generateTasksMutation.mutateAsync();
              }}
              type="button"
            >
              Generate Tasks
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Linked Records
          </p>
          <div className="mt-4 space-y-3 text-sm text-stone-700">
            <p>
              Project:{" "}
              {job.project ? (
                <Link
                  className="font-semibold text-[color:var(--color-primary)]"
                  href={PROJECTS_ROUTES.view(job.project.id)}
                >
                  {job.project.code} · {job.project.title}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>
            <p>
              Quotation:{" "}
              {job.quotation ? (
                <Link
                  className="font-semibold text-[color:var(--color-primary)]"
                  href={QUOTATIONS_ROUTES.view(job.quotation.id)}
                >
                  {job.quotation.code}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>
            <p>
              Cutting plan:{" "}
              {job.cuttingPlan ? (
                <Link
                  className="font-semibold text-[color:var(--color-primary)]"
                  href={CUTTING_ROUTES.planDetail(job.cuttingPlan.id)}
                >
                  {job.cuttingPlan.code}
                </Link>
              ) : (
                "Not linked"
              )}
            </p>
            <p>
              Created by:{" "}
              <span className="font-semibold text-stone-950">
                {job.createdByUser?.name ?? "System"}
              </span>
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Waste Snapshot
          </p>

          {job.wasteReport ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[1rem] bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Theoretical
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950">
                  {formatProductionArea(job.wasteReport.theoreticalWasteAreaM2)}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {formatProductionPercent(job.wasteReport.theoreticalWastePercent)}
                </p>
              </div>
              <div className="rounded-[1rem] bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Actual
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950">
                  {formatProductionArea(job.wasteReport.actualWasteAreaM2)}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {formatProductionPercent(job.wasteReport.actualWastePercent)}
                </p>
              </div>
              <div className="rounded-[1rem] bg-stone-50 px-4 py-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Variance
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950">
                  {formatProductionArea(job.wasteReport.varianceAreaM2)}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {formatProductionPercent(job.wasteReport.variancePercent)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                description="Once waste is calculated for this job, theoretical versus actual production waste will show here."
                title="No waste report yet"
              />
            </div>
          )}
        </section>
      </div>

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Job Items
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              What this job is producing
            </h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {job.items.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.15rem] border border-stone-200 bg-stone-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-950">{item.name}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {item.material?.code ?? "No material"} · Qty {item.quantity}
                  </p>
                </div>
                <p className="text-xs font-medium text-stone-500">{item.status}</p>
              </div>

              {item.description ? (
                <p className="mt-3 text-sm leading-6 text-stone-700">{item.description}</p>
              ) : null}
            </div>
          ))}

          {job.items.length === 0 ? (
            <EmptyState
              description="This job does not yet have explicit production items."
              title="No items registered"
            />
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Tasks
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Current floor sequence
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PRODUCTION_ROUTES.jobTasks(job.id)}
            >
              Open tasks
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {job.tasks.slice(0, 5).map((task) => {
              const taskBadge = getProductionTaskStatusBadge(task.status);

              return (
                <div
                  key={task.id}
                  className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{task.title}</p>
                      <p className="mt-1 text-xs text-stone-600">
                        {getProductionTaskTypeLabel(task.taskType)} ·{" "}
                        {task.assignedToUser?.name ?? "Unassigned"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${taskBadge.className}`}
                    >
                      {taskBadge.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {job.tasks.length === 0 ? (
              <EmptyState
                description="Generate a task sequence for this job to start coordinating floor execution."
                title="No tasks yet"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Quality
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Recent checkpoints
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PRODUCTION_ROUTES.jobQuality(job.id)}
            >
              Open quality
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentChecks.map((check) => {
              const badge = getQualityCheckStatusBadge(check.status);

              return (
                <div
                  key={check.id}
                  className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {check.productionTaskId ? "Task-linked quality check" : "Job quality check"}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {check.checkedByUser?.name ?? "Pending reviewer"} ·{" "}
                        {formatDateValue(check.checkedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}

            {recentChecks.length === 0 ? (
              <EmptyState
                description="Quality checks recorded for this job will appear here."
                title="No quality checks yet"
              />
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Material Consumption
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Most recent consumption entries
              </h2>
            </div>
            <Link
              className="text-sm font-semibold text-[color:var(--color-primary)]"
              href={PRODUCTION_ROUTES.jobTasks(job.id)}
            >
              Record more
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentConsumptions.map((consumption) => (
              <div
                key={consumption.id}
                className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {consumption.material?.name ?? "Manual material"} · {consumption.quantity}{" "}
                      {consumption.unit}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {consumption.consumptionType} · {consumption.sourceType} ·{" "}
                      {formatDateValue(consumption.consumedAt)}
                    </p>
                  </div>
                  <p className="text-xs font-medium text-stone-500">
                    {consumption.consumedByUser?.name ?? "System"}
                  </p>
                </div>

                {consumption.notes ? (
                  <p className="mt-3 text-sm leading-6 text-stone-700">{consumption.notes}</p>
                ) : null}
              </div>
            ))}

            {recentConsumptions.length === 0 ? (
              <EmptyState
                description="Consumption entries will appear here after tasks begin pulling from stock or remnants."
                title="No material consumption yet"
              />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Status History
          </p>

          <div className="mt-4 space-y-3">
            {job.statusHistory.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {entry.fromStatus ?? "Initial"} to {entry.toStatus}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {entry.changedByUser?.name ?? "System"} · {formatDateValue(entry.createdAt)}
                    </p>
                  </div>
                </div>

                {entry.notes ? (
                  <p className="mt-3 text-sm leading-6 text-stone-700">{entry.notes}</p>
                ) : null}
              </div>
            ))}

            {job.statusHistory.length === 0 ? (
              <EmptyState
                description="Status changes will be logged here as the job moves through production."
                title="No history yet"
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
