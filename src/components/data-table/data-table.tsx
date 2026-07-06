"use client";

import { useDeferredValue, useEffect, useState } from "react";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Ellipsis,
  ListFilter,
  RefreshCcw,
} from "lucide-react";

import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExportMenu } from "@/components/ui/export-menu";
import { exportRowsToCsv, exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import { apiClient } from "@/services/api-client";
import type { PaginatedApiSuccessResponse } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";
import { DataTableFilters } from "./data-table-filters";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSearch } from "./data-table-search";
import { buildDataTableSearchParams, hasActiveFilterValue } from "./query";
import type {
  DataTableBulkAction,
  DataTableConfig,
  DataTableFilterValue,
  DataTableResult,
  DataTableRowAction,
} from "./types";

type DataTableProps<TRow> = {
  className?: string;
  config: DataTableConfig<TRow>;
  endpoint: string;
};

type PendingAction<TRow> =
  | {
      action: DataTableBulkAction<TRow>;
      rows: TRow[];
      scope: "bulk";
    }
  | {
      action: DataTableRowAction<TRow>;
      rows: TRow[];
      scope: "row";
    };

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

const buttonClassName =
  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50";

const getActionButtonClassName = (tone: "danger" | "default" = "default") => {
  return cn(
    buttonClassName,
    tone === "danger"
      ? "border-[color:var(--color-error)] bg-[var(--color-error)] text-white hover:bg-rose-800"
      : "border-[color:var(--color-border)] bg-white text-stone-700 hover:border-[color:var(--color-border-strong)] hover:text-stone-950",
  );
};

const resolveUpdater = <TValue,>(updater: Updater<TValue>, currentValue: TValue): TValue => {
  if (typeof updater === "function") {
    return (updater as (previousValue: TValue) => TValue)(currentValue);
  }

  return updater;
};

const isRowActionHidden = <TRow,>(
  action: DataTableRowAction<TRow>,
  row: TRow,
): boolean => {
  if (typeof action.hidden === "function") {
    return action.hidden(row);
  }

  return action.hidden ?? false;
};

const isRowActionDisabled = <TRow,>(
  action: DataTableRowAction<TRow>,
  row: TRow,
): boolean => {
  if (typeof action.disabled === "function") {
    return action.disabled(row);
  }

  return action.disabled ?? false;
};

const isBulkActionHidden = <TRow,>(
  action: DataTableBulkAction<TRow>,
  rows: TRow[],
): boolean => {
  if (typeof action.hidden === "function") {
    return action.hidden(rows);
  }

  return action.hidden ?? false;
};

const isBulkActionDisabled = <TRow,>(
  action: DataTableBulkAction<TRow>,
  rows: TRow[],
): boolean => {
  if (typeof action.disabled === "function") {
    return action.disabled(rows);
  }

  return action.disabled ?? false;
};

const renderSortIcon = (isSorted: false | "asc" | "desc") => {
  if (isSorted === "asc") {
    return <ArrowUp className="h-4 w-4" />;
  }

  if (isSorted === "desc") {
    return <ArrowDown className="h-4 w-4" />;
  }

  return <ArrowUpDown className="h-4 w-4" />;
};

function RowActionsMenu<TRow>({
  onActionClick,
  row,
  rowActions,
}: {
  onActionClick: (action: DataTableRowAction<TRow>, row: TRow) => void;
  row: TRow;
  rowActions: DataTableRowAction<TRow>[];
}) {
  const actions = rowActions.filter((action) => !isRowActionHidden(action, row));

  if (actions.length === 0) {
    return null;
  }

  return (
    <PortalDropdown
      align="end"
      contentClassName="min-w-[12rem]"
      sideOffset={8}
      trigger={({ ref, ...triggerProps }) => (
        <button
          {...triggerProps}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white text-stone-700 shadow-sm transition hover:border-[color:var(--color-border-strong)] hover:text-stone-950"
          ref={ref}
          type="button"
        >
          <Ellipsis className="h-4 w-4" />
        </button>
      )}
    >
      {({ close }) => (
        <div className="grid gap-1">
          {actions.map((action) => {
            const Icon = action.icon;
            const className = cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium transition",
              action.tone === "danger"
                ? "text-rose-700 hover:bg-rose-50"
                : "text-stone-700 hover:bg-[var(--color-surface-muted)]",
            );

            if (action.href) {
              return (
                <Link
                  key={action.id}
                  className={className}
                  href={action.href(row)}
                  onClick={close}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.id}
                className={className}
                disabled={isRowActionDisabled(action, row)}
                onClick={() => {
                  close();
                  onActionClick(action, row);
                }}
                type="button"
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </PortalDropdown>
  );
}

function ColumnVisibilityMenu<TRow>({
  table,
}: {
  table: ReturnType<typeof useReactTable<TRow>>;
}) {
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide() && !column.id.startsWith("__"));

  if (hideableColumns.length === 0) {
    return null;
  }

  return (
    <PortalDropdown
      align="end"
      contentClassName="min-w-[14rem]"
      sideOffset={8}
      trigger={({ ref, ...triggerProps }) => (
        <button {...triggerProps} className={getActionButtonClassName()} ref={ref} type="button">
          <Columns3 className="h-4 w-4" />
          Columnas
        </button>
      )}
    >
      <div className="grid gap-1">
        {hideableColumns.map((column) => (
          <label
            key={column.id}
            className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-stone-700 transition hover:bg-[var(--color-surface-muted)]"
          >
            <input
              checked={column.getIsVisible()}
              className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
              onChange={(event) => {
                column.toggleVisibility(event.target.checked);
              }}
              type="checkbox"
            />
            {String(column.columnDef.header ?? column.id)}
          </label>
        ))}
      </div>
    </PortalDropdown>
  );
}

/**
 * Reusable enterprise-style DataTable with a server-side query contract.
 * Future modules only need an endpoint plus a DataTableConfig to render.
 */
export function DataTable<TRow>({
  className,
  config,
  endpoint,
}: DataTableProps<TRow>) {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: config.pageSizeOptions?.[0] ?? DEFAULT_PAGE_SIZE_OPTIONS[0],
  });
  const [sorting, setSorting] = useState<SortingState>(
    config.defaultSort
      ? [
          {
            desc: config.defaultSort.desc ?? false,
            id: config.defaultSort.id,
          },
        ]
      : [],
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [filterValues, setFilterValues] = useState<
    Record<string, DataTableFilterValue | undefined>
  >(
    Object.fromEntries(
      (config.filters ?? []).map((filter) => [filter.id, filter.defaultValue]),
    ),
  );
  const [pendingAction, setPendingAction] = useState<PendingAction<TRow> | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState((config.filters?.length ?? 0) > 0);

  const filters = config.filters ?? [];
  const tableQueryKey = config.queryKey ?? ["data-table", endpoint];
  const shouldEnableSelection = config.enableSelection ?? true;
  const pageSizeOptions = config.pageSizeOptions ?? [...DEFAULT_PAGE_SIZE_OPTIONS];

  const searchParams = buildDataTableSearchParams({
    filters: filterValues,
    filterDefinitions: filters,
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    search: deferredSearch,
    sorting,
  });
  const requestSignature = searchParams.toString();

  useEffect(() => {
    setRowSelection({});
  }, [requestSignature]);

  const tableQuery = useQuery<DataTableResult<TRow>>({
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const requestUrl = requestSignature
        ? `${endpoint}?${requestSignature}`
        : endpoint;
      const response = await apiClient.get<PaginatedApiSuccessResponse<TRow[]>>(
        requestUrl,
      );

      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    },
    queryKey: [...tableQueryKey, requestSignature],
  });

  const rows = tableQuery.data?.data ?? [];
  const paginationMeta = tableQuery.data?.pagination ?? {
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    total: 0,
  };
  const pageCount = Math.max(1, Math.ceil(paginationMeta.total / paginationMeta.perPage));

  const runtimeColumns = [
    ...(shouldEnableSelection
                ? [
          {
            cell: ({ row }: { row: Row<TRow> }) => (
              <input
                aria-label="Seleccionar fila"
                checked={row.getIsSelected()}
                className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                onChange={row.getToggleSelectedHandler()}
                type="checkbox"
              />
            ),
            enableHiding: false,
            enableSorting: false,
            header: () => (
              <input
                aria-label="Seleccionar todas las filas de la página"
                checked={table.getIsAllPageRowsSelected()}
                className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                onChange={table.getToggleAllPageRowsSelectedHandler()}
                type="checkbox"
              />
            ),
            id: "__select",
            size: 48,
          },
        ]
      : []),
    ...config.columns,
    ...(config.rowActions?.length
      ? [
          {
            cell: ({ row }: { row: Row<TRow> }) => (
              <RowActionsMenu
                onActionClick={(action, currentRow) => {
                  handleRowAction(action, currentRow);
                }}
                row={row.original}
                rowActions={config.rowActions ?? []}
              />
            ),
            enableHiding: false,
            enableSorting: false,
            header: "Acciones",
            id: "__actions",
            size: 80,
          },
        ]
      : []),
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    columns: runtimeColumns,
    data: rows,
    enableRowSelection: shouldEnableSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: config.getRowId,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const nextSorting = resolveUpdater(updater, sorting).slice(0, 1);
      setSorting(nextSorting);
      setPagination((current) => ({
        ...current,
        pageIndex: 0,
      }));
    },
    pageCount,
    state: {
      columnVisibility,
      rowSelection,
      sorting,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const activeFilterCount = filters.filter((filter) => {
    return hasActiveFilterValue(filterValues[filter.id]);
  }).length;

  const resolveExportConfig = (selectedOnly = false) => {
    if (!config.csv) {
      return undefined;
    }

    const fileName = config.csv.fileName
      ? selectedOnly
        ? config.csv.fileName.replace(/\.[^.]+$/, "-seleccion$&")
        : config.csv.fileName
      : selectedOnly
        ? "registros-seleccionados.csv"
        : undefined;

    return {
      ...config.csv,
      fileName,
      title:
        config.emptyState?.title ??
        config.searchPlaceholder ??
        "Reporte",
    };
  };

  useEffect(() => {
    if (activeFilterCount > 0) {
      setFiltersOpen(true);
    }
  }, [activeFilterCount]);

  const invalidateTable = async () => {
    await queryClient.invalidateQueries({
      queryKey: tableQueryKey,
    });
  };

  const handleActionError = (error: unknown) => {
    setActionError(getApiErrorMessage(error));
  };

  const executeRowAction = async (
    action: DataTableRowAction<TRow>,
    row: TRow,
  ): Promise<void> => {
    if (!action.onClick) {
      return;
    }

    setActionError(null);
    setIsExecutingAction(true);

    try {
      await action.onClick(row);

      if (action.invalidateAfterSuccess ?? action.variant === "delete") {
        await invalidateTable();
      }
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsExecutingAction(false);
    }
  };

  const executeBulkAction = async (
    action: DataTableBulkAction<TRow>,
    currentRows: TRow[],
  ): Promise<void> => {
    setActionError(null);
    setIsExecutingAction(true);

    try {
      await action.onClick(currentRows);

      if (action.invalidateAfterSuccess ?? action.variant === "delete") {
        await invalidateTable();
      }
    } catch (error) {
      handleActionError(error);
    } finally {
      setIsExecutingAction(false);
    }
  };

  function handleRowAction(action: DataTableRowAction<TRow>, row: TRow) {
    if (action.confirmation) {
      setPendingAction({
        action,
        rows: [row],
        scope: "row",
      });
      return;
    }

    void executeRowAction(action, row);
  }

  const handleBulkActionClick = (action: DataTableBulkAction<TRow>) => {
    if (action.confirmation) {
      setPendingAction({
        action,
        rows: selectedRows,
        scope: "bulk",
      });
      return;
    }

    void executeBulkAction(action, selectedRows);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    if (pendingAction.scope === "row") {
      await executeRowAction(pendingAction.action, pendingAction.rows[0]);
    } else {
      await executeBulkAction(pendingAction.action, pendingAction.rows);
    }

    setPendingAction(null);
  };

  const handleFilterChange = (
    filterId: string,
    value: DataTableFilterValue | undefined,
  ) => {
    setFilterValues((current) => ({
      ...current,
      [filterId]: value,
    }));
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  };

  const handleResetFilters = () => {
    setFilterValues(
      Object.fromEntries(filters.map((filter) => [filter.id, filter.defaultValue])),
    );
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }));
  };

  if (tableQuery.isError && rows.length === 0) {
    return (
      <ErrorState
        action={
          <button
            className={getActionButtonClassName()}
            onClick={() => {
              void tableQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="h-4 w-4" />
            Reintentar
          </button>
        }
        description={tableQuery.error.message}
        title="No se pudieron cargar los registros"
      />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="rounded-md border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <DataTableSearch
              isBusy={tableQuery.isFetching}
              onChange={(value) => {
                setSearchInput(value);
                setPagination((current) => ({
                  ...current,
                  pageIndex: 0,
                }));
              }}
              placeholder={config.searchPlaceholder}
              value={searchInput}
            />
            <div className="flex flex-wrap gap-3">
              {filters.length > 0 ? (
                <button
                  className={getActionButtonClassName()}
                  onClick={() => {
                    setFiltersOpen((current) => !current);
                  }}
                  type="button"
                >
                  <ListFilter className="h-4 w-4" />
                  Filtros
                  {activeFilterCount > 0 ? (
                    <span className="rounded-sm bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-[11px] text-[color:var(--color-primary-soft-text)]">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
              ) : null}
              <ColumnVisibilityMenu table={table} />
              {config.csv ? (
                <ExportMenu
                  buttonClassName={getActionButtonClassName()}
                  disabled={rows.length === 0}
                  onExportCsv={() => {
                    exportRowsToCsv(rows, resolveExportConfig());
                  }}
                  onExportExcel={() => {
                    exportRowsToExcel(rows, resolveExportConfig());
                  }}
                  onExportPdf={() => {
                    exportRowsToPdf(rows, resolveExportConfig());
                  }}
                />
              ) : null}
              <button
                className={getActionButtonClassName()}
                disabled={tableQuery.isFetching}
                onClick={() => {
                  void tableQuery.refetch();
                }}
                type="button"
              >
                <RefreshCcw className="h-4 w-4" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="text-sm text-stone-600">
            <span className="font-semibold text-stone-950">{paginationMeta.total}</span>{" "}
            registros
            {activeFilterCount > 0 ? ` • ${activeFilterCount} filtros activos` : ""}
          </div>
        </div>

        {selectedRows.length > 0 ? (
          <div className="mt-4 flex flex-col gap-3 rounded-md border border-[rgba(15,91,215,0.16)] bg-[var(--color-primary-soft)] px-4 py-4 text-[color:var(--color-text)] lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm">
              <span className="font-semibold text-[color:var(--color-primary-soft-text)]">{selectedRows.length}</span>{" "}
              fila{selectedRows.length === 1 ? "" : "s"} seleccionada{selectedRows.length === 1 ? "" : "s"} en esta página
            </p>

            <div className="flex flex-wrap gap-3">
              {config.csv ? (
                <ExportMenu
                  buttonClassName="inline-flex items-center gap-2 rounded-md border border-[rgba(15,91,215,0.16)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-text)] shadow-sm transition hover:border-[color:var(--color-border-strong)]"
                  label="Exportar selección"
                  onExportCsv={() => {
                    exportRowsToCsv(selectedRows, resolveExportConfig(true));
                  }}
                  onExportExcel={() => {
                    exportRowsToExcel(selectedRows, resolveExportConfig(true));
                  }}
                  onExportPdf={() => {
                    exportRowsToPdf(selectedRows, resolveExportConfig(true));
                  }}
                />
              ) : null}

              {(config.bulkActions ?? [])
                .filter((action) => !isBulkActionHidden(action, selectedRows))
                .map((action) => (
                  <button
                    key={action.id}
                    className={getActionButtonClassName(action.tone)}
                    disabled={isBulkActionDisabled(action, selectedRows)}
                    onClick={() => {
                      handleBulkActionClick(action);
                    }}
                    type="button"
                  >
                    {action.icon ? <action.icon className="h-4 w-4" /> : null}
                    {action.label}
                  </button>
                ))}

              <button
                className="inline-flex items-center gap-2 rounded-md border border-[rgba(15,91,215,0.16)] bg-white px-3 py-2 text-sm font-semibold text-[color:var(--color-text)] shadow-sm transition hover:border-[color:var(--color-border-strong)]"
                onClick={() => {
                  setRowSelection({});
                }}
                type="button"
              >
                Limpiar selección
              </button>
            </div>
          </div>
        ) : null}

        {actionError ? (
          <div className="mt-4 rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}
      </div>

      {filters.length > 0 && filtersOpen ? (
        <DataTableFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          values={filterValues}
        />
      ) : null}

      {tableQuery.isLoading && rows.length === 0 ? (
        <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white shadow-sm">
          <div className="animate-pulse space-y-4 p-5">
            <div className="h-5 w-40 rounded-md bg-stone-200" />
            <div className="h-12 rounded-md bg-stone-200" />
            <div className="h-12 rounded-md bg-stone-200" />
            <div className="h-12 rounded-md bg-stone-200" />
            <div className="h-12 rounded-md bg-stone-200" />
          </div>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          action={config.emptyState?.action}
          description={
            config.emptyState?.description ??
            "No se encontraron registros para la búsqueda y filtros actuales."
          }
          title={config.emptyState?.title ?? "No se encontraron registros"}
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table
              className={cn(
                "min-w-full border-separate border-spacing-0",
                config.tableClassName,
              )}
            >
              <thead className="bg-[var(--color-surface-muted)] text-left text-sm text-stone-700">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isActionsColumn = header.id === "__actions";

                      return (
                        <th
                          key={header.id}
                          className={cn(
                            "border-b border-[color:var(--color-border)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] first:pl-5 last:pr-5",
                            isActionsColumn &&
                              "sticky right-0 z-10 bg-[var(--color-surface-muted)] text-right",
                          )}
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {renderSortIcon(header.column.getIsSorted())}
                            </button>
                          ) : (
                            <div className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className={cn(tableQuery.isFetching && "opacity-70")}>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-stone-200/80 text-sm text-stone-800 transition hover:bg-[var(--color-surface-muted)]"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isActionsColumn = cell.column.id === "__actions";

                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "border-b border-stone-200/80 px-4 py-3 align-top first:pl-5 last:pr-5",
                            isActionsColumn && "sticky right-0 z-10 bg-white",
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DataTablePagination
        isLoading={tableQuery.isFetching}
        onPageChange={(page) => {
          setPagination((current) => ({
            ...current,
            pageIndex: page - 1,
          }));
        }}
        onPageSizeChange={(pageSize) => {
          setPagination({
            pageIndex: 0,
            pageSize,
          });
        }}
        page={paginationMeta.page}
        pageSize={paginationMeta.perPage}
        pageSizeOptions={pageSizeOptions}
        total={paginationMeta.total}
      />

      <ConfirmDialog
        confirmLabel={pendingAction?.action.confirmation?.confirmLabel}
        description={
          typeof pendingAction?.action.confirmation?.description === "function"
            ? pendingAction.action.confirmation.description(pendingAction.rows)
            : pendingAction?.action.confirmation?.description ?? ""
        }
        isLoading={isExecutingAction}
        onConfirm={() => {
          void handleConfirmAction();
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null);
          }
        }}
        open={Boolean(pendingAction)}
        title={pendingAction?.action.confirmation?.title ?? "Confirmar acción"}
        tone={pendingAction?.action.confirmation?.tone ?? pendingAction?.action.tone}
      />
    </section>
  );
}
