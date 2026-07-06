import { formatClientType, formatStatusLabel } from "@/lib/formatters";
import type { ClientStatus, ClientType } from "@/types";

export const CLIENTS_PERMISSIONS = {
  create: "clients.create",
  delete: "clients.delete",
  read: "clients.read",
  update: "clients.update",
} as const;

export const CLIENTS_ROUTES = {
  create: "/admin/clients/new",
  edit: (clientId: string) => `/admin/clients/${clientId}/edit`,
  list: "/admin/clients",
  view: (clientId: string) => `/admin/clients/${clientId}`,
} as const;

export const CLIENT_TYPE_OPTIONS: Array<{
  description: string;
  label: string;
  value: ClientType;
}> = [
  {
    description: "Usa esta opcion para clientes residenciales o personas naturales.",
    label: formatClientType("INDIVIDUAL"),
    value: "INDIVIDUAL",
  },
  {
    description: "Usa esta opcion para empresas, constructoras y clientes corporativos.",
    label: formatClientType("COMPANY"),
    value: "COMPANY",
  },
];

export const CLIENT_STATUS_OPTIONS: Array<{
  label: string;
  value: ClientStatus;
}> = [
  {
    label: formatStatusLabel("ACTIVE"),
    value: "ACTIVE",
  },
  {
    label: formatStatusLabel("INACTIVE"),
    value: "INACTIVE",
  },
  {
    label: formatStatusLabel("BLOCKED"),
    value: "BLOCKED",
  },
];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: formatStatusLabel("ACTIVE"),
  BLOCKED: formatStatusLabel("BLOCKED"),
  INACTIVE: formatStatusLabel("INACTIVE"),
};

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  COMPANY: formatClientType("COMPANY"),
  INDIVIDUAL: formatClientType("INDIVIDUAL"),
};

export const CLIENTS_QUERY_KEYS = {
  all: ["clients"] as const,
  detail: (clientId: string) => ["clients", "detail", clientId] as const,
  list: (params: unknown) => ["clients", "list", params] as const,
} as const;
