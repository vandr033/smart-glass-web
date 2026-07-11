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
  COMMERCIAL_ESTIMATION: "Estimación comercial",
  OPERATIONAL_PURCHASE: "Compra operativa",
} as const;

export const CUTTING_RUN_STATUS_LABELS = {
  APPROVED: "Aprobado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  DRAFT: "Borrador",
  FAILED: "Fallido",
  RUNNING: "En ejecución",
} as const;

export const CUTTING_PLAN_STATUS_LABELS = {
  APPROVED: "Aprobado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  DRAFT: "Borrador",
  SENT_TO_PRODUCTION: "Enviado a producción",
} as const;
