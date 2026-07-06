import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  SupplierCategoryMutationInput,
  SupplierCategoryRecord,
  SupplierDetailRecord,
  SupplierListItem,
  SupplierMutationInput,
  SupplierScoringConfigInput,
  SupplierScoringConfigRecord,
  SupplierScoringCriterionRecord,
  SupplierScoringSimulationInput,
  SupplierScoringSimulationResponse,
  SupplierStatus,
} from "@/types";

const buildSearchParams = (params: {
  categoryId?: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: "createdAt" | "name" | "reliabilityScore" | "status";
  sortDirection?: "asc" | "desc";
  status?: SupplierStatus;
}) => {
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

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  if (params.categoryId) {
    searchParams.set("filter.categoryId", params.categoryId);
  }

  return searchParams.toString();
};

export const supplierService = {
  async listSuppliers(params: {
    categoryId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "createdAt" | "name" | "reliabilityScore" | "status";
    sortDirection?: "asc" | "desc";
    status?: SupplierStatus;
  }): Promise<{
    data: SupplierListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams(params);
    const response = await apiClient.get<PaginatedApiSuccessResponse<SupplierListItem[]>>(
      queryString ? `/suppliers?${queryString}` : "/suppliers",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getSupplierById(supplierId: string): Promise<SupplierDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<SupplierDetailRecord>>(
      `/suppliers/${supplierId}`,
    );

    return response.data.data;
  },

  async createSupplier(input: SupplierMutationInput): Promise<SupplierDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<SupplierDetailRecord>>(
      "/suppliers",
      input,
    );

    return response.data.data;
  },

  async updateSupplier(
    supplierId: string,
    input: SupplierMutationInput,
  ): Promise<SupplierDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<SupplierDetailRecord>>(
      `/suppliers/${supplierId}`,
      input,
    );

    return response.data.data;
  },

  async deleteSupplier(supplierId: string): Promise<void> {
    await apiClient.delete(`/suppliers/${supplierId}`);
  },

  async listSupplierCategories(search = ""): Promise<SupplierCategoryRecord[]> {
    const queryString = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";
    const response = await apiClient.get<ApiSuccessResponse<SupplierCategoryRecord[]>>(
      `/supplier-categories${queryString}`,
    );

    return response.data.data;
  },

  async createSupplierCategory(
    input: SupplierCategoryMutationInput,
  ): Promise<SupplierCategoryRecord> {
    const response = await apiClient.post<ApiSuccessResponse<SupplierCategoryRecord>>(
      "/supplier-categories",
      input,
    );

    return response.data.data;
  },

  async updateSupplierCategory(
    categoryId: string,
    input: SupplierCategoryMutationInput,
  ): Promise<SupplierCategoryRecord> {
    const response = await apiClient.put<ApiSuccessResponse<SupplierCategoryRecord>>(
      `/supplier-categories/${categoryId}`,
      input,
    );

    return response.data.data;
  },

  async deleteSupplierCategory(categoryId: string, force = false): Promise<void> {
    const queryString = force ? "?force=true" : "";
    await apiClient.delete(`/supplier-categories/${categoryId}${queryString}`);
  },

  async getSupplierScoringCriteria(): Promise<SupplierScoringCriterionRecord[]> {
    const response = await apiClient.get<
      ApiSuccessResponse<SupplierScoringCriterionRecord[]>
    >("/supplier-scoring/criteria");

    return response.data.data;
  },

  async listSupplierScoringConfigs(): Promise<SupplierScoringConfigRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<SupplierScoringConfigRecord[]>>(
      "/supplier-scoring/configs",
    );

    return response.data.data;
  },

  async getSupplierScoringConfig(
    configId: string,
  ): Promise<SupplierScoringConfigRecord> {
    const response = await apiClient.get<ApiSuccessResponse<SupplierScoringConfigRecord>>(
      `/supplier-scoring/configs/${configId}`,
    );

    return response.data.data;
  },

  async createSupplierScoringConfig(
    input: SupplierScoringConfigInput,
  ): Promise<SupplierScoringConfigRecord> {
    const response = await apiClient.post<ApiSuccessResponse<SupplierScoringConfigRecord>>(
      "/supplier-scoring/configs",
      input,
    );

    return response.data.data;
  },

  async updateSupplierScoringConfig(
    configId: string,
    input: SupplierScoringConfigInput,
  ): Promise<SupplierScoringConfigRecord> {
    const response = await apiClient.put<ApiSuccessResponse<SupplierScoringConfigRecord>>(
      `/supplier-scoring/configs/${configId}`,
      input,
    );

    return response.data.data;
  },

  async deleteSupplierScoringConfig(configId: string): Promise<void> {
    await apiClient.delete(`/supplier-scoring/configs/${configId}`);
  },

  async simulateSupplierScoring(
    input: SupplierScoringSimulationInput,
  ): Promise<SupplierScoringSimulationResponse> {
    const response = await apiClient.post<
      ApiSuccessResponse<SupplierScoringSimulationResponse>
    >("/supplier-scoring/simulate", input);

    return response.data.data;
  },
};
