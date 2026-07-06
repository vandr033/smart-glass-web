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
        title="Loading print view"
      />
    );
  }

  if (printQuery.isError) {
    return (
      <ErrorState
        description={printQuery.error.message}
        title="Print layout could not be loaded"
      />
    );
  }

  const plan = printQuery.data;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Print-friendly cutting layout with sheet dimensions, piece labels, and planned remnant zones."
        eyebrow="Print Layout"
        title={plan.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-6 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Quotation
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {plan.optimizationRun.quotation?.code ?? "No quotation"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Project
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {plan.optimizationRun.project?.code ?? "No project"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Required Area
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
