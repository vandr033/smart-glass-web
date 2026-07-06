import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CuttingOptimizationMode,
  CuttingOptimizationRunListItem,
  CuttingOptimizationRunRecord,
  CuttingPlanListItem,
  CuttingPlanRecord,
  GlassRequirementCollection,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  RunGlassOptimizationInput,
} from "@/types";

const buildSearchParams = (params: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export const cuttingService = {
  async listOptimizations(params: {
    materialId?: string;
    mode?: CuttingOptimizationMode;
    page?: number;
    perPage?: number;
    projectId?: string;
    quotationId?: string;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "wastePercent";
    sortDirection?: "asc" | "desc";
    status?: CuttingOptimizationRunRecord["status"];
    warehouseId?: string;
  }): Promise<{
    data: CuttingOptimizationRunListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams({
      "filter.materialId": params.materialId,
      "filter.mode": params.mode,
      "filter.projectId": params.projectId,
      "filter.quotationId": params.quotationId,
      "filter.status": params.status,
      "filter.warehouseId": params.warehouseId,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<CuttingOptimizationRunListItem[]>
    >(queryString ? `/cutting-optimizations?${queryString}` : "/cutting-optimizations");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getOptimizationById(runId: string): Promise<CuttingOptimizationRunRecord> {
    const response = await apiClient.get<
      ApiSuccessResponse<CuttingOptimizationRunRecord>
    >(`/cutting-optimizations/${runId}`);

    return response.data.data;
  },

  async runOptimization(
    input: RunGlassOptimizationInput,
  ): Promise<CuttingOptimizationRunRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<CuttingOptimizationRunRecord>
    >("/cutting-optimizations/run", input);

    return response.data.data;
  },

  async generatePlanFromRun(runId: string): Promise<CuttingPlanRecord[]> {
    const response = await apiClient.post<ApiSuccessResponse<CuttingPlanRecord[]>>(
      `/cutting-optimizations/${runId}/generate-plan`,
    );

    return response.data.data;
  },

  async cancelOptimization(runId: string): Promise<CuttingOptimizationRunRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<CuttingOptimizationRunRecord>
    >(`/cutting-optimizations/${runId}/cancel`);

    return response.data.data;
  },

  async getQuotationGlassRequirements(
    quotationId: string,
  ): Promise<GlassRequirementCollection> {
    const response = await apiClient.get<
      ApiSuccessResponse<GlassRequirementCollection>
    >(`/quotations/${quotationId}/glass-requirements`);

    return response.data.data;
  },

  async runQuotationOptimization(
    quotationId: string,
    input: {
      allowRotation?: boolean;
      materialId?: string | null;
      mode?: CuttingOptimizationMode;
      preferRemnants?: boolean;
      warehouseId?: string | null;
    } = {},
  ): Promise<{
    requirements: GlassRequirementCollection;
    run: CuttingOptimizationRunRecord;
  }> {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        requirements: GlassRequirementCollection;
        run: CuttingOptimizationRunRecord;
      }>
    >(`/quotations/${quotationId}/glass-optimization`, input);

    return response.data.data;
  },

  async listPlans(params: {
    materialId?: string;
    optimizationRunId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "wastePercent";
    sortDirection?: "asc" | "desc";
    status?: CuttingPlanRecord["status"];
    warehouseId?: string;
  }): Promise<{
    data: CuttingPlanListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams({
      "filter.materialId": params.materialId,
      "filter.optimizationRunId": params.optimizationRunId,
      "filter.status": params.status,
      "filter.warehouseId": params.warehouseId,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<CuttingPlanListItem[]>
    >(queryString ? `/cutting-plans?${queryString}` : "/cutting-plans");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getPlanById(planId: string): Promise<CuttingPlanRecord> {
    const response = await apiClient.get<ApiSuccessResponse<CuttingPlanRecord>>(
      `/cutting-plans/${planId}`,
    );

    return response.data.data;
  },

  async approvePlan(
    planId: string,
    input: {
      notes?: string | null;
    } = {},
  ): Promise<CuttingPlanRecord> {
    const response = await apiClient.post<ApiSuccessResponse<CuttingPlanRecord>>(
      `/cutting-plans/${planId}/approve`,
      input,
    );

    return response.data.data;
  },

  async createRemnants(planId: string): Promise<CuttingPlanRecord> {
    const response = await apiClient.post<ApiSuccessResponse<CuttingPlanRecord>>(
      `/cutting-plans/${planId}/create-remnants`,
    );

    return response.data.data;
  },

  async getPrintablePlan(planId: string): Promise<CuttingPlanRecord> {
    const response = await apiClient.get<ApiSuccessResponse<CuttingPlanRecord>>(
      `/cutting-plans/${planId}/print`,
    );

    return response.data.data;
  },
};
