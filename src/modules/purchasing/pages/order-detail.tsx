"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  formatDateOnlyValue,
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";
import { getApiErrorMessage } from "@/utils";

import { PURCHASING_PERMISSIONS, PURCHASING_QUERY_KEYS, PURCHASING_ROUTES } from "../constants";
import {
  formatPurchasingCurrency,
  formatPurchasingQuantity,
  getPurchaseOrderStatusBadge,
} from "../ui";

type PurchasingOrderDetailPageProps = {
  orderId: string;
};

export default function PurchasingOrderDetailPage({
  orderId,
}: PurchasingOrderDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [actionNotes, setActionNotes] = useState("");

  const canSendPo = permissions.includes(PURCHASING_PERMISSIONS.sendPo);
  const canReceive = permissions.includes(PURCHASING_PERMISSIONS.receive);
  const canDelete = permissions.includes(PURCHASING_PERMISSIONS.delete);

  const orderQuery = useQuery({
    queryFn: () => purchasingService.getPurchaseOrderById(orderId),
    queryKey: PURCHASING_QUERY_KEYS.orderDetail(orderId),
    staleTime: 30_000,
  });

  const invalidateOrder = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.orderDetail(orderId),
      }),
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.orders({}),
      }),
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.dashboard,
      }),
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.receipts({}),
      }),
    ]);
  };

  const sendMutation = useMutation({
    mutationFn: () =>
      purchasingService.sendPurchaseOrder(orderId, {
        notes: actionNotes.trim() || null,
      }),
    onSuccess: async () => {
      setActionNotes("");
      await invalidateOrder();
    },
  });
  const confirmMutation = useMutation({
    mutationFn: () =>
      purchasingService.confirmPurchaseOrder(orderId, {
        notes: actionNotes.trim() || null,
      }),
    onSuccess: async () => {
      setActionNotes("");
      await invalidateOrder();
    },
  });
  const cancelMutation = useMutation({
    mutationFn: () =>
      purchasingService.cancelPurchaseOrder(orderId, {
        notes: actionNotes.trim() || null,
      }),
    onSuccess: async () => {
      setActionNotes("");
      await invalidateOrder();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => purchasingService.deletePurchaseOrder(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.orders({}),
      });
      router.push(PURCHASING_ROUTES.orders);
    },
  });

  if (orderQuery.isPending) {
    return <LoadingState title="Cargando orden de compra" />;
  }

  if (orderQuery.isError) {
    return (
      <ErrorState
        description={orderQuery.error.message}
        title="No se pudo cargar la orden de compra"
      />
    );
  }

  const order = orderQuery.data;
  const badge = getPurchaseOrderStatusBadge(order.status);
  const canDeleteCurrent =
    canDelete &&
    ["DRAFT", "CANCELLED"].includes(order.status) &&
    order.receipts.length === 0;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PURCHASING_ROUTES.orders}>
              Volver a órdenes
            </Link>
            {canReceive && !["CANCELLED", "RECEIVED"].includes(order.status) ? (
              <Link
                className={primaryButtonClassName}
                href={PURCHASING_ROUTES.orderReceive(order.id)}
              >
                Recibir orden de compra
              </Link>
            ) : null}
          </>
        }
        description="Track supplier status changes, confirm delivery commitments, and move incoming stock into warehouse receiving once materials arrive."
        eyebrow="Compras"
        title={order.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-stone-700">
            {order.supplier?.commercialName || order.supplier?.legalName || "No supplier"}
          </span>
          {order.purchaseRequest ? (
            <Link
              className="text-sm font-medium text-[color:var(--color-primary)]"
              href={PURCHASING_ROUTES.requestDetail(order.purchaseRequest.id)}
            >
              {order.purchaseRequest.code}
            </Link>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Fecha de orden
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateOnlyValue(order.orderDate)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Entrega esperada
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateOnlyValue(order.expectedDeliveryDate)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Subtotal
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatPurchasingCurrency(order.subtotal, order.currency)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Total
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatPurchasingCurrency(order.total, order.currency)}
            </p>
          </div>
        </div>

        {order.notes ? (
          <div className="mt-5 rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">{order.notes}</p>
          </div>
        ) : null}
      </section>

      {(canSendPo || canDeleteCurrent) ? (
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid min-w-[18rem] flex-1 gap-2">
              <span className="text-sm font-medium text-stone-700">Action notes</span>
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setActionNotes(event.target.value);
                }}
                placeholder="Optional supplier communication or status change note"
                value={actionNotes}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {canSendPo ? (
                <>
                  <button
                    className={secondaryButtonClassName}
                    disabled={sendMutation.isPending || order.status !== "DRAFT"}
                    onClick={() => {
                      void sendMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    Send PO
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={
                      confirmMutation.isPending ||
                      ["CANCELLED", "RECEIVED"].includes(order.status)
                    }
                    onClick={() => {
                      void confirmMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    Confirm PO
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={
                      cancelMutation.isPending ||
                      ["CANCELLED", "RECEIVED"].includes(order.status)
                    }
                    onClick={() => {
                      void cancelMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    Cancel PO
                  </button>
                </>
              ) : null}
              {canDeleteCurrent ? (
                <button
                  className={secondaryButtonClassName}
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    void deleteMutation.mutateAsync();
                  }}
                  type="button"
                >
                  Delete PO
                </button>
              ) : null}
            </div>
          </div>

          {sendMutation.error ||
          confirmMutation.error ||
          cancelMutation.error ||
          deleteMutation.error ? (
            <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(
                sendMutation.error ||
                  confirmMutation.error ||
                  cancelMutation.error ||
                  deleteMutation.error,
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Order Lines
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Ordered materials
          </h2>
        </div>

        {order.items.map((item) => {
          const remainingQuantity = Math.max(item.quantity - item.receivedQuantity, 0);

          return (
            <section
              key={item.id}
              className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-stone-950">{item.material.name}</h3>
                  <p className="mt-2 text-sm text-stone-600">
                    {item.material.code} · {formatPurchasingQuantity(item.quantity, item.unit)}
                  </p>
                </div>

                <div className="grid gap-2 text-right text-sm text-stone-600">
                  <p>
                    Unit price:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(item.unitPrice, order.currency)}
                    </span>
                  </p>
                  <p>
                    Line total:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(item.totalPrice, order.currency)}
                    </span>
                  </p>
                  <p>
                    Remaining:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingQuantity(remainingQuantity, item.unit)}
                    </span>
                  </p>
                </div>
              </div>

              {item.description ? (
                <p className="mt-4 text-sm leading-6 text-stone-700">{item.description}</p>
              ) : null}
            </section>
          );
        })}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Receipts
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Receipt history for this order
            </h2>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {order.receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-950">{receipt.code}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {receipt.warehouse?.name || "No warehouse"}
                  </p>
                </div>
                <p className="text-xs font-medium text-stone-500">
                  {formatDateValue(receipt.receivedAt)}
                </p>
              </div>
            </div>
          ))}

          {order.receipts.length === 0 ? (
            <EmptyState
              description="No warehouse receipt has been recorded for this purchase order yet."
              title="No receipts yet"
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}
