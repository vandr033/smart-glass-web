import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  ConsumeMaterialForTaskInput,
  CreateProductionJobInput,
  MaterialConsumptionRecord,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  ProductionJobDetailRecord,
  ProductionJobListItem,
  ProductionJobPriority,
  ProductionJobStatus,
  ProductionTaskRecord,
  ProductionWasteReportRecord,
  QualityCheckRecord,
  RecordQualityCheckInput,
  UpdateProductionJobInput,
  UpdateProductionTaskInput,
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

export const productionService = {
  async listJobs(params: {
    assignedToUserId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    priority?: ProductionJobPriority;
    projectId?: string;
    quotationId?: string;
    search?: string;
    sortBy?: "actualStartDate" | "createdAt" | "plannedEndDate" | "plannedStartDate" | "updatedAt";
    sortDirection?: "asc" | "desc";
    status?: ProductionJobStatus;
  }): Promise<PaginatedResult<ProductionJobListItem>> {
    const queryString = toQueryString({
      "filter.assignedToUserId": params.assignedToUserId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      perPage: params.perPage,
      "filter.priority": params.priority,
      "filter.projectId": params.projectId,
      "filter.quotationId": params.quotationId,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<ProductionJobListItem[]>
    >(queryString ? `/production/jobs?${queryString}` : "/production/jobs");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async createJob(input: CreateProductionJobInput): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      "/production/jobs",
      input,
    );

    return response.data.data;
  },

  async getJobById(jobId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}`,
    );

    return response.data.data;
  },

  async updateJob(
    jobId: string,
    input: UpdateProductionJobInput,
  ): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}`,
      input,
    );

    return response.data.data;
  },

  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/production/jobs/${jobId}`);
  },

  async createJobFromQuotation(quotationId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/from-quotation/${quotationId}`,
    );

    return response.data.data;
  },

  async createJobFromCuttingPlan(cuttingPlanId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/from-cutting-plan/${cuttingPlanId}`,
    );

    return response.data.data;
  },

  async createJobFromProfileCuttingPlan(
    profileCuttingPlanId: string,
  ): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/from-profile-cutting-plan/${profileCuttingPlanId}`,
    );

    return response.data.data;
  },

  async startJob(jobId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}/start`,
    );

    return response.data.data;
  },

  async pauseJob(jobId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}/pause`,
    );

    return response.data.data;
  },

  async completeJob(jobId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}/complete`,
    );

    return response.data.data;
  },

  async cancelJob(jobId: string): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}/cancel`,
    );

    return response.data.data;
  },

  async assignJob(
    jobId: string,
    assignedToUserId: string | null,
  ): Promise<ProductionJobDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionJobDetailRecord>>(
      `/production/jobs/${jobId}/assign`,
      {
        assignedToUserId,
      },
    );

    return response.data.data;
  },

  async listJobTasks(jobId: string): Promise<ProductionTaskRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ProductionTaskRecord[]>>(
      `/production/jobs/${jobId}/tasks`,
    );

    return response.data.data;
  },

  async generateTasks(
    jobId: string,
    replaceExisting = false,
  ): Promise<ProductionTaskRecord[]> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionTaskRecord[]>>(
      `/production/jobs/${jobId}/generate-tasks`,
      {
        replaceExisting,
      },
    );

    return response.data.data;
  },

  async listConsumptions(jobId: string): Promise<MaterialConsumptionRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<MaterialConsumptionRecord[]>>(
      `/production/jobs/${jobId}/consumption`,
    );

    return response.data.data;
  },

  async updateTask(
    taskId: string,
    input: UpdateProductionTaskInput,
  ): Promise<ProductionTaskRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ProductionTaskRecord>>(
      `/production/tasks/${taskId}`,
      input,
    );

    return response.data.data;
  },

  async startTask(taskId: string): Promise<ProductionTaskRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionTaskRecord>>(
      `/production/tasks/${taskId}/start`,
    );

    return response.data.data;
  },

  async completeTask(taskId: string): Promise<ProductionTaskRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionTaskRecord>>(
      `/production/tasks/${taskId}/complete`,
    );

    return response.data.data;
  },

  async consumeMaterial(
    taskId: string,
    input: ConsumeMaterialForTaskInput,
  ): Promise<{
    consumptions: MaterialConsumptionRecord[];
    remnantOutput: {
      code: string;
      id: string;
    } | null;
    task: ProductionTaskRecord;
  }> {
    const response = await apiClient.post<
      ApiSuccessResponse<{
        consumptions: MaterialConsumptionRecord[];
        remnantOutput: {
          code: string;
          id: string;
        } | null;
        task: ProductionTaskRecord;
      }>
    >(`/production/tasks/${taskId}/consume-material`, input);

    return response.data.data;
  },

  async listQualityChecks(jobId: string): Promise<QualityCheckRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<QualityCheckRecord[]>>(
      `/production/jobs/${jobId}/quality-checks`,
    );

    return response.data.data;
  },

  async recordQualityCheck(
    jobId: string,
    input: RecordQualityCheckInput,
  ): Promise<QualityCheckRecord> {
    const response = await apiClient.post<ApiSuccessResponse<QualityCheckRecord>>(
      `/production/jobs/${jobId}/quality-checks`,
      input,
    );

    return response.data.data;
  },

  async getWasteReport(jobId: string): Promise<ProductionWasteReportRecord | null> {
    const response = await apiClient.get<
      ApiSuccessResponse<ProductionWasteReportRecord | null>
    >(`/production/jobs/${jobId}/waste-report`);

    return response.data.data;
  },

  async calculateWasteReport(jobId: string): Promise<ProductionWasteReportRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ProductionWasteReportRecord>>(
      `/production/jobs/${jobId}/calculate-waste`,
    );

    return response.data.data;
  },
};
