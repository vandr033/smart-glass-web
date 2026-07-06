export const CUTTING_PERMISSIONS = {
  approve: "cutting.approve",
  createRemnants: "cutting.create_remnants",
  print: "cutting.print",
  read: "cutting.read",
  run: "cutting.run",
} as const;

export const CUTTING_ROUTES = {
  home: "/cutting",
  optimizationDetail: (runId: string) => `/cutting/optimizations/${runId}`,
  optimizations: "/cutting/optimizations",
  planDetail: (planId: string) => `/cutting/plans/${planId}`,
  planPrint: (planId: string) => `/cutting/plans/${planId}/print`,
  plans: "/cutting/plans",
} as const;

export const CUTTING_QUERY_KEYS = {
  optimizationDetail: (runId: string) => ["cutting", "optimizations", runId] as const,
  optimizations: (params: unknown) => ["cutting", "optimizations", params] as const,
  planDetail: (planId: string) => ["cutting", "plans", planId] as const,
  plans: (params: unknown) => ["cutting", "plans", params] as const,
  quotationRequirements: (quotationId: string) =>
    ["cutting", "quotation", quotationId, "requirements"] as const,
} as const;

export const CUTTING_MODE_LABELS = {
  COMMERCIAL_ESTIMATION: "Commercial Estimation",
  OPERATIONAL_PURCHASE: "Operational Purchase",
} as const;

export const CUTTING_RUN_STATUS_LABELS = {
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  DRAFT: "Draft",
  FAILED: "Failed",
  RUNNING: "Running",
} as const;

export const CUTTING_PLAN_STATUS_LABELS = {
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  DRAFT: "Draft",
  SENT_TO_PRODUCTION: "Sent to Production",
} as const;
