import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  CancelMeasurementRequestInput,
  CreatedQuotationFromMeasurement,
  MeasurementCalendarView,
  MeasurementDecisionInput,
  MeasurementEvidenceInput,
  MeasurementOpeningInput,
  MeasurementRequestDetailRecord,
  MeasurementRequestInput,
  MeasurementRequestListItem,
  MeasurementRequestStatus,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  ReprogramMeasurementRequestInput,
  ResolveTechnicalObservationInput,
  ScheduleMeasurementRequestInput,
  StartMeasurementVisitInput,
  SubmitMeasurementApprovalInput,
  TechnicalObservationInput,
  UpdateMeasurementRequestInput,
} from "@/types";

const buildSearchParams = (params: {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  projectId?: string;
  search?: string;
  sortBy?: "createdAt" | "priority" | "requestedDate" | "scheduledDate" | "status";
  sortDirection?: "asc" | "desc";
  status?: MeasurementRequestStatus;
  technicianId?: string;
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

  if (params.technicianId) {
    searchParams.set("filter.technicianId", params.technicianId);
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  return searchParams.toString();
};

export const measurementService = {
  async listRequests(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    projectId?: string;
    search?: string;
    sortBy?: "createdAt" | "priority" | "requestedDate" | "scheduledDate" | "status";
    sortDirection?: "asc" | "desc";
    status?: MeasurementRequestStatus;
    technicianId?: string;
  }): Promise<{
    data: MeasurementRequestListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<MeasurementRequestListItem[]>
    >(queryString ? `/measurements/requests?${queryString}` : "/measurements/requests");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async listCalendar(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    status?: MeasurementRequestStatus;
    technicianId?: string;
    view?: MeasurementCalendarView;
  }): Promise<MeasurementRequestListItem[]> {
    const searchParams = new URLSearchParams();

    if (params.clientId) {
      searchParams.set("filter.clientId", params.clientId);
    }

    if (params.projectId) {
      searchParams.set("filter.projectId", params.projectId);
    }

    if (params.status) {
      searchParams.set("filter.status", params.status);
    }

    if (params.technicianId) {
      searchParams.set("filter.technicianId", params.technicianId);
    }

    if (params.dateFrom) {
      searchParams.set("dateFrom", params.dateFrom);
    }

    if (params.dateTo) {
      searchParams.set("dateTo", params.dateTo);
    }

    if (params.view) {
      searchParams.set("view", params.view);
    }

    const response = await apiClient.get<ApiSuccessResponse<MeasurementRequestListItem[]>>(
      `/measurements/calendar?${searchParams.toString()}`,
    );

    return response.data.data;
  },

  async getRequestById(requestId: string): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}`,
    );

    return response.data.data;
  },

  async createRequest(input: MeasurementRequestInput): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      "/measurements/requests",
      input,
    );

    return response.data.data;
  },

  async updateRequest(
    requestId: string,
    input: UpdateMeasurementRequestInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}`,
      input,
    );

    return response.data.data;
  },

  async scheduleRequest(
    requestId: string,
    input: ScheduleMeasurementRequestInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/schedule`,
      input,
    );

    return response.data.data;
  },

  async reprogramRequest(
    requestId: string,
    input: ReprogramMeasurementRequestInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/reprogram`,
      input,
    );

    return response.data.data;
  },

  async cancelRequest(
    requestId: string,
    input: CancelMeasurementRequestInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/cancel`,
      input,
    );

    return response.data.data;
  },

  async startVisit(
    requestId: string,
    input: StartMeasurementVisitInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/start-visit`,
      input,
    );

    return response.data.data;
  },

  async createOpening(
    requestId: string,
    input: MeasurementOpeningInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/openings`,
      input,
    );

    return response.data.data;
  },

  async updateOpening(
    openingId: string,
    input: MeasurementOpeningInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/openings/${openingId}`,
      input,
    );

    return response.data.data;
  },

  async duplicateOpening(openingId: string): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/openings/${openingId}/duplicate`,
    );

    return response.data.data;
  },

  async uploadEvidence(
    requestId: string,
    input: MeasurementEvidenceInput & {
      file: File;
    },
  ): Promise<MeasurementRequestDetailRecord> {
    const formData = new FormData();
    formData.append("type", input.type);

    if (input.description) {
      formData.append("description", input.description);
    }

    if (input.measurementOpeningId) {
      formData.append("measurementOpeningId", input.measurementOpeningId);
    }

    if (input.visitId) {
      formData.append("visitId", input.visitId);
    }

    formData.append("file", input.file);

    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/evidence`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },

  async createObservation(
    requestId: string,
    input: TechnicalObservationInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/observations`,
      input,
    );

    return response.data.data;
  },

  async resolveObservation(
    observationId: string,
    input: ResolveTechnicalObservationInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/observations/${observationId}/resolve`,
      input,
    );

    return response.data.data;
  },

  async submitForApproval(
    requestId: string,
    input: SubmitMeasurementApprovalInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/submit-approval`,
      input,
    );

    return response.data.data;
  },

  async approveRequest(
    requestId: string,
    input: MeasurementDecisionInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/approve`,
      input,
    );

    return response.data.data;
  },

  async rejectRequest(
    requestId: string,
    input: MeasurementDecisionInput,
  ): Promise<MeasurementRequestDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<MeasurementRequestDetailRecord>>(
      `/measurements/requests/${requestId}/reject`,
      input,
    );

    return response.data.data;
  },

  async createQuotationFromMeasurement(
    requestId: string,
  ): Promise<CreatedQuotationFromMeasurement> {
    const response = await apiClient.post<ApiSuccessResponse<CreatedQuotationFromMeasurement>>(
      `/measurements/requests/${requestId}/create-quotation`,
    );

    return response.data.data;
  },
};
