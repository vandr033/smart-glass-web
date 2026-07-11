import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AssignPostventaCaseInput,
  ChangePostventaCaseStatusInput,
  ClosePostventaCaseInput,
  ConsumePostventaReservationInput,
  CreatePostventaActivityInput,
  CreatePostventaCaseInput,
  CreatePostventaCostInput,
  CreatePostventaEvidenceInput,
  CreatePostventaReservationInput,
  CreateProductWarrantyInput,
  ListPostventaCasesParams,
  ListProductWarrantiesParams,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  PostventaCaseDetailRecord,
  PostventaCaseListItem,
  ProductWarrantyRecord,
  UpdatePostventaActivityInput,
  UpdatePostventaCaseInput,
  UpdateProductWarrantyInput,
} from "@/types";

const toQueryString = (
  values: Record<string, string | number | boolean | undefined | null>,
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

export const postventaService = {
  async listCases(params: ListPostventaCasesParams): Promise<{
    data: PostventaCaseListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = toQueryString({
      "filter.clientId": params.clientId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      perPage: params.perPage,
      "filter.priority": params.priority,
      "filter.projectId": params.projectId,
      "filter.responsibleId": params.responsibleId,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<PostventaCaseListItem[]>
    >(queryString ? `/postventa/casos?${queryString}` : "/postventa/casos");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getCaseById(caseId: string): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}`,
    );

    return response.data.data;
  },

  async createCase(input: CreatePostventaCaseInput): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      "/postventa/casos",
      input,
    );

    return response.data.data;
  },

  async createCaseFromClient(
    clientId: string,
    input: CreatePostventaCaseInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/from-client/${clientId}`,
      input,
    );

    return response.data.data;
  },

  async createCaseFromProject(
    projectId: string,
    input: CreatePostventaCaseInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/from-project/${projectId}`,
      input,
    );

    return response.data.data;
  },

  async createCaseFromInstallation(
    installationId: string,
    input: CreatePostventaCaseInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/from-installation/${installationId}`,
      input,
    );

    return response.data.data;
  },

  async updateCase(
    caseId: string,
    input: UpdatePostventaCaseInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}`,
      input,
    );

    return response.data.data;
  },

  async assignCase(
    caseId: string,
    input: AssignPostventaCaseInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/asignar`,
      input,
    );

    return response.data.data;
  },

  async changeCaseStatus(
    caseId: string,
    input: ChangePostventaCaseStatusInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/estado`,
      input,
    );

    return response.data.data;
  },

  async closeCase(
    caseId: string,
    input: ClosePostventaCaseInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/cerrar`,
      input,
    );

    return response.data.data;
  },

  async createActivity(
    caseId: string,
    input: CreatePostventaActivityInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/actividades`,
      input,
    );

    return response.data.data;
  },

  async updateActivity(
    activityId: string,
    input: UpdatePostventaActivityInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/actividades/${activityId}`,
      input,
    );

    return response.data.data;
  },

  async uploadEvidence(
    caseId: string,
    input: CreatePostventaEvidenceInput,
  ): Promise<PostventaCaseDetailRecord> {
    const formData = new FormData();
    formData.append("type", input.type);

    if (input.activityId) {
      formData.append("activityId", input.activityId);
    }

    if (input.description) {
      formData.append("description", input.description);
    }

    formData.append("file", input.file);
    formData.append("originalName", input.file.name);
    formData.append("size", String(input.file.size));

    if (input.file.type) {
      formData.append("mimetype", input.file.type);
    }

    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/evidencias`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },

  async createCost(
    caseId: string,
    input: CreatePostventaCostInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/costos`,
      input,
    );

    return response.data.data;
  },

  async createReservation(
    caseId: string,
    input: CreatePostventaReservationInput,
  ): Promise<PostventaCaseDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<PostventaCaseDetailRecord>>(
      `/postventa/casos/${caseId}/reservas`,
      input,
    );

    return response.data.data;
  },

  async consumeReservation(
    reservationLinkId: string,
    input: ConsumePostventaReservationInput,
  ): Promise<unknown> {
    const response = await apiClient.post<ApiSuccessResponse<unknown>>(
      `/postventa/reservas/${reservationLinkId}/consumir`,
      input,
    );

    return response.data.data;
  },

  async releaseReservation(reservationLinkId: string): Promise<unknown> {
    const response = await apiClient.post<ApiSuccessResponse<unknown>>(
      `/postventa/reservas/${reservationLinkId}/liberar`,
    );

    return response.data.data;
  },

  async listWarranties(params: ListProductWarrantiesParams): Promise<{
    data: ProductWarrantyRecord[];
    pagination: PaginationMeta;
  }> {
    const queryString = toQueryString({
      "filter.clientId": params.clientId,
      page: params.page,
      perPage: params.perPage,
      "filter.projectId": params.projectId,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
      vigente: params.vigente,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProductWarrantyRecord[]>
    >(queryString ? `/postventa/garantias?${queryString}` : "/postventa/garantias");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createWarranty(
    input: CreateProductWarrantyInput,
  ): Promise<ProductWarrantyRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductWarrantyRecord>>(
      "/postventa/garantias",
      input,
    );

    return response.data.data;
  },

  async updateWarranty(
    warrantyId: string,
    input: UpdateProductWarrantyInput,
  ): Promise<ProductWarrantyRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProductWarrantyRecord>>(
      `/postventa/garantias/${warrantyId}`,
      input,
    );

    return response.data.data;
  },
};
