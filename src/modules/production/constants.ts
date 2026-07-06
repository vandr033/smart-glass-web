import { formatProductionTaskType, formatStatusLabel } from "@/lib/formatters";
import type {
  ProductionJobPriority,
  ProductionJobStatus,
  ProductionTaskStatus,
  ProductionTaskType,
  QualityCheckStatus,
} from "@/types";

export const PRODUCTION_PERMISSIONS = {
  complete: "production.complete",
  consumeMaterial: "production.consume_material",
  create: "production.create",
  delete: "production.delete",
  qualityCheck: "production.quality_check",
  read: "production.read",
  reportWaste: "production.report_waste",
  start: "production.start",
  update: "production.update",
  viewCost: "production.view_cost",
} as const;

export const PRODUCTION_ROUTES = {
  home: "/production",
  jobDetail: (jobId: string) => `/production/jobs/${jobId}`,
  jobQuality: (jobId: string) => `/production/jobs/${jobId}/quality`,
  jobTasks: (jobId: string) => `/production/jobs/${jobId}/tasks`,
  jobWaste: (jobId: string) => `/production/jobs/${jobId}/waste`,
  jobs: "/production/jobs",
  jobsNew: "/production/jobs/new",
} as const;

export const PRODUCTION_QUERY_KEYS = {
  jobConsumption: (jobId: string) => ["production", "jobs", jobId, "consumption"] as const,
  jobDetail: (jobId: string) => ["production", "jobs", jobId] as const,
  jobQuality: (jobId: string) => ["production", "jobs", jobId, "quality"] as const,
  jobTasks: (jobId: string) => ["production", "jobs", jobId, "tasks"] as const,
  jobWaste: (jobId: string) => ["production", "jobs", jobId, "waste"] as const,
  jobs: (params: unknown) => ["production", "jobs", params] as const,
} as const;

export const PRODUCTION_JOB_STATUS_LABELS: Record<ProductionJobStatus, string> = {
  CANCELLED: formatStatusLabel("CANCELLED"),
  COMPLETED: formatStatusLabel("COMPLETED"),
  DRAFT: formatStatusLabel("DRAFT"),
  IN_PROGRESS: formatStatusLabel("IN_PROGRESS"),
  PAUSED: formatStatusLabel("PAUSED"),
  READY: formatStatusLabel("READY"),
};

export const PRODUCTION_JOB_PRIORITY_LABELS: Record<ProductionJobPriority, string> = {
  HIGH: "Alta",
  LOW: "Baja",
  NORMAL: "Normal",
  URGENT: "Urgente",
};

export const PRODUCTION_TASK_STATUS_LABELS: Record<ProductionTaskStatus, string> = {
  BLOCKED: formatStatusLabel("BLOCKED"),
  CANCELLED: formatStatusLabel("CANCELLED"),
  COMPLETED: formatStatusLabel("COMPLETED"),
  IN_PROGRESS: formatStatusLabel("IN_PROGRESS"),
  PENDING: formatStatusLabel("PENDING"),
};

export const PRODUCTION_TASK_TYPE_LABELS: Record<ProductionTaskType, string> = {
  ASSEMBLE: formatProductionTaskType("ASSEMBLE"),
  CUT_GLASS: formatProductionTaskType("CUT_GLASS"),
  CUT_PROFILE: formatProductionTaskType("CUT_PROFILE"),
  MEASURE: formatProductionTaskType("MEASURE"),
  OTHER: formatProductionTaskType("OTHER"),
  PACK: formatProductionTaskType("PACK"),
  QUALITY_CHECK: formatProductionTaskType("QUALITY_CHECK"),
};

export const QUALITY_CHECK_STATUS_LABELS: Record<QualityCheckStatus, string> = {
  FAILED: formatStatusLabel("FAILED"),
  PASSED: formatStatusLabel("PASSED"),
  PENDING: formatStatusLabel("PENDING"),
  REWORK_REQUIRED: formatStatusLabel("REWORK_REQUIRED"),
};
