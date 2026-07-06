import { formatStatusLabel } from "@/lib/formatters";
import type {
  InstallationCalendarView,
  InstallationEvidenceType,
  InstallationIssueSeverity,
  InstallationIssueStatus,
  InstallationIssueType,
  InstallationOrderStatus,
  InstallationPriority,
  InstallationTaskStatus,
  InstallationTeamStatus,
} from "@/types";

export const INSTALLATION_PERMISSIONS = {
  assign: "installations.assign",
  cancel: "installations.cancel",
  complete: "installations.complete",
  create: "installations.create",
  execute: "installations.execute",
  export: "installations.export",
  schedule: "installations.schedule",
  update: "installations.update",
  view: "installations.view",
} as const;

export const INSTALLATION_ROUTES = {
  detail: (orderId: string) => `/admin/installation/${orderId}`,
  home: "/admin/installation",
} as const;

export const INSTALLATION_QUERY_KEYS = {
  calendar: (params: unknown) => ["installations", "calendar", params] as const,
  order: (orderId: string) => ["installations", "orders", orderId] as const,
  orders: (params: unknown) => ["installations", "orders", params] as const,
  teams: ["installations", "teams"] as const,
} as const;

export const INSTALLATION_STATUS_LABELS: Record<InstallationOrderStatus, string> = {
  CANCELLED: formatStatusLabel("CANCELLED"),
  COMPLETED: formatStatusLabel("COMPLETED"),
  EN_ROUTE: formatStatusLabel("EN_ROUTE"),
  IN_INSTALLATION: formatStatusLabel("IN_INSTALLATION"),
  PAUSED: formatStatusLabel("PAUSED"),
  RESCHEDULED: formatStatusLabel("RESCHEDULED"),
  SCHEDULED: formatStatusLabel("SCHEDULED"),
  WITH_OBSERVATIONS: formatStatusLabel("WITH_OBSERVATIONS"),
};

export const INSTALLATION_PRIORITY_LABELS: Record<InstallationPriority, string> = {
  HIGH: "Alta",
  LOW: "Baja",
  NORMAL: "Normal",
  URGENT: "Urgente",
};

export const INSTALLATION_TASK_STATUS_LABELS: Record<InstallationTaskStatus, string> = {
  BLOCKED: formatStatusLabel("BLOCKED"),
  CANCELLED: formatStatusLabel("CANCELLED"),
  COMPLETED: formatStatusLabel("COMPLETED"),
  IN_PROGRESS: formatStatusLabel("IN_PROGRESS"),
  PENDING: formatStatusLabel("PENDING"),
};

export const INSTALLATION_EVIDENCE_TYPE_LABELS: Record<InstallationEvidenceType, string> = {
  CHECKLIST: "Lista de verificacion",
  FILE: "Archivo",
  OTHER: "Otro",
  PHOTO: "Foto",
  SIGNATURE: "Firma",
};

export const INSTALLATION_ISSUE_TYPE_LABELS: Record<InstallationIssueType, string> = {
  ACCESS: "Acceso",
  CLIENT: "Cliente",
  MATERIAL: "Material",
  OTHER: "Otro",
  SAFETY: "Seguridad",
  TECHNICAL: "Tecnica",
  WEATHER: "Clima",
};

export const INSTALLATION_ISSUE_SEVERITY_LABELS: Record<
  InstallationIssueSeverity,
  string
> = {
  CRITICAL: "Critica",
  HIGH: "Alta",
  LOW: "Baja",
  MEDIUM: "Media",
};

export const INSTALLATION_ISSUE_STATUS_LABELS: Record<InstallationIssueStatus, string> = {
  CLOSED: formatStatusLabel("CLOSED"),
  IN_PROGRESS: formatStatusLabel("IN_PROGRESS"),
  OPEN: formatStatusLabel("OPEN"),
  RESOLVED: formatStatusLabel("RESOLVED"),
};

export const INSTALLATION_TEAM_STATUS_LABELS: Record<InstallationTeamStatus, string> = {
  ACTIVE: formatStatusLabel("ACTIVE"),
  INACTIVE: formatStatusLabel("INACTIVE"),
};

export const INSTALLATION_CALENDAR_VIEW_LABELS: Record<InstallationCalendarView, string> = {
  day: "Dia",
  month: "Mes",
  week: "Semana",
};

export const INSTALLATION_TYPE_OPTIONS = [
  { label: "Estandar", value: "ESTANDAR" },
  { label: "Garantia", value: "GARANTIA" },
  { label: "Mantenimiento", value: "MANTENIMIENTO" },
  { label: "Reparacion", value: "REPARACION" },
  { label: "Visita tecnica", value: "VISITA_TECNICA" },
] as const;

export const INSTALLATION_TEAM_ROLE_OPTIONS = [
  "SUPERVISOR",
  "LIDER",
  "TECNICO",
  "APOYO",
  "CHOFER",
] as const;

export const INSTALLATION_TEAM_ROLE_LABELS: Record<
  (typeof INSTALLATION_TEAM_ROLE_OPTIONS)[number],
  string
> = {
  APOYO: "Apoyo",
  CHOFER: "Chofer",
  LIDER: "Lider",
  SUPERVISOR: "Supervisor",
  TECNICO: "Tecnico",
};

export const INSTALLATION_LABELS = {
  buttons: {
    assign: "Asignar",
    complete: "Completar instalacion",
    createOrder: "Registrar instalacion",
    createTeam: "Crear cuadrilla",
    execute: "Iniciar ejecucion",
    refresh: "Actualizar",
    reportIssue: "Registrar observacion",
    reschedule: "Reprogramar",
    save: "Guardar cambios",
    uploadEvidence: "Subir evidencia",
  },
  emptyStates: {
    calendarDescription:
      "Ajusta filtros o programa nuevas instalaciones para poblar la agenda.",
    calendarTitle: "Sin instalaciones en el rango seleccionado",
    issuesDescription: "Todavia no se registraron observaciones ni incidencias.",
    issuesTitle: "Sin observaciones",
    tableDescription:
      "Crea una orden desde un proyecto o una cotizacion para comenzar la coordinacion.",
    tableTitle: "No hay ordenes de instalacion",
  },
  exports: {
    completion: "Acta de instalacion completada",
    internal: "Reporte interno de instalacion",
    order: "Orden de instalacion",
    schedule: "Cronograma de instalaciones",
  },
  filters: {
    client: "Cliente",
    dateFrom: "Desde",
    dateTo: "Hasta",
    project: "Proyecto",
    search: "Buscar",
    status: "Estado",
    team: "Cuadrilla",
  },
  notifications: {
    conflict: "Se detecto un conflicto de agenda.",
    noEnglish: "Todos los textos del modulo deben mantenerse en espanol.",
  },
  page: {
    description:
      "Programa cuadrillas, valida preparacion de proyecto, ejecuta en campo y cierra instalaciones con evidencia y observaciones.",
    eyebrow: "Operacion en campo",
    title: "Instalaciones",
  },
} as const;

export const INSTALLATION_STATUS_OPTIONS = Object.entries(INSTALLATION_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as InstallationOrderStatus,
  }),
);

export const INSTALLATION_PRIORITY_OPTIONS = Object.entries(INSTALLATION_PRIORITY_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as InstallationPriority,
  }),
);

export const INSTALLATION_TASK_STATUS_OPTIONS = Object.entries(
  INSTALLATION_TASK_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as InstallationTaskStatus,
}));

export const INSTALLATION_EVIDENCE_TYPE_OPTIONS = Object.entries(
  INSTALLATION_EVIDENCE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as InstallationEvidenceType,
}));

export const INSTALLATION_ISSUE_TYPE_OPTIONS = Object.entries(
  INSTALLATION_ISSUE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as InstallationIssueType,
}));

export const INSTALLATION_ISSUE_SEVERITY_OPTIONS = Object.entries(
  INSTALLATION_ISSUE_SEVERITY_LABELS,
).map(([value, label]) => ({
  label,
  value: value as InstallationIssueSeverity,
}));

export const INSTALLATION_ISSUE_STATUS_OPTIONS = Object.entries(
  INSTALLATION_ISSUE_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as InstallationIssueStatus,
}));

export const INSTALLATION_TEAM_STATUS_OPTIONS = Object.entries(
  INSTALLATION_TEAM_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as InstallationTeamStatus,
}));
