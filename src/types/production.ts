import type { MaterialType, MaterialUnit } from "./materials";

export type ProductionJobStatus =
  | "DRAFT"
  | "READY"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type ProductionJobPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ProductionJobItemStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
export type ProductionTaskType =
  | "MEASURE"
  | "CUT_GLASS"
  | "CUT_PROFILE"
  | "ASSEMBLE"
  | "QUALITY_CHECK"
  | "PACK"
  | "OTHER";
export type ProductionTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED"
  | "CANCELLED";
export type MaterialConsumptionType =
  | "PLANNED"
  | "ACTUAL"
  | "WASTE"
  | "SCRAP"
  | "REMNANT_OUTPUT";
export type MaterialConsumptionSourceType =
  | "INVENTORY_STOCK"
  | "REMNANT"
  | "MANUAL";
export type QualityCheckStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "REWORK_REQUIRED";

export type ProductionUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type ProductionProjectSummary = {
  code: string;
  id: string;
  title: string;
} | null;

export type ProductionQuotationSummary = {
  code: string;
  id: string;
  status: string;
} | null;

export type ProductionCuttingPlanSummary = {
  code: string;
  id: string;
  sheetCount: number;
  status: string;
  wastePercent: number;
} | null;

export type ProductionWarehouseSummary = {
  code: string;
  id: string;
  name: string;
} | null;

export type ProductionMaterialSummary = {
  code: string;
  id: string;
  materialType: MaterialType;
  name: string;
} | null;

export type ProductionInventoryStockSummary = {
  batchNumber: string | null;
  condition:
    | "AVAILABLE"
    | "CONSUMED"
    | "DAMAGED"
    | "RESERVED_FIRM"
    | "RESERVED_SOFT"
    | "SCRAPPED";
  heightMm: number | null;
  id: string;
  lengthMm: number | null;
  locationCode: string | null;
  quantity: number;
  stockType: "DAMAGED" | "QUARANTINE" | "REMNANT" | "RESERVED" | "STANDARD";
  thicknessMm: number | null;
  unit: MaterialUnit;
  warehouse: ProductionWarehouseSummary;
  widthMm: number | null;
} | null;

export type ProductionRemnantSummary = {
  code: string;
  id: string;
  lengthMm: number | null;
  quantity: number;
  status: "AVAILABLE" | "CONSUMED" | "RESERVED" | "SCRAPPED";
  thicknessMm: number | null;
  unit: MaterialUnit;
  usableAreaM2: number | null;
  warehouse: ProductionWarehouseSummary;
  widthMm: number | null;
} | null;

export type ProductionJobItemRecord = {
  createdAt: string;
  description: string | null;
  id: string;
  material: ProductionMaterialSummary;
  metadataJson: unknown;
  name: string;
  quantity: number;
  quotationItemId: string | null;
  status: ProductionJobItemStatus;
  updatedAt: string;
};

export type ProductionTaskRecord = {
  assignedToUser: ProductionUserSummary;
  completedAt: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  productionJobId: string;
  productionJobItemId: string | null;
  sortOrder: number;
  startedAt: string | null;
  status: ProductionTaskStatus;
  taskType: ProductionTaskType;
  title: string;
  updatedAt: string;
};

export type MaterialConsumptionRecord = {
  consumedAt: string;
  consumedByUser: ProductionUserSummary;
  consumptionType: MaterialConsumptionType;
  createdAt: string;
  id: string;
  inventoryStock: ProductionInventoryStockSummary;
  material: ProductionMaterialSummary;
  notes: string | null;
  productionJobId: string;
  productionTaskId: string | null;
  quantity: number;
  remnantPiece: ProductionRemnantSummary;
  sourceType: MaterialConsumptionSourceType;
  unit: MaterialUnit;
};

export type ProductionStatusHistoryRecord = {
  changedByUser: ProductionUserSummary;
  createdAt: string;
  fromStatus: ProductionJobStatus | null;
  id: string;
  notes: string | null;
  toStatus: ProductionJobStatus;
};

export type QualityCheckRecord = {
  checkedAt: string | null;
  checkedByUser: ProductionUserSummary;
  createdAt: string;
  evidenceJson: unknown;
  id: string;
  notes: string | null;
  productionJobId: string;
  productionTaskId: string | null;
  status: QualityCheckStatus;
  updatedAt: string;
};

export type ProductionWasteReportRecord = {
  actualWasteAreaM2: number;
  actualWastePercent: number;
  createdAt: string;
  cuttingPlan: ProductionCuttingPlanSummary;
  hasActualWasteData: boolean;
  id: string;
  notes: string | null;
  productionJobId: string;
  theoreticalWasteAreaM2: number;
  theoreticalWastePercent: number;
  updatedAt: string;
  varianceAreaM2: number;
  variancePercent: number;
};

export type ProductionJobListItem = {
  actualEndDate: string | null;
  actualStartDate: string | null;
  assignedToUser: ProductionUserSummary;
  code: string;
  completedTaskCount: number;
  consumptionCount: number;
  createdAt: string;
  createdByUser: ProductionUserSummary;
  cuttingPlan: ProductionCuttingPlanSummary;
  id: string;
  itemCount: number;
  notes: string | null;
  pendingTaskCount: number;
  plannedEndDate: string | null;
  plannedStartDate: string | null;
  priority: ProductionJobPriority;
  project: ProductionProjectSummary;
  qualityCheckCount: number;
  quotation: ProductionQuotationSummary;
  status: ProductionJobStatus;
  taskCount: number;
  updatedAt: string;
  wasteReport: ProductionWasteReportRecord | null;
};

export type ProductionJobDetailRecord = ProductionJobListItem & {
  deletedAt: string | null;
  items: ProductionJobItemRecord[];
  materialConsumptions: MaterialConsumptionRecord[];
  qualityChecks: QualityCheckRecord[];
  statusHistory: ProductionStatusHistoryRecord[];
  tasks: ProductionTaskRecord[];
};

export type CreateProductionJobInput = {
  assignedToUserId?: string | null;
  cuttingPlanId?: string | null;
  items?: Array<{
    description?: string | null;
    materialId?: string | null;
    metadataJson?: Record<string, unknown> | null;
    name: string;
    quantity: number;
    quotationItemId?: string | null;
    status?: ProductionJobItemStatus;
  }>;
  notes?: string | null;
  plannedEndDate?: string | null;
  plannedStartDate?: string | null;
  priority?: ProductionJobPriority;
  projectId?: string | null;
  quotationId?: string | null;
  tasks?: Array<{
    assignedToUserId?: string | null;
    description?: string | null;
    productionJobItemId?: string | null;
    sortOrder?: number;
    status?: ProductionTaskStatus;
    taskType: ProductionTaskType;
    title: string;
  }>;
};

export type UpdateProductionJobInput = {
  assignedToUserId?: string | null;
  notes?: string | null;
  plannedEndDate?: string | null;
  plannedStartDate?: string | null;
  priority: ProductionJobPriority;
};

export type UpdateProductionTaskInput = {
  assignedToUserId?: string | null;
  description?: string | null;
  sortOrder: number;
  status: ProductionTaskStatus;
  title: string;
};

export type ConsumeMaterialForTaskInput = {
  actualWasteAreaM2?: number | null;
  consumptionType?: MaterialConsumptionType;
  consumedAt?: string | null;
  inventoryStockId?: string | null;
  materialId?: string | null;
  notes?: string | null;
  quantity: number;
  remnantOutput?: {
    code?: string | null;
    lengthMm?: number | null;
    notes?: string | null;
    quantity: number;
    thicknessMm?: number | null;
    unit: MaterialUnit;
    warehouseId: string;
    widthMm?: number | null;
  } | null;
  remnantPieceId?: string | null;
  scrapQuantity?: number | null;
  scrapUnit?: MaterialUnit | null;
  sourceType?: MaterialConsumptionSourceType;
  unit: MaterialUnit;
};

export type RecordQualityCheckInput = {
  evidenceJson?: Record<string, unknown> | null;
  notes?: string | null;
  productionTaskId?: string | null;
  status?: QualityCheckStatus;
};
