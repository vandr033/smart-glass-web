"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { quotationService } from "@/services/quotation-service";
import { getApiErrorMessage } from "@/utils";

import {
  QUOTATIONS_QUERY_KEYS,
  QUOTATION_APPROVAL_STATUS_LABELS,
  QUOTATION_APPROVAL_TYPE_LABELS,
} from "../constants";
import { formatQuotationDateTime } from "../ui";

export function QuotationApprovalTable() {
  const queryClient = useQueryClient();
  const pendingQuery = useQuery({
    queryFn: quotationService.listPendingApprovals,
    queryKey: QUOTATIONS_QUERY_KEYS.pendingApprovals,
  });
  const approveMutation = useMutation({
    mutationFn: async (quotationId: string) =>
      quotationService.approveQuotation(quotationId, {
        decisionNotes:
          typeof window !== "undefined"
            ? window.prompt("Notas de aprobacion (opcional)") || null
            : null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUOTATIONS_QUERY_KEYS.pendingApprovals,
      });
      await queryClient.invalidateQueries({
        queryKey: ["quotations"],
      });
    },
  });
  const rejectMutation = useMutation({
    mutationFn: async (quotationId: string) =>
      quotationService.rejectQuotation(quotationId, {
        decisionNotes:
          typeof window !== "undefined"
            ? window.prompt("Notas del rechazo") || null
            : null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUOTATIONS_QUERY_KEYS.pendingApprovals,
      });
      await queryClient.invalidateQueries({
        queryKey: ["quotations"],
      });
    },
  });

  if (pendingQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando aprobaciones pendientes" />;
  }

  if (pendingQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void pendingQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={pendingQuery.error.message}
        title="No se pudieron cargar las aprobaciones pendientes"
      />
    );
  }

  const approvals = pendingQuery.data ?? [];

  if (approvals.length === 0) {
    return (
      <EmptyState
        description="Aqui apareceran las aprobaciones disparadas por margenes bajos, descuentos altos o revisiones manuales."
        title="No hay aprobaciones pendientes"
      />
    );
  }

  return (
    <div className="space-y-4">
      <section className={tableWrapperClassName}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Cotizacion</th>
                <th className="px-5 py-4 font-semibold">Cliente</th>
                <th className="px-5 py-4 font-semibold">Motivo</th>
                <th className="px-5 py-4 font-semibold">Solicitada por</th>
                <th className="px-5 py-4 font-semibold">Estado</th>
                <th className="px-5 py-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((approval) => (
                <tr key={approval.id} className="border-t border-stone-200/80 align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-stone-950">
                      {approval.quotation.code}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {formatQuotationDateTime(approval.createdAt)}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-stone-700">
                    {approval.quotation.client.displayName}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-stone-900">
                      {QUOTATION_APPROVAL_TYPE_LABELS[approval.approvalType]}
                    </p>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-stone-600">
                      {approval.reason}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-stone-700">
                    {approval.requestedByUser?.name || "Sistema"}
                  </td>
                  <td className="px-5 py-4 text-stone-700">
                    {QUOTATION_APPROVAL_STATUS_LABELS[approval.status]}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={primaryButtonClassName}
                        disabled={approveMutation.isPending}
                        onClick={() => {
                          approveMutation.mutate(approval.quotation.id);
                        }}
                        type="button"
                      >
                        Aprobar
                      </button>
                      <button
                        className={secondaryButtonClassName}
                        disabled={rejectMutation.isPending}
                        onClick={() => {
                          rejectMutation.mutate(approval.quotation.id);
                        }}
                        type="button"
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {approveMutation.isError ? (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getApiErrorMessage(approveMutation.error)}
        </div>
      ) : null}
      {rejectMutation.isError ? (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getApiErrorMessage(rejectMutation.error)}
        </div>
      ) : null}
    </div>
  );
}
