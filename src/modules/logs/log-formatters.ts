import type { LogJsonValue } from "@/types";

const isLogRecord = (
  value: LogJsonValue | null,
): value is Record<string, LogJsonValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const formatPrimitive = (value: LogJsonValue): string => {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatPrimitive(item)).join(", ");
  }

  if (typeof value === "object") {
    return summarizeLogValue(value);
  }

  return String(value);
};

const ENGLISH_LOG_TEXT = /\b(?:created|updated|deleted|changed|assigned|enabled|disabled|failed|success|role|user|permission|invitation|login|logout|password|system|record|request|selected|available|not found)\b/i;

const formatLogText = (value: string): string => {
  return ENGLISH_LOG_TEXT.test(value) ? "Actividad registrada." : value;
};

export const formatLogDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const summarizeLogValue = (value: LogJsonValue | null): string => {
  if (value === null) {
    return "Sin datos";
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.slice(0, 4).map((item) => formatPrimitive(item)).join(", ")
      : "Sin datos";
  }

  if (isLogRecord(value)) {
    if (typeof value.summary === "string" && value.summary.trim().length > 0) {
      return formatLogText(value.summary);
    }

    const entries = Object.entries(value).filter(([, entry]) => entry !== null);

    if (entries.length === 0) {
      return "Sin datos";
    }

    return entries
      .slice(0, 4)
      .map(([key, entry]) => `${formatLogKey(key)}: ${formatPrimitive(entry)}`)
      .join(" • ");
  }

  return formatLogText(String(value));
};

const formatLogKey = (value: string): string => {
  const labels: Record<string, string> = {
    action: "Acción",
    afterPermissions: "Permisos posteriores",
    beforePermissions: "Permisos anteriores",
    email: "Correo electrónico",
    name: "Nombre",
    permissionNames: "Permisos",
    reason: "Motivo",
    summary: "Resumen",
  };
  return labels[value] ?? value.replaceAll(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
};
