"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { productionService } from "@/services/production-service";
import type { QualityCheckStatus } from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  PRODUCTION_PERMISSIONS,
  PRODUCTION_QUERY_KEYS,
  PRODUCTION_ROUTES,
  QUALITY_CHECK_STATUS_LABELS,
} from "../constants";
import { getQualityCheckStatusBadge } from "../ui";

type ProductionJobQualityPageProps = {
  jobId: string;
};

export default function ProductionJobQualityPage({
  jobId,
}: ProductionJobQualityPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canRecord = permissions.includes(PRODUCTION_PERMISSIONS.qualityCheck);

  const [status, setStatus] = useState<QualityCheckStatus>("PENDING");
  const [productionTaskId, setProductionTaskId] = useState("");
  const [notes, setNotes] = useState("");
  const [evidenceJson, setEvidenceJson] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const jobQuery = useQuery({
    queryFn: () => productionService.getJobById(jobId),
    queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
    staleTime: 30_000,
  });
  const checksQuery = useQuery({
    queryFn: () => productionService.listQualityChecks(jobId),
    queryKey: PRODUCTION_QUERY_KEYS.jobQuality(jobId),
    staleTime: 30_000,
  });

  const recordMutation = useMutation({
    mutationFn: async () => {
      let parsedEvidence: Record<string, unknown> | null = null;

      if (evidenceJson.trim()) {
        try {
          parsedEvidence = JSON.parse(evidenceJson) as Record<string, unknown>;
          setJsonError(null);
        } catch {
          setJsonError(
            "La evidencia debe contener un JSON válido antes de registrarse.",
          );
          throw new Error(
            "La evidencia debe contener un JSON válido antes de registrarse.",
          );
        }
      }

      return productionService.recordQualityCheck(jobId, {
        evidenceJson: parsedEvidence,
        notes: notes.trim() || null,
        productionTaskId: productionTaskId || null,
        status,
      });
    },
    onSuccess: async () => {
      setNotes("");
      setEvidenceJson("");
      setProductionTaskId("");
      setStatus("PENDING");
      setJsonError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["production"],
        }),
        queryClient.invalidateQueries({
          queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
        }),
        queryClient.invalidateQueries({
          queryKey: PRODUCTION_QUERY_KEYS.jobQuality(jobId),
        }),
      ]);
    },
  });

  if (jobQuery.isPending || checksQuery.isPending) {
    return <LoadingState title="Cargando control de calidad" />;
  }

  if (jobQuery.isError || checksQuery.isError) {
    return (
      <ErrorState
        description={
          jobQuery.error?.message ??
          checksQuery.error?.message ??
          "No fue posible cargar el control de calidad."
        }
        title="La calidad de produccion no esta disponible"
      />
    );
  }

  const job = jobQuery.data;
  const checks = checksQuery.data;
  const passedChecks = checks.filter((check) => check.status === "PASSED");
  const failedChecks = checks.filter((check) =>
    ["FAILED", "REWORK_REQUIRED"].includes(check.status),
  );
  const pendingChecks = checks.filter((check) => check.status === "PENDING");
  const activeError = recordMutation.error
    ? getApiErrorMessage(recordMutation.error)
    : jsonError;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobDetail(job.id)}
            >
              Resumen del trabajo
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobTasks(job.id)}
            >
              Tareas
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobWaste(job.id)}
            >
              Desperdicios
            </Link>
          </>
        }
        description="Registra inspecciones de piso o finales, adjunta evidencias cuando sea necesario y mantiene visibles los senales de retrabajo antes de marcar tareas como realmente completadas."
        eyebrow="Produccion"
        title={`${job.code} Calidad`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Controles registrados
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {checks.length}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Passed
          </p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">
            {passedChecks.length}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Failed or Rework
          </p>
          <p className="mt-3 text-3xl font-semibold text-rose-700">
            {failedChecks.length}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Pending
          </p>
          <p className="mt-3 text-3xl font-semibold text-sky-700">
            {pendingChecks.length}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            New Check
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Record a quality checkpoint
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Status</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setStatus(event.target.value as QualityCheckStatus);
              }}
              value={status}
            >
              {Object.entries(QUALITY_CHECK_STATUS_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-3">
            <span className="text-sm font-medium text-stone-700">Task</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setProductionTaskId(event.target.value);
              }}
              value={productionTaskId}
            >
              <option value="">Job-level check</option>
              {job.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.sortOrder} · {task.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-4">
            <span className="text-sm font-medium text-stone-700">Notes</span>
            <textarea
              className={textAreaClassName}
              onChange={(event) => {
                setNotes(event.target.value);
              }}
              placeholder="What was checked, what passed, or what needs rework"
              value={notes}
            />
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-4">
            <span className="text-sm font-medium text-stone-700">
              Evidence JSON
            </span>
            <textarea
              className={textAreaClassName}
              onChange={(event) => {
                setEvidenceJson(event.target.value);
              }}
              placeholder='Optional structured payload, for example {"photos":["url-1"],"inspector":"QA-01"}'
              value={evidenceJson}
            />
          </label>
        </div>

        {activeError ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {activeError}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className={primaryButtonClassName}
            disabled={recordMutation.isPending || !canRecord}
            onClick={() => {
              void recordMutation.mutateAsync();
            }}
            type="button"
          >
            Record Quality Check
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            History
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Recorded checks
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {checks.map((check) => {
            const badge = getQualityCheckStatusBadge(check.status);
            const linkedTask = check.productionTaskId
              ? (job.tasks.find((task) => task.id === check.productionTaskId) ??
                null)
              : null;

            return (
              <div
                key={check.id}
                className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {linkedTask
                        ? linkedTask.title
                        : "Job-level quality review"}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {check.checkedByUser?.name ?? "Pending reviewer"} ·{" "}
                      {formatDateValue(check.checkedAt ?? check.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {check.notes ? (
                  <p className="mt-3 text-sm leading-6 text-stone-700">
                    {check.notes}
                  </p>
                ) : null}

                {check.evidenceJson ? (
                  <pre className="mt-3 overflow-x-auto rounded-[1rem] bg-stone-950/95 px-4 py-3 text-xs text-stone-100">
                    {JSON.stringify(check.evidenceJson, null, 2)}
                  </pre>
                ) : null}
              </div>
            );
          })}

          {checks.length === 0 ? (
            <EmptyState
              description="Checks recorded during fabrication, assembly, or final review will appear here."
              title="No quality checks yet"
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
