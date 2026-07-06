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
    return <LoadingState cards={4} title="Loading import summary" />;
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
            Retry
          </button>
        }
        description={detailQuery.error?.message ?? "The import could not be loaded."}
        title="Price list import could not be loaded"
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
              Back to imports
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRICE_LISTS_ROUTES.mapping(record.id)}
            >
              Mapping workspace
            </Link>
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.history}>
              <History className="mr-2 h-4 w-4" />
              Price history
            </Link>
          </>
        }
        description={`Imported from ${record.supplier.legalName}. Review unresolved rows, validate the file, and approve only when the current-price update is safe to apply.`}
        eyebrow="Import Detail"
        title={record.fileName}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          description="Rows detected from the uploaded spreadsheet."
          icon={FileCheck2}
          label="Rows"
          value={String(record.rowCount)}
        />
        <StatCard
          description="Rows already tied to internal materials."
          icon={CheckCircle2}
          label="Mapped"
          value={String(record.mappedCount)}
        />
        <StatCard
          description="Rows still blocking validation or approval."
          icon={FolderSearch2}
          label="Unmapped"
          value={String(record.unmappedCount)}
        />
        <StatCard
          description="Invalid or malformed rows kept for review."
          icon={AlertTriangle}
          label="Invalid"
          tone={record.invalidCount > 0 ? "accent" : "default"}
          value={String(record.invalidCount)}
        />
      </section>

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Status
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
                {validateMutation.isPending ? "Validating..." : "Validate import"}
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
                <dd>{record.approvedByUser?.name ?? "Not approved"}</dd>
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
                    ? "All rows are mapped."
                    : `${record.unmappedCount} rows still need mapping attention.`}
                </p>
              </div>
              <div className="rounded-md border border-stone-200 bg-stone-50/70 px-4 py-3">
                <p className="font-semibold text-stone-950">
                  {record.invalidCount === 0
                    ? "No invalid rows are currently blocking approval."
                    : `${record.invalidCount} invalid rows must be fixed or ignored.`}
                </p>
              </div>
              <div className="rounded-md border border-stone-200 bg-stone-50/70 px-4 py-3">
                <p className="font-semibold text-stone-950">
                  Approval stays disabled until the status becomes `VALIDATED`.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmDialog
        confirmLabel="Approve import"
        description="Approving will close old current prices for the same supplier and materials, create new current prices, and write price-history records. Double-check the mapping workspace before continuing."
        isLoading={approveMutation.isPending}
        onConfirm={() => {
          approveMutation.mutate();
        }}
        onOpenChange={setApproveOpen}
        open={approveOpen}
        title="Approve this price list?"
        tone="default"
      />

      <ConfirmDialog
        confirmLabel="Reject import"
        description="Rejecting keeps the historical import record but prevents this file from becoming current pricing."
        isLoading={rejectMutation.isPending}
        onConfirm={() => {
          rejectMutation.mutate();
        }}
        onOpenChange={setRejectOpen}
        open={rejectOpen}
        title="Reject this import?"
      />
    </main>
  );
}
