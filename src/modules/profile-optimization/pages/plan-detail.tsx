"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ExportMenu } from "@/components/ui/export-menu";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import { PRODUCTION_ROUTES } from "@/modules/production/constants";
import { PURCHASING_ROUTES } from "@/modules/purchasing/constants";
import { productionService } from "@/services/production-service";
import { profileOptimizationService } from "@/services/profile-optimization-service";
import { purchasingService } from "@/services/purchasing-service";
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
  getProfilePlanStatusBadge,
} from "../ui";

type ProfileCuttingPlanDetailPageProps = {
  planId: string;
};

export default function ProfileCuttingPlanDetailPage({
  planId,
}: ProfileCuttingPlanDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canCreateRemnants = permissions.includes(
    PROFILE_OPTIMIZATION_PERMISSIONS.createRemnants,
  );
  const canPrint = permissions.includes(PROFILE_OPTIMIZATION_PERMISSIONS.print);
  const canCreatePurchaseRequest = permissions.includes("purchasing.create");
  const canCreateProductionJob = permissions.includes("production.create");
  const planQuery = useQuery({
    queryFn: () => profileOptimizationService.getPlanById(planId),
    queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.planDetail(planId),
    staleTime: 30_000,
  });
  const createRemnantsMutation = useMutation({
    mutationFn: () => profileOptimizationService.createRemnants(planId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PROFILE_OPTIMIZATION_QUERY_KEYS.planDetail(planId),
      });
    },
  });
  const createPurchaseRequestMutation = useMutation({
    mutationFn: () =>
      purchasingService.createPurchaseRequestFromProfileCuttingPlan(planId),
  });
  const createProductionJobMutation = useMutation({
    mutationFn: () => productionService.createJobFromProfileCuttingPlan(planId),
  });

  if (planQuery.isPending) {
    return <LoadingState title="Preparando el plan de corte de perfiles" />;
  }

  if (planQuery.isError) {
    return (
      <ErrorState
        description={planQuery.error.message}
        title="No se pudo cargar el plan de corte de perfiles"
      />
    );
  }

  const plan = planQuery.data;
  const badge = getProfilePlanStatusBadge(plan.status);
  const createdRemnants = plan.bars.flatMap((bar) =>
    bar.remnantOutputs.filter((output) => output.status === "CREATED"),
  );
  const purchaseRequiredBars = plan.bars.filter(
    (bar) => bar.sourceType === "PURCHASE_REQUIRED",
  );
  const exportRows = plan.bars.flatMap((bar) =>
    bar.cutPieces.map((piece) => ({
      bar,
      piece,
    })),
  );

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PROFILE_OPTIMIZATION_ROUTES.plans}
            >
              Volver a planes
            </Link>
            {canPrint ? (
              <Link
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                href={PROFILE_OPTIMIZATION_ROUTES.planPrint(plan.id)}
              >
                Vista de impresion
              </Link>
            ) : null}
            <ExportMenu
              buttonClassName="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              disabled={exportRows.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(exportRows, {
                  columns: [
                    { header: "Barra", value: (row) => row.bar.sortOrder + 1 },
                    { header: "Origen", value: (row) => getProfileBarSourceLabel(row.bar.sourceType) },
                    { header: "Corte", value: (row) => row.piece.label },
                    { header: "Posicion", value: (row) => formatProfileLength(row.piece.positionMm) },
                    { header: "Longitud", value: (row) => formatProfileLength(row.piece.lengthMm) },
                    { header: "Desperdicio barra", value: (row) => formatProfileLength(row.bar.wasteLengthMm) },
                  ],
                  fileName: `${plan.code}.xls`,
                  subtitle: plan.material.name,
                  title: `Plan de corte ${plan.code}`,
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(exportRows, {
                  columns: [
                    { header: "Barra", value: (row) => row.bar.sortOrder + 1 },
                    { header: "Origen", value: (row) => getProfileBarSourceLabel(row.bar.sourceType) },
                    { header: "Corte", value: (row) => row.piece.label },
                    { header: "Longitud", value: (row) => formatProfileLength(row.piece.lengthMm) },
                    { header: "Desperdicio barra", value: (row) => formatProfileLength(row.bar.wasteLengthMm) },
                  ],
                  subtitle: plan.material.name,
                  title: `Plan de corte ${plan.code}`,
                });
              }}
            />
            <button
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !canCreatePurchaseRequest ||
                createPurchaseRequestMutation.isPending ||
                purchaseRequiredBars.length === 0
              }
              onClick={() => {
                void createPurchaseRequestMutation.mutateAsync();
              }}
              type="button"
            >
              Crear solicitud de compra
            </button>
            <button
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canCreateProductionJob || createProductionJobMutation.isPending}
              onClick={() => {
                void createProductionJobMutation.mutateAsync();
              }}
              type="button"
            >
              Crear orden de produccion
            </button>
            <button
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !canCreateRemnants ||
                createRemnantsMutation.isPending ||
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
        description="Revisa cada asignacion de barra, confirma instrucciones de corte y desperdicio, y luego genera remanentes o entrega el plan a compras y produccion."
        eyebrow="Operaciones"
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
              Barras
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">{plan.totalBars}</p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Longitud requerida
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfileMetersFromMm(plan.totalRequiredLengthMm)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Longitud de desperdicio
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfileMetersFromMm(plan.totalWasteLengthMm)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Porcentaje de desperdicio
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatProfilePercent(plan.wastePercent)}
            </p>
          </div>
        </div>

        {(createRemnantsMutation.error ||
          createPurchaseRequestMutation.error ||
          createProductionJobMutation.error) ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(
              createRemnantsMutation.error ??
                createPurchaseRequestMutation.error ??
                createProductionJobMutation.error,
            )}
          </div>
        ) : null}

        {createdRemnants.length > 0 ? (
          <div className="mt-5 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Se generaron {createdRemnants.length} remanente(s) desde este plan.
          </div>
        ) : null}

        {createPurchaseRequestMutation.data ? (
          <div className="mt-5 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Solicitud de compra creada.{" "}
            <Link
              className="font-semibold underline decoration-amber-400 underline-offset-4"
              href={PURCHASING_ROUTES.requestDetail(createPurchaseRequestMutation.data.id)}
            >
              Abrir {createPurchaseRequestMutation.data.code}
            </Link>
          </div>
        ) : null}

        {createProductionJobMutation.data ? (
          <div className="mt-5 rounded-[1rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Orden de produccion creada.{" "}
            <Link
              className="font-semibold underline decoration-blue-400 underline-offset-4"
              href={PRODUCTION_ROUTES.jobDetail(createProductionJobMutation.data.id)}
            >
              Abrir {createProductionJobMutation.data.code}
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6">
        {plan.bars.map((bar) => (
          <section
            key={bar.id}
            className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {getProfileBarSourceLabel(bar.sourceType)}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Barra {bar.sortOrder + 1}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  {bar.cutPieces.length} cortes · {bar.remnantOutputs.length} salidas de remanente
                </p>
              </div>

              <div className="grid gap-2 text-right text-sm text-stone-600">
                <p>
                  Original:{" "}
                  <span className="font-semibold text-stone-950">
                    {formatProfileLength(bar.originalLengthMm)}
                  </span>
                </p>
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
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Cortes por barra
                  </p>
                <div className="mt-3 space-y-2">
                  {bar.cutPieces.map((piece) => (
                    <div
                      key={piece.id}
                      className="flex items-center justify-between gap-3 rounded-[1rem] bg-white px-3 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-stone-950">{piece.label}</p>
                        <p className="mt-1 text-xs text-stone-600">
                          Posicion {formatProfileLength(piece.positionMm)}
                        </p>
                      </div>
                      <span className="font-semibold text-stone-950">
                        {formatProfileLength(piece.lengthMm)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Desperdicio
                  </p>
                  <p className="mt-3 text-sm font-semibold text-stone-950">
                    {formatProfileLength(bar.wasteLengthMm)}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {formatProfilePercent(bar.wastePercent)} de la longitud original de la barra.
                  </p>
                </div>

                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Salida de remanente
                  </p>
                  <div className="mt-3 space-y-2">
                    {bar.remnantOutputs.map((output) => (
                      <div
                        key={output.id}
                        className="rounded-[1rem] bg-white px-3 py-3 text-sm text-stone-700"
                      >
                        <p className="font-semibold text-stone-950">
                          {formatProfileLength(output.remainingLengthMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {output.shouldCreateRemnant
                            ? "Apto para crear remanente"
                            : "Descartado por umbral"}{" "}
                          · {output.status}
                        </p>
                      </div>
                    ))}
                    {bar.remnantOutputs.length === 0 ? (
                      <p className="text-sm text-stone-600">
                        No se registro salida de remanente para esta barra.
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
