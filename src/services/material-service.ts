import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  MapSupplierMaterialEquivalenceInput,
  MaterialCategoryMutationInput,
  MaterialCategoryRecord,
  MaterialDetailRecord,
  MaterialDimensionPresetInput,
  MaterialDimensionPresetRecord,
  MaterialListItem,
  MaterialMutationInput,
  MaterialStatus,
  MaterialType,
  PaginationMeta,
  PaginatedApiSuccessResponse,
  SupplierMaterialEquivalenceConfidence,
  SupplierMaterialEquivalenceInput,
  SupplierMaterialEquivalenceRecord,
  SupplierMaterialEquivalenceStatus,
} from "@/types";

const buildMaterialSearchParams = (params: {
  categoryId?: string;
  isCuttable?: boolean;
  isRemnantEligible?: boolean;
  isStockable?: boolean;
  materialType?: MaterialType;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: "category" | "code" | "createdAt" | "materialType" | "name";
  sortDirection?: "asc" | "desc";
  status?: MaterialStatus;
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

  if (params.categoryId) {
    searchParams.set("filter.categoryId", params.categoryId);
  }

  if (params.materialType) {
    searchParams.set("filter.materialType", params.materialType);
  }

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  if (params.isCuttable !== undefined) {
    searchParams.set("filter.isCuttable", String(params.isCuttable));
  }

  if (params.isStockable !== undefined) {
    searchParams.set("filter.isStockable", String(params.isStockable));
  }

  if (params.isRemnantEligible !== undefined) {
    searchParams.set(
      "filter.isRemnantEligible",
      String(params.isRemnantEligible),
    );
  }

  return searchParams.toString();
};

const buildEquivalenceSearchParams = (params: {
  confidence?: SupplierMaterialEquivalenceConfidence;
  materialId?: string;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: "confidence" | "createdAt" | "status" | "supplierName" | "supplierSku";
  sortDirection?: "asc" | "desc";
  status?: SupplierMaterialEquivalenceStatus;
  supplierId?: string;
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

  if (params.supplierId) {
    searchParams.set("filter.supplierId", params.supplierId);
  }

  if (params.materialId) {
    searchParams.set("filter.materialId", params.materialId);
  }

  if (params.confidence) {
    searchParams.set("filter.confidence", params.confidence);
  }

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  return searchParams.toString();
};

export const materialService = {
  async listMaterialCategories(search = ""): Promise<MaterialCategoryRecord[]> {
    const queryString = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";
    const response = await apiClient.get<ApiSuccessResponse<MaterialCategoryRecord[]>>(
      `/material-categories${queryString}`,
    );

    return response.data.data;
  },

  async createMaterialCategory(
    input: MaterialCategoryMutationInput,
  ): Promise<MaterialCategoryRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MaterialCategoryRecord>>(
      "/material-categories",
      input,
    );

    return response.data.data;
  },

  async updateMaterialCategory(
    categoryId: string,
    input: MaterialCategoryMutationInput,
  ): Promise<MaterialCategoryRecord> {
    const response = await apiClient.put<ApiSuccessResponse<MaterialCategoryRecord>>(
      `/material-categories/${categoryId}`,
      input,
    );

    return response.data.data;
  },

  async deleteMaterialCategory(categoryId: string): Promise<void> {
    await apiClient.delete(`/material-categories/${categoryId}`);
  },

  async listMaterials(params: {
    categoryId?: string;
    isCuttable?: boolean;
    isRemnantEligible?: boolean;
    isStockable?: boolean;
    materialType?: MaterialType;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "category" | "code" | "createdAt" | "materialType" | "name";
    sortDirection?: "asc" | "desc";
    status?: MaterialStatus;
  }): Promise<{
    data: MaterialListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildMaterialSearchParams(params);
    const response = await apiClient.get<PaginatedApiSuccessResponse<MaterialListItem[]>>(
      queryString ? `/materials?${queryString}` : "/materials",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getMaterialById(materialId: string): Promise<MaterialDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<MaterialDetailRecord>>(
      `/materials/${materialId}`,
    );

    return response.data.data;
  },

  async createMaterial(input: MaterialMutationInput): Promise<MaterialDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MaterialDetailRecord>>(
      "/materials",
      input,
    );

    return response.data.data;
  },

  async updateMaterial(
    materialId: string,
    input: MaterialMutationInput,
  ): Promise<MaterialDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<MaterialDetailRecord>>(
      `/materials/${materialId}`,
      input,
    );

    return response.data.data;
  },

  async deleteMaterial(materialId: string): Promise<void> {
    await apiClient.delete(`/materials/${materialId}`);
  },

  async listMaterialDimensionPresets(
    materialId: string,
  ): Promise<MaterialDimensionPresetRecord[]> {
    const response = await apiClient.get<
      ApiSuccessResponse<MaterialDimensionPresetRecord[]>
    >(`/materials/${materialId}/dimension-presets`);

    return response.data.data;
  },

  async createMaterialDimensionPreset(
    materialId: string,
    input: MaterialDimensionPresetInput,
  ): Promise<MaterialDimensionPresetRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MaterialDimensionPresetRecord>>(
      `/materials/${materialId}/dimension-presets`,
      input,
    );

    return response.data.data;
  },

  async updateMaterialDimensionPreset(
    materialId: string,
    presetId: string,
    input: MaterialDimensionPresetInput,
  ): Promise<MaterialDimensionPresetRecord> {
    const response = await apiClient.put<ApiSuccessResponse<MaterialDimensionPresetRecord>>(
      `/materials/${materialId}/dimension-presets/${presetId}`,
      input,
    );

    return response.data.data;
  },

  async deleteMaterialDimensionPreset(
    materialId: string,
    presetId: string,
  ): Promise<void> {
    await apiClient.delete(`/materials/${materialId}/dimension-presets/${presetId}`);
  },

  async listSupplierMaterialEquivalences(params: {
    confidence?: SupplierMaterialEquivalenceConfidence;
    materialId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "confidence" | "createdAt" | "status" | "supplierName" | "supplierSku";
    sortDirection?: "asc" | "desc";
    status?: SupplierMaterialEquivalenceStatus;
    supplierId?: string;
  }): Promise<{
    data: SupplierMaterialEquivalenceRecord[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildEquivalenceSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<SupplierMaterialEquivalenceRecord[]>
    >(queryString ? `/supplier-material-equivalences?${queryString}` : "/supplier-material-equivalences");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createSupplierMaterialEquivalence(
    input: SupplierMaterialEquivalenceInput,
  ): Promise<SupplierMaterialEquivalenceRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<SupplierMaterialEquivalenceRecord>
    >("/supplier-material-equivalences", input);

    return response.data.data;
  },

  async updateSupplierMaterialEquivalence(
    equivalenceId: string,
    input: SupplierMaterialEquivalenceInput,
  ): Promise<SupplierMaterialEquivalenceRecord> {
    const response = await apiClient.put<
      ApiSuccessResponse<SupplierMaterialEquivalenceRecord>
    >(`/supplier-material-equivalences/${equivalenceId}`, input);

    return response.data.data;
  },

  async deleteSupplierMaterialEquivalence(equivalenceId: string): Promise<void> {
    await apiClient.delete(`/supplier-material-equivalences/${equivalenceId}`);
  },

  async verifySupplierMaterialEquivalence(
    equivalenceId: string,
  ): Promise<SupplierMaterialEquivalenceRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<SupplierMaterialEquivalenceRecord>
    >(`/supplier-material-equivalences/${equivalenceId}/verify`);

    return response.data.data;
  },

  async mapSupplierMaterialEquivalence(
    equivalenceId: string,
    input: MapSupplierMaterialEquivalenceInput,
  ): Promise<SupplierMaterialEquivalenceRecord> {
    const response = await apiClient.post<
      ApiSuccessResponse<SupplierMaterialEquivalenceRecord>
    >(`/supplier-material-equivalences/${equivalenceId}/map`, input);

    return response.data.data;
  },
};
