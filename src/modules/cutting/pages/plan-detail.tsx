"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  getCuttingPlanStatusBadge,
  getSheetSourceLabel,
} from "../ui";

type CuttingPlanDetailPageProps = {
  planId: string;
};

export default function CuttingPlanDetailPage({
  planId,
}: CuttingPlanDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canApprove = permissions.includes(CUTTING_PERMISSIONS.approve);
  const canCreateRemnants = permissions.includes(CUTTING_PERMISSIONS.createRemnants);
  const canPrint = permissions.includes(CUTTING_PERMISSIONS.print);
  const planQuery = useQuery({
    queryFn: () => cuttingService.getPlanById(planId),
    queryKey: CUTTING_QUERY_KEYS.planDetail(planId),
    staleTime: 30_000,
  });
  const approveMutation = useMutation({
    mutationFn: () => cuttingService.approvePlan(planId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.planDetail(planId),
      });
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.plans({}),
      });
    },
  });
  const createRemnantsMutation = useMutation({
    mutationFn: () => cuttingService.createRemnants(planId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CUTTING_QUERY_KEYS.planDetail(planId),
      });
    },
  });

  if (planQuery.isPending) {
    return (
      <LoadingState
        title="Preparando el plan de corte"
      />
    );
  }

  if (planQuery.isError) {
    return (
      <ErrorState
        description={planQuery.error.message}
        title="No se pudo cargar el plan de corte"
      />
    );
  }

  const plan = planQuery.data;
  const badge = getCuttingPlanStatusBadge(plan.status);
  const createdRemnants = plan.sheets.flatMap((sheet) =>
    sheet.remnantOutputs.filter((output) => output.status === "CREATED"),
  );

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={CUTTING_ROUTES.plans}
            >
              Volver a planes
            </Link>
            {canPrint ? (
              <Link
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                href={CUTTING_ROUTES.planPrint(plan.id)}
              >
                Imprimir diseño
              </Link>
            ) : null}
            <button
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canApprove || approveMutation.isPending || plan.status !== "DRAFT"}
              onClick={() => {
                void approveMutation.mutateAsync();
              }}
              type="button"
            >
              Aprobar plan
            </button>
            <button
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !canCreateRemnants ||
                createRemnantsMutation.isPending ||
                plan.status !== "APPROVED" ||
                createdRemnants.length > 0
              }
              onClick={() => {
                void createRemnantsMutation.mutateAsync();
              }}
              type="button"
            >
              Crear remanentes
            </button>
          </>
        }
        description="Valida cada diseño de lámina, confirma el desperdicio y los remanentes planificados, y luego aprueba o crea los registros correspondientes."
        eyebrow="Corte"
        title={plan.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-stone-700">
            {plan.material.name} · {plan.optimizationRun.code}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Láminas
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">{plan.sheetCount}</p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Required Area
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingArea(plan.totalRequiredAreaM2)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Waste Area
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingArea(plan.totalWasteAreaM2)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Waste Percent
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatCuttingPercent(plan.wastePercent)}
            </p>
          </div>
        </div>

        {(approveMutation.error || createRemnantsMutation.error) ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(approveMutation.error ?? createRemnantsMutation.error)}
          </div>
        ) : null}

        {createdRemnants.length > 0 ? (
          <div className="mt-5 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {createdRemnants.length} remnant output(s) were created from this plan.
          </div>
        ) : null}
      </section>

      <section className="grid gap-6">
        {plan.sheets.map((sheet) => (
          <section
            key={sheet.id}
            className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {getSheetSourceLabel(sheet.sheetSource)}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Sheet {sheet.sortOrder + 1}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  {sheet.pieces.length} placed pieces · {sheet.remnantOutputs.length} remnant zones
                </p>
              </div>

              <div className="grid gap-2 text-right text-sm text-stone-600">
                <p>
                  Used area:{" "}
                  <span className="font-semibold text-stone-950">
                    {formatCuttingArea(sheet.usedAreaM2)}
                  </span>
                </p>
                <p>
                  Waste:{" "}
                  <span className="font-semibold text-stone-950">
                    {formatCuttingPercent(sheet.wastePercent)}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <CuttingLayoutPreview sheet={sheet} />

              <div className="space-y-4">
                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Placed Pieces
                  </p>
                  <div className="mt-3 space-y-2">
                    {sheet.pieces.map((piece) => (
                      <div
                        key={piece.id}
                        className="rounded-[1rem] bg-white px-3 py-3 text-sm text-stone-700"
                      >
                        <p className="font-semibold text-stone-950">{piece.label}</p>
                        <p className="mt-1 text-xs text-stone-600">
                          {Math.round(piece.widthMm)} × {Math.round(piece.heightMm)} mm
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Planned Remnants
                  </p>
                  <div className="mt-3 space-y-2">
                    {sheet.remnantOutputs.map((output) => (
                      <div
                        key={output.id}
                        className="rounded-[1rem] bg-white px-3 py-3 text-sm text-stone-700"
                      >
                        <p className="font-semibold text-stone-950">
                          {Math.round(output.widthMm)} × {Math.round(output.heightMm)} mm
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {formatCuttingArea(output.areaM2)} · {output.status}
                        </p>
                      </div>
                    ))}
                    {sheet.remnantOutputs.length === 0 ? (
                      <p className="text-sm text-stone-600">
                        No remnant zones were identified for this sheet.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
