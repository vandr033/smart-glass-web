import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AssignInstallationOrderInput,
  ChangeInstallationStatusInput,
  InstallationCalendarView,
  InstallationIssueInput,
  InstallationOrderDetailRecord,
  InstallationOrderInput,
  InstallationOrderListItem,
  InstallationOrderStatus,
  InstallationTeamInput,
  InstallationTeamRecord,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  ResolveInstallationIssueInput,
  RescheduleInstallationOrderInput,
  UpdateInstallationOrderInput,
  UpdateInstallationTaskInput,
} from "@/types";

const buildSearchParams = (params: {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  projectId?: string;
  search?: string;
  sortBy?: "createdAt" | "priority" | "scheduledDate" | "status";
  sortDirection?: "asc" | "desc";
  status?: InstallationOrderStatus;
  teamId?: string;
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

  if (params.teamId) {
    searchParams.set("filter.teamId", params.teamId);
  }

  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }

  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }

  return searchParams.toString();
};

export const installationService = {
  async listOrders(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    projectId?: string;
    search?: string;
    sortBy?: "createdAt" | "priority" | "scheduledDate" | "status";
    sortDirection?: "asc" | "desc";
    status?: InstallationOrderStatus;
    teamId?: string;
  }): Promise<{
    data: InstallationOrderListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams(params);
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<InstallationOrderListItem[]>
    >(queryString ? `/installations/orders?${queryString}` : "/installations/orders");

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
    status?: InstallationOrderStatus;
    teamId?: string;
    view?: InstallationCalendarView;
  }): Promise<InstallationOrderListItem[]> {
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

    if (params.teamId) {
      searchParams.set("filter.teamId", params.teamId);
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

    const response = await apiClient.get<ApiSuccessResponse<InstallationOrderListItem[]>>(
      `/installations/calendar?${searchParams.toString()}`,
    );

    return response.data.data;
  },

  async getOrderById(orderId: string): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/${orderId}`,
    );

    return response.data.data;
  },

  async createOrder(input: InstallationOrderInput): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      "/installations/orders",
      input,
    );

    return response.data.data;
  },

  async createOrderFromProject(
    projectId: string,
    input: InstallationOrderInput,
  ): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/from-project/${projectId}`,
      input,
    );

    return response.data.data;
  },

  async createOrderFromQuotation(
    quotationId: string,
    input: InstallationOrderInput,
  ): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/from-quotation/${quotationId}`,
      input,
    );

    return response.data.data;
  },

  async updateOrder(
    orderId: string,
    input: UpdateInstallationOrderInput,
  ): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/${orderId}`,
      input,
    );

    return response.data.data;
  },

  async assignOrder(
    orderId: string,
    input: AssignInstallationOrderInput,
  ): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/${orderId}/assign`,
      input,
    );

    return response.data.data;
  },

  async rescheduleOrder(
    orderId: string,
    input: RescheduleInstallationOrderInput,
  ): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/${orderId}/reschedule`,
      input,
    );

    return response.data.data;
  },

  async changeOrderStatus(
    orderId: string,
    input: ChangeInstallationStatusInput,
  ): Promise<InstallationOrderDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<InstallationOrderDetailRecord>>(
      `/installations/orders/${orderId}/status`,
      input,
    );

    return response.data.data;
  },

  async updateTask(
    taskId: string,
    input: UpdateInstallationTaskInput,
  ) {
    const response = await apiClient.put(`/installations/tasks/${taskId}`, input);
    return response.data.data;
  },

  async completeTask(taskId: string) {
    const response = await apiClient.post(`/installations/tasks/${taskId}/complete`);
    return response.data.data;
  },

  async uploadEvidence(
    orderId: string,
    input: {
      description: string | null;
      file: File;
      taskId: string | null;
      type: "PHOTO" | "FILE" | "SIGNATURE" | "CHECKLIST" | "OTHER";
    },
  ) {
    const formData = new FormData();
    formData.append("type", input.type);

    if (input.description) {
      formData.append("description", input.description);
    }

    if (input.taskId) {
      formData.append("taskId", input.taskId);
    }

    formData.append("file", input.file);

    const response = await apiClient.post(
      `/installations/orders/${orderId}/evidence`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  },

  async createIssue(orderId: string, input: InstallationIssueInput) {
    const response = await apiClient.post(
      `/installations/orders/${orderId}/issues`,
      input,
    );

    return response.data.data;
  },

  async resolveIssue(issueId: string, input: ResolveInstallationIssueInput) {
    const response = await apiClient.post(
      `/installations/issues/${issueId}/resolve`,
      input,
    );

    return response.data.data;
  },

  async listTeams(): Promise<InstallationTeamRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<InstallationTeamRecord[]>>(
      "/installations/teams",
    );

    return response.data.data;
  },

  async createTeam(input: InstallationTeamInput) {
    const response = await apiClient.post<ApiSuccessResponse<InstallationTeamRecord>>(
      "/installations/teams",
      input,
    );

    return response.data.data;
  },

  async updateTeam(teamId: string, input: InstallationTeamInput) {
    const response = await apiClient.put<ApiSuccessResponse<InstallationTeamRecord>>(
      `/installations/teams/${teamId}`,
      input,
    );

    return response.data.data;
  },
};
