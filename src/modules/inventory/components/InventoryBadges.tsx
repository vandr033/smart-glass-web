"use client";

import type {
  DamagedMaterialStatus,
  DamageSeverity,
  InventoryCondition,
  InventoryReservationStatus,
  InventoryReservationType,
  InventoryStockType,
  RemnantPieceStatus,
  WarehouseStatus,
} from "@/types";

import {
  DAMAGED_STATUS_LABELS,
  DAMAGE_SEVERITY_LABELS,
  INVENTORY_CONDITION_BADGES,
  INVENTORY_CONDITION_LABELS,
  INVENTORY_RESERVATION_STATUS_LABELS,
  INVENTORY_RESERVATION_TYPE_LABELS,
  INVENTORY_STOCK_TYPE_BADGES,
  INVENTORY_STOCK_TYPE_LABELS,
  REMNANT_STATUS_LABELS,
  WAREHOUSE_STATUS_LABELS,
} from "../constants";

const pillClassName =
  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight";

export function WarehouseStatusBadge({ value }: { value: WarehouseStatus }) {
  return (
    <span
      className={`${pillClassName} ${
        value === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
      }`}
    >
      {WAREHOUSE_STATUS_LABELS[value]}
    </span>
  );
}

export function InventoryStockTypeBadge({ value }: { value: InventoryStockType }) {
  return (
    <span className={`${pillClassName} ${INVENTORY_STOCK_TYPE_BADGES[value]}`}>
      {INVENTORY_STOCK_TYPE_LABELS[value]}
    </span>
  );
}

export function InventoryConditionBadge({ value }: { value: InventoryCondition }) {
  return (
    <span className={`${pillClassName} ${INVENTORY_CONDITION_BADGES[value]}`}>
      {INVENTORY_CONDITION_LABELS[value]}
    </span>
  );
}

export function InventoryReservationTypeBadge({
  value,
}: {
  value: InventoryReservationType;
}) {
  return (
    <span
      className={`${pillClassName} ${
        value === "FIRM" ? "bg-cyan-100 text-cyan-800" : "bg-amber-100 text-amber-800"
      }`}
    >
      {INVENTORY_RESERVATION_TYPE_LABELS[value]}
    </span>
  );
}

export function InventoryReservationStatusBadge({
  value,
}: {
  value: InventoryReservationStatus;
}) {
  const badgeClassName =
    value === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800"
      : value === "CONSUMED"
        ? "bg-blue-100 text-blue-900"
        : value === "RELEASED"
          ? "bg-stone-200 text-stone-700"
          : value === "EXPIRED"
            ? "bg-amber-100 text-amber-800"
            : "bg-rose-100 text-rose-800";

  return (
    <span className={`${pillClassName} ${badgeClassName}`}>
      {INVENTORY_RESERVATION_STATUS_LABELS[value]}
    </span>
  );
}

export function RemnantStatusBadge({ value }: { value: RemnantPieceStatus }) {
  const badgeClassName =
    value === "AVAILABLE"
      ? "bg-emerald-100 text-emerald-800"
      : value === "RESERVED"
        ? "bg-cyan-100 text-cyan-800"
        : value === "CONSUMED"
          ? "bg-stone-200 text-stone-700"
          : "bg-rose-100 text-rose-800";

  return (
    <span className={`${pillClassName} ${badgeClassName}`}>
      {REMNANT_STATUS_LABELS[value]}
    </span>
  );
}

export function DamageSeverityBadge({ value }: { value: DamageSeverity }) {
  const badgeClassName =
    value === "TOTAL_LOSS"
      ? "bg-rose-100 text-rose-800"
      : value === "HIGH"
        ? "bg-amber-100 text-amber-800"
        : value === "MEDIUM"
          ? "bg-blue-100 text-blue-900"
          : "bg-emerald-100 text-emerald-800";

  return (
    <span className={`${pillClassName} ${badgeClassName}`}>
      {DAMAGE_SEVERITY_LABELS[value]}
    </span>
  );
}

export function DamagedStatusBadge({ value }: { value: DamagedMaterialStatus }) {
  const badgeClassName =
    value === "REPORTED"
      ? "bg-rose-100 text-rose-800"
      : value === "REVIEWED"
        ? "bg-amber-100 text-amber-800"
        : value === "REUSABLE"
          ? "bg-emerald-100 text-emerald-800"
          : value === "SCRAPPED"
            ? "bg-stone-200 text-stone-700"
            : "bg-blue-100 text-blue-900";

  return (
    <span className={`${pillClassName} ${badgeClassName}`}>
      {DAMAGED_STATUS_LABELS[value]}
    </span>
  );
}
