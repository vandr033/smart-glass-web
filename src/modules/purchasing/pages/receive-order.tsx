"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  fieldClassName,
  formatDateOnlyValue,
  primaryButtonClassName,
  sectionClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";
import { purchasingService } from "@/services/purchasing-service";
import type { ReceivePurchaseOrderInput } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { PURCHASING_ROUTES } from "../constants";
import { formatPurchasingQuantity } from "../ui";

type PurchasingReceiveOrderPageProps = {
  orderId: string;
};

type DraftReceiptItem = ReceivePurchaseOrderInput["items"][number];

export default function PurchasingReceiveOrderPage({
  orderId,
}: PurchasingReceiveOrderPageProps) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState("");
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftReceiptItem[]>([]);

  const orderQuery = useQuery({
    queryFn: () => purchasingService.getPurchaseOrderById(orderId),
    queryKey: ["purchasing", "receive-form", "order", orderId],
    staleTime: 30_000,
  });
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: ["purchasing", "receive-form", "warehouses"],
    staleTime: 60_000,
  });

  const receiveMutation = useMutation({
    mutationFn: (input: ReceivePurchaseOrderInput) =>
      purchasingService.receivePurchaseOrder(orderId, input),
    onSuccess: () => {
      router.push(PURCHASING_ROUTES.orderDetail(orderId));
    },
  });

  if (orderQuery.isPending || warehousesQuery.isPending) {
    return <LoadingState title="Preparando el formulario de recepción" />;
  }

  if (orderQuery.isError || warehousesQuery.isError) {
    return (
      <ErrorState
        description={
          orderQuery.error?.message ||
          warehousesQuery.error?.message ||
          "No se pudieron cargar las dependencias del formulario de recepción."
        }
        title="El formulario de recepción no está disponible"
      />
    );
  }

  const order = orderQuery.data;
  const outstandingItems = order.items.filter((item) => item.quantity > item.receivedQuantity);
  const activeItems = order.items.map((orderItem, index) =>
    items[index] ?? {
      batchNumber: null,
      locationCode: null,
      notes: null,
      purchaseOrderItemId: orderItem.id,
      receivedQuantity: Math.max(orderItem.quantity - orderItem.receivedQuantity, 0),
    },
  );

  return (
    <main className="space-y-6">
      <PageHeader
        description="Registra qué almacén recibió la orden, cuánto llegó y los datos de lote, ubicación o dimensiones necesarios para crear las existencias."
        eyebrow="Purchasing"
        title={`Receive ${order.code}`}
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Almacén</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setWarehouseId(event.target.value);
              }}
              value={warehouseId}
            >
              <option value="">Selecciona un almacén</option>
              {warehousesQuery.data.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} · {warehouse.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Received at</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setReceivedAt(event.target.value);
              }}
              type="date"
              value={receivedAt}
            />
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-3">
            <span className="text-sm font-medium text-stone-700">Notas</span>
            <textarea
              className={textAreaClassName}
              onChange={(event) => {
                setNotes(event.target.value);
              }}
              placeholder="Nota opcional de recepción en almacén"
              value={notes}
            />
          </label>
        </div>

        <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Proveedor: <strong>{order.supplier?.commercialName || order.supplier?.legalName}</strong>{" "}
          · Expected delivery {formatDateOnlyValue(order.expectedDeliveryDate)}
        </div>

        {receiveMutation.error ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(receiveMutation.error)}
          </div>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Receipt Lines
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Quantities arriving now
            </h2>
          </div>
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setItems(
                order.items.map((item) => ({
                  batchNumber: null,
                  locationCode: null,
                  notes: null,
                  purchaseOrderItemId: item.id,
                  receivedQuantity: Math.max(item.quantity - item.receivedQuantity, 0),
                })),
              );
            }}
            type="button"
          >
            Fill Remaining Quantities
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {order.items.map((orderItem, index) => {
            const remainingQuantity = Math.max(
              orderItem.quantity - orderItem.receivedQuantity,
              0,
            );
            const receiptItem = activeItems[index];

            return (
              <section
                key={orderItem.id}
                className="rounded-md border border-stone-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-950">
                      {orderItem.material.name}
                    </h3>
                    <p className="mt-2 text-sm text-stone-600">
                    Ordenado: {formatPurchasingQuantity(orderItem.quantity, orderItem.unit)} ·
                    Pendiente: {formatPurchasingQuantity(remainingQuantity, orderItem.unit)}
                    </p>
                  </div>
                  <p className="text-sm text-stone-500">{orderItem.material.code}</p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Received quantity
                    </span>
                    <input
                      className={fieldClassName}
                      min="0"
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  receivedQuantity: Number(event.target.value),
                                }
                              : entry,
                          ),
                        );
                      }}
                      step="0.0001"
                      type="number"
                      value={receiptItem?.receivedQuantity ?? 0}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Batch number</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, batchNumber: event.target.value || null }
                              : entry,
                          ),
                        );
                      }}
                      value={receiptItem?.batchNumber ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Codigo de ubicacion</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, locationCode: event.target.value || null }
                              : entry,
                          ),
                        );
                      }}
                      value={receiptItem?.locationCode ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Line notes</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, notes: event.target.value || null }
                              : entry,
                          ),
                        );
                      }}
                      value={receiptItem?.notes ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Width (mm)</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  widthMm: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : entry,
                          ),
                        );
                      }}
                      step="0.01"
                      type="number"
                      value={receiptItem?.widthMm ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Height (mm)</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  heightMm: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : entry,
                          ),
                        );
                      }}
                      step="0.01"
                      type="number"
                      value={receiptItem?.heightMm ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Length (mm)</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  lengthMm: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : entry,
                          ),
                        );
                      }}
                      step="0.01"
                      type="number"
                      value={receiptItem?.lengthMm ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Thickness (mm)</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setItems(
                          activeItems.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  thicknessMm: event.target.value
                                    ? Number(event.target.value)
                                    : null,
                                }
                              : entry,
                          ),
                        );
                      }}
                      step="0.01"
                      type="number"
                      value={receiptItem?.thicknessMm ?? ""}
                    />
                  </label>
                </div>
              </section>
            );
          })}
        </div>

        {outstandingItems.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              description="Todas las líneas de esta orden de compra ya fueron recibidas por completo."
              title="No queda nada por recibir"
            />
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            className={primaryButtonClassName}
            disabled={receiveMutation.isPending || outstandingItems.length === 0}
            onClick={() => {
              void receiveMutation.mutateAsync({
                items: activeItems.filter((item) => item.receivedQuantity > 0),
                notes: notes.trim() || null,
                receivedAt: receivedAt || null,
                warehouseId,
              });
            }}
            type="button"
          >
            Receive Into Inventory
          </button>
        </div>
      </section>
    </main>
  );
}
