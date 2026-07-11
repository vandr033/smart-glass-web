import type {
  MaterialUnit,
  PostventaActivityStatus,
  PostventaActivityType,
  PostventaCaseStatus,
  PostventaCaseType,
  PostventaCostCategory,
  PostventaCostOrigin,
  PostventaEvidenceType,
  PostventaPriority,
  ProductWarrantyStatus,
} from "@/types";

export const POSTVENTA_PERMISSIONS = {
  asignar: "postventa.asignar",
  actualizar: "postventa.actualizar",
  cerrar: "postventa.cerrar",
  crear: "postventa.crear",
  exportar: "postventa.exportar",
  ver: "postventa.ver",
} as const;

export const GARANTIAS_PERMISSIONS = {
  actualizar: "garantias.actualizar",
  crear: "garantias.crear",
  ver: "garantias.ver",
} as const;

export const POSTVENTA_ROUTES = {
  crear: "/admin/postventa/new",
  detalle: (caseId: string) => `/admin/postventa/${caseId}`,
  listado: "/admin/postventa",
  registrarDesde: (params: {
    clientId?: string;
    installationId?: string;
    origen?: "cliente" | "instalacion" | "proyecto";
    projectId?: string;
    quotationId?: string;
  }) => {
    const searchParams = new URLSearchParams();

    if (params.clientId) {
      searchParams.set("clientId", params.clientId);
    }

    if (params.projectId) {
      searchParams.set("projectId", params.projectId);
    }

    if (params.quotationId) {
      searchParams.set("quotationId", params.quotationId);
    }

    if (params.installationId) {
      searchParams.set("installationId", params.installationId);
    }

    if (params.origen) {
      searchParams.set("origen", params.origen);
    }

    return searchParams.size > 0
      ? `/admin/postventa/new?${searchParams.toString()}`
      : "/admin/postventa/new";
  },
} as const;

export const POSTVENTA_QUERY_KEYS = {
  all: ["postventa"] as const,
  casos: (params: unknown) => ["postventa", "casos", params] as const,
  caso: (caseId: string) => ["postventa", "caso", caseId] as const,
  garantias: (params: unknown) => ["postventa", "garantias", params] as const,
} as const;

export const POSTVENTA_TYPE_LABELS: Record<PostventaCaseType, string> = {
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

export const POSTVENTA_STATUS_LABELS: Record<PostventaCaseStatus, string> = {
  CERRADO: "Cerrado",
  EN_ATENCION: "En atencion",
  EN_REVISION: "En revision",
  PENDIENTE_REPUESTO: "Pendiente de repuesto",
  RECHAZADO: "Rechazado",
  REPORTADO: "Reportado",
  RESUELTO: "Resuelto",
  VISITA_PROGRAMADA: "Visita programada",
};

export const POSTVENTA_PRIORITY_LABELS: Record<PostventaPriority, string> = {
  ALTA: "Alta",
  BAJA: "Baja",
  CRITICA: "Critica",
  MEDIA: "Media",
};

export const PRODUCT_WARRANTY_STATUS_LABELS: Record<ProductWarrantyStatus, string> = {
  ANULADA: "Anulada",
  VENCIDA: "Vencida",
  VIGENTE: "Vigente",
};

export const POSTVENTA_ACTIVITY_TYPE_LABELS: Record<PostventaActivityType, string> = {
  CIERRE: "Cierre",
  DIAGNOSTICO: "Diagnostico",
  NOTA_INTERNA: "Nota interna",
  REPUESTO: "Repuesto requerido",
  SOLUCION: "Solucion",
  VISITA_REVISION: "Visita de revision",
};

export const POSTVENTA_ACTIVITY_STATUS_LABELS: Record<PostventaActivityStatus, string> = {
  CANCELADA: "Cancelada",
  EJECUTADA: "Ejecutada",
  PENDIENTE: "Pendiente",
  PROGRAMADA: "Programada",
};

export const POSTVENTA_EVIDENCE_TYPE_LABELS: Record<PostventaEvidenceType, string> = {
  DOCUMENTO: "Documento",
  FOTO: "Foto",
  OTRO: "Otro",
  VIDEO: "Video",
};

export const POSTVENTA_COST_CATEGORY_LABELS: Record<PostventaCostCategory, string> = {
  DIAGNOSTICO: "Diagnostico",
  GARANTIA: "Garantia",
  INSTALACION: "Instalacion",
  MANO_DE_OBRA: "Mano de obra",
  MATERIAL: "Material",
  OTRO: "Otro",
  RECLAMO: "Reclamo",
  REPOSICION: "Reposicion",
  TRANSPORTE: "Transporte",
  VISITA: "Visita",
};

export const POSTVENTA_COST_ORIGIN_LABELS: Record<PostventaCostOrigin, string> = {
  COTIZACION: "Cotizacion",
  GARANTIA: "Garantia",
  INSTALACION: "Instalacion",
  INVENTARIO: "Inventario",
  MANUAL: "Manual",
  OTRO: "Otro",
  PRODUCCION: "Produccion",
};

export const POSTVENTA_RESERVATION_TYPE_LABELS: Record<"SOFT" | "FIRM", string> = {
  FIRM: "Reserva firme",
  SOFT: "Reserva blanda",
};

export const MATERIAL_UNIT_LABELS: Record<MaterialUnit, string> = {
  CM: "cm",
  DAY: "dia",
  HOUR: "hora",
  KG: "kg",
  LITER: "litro",
  M: "m",
  M2: "m2",
  MM: "mm",
  PACKAGE: "paquete",
  UNIT: "unidad",
};

export const POSTVENTA_TYPE_OPTIONS = Object.entries(POSTVENTA_TYPE_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as PostventaCaseType,
  }),
);

export const POSTVENTA_STATUS_OPTIONS = Object.entries(POSTVENTA_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as PostventaCaseStatus,
  }),
);

export const POSTVENTA_STATUS_TRANSITION_OPTIONS = Object.entries(
  POSTVENTA_STATUS_LABELS,
)
  .filter(([value]) => value !== "CERRADO")
  .map(([value, label]) => ({
    label,
    value: value as Exclude<PostventaCaseStatus, "CERRADO">,
  }));

export const POSTVENTA_PRIORITY_OPTIONS = Object.entries(
  POSTVENTA_PRIORITY_LABELS,
).map(([value, label]) => ({
  label,
  value: value as PostventaPriority,
}));

export const PRODUCT_WARRANTY_STATUS_OPTIONS = Object.entries(
  PRODUCT_WARRANTY_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as ProductWarrantyStatus,
}));

export const POSTVENTA_ACTIVITY_TYPE_OPTIONS = Object.entries(
  POSTVENTA_ACTIVITY_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as PostventaActivityType,
}));

export const POSTVENTA_ACTIVITY_STATUS_OPTIONS = Object.entries(
  POSTVENTA_ACTIVITY_STATUS_LABELS,
).map(([value, label]) => ({
  label,
  value: value as PostventaActivityStatus,
}));

export const POSTVENTA_EVIDENCE_TYPE_OPTIONS = Object.entries(
  POSTVENTA_EVIDENCE_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as PostventaEvidenceType,
}));

export const POSTVENTA_COST_CATEGORY_OPTIONS = Object.entries(
  POSTVENTA_COST_CATEGORY_LABELS,
).map(([value, label]) => ({
  label,
  value: value as PostventaCostCategory,
}));

export const POSTVENTA_COST_ORIGIN_OPTIONS = Object.entries(
  POSTVENTA_COST_ORIGIN_LABELS,
).map(([value, label]) => ({
  label,
  value: value as PostventaCostOrigin,
}));

export const POSTVENTA_RESERVATION_TYPE_OPTIONS = Object.entries(
  POSTVENTA_RESERVATION_TYPE_LABELS,
).map(([value, label]) => ({
  label,
  value: value as "SOFT" | "FIRM",
}));

export const MATERIAL_UNIT_OPTIONS = Object.entries(MATERIAL_UNIT_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as MaterialUnit,
  }),
);
