import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  ProjectAttachmentInput,
  ProjectAttachmentRecord,
  ProjectDashboardSummaryRecord,
  ProjectDetailRecord,
  ProjectListItem,
  ProjectMeasurementInput,
  ProjectMeasurementRecord,
  ProjectMutationInput,
  ProjectNoteInput,
  ProjectNoteRecord,
  ProjectPriority,
  ProjectStatus,
  ProjectStatusHistoryRecord,
  ProjectTransitionInput,
  ProjectTransitionResult,
  ProjectType,
  ProjectUserOption,
} from "@/types";

const buildSearchParams = (params: {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  priority?: ProjectPriority;
  projectType?: ProjectType;
  responsibleUserId?: string;
  salesUserId?: string;
  search?: string;
  sortBy?: "createdAt" | "expectedDeliveryDate" | "priority" | "status";
  sortDirection?: "asc" | "desc";
  status?: ProjectStatus;
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

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  if (params.priority) {
    searchParams.set("filter.priority", params.priority);
  }

  if (params.projectType) {
    searchParams.set("filter.projectType", params.projectType);
  }

  if (params.responsibleUserId) {
    searchParams.set("filter.responsibleUserId", params.responsibleUserId);
  }

  if (params.salesUserId) {
    searchParams.set("filter.salesUserId", params.salesUserId);
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  return searchParams.toString();
};

export const projectService = {
  async listProjects(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    priority?: ProjectPriority;
    projectType?: ProjectType;
    responsibleUserId?: string;
    salesUserId?: string;
    search?: string;
    sortBy?: "createdAt" | "expectedDeliveryDate" | "priority" | "status";
    sortDirection?: "asc" | "desc";
    status?: ProjectStatus;
  }): Promise<{
    data: ProjectListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams(params);
    const response = await apiClient.get<PaginatedApiSuccessResponse<ProjectListItem[]>>(
      queryString ? `/projects?${queryString}` : "/projects",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getProjectById(projectId: string): Promise<ProjectDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectDetailRecord>>(
      `/projects/${projectId}`,
    );

    return response.data.data;
  },

  async createProject(input: ProjectMutationInput): Promise<ProjectDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProjectDetailRecord>>(
      "/projects",
      input,
    );

    return response.data.data;
  },

  async updateProject(
    projectId: string,
    input: ProjectMutationInput,
  ): Promise<ProjectDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProjectDetailRecord>>(
      `/projects/${projectId}`,
      input,
    );

    return response.data.data;
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  async transitionProject(
    projectId: string,
    input: ProjectTransitionInput,
  ): Promise<ProjectTransitionResult> {
    const response = await apiClient.post<ApiSuccessResponse<ProjectTransitionResult>>(
      `/projects/${projectId}/transition`,
      input,
    );

    return response.data.data;
  },

  async listProjectStatusHistory(projectId: string): Promise<ProjectStatusHistoryRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectStatusHistoryRecord[]>>(
      `/projects/${projectId}/status-history`,
    );

    return response.data.data;
  },

  async listProjectNotes(projectId: string): Promise<ProjectNoteRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectNoteRecord[]>>(
      `/projects/${projectId}/notes`,
    );

    return response.data.data;
  },

  async createProjectNote(
    projectId: string,
    input: ProjectNoteInput,
  ): Promise<ProjectNoteRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProjectNoteRecord>>(
      `/projects/${projectId}/notes`,
      input,
    );

    return response.data.data;
  },

  async updateProjectNote(
    projectId: string,
    noteId: string,
    input: ProjectNoteInput,
  ): Promise<ProjectNoteRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProjectNoteRecord>>(
      `/projects/${projectId}/notes/${noteId}`,
      input,
    );

    return response.data.data;
  },

  async deleteProjectNote(projectId: string, noteId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/notes/${noteId}`);
  },

  async listProjectAttachments(projectId: string): Promise<ProjectAttachmentRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectAttachmentRecord[]>>(
      `/projects/${projectId}/attachments`,
    );

    return response.data.data;
  },

  async createProjectAttachment(
    projectId: string,
    input: ProjectAttachmentInput,
    file: File,
  ): Promise<ProjectAttachmentRecord> {
    const formData = new FormData();
    formData.append("attachmentType", input.attachmentType);
    if (input.description) {
      formData.append("description", input.description);
    }
    formData.append("file", file);

    const response = await apiClient.post<ApiSuccessResponse<ProjectAttachmentRecord>>(
      `/projects/${projectId}/attachments`,
      formData,
      {
        headers: {
          // Let the browser/axios add the multipart boundary.
          Accept: "application/json",
          "Content-Type": undefined,
        },
      },
    );

    return response.data.data;
  },

  async deleteProjectAttachment(projectId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/attachments/${attachmentId}`);
  },

  async listProjectMeasurements(projectId: string): Promise<ProjectMeasurementRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectMeasurementRecord[]>>(
      `/projects/${projectId}/measurements`,
    );

    return response.data.data;
  },

  async createProjectMeasurement(
    projectId: string,
    input: ProjectMeasurementInput,
  ): Promise<ProjectMeasurementRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProjectMeasurementRecord>>(
      `/projects/${projectId}/measurements`,
      input,
    );

    return response.data.data;
  },

  async updateProjectMeasurement(
    projectId: string,
    measurementId: string,
    input: ProjectMeasurementInput,
  ): Promise<ProjectMeasurementRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProjectMeasurementRecord>>(
      `/projects/${projectId}/measurements/${measurementId}`,
      input,
    );

    return response.data.data;
  },

  async deleteProjectMeasurement(projectId: string, measurementId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/measurements/${measurementId}`);
  },

  async getDashboardSummary(): Promise<ProjectDashboardSummaryRecord> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectDashboardSummaryRecord>>(
      "/projects/dashboard-summary",
    );

    return response.data.data;
  },

  async listProjectUserOptions(): Promise<ProjectUserOption[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProjectUserOption[]>>(
      "/projects/user-options",
    );

    return response.data.data;
  },
};
