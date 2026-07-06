"use client";

import { cn } from "@/utils";
import type {
  PriceListImportStatus,
  PriceListRowMappingStatus,
  PriceListRowValidationStatus,
} from "@/types";

import {
  PRICE_LIST_ROW_MAPPING_LABELS,
  PRICE_LIST_ROW_VALIDATION_LABELS,
  PRICE_LIST_STATUS_LABELS,
} from "./constants";

const badgeClassName =
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]";

export function PriceListStatusBadge({
  status,
}: {
  status: PriceListImportStatus;
}) {
  return (
    <span
      className={cn(
        badgeClassName,
        status === "APPROVED" && "bg-emerald-100 text-emerald-800",
        status === "VALIDATED" && "bg-sky-100 text-sky-800",
        status === "NEEDS_MAPPING" && "bg-amber-100 text-amber-900",
        status === "PARSED" && "bg-indigo-100 text-indigo-800",
        status === "REJECTED" && "bg-rose-100 text-rose-800",
        status === "FAILED" && "bg-rose-100 text-rose-800",
        status === "UPLOADED" && "bg-stone-200 text-stone-700",
      )}
    >
      {PRICE_LIST_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PriceListRowMappingBadge({
  status,
}: {
  status: PriceListRowMappingStatus;
}) {
  return (
    <span
      className={cn(
        badgeClassName,
        status === "AUTO_MAPPED" && "bg-sky-100 text-sky-800",
        status === "MANUAL_MAPPED" && "bg-indigo-100 text-indigo-800",
        status === "UNMAPPED" && "bg-amber-100 text-amber-900",
        status === "IGNORED" && "bg-stone-200 text-stone-700",
        status === "ERROR" && "bg-rose-100 text-rose-800",
      )}
    >
      {PRICE_LIST_ROW_MAPPING_LABELS[status] ?? status}
    </span>
  );
}

export function PriceListRowValidationBadge({
  status,
}: {
  status: PriceListRowValidationStatus;
}) {
  return (
    <span
      className={cn(
        badgeClassName,
        status === "VALID" && "bg-emerald-100 text-emerald-800",
        status === "PENDING" && "bg-stone-200 text-stone-700",
        status === "INVALID" && "bg-rose-100 text-rose-800",
      )}
    >
      {PRICE_LIST_ROW_VALIDATION_LABELS[status] ?? status}
    </span>
  );
}
