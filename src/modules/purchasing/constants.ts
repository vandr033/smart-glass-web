import {
  formatPurchaseSourceType,
  formatPurchaseStatus,
} from "@/lib/formatters";
import type {
  PurchaseOrderStatus,
  PurchaseRequestItemStatus,
  PurchaseRequestSourceType,
  PurchaseRequestStatus,
  SupplierComparisonStatus,
} from "@/types";

export const PURCHASING_PERMISSIONS = {
  approve: "purchasing.approve",
  compareSuppliers: "purchasing.compare_suppliers",
  create: "purchasing.create",
  createPo: "purchasing.create_po",
  delete: "purchasing.delete",
  read: "purchasing.read",
  receive: "purchasing.receive",
  sendPo: "purchasing.send_po",
  update: "purchasing.update",
  viewCost: "purchasing.view_cost",
} as const;

export const PURCHASING_ROUTES = {
  comparisons: "/purchasing/comparisons",
  comparisonDetail: (comparisonId: string) => `/purchasing/comparisons/${comparisonId}`,
  home: "/purchasing",
  orderDetail: (orderId: string) => `/purchasing/orders/${orderId}`,
  orderReceive: (orderId: string) => `/purchasing/orders/${orderId}/receive`,
  orders: "/purchasing/orders",
  ordersNew: "/purchasing/orders/new",
  receipts: "/purchasing/receipts",
  requestCompare: (requestId: string) => `/purchasing/requests/${requestId}/compare`,
  requestDetail: (requestId: string) => `/purchasing/requests/${requestId}`,
  requests: "/purchasing/requests",
  requestsNew: "/purchasing/requests/new",
} as const;

export const PURCHASING_QUERY_KEYS = {
  comparisonDetail: (comparisonId: string) =>
    ["purchasing", "comparisons", comparisonId] as const,
  comparisons: (params: unknown) => ["purchasing", "comparisons", params] as const,
  dashboard: ["purchasing", "dashboard"] as const,
  orderDetail: (orderId: string) => ["purchasing", "orders", orderId] as const,
  orders: (params: unknown) => ["purchasing", "orders", params] as const,
  receiptDetail: (receiptId: string) => ["purchasing", "receipts", receiptId] as const,
  receipts: (params: unknown) => ["purchasing", "receipts", params] as const,
  requestDetail: (requestId: string) => ["purchasing", "requests", requestId] as const,
  requests: (params: unknown) => ["purchasing", "requests", params] as const,
} as const;

export const PURCHASE_REQUEST_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  APPROVED: formatPurchaseStatus("APPROVED"),
  CANCELLED: formatPurchaseStatus("CANCELLED"),
  CONVERTED_TO_PO: formatPurchaseStatus("CONVERTED_TO_PO"),
  DRAFT: formatPurchaseStatus("DRAFT"),
  PENDING_APPROVAL: formatPurchaseStatus("PENDING_APPROVAL"),
  REJECTED: formatPurchaseStatus("REJECTED"),
};

export const PURCHASE_REQUEST_SOURCE_LABELS: Record<PurchaseRequestSourceType, string> = {
  CUTTING_PLAN: formatPurchaseSourceType("CUTTING_PLAN"),
  INVENTORY_SHORTAGE: formatPurchaseSourceType("INVENTORY_SHORTAGE"),
  MANUAL: formatPurchaseSourceType("MANUAL"),
  PROJECT: formatPurchaseSourceType("PROJECT"),
  QUOTATION: formatPurchaseSourceType("QUOTATION"),
};

export const PURCHASE_REQUEST_ITEM_STATUS_LABELS: Record<
  PurchaseRequestItemStatus,
  string
> = {
  CANCELLED: formatPurchaseStatus("CANCELLED"),
  OPEN: formatPurchaseStatus("OPEN"),
  ORDERED: formatPurchaseStatus("ORDERED"),
  SUPPLIER_SELECTED: formatPurchaseStatus("SUPPLIER_SELECTED"),
};

export const SUPPLIER_COMPARISON_STATUS_LABELS: Record<
  SupplierComparisonStatus,
  string
> = {
  APPROVED: formatPurchaseStatus("APPROVED"),
  CANCELLED: formatPurchaseStatus("CANCELLED"),
  COMPLETED: formatPurchaseStatus("COMPLETED"),
  DRAFT: formatPurchaseStatus("DRAFT"),
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  CANCELLED: formatPurchaseStatus("CANCELLED"),
  CONFIRMED: formatPurchaseStatus("CONFIRMED"),
  DRAFT: formatPurchaseStatus("DRAFT"),
  PARTIALLY_RECEIVED: formatPurchaseStatus("PARTIALLY_RECEIVED"),
  RECEIVED: formatPurchaseStatus("RECEIVED"),
  SENT: formatPurchaseStatus("SENT"),
};
