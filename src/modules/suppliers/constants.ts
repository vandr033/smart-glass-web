import { formatStatusLabel } from "@/lib/formatters";

export const SUPPLIERS_API_ENDPOINT = "/suppliers";
export const SUPPLIER_CATEGORIES_API_ENDPOINT = "/supplier-categories";
export const SUPPLIER_SCORING_API_ENDPOINT = "/supplier-scoring";

export const SUPPLIERS_PERMISSIONS = {
  create: "suppliers.create",
  delete: "suppliers.delete",
  read: "suppliers.read",
  update: "suppliers.update",
} as const;

export const SUPPLIER_SCORING_PERMISSIONS = {
  read: "system.settings.read",
  update: "system.settings.update",
} as const;

export const SUPPLIERS_QUERY_KEYS = {
  all: ["suppliers"] as const,
  categories: ["suppliers", "categories"] as const,
  detail: (supplierId: string) => ["suppliers", "detail", supplierId] as const,
  scoringConfigs: ["suppliers", "scoring-configs"] as const,
  scoringCriteria: ["suppliers", "scoring-criteria"] as const,
  simulation: ["suppliers", "simulation"] as const,
  table: ["suppliers", "table"] as const,
} as const;

export const SUPPLIERS_ROUTES = {
  categories: "/admin/settings/supplier-categories",
  create: "/admin/suppliers/new",
  edit: (supplierId: string) => `/admin/suppliers/${supplierId}/edit`,
  list: "/admin/suppliers",
  scoring: "/admin/settings/supplier-scoring",
  view: (supplierId: string) => `/admin/suppliers/${supplierId}`,
} as const;

export const SUPPLIER_STATUS_OPTIONS = [
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
] as const;
