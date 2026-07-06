import type {
  LogJsonValue,
  PurchaseOrderStatus,
  PurchaseRequestItemStatus,
  PurchaseRequestSourceType,
  PurchaseRequestStatus,
  PurchasingComparisonResult,
  PurchasingComparisonStrategy,
  PurchasingSelectedCombination,
  SupplierComparisonStatus,
} from "@/types";

import {
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_REQUEST_ITEM_STATUS_LABELS,
  PURCHASE_REQUEST_SOURCE_LABELS,
  PURCHASE_REQUEST_STATUS_LABELS,
  SUPPLIER_COMPARISON_STATUS_LABELS,
} from "./constants";

export const formatPurchasingCurrency = (
  value: number | null,
  currency = "BOB",
): string => {
  if (value === null) {
    return "Restringido";
  }

  return new Intl.NumberFormat("es-BO", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
};

export const formatPurchasingNumber = (value: number): string => {
  return new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 4,
  }).format(value);
};

export const formatPurchasingPercent = (value: number | null): string => {
  if (value === null) {
    return "Sin puntaje";
  }

  return `${value.toFixed(2)}%`;
};

export const formatPurchasingQuantity = (value: number, unit: string): string => {
  return `${formatPurchasingNumber(value)} ${unit}`;
};

export const getPurchaseRequestStatusBadge = (
  status: PurchaseRequestStatus,
): {
  className: string;
  label: string;
} => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PURCHASE_REQUEST_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PURCHASE_REQUEST_STATUS_LABELS.CANCELLED,
    },
    CONVERTED_TO_PO: {
      className: "bg-blue-100 text-blue-800",
      label: PURCHASE_REQUEST_STATUS_LABELS.CONVERTED_TO_PO,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: PURCHASE_REQUEST_STATUS_LABELS.DRAFT,
    },
    PENDING_APPROVAL: {
      className: "bg-amber-100 text-amber-800",
      label: PURCHASE_REQUEST_STATUS_LABELS.PENDING_APPROVAL,
    },
    REJECTED: {
      className: "bg-rose-100 text-rose-800",
      label: PURCHASE_REQUEST_STATUS_LABELS.REJECTED,
    },
  }[status];
};

export const getPurchaseRequestItemStatusBadge = (
  status: PurchaseRequestItemStatus,
): {
  className: string;
  label: string;
} => {
  return {
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PURCHASE_REQUEST_ITEM_STATUS_LABELS.CANCELLED,
    },
    OPEN: {
      className: "bg-sky-100 text-sky-800",
      label: PURCHASE_REQUEST_ITEM_STATUS_LABELS.OPEN,
    },
    ORDERED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PURCHASE_REQUEST_ITEM_STATUS_LABELS.ORDERED,
    },
    SUPPLIER_SELECTED: {
      className: "bg-violet-100 text-violet-800",
      label: PURCHASE_REQUEST_ITEM_STATUS_LABELS.SUPPLIER_SELECTED,
    },
  }[status];
};

export const getSupplierComparisonStatusBadge = (
  status: SupplierComparisonStatus,
): {
  className: string;
  label: string;
} => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: SUPPLIER_COMPARISON_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: SUPPLIER_COMPARISON_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-blue-100 text-blue-800",
      label: SUPPLIER_COMPARISON_STATUS_LABELS.COMPLETED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: SUPPLIER_COMPARISON_STATUS_LABELS.DRAFT,
    },
  }[status];
};

export const getPurchaseOrderStatusBadge = (
  status: PurchaseOrderStatus,
): {
  className: string;
  label: string;
} => {
  return {
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PURCHASE_ORDER_STATUS_LABELS.CANCELLED,
    },
    CONFIRMED: {
      className: "bg-blue-100 text-blue-800",
      label: PURCHASE_ORDER_STATUS_LABELS.CONFIRMED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: PURCHASE_ORDER_STATUS_LABELS.DRAFT,
    },
    PARTIALLY_RECEIVED: {
      className: "bg-amber-100 text-amber-800",
      label: PURCHASE_ORDER_STATUS_LABELS.PARTIALLY_RECEIVED,
    },
    RECEIVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PURCHASE_ORDER_STATUS_LABELS.RECEIVED,
    },
    SENT: {
      className: "bg-violet-100 text-violet-800",
      label: PURCHASE_ORDER_STATUS_LABELS.SENT,
    },
  }[status];
};

export const getPurchaseRequestSourceLabel = (
  sourceType: PurchaseRequestSourceType,
): string => {
  return PURCHASE_REQUEST_SOURCE_LABELS[sourceType];
};

export const getComparisonStrategyLabel = (
  strategy: PurchasingComparisonStrategy,
): string => {
  return {
    best_weighted_score_per_item: "Mejor puntaje ponderado por item",
    single_supplier: "Proveedor unico",
  }[strategy];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
};

export const parseComparisonResult = (
  value: PurchasingComparisonResult | LogJsonValue | null,
): PurchasingComparisonResult | null => {
  if (!isRecord(value)) {
    return null;
  }

  const bestPricePerItem = isRecord(value.bestPricePerItem)
    ? Object.fromEntries(
        Object.entries(value.bestPricePerItem).map(([key, entry]) => [
          key,
          typeof entry === "string" || entry === null ? entry : null,
        ]),
      )
    : {};
  const bestWeightedScorePerItem = isRecord(value.bestWeightedScorePerItem)
    ? Object.fromEntries(
        Object.entries(value.bestWeightedScorePerItem).map(([key, entry]) => [
          key,
          typeof entry === "string" || entry === null ? entry : null,
        ]),
      )
    : {};
  const singleSupplierOptions = Array.isArray(value.singleSupplierOptions)
    ? value.singleSupplierOptions
        .map((entry) => {
          if (!isRecord(entry) || typeof entry.supplierId !== "string") {
            return null;
          }

          return {
            averageScore:
              typeof entry.averageScore === "number" ? entry.averageScore : 0,
            supplierId: entry.supplierId,
            totalPrice: typeof entry.totalPrice === "number" ? entry.totalPrice : null,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  return {
    bestPricePerItem,
    bestWeightedScorePerItem,
    selectedStrategy:
      value.selectedStrategy === "single_supplier"
        ? "single_supplier"
        : "best_weighted_score_per_item",
    singleSupplierOptions,
    warnings: toStringArray(value.warnings),
  };
};

export const parseSelectedCombination = (
  value: PurchasingSelectedCombination | LogJsonValue | null,
): PurchasingSelectedCombination | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    selectedOptionIds: toStringArray(value.selectedOptionIds),
    selectedStrategy:
      value.selectedStrategy === "single_supplier"
        ? "single_supplier"
        : "best_weighted_score_per_item",
    supplierIds: toStringArray(value.supplierIds),
  };
};
