import {
  formatDateOnlyValue,
  formatDateValue,
  formatDimensionMeters,
  formatDimensionMm,
} from "@/lib/formatters";

export const sectionClassName =
  "rounded-md border border-[color:var(--color-border)] bg-white p-5 shadow-sm sm:p-6";

export const tableWrapperClassName =
  "overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white shadow-sm";

export const fieldClassName =
  "h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 text-sm text-[color:var(--color-text)] outline-none transition focus:border-[color:var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[color:var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-70";

export const textAreaClassName =
  "min-h-28 w-full rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-3 text-sm text-[color:var(--color-text)] outline-none transition focus:border-[color:var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[color:var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-70";

export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] shadow-sm transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)] shadow-sm transition hover:border-[color:var(--color-border-strong)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-error)] bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] shadow-sm transition hover:bg-[color:var(--color-error-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export const badgeBaseClassName =
  "inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold";

export {
  formatDateOnlyValue,
  formatDateValue,
  formatDimensionMeters,
  formatDimensionMm,
};
