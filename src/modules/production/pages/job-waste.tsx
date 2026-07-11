"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/modules/commercial/ui";
import { productionService } from "@/services/production-service";
import { getApiErrorMessage } from "@/utils";

import {
  PRODUCTION_PERMISSIONS,
  PRODUCTION_QUERY_KEYS,
  PRODUCTION_ROUTES,
} from "../constants";
import { formatProductionArea, formatProductionPercent } from "../ui";

type ProductionJobWastePageProps = {
  jobId: string;
};

export default function ProductionJobWastePage({
  jobId,
}: ProductionJobWastePageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canReportWaste = permissions.includes(
    PRODUCTION_PERMISSIONS.reportWaste,
  );

  const jobQuery = useQuery({
    queryFn: () => productionService.getJobById(jobId),
    queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
    staleTime: 30_000,
  });
  const wasteQuery = useQuery({
    queryFn: () => productionService.getWasteReport(jobId),
    queryKey: PRODUCTION_QUERY_KEYS.jobWaste(jobId),
    staleTime: 30_000,
  });

  const calculateMutation = useMutation({
    mutationFn: () => productionService.calculateWasteReport(jobId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["production"],
        }),
        queryClient.invalidateQueries({
          queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
        }),
        queryClient.invalidateQueries({
          queryKey: PRODUCTION_QUERY_KEYS.jobWaste(jobId),
        }),
      ]);
    },
  });

  if (jobQuery.isPending || wasteQuery.isPending) {
    return <LoadingState title="Cargando análisis de desperdicios" />;
  }

  if (jobQuery.isError || wasteQuery.isError) {
    return (
      <ErrorState
        description={
          jobQuery.error?.message ??
          wasteQuery.error?.message ??
          "No se pudo cargar el analisis de merma de produccion."
        }
        title="La merma de produccion no esta disponible"
      />
    );
  }

  const job = jobQuery.data;
  const report = wasteQuery.data;
  const wasteEntries = job.materialConsumptions.filter((entry) =>
    ["SCRAP", "WASTE"].includes(entry.consumptionType),
  );
  const activeError = calculateMutation.error
    ? getApiErrorMessage(calculateMutation.error)
    : null;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobDetail(job.id)}
            >
              Resumen de la orden
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobTasks(job.id)}
            >
              Tareas
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobQuality(job.id)}
            >
              Calidad
            </Link>
            <button
              className={primaryButtonClassName}
              disabled={
                calculateMutation.isPending ||
                !canReportWaste ||
                !job.cuttingPlan
              }
              onClick={() => {
                void calculateMutation.mutateAsync();
              }}
              type="button"
            >
              Recalcular desperdicio
            </button>
          </>
        }
        description="Compara las expectativas de optimizacion con la merma real de produccion, mantien alta la visibilidad del descarte y confirma si el comportamiento registrado en piso coincide con los supuestos originales de corte."
        eyebrow="Produccion"
        title={`${job.code} Merma`}
      />

      {activeError ? (
        <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {activeError}
        </div>
      ) : null}

      {!job.cuttingPlan ? (
        <EmptyState
          description="Esta orden no está vinculada a un plan de corte, por lo que el desperdicio teórico no puede compararse con una fuente de optimización."
          title="No hay un plan de corte vinculado"
        />
      ) : null}

      {report ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Desperdicio teórico
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">
                {formatProductionArea(report.theoreticalWasteAreaM2)}
              </p>
              <p className="mt-1 text-xs text-stone-600">
                {formatProductionPercent(report.theoreticalWastePercent)}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Desperdicio real
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">
                {formatProductionArea(report.actualWasteAreaM2)}
              </p>
              <p className="mt-1 text-xs text-stone-600">
                {formatProductionPercent(report.actualWastePercent)}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Variance Area
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">
                {formatProductionArea(report.varianceAreaM2)}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Variance Percent
              </p>
              <p className="mt-3 text-2xl font-semibold text-stone-950">
                {formatProductionPercent(report.variancePercent)}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Reporte de desperdicio
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Comparación actual
                </h2>
              </div>
              <p className="text-sm text-stone-600">
                Actualizado el {formatDateValue(report.updatedAt)}
              </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">
                  Plan de corte origen
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950">
                  {report.cuttingPlan?.code ?? "No disponible"}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {report.cuttingPlan?.sheetCount ?? 0} sheet(s) ·{" "}
                  {formatProductionPercent(
                    report.cuttingPlan?.wastePercent ?? 0,
                  )}
                </p>
              </div>

              <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">
                  Estado del dato real
                </p>
                <p className="mt-2 text-lg font-semibold text-stone-950">
                  {report.hasActualWasteData
                    ? "Desperdicio real registrado"
                    : "Solo estimación"}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  Record actual waste area from the task execution page when
                  floor measurements are available.
                </p>
              </div>
            </div>

            {report.notes ? (
              <div className="mt-5 rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Notas
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {report.notes}
                </p>
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <EmptyState
          description="Calcula el desperdicio para comparar los supuestos de optimización con lo registrado en producción."
          title="Aún no hay reporte de desperdicio"
        />
      )}

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
            Desperdicios y scrap registrados
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Consumos que afectan el desperdicio
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {wasteEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {entry.consumptionType} ·{" "}
                  {entry.material?.name ?? "Material manual"}
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    {entry.quantity} {entry.unit} · {entry.sourceType} ·{" "}
                    {formatDateValue(entry.consumedAt)}
                  </p>
                </div>
                <p className="text-xs font-medium text-stone-500">
                  {entry.consumedByUser?.name ?? "Sistema"}
                </p>
              </div>

              {entry.notes ? (
                <p className="mt-3 text-sm leading-6 text-stone-700">
                  {entry.notes}
                </p>
              ) : null}
            </div>
          ))}

          {wasteEntries.length === 0 ? (
            <EmptyState
              description="Los registros de desperdicio y scrap aparecerán aquí desde la ejecución de tareas."
              title="Aún no hay desperdicios ni scrap"
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
