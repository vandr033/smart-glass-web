export const TABLEROS_PERMISSIONS = {
  configurar: "tableros.configurar",
  exportar: "tableros.exportar",
  legadoExportar: "reports.export",
  legadoVer: "reports.read",
  ver: "tableros.ver",
} as const;

export const INDICADORES_PERMISSIONS = {
  configurar: "indicadores.configurar",
  ver: "indicadores.ver",
} as const;

export const REPORTES_BI_PERMISSIONS = {
  exportar: "reportes.exportar",
  ver: "reportes.ver",
} as const;

export const TABLEROS_ROUTES = {
  home: "/admin/tableros",
  legado: "/admin/reports",
} as const;

export const TABLEROS_QUERY_KEYS = {
  panel: (params: unknown) => ["tableros", "panel-ejecutivo", params] as const,
} as const;
