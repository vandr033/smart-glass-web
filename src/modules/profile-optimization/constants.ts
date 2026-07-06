export const PROFILE_OPTIMIZATION_PERMISSIONS = {
  createRemnants: "cutting.create_remnants",
  print: "cutting.print",
  read: "cutting.read",
  run: "cutting.run",
} as const;

export const PROFILE_OPTIMIZATION_ROUTES = {
  home: "/operations/profile-optimization",
  optimizationDetail: (runId: string) => `/operations/profile-optimization/${runId}`,
  optimizations: "/operations/profile-optimization",
  planDetail: (planId: string) => `/operations/profile-cutting-plans/${planId}`,
  planPrint: (planId: string) => `/operations/profile-cutting-plans/${planId}/print`,
  plans: "/operations/profile-cutting-plans",
} as const;

export const PROFILE_OPTIMIZATION_QUERY_KEYS = {
  optimizationDetail: (runId: string) =>
    ["profile-optimization", "optimizations", runId] as const,
  optimizations: (params: unknown) =>
    ["profile-optimization", "optimizations", params] as const,
  planDetail: (planId: string) =>
    ["profile-optimization", "plans", planId] as const,
  plans: (params: unknown) => ["profile-optimization", "plans", params] as const,
  quotationRequirements: (quotationId: string) =>
    ["profile-optimization", "quotation", quotationId, "requirements"] as const,
} as const;

export const PROFILE_OPTIMIZATION_MODE_LABELS = {
  COMMERCIAL_ESTIMATION: "Estimacion comercial",
  OPERATIONAL_EXECUTION: "Ejecucion operativa",
} as const;

export const PROFILE_OPTIMIZATION_RUN_STATUS_LABELS = {
  APPROVED: "Aprobado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  DRAFT: "Borrador",
  FAILED: "Fallido",
  RUNNING: "En ejecucion",
} as const;

export const PROFILE_CUTTING_PLAN_STATUS_LABELS = {
  APPROVED: "Aprobado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  DRAFT: "Borrador",
  SENT_TO_PRODUCTION: "Enviado a produccion",
} as const;
