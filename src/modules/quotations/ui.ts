import type { QuotationStatus } from "@/types";

import {
  QUOTATION_STATUS_BADGE_CLASS_NAMES,
  QUOTATION_STATUS_LABELS,
} from "./constants";

export const formatQuotationCurrency = (
  amount: number | null,
  currency = "BOB",
): string => {
  if (amount === null) {
    return "Restringido";
  }

  return new Intl.NumberFormat("es-BO", {
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(amount);
};

export const formatQuotationPercent = (value: number | null): string => {
  if (value === null) {
    return "Restringido";
  }

  return `${value.toFixed(2)}%`;
};

export const formatQuotationDate = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export const formatQuotationDateTime = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getQuotationStatusBadge = (status: QuotationStatus) => ({
  className: QUOTATION_STATUS_BADGE_CLASS_NAMES[status],
  label: QUOTATION_STATUS_LABELS[status],
});
