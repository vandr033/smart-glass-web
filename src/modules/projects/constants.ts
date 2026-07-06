import {
  formatProjectPriority,
  formatProjectType,
  formatStatusLabel,
} from "@/lib/formatters";
import type {
  ProjectAttachmentType,
  ProjectPriority,
  ProjectStatus,
  ProjectType,
} from "@/types";

export const PROJECTS_PERMISSIONS = {
  create: "projects.create",
  delete: "projects.delete",
  read: "projects.read",
  update: "projects.update",
} as const;

export const PROJECTS_ROUTES = {
  create: "/admin/projects/new",
  edit: (projectId: string) => `/admin/projects/${projectId}/edit`,
  list: "/admin/projects",
  view: (projectId: string) => `/admin/projects/${projectId}`,
} as const;

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  APPROVED: formatStatusLabel("APPROVED"),
  CANCELLED: formatStatusLabel("CANCELLED"),
  COMPLETED: formatStatusLabel("COMPLETED"),
  IN_INSTALLATION: formatStatusLabel("IN_INSTALLATION"),
  IN_PRODUCTION: formatStatusLabel("IN_PRODUCTION"),
  INSTALLATION_PENDING: formatStatusLabel("INSTALLATION_PENDING"),
  LEAD: formatStatusLabel("LEAD"),
  MEASUREMENT_PENDING: formatStatusLabel("MEASUREMENT_PENDING"),
  ON_HOLD: formatStatusLabel("ON_HOLD"),
  PRODUCTION_PENDING: formatStatusLabel("PRODUCTION_PENDING"),
  PURCHASE_PENDING: formatStatusLabel("PURCHASE_PENDING"),
  QUOTATION_PENDING: formatStatusLabel("QUOTATION_PENDING"),
  QUOTED: formatStatusLabel("QUOTED"),
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  HIGH: formatProjectPriority("HIGH"),
  LOW: formatProjectPriority("LOW"),
  NORMAL: formatProjectPriority("NORMAL"),
  URGENT: formatProjectPriority("URGENT"),
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  CUSTOM: formatProjectType("CUSTOM"),
  DOOR: formatProjectType("DOOR"),
  FACADE: formatProjectType("FACADE"),
  MIRROR: formatProjectType("MIRROR"),
  RAILING: formatProjectType("RAILING"),
  SERVICE: formatProjectType("SERVICE"),
  SHOWER: formatProjectType("SHOWER"),
  WINDOW: formatProjectType("WINDOW"),
};

export const PROJECT_ATTACHMENT_TYPE_LABELS: Record<ProjectAttachmentType, string> = {
  CONTRACT: "Contrato",
  MEASUREMENT: "Medicion",
  OTHER: "Otro",
  PHOTO: "Foto",
  PLAN: "Plano",
  QUOTATION: "Cotizacion",
};

export const PROJECT_TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as ProjectType,
  }),
);

export const PROJECT_PRIORITY_OPTIONS = Object.entries(PROJECT_PRIORITY_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as ProjectPriority,
  }),
);

export const PROJECT_STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as ProjectStatus,
  }),
);

export const PROJECT_ATTACHMENT_TYPE_OPTIONS = Object.entries(
  PROJECT_ATTACHMENT_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProjectAttachmentType,
}));

export const PROJECT_NOTE_VISIBILITY_OPTIONS = [
  {
    label: "Solo interno",
    value: "INTERNAL",
  },
  {
    label: "Visible para el cliente",
    value: "CLIENT_VISIBLE",
  },
] as const;

export const PROJECTS_QUERY_KEYS = {
  all: ["projects"] as const,
  dashboard: ["projects", "dashboard"] as const,
  detail: (projectId: string) => ["projects", "detail", projectId] as const,
  list: (params: unknown) => ["projects", "list", params] as const,
  userOptions: ["projects", "user-options"] as const,
} as const;
