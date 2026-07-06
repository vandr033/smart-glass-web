"use client";

import { Search, X } from "lucide-react";

type DataTableSearchProps = {
  isBusy?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

/**
 * Shared global-search input used by every module table.
 */
export function DataTableSearch({
  isBusy = false,
  onChange,
  placeholder = "Buscar registros",
  value,
}: DataTableSearchProps) {
  return (
    <label className="relative block min-w-[16rem] flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
      <input
        className="h-10 w-full rounded-md border border-[color:var(--color-border)] bg-white pl-11 pr-11 text-sm text-stone-900 outline-none shadow-sm transition placeholder:text-stone-500 focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value ? (
        <button
          aria-label="Limpiar busqueda"
          className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
          onClick={() => {
            onChange("");
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      ) : isBusy ? (
        <span className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blue-500" />
      ) : null}
    </label>
  );
}
