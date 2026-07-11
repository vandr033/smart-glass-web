"use client";

import Link from "next/link";
import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FolderSearch2,
  History,
  RefreshCcw,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import { priceListService } from "@/services/price-list-service";

import {
  PRICE_LISTS_PERMISSIONS,
  PRICE_LISTS_ROUTES,
} from "../constants";
import { PriceListStatusBadge } from "../status-badges";
import {
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  warningButtonClassName,
} from "../ui";

type PriceListDetailPageProps = {
  importId: string;
};

export default function PriceListDetailPage({
  importId,
}: PriceListDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const canValidate = permissions.includes(PRICE_LISTS_PERMISSIONS.validate);
  const canApprove = permissions.includes(PRICE_LISTS_PERMISSIONS.approve);

  const detailQuery = useQuery({
    queryFn: () => priceListService.getImportById(importId),
    queryKey: ["price-lists", "detail", importId],
  });

  const reloadDetail = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["price-lists", "detail", importId],
    });
    await queryClient.invalidateQueries({
      queryKey: ["price-lists", "imports"],
    });
  };

  const autoMapMutation = useMutation({
    mutationFn: () => priceListService.autoMapImportRows(importId),
    onError: (error) => {
      setActionError(error.message);
    },
    onSuccess: async () => {
      setActionError(null);
      await reloadDetail();
    },
  });

  const validateMutation = useMutation({
    mutationFn: () => priceListService.validateImport(importId),
    onError: (error) => {
      setActionError(error.message);
    },
    onSuccess: async () => {
      setActionError(null);
      await reloadDetail();
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => priceListService.approveImport(importId),
    onError: (error) => {
      setActionError(error.message);
    },
    onSuccess: async () => {
      setApproveOpen(false);
      setActionError(null);
      await reloadDetail();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => priceListService.rejectImport(importId),
    onError: (error) => {
      setActionError(error.message);
    },
    onSuccess: async () => {
      setRejectOpen(false);
      setActionError(null);
      await reloadDetail();
    },
  });

  if (detailQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando resumen de importación" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void detailQuery.refetch();
            }}
            type="button"
          >
            Intentar nuevamente
          </button>
        }
        description={detailQuery.error?.message ?? "No se pudo cargar la importación."}
        title="No se pudo cargar la importación de la lista de precios"
      />
    );
  }

  const record = detailQuery.data;
  const isLocked = record.status === "APPROVED" || record.status === "REJECTED";

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.list}>
              Volver a importaciones
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRICE_LISTS_ROUTES.mapping(record.id)}
            >
              Espacio de mapeo
            </Link>
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.history}>
              <History className="mr-2 h-4 w-4" />
              Historial de precios
            </Link>
          </>
        }
        description={`Importada desde ${record.supplier.legalName}. Revisa las filas sin resolver, valida el archivo y aprueba solo cuando sea seguro actualizar los precios vigentes.`}
        eyebrow="Detalle de importación"
        title={record.fileName}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Filas detectadas en la hoja de cálculo cargada."
          icon={FileCheck2}
          label="Filas"
          value={String(record.rowCount)}
        />
        <StatCard
          description="Filas vinculadas a materiales internos."
          icon={CheckCircle2}
          label="Mapeadas"
          value={String(record.mappedCount)}
        />
        <StatCard
          description="Filas que aún bloquean la validación o aprobación."
          icon={FolderSearch2}
          label="Sin mapear"
          value={String(record.unmappedCount)}
        />
        <StatCard
          description="Filas inválidas o malformadas conservadas para revisión."
          icon={AlertTriangle}
          label="Inválidas"
          tone={record.invalidCount > 0 ? "accent" : "default"}
          value={String(record.invalidCount)}
        />
      </section>

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Estado
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PriceListStatusBadge status={record.status} />
              <p className="text-sm text-stone-600">
                Imported {formatDateValue(record.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void detailQuery.refetch();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </button>
            {canValidate ? (
              <button
                className={secondaryButtonClassName}
                disabled={autoMapMutation.isPending || isLocked}
                onClick={() => {
                  setActionError(null);
                  autoMapMutation.mutate();
                }}
                type="button"
              >
                {autoMapMutation.isPending ? "Auto-mapping..." : "Auto-map rows"}
              </button>
            ) : null}
            {canValidate ? (
              <button
                className={warningButtonClassName}
                disabled={validateMutation.isPending || isLocked}
                onClick={() => {
                  setActionError(null);
                  validateMutation.mutate();
                }}
                type="button"
              >
                {validateMutation.isPending ? "Validando…" : "Validar importación"}
              </button>
            ) : null}
            {canApprove ? (
              <button
                className={primaryButtonClassName}
                disabled={record.status !== "VALIDATED" || approveMutation.isPending}
                onClick={() => {
                  setApproveOpen(true);
                }}
                type="button"
              >
                Approve import
              </button>
            ) : null}
            {canApprove ? (
              <button
                className={secondaryButtonClassName}
                disabled={isLocked || rejectMutation.isPending}
                onClick={() => {
                  setRejectOpen(true);
                }}
                type="button"
              >
                Reject
              </button>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {actionError}
          </div>
        ) : null}
      </section>

      <section className={tableWrapperClassName}>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Import metadata
            </p>
            <dl className="mt-4 space-y-3 text-sm text-stone-700">
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-stone-500">Supplier</dt>
                <dd className="text-right font-semibold text-stone-950">
                  {record.supplier.legalName}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-stone-500">Currency</dt>
                <dd>{record.currency}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-stone-500">Source type</dt>
                <dd>{record.sourceType}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-stone-500">Imported by</dt>
                <dd>{record.importedByUser.name}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="font-medium text-stone-500">Approved by</dt>
                <dd>{record.approvedByUser?.name ?? "No aprobado"}</dd>
              </div>
            </dl>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
              Readiness
            </p>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <div className="rounded-md border border-stone-200 bg-stone-50/70 px-4 py-3">
                <p className="font-semibold text-stone-950">
                  {record.unmappedCount === 0
                    ? "Todas las filas están mapeadas."
                    : `${record.unmappedCount} rows still need mapping attention.`}
                </p>
              </div>
              <div className="rounded-md border border-stone-200 bg-stone-50/70 px-4 py-3">
                <p className="font-semibold text-stone-950">
                  {record.invalidCount === 0
                    ? "No hay filas inválidas bloqueando actualmente la aprobación."
                    : `${record.invalidCount} invalid rows must be fixed or ignored.`}
                </p>
              </div>
              <div className="rounded-md border border-stone-200 bg-stone-50/70 px-4 py-3">
                <p className="font-semibold text-stone-950">
                  La aprobación permanecerá deshabilitada hasta que el estado sea `VALIDATED`.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        confirmLabel="Aprobar importación"
        description="La aprobación cerrará los precios vigentes anteriores del mismo proveedor y materiales, creará nuevos precios y registrará el historial. Revisa el mapeo antes de continuar."
        isLoading={approveMutation.isPending}
        onConfirm={() => {
          approveMutation.mutate();
        }}
        onOpenChange={setApproveOpen}
        open={approveOpen}
        title="¿Aprobar esta lista de precios?"
        tone="default"
      />

      <ConfirmDialog
        confirmLabel="Rechazar importación"
        description="El rechazo conserva el registro histórico, pero evita que este archivo se convierta en el precio vigente."
        isLoading={rejectMutation.isPending}
        onConfirm={() => {
          rejectMutation.mutate();
        }}
        onOpenChange={setRejectOpen}
        open={rejectOpen}
        title="¿Rechazar esta importación?"
      />
    </main>
  );
}
