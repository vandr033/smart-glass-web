export const PORTAL_ACCESS_PERMISSIONS = [
  "portal_operativo.acceder",
  "inventory.read",
  "production.read",
  "mediciones.ver",
  "installations.view",
  "postventa.ver",
] as const;

export const PORTAL_AREAS = {
  almacen: ["operaciones.almacen.ver", "inventory.read"],
  produccion: ["operaciones.produccion.ver", "production.read"],
  mediciones: ["operaciones.mediciones.ver", "mediciones.ver"],
  instalaciones: ["operaciones.instalaciones.ver", "installations.view"],
  incidencias: ["operaciones.incidencias.ver", "postventa.ver", "installations.view"],
  calidad: ["operaciones.calidad.ver", "production.quality_check"],
  supervision: ["operaciones.supervision.ver", "production.read", "installations.view"],
} as const;

export const PORTAL_ROUTES = {
  inicio: "/operaciones/inicio",
  tareas: "/operaciones/mis-tareas",
  escanear: "/operaciones/escanear",
  almacen: "/operaciones/almacen",
  movimientos: "/operaciones/almacen/movimientos",
  preparaciones: "/operaciones/almacen/preparaciones",
  produccion: "/operaciones/produccion",
  mediciones: "/operaciones/mediciones",
  instalaciones: "/operaciones/instalaciones",
  incidencias: "/operaciones/incidencias",
  calidad: "/operaciones/control-calidad",
  supervision: "/operaciones/supervision",
  notificaciones: "/operaciones/notificaciones",
  perfil: "/operaciones/perfil",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  APPROVED: "Aprobada",
  BLOCKED: "Bloqueada",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  DRAFT: "Borrador",
  EN_INSTALLATION: "En instalación",
  EN_ROUTE: "En ruta",
  FAILED: "No conforme",
  IN_INSTALLATION: "En instalación",
  IN_PROGRESS: "En proceso",
  IN_VISIT: "En visita",
  OPEN: "Abierta",
  PAUSED: "Pausada",
  PENDING: "Pendiente",
  PENDING_APPROVAL: "Pendiente de aprobación",
  READY: "Lista",
  REJECTED: "Rechazada",
  REGISTERED: "Registrada",
  REQUIRES_CORRECTION: "Requiere corrección",
  RESCHEDULED: "Reprogramada",
  SCHEDULED: "Programada",
  WITH_OBSERVATIONS: "Con observaciones",
  IN: "Entrada",
  OUT: "Salida",
  TRANSFER: "Transferencia",
  ADJUSTMENT: "Ajuste",
  DAMAGE: "Daño reportado",
  SCRAP: "Baja",
  AVAILABLE: "Disponible",
  RESERVED: "Reservada",
  RESERVED_FIRM: "Reserva firme",
  RESERVED_SOFT: "Reserva provisional",
  STANDARD: "Estándar",
  REMNANT: "Remanente",
  QUARANTINE: "Cuarentena",
  PASSED: "Conforme",
  REWORK_REQUIRED: "Requiere corrección",
  material: "Material",
  produccion: "Producción",
  medicion: "Medición",
  instalacion: "Instalación",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  ASSEMBLE: "Armado",
  CUT_GLASS: "Corte de vidrio",
  CUT_PROFILE: "Corte de perfil",
  MEASURE: "Medición",
  OTHER: "Tarea operativa",
  PACK: "Empaque",
  QUALITY_CHECK: "Control de calidad",
};

const UNIT_LABELS: Record<string, string> = {
  MM: "mm",
  CM: "cm",
  M: "m",
  M2: "m²",
  UNIT: "unidad(es)",
  PACKAGE: "paquete(s)",
  KG: "kg",
  LITER: "litro(s)",
  HOUR: "hora(s)",
  DAY: "día(s)",
};

export const formatOperationalLabel = (value?: string | null) => {
  if (!value) return "Sin dato";
  return STATUS_LABELS[value] ?? PRIORITY_LABELS[value] ?? TASK_TYPE_LABELS[value] ?? UNIT_LABELS[value] ??
    value.toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
};

export const formatDate = (value?: string | null) => {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return "Sin registro";
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};
