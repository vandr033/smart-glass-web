import { formatProjectType } from "@/lib/formatters";
import type {
  AlertaRentabilidadTipo,
  CostoProyectoCategoria,
  CostoProyectoOrigen,
  ProjectType,
  RentabilidadProyectoEstado,
} from "@/types";

export const RENTABILIDAD_PERMISSIONS = {
  analizar: "rentabilidad.analizar",
  exportar: "rentabilidad.exportar",
  ver: "rentabilidad.ver",
} as const;

export const RENTABILIDAD_ROUTES = {
  detalle: (projectId: string) => `/admin/rentabilidad/${projectId}`,
  listado: "/admin/rentabilidad",
} as const;

export const RENTABILIDAD_QUERY_KEYS = {
  all: ["rentabilidad"] as const,
  dashboard: (params: unknown) => ["rentabilidad", "dashboard", params] as const,
  detalle: (projectId: string) => ["rentabilidad", "detalle", projectId] as const,
  listado: (params: unknown) => ["rentabilidad", "listado", params] as const,
} as const;

export const RENTABILIDAD_ESTADO_LABELS: Record<RentabilidadProyectoEstado, string> = {
  ANALIZADO: "Analizado",
  CERRADO: "Cerrado",
  EN_EJECUCION: "En ejecucion",
  PENDIENTE_DE_CIERRE: "Pendiente de cierre",
};

export const COSTO_CATEGORIA_LABELS: Record<CostoProyectoCategoria, string> = {
  COMPRAS: "Compras",
  GARANTIAS: "Garantias",
  INSTALACION: "Instalacion",
  MANO_DE_OBRA: "Mano de obra",
  MATERIALES: "Materiales",
  OTROS: "Otros",
  PRODUCCION: "Produccion",
  TRANSPORTE: "Transporte",
};

export const COSTO_ORIGEN_LABELS: Record<CostoProyectoOrigen, string> = {
  CONSUMO_INVENTARIO: "Consumo de inventario",
  COTIZACION: "Cotizacion",
  DERIVADO: "Derivado",
  GARANTIA: "Garantia",
  INSTALACION: "Instalacion",
  OPTIMIZACION: "Optimizacion",
  ORDEN_COMPRA: "Orden de compra",
  OTRO: "Otro",
  PRODUCCION: "Produccion",
  RECEPCION: "Recepcion",
};

export const ALERTA_RENTABILIDAD_LABELS: Record<AlertaRentabilidadTipo, string> = {
  DESPERDICIO_EXCEDIDO: "Desperdicio excedido",
  MARGEN_BAJO: "Margen bajo",
  PROYECTO_EN_PERDIDA: "Proyecto en perdida",
  SOBRECOSTO: "Sobrecosto",
};

export const EVENTO_RENTABILIDAD_LABELS = {
  ALERTA: "Alerta",
  COMPRA: "Compra",
  COSTO_REAL: "Costo real",
  COTIZACION_BASE: "Cotizacion base",
  DESPERDICIO: "Desperdicio",
  INSTALACION: "Instalacion",
  PRODUCCION: "Produccion",
  RECEPCION: "Recepcion",
} as const;

export const TIPO_PROYECTO_LABELS: Record<ProjectType, string> = {
  CUSTOM: formatProjectType("CUSTOM"),
  DOOR: formatProjectType("DOOR"),
  FACADE: formatProjectType("FACADE"),
  MIRROR: formatProjectType("MIRROR"),
  RAILING: formatProjectType("RAILING"),
  SERVICE: formatProjectType("SERVICE"),
  SHOWER: formatProjectType("SHOWER"),
  WINDOW: formatProjectType("WINDOW"),
};
