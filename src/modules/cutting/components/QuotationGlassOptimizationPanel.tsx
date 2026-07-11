"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, RefreshCcw, Scissors } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import { cuttingService } from "@/services/cutting-service";
import { getApiErrorMessage } from "@/utils";

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

type QuotationGlassOptimizationPanelProps = {
  quotationId: string;
};

export function QuotationGlassOptimizationPanel({
  quotationId,
}: QuotationGlassOptimizationPanelProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canRun = permissions.includes(CUTTING_PERMISSIONS.run);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const requirementsQuery = useQuery({
    queryFn: () => cuttingService.getQuotationGlassRequirements(quotationId),
    queryKey: CUTTING_QUERY_KEYS.quotationRequirements(quotationId),
    staleTime: 60_000,
  });

  const runMutation = useMutation({
    mutationFn: () =>
      cuttingService.runQuotationOptimization(quotationId, {
        mode: "COMMERCIAL_ESTIMATION",
      }),
    onSuccess: async (result) => {
      setFeedbackMessage("La optimización comercial del vidrio se completó correctamente.");
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.quotationRequirements(quotationId),
      });
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.optimizations({ quotationId }),
      });
      setLatestRunId(result.run.id);
    },
    onError: (error) => {
      setFeedbackMessage(getApiErrorMessage(error));
    },
  });
  const [latestRunId, setLatestRunId] = useState<string | null>(null);
  const latestRun =
    runMutation.data?.run ?? null;

  if (requirementsQuery.isPending) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5">
        <LoadingState
          title="Preparando los requerimientos de vidrio"
        />
      </section>
    );
  }

  if (requirementsQuery.isError) {
    return (
      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5">
        <ErrorState
          action={
            <button
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              onClick={() => {
                void requirementsQuery.refetch();
              }}
              type="button"
            >
              Retry
            </button>
          }
          description={requirementsQuery.error.message}
          title="No se pudieron extraer los requisitos de vidrio"
        />
      </section>
    );
  }

  const requirements = requirementsQuery.data;
  const pieceCount = requirements.pieces.reduce(
    (total, piece) => total + piece.quantity,
    0,
  );
  const estimatedArea = requirements.pieces.reduce(
    (total, piece) => total + (piece.widthMm * piece.heightMm * piece.quantity) / 1_000_000,
    0,
  );
  const runStatusBadge = latestRun ? getCuttingRunStatusBadge(latestRun.status) : null;

  return (
    <section className="rounded-lg border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(239,246,255,0.92))] px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
            Glass Optimization
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Quotation sheet requirements
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
            Extracted glass pieces can be estimated immediately for quotation-stage waste and virtual sheet demand without consuming inventory.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={runMutation.isPending}
            onClick={() => {
              void requirementsQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </button>
          <button
            className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canRun || runMutation.isPending || requirements.pieces.length === 0}
            onClick={() => {
              setFeedbackMessage(null);
              void runMutation.mutateAsync();
            }}
            type="button"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            Run Commercial Estimation
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-md bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Pieces
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">{pieceCount}</p>
        </div>
        <div className="rounded-md bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Estimated Area
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {formatCuttingArea(estimatedArea)}
          </p>
        </div>
        <div className="rounded-md bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Warnings
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {requirements.warnings.length}
          </p>
        </div>
      </div>

      {requirements.warnings.length > 0 ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {requirements.warnings.join(" ")}
        </div>
      ) : null}

      {feedbackMessage ? (
        <div className="mt-5 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {feedbackMessage}
        </div>
      ) : null}

      {latestRun ? (
        <div className="mt-5 rounded-md border border-stone-200 bg-white px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Latest estimation run
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${runStatusBadge?.className ?? "bg-stone-200 text-stone-700"}`}
                >
                  {runStatusBadge?.label ?? latestRun.status}
                </span>
                <span className="text-sm text-stone-700">
                  {latestRun.code} · {getCuttingModeLabel(latestRun.mode)}
                </span>
              </div>
            </div>

            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={CUTTING_ROUTES.optimizationDetail(latestRun.id)}
            >
              <Scissors className="mr-2 h-4 w-4" />
              Open Run
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1rem] bg-stone-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Required area
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-950">
                {formatCuttingArea(latestRun.totalRequiredAreaM2)}
              </p>
            </div>
            <div className="rounded-[1rem] bg-stone-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Sheet area
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-950">
                {formatCuttingArea(latestRun.totalSheetAreaM2)}
              </p>
            </div>
            <div className="rounded-[1rem] bg-stone-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Waste
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-950">
                {formatCuttingPercent(latestRun.wastePercent)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-md border border-stone-200 bg-white px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          Sample extracted pieces
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {requirements.pieces.slice(0, 6).map((piece) => (
            <div
              key={`${piece.label}-${piece.widthMm}-${piece.heightMm}`}
              className="rounded-[1rem] bg-stone-50 px-3 py-3"
            >
              <p className="text-sm font-semibold text-stone-950">{piece.label}</p>
              <p className="mt-1 text-xs text-stone-600">
                {Math.round(piece.widthMm)} × {Math.round(piece.heightMm)} mm
              </p>
            </div>
          ))}
          {requirements.pieces.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-600">
              No glass pieces were extracted from this quotation yet.
            </div>
          ) : null}
        </div>
        {latestRunId ? (
          <p className="mt-3 text-xs text-stone-500">Latest run id: {latestRunId}</p>
        ) : null}
      </div>
    </section>
  );
}
