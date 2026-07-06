import type {
  ProductionJobPriority,
  ProductionJobStatus,
  ProductionTaskStatus,
  ProductionTaskType,
  QualityCheckStatus,
} from "@/types";

import {
  PRODUCTION_JOB_PRIORITY_LABELS,
  PRODUCTION_JOB_STATUS_LABELS,
  PRODUCTION_TASK_STATUS_LABELS,
  PRODUCTION_TASK_TYPE_LABELS,
  QUALITY_CHECK_STATUS_LABELS,
} from "./constants";

export const formatProductionArea = (value: number): string => {
  return `${value.toFixed(2)} m2`;
};

export const formatProductionPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const getProductionJobStatusBadge = (
  status: ProductionJobStatus,
): {
  className: string;
  label: string;
} => {
  return {
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PRODUCTION_JOB_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PRODUCTION_JOB_STATUS_LABELS.COMPLETED,
    },
    DRAFT: {
      className: "bg-sky-100 text-sky-800",
      label: PRODUCTION_JOB_STATUS_LABELS.DRAFT,
    },
    IN_PROGRESS: {
      className: "bg-amber-100 text-amber-800",
      label: PRODUCTION_JOB_STATUS_LABELS.IN_PROGRESS,
    },
    PAUSED: {
      className: "bg-orange-100 text-orange-800",
      label: PRODUCTION_JOB_STATUS_LABELS.PAUSED,
    },
    READY: {
      className: "bg-violet-100 text-violet-800",
      label: PRODUCTION_JOB_STATUS_LABELS.READY,
    },
  }[status];
};

export const getProductionPriorityBadge = (
  priority: ProductionJobPriority,
): {
  className: string;
  label: string;
} => {
  return {
    HIGH: {
      className: "bg-rose-100 text-rose-800",
      label: PRODUCTION_JOB_PRIORITY_LABELS.HIGH,
    },
    LOW: {
      className: "bg-stone-100 text-stone-700",
      label: PRODUCTION_JOB_PRIORITY_LABELS.LOW,
    },
    NORMAL: {
      className: "bg-blue-100 text-blue-800",
      label: PRODUCTION_JOB_PRIORITY_LABELS.NORMAL,
    },
    URGENT: {
      className: "bg-red-100 text-red-800",
      label: PRODUCTION_JOB_PRIORITY_LABELS.URGENT,
    },
  }[priority];
};

export const getProductionTaskStatusBadge = (
  status: ProductionTaskStatus,
): {
  className: string;
  label: string;
} => {
  return {
    BLOCKED: {
      className: "bg-rose-100 text-rose-800",
      label: PRODUCTION_TASK_STATUS_LABELS.BLOCKED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: PRODUCTION_TASK_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-emerald-100 text-emerald-800",
      label: PRODUCTION_TASK_STATUS_LABELS.COMPLETED,
    },
    IN_PROGRESS: {
      className: "bg-amber-100 text-amber-800",
      label: PRODUCTION_TASK_STATUS_LABELS.IN_PROGRESS,
    },
    PENDING: {
      className: "bg-sky-100 text-sky-800",
      label: PRODUCTION_TASK_STATUS_LABELS.PENDING,
    },
  }[status];
};

export const getProductionTaskTypeLabel = (taskType: ProductionTaskType): string => {
  return PRODUCTION_TASK_TYPE_LABELS[taskType];
};

export const getQualityCheckStatusBadge = (
  status: QualityCheckStatus,
): {
  className: string;
  label: string;
} => {
  return {
    FAILED: {
      className: "bg-rose-100 text-rose-800",
      label: QUALITY_CHECK_STATUS_LABELS.FAILED,
    },
    PASSED: {
      className: "bg-emerald-100 text-emerald-800",
      label: QUALITY_CHECK_STATUS_LABELS.PASSED,
    },
    PENDING: {
      className: "bg-sky-100 text-sky-800",
      label: QUALITY_CHECK_STATUS_LABELS.PENDING,
    },
    REWORK_REQUIRED: {
      className: "bg-orange-100 text-orange-800",
      label: QUALITY_CHECK_STATUS_LABELS.REWORK_REQUIRED,
    },
  }[status];
};
