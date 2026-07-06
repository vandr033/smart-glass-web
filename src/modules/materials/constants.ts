import { formatMaterialBehaviorType, formatStatusLabel } from "@/lib/formatters";
import type {
  MaterialStatus,
  MaterialType,
  MaterialUnit,
  SupplierMaterialEquivalenceConfidence,
  SupplierMaterialEquivalenceStatus,
} from "@/types";

export const MATERIALS_API_ENDPOINT = "/materials";
export const MATERIAL_CATEGORIES_API_ENDPOINT = "/material-categories";
export const SUPPLIER_MATERIAL_EQUIVALENCES_API_ENDPOINT =
  "/supplier-material-equivalences";

export const MATERIALS_PERMISSIONS = {
  create: "materials.create",
  delete: "materials.delete",
  read: "materials.read",
  update: "materials.update",
} as const;

export const MATERIALS_QUERY_KEYS = {
  all: ["materials"] as const,
  categories: ["materials", "categories"] as const,
  detail: (materialId: string) => ["materials", "detail", materialId] as const,
  dimensionPresets: (materialId: string) =>
    ["materials", "dimension-presets", materialId] as const,
  equivalences: (scope: string) => ["materials", "equivalences", scope] as const,
  table: ["materials", "table"] as const,
} as const;

export const MATERIALS_ROUTES = {
  categories: "/admin/material-categories",
  create: "/admin/materials/new",
  edit: (materialId: string) => `/admin/materials/${materialId}/edit`,
  equivalences: "/admin/supplier-material-equivalences",
  list: "/admin/materials",
  view: (materialId: string) => `/admin/materials/${materialId}`,
} as const;

export const MATERIAL_TYPE_OPTIONS: Array<{
  description: string;
  label: string;
  value: MaterialType;
}> = [
  {
    description: "Barras, perfiles, rieles y otros insumos lineales.",
    label: formatMaterialBehaviorType("LINEAR"),
    value: "LINEAR",
  },
  {
    description: "Planchas de vidrio, paneles y otros insumos bidimensionales.",
    label: formatMaterialBehaviorType("SHEET"),
    value: "SHEET",
  },
  {
    description: "Accesorios discretos contados por unidad.",
    label: formatMaterialBehaviorType("UNIT"),
    value: "UNIT",
  },
  {
    description: "Insumos comprados por paquete, caja o cartucho.",
    label: formatMaterialBehaviorType("PACKAGE"),
    value: "PACKAGE",
  },
  {
    description: "Mano de obra, transporte o servicios subcontratados.",
    label: formatMaterialBehaviorType("SERVICE"),
    value: "SERVICE",
  },
];

export const MATERIAL_STATUS_OPTIONS: Array<{
  label: string;
  value: MaterialStatus;
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
    label: "Descontinuado",
    value: "DISCONTINUED",
  },
];

export const MATERIAL_UNIT_OPTIONS: Array<{
  label: string;
  value: MaterialUnit;
}> = [
  { label: "Milimetro (MM)", value: "MM" },
  { label: "Centimetro (CM)", value: "CM" },
  { label: "Metro (M)", value: "M" },
  { label: "Metro cuadrado (M2)", value: "M2" },
  { label: "Unidad", value: "UNIT" },
  { label: "Paquete", value: "PACKAGE" },
  { label: "Kilogramo", value: "KG" },
  { label: "Litro", value: "LITER" },
  { label: "Hora", value: "HOUR" },
  { label: "Dia", value: "DAY" },
];

export const SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS: Array<{
  label: string;
  value: SupplierMaterialEquivalenceConfidence;
}> = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Baja", value: "LOW" },
  { label: "Media", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
  { label: "Verificada", value: "VERIFIED" },
];

export const SUPPLIER_MATERIAL_STATUS_OPTIONS: Array<{
  label: string;
  value: SupplierMaterialEquivalenceStatus;
}> = [
  { label: formatStatusLabel("ACTIVE"), value: "ACTIVE" },
  { label: formatStatusLabel("INACTIVE"), value: "INACTIVE" },
  { label: "Ignorada", value: "IGNORED" },
];

export const MATERIAL_TYPE_BADGE_CLASS_NAMES: Record<MaterialType, string> = {
  LINEAR: "bg-sky-100 text-sky-800",
  PACKAGE: "bg-violet-100 text-violet-800",
  SERVICE: "bg-stone-200 text-stone-700",
  SHEET: "bg-emerald-100 text-emerald-800",
  UNIT: "bg-blue-100 text-blue-900",
};

export const MATERIAL_STATUS_BADGE_CLASS_NAMES: Record<MaterialStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  DISCONTINUED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-stone-200 text-stone-700",
};

export const SUPPLIER_MATERIAL_CONFIDENCE_BADGE_CLASS_NAMES: Record<
  SupplierMaterialEquivalenceConfidence,
  string
> = {
  HIGH: "bg-emerald-100 text-emerald-800",
  LOW: "bg-rose-100 text-rose-700",
  MEDIUM: "bg-blue-100 text-blue-900",
  PENDING: "bg-stone-200 text-stone-700",
  VERIFIED: "bg-sky-100 text-sky-800",
};

export const SUPPLIER_MATERIAL_STATUS_BADGE_CLASS_NAMES: Record<
  SupplierMaterialEquivalenceStatus,
  string
> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  IGNORED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-stone-200 text-stone-700",
};
