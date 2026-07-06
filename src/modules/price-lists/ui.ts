export const sectionClassName =
  "rounded-md border border-[color:var(--color-border)] bg-white p-5 shadow-sm sm:p-6";

export const tableWrapperClassName =
  "overflow-hidden rounded-md border border-[color:var(--color-border)] bg-white shadow-sm";

export const fieldClassName =
  "h-10 w-full rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 text-sm text-[color:var(--color-text)] outline-none transition focus:border-[color:var(--color-primary)] focus:bg-white focus:ring-2 focus:ring-[color:var(--color-primary-soft)]";

export const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-primary)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] shadow-sm transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--color-text)] shadow-sm transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60";

export const warningButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-warning)] bg-[var(--color-warning)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClassName =
  "inline-flex items-center justify-center rounded-md border border-[color:var(--color-error)] bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] shadow-sm transition hover:bg-[color:var(--color-error-hover)] disabled:cursor-not-allowed disabled:opacity-60";

export const formatDateValue = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatCurrencyValue = (
  amount: number | null,
  currency = "BOB",
): string => {
  if (amount === null) {
    return "No disponible";
  }

  return new Intl.NumberFormat("es-BO", {
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount);
};
