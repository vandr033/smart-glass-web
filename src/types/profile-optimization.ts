export type ProfileOptimizationRunStatus =
  | "DRAFT"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "APPROVED"
  | "CANCELLED";

export type ProfileOptimizationMode =
  | "COMMERCIAL_ESTIMATION"
  | "OPERATIONAL_EXECUTION";

export type ProfileCuttingPlanStatus =
  | "DRAFT"
  | "APPROVED"
  | "SENT_TO_PRODUCTION"
  | "COMPLETED"
  | "CANCELLED";

export type ProfileCuttingBarSource =
  | "INVENTORY_BAR"
  | "REMNANT"
  | "PURCHASE_REQUIRED"
  | "VIRTUAL";

export type ProfileRemnantOutputStatus =
  | "PLANNED"
  | "CREATED"
  | "DISCARDED";

export type ProfileUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type ProfileMaterialSummary = {
  code: string;
  id: string;
  name: string;
  standardLengthMm: number | null;
};

export type ProfileQuotationSummary = {
  code: string;
  id: string;
  status: string;
} | null;

export type ProfileProjectSummary = {
  code: string;
  id: string;
  title: string;
} | null;

export type ProfileOptimizationCutInput = {
  label: string;
  lengthMm: number;
  materialId: string;
  metadata: Record<string, unknown> | null;
  quotationItemId: string | null;
  quantity: number;
};

export type ProfileRequirementGroup = {
  cuts: ProfileOptimizationCutInput[];
  material: ProfileMaterialSummary;
  materialId: string;
  totalCuts: number;
  totalRequiredLengthMm: number;
};

export type ProfileRequirementCollection = {
  groups: ProfileRequirementGroup[];
  warnings: string[];
};

export type ProfileOptimizationBarCut = {
  cutId: string;
  label: string;
  lengthMm: number;
  materialId: string;
  metadata: unknown;
  positionMm: number;
  quotationItemId: string | null;
};

export type ProfileOptimizationBarResult = {
  cuts: ProfileOptimizationBarCut[];
  inventoryStockId: string | null;
  originalLengthMm: number;
  remnantOutput: {
    remainingLengthMm: number;
    shouldCreateRemnant: boolean;
  };
  remnantPieceId: string | null;
  sourceCode: string | null;
  sourceType: ProfileCuttingBarSource;
  usedLengthMm: number;
  wasteLengthMm: number;
  wastePercent: number;
};

export type ProfileOptimizationInventoryBarSummary = {
  batchNumber: string | null;
  id: string;
  lengthMm: number;
  locationCode: string | null;
  quantityBars: number;
};

export type ProfileOptimizationRemnantSummary = {
  code: string;
  id: string;
  lengthMm: number;
};

export type ProfileOptimizationPurchaseRequirement = {
  barLengths: Array<{
    lengthMm: number;
    quantity: number;
  }>;
  totalBars: number;
  totalLengthMm: number;
};

export type ProfileOptimizationResult = {
  availableInventoryBars: ProfileOptimizationInventoryBarSummary[];
  availableRemnants: ProfileOptimizationRemnantSummary[];
  bars: ProfileOptimizationBarResult[];
  efficiencyPercent: number;
  generatedAt: string;
  mode: ProfileOptimizationMode;
  purchaseRequirement: ProfileOptimizationPurchaseRequirement | null;
  totals: {
    inventoryLengthMm: number;
    purchasedLengthMm: number;
    remnantLengthMm: number;
    totalBarLengthMm: number;
    totalRequiredLengthMm: number;
    totalWasteLengthMm: number;
    wastePercent: number;
  };
  warnings: string[];
};

export type ProfileCutPieceRecord = {
  createdAt: string;
  cuttingBarId: string;
  id: string;
  label: string;
  lengthMm: number;
  material: ProfileMaterialSummary;
  materialId: string;
  metadataJson: unknown;
  positionMm: number;
  quantity: number;
  quotationItemId: string | null;
};

export type ProfileRemnantOutputRecord = {
  createdAt: string;
  cuttingBarId: string;
  id: string;
  material: ProfileMaterialSummary;
  materialId: string;
  remainingLengthMm: number;
  remnantPieceId: string | null;
  shouldCreateRemnant: boolean;
  status: ProfileRemnantOutputStatus;
};

export type ProfileCuttingBarRecord = {
  createdAt: string;
  cutPieces: ProfileCutPieceRecord[];
  cuttingPlanId: string;
  id: string;
  inventoryStockId: string | null;
  originalLengthMm: number;
  remnantOutputs: ProfileRemnantOutputRecord[];
  remnantPieceId: string | null;
  sortOrder: number;
  sourceType: ProfileCuttingBarSource;
  usedLengthMm: number;
  wasteLengthMm: number;
  wastePercent: number;
};

export type ProfileCuttingPlanSummary = {
  code: string;
  id: string;
  material: ProfileMaterialSummary;
  materialId: string;
  status: ProfileCuttingPlanStatus;
  totalBars: number;
  wastePercent: number;
};

export type ProfileOptimizationRunListItem = {
  code: string;
  createdAt: string;
  createdByUser: ProfileUserSummary;
  id: string;
  material: ProfileMaterialSummary;
  materialId: string;
  mode: ProfileOptimizationMode;
  project: ProfileProjectSummary;
  projectId: string | null;
  quotation: ProfileQuotationSummary;
  quotationId: string | null;
  status: ProfileOptimizationRunStatus;
  totalBarLengthMm: number;
  totalRequiredLengthMm: number;
  totalWasteLengthMm: number;
  updatedAt: string;
  wastePercent: number;
};

export type ProfileOptimizationRunRecord = ProfileOptimizationRunListItem & {
  cuttingPlans: ProfileCuttingPlanSummary[];
  inputJson: {
    cuts: ProfileOptimizationCutInput[];
    materialId: string;
    mode: ProfileOptimizationMode;
    preferRemnants: boolean;
  };
  resultJson: ProfileOptimizationResult | null;
};

export type ProfileCuttingPlanListItem = {
  code: string;
  createdAt: string;
  id: string;
  material: ProfileMaterialSummary;
  materialId: string;
  optimizationRun: Pick<
    ProfileOptimizationRunListItem,
    | "code"
    | "id"
    | "mode"
    | "project"
    | "projectId"
    | "quotation"
    | "quotationId"
    | "status"
  >;
  optimizationRunId: string;
  status: ProfileCuttingPlanStatus;
  totalBars: number;
  totalRequiredLengthMm: number;
  totalWasteLengthMm: number;
  updatedAt: string;
  wastePercent: number;
};

export type ProfileCuttingPlanRecord = ProfileCuttingPlanListItem & {
  bars: ProfileCuttingBarRecord[];
};

export type RunProfileOptimizationInput = {
  cuts: ProfileOptimizationCutInput[];
  materialId: string | null;
  mode: ProfileOptimizationMode;
  preferRemnants?: boolean;
  projectId: string | null;
  quotationId: string | null;
};
