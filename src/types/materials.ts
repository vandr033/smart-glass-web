import type { LogJsonValue } from "./logs";

export type MaterialType = "LINEAR" | "SHEET" | "UNIT" | "PACKAGE" | "SERVICE";
export type MaterialUnit =
  | "MM"
  | "CM"
  | "M"
  | "M2"
  | "UNIT"
  | "PACKAGE"
  | "KG"
  | "LITER"
  | "HOUR"
  | "DAY";
export type MaterialStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";
export type SupplierMaterialEquivalenceConfidence =
  | "PENDING"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERIFIED";
export type SupplierMaterialEquivalenceStatus = "ACTIVE" | "INACTIVE" | "IGNORED";

export type MaterialCategorySummary = {
  id: string;
  name: string;
  slug: string;
};

export type SupplierSummary = {
  code: string | null;
  id: string;
  legalName: string;
};

export type MaterialSummary = {
  code: string;
  id: string;
  name: string;
};

export type MaterialCategoryRecord = {
  childrenCount: number;
  createdAt: string;
  description: string | null;
  id: string;
  isActive: boolean;
  materialsCount: number;
  name: string;
  parent: MaterialCategorySummary | null;
  parentId: string | null;
  slug: string;
  sortOrder: number;
  updatedAt: string;
};

export type MaterialAttachmentRecord = {
  createdAt: string;
  fileName: string;
  fileUrl: string;
  id: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export type MaterialDimensionPresetRecord = {
  createdAt: string;
  heightMm: number | null;
  id: string;
  isDefault: boolean;
  label: string;
  lengthMm: number | null;
  materialId: string;
  thicknessMm: number | null;
  updatedAt: string;
  widthMm: number | null;
};

export type MaterialBehaviorIssue = {
  message: string;
  path: string;
};

export type MaterialCuttingProfile = {
  allowsRotation: boolean;
  isCuttable: boolean;
  materialType: MaterialType;
  standardStock: {
    heightMm: number | null;
    lengthMm: number | null;
    widthMm: number | null;
  } | null;
  strategy: "linear" | "none" | "sheet";
  usesLength: boolean;
  usesThickness: boolean;
  usesWidth: boolean;
};

export type MaterialRemnantRules = {
  eligible: boolean;
  minimumReusableHeightMm: number | null;
  minimumReusableLengthMm: number | null;
  minimumReusableWidthMm: number | null;
  strategy: "linear" | "none" | "sheet";
};

export type MaterialListItem = {
  allowsRotation: boolean;
  baseUnit: MaterialUnit;
  brand: string | null;
  category: MaterialCategorySummary;
  categoryId: string;
  code: string;
  color: string | null;
  consumptionUnit: MaterialUnit;
  createdAt: string;
  defaultWastePercent: number | null;
  description: string | null;
  finish: string | null;
  id: string;
  isCuttable: boolean;
  isPurchasable: boolean;
  isRemnantEligible: boolean;
  isSellable: boolean;
  isStockable: boolean;
  materialType: MaterialType;
  name: string;
  purchaseUnit: MaterialUnit;
  standardLengthMm: number | null;
  standardWidthMm: number | null;
  status: MaterialStatus;
  stockUnit: MaterialUnit;
  thicknessMm: number | null;
  updatedAt: string;
};

export type MaterialDetailRecord = MaterialListItem & {
  attachments: MaterialAttachmentRecord[];
  behaviorValidation: {
    errors: MaterialBehaviorIssue[];
    warnings: MaterialBehaviorIssue[];
  };
  cuttingProfile: MaterialCuttingProfile;
  deletedAt: string | null;
  minimumReusableHeightMm: number | null;
  minimumReusableLengthMm: number | null;
  minimumReusableWidthMm: number | null;
  notes: string | null;
  remnantRules: MaterialRemnantRules;
  standardHeightMm: number | null;
  unitConversionJson: LogJsonValue | null;
};

export type SupplierMaterialEquivalenceRecord = {
  confidence: SupplierMaterialEquivalenceConfidence;
  conversionFactor: number | null;
  createdAt: string;
  id: string;
  material: MaterialSummary | null;
  materialId: string | null;
  notes: string | null;
  status: SupplierMaterialEquivalenceStatus;
  supplier: SupplierSummary;
  supplierDescription: string | null;
  supplierId: string;
  supplierName: string;
  supplierSku: string | null;
  supplierUnit: string | null;
  updatedAt: string;
};

export type MaterialCategoryMutationInput = {
  description: string | null;
  isActive: boolean;
  name: string;
  parentId: string | null;
  sortOrder: number;
};

export type MaterialMutationInput = {
  allowsRotation: boolean;
  baseUnit: MaterialUnit;
  brand: string | null;
  categoryId: string;
  code: string;
  color: string | null;
  consumptionUnit: MaterialUnit;
  defaultWastePercent: number | null;
  description: string | null;
  finish: string | null;
  isCuttable: boolean;
  isPurchasable: boolean;
  isRemnantEligible: boolean;
  isSellable: boolean;
  isStockable: boolean;
  materialType: MaterialType;
  minimumReusableHeightMm: number | null;
  minimumReusableLengthMm: number | null;
  minimumReusableWidthMm: number | null;
  name: string;
  notes: string | null;
  purchaseUnit: MaterialUnit;
  standardHeightMm: number | null;
  standardLengthMm: number | null;
  standardWidthMm: number | null;
  status: MaterialStatus;
  stockUnit: MaterialUnit;
  thicknessMm: number | null;
  unitConversionJson: LogJsonValue | null;
};

export type MaterialDimensionPresetInput = {
  heightMm: number | null;
  isDefault: boolean;
  label: string;
  lengthMm: number | null;
  thicknessMm: number | null;
  widthMm: number | null;
};

export type SupplierMaterialEquivalenceInput = {
  confidence: SupplierMaterialEquivalenceConfidence;
  conversionFactor: number | null;
  materialId: string | null;
  notes: string | null;
  status: SupplierMaterialEquivalenceStatus;
  supplierDescription: string | null;
  supplierId: string;
  supplierName: string;
  supplierSku: string | null;
  supplierUnit: string | null;
};

export type MapSupplierMaterialEquivalenceInput = {
  materialId: string;
};
