export type WarehouseStatus = "ACTIVE" | "INACTIVE";

export type InventoryStockType =
  | "STANDARD"
  | "REMNANT"
  | "DAMAGED"
  | "RESERVED"
  | "QUARANTINE";

export type InventoryCondition =
  | "AVAILABLE"
  | "RESERVED_SOFT"
  | "RESERVED_FIRM"
  | "DAMAGED"
  | "CONSUMED"
  | "SCRAPPED";

export type InventorySourceType =
  | "MANUAL"
  | "PURCHASE"
  | "REMNANT_GENERATED"
  | "RETURN"
  | "ADJUSTMENT";

export type InventoryMovementType =
  | "IN"
  | "OUT"
  | "TRANSFER"
  | "ADJUSTMENT"
  | "RESERVATION_SOFT"
  | "RESERVATION_FIRM"
  | "RESERVATION_RELEASE"
  | "DAMAGE"
  | "SCRAP";

export type InventoryReservationType = "SOFT" | "FIRM";

export type InventoryReservationStatus =
  | "ACTIVE"
  | "RELEASED"
  | "CONSUMED"
  | "EXPIRED"
  | "CANCELLED";

export type RemnantPieceStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "CONSUMED"
  | "SCRAPPED";

export type RemnantPieceSourceType =
  | "MANUAL"
  | "CUT_OPTIMIZATION"
  | "PRODUCTION_RETURN";

export type DamageType =
  | "BROKEN"
  | "SCRATCHED"
  | "BENT"
  | "MISSING_PARTS"
  | "OTHER";

export type DamageSeverity = "LOW" | "MEDIUM" | "HIGH" | "TOTAL_LOSS";

export type DamagedMaterialStatus =
  | "REPORTED"
  | "REVIEWED"
  | "SCRAPPED"
  | "REUSABLE"
  | "RETURNED_TO_SUPPLIER";

export type WarehouseSummary = {
  code: string;
  id: string;
  name: string;
};

export type InventoryMaterialSummary = {
  category: {
    id: string;
    name: string;
    slug: string;
  };
  code: string;
  id: string;
  materialType: "LINEAR" | "PACKAGE" | "SERVICE" | "SHEET" | "UNIT";
  name: string;
};

export type InventoryUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type WarehouseRecord = {
  address: string | null;
  code: string;
  createdAt: string;
  deletedAt: string | null;
  description: string | null;
  id: string;
  latitude: number | null;
  longitude: number | null;
  name: string;
  status: WarehouseStatus;
  updatedAt: string;
};

export type InventoryStockRecord = {
  availableQuantity: number;
  batchNumber: string | null;
  condition: InventoryCondition;
  createdAt: string;
  deletedAt: string | null;
  heightMm: number | null;
  id: string;
  lengthMm: number | null;
  locationCode: string | null;
  material: InventoryMaterialSummary;
  materialId: string;
  notes: string | null;
  quantity: number;
  reservedFirmQuantity: number;
  reservedSoftQuantity: number;
  sourceId: string | null;
  sourceType: InventorySourceType;
  stockType: InventoryStockType;
  thicknessMm: number | null;
  unit: "MM" | "CM" | "M" | "M2" | "UNIT" | "PACKAGE" | "KG" | "LITER" | "HOUR" | "DAY";
  updatedAt: string;
  warehouse: WarehouseSummary;
  warehouseId: string;
  widthMm: number | null;
};

export type InventoryMovementRecord = {
  createdAt: string;
  createdByUser: InventoryUserSummary;
  fromWarehouse: WarehouseSummary | null;
  id: string;
  inventoryStockId: string | null;
  material: InventoryMaterialSummary;
  materialId: string;
  movementType: InventoryMovementType;
  quantity: number;
  reason: string | null;
  referenceId: string | null;
  referenceType: string | null;
  toWarehouse: WarehouseSummary | null;
  unit: InventoryStockRecord["unit"];
  warehouse: WarehouseSummary;
  warehouseId: string;
};

export type InventoryReservationRecord = {
  createdAt: string;
  expiresAt: string | null;
  id: string;
  inventoryStock: {
    condition: InventoryCondition;
    id: string;
    locationCode: string | null;
    stockType: InventoryStockType;
  } | null;
  inventoryStockId: string | null;
  material: InventoryMaterialSummary;
  materialId: string;
  project: {
    code: string;
    id: string;
    title: string;
  } | null;
  projectId: string | null;
  quantity: number;
  quotation: {
    code: string;
    id: string;
    status: string;
  } | null;
  quotationId: string | null;
  reservationType: InventoryReservationType;
  reservedByUser: InventoryUserSummary;
  status: InventoryReservationStatus;
  unit: InventoryStockRecord["unit"];
  updatedAt: string;
  warehouse: WarehouseSummary;
  warehouseId: string;
};

export type RemnantPieceRecord = {
  code: string;
  createdAt: string;
  id: string;
  lengthMm: number | null;
  material: InventoryMaterialSummary;
  materialId: string;
  notes: string | null;
  parentInventoryStockId: string | null;
  quantity: number;
  sourceId: string | null;
  sourceType: RemnantPieceSourceType;
  status: RemnantPieceStatus;
  thicknessMm: number | null;
  unit: InventoryStockRecord["unit"];
  updatedAt: string;
  usableAreaM2: number | null;
  warehouse: WarehouseSummary;
  warehouseId: string;
  widthMm: number | null;
};

export type DamagedMaterialRecord = {
  createdAt: string;
  damageType: DamageType;
  description: string | null;
  id: string;
  inventoryStock: {
    condition: InventoryCondition;
    id: string;
    locationCode: string | null;
    stockType: InventoryStockType;
  } | null;
  inventoryStockId: string | null;
  material: InventoryMaterialSummary;
  materialId: string;
  quantity: number;
  reportedByUser: InventoryUserSummary;
  severity: DamageSeverity;
  status: DamagedMaterialStatus;
  unit: InventoryStockRecord["unit"];
  updatedAt: string;
  warehouse: WarehouseSummary;
  warehouseId: string;
};

export type InventoryAvailabilitySummary = {
  availableQuantity: number;
  damagedQuantity: number;
  remnantQuantity: number;
  reservedFirmQuantity: number;
  reservedSoftQuantity: number;
  totalQuantity: number;
};

export type MaterialAvailabilityRecord = {
  material: InventoryMaterialSummary;
  requestedQuantity: number | null;
  requestedUnit: InventoryStockRecord["unit"] | null;
  stocks: InventoryStockRecord[];
  sufficientForRequestedQuantity: boolean | null;
  summary: InventoryAvailabilitySummary;
  warehouseId: string | null;
};

export type GlassAvailabilityRecord = {
  matchingRemnants: RemnantPieceRecord[];
  matchingStocks: InventoryStockRecord[];
  material: InventoryMaterialSummary;
  requestedHeightMm: number;
  requestedWidthMm: number;
  sufficient: boolean;
  thicknessMm: number | null;
  warehouseId: string | null;
};

export type LinearAvailabilityRecord = {
  material: InventoryMaterialSummary;
  matchingStocks: InventoryStockRecord[];
  requiredLengthMm: number;
  sufficient: boolean;
  warehouseId: string | null;
};

export type InventoryDashboardRecord = {
  damagedStockCount: number;
  lowStockCount: number;
  recentMovements: InventoryMovementRecord[];
  remnantsCount: number;
  reservedStockCount: number;
  totalMaterialsWithStock: number;
};

export type WarehouseMutationInput = {
  address: string | null;
  code: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  status: WarehouseStatus;
};

export type InventoryStockEntryInput = {
  batchNumber: string | null;
  condition: InventoryCondition;
  heightMm: number | null;
  lengthMm: number | null;
  locationCode: string | null;
  materialId: string;
  notes: string | null;
  quantity: number;
  sourceId: string | null;
  sourceType: InventorySourceType;
  stockType: InventoryStockType;
  thicknessMm: number | null;
  unit: InventoryStockRecord["unit"];
  warehouseId: string;
  widthMm: number | null;
};

export type InventoryAdjustInput = {
  inventoryStockId: string;
  notes: string | null;
  quantityDelta: number;
  reason: string | null;
};

export type InventoryTransferInput = {
  inventoryStockId: string;
  locationCode: string | null;
  quantity: number;
  reason: string | null;
  toWarehouseId: string;
};

export type InventoryReservationInput = {
  expiresAt: string | null;
  inventoryStockId?: string;
  materialId: string;
  projectId?: string;
  quantity: number;
  quotationId?: string;
  unit: InventoryStockRecord["unit"];
  warehouseId: string;
};

export type RemnantPieceInput = {
  code: string | null;
  lengthMm: number | null;
  materialId: string;
  notes: string | null;
  parentInventoryStockId?: string;
  quantity: number;
  sourceId: string | null;
  sourceType: RemnantPieceSourceType;
  thicknessMm: number | null;
  unit: InventoryStockRecord["unit"];
  warehouseId: string;
  widthMm: number | null;
};

export type DamagedMaterialInput = {
  damageType: DamageType;
  description: string | null;
  inventoryStockId?: string;
  materialId: string;
  quantity: number;
  severity: DamageSeverity;
  unit: InventoryStockRecord["unit"];
  warehouseId: string;
};
