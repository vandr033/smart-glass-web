import {
  formatQuotationApprovalType,
  formatQuotationItemType,
  formatQuotationStatus,
  formatStatusLabel,
} from "@/lib/formatters";
import type {
  QuotationApprovalStatus,
  QuotationApprovalType,
  QuotationItemType,
  QuotationStatus,
  QuotationVersionStatus,
} from "@/types";

export const QUOTATIONS_PERMISSIONS = {
  approve: "quotations.approve",
  create: "quotations.create",
  delete: "quotations.delete",
  exportPdf: "quotations.export_pdf",
  overrideCost: "quotations.override_cost",
  read: "quotations.read",
  send: "quotations.send",
  update: "quotations.update",
  viewCost: "quotations.view_cost",
} as const;

export const QUOTATIONS_ROUTES = {
  approvals: "/admin/quotations/approvals",
  builder: (quotationId: string) => `/admin/quotations/${quotationId}/builder`,
  create: "/admin/quotations/new",
  edit: (quotationId: string) => `/admin/quotations/${quotationId}/edit`,
  list: "/admin/quotations",
  preview: (quotationId: string) => `/admin/quotations/${quotationId}/preview`,
  versions: (quotationId: string) => `/admin/quotations/${quotationId}/versions`,
  view: (quotationId: string) => `/admin/quotations/${quotationId}`,
} as const;

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  ACCEPTED: formatQuotationStatus("ACCEPTED"),
  APPROVED: formatQuotationStatus("APPROVED"),
  CANCELLED: formatQuotationStatus("CANCELLED"),
  DRAFT: formatQuotationStatus("DRAFT"),
  EXPIRED: formatQuotationStatus("EXPIRED"),
  PENDING_APPROVAL: formatQuotationStatus("PENDING_APPROVAL"),
  REJECTED: formatQuotationStatus("REJECTED"),
  SENT: formatQuotationStatus("SENT"),
};

export const QUOTATION_STATUS_BADGE_CLASS_NAMES: Record<QuotationStatus, string> = {
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  APPROVED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-stone-200 text-stone-700",
  DRAFT: "bg-sky-100 text-sky-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  PENDING_APPROVAL: "bg-violet-100 text-violet-800",
  REJECTED: "bg-rose-100 text-rose-800",
  SENT: "bg-cyan-100 text-cyan-800",
};

export const QUOTATION_VERSION_STATUS_LABELS: Record<
  QuotationVersionStatus,
  string
> = {
  ACTIVE: formatStatusLabel("ACTIVE"),
  ARCHIVED: formatStatusLabel("ARCHIVED"),
  DRAFT: formatStatusLabel("DRAFT"),
};

export const QUOTATION_ITEM_TYPE_LABELS: Record<QuotationItemType, string> = {
  DISCOUNT: formatQuotationItemType("DISCOUNT"),
  MANUAL_MATERIAL: formatQuotationItemType("MANUAL_MATERIAL"),
  MANUAL_SERVICE: formatQuotationItemType("MANUAL_SERVICE"),
  NOTE: formatQuotationItemType("NOTE"),
  TEMPLATE_PRODUCT: formatQuotationItemType("TEMPLATE_PRODUCT"),
};

export const QUOTATION_APPROVAL_TYPE_LABELS: Record<QuotationApprovalType, string> = {
  HIGH_DISCOUNT: formatQuotationApprovalType("HIGH_DISCOUNT"),
  LOW_MARGIN: formatQuotationApprovalType("LOW_MARGIN"),
  MANUAL_REVIEW: formatQuotationApprovalType("MANUAL_REVIEW"),
  PRICE_EXCEPTION: formatQuotationApprovalType("PRICE_EXCEPTION"),
};

export const QUOTATION_APPROVAL_STATUS_LABELS: Record<
  QuotationApprovalStatus,
  string
> = {
  APPROVED: formatStatusLabel("APPROVED"),
  CANCELLED: formatStatusLabel("CANCELLED"),
  PENDING: formatStatusLabel("PENDING"),
  REJECTED: formatStatusLabel("REJECTED"),
};

export const QUOTATIONS_QUERY_KEYS = {
  approvals: (quotationId: string) => ["quotations", quotationId, "approvals"] as const,
  detail: (quotationId: string) => ["quotations", "detail", quotationId] as const,
  list: (params: unknown) => ["quotations", "list", params] as const,
  pendingApprovals: ["quotations", "pending-approvals"] as const,
  versions: (quotationId: string) => ["quotations", quotationId, "versions"] as const,
} as const;
