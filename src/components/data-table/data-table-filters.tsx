"use client";

import { ListFilter, RotateCcw } from "lucide-react";

import { PortalDropdown } from "@/components/ui/portal-dropdown";
import { cn } from "@/utils";

import { hasActiveFilterValue } from "./query";
import type { DataTableFilterConfig, DataTableFilterValue } from "./types";

type DataTableFiltersProps = {
  filters: DataTableFilterConfig[];
  onChange: (filterId: string, value: DataTableFilterValue | undefined) => void;
  onReset: () => void;
  values: Record<string, DataTableFilterValue | undefined>;
};

const getSelectValue = (value: DataTableFilterValue | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const renderFilterControl = ({
  filter,
  onChange,
  value,
}: {
  filter: DataTableFilterConfig;
  onChange: (value: DataTableFilterValue | undefined) => void;
  value: DataTableFilterValue | undefined;
}) => {
  if (filter.type === "text") {
    return (
      <input
        className="h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-500 focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]"
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue.length > 0 ? event.target.value : undefined);
        }}
        placeholder={filter.placeholder ?? `Filtrar por ${filter.label.toLowerCase()}`}
        type="text"
        value={Array.isArray(value) ? value.join(", ") : value ?? ""}
      />
    );
  }

  if (filter.type === "date") {
    return (
      <input
        className="h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]"
        onChange={(event) => {
          const nextValue = event.target.value.trim();
          onChange(nextValue.length > 0 ? nextValue : undefined);
        }}
        type="date"
        value={Array.isArray(value) ? value[0] ?? "" : value ?? ""}
      />
    );
  }

  if (filter.type === "multi-select") {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <PortalDropdown
        align="start"
        contentClassName="w-[16rem]"
        sideOffset={8}
        trigger={({ ref, ...triggerProps }) => (
          <button
            {...triggerProps}
            className="flex h-11 w-full items-center justify-between rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm font-medium text-stone-700 transition hover:border-[color:var(--color-border-strong)]"
            ref={ref}
            type="button"
          >
            <span className="truncate">
              {selectedValues.length > 0
                ? `${filter.label}: ${selectedValues.length} seleccionados`
                : filter.label}
            </span>
            <ListFilter className="h-4 w-4 text-stone-500" />
          </button>
        )}
      >
        {() => (
          <div className="grid gap-1">
            {filter.options?.map((option) => {
              const checked = selectedValues.includes(option.value);

              return (
                <label
                  key={option.value}
                  className="flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-stone-700 transition hover:bg-[var(--color-surface-muted)]"
                >
                  <input
                    checked={checked}
                    className="h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                    onChange={(event) => {
                      const nextValues = event.target.checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((item) => item !== option.value);

                      onChange(nextValues.length > 0 ? nextValues : undefined);
                    }}
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </PortalDropdown>
    );
  }

  return (
    <select
      className="h-11 w-full rounded-md border border-[color:var(--color-border)] bg-white px-3.5 text-sm text-stone-900 outline-none transition focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]"
      onChange={(event) => {
        onChange(event.target.value.length > 0 ? event.target.value : undefined);
      }}
      value={getSelectValue(value)}
    >
      <option value="">{filter.placeholder ?? `Todos ${filter.label.toLowerCase()}`}</option>
      {filter.options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

/**
 * Shared filter row for server-driven module tables.
 */
export function DataTableFilters({
  filters,
  onChange,
  onReset,
  values,
}: DataTableFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  const activeFilterCount = filters.filter((filter) => {
    return hasActiveFilterValue(values[filter.id]);
  }).length;

  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
          {activeFilterCount > 0
            ? `${activeFilterCount} filtro${activeFilterCount === 1 ? "" : "s"} activo${activeFilterCount === 1 ? "" : "s"}`
            : "Filtros de vista"}
        </p>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition",
            activeFilterCount > 0
              ? "border-[color:var(--color-border)] bg-white text-stone-700 hover:border-[color:var(--color-border-strong)] hover:text-stone-950"
              : "border-stone-200 bg-stone-100/70 text-stone-400",
          )}
          disabled={activeFilterCount === 0}
          onClick={onReset}
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
          Limpiar filtros
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              {filter.label}
            </label>
            {renderFilterControl({
              filter,
              onChange: (value) => {
                onChange(filter.id, value);
              },
              value: values[filter.id],
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
