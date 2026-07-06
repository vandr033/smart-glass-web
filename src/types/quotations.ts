export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type QuotationVersionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type QuotationItemType =
  | "TEMPLATE_PRODUCT"
  | "MANUAL_MATERIAL"
  | "MANUAL_SERVICE"
  | "DISCOUNT"
  | "NOTE";

export type QuotationApprovalType =
  | "LOW_MARGIN"
  | "HIGH_DISCOUNT"
  | "MANUAL_REVIEW"
  | "PRICE_EXCEPTION";

export type QuotationApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type QuotationUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type QuotationClientSummary = {
  clientType: "COMPANY" | "INDIVIDUAL";
  displayName: string;
  id: string;
};

export type QuotationProjectSummary = {
  code: string;
  id: string;
  title: string;
} | null;

export type QuotationMeasurementRequestSummary = {
  code: string;
  id: string;
  status: string;
} | null;

export type QuotationItemMaterialRecord = {
  createdAt: string;
  id: string;
  materialCode: string | null;
  materialId: string | null;
  materialName: string;
  metadataJson: unknown;
  requiredQuantity: number;
  ruleType:
    | "LINEAR_CUT"
    | "SHEET_CUT"
    | "UNIT_QUANTITY"
    | "PACKAGE_QUANTITY"
    | "SERVICE_COST"
    | "MANUAL";
  source: "TEMPLATE" | "MANUAL" | "PRICE_LIST";
  supplierId: string | null;
  totalCost: number | null;
  unit: string;
  unitCost: number | null;
  updatedAt: string;
  wastePercent: number | null;
};

export type QuotationItemRecord = {
  calculationResultJson: unknown;
  createdAt: string;
  description: string | null;
  hasManualOverride: boolean;
  id: string;
  inputValuesJson: unknown;
  itemType: QuotationItemType;
  marginPercent: number | null;
  materials: QuotationItemMaterialRecord[];
  name: string;
  productTemplateId: string | null;
  productTemplateVersionId: string | null;
  quantity: number;
  quotationId: string;
  quotationVersionId: string | null;
  sortOrder: number;
  subtotalCost: number | null;
  subtotalSale: number;
  updatedAt: string;
};

export type QuotationApprovalRecord = {
  approvalType: QuotationApprovalType;
  approverUser: QuotationUserSummary;
  createdAt: string;
  decisionNotes: string | null;
  decidedAt: string | null;
  decidedByUser: QuotationUserSummary;
  id: string;
  quotation: {
    client: QuotationClientSummary;
    code: string;
    id: string;
    project: QuotationProjectSummary;
    status: QuotationStatus;
  };
  reason: string;
  requestedByUser: QuotationUserSummary;
  status: QuotationApprovalStatus;
  updatedAt: string;
};

export type QuotationStatusHistoryRecord = {
  changedByUser: QuotationUserSummary;
  createdAt: string;
  fromStatus: QuotationStatus | null;
  id: string;
  notes: string | null;
  toStatus: QuotationStatus;
};

export type QuotationVersionRecord = {
  createdAt: string;
  createdByUser: QuotationUserSummary;
  discountAmount: number;
  id: string;
  itemCount: number;
  marginAmount: number | null;
  marginPercent: number | null;
  snapshotJson: unknown;
  status: QuotationVersionStatus;
  subtotalCost: number | null;
  subtotalSale: number;
  taxAmount: number;
  totalSale: number;
  updatedAt: string;
  versionNumber: number;
};

export type QuotationListItem = {
  approvedAt: string | null;
  approvedByUser: QuotationUserSummary;
  client: QuotationClientSummary;
  code: string;
  createdAt: string;
  createdByUser: QuotationUserSummary;
  currency: string;
  discountAmount: number;
  id: string;
  marginAmount: number | null;
  marginPercent: number | null;
  measurementRequest: QuotationMeasurementRequestSummary;
  project: QuotationProjectSummary;
  status: QuotationStatus;
  subtotalCost: number | null;
  subtotalSale: number;
  taxAmount: number;
  totalSale: number;
  updatedAt: string;
  validUntil: string | null;
};

export type QuotationDetailRecord = QuotationListItem & {
  approvals: QuotationApprovalRecord[];
  deletedAt: string | null;
  exchangeRate: number | null;
  internalNotes: string | null;
  items: QuotationItemRecord[];
  notes: string | null;
  statusHistory: QuotationStatusHistoryRecord[];
  versions: QuotationVersionRecord[];
};

export type QuotationApprovalRequirement = {
  approvalType: QuotationApprovalType;
  reason: string;
};

export type QuotationApprovalEvaluation = {
  discountPercent: number;
  hasManualOverride: boolean;
  maximumDiscountPercent: number;
  minimumMarginPercent: number;
  requirements: QuotationApprovalRequirement[];
  requiresApproval: boolean;
};

export type QuotationMutationInput = {
  clientId: string;
  currency: string;
  discountAmount: number;
  exchangeRate: number | null;
  internalNotes: string | null;
  notes: string | null;
  projectId: string | null;
  taxAmount: number;
  validUntil: string | null;
};

export type AddTemplateQuotationItemInput = {
  inputValues: Record<string, unknown>;
  name: string;
  productTemplateVersionId: string;
  quantity: number;
};

export type AddManualMaterialQuotationItemInput = {
  description: string | null;
  marginPercent: number | null;
  materialId: string;
  name: string | null;
  quantity: number;
  supplierId: string | null;
  unit: string;
  unitCost: number;
  unitSalePrice: number | null;
};

export type AddManualServiceQuotationItemInput = {
  description: string | null;
  marginPercent: number | null;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  unitSalePrice: number | null;
};

export type UpdateQuotationItemInput = {
  clearManualOverride?: boolean;
  description?: string | null;
  inputValues?: Record<string, unknown> | null;
  marginPercent?: number | null;
  materialId?: string | null;
  name?: string | null;
  quantity?: number;
  sortOrder?: number | null;
  supplierId?: string | null;
  unit?: string | null;
  unitCost?: number | null;
  unitSalePrice?: number | null;
};

export type SubmitQuotationApprovalInput = {
  forceManualReview?: boolean;
  reason?: string | null;
};

export type QuotationDecisionInput = {
  decisionNotes?: string | null;
};

export type ChangeQuotationStatusInput = {
  notes?: string | null;
  toStatus: QuotationStatus;
};

export type QuotationPdfExportTodo = {
  message: string;
  quotationId: string;
  route: string;
};
