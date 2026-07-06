"use client";

import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { quotationService } from "@/services/quotation-service";

import { QUOTATIONS_QUERY_KEYS } from "../constants";
import { formatQuotationCurrency, formatQuotationDate } from "../ui";

type QuotationPreviewProps = {
  quotationId: string;
};

export function QuotationPreview({ quotationId }: QuotationPreviewProps) {
  const quotationQuery = useQuery({
    queryFn: async () => quotationService.getQuotationById(quotationId),
    queryKey: QUOTATIONS_QUERY_KEYS.detail(quotationId),
  });

  if (quotationQuery.isLoading) {
    return <LoadingState cards={3} title="Preparando vista previa comercial" />;
  }

  if (quotationQuery.isError || !quotationQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center justify-center rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void quotationQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={quotationQuery.error?.message ?? "No se pudo cargar la vista previa."}
        title="Vista previa no disponible"
      />
    );
  }

  const quotation = quotationQuery.data;

  return (
    <main className="mx-auto max-w-5xl space-y-8 rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,47,91,0.08)] sm:p-10">
      <header className="border-b border-stone-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--color-primary)]">
          Cotizacion comercial
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
              {quotation.code}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
              Preparada para {quotation.client.displayName}
              {quotation.project ? ` · ${quotation.project.title}` : ""}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--color-primary)] px-6 py-4 text-[color:var(--color-primary-contrast)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em]">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatQuotationCurrency(quotation.totalSale, quotation.currency)}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-stone-50 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Cliente
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {quotation.client.displayName}
          </p>
        </div>
        <div className="rounded-lg bg-stone-50 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Proyecto
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {quotation.project
              ? `${quotation.project.code} · ${quotation.project.title}`
              : "Cotizacion general"}
          </p>
        </div>
        <div className="rounded-lg bg-stone-50 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Vigencia
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">
            {formatQuotationDate(quotation.validUntil)}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Producto</th>
              <th className="px-5 py-4 font-semibold">Cantidad</th>
              <th className="px-5 py-4 font-semibold">Descripcion</th>
              <th className="px-5 py-4 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item) => (
              <tr key={item.id} className="border-t border-stone-200/80 align-top">
                <td className="px-5 py-4 font-semibold text-stone-950">{item.name}</td>
                <td className="px-5 py-4 text-stone-700">{item.quantity}</td>
                <td className="px-5 py-4 text-stone-700">
                  {item.description || "Configurado segun los requerimientos del proyecto."}
                </td>
                <td className="px-5 py-4 font-semibold text-stone-950">
                  {formatQuotationCurrency(item.subtotalSale, quotation.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {quotation.notes ? (
        <section className="rounded-lg bg-stone-50 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Condiciones comerciales
          </p>
          <p className="mt-3 text-sm leading-8 text-stone-700">{quotation.notes}</p>
        </section>
      ) : null}

      <footer className="border-t border-stone-200 pt-6 text-sm text-stone-500">
        Esta vista previa oculta notas internas y costos para que pueda compartirse directamente con el cliente.
      </footer>
    </main>
  );
}
