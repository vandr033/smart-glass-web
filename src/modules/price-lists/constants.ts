export const PRICE_LISTS_PERMISSIONS = {
  approve: "price_lists.approve",
  import: "price_lists.import",
  read: "price_lists.read",
  validate: "price_lists.validate",
} as const;

export const PRICE_LISTS_ROUTES = {
  detail: (importId: string) => `/admin/price-lists/imports/${importId}`,
  history: "/admin/price-lists/price-history",
  import: "/admin/price-lists/import",
  list: "/admin/price-lists",
  mapping: (importId: string) => `/admin/price-lists/imports/${importId}/mapping`,
} as const;

export const PRICE_LIST_STATUS_LABELS: Record<string, string> = {
  APPROVED: "Aprobada",
  FAILED: "Fallida",
  NEEDS_MAPPING: "Requiere mapeo",
  PARSED: "Procesada",
  REJECTED: "Rechazada",
  UPLOADED: "Cargada",
  VALIDATED: "Validada",
};

export const PRICE_LIST_ROW_MAPPING_LABELS: Record<string, string> = {
  AUTO_MAPPED: "Mapeo automatico",
  ERROR: "Error",
  IGNORED: "Ignorada",
  MANUAL_MAPPED: "Mapeo manual",
  UNMAPPED: "Sin mapear",
};

export const PRICE_LIST_ROW_VALIDATION_LABELS: Record<string, string> = {
  INVALID: "Invalida",
  PENDING: "Pendiente",
  VALID: "Valida",
};

export const PRICE_LIST_CURRENCY_OPTIONS = ["BOB", "USD"] as const;
