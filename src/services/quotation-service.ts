import { apiClient } from "@/services/api-client";
import type {
  AddManualMaterialQuotationItemInput,
  AddManualServiceQuotationItemInput,
  AddTemplateQuotationItemInput,
  ApiSuccessResponse,
  ChangeQuotationStatusInput,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  QuotationApprovalRecord,
  QuotationApprovalEvaluation,
  QuotationDecisionInput,
  QuotationDetailRecord,
  QuotationListItem,
  QuotationMutationInput,
  QuotationStatus,
  QuotationVersionRecord,
  SubmitQuotationApprovalInput,
  UpdateQuotationItemInput,
} from "@/types";

const buildSearchParams = (params: {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  projectId?: string;
  search?: string;
  sortBy?: "createdAt" | "totalSale" | "updatedAt" | "validUntil";
  sortDirection?: "asc" | "desc";
  status?: QuotationStatus;
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

  if (params.clientId) {
    searchParams.set("filter.clientId", params.clientId);
  }

  if (params.projectId) {
    searchParams.set("filter.projectId", params.projectId);
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

export const quotationService = {
  async listQuotations(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    projectId?: string;
    search?: string;
    sortBy?: "createdAt" | "totalSale" | "updatedAt" | "validUntil";
    sortDirection?: "asc" | "desc";
    status?: QuotationStatus;
  }): Promise<{
    data: QuotationListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<QuotationListItem[]>
    >(queryString ? `/quotations?${queryString}` : "/quotations");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getQuotationById(quotationId: string): Promise<QuotationDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}`,
    );

    return response.data.data;
  },

  async createQuotation(input: QuotationMutationInput): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      "/quotations",
      input,
    );

    return response.data.data;
  },

  async updateQuotation(
    quotationId: string,
    input: QuotationMutationInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}`,
      input,
    );

    return response.data.data;
  },

  async deleteQuotation(quotationId: string): Promise<void> {
    await apiClient.delete(`/quotations/${quotationId}`);
  },

  async addTemplateItem(
    quotationId: string,
    input: AddTemplateQuotationItemInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/items/template`,
      input,
    );

    return response.data.data;
  },

  async addManualMaterialItem(
    quotationId: string,
    input: AddManualMaterialQuotationItemInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/items/manual-material`,
      input,
    );

    return response.data.data;
  },

  async addManualServiceItem(
    quotationId: string,
    input: AddManualServiceQuotationItemInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/items/manual-service`,
      input,
    );

    return response.data.data;
  },

  async updateQuotationItem(
    itemId: string,
    input: UpdateQuotationItemInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotation-items/${itemId}`,
      input,
    );

    return response.data.data;
  },

  async deleteQuotationItem(itemId: string): Promise<QuotationDetailRecord> {
    const response = await apiClient.delete<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotation-items/${itemId}`,
    );

    return response.data.data;
  },

  async recalculateQuotation(quotationId: string): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/recalculate`,
    );

    return response.data.data;
  },

  async createVersion(quotationId: string): Promise<QuotationVersionRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationVersionRecord>>(
      `/quotations/${quotationId}/create-version`,
    );

    return response.data.data;
  },

  async submitApproval(
    quotationId: string,
    input: SubmitQuotationApprovalInput = {},
  ): Promise<{
    evaluation: QuotationApprovalEvaluation;
    quotation: QuotationDetailRecord;
  }> {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        evaluation: QuotationApprovalEvaluation;
        quotation: QuotationDetailRecord;
      }>
    >(`/quotations/${quotationId}/submit-approval`, input);

    return response.data.data;
  },

  async approveQuotation(
    quotationId: string,
    input: QuotationDecisionInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/approve`,
      input,
    );

    return response.data.data;
  },

  async rejectQuotation(
    quotationId: string,
    input: QuotationDecisionInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/reject`,
      input,
    );

    return response.data.data;
  },

  async changeStatus(
    quotationId: string,
    input: ChangeQuotationStatusInput,
  ): Promise<QuotationDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QuotationDetailRecord>>(
      `/quotations/${quotationId}/change-status`,
      input,
    );

    return response.data.data;
  },

  async listVersions(quotationId: string): Promise<QuotationVersionRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<QuotationVersionRecord[]>>(
      `/quotations/${quotationId}/versions`,
    );

    return response.data.data;
  },

  async listApprovals(quotationId: string): Promise<QuotationApprovalRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<QuotationApprovalRecord[]>>(
      `/quotations/${quotationId}/approvals`,
    );

    return response.data.data;
  },

  async listPendingApprovals(): Promise<QuotationApprovalRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<QuotationApprovalRecord[]>>(
      "/quotation-approvals/pending",
    );

    return response.data.data;
  },

  async downloadPdf(
    quotationId: string,
    variant: "commercial" | "internal",
    versionNumber?: number,
  ): Promise<void> {
    const query = versionNumber ? `?version=${versionNumber}` : "";
    const response = await apiClient.get<Blob>(
      `/quotations/${quotationId}/pdf/${variant}${query}`,
      {
        headers: { Accept: "application/pdf" },
        responseType: "blob",
      },
    );

    if (typeof window === "undefined") {
      return;
    }

    const disposition = response.headers["content-disposition"] as string | undefined;
    const fileName = disposition?.match(/filename="([^"]+)"/)?.[1] ??
      `Cotizacion-${quotationId}-${variant}.pdf`;
    const url = window.URL.createObjectURL(response.data);
    const anchor = window.document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  },
};
