import { sectionClassName } from "@/modules/commercial/ui";
import type { QuotationDetailRecord } from "@/types";

import { formatQuotationCurrency, formatQuotationPercent } from "../ui";

type QuotationTotalsPanelProps = {
  canViewCost: boolean;
  quotation: Pick<
    QuotationDetailRecord,
    | "currency"
    | "discountAmount"
    | "marginAmount"
    | "marginPercent"
    | "subtotalCost"
    | "subtotalSale"
    | "taxAmount"
    | "totalSale"
  >;
};

export function QuotationTotalsPanel({
  canViewCost,
  quotation,
}: QuotationTotalsPanelProps) {
  return (
    <section className={sectionClassName}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Totales
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Resumen comercial
          </h2>
        </div>

        <div className="grid gap-3">
          {canViewCost ? (
            <div className="flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
              <span className="text-sm text-stone-600">Subtotal costo</span>
              <span className="font-semibold text-stone-950">
                {formatQuotationCurrency(quotation.subtotalCost, quotation.currency)}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
            <span className="text-sm text-stone-600">Subtotal venta</span>
            <span className="font-semibold text-stone-950">
              {formatQuotationCurrency(quotation.subtotalSale, quotation.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
            <span className="text-sm text-stone-600">Descuento</span>
            <span className="font-semibold text-stone-950">
              {formatQuotationCurrency(quotation.discountAmount, quotation.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
            <span className="text-sm text-stone-600">Impuesto</span>
            <span className="font-semibold text-stone-950">
              {formatQuotationCurrency(quotation.taxAmount, quotation.currency)}
            </span>
          </div>

          {canViewCost ? (
            <>
              <div className="flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
                <span className="text-sm text-stone-600">Monto de margen</span>
                <span className="font-semibold text-stone-950">
                  {formatQuotationCurrency(quotation.marginAmount, quotation.currency)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-stone-50 px-4 py-3">
                <span className="text-sm text-stone-600">Rentabilidad</span>
                <span className="font-semibold text-stone-950">
                  {formatQuotationPercent(quotation.marginPercent)}
                </span>
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between rounded-lg bg-[var(--color-primary)] px-4 py-4 text-[color:var(--color-primary-contrast)]">
            <span className="text-sm font-medium">Total venta</span>
            <span className="text-lg font-semibold">
              {formatQuotationCurrency(quotation.totalSale, quotation.currency)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
