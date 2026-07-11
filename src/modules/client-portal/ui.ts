import type {
  PortalClienteEstado,
  PortalRemitenteMensaje,
  PortalTipoDocumento,
} from "@/types";

export const PORTAL_ESTADO_USUARIO_LABELS: Record<PortalClienteEstado, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  PENDIENTE_INVITACION: "Pendiente de invitacion",
  INVITACION_ENVIADA: "Invitacion enviada",
  ACCESO_BLOQUEADO: "Acceso bloqueado",
};

export const PORTAL_DOCUMENTO_LABELS: Record<PortalTipoDocumento, string> = {
  COTIZACION: "Cotizacion",
  CONTRATO: "Contrato",
  DOCUMENTO_ADICIONAL: "Documento adicional",
  GARANTIA: "Garantia",
  MEDICION: "Medicion",
  PLANO: "Plano",
  REPORTE_INSTALACION: "Reporte de instalacion",
};

export const PORTAL_REMITENTE_LABELS: Record<PortalRemitenteMensaje, string> = {
  CLIENTE: "Cliente",
  EQUIPO_INTERNO: "Equipo interno",
};

export const PROYECTO_TIPO_LABELS: Record<string, string> = {
  WINDOW: "Ventana",
  DOOR: "Puerta",
  SHOWER: "Mampara de ducha",
  FACADE: "Fachada",
  RAILING: "Baranda",
  MIRROR: "Espejo",
  CUSTOM: "Personalizado",
  SERVICE: "Servicio",
};

export const COTIZACION_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Aceptada",
  APPROVED: "Aprobada",
  CANCELLED: "Cancelada",
  DRAFT: "Borrador",
  EXPIRED: "Vencida",
  PENDING_APPROVAL: "Pendiente de aprobacion",
  REJECTED: "Rechazada",
  SENT: "Enviada",
};

export const PROYECTO_STATUS_LABELS: Record<string, string> = {
  APPROVED: "Aprobado",
  CANCELLED: "Cancelado",
  COMPLETED: "Completado",
  IN_INSTALLATION: "En instalacion",
  IN_PRODUCTION: "En produccion",
  INSTALLATION_PENDING: "Instalacion pendiente",
  LEAD: "Prospecto",
  MEASUREMENT_PENDING: "Medicion pendiente",
  ON_HOLD: "En pausa",
  PRODUCTION_PENDING: "Produccion pendiente",
  PURCHASE_PENDING: "Compra pendiente",
  QUOTATION_PENDING: "Cotizacion pendiente",
  QUOTED: "Cotizado",
};

export const INSTALACION_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  EN_ROUTE: "En camino",
  IN_INSTALLATION: "En instalacion",
  PAUSED: "Pausada",
  RESCHEDULED: "Reprogramada",
  SCHEDULED: "Programada",
  WITH_OBSERVATIONS: "Con observaciones",
};

export const GARANTIA_STATUS_LABELS: Record<string, string> = {
  ANULADA: "Anulada",
  VENCIDA: "Vencida",
  VIGENTE: "Vigente",
};

export const POSTVENTA_STATUS_LABELS: Record<string, string> = {
  CERRADO: "Cerrado",
  EN_ATENCION: "En atencion",
  EN_REVISION: "En revision",
  PENDIENTE_REPUESTO: "Pendiente de repuesto",
  RECHAZADO: "Rechazado",
  REPORTADO: "Reportado",
  RESUELTO: "Resuelto",
  VISITA_PROGRAMADA: "Visita programada",
};

export const PRIORIDAD_LABELS: Record<string, string> = {
  ALTA: "Alta",
  BAJA: "Baja",
  CRITICA: "Critica",
  HIGH: "Alta",
  LOW: "Baja",
  MEDIA: "Media",
  NORMAL: "Normal",
  URGENT: "Urgente",
};

export const TIPO_POSTVENTA_LABELS: Record<string, string> = {
  AJUSTE: "Ajuste",
  FUGA: "Fuga",
  GARANTIA: "Garantia",
  MALA_INSTALACION: "Mala instalacion",
  OTRO: "Otro",
  PRODUCTO_INCOMPLETO: "Producto incompleto",
  RECLAMO: "Reclamo",
  REPOSICION: "Reposicion",
  ROTURA: "Rotura",
};

export const TIPO_EVIDENCIA_LABELS: Record<string, string> = {
  CHECKLIST: "Checklist",
  DOCUMENTO: "Documento",
  FILE: "Archivo",
  FOTO: "Foto",
  OTHER: "Otro",
  PHOTO: "Foto",
  SIGNATURE: "Firma",
  SKETCH: "Croquis",
  VIDEO: "Video",
};

export const MEDICION_STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Programada",
  IN_VISIT: "En visita",
  REGISTERED: "Registrada",
  WITH_OBSERVATIONS: "Con observaciones",
  PENDING_APPROVAL: "Pendiente de aprobacion",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  RESCHEDULED: "Reprogramada",
  CANCELLED: "Cancelada",
};

export const TAREA_INSTALACION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  COMPLETED: "Completada",
  BLOCKED: "Bloqueada",
  CANCELLED: "Cancelada",
};

export const INCIDENCIA_INSTALACION_STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierta",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelta",
  CLOSED: "Cerrada",
};

export const INCIDENCIA_INSTALACION_TIPO_LABELS: Record<string, string> = {
  ACCESS: "Acceso",
  CLIENT: "Cliente",
  MATERIAL: "Material",
  SAFETY: "Seguridad",
  TECHNICAL: "Tecnica",
  WEATHER: "Clima",
  OTHER: "Otro",
};

export const INCIDENCIA_INSTALACION_SEVERIDAD_LABELS: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Critica",
};

export const ACTIVIDAD_POSTVENTA_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PROGRAMADA: "Programada",
  EJECUTADA: "Ejecutada",
  CANCELADA: "Cancelada",
};

export const ACTIVIDAD_POSTVENTA_TIPO_LABELS: Record<string, string> = {
  VISITA_REVISION: "Visita de revision",
  DIAGNOSTICO: "Diagnostico",
  SOLUCION: "Solucion",
  REPUESTO: "Repuesto",
  CIERRE: "Cierre",
  NOTA_INTERNA: "Nota interna",
};

const INTERNAL_TOKEN_LABELS: Record<string, string> = {
  ACCESS: "Acceso",
  ACTIVE: "Activo",
  APPROVAL: "aprobacion",
  APPROVED: "Aprobado",
  BLOCKED: "Bloqueado",
  CANCELLED: "Cancelado",
  CHECKLIST: "Checklist",
  CLIENT: "Cliente",
  CLOSED: "Cerrado",
  COMPLETED: "Completado",
  CRITICAL: "Critica",
  CUSTOM: "Personalizado",
  DOOR: "Puerta",
  EN: "En",
  FACADE: "Fachada",
  FILE: "Archivo",
  FOR: "para",
  HIGH: "Alta",
  HOLD: "pausa",
  IN: "En",
  INACTIVE: "Inactivo",
  INSTALLATION: "instalacion",
  LEAD: "Prospecto",
  LOW: "Baja",
  MATERIAL: "Material",
  MEASUREMENT: "medicion",
  MEDIUM: "Media",
  MIRROR: "Espejo",
  NORMAL: "Media",
  OBSERVATIONS: "observaciones",
  ON: "En",
  OPEN: "Abierto",
  OTHER: "Otro",
  PAUSED: "Pausado",
  PENDING: "Pendiente",
  PHOTO: "Foto",
  PLAN: "Plano",
  PRODUCTION: "produccion",
  PROGRESS: "progreso",
  PURCHASE: "compra",
  QUOTATION: "cotizacion",
  QUOTED: "Cotizado",
  RAILING: "Baranda",
  READY: "Listo",
  REGISTERED: "Registrado",
  REJECTED: "Rechazado",
  REQUIRES: "Requiere",
  RESCHEDULED: "Reprogramado",
  RESOLVED: "Resuelto",
  REVISIT: "nueva visita",
  ROUTE: "camino",
  SAFETY: "Seguridad",
  SCHEDULED: "Programado",
  SERVICE: "Servicio",
  SHOWER: "Mampara de ducha",
  SIGNATURE: "Firma",
  TECHNICAL: "Tecnica",
  URGENT: "Urgente",
  VISIT: "visita",
  WEATHER: "Clima",
  WINDOW: "Ventana",
  WITH: "Con",
};

export const formatPortalDate = (value: string | null): string => {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export const formatPortalDateTime = (value: string | null): string => {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const formatPortalCurrency = (value: number, currency = "BOB"): string => {
  return new Intl.NumberFormat("es-BO", {
    currency,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(value);
};

const toTitleCase = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const translateInternalValue = (value: string): string => {
  return value
    .split("_")
    .map((token) => INTERNAL_TOKEN_LABELS[token] ?? toTitleCase(token))
    .join(" ");
};

export const getLabel = (
  labels: Record<string, string>,
  value: string | null | undefined,
): string => {
  if (!value) {
    return "Sin dato";
  }

  return labels[value] ?? translateInternalValue(value);
};

export const getPortalTone = (
  value: string | null | undefined,
): "alerta" | "exito" | "neutral" | "pendiente" => {
  if (!value) {
    return "neutral";
  }

  const normalizedValue = value.toUpperCase();

  if (
    [
      "ACCEPTED",
      "APPROVED",
      "COMPLETED",
      "RESOLVED",
      "RESUELTO",
      "VIGENTE",
      "ACTIVO",
      "ACTIVE",
      "CERRADO",
    ].includes(normalizedValue)
  ) {
    return "exito";
  }

  if (
    [
      "REJECTED",
      "CANCELLED",
      "ANULADA",
      "VENCIDA",
      "ACCESO_BLOQUEADO",
      "CRITICA",
      "HIGH",
      "URGENT",
      "CRITICAL",
      "OPEN",
    ].includes(normalizedValue)
  ) {
    return "alerta";
  }

  if (
    [
      "PENDING",
      "PENDING_APPROVAL",
      "SENT",
      "SCHEDULED",
      "REQUESTED",
      "REPORTADO",
      "EN_REVISION",
      "VISITA_PROGRAMADA",
      "EN_ATENCION",
      "PENDIENTE_REPUESTO",
      "INVITACION_ENVIADA",
      "PENDIENTE_INVITACION",
      "PROGRAMADA",
    ].includes(normalizedValue)
  ) {
    return "pendiente";
  }

  return "neutral";
};
