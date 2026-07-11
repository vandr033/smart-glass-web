import { formatProductionTaskType } from "@/lib/formatters";
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
  boardRead: "produccion.tablero.ver",
  planningRead: "produccion.planificacion.ver",
  planningSchedule: "produccion.planificacion.programar",
  planningReschedule: "produccion.planificacion.reprogramar",
  tasksAssign: "produccion.tareas.asignar",
  tasksExecute: "produccion.tareas.ejecutar",
  tasksComplete: "produccion.tareas.completar",
  priorityUpdate: "produccion.prioridad.actualizar",
  blocksRead: "produccion.bloqueos.ver",
  blocksCreate: "produccion.bloqueos.crear",
  blocksResolve: "produccion.bloqueos.resolver",
  centersRead: "produccion.centros.ver",
  centersConfigure: "produccion.centros.configurar",
  capacityRead: "produccion.capacidad.ver",
  qualityRead: "produccion.calidad.ver",
  qualityApprove: "produccion.calidad.aprobar",
  wasteRead: "produccion.desperdicios.ver",
  wasteCreate: "produccion.desperdicios.registrar",
  export: "produccion.exportar",
} as const;

export const PRODUCTION_ROUTES = {
  home: "/production",
  jobDetail: (jobId: string) => `/production/jobs/${jobId}`,
  jobQuality: (jobId: string) => `/production/jobs/${jobId}/quality`,
  jobTasks: (jobId: string) => `/production/jobs/${jobId}/tasks`,
  jobWaste: (jobId: string) => `/production/jobs/${jobId}/waste`,
  jobs: "/production/jobs",
  orders: "/production/ordenes",
  jobsNew: "/production/jobs/new",
  board: "/production/tablero",
  planning: "/production/planificacion",
  calendar: "/production/calendario",
  workload: "/production/carga-trabajo",
  centers: "/production/centros-trabajo",
  tasks: "/production/tareas",
  blocks: "/production/bloqueos",
  quality: "/production/calidad",
  waste: "/production/desperdicios",
  reports: "/production/reportes",
} as const;

export const PRODUCTION_QUERY_KEYS = {
  jobConsumption: (jobId: string) => ["production", "jobs", jobId, "consumption"] as const,
  jobDetail: (jobId: string) => ["production", "jobs", jobId] as const,
  jobQuality: (jobId: string) => ["production", "jobs", jobId, "quality"] as const,
  jobTasks: (jobId: string) => ["production", "jobs", jobId, "tasks"] as const,
  jobWaste: (jobId: string) => ["production", "jobs", jobId, "waste"] as const,
  jobs: (params: unknown) => ["production", "jobs", params] as const,
  board: (params: unknown) => ["production", "board", params] as const,
  calendar: (params: unknown) => ["production", "calendar", params] as const,
  centers: ["production", "centers"] as const,
  blocks: (status?: string) => ["production", "blocks", status] as const,
} as const;

export const PRODUCTION_JOB_STATUS_LABELS: Record<ProductionJobStatus, string> = {
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  DRAFT: "Borrador",
  IN_PROGRESS: "En proceso",
  PAUSED: "Pausada",
  READY: "Lista para producción",
};

export const PRODUCTION_JOB_PRIORITY_LABELS: Record<ProductionJobPriority, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  LOW: "Baja",
  NORMAL: "Normal",
  URGENT: "Urgente",
};

export const PRODUCTION_TASK_STATUS_LABELS: Record<ProductionTaskStatus, string> = {
  BLOCKED: "Bloqueada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  IN_PROGRESS: "En proceso",
  PAUSED: "Pausada",
  PENDING: "Pendiente",
};

export const PRODUCTION_WORKFLOW_STATUS_LABELS = {
  DRAFT: "Borrador",
  PENDING_PLANNING: "Pendiente de planificación",
  SCHEDULED: "Programada",
  MATERIALS_PREPARATION: "Materiales por preparar",
  READY_TO_START: "Lista para iniciar",
  IN_PROGRESS: "En proceso",
  PAUSED: "Pausada",
  BLOCKED: "Bloqueada",
  PENDING_QUALITY: "Pendiente de control",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
} as const;

export const PRODUCTION_WORK_CENTER_TYPE_LABELS: Record<string, string> = {
  GLASS_CUTTING: "Corte de vidrio",
  POLISHING: "Pulido",
  DRILLING: "Perforado",
  SANDBLASTING: "Arenado",
  LAMINATION: "Laminado",
  EXTERNAL_TEMPERING: "Templado externo",
  ALUMINUM_CUTTING: "Corte de aluminio",
  PROFILE_MACHINING: "Mecanizado de perfiles",
  ASSEMBLY: "Armado",
  SEALING: "Sellado",
  QUALITY_CONTROL: "Control de calidad",
  PACKING: "Empaque",
  DISPATCH_PREPARATION: "Preparación para despacho",
  OTHER: "Otro",
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
  FAILED: "No conforme",
  PASSED: "Conforme",
  PENDING: "Pendiente de control",
  REWORK_REQUIRED: "Requiere corrección",
};

export const PRODUCTION_BLOCK_TYPE_LABELS: Record<string, string> = {
  MATERIAL_SHORTAGE: "Falta de material",
  MEASUREMENT_PENDING: "Medida pendiente",
  MEASUREMENT_REJECTED: "Medida rechazada",
  DRAWING_PENDING: "Plano pendiente",
  APPROVAL_PENDING: "Aprobación pendiente",
  MACHINE_UNAVAILABLE: "Máquina no disponible",
  WORK_CENTER_SATURATED: "Centro saturado",
  QUALITY_INCIDENT: "Incidencia de calidad",
  DEFECTIVE_PART: "Pieza defectuosa",
  EXTERNAL_PROCESS_PENDING: "Proceso externo pendiente",
  STAFF_SHORTAGE: "Falta de personal",
  OTHER: "Otro",
};
