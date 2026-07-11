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
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { purchasingService } from "@/services/purchasing-service";
import { getApiErrorMessage } from "@/utils";

import { PURCHASING_PERMISSIONS, PURCHASING_QUERY_KEYS, PURCHASING_ROUTES } from "../constants";
import {
  formatPurchasingCurrency,
  formatPurchasingQuantity,
  getPurchaseRequestItemStatusBadge,
  getPurchaseRequestSourceLabel,
  getPurchaseRequestStatusBadge,
} from "../ui";

type PurchasingRequestDetailPageProps = {
  requestId: string;
};

export default function PurchasingRequestDetailPage({
  requestId,
}: PurchasingRequestDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [actionNotes, setActionNotes] = useState("");

  const canApprove = permissions.includes(PURCHASING_PERMISSIONS.approve);
  const canCompare = permissions.includes(PURCHASING_PERMISSIONS.compareSuppliers);
  const canCreatePo = permissions.includes(PURCHASING_PERMISSIONS.createPo);
  const canDelete = permissions.includes(PURCHASING_PERMISSIONS.delete);

  const requestQuery = useQuery({
    queryFn: () => purchasingService.getPurchaseRequestById(requestId),
    queryKey: PURCHASING_QUERY_KEYS.requestDetail(requestId),
    staleTime: 30_000,
  });

  const invalidateRequest = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.requestDetail(requestId),
      }),
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.requests({}),
      }),
      queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.dashboard,
      }),
    ]);
  };

  const approveMutation = useMutation({
    mutationFn: () =>
      purchasingService.approvePurchaseRequest(requestId, {
        notes: actionNotes.trim() || null,
      }),
    onSuccess: async () => {
      setActionNotes("");
      await invalidateRequest();
    },
  });
  const rejectMutation = useMutation({
    mutationFn: () =>
      purchasingService.rejectPurchaseRequest(requestId, {
        notes: actionNotes.trim() || null,
      }),
    onSuccess: async () => {
      setActionNotes("");
      await invalidateRequest();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: () => purchasingService.deletePurchaseRequest(requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PURCHASING_QUERY_KEYS.requests({}),
      });
      router.push(PURCHASING_ROUTES.requests);
    },
  });

  if (requestQuery.isPending) {
    return <LoadingState title="Cargando solicitud de compra" />;
  }

  if (requestQuery.isError) {
    return (
      <ErrorState
        description={requestQuery.error.message}
        title="No se pudo cargar la solicitud de compra"
      />
    );
  }

  const request = requestQuery.data;
  const badge = getPurchaseRequestStatusBadge(request.status);
  const canDeleteCurrent = canDelete && ["DRAFT", "REJECTED", "CANCELLED"].includes(request.status);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PURCHASING_ROUTES.requests}>
              Back to Requests
            </Link>
            {canCompare ? (
              <Link
                className={secondaryButtonClassName}
                href={PURCHASING_ROUTES.requestCompare(request.id)}
              >
                Compare Suppliers
              </Link>
            ) : null}
            {canCreatePo && request.status === "APPROVED" ? (
              <Link
                className={secondaryButtonClassName}
                href={`${PURCHASING_ROUTES.ordersNew}?purchaseRequestId=${request.id}`}
              >
                Create Manual PO
              </Link>
            ) : null}
          </>
        }
        description="Revisa el origen de esta necesidad de compra, valida las líneas solicitadas y avanza por la aprobación y el comparativo de proveedores."
        eyebrow="Purchasing"
        title={request.code}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-sm text-stone-700">
            {getPurchaseRequestSourceLabel(request.sourceType)}
          </span>
          {request.sourceReferenceLabel || request.sourceId ? (
            <span className="text-sm text-stone-500">
              {request.sourceReferenceLabel || request.sourceId}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Requested by
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {request.requestedByUser?.name || "System"}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Created
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateValue(request.createdAt)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Approved at
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatDateValue(request.approvedAt)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Estimated subtotal
            </p>
            <p className="mt-2 text-lg font-semibold text-stone-950">
              {formatPurchasingCurrency(request.totals.estimatedSubtotal)}
            </p>
          </div>
        </div>

        {request.notes ? (
          <div className="mt-5 rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-700">{request.notes}</p>
          </div>
        ) : null}
      </section>

      {(canApprove || canDeleteCurrent) && !["CONVERTED_TO_PO"].includes(request.status) ? (
        <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
          <div className="flex flex-wrap items-end gap-4">
            <label className="grid min-w-[18rem] flex-1 gap-2">
              <span className="text-sm font-medium text-stone-700">Decision notes</span>
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setActionNotes(event.target.value);
                }}
                placeholder="Contexto opcional de aprobación, rechazo o cancelación"
                value={actionNotes}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              {canApprove ? (
                <>
                  <button
                    className={secondaryButtonClassName}
                    disabled={approveMutation.isPending}
                    onClick={() => {
                      void approveMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    Approve Request
                  </button>
                  <button
                    className={secondaryButtonClassName}
                    disabled={rejectMutation.isPending}
                    onClick={() => {
                      void rejectMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    Reject Request
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
                  Delete Request
                </button>
              ) : null}
            </div>
          </div>

          {approveMutation.error || rejectMutation.error || deleteMutation.error ? (
            <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {getApiErrorMessage(
                approveMutation.error || rejectMutation.error || deleteMutation.error,
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Requested Lines
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Materials to source
            </h2>
          </div>
          <p className="text-sm text-stone-600">{request.items.length} line(s)</p>
        </div>

        {request.items.map((item) => {
          const itemBadge = getPurchaseRequestItemStatusBadge(item.status);

          return (
            <section
              key={item.id}
              className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">
                      {item.material.name}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${itemBadge.className}`}
                    >
                      {itemBadge.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {item.material.code} · {formatPurchasingQuantity(item.quantity, item.unit)}
                  </p>
                </div>

                <div className="grid gap-2 text-right text-sm text-stone-600">
                  <p>
                    Fecha requerida:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatDateOnlyValue(item.requiredDate)}
                    </span>
                  </p>
                  <p>
                    Est. unit cost:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(item.estimatedUnitCost)}
                    </span>
                  </p>
                  <p>
                    Est. total:{" "}
                    <span className="font-semibold text-stone-950">
                      {formatPurchasingCurrency(item.estimatedTotalCost)}
                    </span>
                  </p>
                </div>
              </div>

              {item.description ? (
                <p className="mt-4 text-sm leading-6 text-stone-700">{item.description}</p>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Preferred supplier
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {item.preferredSupplier?.commercialName ||
                      item.preferredSupplier?.legalName ||
                      "Sin configurar"}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Selected supplier
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {item.selectedSupplier?.commercialName ||
                      item.selectedSupplier?.legalName ||
                      "Not selected"}
                  </p>
                </div>
              </div>
            </section>
          );
        })}

        {request.items.length === 0 ? (
          <EmptyState
            description="Esta solicitud aún no tiene líneas de compra, por lo que no puede aprobarse ni compararse."
            title="No hay artículos en esta solicitud"
          />
        ) : null}
      </section>
    </main>
  );
}
