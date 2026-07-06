"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";

import { secondaryButtonClassName, tableWrapperClassName } from "@/modules/commercial/ui";
import type { QuotationItemRecord } from "@/types";

import { QUOTATION_ITEM_TYPE_LABELS } from "../constants";
import { formatQuotationCurrency, formatQuotationPercent } from "../ui";

type QuotationItemsTableProps = {
  canEdit?: boolean;
  canReorder?: boolean;
  canViewCost: boolean;
  currency: string;
  items: QuotationItemRecord[];
  onDelete?: (item: QuotationItemRecord) => void;
  onEdit?: (item: QuotationItemRecord) => void;
  onMoveDown?: (item: QuotationItemRecord) => void;
  onMoveUp?: (item: QuotationItemRecord) => void;
};

export function QuotationItemsTable({
  canEdit = false,
  canReorder = false,
  canViewCost,
  currency,
  items,
  onDelete,
  onEdit,
  onMoveDown,
  onMoveUp,
}: QuotationItemsTableProps) {
  return (
    <section className={tableWrapperClassName}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Item</th>
              <th className="px-5 py-4 font-semibold">Tipo</th>
              <th className="px-5 py-4 font-semibold">Cantidad</th>
              <th className="px-5 py-4 font-semibold">Materiales</th>
              {canViewCost ? (
                <th className="px-5 py-4 font-semibold">Costo</th>
              ) : null}
              <th className="px-5 py-4 font-semibold">Venta</th>
              {canViewCost ? (
                <th className="px-5 py-4 font-semibold">Margen</th>
              ) : null}
              {canEdit || canReorder ? (
                <th className="px-5 py-4 font-semibold">Acciones</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-t border-stone-200/80 align-top">
                <td className="px-5 py-4">
                  <p className="font-semibold text-stone-950">{item.name}</p>
                  {item.description ? (
                    <p className="mt-1 max-w-lg text-xs leading-6 text-stone-500">
                      {item.description}
                    </p>
                  ) : null}
                  {item.hasManualOverride ? (
                    <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                      Ajuste manual
                    </span>
                  ) : null}
                </td>
                <td className="px-5 py-4 text-stone-700">
                  {QUOTATION_ITEM_TYPE_LABELS[item.itemType]}
                </td>
                <td className="px-5 py-4 text-stone-700">{item.quantity}</td>
                <td className="px-5 py-4 text-stone-700">{item.materials.length}</td>
                {canViewCost ? (
                  <td className="px-5 py-4 font-medium text-stone-900">
                    {formatQuotationCurrency(item.subtotalCost, currency)}
                  </td>
                ) : null}
                <td className="px-5 py-4 font-medium text-stone-900">
                  {formatQuotationCurrency(item.subtotalSale, currency)}
                </td>
                {canViewCost ? (
                  <td className="px-5 py-4 text-stone-700">
                    {formatQuotationPercent(item.marginPercent)}
                  </td>
                ) : null}
                {canEdit || canReorder ? (
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canReorder ? (
                        <>
                          <button
                            className={secondaryButtonClassName}
                            disabled={index === 0}
                            onClick={() => {
                              onMoveUp?.(item);
                            }}
                            type="button"
                          >
                            <ArrowUp className="mr-2 h-4 w-4" />
                            Subir
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            disabled={index === items.length - 1}
                            onClick={() => {
                              onMoveDown?.(item);
                            }}
                            type="button"
                          >
                            <ArrowDown className="mr-2 h-4 w-4" />
                            Bajar
                          </button>
                        </>
                      ) : null}
                      {canEdit ? (
                        <button
                          className={secondaryButtonClassName}
                          onClick={() => {
                            onEdit?.(item);
                          }}
                          type="button"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </button>
                      ) : null}
                      {canEdit ? (
                        <button
                          className={secondaryButtonClassName}
                          onClick={() => {
                            onDelete?.(item);
                          }}
                          type="button"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
