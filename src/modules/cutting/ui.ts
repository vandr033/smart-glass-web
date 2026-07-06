import type {
  CuttingOptimizationMode,
  CuttingOptimizationRunStatus,
  CuttingPlanSheetSource,
  CuttingPlanStatus,
} from "@/types";

import {
  CUTTING_MODE_LABELS,
  CUTTING_PLAN_STATUS_LABELS,
  CUTTING_RUN_STATUS_LABELS,
} from "./constants";

export const formatCuttingArea = (value: number): string => {
  return `${value.toFixed(2)} m2`;
};

export const formatCuttingDimension = (value: number): string => {
  return `${value.toFixed(0)} mm`;
};

export const formatCuttingPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const getCuttingModeLabel = (mode: CuttingOptimizationMode): string => {
  return CUTTING_MODE_LABELS[mode];
};

export const getCuttingRunStatusBadge = (
  status: CuttingOptimizationRunStatus,
): {
  className: string;
  label: string;
} => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: CUTTING_RUN_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: CUTTING_RUN_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-blue-100 text-blue-800",
      label: CUTTING_RUN_STATUS_LABELS.COMPLETED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: CUTTING_RUN_STATUS_LABELS.DRAFT,
    },
    FAILED: {
      className: "bg-rose-100 text-rose-800",
      label: CUTTING_RUN_STATUS_LABELS.FAILED,
    },
    RUNNING: {
      className: "bg-amber-100 text-amber-800",
      label: CUTTING_RUN_STATUS_LABELS.RUNNING,
    },
  }[status];
};

export const getCuttingPlanStatusBadge = (
  status: CuttingPlanStatus,
): {
  className: string;
  label: string;
} => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: CUTTING_PLAN_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: CUTTING_PLAN_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-blue-100 text-blue-800",
      label: CUTTING_PLAN_STATUS_LABELS.COMPLETED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: CUTTING_PLAN_STATUS_LABELS.DRAFT,
    },
    SENT_TO_PRODUCTION: {
      className: "bg-violet-100 text-violet-800",
      label: CUTTING_PLAN_STATUS_LABELS.SENT_TO_PRODUCTION,
    },
  }[status];
};

export const getSheetSourceLabel = (source: CuttingPlanSheetSource): string => {
  return {
    INVENTORY_SHEET: "Inventory Sheet",
    PURCHASE_REQUIRED: "Purchase Required",
    REMNANT: "Remnant",
    VIRTUAL: "Virtual",
  }[source];
};
