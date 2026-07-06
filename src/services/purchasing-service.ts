import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CreateInventoryShortagePurchaseRequestInput,
  CreatePurchaseOrderInput,
  CreatePurchaseRequestInput,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  PurchaseOrderListItem,
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  PurchaseOrderStatusNoteInput,
  PurchaseReceiptListItem,
  PurchaseReceiptRecord,
  PurchaseRequestDecisionInput,
  PurchaseRequestRecord,
  PurchaseRequestSourceType,
  PurchaseRequestStatus,
  PurchasingDashboardRecord,
  ReceivePurchaseOrderInput,
  SupplierComparisonApprovalInput,
  SupplierComparisonListItem,
  SupplierComparisonRecord,
  SupplierComparisonRunInput,
  SupplierComparisonStatus,
  UpdatePurchaseOrderInput,
  UpdatePurchaseRequestInput,
} from "@/types";

const buildQueryString = (
  params: Record<string, number | string | undefined | null>,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
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

export const purchasingService = {
  async getDashboard(): Promise<PurchasingDashboardRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PurchasingDashboardRecord>>(
      "/purchasing/dashboard",
    );

    return response.data.data;
  },

  async listPurchaseRequests(params: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "approvedAt" | "code" | "createdAt" | "status";
    sortDirection?: "asc" | "desc";
    sourceType?: PurchaseRequestSourceType;
    status?: PurchaseRequestStatus;
  }): Promise<PaginatedResult<PurchaseRequestRecord>> {
    const queryString = buildQueryString({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      "filter.sourceType": params.sourceType,
      "filter.status": params.status,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PurchaseRequestRecord[]>
    >(queryString ? `/purchase-requests?${queryString}` : "/purchase-requests");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getPurchaseRequestById(purchaseRequestId: string): Promise<PurchaseRequestRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/${purchaseRequestId}`,
    );

    return response.data.data;
  },

  async createPurchaseRequest(
    input: CreatePurchaseRequestInput,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      "/purchase-requests",
      input,
    );

    return response.data.data;
  },

  async updatePurchaseRequest(
    purchaseRequestId: string,
    input: UpdatePurchaseRequestInput,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.put<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/${purchaseRequestId}`,
      input,
    );

    return response.data.data;
  },

  async deletePurchaseRequest(purchaseRequestId: string): Promise<void> {
    await apiClient.delete(`/purchase-requests/${purchaseRequestId}`);
  },

  async createPurchaseRequestFromQuotation(
    quotationId: string,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/from-quotation/${quotationId}`,
    );

    return response.data.data;
  },

  async createPurchaseRequestFromCuttingPlan(
    cuttingPlanId: string,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/from-cutting-plan/${cuttingPlanId}`,
    );

    return response.data.data;
  },

  async createPurchaseRequestFromProfileCuttingPlan(
    profileCuttingPlanId: string,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/from-profile-cutting-plan/${profileCuttingPlanId}`,
    );

    return response.data.data;
  },

  async createPurchaseRequestFromInventoryShortage(
    input: CreateInventoryShortagePurchaseRequestInput,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      "/purchase-requests/from-inventory-shortage",
      input,
    );

    return response.data.data;
  },

  async approvePurchaseRequest(
    purchaseRequestId: string,
    input: PurchaseRequestDecisionInput,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/${purchaseRequestId}/approve`,
      input,
    );

    return response.data.data;
  },

  async rejectPurchaseRequest(
    purchaseRequestId: string,
    input: PurchaseRequestDecisionInput,
  ): Promise<PurchaseRequestRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseRequestRecord>>(
      `/purchase-requests/${purchaseRequestId}/reject`,
      input,
    );

    return response.data.data;
  },

  async compareSuppliersForPurchaseRequest(
    purchaseRequestId: string,
    input: SupplierComparisonRunInput,
  ): Promise<SupplierComparisonRecord> {
    const response = await apiClient.post<ApiSuccessResponse<SupplierComparisonRecord>>(
      `/purchase-requests/${purchaseRequestId}/compare-suppliers`,
      input,
    );

    return response.data.data;
  },

  async listSupplierComparisons(params: {
    page?: number;
    perPage?: number;
    purchaseRequestId?: string;
    search?: string;
    sortBy?: "approvedAt" | "createdAt" | "status";
    sortDirection?: "asc" | "desc";
    status?: SupplierComparisonStatus;
  }): Promise<PaginatedResult<SupplierComparisonListItem>> {
    const queryString = buildQueryString({
      "filter.purchaseRequestId": params.purchaseRequestId,
      "filter.status": params.status,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<SupplierComparisonListItem[]>
    >(queryString ? `/supplier-comparisons?${queryString}` : "/supplier-comparisons");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getSupplierComparisonById(comparisonId: string): Promise<SupplierComparisonRecord> {
    const response = await apiClient.get<ApiSuccessResponse<SupplierComparisonRecord>>(
      `/supplier-comparisons/${comparisonId}`,
    );

    return response.data.data;
  },

  async approveSupplierComparison(
    comparisonId: string,
    input: SupplierComparisonApprovalInput = {},
  ): Promise<SupplierComparisonRecord> {
    const response = await apiClient.post<ApiSuccessResponse<SupplierComparisonRecord>>(
      `/supplier-comparisons/${comparisonId}/approve`,
      input,
    );

    return response.data.data;
  },

  async createPurchaseOrdersFromComparison(
    comparisonId: string,
  ): Promise<PurchaseOrderRecord[]> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseOrderRecord[]>>(
      `/supplier-comparisons/${comparisonId}/create-purchase-orders`,
    );

    return response.data.data;
  },

  async listPurchaseOrders(params: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    purchaseRequestId?: string;
    search?: string;
    sortBy?: "code" | "createdAt" | "expectedDeliveryDate" | "orderDate" | "status";
    sortDirection?: "asc" | "desc";
    status?: PurchaseOrderStatus;
    supplierId?: string;
  }): Promise<PaginatedResult<PurchaseOrderListItem>> {
    const queryString = buildQueryString({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      "filter.purchaseRequestId": params.purchaseRequestId,
      "filter.status": params.status,
      "filter.supplierId": params.supplierId,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PurchaseOrderListItem[]>
    >(queryString ? `/purchase-orders?${queryString}` : "/purchase-orders");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getPurchaseOrderById(purchaseOrderId: string): Promise<PurchaseOrderRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PurchaseOrderRecord>>(
      `/purchase-orders/${purchaseOrderId}`,
    );

    return response.data.data;
  },

  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrderRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseOrderRecord>>(
      "/purchase-orders",
      input,
    );

    return response.data.data;
  },

  async updatePurchaseOrder(
    purchaseOrderId: string,
    input: UpdatePurchaseOrderInput,
  ): Promise<PurchaseOrderRecord> {
    const response = await apiClient.put<ApiSuccessResponse<PurchaseOrderRecord>>(
      `/purchase-orders/${purchaseOrderId}`,
      input,
    );

    return response.data.data;
  },

  async deletePurchaseOrder(purchaseOrderId: string): Promise<void> {
    await apiClient.delete(`/purchase-orders/${purchaseOrderId}`);
  },

  async sendPurchaseOrder(
    purchaseOrderId: string,
    input: PurchaseOrderStatusNoteInput,
  ): Promise<PurchaseOrderRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseOrderRecord>>(
      `/purchase-orders/${purchaseOrderId}/send`,
      input,
    );

    return response.data.data;
  },

  async confirmPurchaseOrder(
    purchaseOrderId: string,
    input: PurchaseOrderStatusNoteInput,
  ): Promise<PurchaseOrderRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseOrderRecord>>(
      `/purchase-orders/${purchaseOrderId}/confirm`,
      input,
    );

    return response.data.data;
  },

  async cancelPurchaseOrder(
    purchaseOrderId: string,
    input: PurchaseOrderStatusNoteInput,
  ): Promise<PurchaseOrderRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseOrderRecord>>(
      `/purchase-orders/${purchaseOrderId}/cancel`,
      input,
    );

    return response.data.data;
  },

  async receivePurchaseOrder(
    purchaseOrderId: string,
    input: ReceivePurchaseOrderInput,
  ): Promise<PurchaseReceiptRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PurchaseReceiptRecord>>(
      `/purchase-orders/${purchaseOrderId}/receive`,
      input,
    );

    return response.data.data;
  },

  async listPurchaseReceipts(params: {
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    purchaseOrderId?: string;
    search?: string;
    sortBy?: "code" | "createdAt" | "receivedAt";
    sortDirection?: "asc" | "desc";
    warehouseId?: string;
  }): Promise<PaginatedResult<PurchaseReceiptListItem>> {
    const queryString = buildQueryString({
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      "filter.purchaseOrderId": params.purchaseOrderId,
      "filter.warehouseId": params.warehouseId,
      page: params.page,
      perPage: params.perPage,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PurchaseReceiptListItem[]>
    >(queryString ? `/purchase-receipts?${queryString}` : "/purchase-receipts");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getPurchaseReceiptById(purchaseReceiptId: string): Promise<PurchaseReceiptRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PurchaseReceiptRecord>>(
      `/purchase-receipts/${purchaseReceiptId}`,
    );

    return response.data.data;
  },
};
