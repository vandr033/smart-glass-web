"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { cuttingService } from "@/services/cutting-service";
import { getApiErrorMessage } from "@/utils";

import { CuttingLayoutPreview } from "../components/CuttingLayoutPreview";
import {
  CUTTING_PERMISSIONS,
  CUTTING_QUERY_KEYS,
  CUTTING_ROUTES,
} from "../constants";
import {
  formatCuttingArea,
  formatCuttingPercent,
  getCuttingModeLabel,
  getCuttingRunStatusBadge,
} from "../ui";

type CuttingOptimizationDetailPageProps = {
  runId: string;
};

export default function CuttingOptimizationDetailPage({
  runId,
}: CuttingOptimizationDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canRun = permissions.includes(CUTTING_PERMISSIONS.run);
  const optimizationQuery = useQuery({
    queryFn: () => cuttingService.getOptimizationById(runId),
    queryKey: CUTTING_QUERY_KEYS.optimizationDetail(runId),
    staleTime: 30_000,
  });
  const generatePlanMutation = useMutation({
    mutationFn: () => cuttingService.generatePlanFromRun(runId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.optimizationDetail(runId),
      });
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.plans({}),
      });
    },
  });
  const cancelMutation = useMutation({
    mutationFn: () => cuttingService.cancelOptimization(runId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.optimizationDetail(runId),
      });
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.optimizations({}),
      });
    },
  });

  if (optimizationQuery.isPending) {
    return (
      <LoadingState
        title="Preparando el detalle de la optimización"
      />
    );
  }

  if (optimizationQuery.isError) {
    return (
      <ErrorState
        description={optimizationQuery.error.message}
        title="No se pudo cargar la corrida de optimización"
      />
    );
  }

  const run = optimizationQuery.data;
  const badge = getCuttingRunStatusBadge(run.status);
  const allSheets = run.resultJson?.groups.flatMap((group) => group.sheets) ?? [];
  const createdPlans = generatePlanMutation.data ?? [];

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={CUTTING_ROUTES.optimizations}
            >
              Back to Runs
            </Link>
            <button
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canRun || cancelMutation.isPending || run.status === "APPROVED"}
              onClick={() => {
                void cancelMutation.mutateAsync();
              }}
              type="button"
            >
              Cancelar corrida
            </button>
            <button
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !canRun ||
                generatePlanMutation.isPending ||
                run.status === "FAILED" ||
                run.status === "CANCELLED" ||
                run.cuttingPlans.length > 0
              }
              onClick={() => {
                void generatePlanMutation.mutateAsync();
              }}
              type="button"
            >
              Generar plan de corte
            </button>
          </>
        }
        description="Inspecciona los requisitos de láminas extraídos, revisa las advertencias del diseño y genera planes posteriores cuando la corrida sea comercial u operativamente aceptable."
        eyebrow="Corte"
        title={run.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-stone-700">{getCuttingModeLabel(run.mode)}</span>
          <span className="text-sm text-stone-500">
            {run.quotation?.code ?? "Sin cotización"} {run.project ? `· ${run.project.code}` : ""}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Área requerida
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingArea(run.totalRequiredAreaM2)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Área de lámina
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingArea(run.totalSheetAreaM2)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Área de desperdicio
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingArea(run.estimatedWasteAreaM2)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Porcentaje de desperdicio
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingPercent(run.wastePercent)}
            </p>
          </div>
        </div>

        {run.errorMessage ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {run.errorMessage}
          </div>
        ) : null}

        {run.resultJson?.warnings.length ? (
          <div className="mt-5 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {run.resultJson.warnings.join(" ")}
          </div>
        ) : null}

        {(generatePlanMutation.error || cancelMutation.error) ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(generatePlanMutation.error ?? cancelMutation.error)}
          </div>
        ) : null}
      </section>

      {createdPlans.length > 0 ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-5">
          <p className="text-sm font-semibold text-emerald-900">
            Generación del plan de corte completada.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {createdPlans.map((plan) => (
              <Link
                key={plan.id}
                className="inline-flex items-center rounded-md border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:border-emerald-400"
                href={CUTTING_ROUTES.planDetail(plan.id)}
              >
                {plan.code}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {run.resultJson ? (
        <section className="space-y-6">
          {run.resultJson.groups.map((group) => (
            <section
              key={group.groupKey}
              className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Material
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                    {group.materialName}
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    {group.piecesRequested} requested pieces · {group.sheets.length} output sheets
                  </p>
                </div>

                <div className="grid gap-2 text-right text-sm text-stone-600">
                  <p>
                    Required area:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingArea(group.totals.requiredAreaM2)}
                    </span>
                  </p>
                  <p>
                    Waste:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatCuttingPercent(group.totals.wastePercent)}
                    </span>
                  </p>
                </div>
              </div>

              {group.warnings.length > 0 ? (
                <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {group.warnings.join(" ")}
                </div>
              ) : null}

              {group.unplacedPieces.length > 0 ? (
                <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {group.unplacedPieces.map((piece) => `${piece.label}: ${piece.reason}`).join(" ")}
                </div>
              ) : null}

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                {group.sheets.map((sheet) => (
                  <CuttingLayoutPreview
                    key={`${sheet.sourceId ?? sheet.sourceCode}-${sheet.widthMm}-${sheet.heightMm}`}
                    sheet={{
                      heightMm: sheet.heightMm,
                      layoutJson: {
                        heightMm: sheet.heightMm,
                        pieces: sheet.pieces,
                        remnantOutputs: sheet.remnantOutputs,
                        warnings: sheet.warnings,
                        widthMm: sheet.widthMm,
                      },
                      sheetSource: sheet.sheetSource,
                      widthMm: sheet.widthMm,
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : null}

      {run.resultJson && allSheets.length === 0 ? (
        <EmptyState
          description="Esta corrida no produjo diseños de lámina que puedan convertirse en un plan de corte."
          title="Sin resultado de diseño"
        />
      ) : null}
    </main>
  );
}
