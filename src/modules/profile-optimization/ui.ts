import type {
  ProfileCuttingBarSource,
  ProfileCuttingPlanStatus,
  ProfileOptimizationMode,
  ProfileOptimizationRunStatus,
} from "@/types";

import {
  PROFILE_CUTTING_PLAN_STATUS_LABELS,
  PROFILE_OPTIMIZATION_MODE_LABELS,
  PROFILE_OPTIMIZATION_RUN_STATUS_LABELS,
} from "./constants";

export const formatProfileLength = (value: number): string => {
  return `${value.toFixed(0)} mm`;
};

export const formatProfileMetersFromMm = (value: number): string => {
  return `${(value / 1000).toFixed(2)} m`;
};

export const formatProfilePercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const getProfileModeLabel = (mode: ProfileOptimizationMode): string => {
  return PROFILE_OPTIMIZATION_MODE_LABELS[mode];
};

export const getProfileRunStatusBadge = (
  status: ProfileOptimizationRunStatus,
): {
  className: string;
  label: string;
} => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PROFILE_OPTIMIZATION_RUN_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PROFILE_OPTIMIZATION_RUN_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-blue-100 text-blue-800",
      label: PROFILE_OPTIMIZATION_RUN_STATUS_LABELS.COMPLETED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: PROFILE_OPTIMIZATION_RUN_STATUS_LABELS.DRAFT,
    },
    FAILED: {
      className: "bg-rose-100 text-rose-800",
      label: PROFILE_OPTIMIZATION_RUN_STATUS_LABELS.FAILED,
    },
    RUNNING: {
      className: "bg-amber-100 text-amber-800",
      label: PROFILE_OPTIMIZATION_RUN_STATUS_LABELS.RUNNING,
    },
  }[status];
};

export const getProfilePlanStatusBadge = (
  status: ProfileCuttingPlanStatus,
): {
  className: string;
  label: string;
} => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PROFILE_CUTTING_PLAN_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PROFILE_CUTTING_PLAN_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-blue-100 text-blue-800",
      label: PROFILE_CUTTING_PLAN_STATUS_LABELS.COMPLETED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: PROFILE_CUTTING_PLAN_STATUS_LABELS.DRAFT,
    },
    SENT_TO_PRODUCTION: {
      className: "bg-violet-100 text-violet-800",
      label: PROFILE_CUTTING_PLAN_STATUS_LABELS.SENT_TO_PRODUCTION,
    },
  }[status];
};

export const getProfileBarSourceLabel = (source: ProfileCuttingBarSource): string => {
  return {
    INVENTORY_BAR: "Barra de inventario",
    PURCHASE_REQUIRED: "Compra requerida",
    REMNANT: "Remanente",
    VIRTUAL: "Barra virtual",
  }[source];
};
