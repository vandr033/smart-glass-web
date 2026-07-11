"use client";

import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { cuttingService } from "@/services/cutting-service";

import { CuttingLayoutPreview } from "../components/CuttingLayoutPreview";
import { CUTTING_QUERY_KEYS } from "../constants";
import { formatCuttingArea, formatCuttingPercent } from "../ui";

type CuttingPlanPrintPageProps = {
  planId: string;
};

export default function CuttingPlanPrintPage({
  planId,
}: CuttingPlanPrintPageProps) {
  const printQuery = useQuery({
    queryFn: () => cuttingService.getPrintablePlan(planId),
    queryKey: [...CUTTING_QUERY_KEYS.planDetail(planId), "print"],
    staleTime: 30_000,
  });

  if (printQuery.isPending) {
    return (
      <LoadingState
        title="Cargando vista de impresión"
      />
    );
  }

  if (printQuery.isError) {
    return (
      <ErrorState
        description={printQuery.error.message}
        title="No se pudo cargar el diseño de impresión"
      />
    );
  }

  const plan = printQuery.data;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Diseño de corte imprimible con dimensiones de lámina, etiquetas de piezas y zonas de remanentes planificadas."
        eyebrow="Diseño de impresión"
        title={plan.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-6 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Cotización
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {plan.optimizationRun.quotation?.code ?? "Sin cotización"}
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
              Área requerida
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatCuttingArea(plan.totalRequiredAreaM2)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Waste
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatCuttingPercent(plan.wastePercent)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        {plan.sheets.map((sheet) => (
          <section
            key={sheet.id}
            className="rounded-lg border border-stone-200 bg-white px-6 py-6"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Sheet {sheet.sortOrder + 1}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  {sheet.widthMm.toFixed(0)} × {sheet.heightMm.toFixed(0)} mm
                </h2>
              </div>
              <div className="text-right text-sm text-stone-600">
                <p>{sheet.pieces.length} pieces</p>
                <p>{sheet.remnantOutputs.length} remnant zones</p>
              </div>
            </div>

            <CuttingLayoutPreview sheet={sheet} />
          </section>
        ))}
      </section>
    </main>
  );
}
