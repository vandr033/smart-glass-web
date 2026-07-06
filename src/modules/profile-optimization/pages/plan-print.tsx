"use client";

import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { profileOptimizationService } from "@/services/profile-optimization-service";

import { PROFILE_OPTIMIZATION_QUERY_KEYS } from "../constants";
import {
  formatProfileLength,
  formatProfileMetersFromMm,
  formatProfilePercent,
} from "../ui";

type ProfileCuttingPlanPrintPageProps = {
  planId: string;
};

export default function ProfileCuttingPlanPrintPage({
  planId,
}: ProfileCuttingPlanPrintPageProps) {
  const printQuery = useQuery({
    queryFn: () => profileOptimizationService.getPlanById(planId),
    queryKey: [...PROFILE_OPTIMIZATION_QUERY_KEYS.planDetail(planId), "print"],
    staleTime: 30_000,
  });

  if (printQuery.isPending) {
    return <LoadingState title="Cargando la vista de impresion" />;
  }

  if (printQuery.isError) {
    return (
      <ErrorState
        description={printQuery.error.message}
        title="No se pudo cargar el formato de impresion"
      />
    );
  }

  const plan = printQuery.data;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Instrucciones de corte de perfiles en formato de impresion, con asignaciones por barra, longitudes y salidas de remanente."
        eyebrow="Impresion"
        title={plan.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-6 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Cotizacion
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {plan.optimizationRun.quotation?.code ?? "Sin cotizacion"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Proyecto
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {plan.optimizationRun.project?.code ?? "Sin proyecto"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Longitud requerida
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatProfileMetersFromMm(plan.totalRequiredLengthMm)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Desperdicio
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatProfilePercent(plan.wastePercent)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        {plan.bars.map((bar) => (
          <section
            key={bar.id}
            className="rounded-lg border border-stone-200 bg-white px-6 py-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Barra {bar.sortOrder + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  {formatProfileLength(bar.originalLengthMm)}
                </h2>
              </div>
              <div className="text-right text-sm text-stone-600">
                <p>{bar.cutPieces.length} cortes</p>
                <p>Desperdicio {formatProfileLength(bar.wasteLengthMm)}</p>
              </div>
            </div>

            <div className="grid gap-3">
              {bar.cutPieces.map((piece) => (
                <div
                  key={piece.id}
                  className="flex items-center justify-between rounded-[1rem] bg-stone-50 px-4 py-3 text-sm"
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

            <div className="mt-5 rounded-[1rem] bg-stone-50 px-4 py-4 text-sm text-stone-700">
              {bar.remnantOutputs.map((output) => (
                <p key={output.id}>
                  Salida de remanente: {formatProfileLength(output.remainingLengthMm)} · {output.status}
                </p>
              ))}
              {bar.remnantOutputs.length === 0 ? <p>Sin salida de remanente.</p> : null}
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
