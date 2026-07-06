import { formatMaterialBehaviorType, formatStatusLabel } from "@/lib/formatters";
import type {
  MaterialStatus,
  MaterialType,
  SupplierMaterialEquivalenceConfidence,
  SupplierMaterialEquivalenceStatus,
} from "@/types";

import {
  MATERIAL_STATUS_BADGE_CLASS_NAMES,
  MATERIAL_TYPE_BADGE_CLASS_NAMES,
  SUPPLIER_MATERIAL_CONFIDENCE_BADGE_CLASS_NAMES,
  SUPPLIER_MATERIAL_STATUS_BADGE_CLASS_NAMES,
} from "../constants";

const baseBadgeClassName =
  "inline-flex rounded-md px-3 py-1 text-xs font-semibold";

export function MaterialTypeBadge({ value }: { value: MaterialType }) {
  return (
    <span className={`${baseBadgeClassName} ${MATERIAL_TYPE_BADGE_CLASS_NAMES[value]}`}>
      {formatMaterialBehaviorType(value)}
    </span>
  );
}

export function MaterialStatusBadge({ value }: { value: MaterialStatus }) {
  return (
    <span className={`${baseBadgeClassName} ${MATERIAL_STATUS_BADGE_CLASS_NAMES[value]}`}>
      {formatStatusLabel(value)}
    </span>
  );
}

export function BooleanBadge({
  falseLabel = "No",
  falseTone = "bg-stone-200 text-stone-700",
  trueLabel = "Si",
  trueTone = "bg-emerald-100 text-emerald-800",
  value,
}: {
  falseLabel?: string;
  falseTone?: string;
  trueLabel?: string;
  trueTone?: string;
  value: boolean;
}) {
  return (
    <span className={`${baseBadgeClassName} ${value ? trueTone : falseTone}`}>
      {value ? trueLabel : falseLabel}
    </span>
  );
}

export function SupplierMaterialConfidenceBadge({
  value,
}: {
  value: SupplierMaterialEquivalenceConfidence;
}) {
  return (
    <span
      className={`${baseBadgeClassName} ${SUPPLIER_MATERIAL_CONFIDENCE_BADGE_CLASS_NAMES[value]}`}
    >
      {formatStatusLabel(value)}
    </span>
  );
}

export function SupplierMaterialStatusBadge({
  value,
}: {
  value: SupplierMaterialEquivalenceStatus;
}) {
  return (
    <span
      className={`${baseBadgeClassName} ${SUPPLIER_MATERIAL_STATUS_BADGE_CLASS_NAMES[value]}`}
    >
      {formatStatusLabel(value)}
    </span>
  );
}
