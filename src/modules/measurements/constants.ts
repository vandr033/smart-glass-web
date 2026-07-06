import type {
  MeasurementCalendarView,
  MeasurementElementType,
  MeasurementEvidenceType,
  MeasurementOpeningStatus,
  MeasurementRequestStatus,
  MeasurementVisitResult,
  MeasurementVisitStatus,
  TechnicalObservationSeverity,
  TechnicalObservationStatus,
  TechnicalObservationType,
} from "@/types";

export const MEASUREMENTS_PERMISSIONS = {
  approve: "mediciones.aprobar",
  assign: "mediciones.asignar",
  create: "mediciones.crear",
  execute: "mediciones.ejecutar",
  export: "mediciones.exportar",
  reject: "mediciones.rechazar",
  schedule: "mediciones.programar",
  update: "mediciones.actualizar",
  view: "mediciones.ver",
} as const;

export const MEASUREMENTS_ROUTES = {
  detail: (requestId: string) => `/admin/mediciones/${requestId}`,
  home: "/admin/mediciones",
} as const;

export const MEASUREMENTS_QUERY_KEYS = {
  calendar: (params: unknown) => ["measurements", "calendar", params] as const,
  detail: (requestId: string) => ["measurements", "detail", requestId] as const,
  requests: (params: unknown) => ["measurements", "requests", params] as const,
} as const;

export const MEASUREMENT_STATUS_LABELS: Record<MeasurementRequestStatus, string> = {
  APPROVED: "Aprobada",
  CANCELLED: "Cancelada",
  IN_VISIT: "En visita",
  PENDING_APPROVAL: "Pendiente de aprobacion",
  REGISTERED: "Medicion registrada",
  REJECTED: "Rechazada",
  REQUESTED: "Solicitada",
  RESCHEDULED: "Reprogramada",
  SCHEDULED: "Programada",
  WITH_OBSERVATIONS: "Con observaciones",
};

export const MEASUREMENT_VISIT_STATUS_LABELS: Record<MeasurementVisitStatus, string> = {
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  IN_PROGRESS: "En visita",
  SCHEDULED: "Programada",
};

export const MEASUREMENT_VISIT_RESULT_LABELS: Record<MeasurementVisitResult, string> = {
  APPROVED: "Aprobada",
  PENDING: "Pendiente",
  READY_FOR_APPROVAL: "Lista para aprobacion",
  REJECTED: "Rechazada",
  REQUIRES_REVISIT: "Requiere nueva visita",
};

export const MEASUREMENT_ELEMENT_LABELS: Record<MeasurementElementType, string> = {
  COVER: "Cubierta",
  DIVISION: "Division",
  DOOR: "Puerta",
  MIRROR: "Espejo",
  OTHER: "Otro",
  RAILING: "Baranda",
  SHOWER: "Mampara",
  WINDOW: "Ventana",
};

export const MEASUREMENT_OPENING_STATUS_LABELS: Record<MeasurementOpeningStatus, string> = {
  APPROVED: "Aprobada",
  DRAFT: "Borrador",
  NEEDS_CORRECTION: "Requiere correccion",
  REGISTERED: "Registrada",
  REJECTED: "Rechazada",
};

export const MEASUREMENT_EVIDENCE_TYPE_LABELS: Record<MeasurementEvidenceType, string> = {
  CHECKLIST: "Checklist",
  FILE: "Archivo",
  OTHER: "Otro",
  PHOTO: "Foto",
  SKETCH: "Croquis",
};

export const TECHNICAL_OBSERVATION_TYPE_LABELS: Record<TechnicalObservationType, string> = {
  ACCESS: "Acceso",
  LEVEL: "Nivelacion",
  MATERIAL: "Material",
  OTHER: "Otro",
  SAFETY: "Seguridad",
  STRUCTURAL: "Estructural",
};

export const TECHNICAL_OBSERVATION_SEVERITY_LABELS: Record<
  TechnicalObservationSeverity,
  string
> = {
  CRITICAL: "Critica",
  HIGH: "Alta",
  LOW: "Baja",
  MEDIUM: "Media",
};

export const TECHNICAL_OBSERVATION_STATUS_LABELS: Record<
  TechnicalObservationStatus,
  string
> = {
  IN_PROGRESS: "En seguimiento",
  OPEN: "Abierta",
  REJECTED: "Rechazada",
  RESOLVED: "Resuelta",
};

export const MEASUREMENT_PRIORITY_LABELS = {
  HIGH: "Alta",
  LOW: "Baja",
  NORMAL: "Normal",
  URGENT: "Urgente",
} as const;

export const MEASUREMENT_CALENDAR_VIEW_LABELS: Record<MeasurementCalendarView, string> = {
  day: "Dia",
  month: "Mes",
  week: "Semana",
};

export const MEASUREMENT_STATUS_OPTIONS = Object.entries(MEASUREMENT_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as MeasurementRequestStatus,
  }),
);

export const MEASUREMENT_ELEMENT_OPTIONS = Object.entries(MEASUREMENT_ELEMENT_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as MeasurementElementType,
  }),
);

export const MEASUREMENT_PRIORITY_OPTIONS = Object.entries(MEASUREMENT_PRIORITY_LABELS).map(
  ([value, label]) => ({
    label,
    value,
  }),
);

export const MEASUREMENT_EVIDENCE_TYPE_OPTIONS = Object.entries(
  MEASUREMENT_EVIDENCE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as MeasurementEvidenceType,
}));

export const TECHNICAL_OBSERVATION_TYPE_OPTIONS = Object.entries(
  TECHNICAL_OBSERVATION_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as TechnicalObservationType,
}));

export const TECHNICAL_OBSERVATION_SEVERITY_OPTIONS = Object.entries(
  TECHNICAL_OBSERVATION_SEVERITY_LABELS,
).map(([value, label]) => ({
  label,
  value: value as TechnicalObservationSeverity,
}));

export const TECHNICAL_OBSERVATION_STATUS_OPTIONS = Object.entries(
  TECHNICAL_OBSERVATION_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as TechnicalObservationStatus,
}));

export const MEASUREMENTS_LABELS = {
  buttons: {
    approve: "Aprobar medicion",
    cancel: "Cancelar solicitud",
    create: "Crear solicitud",
    createQuotation: "Crear cotizacion",
    duplicate: "Duplicar linea",
    exportExcel: "Exportar Excel",
    exportPdf: "Exportar PDF",
    reject: "Rechazar medicion",
    reprogram: "Reprogramar",
    save: "Guardar",
    schedule: "Programar visita",
    startVisit: "Iniciar visita",
    submitApproval: "Enviar a aprobacion",
    uploadEvidence: "Adjuntar evidencia",
  },
  emptyStates: {
    calendarDescription:
      "Ajusta los filtros o programa nuevas visitas para poblar la agenda tecnica.",
    calendarTitle: "No hay visitas tecnicas en el rango seleccionado",
    requestsDescription:
      "Crea una solicitud de medicion para comenzar el relevamiento tecnico antes de cotizar o producir.",
    requestsTitle: "Todavia no hay solicitudes de medicion",
  },
  exports: {
    detail: "Reporte de medicion",
    internal: "Reporte interno de medicion",
    list: "Solicitudes de medicion",
    visit: "Visita tecnica con evidencias",
  },
  page: {
    description:
      "Coordina solicitudes, agenda visitas tecnicas, registra medidas en obra, consolida evidencias y aprueba las dimensiones antes de cotizar o producir.",
    eyebrow: "Operacion tecnica",
    title: "Mediciones y visitas tecnicas",
  },
} as const;
