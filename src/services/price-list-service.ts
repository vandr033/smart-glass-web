import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  ImportPriceListInput,
  ListPriceHistoryParams,
  ListPriceListImportRowsParams,
  ListPriceListImportsParams,
  MapPriceListImportRowInput,
  MaterialSupplierPriceRecord,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  PriceChangeLogRecord,
  PriceListApprovalResult,
  PriceListImportDetailRecord,
  PriceListImportRecord,
  PriceListImportRowRecord,
  SupplierMaterialPriceListRecord,
} from "@/types";

const buildImportsSearchParams = (params: ListPriceListImportsParams) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.perPage) {
    searchParams.set("perPage", String(params.perPage));
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.sortDirection) {
    searchParams.set("sortDirection", params.sortDirection);
  }

  if (params.supplierId) {
    searchParams.set("filter.supplierId", params.supplierId);
  }

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  return searchParams.toString();
};

const buildImportRowsSearchParams = (params: ListPriceListImportRowsParams) => {
  const searchParams = new URLSearchParams();

  if (params.attentionOnly !== undefined) {
    searchParams.set("attentionOnly", String(params.attentionOnly));
  }

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.perPage) {
    searchParams.set("perPage", String(params.perPage));
  }

  if (params.search?.trim()) {
    searchParams.set("search", params.search.trim());
  }

  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }

  if (params.sortDirection) {
    searchParams.set("sortDirection", params.sortDirection);
  }

  if (params.mappingStatus) {
    searchParams.set("filter.mappingStatus", params.mappingStatus);
  }

  if (params.validationStatus) {
    searchParams.set("filter.validationStatus", params.validationStatus);
  }

  return searchParams.toString();
};

const buildPriceHistorySearchParams = (params: ListPriceHistoryParams) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.perPage) {
    searchParams.set("perPage", String(params.perPage));
  }

  if (params.supplierId) {
    searchParams.set("filter.supplierId", params.supplierId);
  }

  if (params.materialId) {
    searchParams.set("filter.materialId", params.materialId);
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  return searchParams.toString();
};

export const priceListService = {
  async importPriceList(input: ImportPriceListInput): Promise<PriceListImportDetailRecord> {
    const formData = new FormData();
    formData.append("supplierId", input.supplierId);
    formData.append("currency", input.currency);
    formData.append("file", input.file);

    const response = await apiClient.post<ApiSuccessResponse<PriceListImportDetailRecord>>(
      "/price-lists/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },

  async listImports(params: ListPriceListImportsParams): Promise<{
    data: PriceListImportRecord[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildImportsSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PriceListImportRecord[]>
    >(queryString ? `/price-lists/imports?${queryString}` : "/price-lists/imports");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getImportById(importId: string): Promise<PriceListImportDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PriceListImportDetailRecord>>(
      `/price-lists/imports/${importId}`,
    );

    return response.data.data;
  },

  async listImportRows(
    importId: string,
    params: ListPriceListImportRowsParams,
  ): Promise<{
    data: PriceListImportRowRecord[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildImportRowsSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PriceListImportRowRecord[]>
    >(
      queryString
        ? `/price-lists/imports/${importId}/rows?${queryString}`
        : `/price-lists/imports/${importId}/rows`,
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async autoMapImportRows(importId: string): Promise<PriceListImportDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PriceListImportDetailRecord>>(
      `/price-lists/imports/${importId}/auto-map`,
    );

    return response.data.data;
  },

  async mapImportRow(
    importId: string,
    rowId: string,
    input: MapPriceListImportRowInput,
  ): Promise<PriceListImportRowRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PriceListImportRowRecord>>(
      `/price-lists/imports/${importId}/rows/${rowId}/map`,
      {
        confidence: input.confidence ?? "VERIFIED",
        conversionFactor: input.conversionFactor,
        createOrUpdateEquivalence: input.createOrUpdateEquivalence ?? true,
        materialId: input.materialId,
        notes: input.notes,
      },
    );

    return response.data.data;
  },

  async ignoreImportRow(importId: string, rowId: string): Promise<PriceListImportRowRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PriceListImportRowRecord>>(
      `/price-lists/imports/${importId}/rows/${rowId}/ignore`,
    );

    return response.data.data;
  },

  async validateImport(importId: string): Promise<PriceListImportDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PriceListImportDetailRecord>>(
      `/price-lists/imports/${importId}/validate`,
    );

    return response.data.data;
  },

  async approveImport(importId: string): Promise<PriceListApprovalResult> {
    const response = await apiClient.post<ApiSuccessResponse<PriceListApprovalResult>>(
      `/price-lists/imports/${importId}/approve`,
    );

    return response.data.data;
  },

  async rejectImport(importId: string): Promise<PriceListImportDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PriceListImportDetailRecord>>(
      `/price-lists/imports/${importId}/reject`,
    );

    return response.data.data;
  },

  async getMaterialSupplierPrices(
    materialId: string,
  ): Promise<MaterialSupplierPriceRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<MaterialSupplierPriceRecord[]>>(
      `/materials/${materialId}/supplier-prices`,
    );

    return response.data.data;
  },

  async getSupplierMaterialPrices(
    supplierId: string,
  ): Promise<SupplierMaterialPriceListRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<SupplierMaterialPriceListRecord[]>>(
      `/suppliers/${supplierId}/material-prices`,
    );

    return response.data.data;
  },

  async getPriceHistory(params: ListPriceHistoryParams): Promise<{
    data: PriceChangeLogRecord[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildPriceHistorySearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PriceChangeLogRecord[]>
    >(queryString ? `/price-lists/price-history?${queryString}` : "/price-lists/price-history");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};
