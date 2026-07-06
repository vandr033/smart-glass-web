import type { LogJsonValue } from "./logs";
import type { MaterialUnit } from "./materials";

export type PurchaseRequestStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CONVERTED_TO_PO"
  | "CANCELLED";

export type PurchaseRequestSourceType =
  | "QUOTATION"
  | "PROJECT"
  | "CUTTING_PLAN"
  | "INVENTORY_SHORTAGE"
  | "MANUAL";

export type PurchaseRequestItemStatus =
  | "OPEN"
  | "SUPPLIER_SELECTED"
  | "ORDERED"
  | "CANCELLED";

export type SupplierComparisonStatus =
  | "DRAFT"
  | "COMPLETED"
  | "APPROVED"
  | "CANCELLED";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type PurchasingUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type PurchasingSupplierSummary = {
  code: string | null;
  commercialName: string | null;
  creditAvailable: boolean;
  defaultLeadTimeDays: number | null;
  id: string;
  legalName: string;
  preferenceScore: number | null;
  reliabilityScore: number | null;
} | null;

export type PurchasingMaterialSummary = {
  code: string;
  id: string;
  materialType: "LINEAR" | "PACKAGE" | "SERVICE" | "SHEET" | "UNIT";
  name: string;
  purchaseUnit: MaterialUnit;
  stockUnit: MaterialUnit;
};

export type PurchasingWarehouseSummary = {
  code: string;
  id: string;
  name: string;
} | null;

export type PurchaseRequestTotals = {
  estimatedSubtotal: number | null;
  itemCount: number;
  selectedSupplierCount: number;
};

export type PurchaseRequestItemRecord = {
  createdAt: string;
  description: string | null;
  estimatedTotalCost: number | null;
  estimatedUnitCost: number | null;
  id: string;
  material: PurchasingMaterialSummary;
  materialId: string;
  metadataJson: LogJsonValue | null;
  preferredSupplier: PurchasingSupplierSummary;
  preferredSupplierId: string | null;
  purchaseRequestId: string;
  quantity: number;
  requiredDate: string | null;
  selectedSupplier: PurchasingSupplierSummary;
  selectedSupplierId: string | null;
  status: PurchaseRequestItemStatus;
  unit: MaterialUnit;
  updatedAt: string;
};

export type PurchaseRequestListItem = {
  approvedAt: string | null;
  approvedByUser: PurchasingUserSummary;
  code: string;
  createdAt: string;
  id: string;
  notes: string | null;
  requestedByUser: PurchasingUserSummary;
  sourceId: string | null;
  sourceReferenceLabel: string | null;
  sourceType: PurchaseRequestSourceType;
  status: PurchaseRequestStatus;
  totals: PurchaseRequestTotals;
  updatedAt: string;
};

export type PurchaseRequestRecord = PurchaseRequestListItem & {
  deletedAt: string | null;
  items: PurchaseRequestItemRecord[];
};

export type PurchasingComparisonScoreBreakdown = {
  contribution: number;
  criterionId: string;
  criterionKey: string;
  criterionLabel: string;
  normalizedScore: number;
  weight: number;
};

export type SupplierComparisonOptionRecord = {
  availableCredit: boolean | null;
  comparisonId: string;
  createdAt: string;
  deliveryDays: number | null;
  finalScore: number | null;
  id: string;
  isSelected: boolean;
  material: PurchasingMaterialSummary;
  materialId: string;
  purchaseRequestItemId: string;
  scoreBreakdownJson: PurchasingComparisonScoreBreakdown[] | LogJsonValue | null;
  supplier: PurchasingSupplierSummary;
  supplierId: string;
  supplierScore: number | null;
  totalPrice: number | null;
  unitPrice: number | null;
  updatedAt: string;
};

export type SupplierComparisonListItem = {
  approvedAt: string | null;
  approvedByUser: PurchasingUserSummary;
  createdAt: string;
  createdByUser: PurchasingUserSummary;
  id: string;
  purchaseRequest: Pick<
    PurchaseRequestListItem,
    "code" | "id" | "sourceType" | "status"
  >;
  scoringConfig: {
    id: string;
    name: string;
  } | null;
  selectedSuppliersCount: number;
  status: SupplierComparisonStatus;
  updatedAt: string;
};

export type PurchasingComparisonStrategy =
  | "best_weighted_score_per_item"
  | "single_supplier";

export type PurchasingSingleSupplierCandidate = {
  averageScore: number;
  supplierId: string;
  totalPrice: number | null;
};

export type PurchasingComparisonResult = {
  bestPricePerItem: Record<string, string | null>;
  bestWeightedScorePerItem: Record<string, string | null>;
  selectedStrategy: PurchasingComparisonStrategy;
  singleSupplierOptions: PurchasingSingleSupplierCandidate[];
  warnings: string[];
};

export type PurchasingSelectedCombination = {
  selectedOptionIds: string[];
  selectedStrategy: PurchasingComparisonStrategy;
  supplierIds: string[];
};

export type SupplierComparisonRecord = SupplierComparisonListItem & {
  options: SupplierComparisonOptionRecord[];
  purchaseRequestDetail: PurchaseRequestRecord;
  resultJson: PurchasingComparisonResult | LogJsonValue | null;
  selectedCombinationJson: PurchasingSelectedCombination | LogJsonValue | null;
};

export type PurchaseOrderItemRecord = {
  createdAt: string;
  description: string | null;
  id: string;
  material: PurchasingMaterialSummary;
  materialId: string;
  metadataJson: LogJsonValue | null;
  purchaseOrderId: string;
  quantity: number;
  receivedQuantity: number;
  totalPrice: number | null;
  unit: MaterialUnit;
  unitPrice: number | null;
  updatedAt: string;
};

export type PurchaseOrderListItem = {
  code: string;
  createdAt: string;
  createdByUser: PurchasingUserSummary;
  currency: string;
  discountAmount: number | null;
  expectedDeliveryDate: string | null;
  id: string;
  itemCount: number;
  notes: string | null;
  orderDate: string;
  purchaseRequest: {
    code: string;
    id: string;
  } | null;
  purchaseRequestId: string | null;
  status: PurchaseOrderStatus;
  subtotal: number | null;
  supplier: PurchasingSupplierSummary;
  supplierId: string;
  taxAmount: number | null;
  total: number | null;
  updatedAt: string;
};

export type PurchaseOrderRecord = PurchaseOrderListItem & {
  confirmedAt: string | null;
  deletedAt: string | null;
  items: PurchaseOrderItemRecord[];
  receipts: Array<{
    code: string;
    id: string;
    receivedAt: string;
    warehouse: PurchasingWarehouseSummary;
  }>;
  sentAt: string | null;
};

export type PurchaseReceiptItemRecord = {
  batchNumber: string | null;
  createdAt: string;
  id: string;
  locationCode: string | null;
  material: PurchasingMaterialSummary;
  materialId: string;
  notes: string | null;
  purchaseOrderItemId: string;
  purchaseReceiptId: string;
  receivedQuantity: number;
  unit: MaterialUnit;
  updatedAt: string;
};

export type PurchaseReceiptListItem = {
  code: string;
  createdAt: string;
  id: string;
  itemCount: number;
  purchaseOrder: {
    code: string;
    id: string;
    status: PurchaseOrderStatus;
  };
  purchaseOrderId: string;
  receivedAt: string;
  receivedByUser: PurchasingUserSummary;
  supplier: PurchasingSupplierSummary;
  warehouse: PurchasingWarehouseSummary;
  warehouseId: string;
};

export type PurchaseReceiptRecord = PurchaseReceiptListItem & {
  items: PurchaseReceiptItemRecord[];
  notes: string | null;
};

export type PurchasingDashboardRecord = {
  delayedExpectedDeliveries: PurchaseOrderListItem[];
  openPurchaseOrders: number;
  partialPurchaseOrders: PurchaseOrderListItem[];
  pendingApprovals: number;
  pendingPurchaseRequests: number;
  recentReceipts: PurchaseReceiptListItem[];
};

export type PurchaseRequestItemInput = {
  description: string | null;
  estimatedUnitCost?: number | null;
  id?: string;
  materialId: string;
  metadataJson?: LogJsonValue | null;
  preferredSupplierId?: string | null;
  quantity: number;
  requiredDate?: string | null;
  selectedSupplierId?: string | null;
  status?: PurchaseRequestItemStatus;
  unit: MaterialUnit;
};

export type CreatePurchaseRequestInput = {
  items: PurchaseRequestItemInput[];
  notes: string | null;
  sourceId: string | null;
  sourceType: PurchaseRequestSourceType;
};

export type UpdatePurchaseRequestInput = Partial<CreatePurchaseRequestInput>;

export type CreateInventoryShortagePurchaseRequestInput = {
  materialIds: string[];
  notes: string | null;
};

export type PurchaseRequestDecisionInput = {
  notes: string | null;
};

export type SupplierComparisonRunInput = {
  scoringConfigId?: string | null;
};

export type SupplierComparisonApprovalInput = {
  notes?: string | null;
};

export type CreatePurchaseOrderItemInput = {
  description: string | null;
  id?: string;
  materialId: string;
  metadataJson?: LogJsonValue | null;
  quantity: number;
  unit: MaterialUnit;
  unitPrice: number;
};

export type CreatePurchaseOrderInput = {
  currency: string;
  discountAmount: number;
  expectedDeliveryDate: string | null;
  items: CreatePurchaseOrderItemInput[];
  notes: string | null;
  orderDate: string | null;
  purchaseRequestId?: string | null;
  supplierId: string;
  taxAmount: number;
};

export type UpdatePurchaseOrderInput = Partial<
  Omit<CreatePurchaseOrderInput, "purchaseRequestId" | "supplierId">
>;

export type PurchaseOrderStatusNoteInput = {
  notes: string | null;
};

export type PurchaseReceiptItemInput = {
  batchNumber: string | null;
  heightMm?: number | null;
  lengthMm?: number | null;
  locationCode: string | null;
  notes: string | null;
  purchaseOrderItemId: string;
  receivedQuantity: number;
  thicknessMm?: number | null;
  widthMm?: number | null;
};

export type ReceivePurchaseOrderInput = {
  items: PurchaseReceiptItemInput[];
  notes: string | null;
  receivedAt: string | null;
  warehouseId: string;
};
