import type {
  ProductTemplateInputType,
  ProductTemplateLaborType,
  ProductTemplateMaterialRuleType,
  ProductTemplateStatus,
  ProductTemplateType,
  ProductTemplateVersionStatus,
} from "@/types";

export const PRODUCT_TEMPLATE_TYPES = [
  "WINDOW",
  "DOOR",
  "SHOWER",
  "FACADE",
  "RAILING",
  "MIRROR",
  "CUSTOM",
  "SERVICE",
] as const;

export const PRODUCT_TEMPLATE_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
] as const;

export const PRODUCT_TEMPLATE_VERSION_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
] as const;

export const PRODUCT_TEMPLATE_INPUT_TYPES = [
  "NUMBER",
  "TEXT",
  "SELECT",
  "BOOLEAN",
  "MATERIAL_SELECT",
] as const;

export const PRODUCT_TEMPLATE_MATERIAL_RULE_TYPES = [
  "LINEAR_CUT",
  "SHEET_CUT",
  "UNIT_QUANTITY",
  "PACKAGE_QUANTITY",
  "SERVICE_COST",
] as const;

export const PRODUCT_TEMPLATE_LABOR_TYPES = [
  "FABRICATION",
  "INSTALLATION",
  "TRANSPORT",
  "OTHER",
] as const;

export const PRODUCT_TEMPLATE_PERMISSIONS = {
  manage: "system.settings.update",
  readHistory: "system.settings.read",
  quoteCreate: "quotations.create",
  quoteUpdate: "quotations.update",
} as const;

export const PRODUCT_TEMPLATE_READ_PERMISSIONS = [
  PRODUCT_TEMPLATE_PERMISSIONS.quoteCreate,
  PRODUCT_TEMPLATE_PERMISSIONS.quoteUpdate,
] as const;

export const PRODUCT_TEMPLATES_ROUTES = {
  create: "/admin/product-templates/new",
  edit: (templateId: string) => `/admin/product-templates/${templateId}/edit`,
  list: "/admin/product-templates",
  versionRules: (versionId: string) =>
    `/admin/product-template-versions/${versionId}/rules`,
  versionSimulate: (versionId: string) =>
    `/admin/product-template-versions/${versionId}/simulate`,
  versionView: (versionId: string) =>
    `/admin/product-template-versions/${versionId}`,
  view: (templateId: string) => `/admin/product-templates/${templateId}`,
} as const;

export const PRODUCT_TEMPLATE_TYPE_LABELS: Record<ProductTemplateType, string> = {
  CUSTOM: "Personalizado",
  DOOR: "Puerta",
  FACADE: "Fachada",
  MIRROR: "Espejo",
  RAILING: "Baranda",
  SERVICE: "Servicio",
  SHOWER: "Ducha",
  WINDOW: "Ventana",
};

export const PRODUCT_TEMPLATE_STATUS_LABELS: Record<ProductTemplateStatus, string> = {
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
  DRAFT: "Borrador",
  INACTIVE: "Inactivo",
};

export const PRODUCT_TEMPLATE_VERSION_STATUS_LABELS: Record<
  ProductTemplateVersionStatus,
  string
> = {
  ACTIVE: "Activo",
  ARCHIVED: "Archivado",
  DRAFT: "Borrador",
};

export const PRODUCT_TEMPLATE_INPUT_TYPE_LABELS: Record<
  ProductTemplateInputType,
  string
> = {
  BOOLEAN: "Sí o no",
  MATERIAL_SELECT: "Selección de material",
  NUMBER: "Número",
  SELECT: "Selección",
  TEXT: "Texto",
};

export const PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_LABELS: Record<
  ProductTemplateMaterialRuleType,
  string
> = {
  LINEAR_CUT: "Corte lineal",
  PACKAGE_QUANTITY: "Cantidad por paquete",
  SERVICE_COST: "Costo de servicio",
  SHEET_CUT: "Corte de lámina",
  UNIT_QUANTITY: "Cantidad por unidad",
};

export const PRODUCT_TEMPLATE_LABOR_TYPE_LABELS: Record<
  ProductTemplateLaborType,
  string
> = {
  FABRICATION: "Fabricación",
  INSTALLATION: "Instalación",
  OTHER: "Otro",
  TRANSPORT: "Transporte",
};

export const PRODUCT_TEMPLATE_TYPE_OPTIONS = Object.entries(
  PRODUCT_TEMPLATE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductTemplateType,
}));

export const PRODUCT_TEMPLATE_STATUS_OPTIONS = Object.entries(
  PRODUCT_TEMPLATE_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductTemplateStatus,
}));

export const PRODUCT_TEMPLATE_VERSION_STATUS_OPTIONS = Object.entries(
  PRODUCT_TEMPLATE_VERSION_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductTemplateVersionStatus,
}));

export const PRODUCT_TEMPLATE_INPUT_TYPE_OPTIONS = Object.entries(
  PRODUCT_TEMPLATE_INPUT_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductTemplateInputType,
}));

export const PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_OPTIONS = Object.entries(
  PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductTemplateMaterialRuleType,
}));

export const PRODUCT_TEMPLATE_LABOR_TYPE_OPTIONS = Object.entries(
  PRODUCT_TEMPLATE_LABOR_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductTemplateLaborType,
}));

export const PRODUCT_TEMPLATE_QUERY_KEYS = {
  detail: (templateId: string) => ["product-templates", "detail", templateId] as const,
  list: (params: unknown) => ["product-templates", "list", params] as const,
  simulations: (versionId: string, params: unknown) =>
    ["product-template-versions", versionId, "simulations", params] as const,
  version: (versionId: string) => ["product-template-versions", versionId] as const,
  versions: (templateId: string) =>
    ["product-templates", templateId, "versions"] as const,
} as const;
