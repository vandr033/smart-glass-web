import type { LogJsonValue } from "./logs";
import type { MaterialType, MaterialUnit } from "./materials";

export type ProductTemplateType =
  | "WINDOW"
  | "DOOR"
  | "SHOWER"
  | "FACADE"
  | "RAILING"
  | "MIRROR"
  | "CUSTOM"
  | "SERVICE";

export type ProductTemplateStatus =
  | "DRAFT"
  | "ACTIVE"
  | "INACTIVE"
  | "ARCHIVED";

export type ProductTemplateVersionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ARCHIVED";

export type ProductTemplateInputType =
  | "NUMBER"
  | "TEXT"
  | "SELECT"
  | "BOOLEAN"
  | "MATERIAL_SELECT";

export type ProductTemplateMaterialRuleType =
  | "LINEAR_CUT"
  | "SHEET_CUT"
  | "UNIT_QUANTITY"
  | "PACKAGE_QUANTITY"
  | "SERVICE_COST";

export type ProductTemplateLaborType =
  | "FABRICATION"
  | "INSTALLATION"
  | "TRANSPORT"
  | "OTHER";

export type ProductTemplateUserSummary = {
  email: string;
  id: string;
  name: string;
};

export type ProductTemplateMaterialSummary = {
  code: string;
  consumptionUnit: MaterialUnit;
  defaultWastePercent: number | null;
  id: string;
  materialType: MaterialType;
  name: string;
  thicknessMm: number | null;
};

export type ProductTemplateValidationResult = {
  errors: string[];
  isValid: boolean;
  warnings: string[];
};

export type ProductTemplateVersionSummary = {
  activatedAt: string | null;
  createdAt: string;
  description: string | null;
  id: string;
  name: string;
  notes: string | null;
  status: ProductTemplateVersionStatus;
  updatedAt: string;
  versionNumber: number;
};

export type ProductTemplateListItem = {
  code: string;
  createdAt: string;
  createdByUser: ProductTemplateUserSummary | null;
  currentVersion: ProductTemplateVersionSummary | null;
  currentVersionId: string | null;
  description: string | null;
  id: string;
  name: string;
  productType: ProductTemplateType;
  status: ProductTemplateStatus;
  updatedAt: string;
};

export type ProductTemplateInputRecord = {
  createdAt: string;
  defaultValueJson: LogJsonValue | null;
  id: string;
  inputType: ProductTemplateInputType;
  isRequired: boolean;
  key: string;
  label: string;
  optionsJson: LogJsonValue | null;
  sortOrder: number;
  unit: string | null;
  updatedAt: string;
  validationJson: LogJsonValue | null;
  versionId: string;
};

export type ProductTemplateMaterialRuleRecord = {
  allowRemnantUse: boolean;
  allowRotation: boolean;
  createdAt: string;
  formulaJson: LogJsonValue;
  id: string;
  isActive: boolean;
  label: string;
  material: ProductTemplateMaterialSummary;
  materialId: string;
  ruleType: ProductTemplateMaterialRuleType;
  sortOrder: number;
  updatedAt: string;
  versionId: string;
  wastePercent: number | null;
};

export type ProductTemplateAccessoryRuleRecord = {
  createdAt: string;
  id: string;
  isActive: boolean;
  isOptional: boolean;
  label: string;
  material: ProductTemplateMaterialSummary;
  materialId: string;
  quantityFormulaJson: LogJsonValue;
  sortOrder: number;
  updatedAt: string;
  versionId: string;
};

export type ProductTemplateLaborRuleRecord = {
  createdAt: string;
  formulaJson: LogJsonValue;
  id: string;
  isActive: boolean;
  label: string;
  laborType: ProductTemplateLaborType;
  sortOrder: number;
  unitCost: number | null;
  updatedAt: string;
  versionId: string;
};

export type ProductTemplateDetailRecord = ProductTemplateListItem & {
  deletedAt: string | null;
  versions: ProductTemplateVersionSummary[];
};

export type ProductTemplateVersionDetailRecord = {
  accessoryRules: ProductTemplateAccessoryRuleRecord[];
  activatedAt: string | null;
  calculationRulesJson: LogJsonValue | null;
  createdAt: string;
  createdByUser: ProductTemplateUserSummary | null;
  defaultMarginPercent: number | null;
  defaultWastePercent: number | null;
  description: string | null;
  id: string;
  inputSchemaJson: LogJsonValue;
  inputs: ProductTemplateInputRecord[];
  installationRulesJson: LogJsonValue | null;
  laborRules: ProductTemplateLaborRuleRecord[];
  laborRulesJson: LogJsonValue | null;
  materialRules: ProductTemplateMaterialRuleRecord[];
  name: string;
  notes: string | null;
  status: ProductTemplateVersionStatus;
  template: Pick<
    ProductTemplateListItem,
    | "code"
    | "currentVersionId"
    | "description"
    | "id"
    | "name"
    | "productType"
    | "status"
  >;
  templateId: string;
  updatedAt: string;
  validation: ProductTemplateValidationResult;
  versionNumber: number;
};

export type ProductTemplateSimulationLinearCut = {
  allowRemnantUse: boolean;
  cutPieces: Array<{
    lengthMm: number;
  }>;
  label: string;
  materialId: string;
  quantity: number;
  requiredLengthMm: number;
  wastePercent: number;
};

export type ProductTemplateSimulationSheetCut = {
  allowRotation: boolean;
  label: string;
  materialId: string;
  quantity: number;
  requiredHeightMm: number;
  requiredWidthMm: number;
  sheetPieces: Array<{
    heightMm: number;
    widthMm: number;
  }>;
  thicknessMm: number | null;
  wastePercent: number;
};

export type ProductTemplateSimulationMaterialBreakdown = {
  estimatedCost: number;
  estimatedUnitCost: number | null;
  estimatedWasteQuantity: number;
  materialCode: string;
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  ruleType: ProductTemplateMaterialRuleType;
  unit: MaterialUnit | string;
  wastePercent: number;
};

export type ProductTemplateSimulationLaborBreakdown = {
  label: string;
  laborType: ProductTemplateLaborType;
  quantity: number;
  totalCost: number;
  unitCost: number;
};

export type ProductTemplateSimulationResult = {
  cuts: {
    linear: ProductTemplateSimulationLinearCut[];
    sheets: ProductTemplateSimulationSheetCut[];
  };
  inputs: Record<string, LogJsonValue>;
  labor: ProductTemplateSimulationLaborBreakdown[];
  laborCost: number;
  marginPercent: number;
  materials: ProductTemplateSimulationMaterialBreakdown[];
  subtotalCost: number;
  suggestedSalePrice: number;
  totalCost: number;
  warnings: string[];
  wasteCost: number;
};

export type ProductTemplateSimulationRecord = {
  createdAt: string;
  id: string;
  inputValuesJson: Record<string, LogJsonValue>;
  resultJson: ProductTemplateSimulationResult;
  simulatedByUser: ProductTemplateUserSummary | null;
  versionId: string;
};

export type ProductTemplateCreateInput = {
  code: string;
  description: string | null;
  initialVersion?: {
    defaultMarginPercent: number | null;
    defaultWastePercent: number | null;
    description: string | null;
    name: string;
    notes: string | null;
    status: ProductTemplateVersionStatus;
  };
  name: string;
  productType: ProductTemplateType;
  status: ProductTemplateStatus;
};

export type ProductTemplateUpdateInput = {
  code: string;
  description: string | null;
  name: string;
  productType: ProductTemplateType;
  status: ProductTemplateStatus;
};

export type ProductTemplateVersionCreateInput = {
  defaultMarginPercent: number | null;
  defaultWastePercent: number | null;
  description: string | null;
  duplicateFromVersionId: string | null;
  name: string;
  notes: string | null;
  status: ProductTemplateVersionStatus;
};

export type ProductTemplateVersionUpdateInput = {
  defaultMarginPercent: number | null;
  defaultWastePercent: number | null;
  description: string | null;
  name: string;
  notes: string | null;
  status: ProductTemplateVersionStatus;
};

export type ProductTemplateRulesUpdateInput = {
  accessoryRules: Array<{
    isActive: boolean;
    isOptional: boolean;
    label: string;
    materialId: string;
    quantityFormulaJson: LogJsonValue;
    sortOrder: number;
  }>;
  inputs: Array<{
    defaultValueJson: LogJsonValue | null;
    inputType: ProductTemplateInputType;
    isRequired: boolean;
    key: string;
    label: string;
    optionsJson: LogJsonValue | null;
    sortOrder: number;
    unit: string | null;
    validationJson: LogJsonValue | null;
  }>;
  laborRules: Array<{
    formulaJson: LogJsonValue;
    isActive: boolean;
    label: string;
    laborType: ProductTemplateLaborType;
    sortOrder: number;
    unitCost: number | null;
  }>;
  materialRules: Array<{
    allowRemnantUse: boolean;
    allowRotation: boolean;
    formulaJson: LogJsonValue;
    isActive: boolean;
    label: string;
    materialId: string;
    ruleType: ProductTemplateMaterialRuleType;
    sortOrder: number;
    wastePercent: number | null;
  }>;
};
