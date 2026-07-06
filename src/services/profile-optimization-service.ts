import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  ProfileCuttingPlanListItem,
  ProfileCuttingPlanRecord,
  ProfileOptimizationMode,
  ProfileOptimizationRunListItem,
  ProfileOptimizationRunRecord,
  ProfileRequirementCollection,
  RunProfileOptimizationInput,
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

export const profileOptimizationService = {
  async listOptimizations(params: {
    materialId?: string;
    mode?: ProfileOptimizationMode;
    page?: number;
    perPage?: number;
    projectId?: string;
    quotationId?: string;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "wastePercent";
    sortDirection?: "asc" | "desc";
    status?: ProfileOptimizationRunRecord["status"];
  }): Promise<{
    data: ProfileOptimizationRunListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams({
      "filter.materialId": params.materialId,
      "filter.mode": params.mode,
      "filter.projectId": params.projectId,
      "filter.quotationId": params.quotationId,
      "filter.status": params.status,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProfileOptimizationRunListItem[]>
    >(
      queryString
        ? `/profile-optimizations?${queryString}`
        : "/profile-optimizations",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getOptimizationById(runId: string): Promise<ProfileOptimizationRunRecord> {
    const response = await apiClient.get<
      ApiSuccessResponse<ProfileOptimizationRunRecord>
    >(`/profile-optimizations/${runId}`);

    return response.data.data;
  },

  async runOptimization(
    input: RunProfileOptimizationInput,
  ): Promise<ProfileOptimizationRunRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<ProfileOptimizationRunRecord>
    >("/profile-optimizations/run", input);

    return response.data.data;
  },

  async generatePlanFromRun(runId: string): Promise<ProfileCuttingPlanRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<ProfileCuttingPlanRecord>
    >(`/profile-optimizations/${runId}/generate-plan`);

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
    status?: ProfileCuttingPlanRecord["status"];
  }): Promise<{
    data: ProfileCuttingPlanListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams({
      "filter.materialId": params.materialId,
      "filter.optimizationRunId": params.optimizationRunId,
      "filter.status": params.status,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProfileCuttingPlanListItem[]>
    >(
      queryString
        ? `/profile-cutting-plans?${queryString}`
        : "/profile-cutting-plans",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getPlanById(planId: string): Promise<ProfileCuttingPlanRecord> {
    const response = await apiClient.get<
      ApiSuccessResponse<ProfileCuttingPlanRecord>
    >(`/profile-cutting-plans/${planId}`);

    return response.data.data;
  },

  async createRemnants(planId: string): Promise<ProfileCuttingPlanRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<ProfileCuttingPlanRecord>
    >(`/profile-cutting-plans/${planId}/create-remnants`);

    return response.data.data;
  },

  async getQuotationProfileRequirements(
    quotationId: string,
  ): Promise<ProfileRequirementCollection> {
    const response = await apiClient.get<
      ApiSuccessResponse<ProfileRequirementCollection>
    >(`/quotations/${quotationId}/profile-requirements`);

    return response.data.data;
  },

  async runQuotationOptimization(
    quotationId: string,
    input: {
      mode?: ProfileOptimizationMode;
      preferRemnants?: boolean;
    } = {},
  ): Promise<{
    requirements: ProfileRequirementCollection;
    runs: ProfileOptimizationRunRecord[];
  }> {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        requirements: ProfileRequirementCollection;
        runs: ProfileOptimizationRunRecord[];
      }>
    >(`/quotations/${quotationId}/profile-optimization`, input);

    return response.data.data;
  },
};
