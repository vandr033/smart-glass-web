import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  ProductTemplateCreateInput,
  ProductTemplateDetailRecord,
  ProductTemplateListItem,
  ProductTemplateRulesUpdateInput,
  ProductTemplateSimulationRecord,
  ProductTemplateStatus,
  ProductTemplateType,
  ProductTemplateUpdateInput,
  ProductTemplateVersionCreateInput,
  ProductTemplateVersionDetailRecord,
  ProductTemplateVersionSummary,
  ProductTemplateVersionUpdateInput,
} from "@/types";

const buildTemplateSearchParams = (params: {
  page?: number;
  perPage?: number;
  productType?: ProductTemplateType;
  search?: string;
  sortBy?: "code" | "createdAt" | "name" | "updatedAt";
  sortDirection?: "asc" | "desc";
  status?: ProductTemplateStatus;
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

  if (params.productType) {
    searchParams.set("filter.productType", params.productType);
  }

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  return searchParams.toString();
};

const buildPaginationSearchParams = (params?: {
  page?: number;
  perPage?: number;
}) => {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.set("page", String(params.page));
  }

  if (params?.perPage) {
    searchParams.set("perPage", String(params.perPage));
  }

  return searchParams.toString();
};

export const productTemplateService = {
  async listTemplates(params: {
    page?: number;
    perPage?: number;
    productType?: ProductTemplateType;
    search?: string;
    sortBy?: "code" | "createdAt" | "name" | "updatedAt";
    sortDirection?: "asc" | "desc";
    status?: ProductTemplateStatus;
  }): Promise<{
    data: ProductTemplateListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildTemplateSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProductTemplateListItem[]>
    >(queryString ? `/product-templates?${queryString}` : "/product-templates");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getTemplateById(templateId: string): Promise<ProductTemplateDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<ProductTemplateDetailRecord>>(
      `/product-templates/${templateId}`,
    );

    return response.data.data;
  },

  async createTemplate(
    input: ProductTemplateCreateInput,
  ): Promise<ProductTemplateDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductTemplateDetailRecord>>(
      "/product-templates",
      input,
    );

    return response.data.data;
  },

  async updateTemplate(
    templateId: string,
    input: ProductTemplateUpdateInput,
  ): Promise<ProductTemplateDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProductTemplateDetailRecord>>(
      `/product-templates/${templateId}`,
      input,
    );

    return response.data.data;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    await apiClient.delete(`/product-templates/${templateId}`);
  },

  async listTemplateVersions(templateId: string): Promise<ProductTemplateVersionSummary[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProductTemplateVersionSummary[]>>(
      `/product-templates/${templateId}/versions`,
    );

    return response.data.data;
  },

  async createTemplateVersion(
    templateId: string,
    input: ProductTemplateVersionCreateInput,
  ): Promise<ProductTemplateVersionDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductTemplateVersionDetailRecord>>(
      `/product-templates/${templateId}/versions`,
      input,
    );

    return response.data.data;
  },

  async getTemplateVersionById(
    versionId: string,
  ): Promise<ProductTemplateVersionDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<ProductTemplateVersionDetailRecord>>(
      `/product-template-versions/${versionId}`,
    );

    return response.data.data;
  },

  async updateTemplateVersion(
    versionId: string,
    input: ProductTemplateVersionUpdateInput,
  ): Promise<ProductTemplateVersionDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProductTemplateVersionDetailRecord>>(
      `/product-template-versions/${versionId}`,
      input,
    );

    return response.data.data;
  },

  async updateTemplateVersionRules(
    versionId: string,
    input: ProductTemplateRulesUpdateInput,
  ): Promise<ProductTemplateVersionDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProductTemplateVersionDetailRecord>>(
      `/product-template-versions/${versionId}/rules`,
      input,
    );

    return response.data.data;
  },

  async activateTemplateVersion(
    versionId: string,
  ): Promise<ProductTemplateVersionDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductTemplateVersionDetailRecord>>(
      `/product-template-versions/${versionId}/activate`,
    );

    return response.data.data;
  },

  async simulateTemplateVersion(
    versionId: string,
    inputValues: Record<string, unknown>,
  ): Promise<ProductTemplateSimulationRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductTemplateSimulationRecord>>(
      `/product-template-versions/${versionId}/simulate`,
      {
        inputValues,
      },
    );

    return response.data.data;
  },

  async listTemplateVersionSimulations(
    versionId: string,
    params?: {
      page?: number;
      perPage?: number;
    },
  ): Promise<{
    data: ProductTemplateSimulationRecord[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildPaginationSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProductTemplateSimulationRecord[]>
    >(
      queryString
        ? `/product-template-versions/${versionId}/simulations?${queryString}`
        : `/product-template-versions/${versionId}/simulations`,
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },
};
