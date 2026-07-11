"use client";

import { useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  FileStack,
  FileText,
  Send,
  ShieldCheck,
} from "lucide-react";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel } from "@/lib/exports";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
} from "@/modules/commercial/ui";
import { INVENTORY_PERMISSIONS } from "@/modules/inventory/constants";
import { quotationService } from "@/services/quotation-service";
import type { QuotationItemRecord } from "@/types";

import {
  QUOTATIONS_PERMISSIONS,
  QUOTATIONS_QUERY_KEYS,
  QUOTATIONS_ROUTES,
  QUOTATION_APPROVAL_STATUS_LABELS,
  QUOTATION_APPROVAL_TYPE_LABELS,
  QUOTATION_ITEM_TYPE_LABELS,
  QUOTATION_STATUS_LABELS,
  QUOTATION_VERSION_STATUS_LABELS,
} from "../constants";
import {
  formatQuotationCurrency,
  formatQuotationDate,
  formatQuotationDateTime,
  formatQuotationPercent,
  getQuotationStatusBadge,
} from "../ui";
import { QuotationInventoryAvailability } from "./QuotationInventoryAvailability";
import { QuotationItemsTable } from "./QuotationItemsTable";
import { QuotationTotalsPanel } from "./QuotationTotalsPanel";
import {
  MEASUREMENTS_ROUTES,
  MEASUREMENT_STATUS_LABELS,
} from "@/modules/measurements/constants";

type QuotationDetailProps = {
  quotationId: string;
};

export function QuotationDetail({ quotationId }: QuotationDetailProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [message, setMessage] = useState<string | null>(null);
  const canApprove = permissions.includes(QUOTATIONS_PERMISSIONS.approve);
  const canSend = permissions.includes(QUOTATIONS_PERMISSIONS.send);
  const canUpdate = permissions.includes(QUOTATIONS_PERMISSIONS.update);
  const canViewCost = permissions.includes(QUOTATIONS_PERMISSIONS.viewCost);
  const canExportPdf = permissions.includes(QUOTATIONS_PERMISSIONS.exportPdf);
  const canReadInventory = permissions.includes(INVENTORY_PERMISSIONS.read);
  const canReserveInventory = permissions.includes(INVENTORY_PERMISSIONS.reserve);
  const pdfMutation = useMutation({
    mutationFn: (variant: "commercial" | "internal") =>
      quotationService.downloadPdf(quotationId, variant),
    onError: (error) => setMessage(error instanceof Error ? error.message : "No fue posible generar el documento."),
    onSuccess: (_value, variant) => setMessage(`PDF ${variant === "internal" ? "interno" : "comercial"} descargado correctamente.`),
  });

  const quotationQuery = useQuery({
    queryFn: async () => quotationService.getQuotationById(quotationId),
    queryKey: QUOTATIONS_QUERY_KEYS.detail(quotationId),
  });

  const refreshDetail = async () => {
    await queryClient.invalidateQueries({
      queryKey: QUOTATIONS_QUERY_KEYS.detail(quotationId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["quotations"],
    });
  };

  const createVersionMutation = useMutation({
    mutationFn: async () => quotationService.createVersion(quotationId),
    onSuccess: async (version) => {
      setMessage(`Version ${version.versionNumber} creada correctamente.`);
      await refreshDetail();
    },
  });

  const submitApprovalMutation = useMutation({
    mutationFn: async () => quotationService.submitApproval(quotationId),
    onSuccess: async (result) => {
      setMessage(
        result.evaluation.requiresApproval
          ? "La cotizacion fue enviada a aprobacion."
          : "La cotizacion se aprobo automaticamente porque no se detectaron disparadores de aprobacion.",
      );
      await refreshDetail();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () =>
      quotationService.approveQuotation(quotationId, {
        decisionNotes:
          typeof window !== "undefined" ? window.prompt("Notas de aprobacion (opcional)") : "",
      }),
    onSuccess: async () => {
      setMessage("La cotizacion fue aprobada.");
      await refreshDetail();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () =>
      quotationService.rejectQuotation(quotationId, {
        decisionNotes:
          typeof window !== "undefined" ? window.prompt("Notas del rechazo") : "",
      }),
    onSuccess: async () => {
      setMessage("La cotizacion fue rechazada y regreso a borrador.");
      await refreshDetail();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (toStatus: "ACCEPTED" | "CANCELLED" | "EXPIRED" | "REJECTED" | "SENT") =>
      quotationService.changeStatus(quotationId, {
        toStatus,
      }),
    onSuccess: async (quotation) => {
      setMessage(`La cotizacion paso a ${QUOTATION_STATUS_LABELS[quotation.status].toLowerCase()}.`);
      await refreshDetail();
    },
  });

  if (quotationQuery.isLoading) {
    return <LoadingState cards={5} title="Cargando cotizacion" />;
  }

  if (quotationQuery.isError || !quotationQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void quotationQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={quotationQuery.error?.message ?? "No se pudo cargar la cotizacion."}
        title="Detalle de cotizacion no disponible"
      />
    );
  }

  const quotation = quotationQuery.data;
  const badge = getQuotationStatusBadge(quotation.status);

  return (
    <div className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>
              <span className="text-sm text-stone-500">{quotation.client.displayName}</span>
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
                {quotation.code}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
                {quotation.project
                  ? `${quotation.project.code} · ${quotation.project.title}`
                  : "Esta cotizacion todavia no esta vinculada a un proyecto."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className={secondaryButtonClassName} href={QUOTATIONS_ROUTES.preview(quotation.id)}>
              Vista previa
            </Link>
            {canUpdate ? (
              <Link className={secondaryButtonClassName} href={QUOTATIONS_ROUTES.builder(quotation.id)}>
                Cotizador
              </Link>
            ) : null}
            {canExportPdf ? (
              <ExportMenu
                actions={[
                  {
                    icon: FileText,
                    id: "quotation-pdf-commercial",
                    label: "PDF comercial",
                    onClick: () => {
                      pdfMutation.mutate("commercial");
                    },
                  },
                  ...(canViewCost
                    ? [{
                        icon: FileText,
                        id: "quotation-pdf-internal",
                        label: "PDF interno",
                        onClick: () => {
                          pdfMutation.mutate("internal");
                        },
                      }]
                    : []),
                ]}
                buttonClassName={secondaryButtonClassName}
                disabled={pdfMutation.isPending}
                onExportExcel={() => {
                  exportRowsToExcel(quotation.items, {
                    columns: [
                      { header: "Cotizacion", value: () => quotation.code },
                      { header: "Producto", value: (row: QuotationItemRecord) => row.name },
                      { header: "Tipo", value: (row: QuotationItemRecord) => QUOTATION_ITEM_TYPE_LABELS[row.itemType] },
                      { header: "Cantidad", value: (row: QuotationItemRecord) => row.quantity },
                      { header: "Materiales", value: (row: QuotationItemRecord) => row.materials.length },
                      {
                        header: "Total venta",
                        value: (row: QuotationItemRecord) =>
                          formatQuotationCurrency(row.subtotalSale, quotation.currency),
                      },
                      ...(canViewCost
                        ? [
                            {
                              header: "Total costo",
                              value: (row: QuotationItemRecord) =>
                                formatQuotationCurrency(row.subtotalCost, quotation.currency),
                            },
                            {
                              header: "Margen",
                              value: (row: QuotationItemRecord) =>
                                formatQuotationPercent(row.marginPercent),
                            },
                          ]
                        : []),
                    ],
                    fileName: `cotizacion-${quotation.code}.xls`,
                    title: `Cotizacion ${quotation.code}`,
                  });
                }}
              />
            ) : null}
          </div>
        </div>
      </section>

      {message ? (
        <section className="rounded-lg border border-blue-200/80 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </section>
      ) : null}

      {quotation.measurementRequest ? (
        <section className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Medicion asociada
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-950">
                {quotation.measurementRequest.code}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Estado actual:{" "}
                {
                  MEASUREMENT_STATUS_LABELS[
                    quotation.measurementRequest.status as keyof typeof MEASUREMENT_STATUS_LABELS
                  ]
                }
              </p>
            </div>
            <Link
              className={secondaryButtonClassName}
              href={MEASUREMENTS_ROUTES.detail(quotation.measurementRequest.id)}
            >
              Abrir medicion
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className={sectionClassName}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg bg-stone-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Vigencia
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatQuotationDate(quotation.validUntil)}
              </p>
            </div>
            <div className="rounded-lg bg-stone-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Creada
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatQuotationDateTime(quotation.createdAt)}
              </p>
            </div>
            <div className="rounded-lg bg-stone-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Actualizada
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatQuotationDateTime(quotation.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Notas comerciales
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-700">
                {quotation.notes || "Todavia no hay notas visibles para el cliente."}
              </p>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Notas internas
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-700">
                {quotation.internalNotes || "Todavia no hay notas internas."}
              </p>
            </div>
          </div>
        </section>

        <QuotationTotalsPanel canViewCost={canViewCost} quotation={quotation} />
      </div>

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Flujo
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Acciones de la cotizacion
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {canUpdate && quotation.status === "DRAFT" ? (
              <>
                <button
                  className={secondaryButtonClassName}
                  disabled={createVersionMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    createVersionMutation.mutate();
                  }}
                  type="button"
                >
                  <FileStack className="mr-2 h-4 w-4" />
                  Crear version
                </button>
                <button
                  className={primaryButtonClassName}
                  disabled={submitApprovalMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    submitApprovalMutation.mutate();
                  }}
                  type="button"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Enviar a aprobacion
                </button>
              </>
            ) : null}
            {canApprove && quotation.status === "PENDING_APPROVAL" ? (
              <>
                <button
                  className={primaryButtonClassName}
                  disabled={approveMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    approveMutation.mutate();
                  }}
                  type="button"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprobar
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={rejectMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    rejectMutation.mutate();
                  }}
                  type="button"
                >
                  Rechazar
                </button>
              </>
            ) : null}
            {canSend && quotation.status === "APPROVED" ? (
              <button
                className={primaryButtonClassName}
                disabled={statusMutation.isPending}
                onClick={() => {
                  setMessage(null);
                  statusMutation.mutate("SENT");
                }}
                type="button"
              >
                <Send className="mr-2 h-4 w-4" />
                Marcar como enviada
              </button>
            ) : null}
            {["APPROVED", "SENT"].includes(quotation.status) ? (
              <>
                <button
                  className={secondaryButtonClassName}
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    statusMutation.mutate("ACCEPTED");
                  }}
                  type="button"
                >
                  Aceptar
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    statusMutation.mutate("REJECTED");
                  }}
                  type="button"
                >
                  Rechazar
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    setMessage(null);
                    statusMutation.mutate("EXPIRED");
                  }}
                  type="button"
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  Marcar como vencida
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Items
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Lineas actuales de la cotizacion
            </h2>
          </div>

          {quotation.items.length === 0 ? (
            <EmptyState
              description="Agrega productos de plantilla, materiales manuales o servicios en el cotizador para poblar esta cotizacion."
              title="Todavia no hay items en la cotizacion"
            />
          ) : (
            <QuotationItemsTable
              canViewCost={canViewCost}
              currency={quotation.currency}
              items={quotation.items}
            />
          )}
        </section>

        <QuotationInventoryAvailability
          canReadInventory={canReadInventory}
          canReserve={canReserveInventory}
          projectId={quotation.project?.id ?? null}
          quotation={quotation}
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section className={sectionClassName}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Aprobaciones
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Solicitudes de aprobacion
              </h2>
            </div>

            <div className="mt-5 grid gap-3">
              {quotation.approvals.length === 0 ? (
                <p className="rounded-md bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  Todavia no se generaron solicitudes de aprobacion para esta cotizacion.
                </p>
              ) : (
                quotation.approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded-md border border-stone-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {QUOTATION_APPROVAL_TYPE_LABELS[approval.approvalType]}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {QUOTATION_APPROVAL_STATUS_LABELS[approval.status]}
                        </p>
                      </div>
                      <p className="text-xs text-stone-500">
                        {formatQuotationDateTime(approval.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-700">{approval.reason}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Versiones
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Historial de snapshots
              </h2>
            </div>

            <div className="mt-5 grid gap-3">
              {quotation.versions.length === 0 ? (
                <p className="rounded-md bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  Todavia no hay snapshots de version.
                </p>
              ) : (
                quotation.versions.slice(0, 3).map((version) => (
                  <div
                    key={version.id}
                    className="rounded-md border border-stone-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-stone-950">
                        Version {version.versionNumber}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatQuotationDateTime(version.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">
                      {version.itemCount} items · {QUOTATION_VERSION_STATUS_LABELS[version.status]}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5">
              <Link className={secondaryButtonClassName} href={QUOTATIONS_ROUTES.versions(quotation.id)}>
                <FileStack className="mr-2 h-4 w-4" />
                Ver todas las versiones
              </Link>
            </div>
          </section>
        </div>

        <section className={sectionClassName}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Historial
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Linea de tiempo del estado
            </h2>
          </div>

          <div className="mt-5 grid gap-3">
            {quotation.statusHistory.map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-stone-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-950">
                      {entry.fromStatus
                        ? `${QUOTATION_STATUS_LABELS[entry.fromStatus]} -> ${QUOTATION_STATUS_LABELS[entry.toStatus]}`
                        : QUOTATION_STATUS_LABELS[entry.toStatus]}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {entry.changedByUser?.name || "Sistema"} · {formatQuotationDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
                {entry.notes ? (
                  <p className="mt-3 text-sm leading-7 text-stone-700">{entry.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
