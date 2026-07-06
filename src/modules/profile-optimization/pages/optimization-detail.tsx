"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import { profileOptimizationService } from "@/services/profile-optimization-service";
import { getApiErrorMessage } from "@/utils";

import {
  PROFILE_OPTIMIZATION_PERMISSIONS,
  PROFILE_OPTIMIZATION_QUERY_KEYS,
  PROFILE_OPTIMIZATION_ROUTES,
} from "../constants";
import {
  formatProfileLength,
  formatProfileMetersFromMm,
  formatProfilePercent,
  getProfileBarSourceLabel,
  getProfileModeLabel,
  getProfileRunStatusBadge,
} from "../ui";

type ProfileOptimizationDetailPageProps = {
  runId: string;
};

export default function ProfileOptimizationDetailPage({
  runId,
}: ProfileOptimizationDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canRun = permissions.includes(PROFILE_OPTIMIZATION_PERMISSIONS.run);
  const optimizationQuery = useQuery({
    queryFn: () => profileOptimizationService.getOptimizationById(runId),
    queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.optimizationDetail(runId),
    staleTime: 30_000,
  });
  const generatePlanMutation = useMutation({
    mutationFn: () => profileOptimizationService.generatePlanFromRun(runId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.optimizationDetail(runId),
      });
      await queryClient.invalidateQueries({
        queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.plans({}),
      });
    },
  });

  if (optimizationQuery.isPending) {
    return <LoadingState title="Preparando el detalle de la optimizacion de perfiles" />;
  }

  if (optimizationQuery.isError) {
    return (
      <ErrorState
        description={optimizationQuery.error.message}
        title="No se pudo cargar la optimizacion de perfiles"
      />
    );
  }

  const run = optimizationQuery.data;
  const badge = getProfileRunStatusBadge(run.status);
  const createdPlan = generatePlanMutation.data ?? run.cuttingPlans[0] ?? null;
  const result = run.resultJson;
  const efficiencyPercent = result?.efficiencyPercent ?? 0;
  const exportRows =
    result?.bars.flatMap((bar, barIndex) =>
      bar.cuts.map((cut) => ({
        bar,
        barIndex: barIndex + 1,
        cut,
      })),
    ) ?? [];

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PROFILE_OPTIMIZATION_ROUTES.optimizations}
            >
              Volver a optimizaciones
            </Link>
            {createdPlan ? (
              <Link
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                href={PROFILE_OPTIMIZATION_ROUTES.planDetail(createdPlan.id)}
              >
                Abrir plan de corte
              </Link>
            ) : null}
            <ExportMenu
              buttonClassName="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              disabled={exportRows.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(exportRows, {
                  columns: [
                    { header: "Barra", value: (row) => row.barIndex },
                    { header: "Origen", value: (row) => getProfileBarSourceLabel(row.bar.sourceType) },
                    { header: "Corte", value: (row) => row.cut.label },
                    { header: "Posicion", value: (row) => formatProfileLength(row.cut.positionMm) },
                    { header: "Longitud", value: (row) => formatProfileLength(row.cut.lengthMm) },
                    { header: "Desperdicio barra", value: (row) => formatProfileLength(row.bar.wasteLengthMm) },
                  ],
                  fileName: `${run.code}.xls`,
                  subtitle: `${run.material.name} · ${getProfileModeLabel(run.mode)}`,
                  title: `Optimizacion ${run.code}`,
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(exportRows, {
                  columns: [
                    { header: "Barra", value: (row) => row.barIndex },
                    { header: "Origen", value: (row) => getProfileBarSourceLabel(row.bar.sourceType) },
                    { header: "Corte", value: (row) => row.cut.label },
                    { header: "Longitud", value: (row) => formatProfileLength(row.cut.lengthMm) },
                    { header: "Desperdicio barra", value: (row) => formatProfileLength(row.bar.wasteLengthMm) },
                  ],
                  subtitle: `${run.material.name} · ${getProfileModeLabel(run.mode)}`,
                  title: `Optimizacion ${run.code}`,
                });
              }}
            />
            <button
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !canRun ||
                generatePlanMutation.isPending ||
                run.status !== "COMPLETED" ||
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
        description="Inspecciona los cortes extraidos, valida uso de remanentes e inventario y genera el plan de corte por barra solo cuando la corrida sea aceptable."
        eyebrow="Operaciones"
        title={run.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-stone-700">{getProfileModeLabel(run.mode)}</span>
          <span className="text-sm text-stone-500">
            {run.quotation?.code ?? "Sin cotizacion"} {run.project ? `· ${run.project.code}` : ""}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Longitud requerida
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfileMetersFromMm(run.totalRequiredLengthMm)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Longitud total de barras
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfileMetersFromMm(run.totalBarLengthMm)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Longitud de desperdicio
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfileMetersFromMm(run.totalWasteLengthMm)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Eficiencia
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfilePercent(efficiencyPercent)}
            </p>
          </div>
        </div>

        {result?.warnings.length ? (
          <div className="mt-5 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {result.warnings.join(" ")}
          </div>
        ) : null}

        {generatePlanMutation.error ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(generatePlanMutation.error)}
          </div>
        ) : null}

        {createdPlan ? (
          <div className="mt-5 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            El plan de corte ya esta listo.{" "}
            <Link
              className="font-semibold underline decoration-emerald-400 underline-offset-4"
              href={PROFILE_OPTIMIZATION_ROUTES.planDetail(createdPlan.id)}
            >
              Abrir {createdPlan.code}
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Cortes requeridos
              </p>
            <div className="mt-4 space-y-3">
              {run.inputJson.cuts.map((cut, index) => (
                <div
                  key={`${cut.label}-${cut.lengthMm}-${index}`}
                  className="rounded-[1rem] bg-stone-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">{cut.label}</p>
                      <p className="mt-1 text-xs text-stone-600">{run.material.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-stone-950">
                      × {cut.quantity}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-stone-700">
                    {formatProfileLength(cut.lengthMm)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {result ? (
            <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Resumen de abastecimiento
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1rem] bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Remanentes disponibles
                  </p>
                  <div className="mt-3 space-y-2">
                    {result.availableRemnants.map((remnant) => (
                      <div
                        key={remnant.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-3 text-sm"
                      >
                        <span className="font-medium text-stone-950">{remnant.code}</span>
                        <span className="text-stone-600">
                          {formatProfileLength(remnant.lengthMm)}
                        </span>
                      </div>
                    ))}
                    {result.availableRemnants.length === 0 ? (
                      <p className="text-sm text-stone-600">
                        No habia remanentes reutilizables disponibles para esta corrida.
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1rem] bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Barras disponibles
                  </p>
                  <div className="mt-3 space-y-2">
                    {result.availableInventoryBars.map((bar) => (
                      <div
                        key={bar.id}
                        className="rounded-md bg-white px-3 py-3 text-sm text-stone-700"
                      >
                        <p className="font-semibold text-stone-950">
                          {formatProfileLength(bar.lengthMm)} × {bar.quantityBars}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {bar.batchNumber ?? "Sin lote"} · {bar.locationCode ?? "Sin ubicacion"}
                        </p>
                      </div>
                    ))}
                    {result.availableInventoryBars.length === 0 ? (
                      <p className="text-sm text-stone-600">
                        No se usaron barras de inventario como candidatas en esta corrida.
                      </p>
                    ) : null}
                  </div>
                </div>

                {result.purchaseRequirement ? (
                  <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                      Compra requerida
                    </p>
                    <p className="mt-2 text-sm text-amber-900">
                      {result.purchaseRequirement.totalBars} barras ·{" "}
                      {formatProfileMetersFromMm(result.purchaseRequirement.totalLengthMm)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.purchaseRequirement.barLengths.map((bar) => (
                        <span
                          key={`${bar.lengthMm}-${bar.quantity}`}
                          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-900"
                        >
                          {formatProfileLength(bar.lengthMm)} × {bar.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          {result ? (
            result.bars.length > 0 ? (
              result.bars.map((bar, barIndex) => (
                <section
                  key={`${bar.sourceType}-${barIndex}`}
                  className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        {getProfileBarSourceLabel(bar.sourceType)}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-stone-950">
                        Barra {barIndex + 1}
                      </h2>
                      <p className="mt-2 text-sm text-stone-600">
                        {bar.sourceCode ?? "Asignacion generada"} ·{" "}
                        {formatProfileLength(bar.originalLengthMm)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-right text-sm text-stone-600">
                      <p>
                        Usado:{" "}
                        <span className="font-semibold text-stone-950">
                          {formatProfileLength(bar.usedLengthMm)}
                        </span>
                      </p>
                      <p>
                        Desperdicio:{" "}
                        <span className="font-semibold text-stone-950">
                          {formatProfileLength(bar.wasteLengthMm)}
                        </span>
                      </p>
                      <p>
                        Desperdicio %:{" "}
                        <span className="font-semibold text-stone-950">
                          {formatProfilePercent(bar.wastePercent)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Instrucciones de corte
                      </p>
                      <div className="mt-3 space-y-2">
                        {bar.cuts.map((cut) => (
                          <div
                            key={cut.cutId}
                            className="flex items-center justify-between gap-3 rounded-[1rem] bg-white px-3 py-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-stone-950">{cut.label}</p>
                              <p className="mt-1 text-xs text-stone-600">
                                Posicion {formatProfileLength(cut.positionMm)}
                              </p>
                            </div>
                            <span className="font-semibold text-stone-950">
                              {formatProfileLength(cut.lengthMm)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Salida de remanente
                        </p>
                        <p className="mt-3 text-sm font-semibold text-stone-950">
                          {formatProfileLength(bar.remnantOutput.remainingLengthMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {bar.remnantOutput.shouldCreateRemnant
                            ? "Apto para crear un remanente."
                            : "Por debajo del umbral minimo para crear remanente."}
                        </p>
                      </div>

                      <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                          Trazabilidad del origen
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-stone-700">
                          <p>
                            Stock de inventario:{" "}
                            <span className="font-semibold text-stone-950">
                              {bar.inventoryStockId ?? "Sin vinculo"}
                            </span>
                          </p>
                          <p>
                            Remanente origen:{" "}
                            <span className="font-semibold text-stone-950">
                              {bar.remnantPieceId ?? "Sin vinculo"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              ))
            ) : (
              <EmptyState
                description="La optimizacion termino sin producir barras asignadas."
                title="Sin asignaciones de barras"
              />
            )
          ) : (
            <EmptyState
              description="Esta corrida todavia no contiene un resultado de optimizacion."
              title="Resultado pendiente"
            />
          )}
        </div>
      </section>
    </main>
  );
}
