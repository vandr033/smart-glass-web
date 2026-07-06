import { formatDamageSeverity, formatStatusLabel } from "@/lib/formatters";
import type {
  DamagedMaterialStatus,
  DamageSeverity,
  InventoryCondition,
  InventoryMovementType,
  InventoryReservationStatus,
  InventoryReservationType,
  InventoryStockType,
  InventorySourceType,
  RemnantPieceStatus,
  WarehouseStatus,
} from "@/types";

export const INVENTORY_PERMISSIONS = {
  adjust: "inventory.adjust",
  create: "inventory.create",
  damage: "inventory.damage",
  read: "inventory.read",
  releaseReservation: "inventory.release_reservation",
  reserve: "inventory.reserve",
  scrap: "inventory.scrap",
  update: "inventory.update",
  viewCost: "inventory.view_cost",
} as const;

export const INVENTORY_ROUTES = {
  dashboard: "/admin/inventory",
  damaged: "/admin/inventory/damaged",
  movements: "/admin/inventory/movements",
  newStock: "/admin/inventory/stock/new",
  remnants: "/admin/inventory/remnants",
  reservations: "/admin/inventory/reservations",
  stock: "/admin/inventory/stock",
  warehouses: "/admin/inventory/warehouses",
} as const;

export const INVENTORY_QUERY_KEYS = {
  availability: (params: {
    materialId: string;
    quantity?: number;
    unit?: string | null;
    warehouseId?: string | null;
  }) =>
    [
      "inventory",
      "availability",
      params.materialId,
      params.warehouseId ?? "all",
      params.quantity ?? "all",
      params.unit ?? "all",
    ] as const,
  dashboard: ["inventory", "dashboard"] as const,
  damaged: (params: unknown) => ["inventory", "damaged", params] as const,
  movements: (params: unknown) => ["inventory", "movements", params] as const,
  remnants: (params: unknown) => ["inventory", "remnants", params] as const,
  reservations: (params: unknown) => ["inventory", "reservations", params] as const,
  stock: ["inventory", "stock"] as const,
  stockTable: ["inventory", "stock", "table"] as const,
  usableRemnants: (params: unknown) => ["inventory", "remnants", "usable", params] as const,
  warehouses: ["inventory", "warehouses"] as const,
} as const;

export const WAREHOUSE_STATUS_LABELS: Record<WarehouseStatus, string> = {
  ACTIVE: formatStatusLabel("ACTIVE"),
  INACTIVE: formatStatusLabel("INACTIVE"),
};

export const INVENTORY_STOCK_TYPE_LABELS: Record<InventoryStockType, string> = {
  DAMAGED: "Danado",
  QUARANTINE: formatStatusLabel("QUARANTINE"),
  REMNANT: formatStatusLabel("REMNANT"),
  RESERVED: formatStatusLabel("RESERVED"),
  STANDARD: formatStatusLabel("STANDARD"),
};

export const INVENTORY_CONDITION_LABELS: Record<InventoryCondition, string> = {
  AVAILABLE: formatStatusLabel("AVAILABLE"),
  CONSUMED: formatStatusLabel("CONSUMED"),
  DAMAGED: "Danado",
  RESERVED_FIRM: formatStatusLabel("RESERVED_FIRM"),
  RESERVED_SOFT: formatStatusLabel("RESERVED_SOFT"),
  SCRAPPED: formatStatusLabel("SCRAPPED"),
};

export const INVENTORY_MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  ADJUSTMENT: "Ajuste",
  DAMAGE: "Dano",
  IN: "Ingreso",
  OUT: "Salida",
  RESERVATION_FIRM: "Reserva firme",
  RESERVATION_RELEASE: "Liberacion de reserva",
  RESERVATION_SOFT: "Reserva blanda",
  SCRAP: "Desecho",
  TRANSFER: "Traslado",
};

export const INVENTORY_RESERVATION_TYPE_LABELS: Record<
  InventoryReservationType,
  string
> = {
  FIRM: "Firme",
  SOFT: "Blanda",
};

export const INVENTORY_RESERVATION_STATUS_LABELS: Record<
  InventoryReservationStatus,
  string
> = {
  ACTIVE: formatStatusLabel("ACTIVE"),
  CANCELLED: formatStatusLabel("CANCELLED"),
  CONSUMED: formatStatusLabel("CONSUMED"),
  EXPIRED: formatStatusLabel("EXPIRED"),
  RELEASED: formatStatusLabel("RELEASED"),
};

export const REMNANT_STATUS_LABELS: Record<RemnantPieceStatus, string> = {
  AVAILABLE: formatStatusLabel("AVAILABLE"),
  CONSUMED: formatStatusLabel("CONSUMED"),
  RESERVED: formatStatusLabel("RESERVED"),
  SCRAPPED: formatStatusLabel("SCRAPPED"),
};

export const DAMAGE_SEVERITY_LABELS: Record<DamageSeverity, string> = {
  HIGH: formatDamageSeverity("HIGH"),
  LOW: formatDamageSeverity("LOW"),
  MEDIUM: formatDamageSeverity("MEDIUM"),
  TOTAL_LOSS: formatDamageSeverity("TOTAL_LOSS"),
};

export const DAMAGED_STATUS_LABELS: Record<DamagedMaterialStatus, string> = {
  REPORTED: formatStatusLabel("REPORTED"),
  RETURNED_TO_SUPPLIER: formatStatusLabel("RETURNED_TO_SUPPLIER"),
  REUSABLE: formatStatusLabel("REUSABLE"),
  REVIEWED: formatStatusLabel("REVIEWED"),
  SCRAPPED: formatStatusLabel("SCRAPPED"),
};

export const INVENTORY_SOURCE_TYPE_LABELS: Record<InventorySourceType, string> = {
  ADJUSTMENT: "Ajuste",
  MANUAL: "Manual",
  PURCHASE: "Compra",
  REMNANT_GENERATED: "Remanente generado",
  RETURN: "Devolucion",
};

export const INVENTORY_CONDITION_BADGES: Record<InventoryCondition, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  CONSUMED: "bg-stone-200 text-stone-700",
  DAMAGED: "bg-rose-100 text-rose-800",
  RESERVED_FIRM: "bg-cyan-100 text-cyan-800",
  RESERVED_SOFT: "bg-amber-100 text-amber-800",
  SCRAPPED: "bg-stone-300 text-stone-800",
};

export const INVENTORY_STOCK_TYPE_BADGES: Record<InventoryStockType, string> = {
  DAMAGED: "bg-rose-100 text-rose-800",
  QUARANTINE: "bg-violet-100 text-violet-800",
  REMNANT: "bg-emerald-100 text-emerald-800",
  RESERVED: "bg-cyan-100 text-cyan-800",
  STANDARD: "bg-blue-100 text-blue-900",
};
