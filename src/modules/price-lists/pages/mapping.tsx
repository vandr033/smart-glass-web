"use client";

import Link from "next/link";
import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { materialService } from "@/services/material-service";
import { priceListService } from "@/services/price-list-service";
import type { PriceListRowValidationStatus } from "@/types";

import { PRICE_LISTS_PERMISSIONS, PRICE_LISTS_ROUTES } from "../constants";
import {
  PriceListRowMappingBadge,
  PriceListRowValidationBadge,
  PriceListStatusBadge,
} from "../status-badges";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "../ui";

type PriceListMappingPageProps = {
  importId: string;
};

export default function PriceListMappingPage({
  importId,
}: PriceListMappingPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canValidate = permissions.includes(PRICE_LISTS_PERMISSIONS.validate);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [validationFilter, setValidationFilter] = useState<
    "" | PriceListRowValidationStatus
  >("");
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(true);
  const [materialSearch, setMaterialSearch] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, string>>({});
  const [persistEquivalence, setPersistEquivalence] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryFn: () => priceListService.getImportById(importId),
    queryKey: ["price-lists", "detail", importId],
  });

  const rowsQuery = useQuery({
    queryFn: () =>
      priceListService.listImportRows(importId, {
        attentionOnly: showOnlyUnmapped,
        page,
        perPage: 50,
        search,
        sortBy: "rowNumber",
        sortDirection: "asc",
        validationStatus: validationFilter || undefined,
      }),
    queryKey: [
      "price-lists",
      "rows",
      importId,
      page,
      search,
      validationFilter,
      showOnlyUnmapped,
    ],
  });

  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 120,
        search: materialSearch,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["price-lists", "materials", materialSearch],
    staleTime: 60_000,
  });

  const reloadWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["price-lists", "detail", importId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["price-lists", "rows", importId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["price-lists", "imports"],
      }),
    ]);
  };

  const mapMutation = useMutation({
    mutationFn: async (rowId: string) => {
      const materialId = selectedMaterials[rowId];

      if (!materialId) {
        throw new Error("Choose an internal material before mapping the row.");
      }

      setBusyRowId(rowId);

      return priceListService.mapImportRow(importId, rowId, {
        confidence: "VERIFIED",
        conversionFactor: null,
        createOrUpdateEquivalence: persistEquivalence[rowId] ?? true,
        materialId,
        notes: null,
      });
    },
    onError: (error) => {
      setActionError(error.message);
      setBusyRowId(null);
    },
    onSuccess: async (_record, rowId) => {
      setActionError(null);
      setBusyRowId(null);
      setSelectedMaterials((currentValue) => ({
        ...currentValue,
        [rowId]: "",
      }));
      await reloadWorkspace();
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: async (rowId: string) => {
      setBusyRowId(rowId);
      return priceListService.ignoreImportRow(importId, rowId);
    },
    onError: (error) => {
      setActionError(error.message);
      setBusyRowId(null);
    },
    onSuccess: async () => {
      setActionError(null);
      setBusyRowId(null);
      await reloadWorkspace();
    },
  });

  if (detailQuery.isLoading || rowsQuery.isLoading) {
    return <LoadingState cards={4} title="Loading the mapping workspace" />;
  }

  if (detailQuery.isError || rowsQuery.isError || !detailQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void detailQuery.refetch();
              void rowsQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={
          detailQuery.error?.message ??
          rowsQuery.error?.message ??
          "The mapping workspace could not be loaded."
        }
        title="Mapping workspace unavailable"
      />
    );
  }

  const importRecord = detailQuery.data;
  const rows = rowsQuery.data?.data ?? [];
  const pagination = rowsQuery.data?.pagination;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.detail(importId)}>
              Back to import
            </Link>
            <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.history}>
              Price history
            </Link>
          </>
        }
        description="Resolve unmapped rows first, save supplier equivalences whenever the match is trustworthy, and validate only after the unresolved queue is empty."
        eyebrow="Mapping"
        title={`Mapping for ${importRecord.fileName}`}
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <PriceListStatusBadge status={importRecord.status} />
              <p className="text-sm text-stone-600">
                {importRecord.supplier.legalName} · {importRecord.rowCount} imported rows
              </p>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
              Every mapped row can create or update a supplier equivalence so future imports
              resolve automatically.
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700">
            <p className="font-semibold text-stone-950">
              {importRecord.unmappedCount} unresolved · {importRecord.invalidCount} invalid
            </p>
            <p className="mt-1">Approve stays disabled until the parent import is validated.</p>
          </div>
        </div>

        {actionError ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {actionError}
          </div>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar SKU, proveedor o descripcion"
            value={search}
          />

          <input
            className={fieldClassName}
            onChange={(event) => {
              setMaterialSearch(event.target.value);
            }}
            placeholder="Narrow internal material options"
            value={materialSearch}
          />

          <select
            className={fieldClassName}
              onChange={(event) => {
                setPage(1);
                setValidationFilter(
                  (event.target.value as PriceListRowValidationStatus | "") ?? "",
                );
              }}
              value={validationFilter}
            >
            <option value="">All validation states</option>
            <option value="PENDING">Pending</option>
            <option value="VALID">Valid</option>
            <option value="INVALID">Invalid</option>
          </select>

          <label className="flex items-center gap-3 rounded-md border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700">
            <input
              checked={showOnlyUnmapped}
              onChange={(event) => {
                setPage(1);
                setShowOnlyUnmapped(event.target.checked);
              }}
              type="checkbox"
            />
            Show unmapped and invalid rows first
          </label>
        </div>
      </section>

      {rows.length === 0 ? (
        <EmptyState
          description="There are no rows matching the current filters. Switch off the unresolved-only filter to inspect already mapped rows."
          icon={Search}
          title="Nothing to map in this view"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Supplier row</th>
                  <th className="px-5 py-4 font-semibold">Detected material</th>
                  <th className="px-5 py-4 font-semibold">Statuses</th>
                  <th className="px-5 py-4 font-semibold">Map action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const selectedMaterialId =
                    selectedMaterials[row.id] ?? row.detectedMaterialId ?? "";
                  const rowBusy = busyRowId === row.id;

                  return (
                    <tr key={row.id} className="border-t border-stone-200/80 align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-950">
                          Row {row.rowNumber}: {row.supplierName}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          SKU: {row.supplierSku ?? "Unavailable"} · Unit:{" "}
                          {row.supplierUnit ?? "Unavailable"} · Price:{" "}
                          {row.rawPrice ?? "Unavailable"}
                        </p>
                        {row.supplierDescription ? (
                          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-700">
                            {row.supplierDescription}
                          </p>
                        ) : null}
                        {row.validationMessage ? (
                          <p className="mt-2 rounded-[1rem] bg-rose-50 px-3 py-2 text-xs text-rose-800">
                            {row.validationMessage}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        {row.detectedMaterial ? (
                          <div className="rounded-md border border-stone-200 bg-stone-50/70 px-4 py-3">
                            <p className="font-semibold text-stone-950">
                              {row.detectedMaterial.name}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                              {row.detectedMaterial.code}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-md border border-dashed border-stone-300 bg-stone-50/60 px-4 py-3 text-sm text-stone-600">
                            No internal material selected yet.
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <PriceListRowMappingBadge status={row.mappingStatus} />
                          <PriceListRowValidationBadge status={row.validationStatus} />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {canValidate ? (
                          <div className="space-y-3">
                            <select
                              className={fieldClassName}
                              onChange={(event) => {
                                setSelectedMaterials((currentValue) => ({
                                  ...currentValue,
                                  [row.id]: event.target.value,
                                }));
                              }}
                              value={selectedMaterialId}
                            >
                              <option value="">Seleccione un material interno</option>
                              {(materialsQuery.data ?? []).map((material) => (
                                <option key={material.id} value={material.id}>
                                  {material.code} · {material.name}
                                </option>
                              ))}
                            </select>

                            <label className="flex items-center gap-3 text-sm text-stone-700">
                              <input
                                checked={persistEquivalence[row.id] ?? true}
                                onChange={(event) => {
                                  setPersistEquivalence((currentValue) => ({
                                    ...currentValue,
                                    [row.id]: event.target.checked,
                                  }));
                                }}
                                type="checkbox"
                              />
                              Save or update supplier equivalence
                            </label>

                            <div className="flex flex-wrap gap-2">
                              <button
                                className={primaryButtonClassName}
                                disabled={rowBusy || !selectedMaterialId}
                                onClick={() => {
                                  setActionError(null);
                                  mapMutation.mutate(row.id);
                                }}
                                type="button"
                              >
                                {rowBusy && mapMutation.isPending ? "Mapping..." : "Map row"}
                              </button>
                              <button
                                className={secondaryButtonClassName}
                                disabled={rowBusy}
                                onClick={() => {
                                  setActionError(null);
                                  ignoreMutation.mutate(row.id);
                                }}
                                type="button"
                              >
                                {rowBusy && ignoreMutation.isPending ? "Ignoring..." : "Ignore"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-6 text-stone-600">
                            This workspace is read-only without `price_lists.validate`.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 px-5 py-4">
            <p className="text-sm text-stone-600">
              Page {pagination?.page ?? 1} of{" "}
              {pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1}
            </p>
            <div className="flex gap-2">
              <button
                className={secondaryButtonClassName}
                disabled={(pagination?.page ?? 1) <= 1}
                onClick={() => {
                  setPage((currentPage) => Math.max(1, currentPage - 1));
                }}
                type="button"
              >
                Previous
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={
                  pagination
                    ? pagination.page * pagination.perPage >= pagination.total
                    : true
                }
                onClick={() => {
                  setPage((currentPage) => currentPage + 1);
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Reminder
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Future imports learn from today’s verified mappings
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              Leave the equivalence checkbox on for rows you trust. That is what turns a
              manual cleanup session into better automatic mapping later.
            </p>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700">
            <p className="font-semibold text-stone-950">
              {materialsQuery.data?.length ?? 0} material options loaded
            </p>
            <p className="mt-1">Use the material search field to narrow the shortlist.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
