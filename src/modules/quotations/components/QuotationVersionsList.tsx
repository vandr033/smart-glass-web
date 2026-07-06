"use client";

import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { sectionClassName } from "@/modules/commercial/ui";
import { quotationService } from "@/services/quotation-service";
import { QUOTATION_VERSION_STATUS_LABELS } from "@/modules/quotations/constants";

import { QUOTATIONS_QUERY_KEYS } from "../constants";
import { formatQuotationCurrency, formatQuotationDateTime } from "../ui";

type QuotationVersionsListProps = {
  quotationId: string;
};

export function QuotationVersionsList({ quotationId }: QuotationVersionsListProps) {
  const versionsQuery = useQuery({
    queryFn: async () => quotationService.listVersions(quotationId),
    queryKey: QUOTATIONS_QUERY_KEYS.versions(quotationId),
  });

  if (versionsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando versiones de cotizacion" />;
  }

  if (versionsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void versionsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={versionsQuery.error.message}
        title="No se pudo cargar el historial de versiones"
      />
    );
  }

  const versions = versionsQuery.data ?? [];

  if (versions.length === 0) {
    return (
      <EmptyState
        description="Crea el primer snapshot desde el detalle o el cotizador para preservar un registro comercial en el tiempo."
        title="Todavia no hay versiones de cotizacion"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {versions.map((version) => (
        <section key={version.id} className={sectionClassName}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Version {version.versionNumber}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                {QUOTATION_VERSION_STATUS_LABELS[version.status]}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {version.itemCount} items · Creada por{" "}
                {version.createdByUser?.name || "Sistema"} el{" "}
                {formatQuotationDateTime(version.createdAt)}
              </p>
            </div>

            <div className="rounded-md bg-stone-50 px-4 py-4 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Total venta
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatQuotationCurrency(
                  version.totalSale,
                  isSnapshotCurrencyRecord(version.snapshotJson)
                    ? version.snapshotJson.quotation.currency
                    : "BOB",
                )}
              </p>
            </div>
          </div>

          <pre className="mt-5 overflow-x-auto rounded-md bg-slate-950/96 p-4 text-xs leading-6 text-slate-100">
            {JSON.stringify(version.snapshotJson, null, 2)}
          </pre>
        </section>
      ))}
    </div>
  );
}

const isSnapshotCurrencyRecord = (
  value: unknown,
): value is {
  quotation: {
    currency: string;
  };
} => {
  return (
    typeof value === "object" &&
    value !== null &&
    "quotation" in value &&
    typeof value.quotation === "object" &&
    value.quotation !== null &&
    "currency" in value.quotation &&
    typeof value.quotation.currency === "string"
  );
};
