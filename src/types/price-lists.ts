export type PriceListImportStatus =
  | "UPLOADED"
  | "PARSED"
  | "NEEDS_MAPPING"
  | "VALIDATED"
  | "APPROVED"
  | "REJECTED"
  | "FAILED";

export type PriceListSourceType = "EXCEL" | "CSV";

export type PriceListRowMappingStatus =
  | "UNMAPPED"
  | "AUTO_MAPPED"
  | "MANUAL_MAPPED"
  | "IGNORED"
  | "ERROR";

export type PriceListRowValidationStatus = "PENDING" | "VALID" | "INVALID";

export type PriceListSupplierSummary = {
  code: string | null;
  id: string;
  legalName: string;
};

export type PriceListUserSummary = {
  email: string;
  id: string;
  name: string;
};

export type PriceListMaterialSummary = {
  code: string;
  id: string;
  name: string;
};

export type PriceListSupplierMaterialEquivalenceSummary = {
  confidence: "PENDING" | "LOW" | "MEDIUM" | "HIGH" | "VERIFIED";
  id: string;
  materialId: string | null;
  supplierName: string;
  supplierSku: string | null;
};

export type PriceListImportRecord = {
  approvedAt: string | null;
  approvedByUser: PriceListUserSummary | null;
  createdAt: string;
  currency: string;
  errorMessage: string | null;
  fileName: string;
  fileUrl: string | null;
  id: string;
  importedByUser: PriceListUserSummary;
  mappedCount: number;
  mimeType: string | null;
  rowCount: number;
  sizeBytes: number | null;
  sourceType: PriceListSourceType;
  status: PriceListImportStatus;
  supplier: PriceListSupplierSummary;
  supplierId: string;
  unmappedCount: number;
  updatedAt: string;
};

export type PriceListImportDetailRecord = PriceListImportRecord & {
  ignoredCount: number;
  invalidCount: number;
};

export type PriceListImportRowRecord = {
  createdAt: string;
  currency: string | null;
  detectedMaterial: PriceListMaterialSummary | null;
  detectedMaterialId: string | null;
  id: string;
  importId: string;
  mappingStatus: PriceListRowMappingStatus;
  normalizedPrice: number | null;
  rawJson: Record<string, unknown>;
  rawPrice: string | null;
  rowNumber: number;
  supplierDescription: string | null;
  supplierMaterialEquivalence: PriceListSupplierMaterialEquivalenceSummary | null;
  supplierMaterialEquivalenceId: string | null;
  supplierName: string;
  supplierSku: string | null;
  supplierUnit: string | null;
  updatedAt: string;
  validationMessage: string | null;
  validationStatus: PriceListRowValidationStatus;
};

export type SupplierMaterialPriceRecord = {
  conversionFactor: number | null;
  createdAt: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  id: string;
  import: Pick<PriceListImportRecord, "createdAt" | "fileName" | "id" | "status"> | null;
  importId: string | null;
  isCurrent: boolean;
  material: PriceListMaterialSummary;
  materialId: string;
  normalizedUnit: string | null;
  price: number;
  supplier: PriceListSupplierSummary;
  supplierId: string;
  supplierMaterialEquivalenceId: string | null;
  supplierUnit: string | null;
  updatedAt: string;
};

export type MaterialSupplierPriceRecord = Omit<
  SupplierMaterialPriceRecord,
  "material" | "materialId"
>;

export type SupplierMaterialPriceListRecord = Omit<
  SupplierMaterialPriceRecord,
  "supplier" | "supplierId"
>;

export type PriceChangeLogRecord = {
  changePercent: number | null;
  createdAt: string;
  id: string;
  import: Pick<PriceListImportRecord, "createdAt" | "fileName" | "id" | "status"> | null;
  importId: string | null;
  material: PriceListMaterialSummary;
  materialId: string;
  newCurrency: string;
  newPrice: number;
  oldCurrency: string | null;
  oldPrice: number | null;
  supplier: PriceListSupplierSummary;
  supplierId: string;
};

export type PriceListApprovalResult = {
  appliedPricesCount: number;
  changeLogsCount: number;
  import: PriceListImportDetailRecord;
};

export type ImportPriceListInput = {
  currency: string;
  file: File;
  supplierId: string;
};

export type ListPriceListImportsParams = {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: "approvedAt" | "createdAt" | "fileName" | "status";
  sortDirection?: "asc" | "desc";
  status?: PriceListImportStatus;
  supplierId?: string;
};

export type ListPriceListImportRowsParams = {
  attentionOnly?: boolean;
  mappingStatus?: PriceListRowMappingStatus;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: "mappingStatus" | "price" | "rowNumber" | "supplierName" | "validationStatus";
  sortDirection?: "asc" | "desc";
  validationStatus?: PriceListRowValidationStatus;
};

export type MapPriceListImportRowInput = {
  confidence?: "PENDING" | "LOW" | "MEDIUM" | "HIGH" | "VERIFIED";
  conversionFactor: number | null;
  createOrUpdateEquivalence?: boolean;
  materialId: string;
  notes: string | null;
};

export type ListPriceHistoryParams = {
  dateFrom?: string;
  dateTo?: string;
  materialId?: string;
  page?: number;
  perPage?: number;
  supplierId?: string;
};
