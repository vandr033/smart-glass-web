import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  DamagedMaterialInput,
  DamagedMaterialRecord,
  GlassAvailabilityRecord,
  InventoryAdjustInput,
  InventoryDashboardRecord,
  InventoryMovementRecord,
  InventoryReservationInput,
  InventoryReservationRecord,
  InventoryStockEntryInput,
  InventoryStockRecord,
  InventoryTransferInput,
  LinearAvailabilityRecord,
  MaterialAvailabilityRecord,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  RemnantPieceInput,
  RemnantPieceRecord,
  WarehouseMutationInput,
  WarehouseRecord,
} from "@/types";

const toQueryString = (
  values: Record<string, string | number | undefined | null>,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

type PaginatedResult<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export const inventoryService = {
  async getDashboard(): Promise<InventoryDashboardRecord> {
    const response = await apiClient.get<ApiSuccessResponse<InventoryDashboardRecord>>(
      "/inventory/dashboard",
    );

    return response.data.data;
  },

  async listWarehouses(params?: {
    search?: string;
    status?: WarehouseRecord["status"];
  }): Promise<WarehouseRecord[]> {
    const queryString = toQueryString({
      search: params?.search,
      status: params?.status,
    });
    const response = await apiClient.get<ApiSuccessResponse<WarehouseRecord[]>>(
      queryString ? `/warehouses?${queryString}` : "/warehouses",
    );

    return response.data.data;
  },

  async getWarehouseById(warehouseId: string): Promise<WarehouseRecord> {
    const response = await apiClient.get<ApiSuccessResponse<WarehouseRecord>>(
      `/warehouses/${warehouseId}`,
    );

    return response.data.data;
  },

  async createWarehouse(input: WarehouseMutationInput): Promise<WarehouseRecord> {
    const response = await apiClient.post<ApiSuccessResponse<WarehouseRecord>>(
      "/warehouses",
      input,
    );

    return response.data.data;
  },

  async updateWarehouse(
    warehouseId: string,
    input: WarehouseMutationInput,
  ): Promise<WarehouseRecord> {
    const response = await apiClient.put<ApiSuccessResponse<WarehouseRecord>>(
      `/warehouses/${warehouseId}`,
      input,
    );

    return response.data.data;
  },

  async deleteWarehouse(warehouseId: string): Promise<void> {
    await apiClient.delete(`/warehouses/${warehouseId}`);
  },

  async listStock(params: {
    categoryId?: string;
    condition?: InventoryStockRecord["condition"];
    materialId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "createdAt" | "material" | "quantity" | "warehouse";
    sortDirection?: "asc" | "desc";
    stockType?: InventoryStockRecord["stockType"];
    thicknessMm?: number;
    warehouseId?: string;
  }): Promise<PaginatedResult<InventoryStockRecord>> {
    const queryString = toQueryString({
      "filter.categoryId": params.categoryId,
      "filter.condition": params.condition,
      "filter.materialId": params.materialId,
      page: params.page,
      perPage: params.perPage,
      search: params.search,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.stockType": params.stockType,
      "filter.thicknessMm": params.thicknessMm,
      "filter.warehouseId": params.warehouseId,
    });
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<InventoryStockRecord[]>>(
        queryString ? `/inventory/stock?${queryString}` : "/inventory/stock",
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createStockEntry(input: InventoryStockEntryInput): Promise<InventoryStockRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InventoryStockRecord>>(
      "/inventory/stock",
      input,
    );

    return response.data.data;
  },

  async adjustStock(input: InventoryAdjustInput): Promise<InventoryStockRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InventoryStockRecord>>(
      "/inventory/adjust",
      input,
    );

    return response.data.data;
  },

  async transferStock(
    input: InventoryTransferInput,
  ): Promise<{
    destinationStock: InventoryStockRecord;
    sourceStockId: string;
  }> {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        destinationStock: InventoryStockRecord;
        sourceStockId: string;
      }>
    >("/inventory/transfer", input);

    return response.data.data;
  },

  async listMovements(params: {
    materialId?: string;
    movementType?: InventoryMovementRecord["movementType"];
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "createdAt" | "movementType" | "quantity";
    sortDirection?: "asc" | "desc";
    warehouseId?: string;
  }): Promise<PaginatedResult<InventoryMovementRecord>> {
    const queryString = toQueryString({
      "filter.materialId": params.materialId,
      "filter.movementType": params.movementType,
      page: params.page,
      perPage: params.perPage,
      search: params.search,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.warehouseId": params.warehouseId,
    });
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<InventoryMovementRecord[]>>(
        queryString ? `/inventory/movements?${queryString}` : "/inventory/movements",
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async listReservations(params: {
    materialId?: string;
    page?: number;
    perPage?: number;
    projectId?: string;
    quotationId?: string;
    reservationType?: InventoryReservationRecord["reservationType"];
    search?: string;
    sortBy?: "createdAt" | "expiresAt" | "quantity";
    sortDirection?: "asc" | "desc";
    status?: InventoryReservationRecord["status"];
    warehouseId?: string;
  }): Promise<PaginatedResult<InventoryReservationRecord>> {
    const queryString = toQueryString({
      "filter.materialId": params.materialId,
      page: params.page,
      perPage: params.perPage,
      "filter.projectId": params.projectId,
      "filter.quotationId": params.quotationId,
      "filter.reservationType": params.reservationType,
      search: params.search,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
      "filter.warehouseId": params.warehouseId,
    });
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<InventoryReservationRecord[]>>(
        queryString
          ? `/inventory/reservations?${queryString}`
          : "/inventory/reservations",
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createSoftReservation(
    input: InventoryReservationInput,
  ): Promise<InventoryReservationRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InventoryReservationRecord>>(
      "/inventory/reservations/soft",
      input,
    );

    return response.data.data;
  },

  async createFirmReservation(
    input: InventoryReservationInput,
  ): Promise<InventoryReservationRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InventoryReservationRecord>>(
      "/inventory/reservations/firm",
      input,
    );

    return response.data.data;
  },

  async releaseReservation(reservationId: string): Promise<InventoryReservationRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InventoryReservationRecord>>(
      `/inventory/reservations/${reservationId}/release`,
    );

    return response.data.data;
  },

  async consumeReservation(reservationId: string): Promise<InventoryReservationRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InventoryReservationRecord>>(
      `/inventory/reservations/${reservationId}/consume`,
    );

    return response.data.data;
  },

  async listRemnants(params: {
    materialId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "code" | "createdAt" | "usableAreaM2";
    sortDirection?: "asc" | "desc";
    status?: RemnantPieceRecord["status"];
    thicknessMm?: number;
    warehouseId?: string;
  }): Promise<PaginatedResult<RemnantPieceRecord>> {
    const queryString = toQueryString({
      "filter.materialId": params.materialId,
      page: params.page,
      perPage: params.perPage,
      search: params.search,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
      "filter.thicknessMm": params.thicknessMm,
      "filter.warehouseId": params.warehouseId,
    });
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<RemnantPieceRecord[]>>(
        queryString ? `/inventory/remnants?${queryString}` : "/inventory/remnants",
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createRemnant(input: RemnantPieceInput): Promise<RemnantPieceRecord> {
    const response = await apiClient.post<ApiSuccessResponse<RemnantPieceRecord>>(
      "/inventory/remnants",
      input,
    );

    return response.data.data;
  },

  async findUsableRemnants(params: {
    materialId: string;
    requiredHeightMm: number;
    requiredWidthMm: number;
    thicknessMm?: number;
    warehouseId?: string;
  }): Promise<RemnantPieceRecord[]> {
    const queryString = toQueryString({
      materialId: params.materialId,
      requiredHeightMm: params.requiredHeightMm,
      requiredWidthMm: params.requiredWidthMm,
      thicknessMm: params.thicknessMm,
      warehouseId: params.warehouseId,
    });
    const response = await apiClient.get<ApiSuccessResponse<RemnantPieceRecord[]>>(
      `/inventory/remnants/usable?${queryString}`,
    );

    return response.data.data;
  },

  async scrapRemnant(remnantId: string, reason?: string): Promise<void> {
    await apiClient.post(`/inventory/remnants/${remnantId}/scrap`, {
      reason: reason ?? null,
    });
  },

  async listDamagedMaterials(params: {
    materialId?: string;
    page?: number;
    perPage?: number;
    search?: string;
    severity?: DamagedMaterialRecord["severity"];
    sortBy?: "createdAt" | "severity" | "status";
    sortDirection?: "asc" | "desc";
    status?: DamagedMaterialRecord["status"];
    warehouseId?: string;
  }): Promise<PaginatedResult<DamagedMaterialRecord>> {
    const queryString = toQueryString({
      "filter.materialId": params.materialId,
      page: params.page,
      perPage: params.perPage,
      search: params.search,
      "filter.severity": params.severity,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
      "filter.warehouseId": params.warehouseId,
    });
    const response =
      await apiClient.get<PaginatedApiSuccessResponse<DamagedMaterialRecord[]>>(
        queryString ? `/inventory/damaged?${queryString}` : "/inventory/damaged",
      );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createDamagedMaterial(
    input: DamagedMaterialInput,
  ): Promise<DamagedMaterialRecord> {
    const response = await apiClient.post<ApiSuccessResponse<DamagedMaterialRecord>>(
      "/inventory/damaged",
      input,
    );

    return response.data.data;
  },

  async reviewDamagedMaterial(input: {
    damagedMaterialId: string;
    description?: string | null;
    status: "REVIEWED" | "REUSABLE";
  }): Promise<DamagedMaterialRecord> {
    const response = await apiClient.post<ApiSuccessResponse<DamagedMaterialRecord>>(
      `/inventory/damaged/${input.damagedMaterialId}/review`,
      {
        description: input.description ?? null,
        status: input.status,
      },
    );

    return response.data.data;
  },

  async scrapDamagedMaterial(
    damagedMaterialId: string,
    reason?: string,
  ): Promise<void> {
    await apiClient.post(`/inventory/damaged/${damagedMaterialId}/scrap`, {
      reason: reason ?? null,
    });
  },

  async returnDamagedMaterialToSupplier(
    damagedMaterialId: string,
    reason?: string,
  ): Promise<DamagedMaterialRecord> {
    const response = await apiClient.post<ApiSuccessResponse<DamagedMaterialRecord>>(
      `/inventory/damaged/${damagedMaterialId}/return-to-supplier`,
      {
        reason: reason ?? null,
      },
    );

    return response.data.data;
  },

  async getMaterialAvailability(
    materialId: string,
    params?: {
      quantity?: number;
      unit?: InventoryStockRecord["unit"];
      warehouseId?: string;
    },
  ): Promise<MaterialAvailabilityRecord> {
    const queryString = toQueryString({
      quantity: params?.quantity,
      unit: params?.unit,
      warehouseId: params?.warehouseId,
    });
    const response = await apiClient.get<ApiSuccessResponse<MaterialAvailabilityRecord>>(
      queryString
        ? `/inventory/availability/material/${materialId}?${queryString}`
        : `/inventory/availability/material/${materialId}`,
    );

    return response.data.data;
  },

  async getGlassAvailability(params: {
    heightMm: number;
    materialId: string;
    thicknessMm?: number;
    warehouseId?: string;
    widthMm: number;
  }): Promise<GlassAvailabilityRecord> {
    const queryString = toQueryString({
      heightMm: params.heightMm,
      materialId: params.materialId,
      thicknessMm: params.thicknessMm,
      warehouseId: params.warehouseId,
      widthMm: params.widthMm,
    });
    const response = await apiClient.get<ApiSuccessResponse<GlassAvailabilityRecord>>(
      `/inventory/availability/glass?${queryString}`,
    );

    return response.data.data;
  },

  async getLinearAvailability(params: {
    materialId: string;
    requiredLengthMm: number;
    warehouseId?: string;
  }): Promise<LinearAvailabilityRecord> {
    const queryString = toQueryString({
      materialId: params.materialId,
      requiredLengthMm: params.requiredLengthMm,
      warehouseId: params.warehouseId,
    });
    const response = await apiClient.get<ApiSuccessResponse<LinearAvailabilityRecord>>(
      `/inventory/availability/linear?${queryString}`,
    );

    return response.data.data;
  },
};
