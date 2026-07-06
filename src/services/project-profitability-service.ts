import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  RentabilidadProyectoDashboardRecord,
  RentabilidadProyectoDetailRecord,
  RentabilidadProyectoListItem,
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

export const projectProfitabilityService = {
  async getDashboard(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    priority?: string;
    projectType?: string;
    salesUserId?: string;
    search?: string;
    status?: string;
  }): Promise<RentabilidadProyectoDashboardRecord> {
    const queryString = toQueryString({
      "filter.clientId": params.clientId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      "filter.priority": params.priority,
      "filter.projectType": params.projectType,
      "filter.salesUserId": params.salesUserId,
      search: params.search?.trim() || undefined,
      "filter.status": params.status,
    });
    const response = await apiClient.get<
      ApiSuccessResponse<RentabilidadProyectoDashboardRecord>
    >(queryString ? `/project-profitability/dashboard?${queryString}` : "/project-profitability/dashboard");

    return response.data.data;
  },

  async listProjectProfitability(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    perPage?: number;
    priority?: string;
    projectType?: string;
    salesUserId?: string;
    search?: string;
    sortBy?:
      | "calculadoEn"
      | "diferenciaContraPresupuesto"
      | "ingresoReal"
      | "margenBruto"
      | "utilidadBruta";
    sortDirection?: "asc" | "desc";
    status?: string;
  }): Promise<{
    data: RentabilidadProyectoListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = toQueryString({
      "filter.clientId": params.clientId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      page: params.page,
      perPage: params.perPage,
      "filter.priority": params.priority,
      "filter.projectType": params.projectType,
      "filter.salesUserId": params.salesUserId,
      search: params.search?.trim() || undefined,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      "filter.status": params.status,
    });
    const response = await apiClient.get<
      PaginatedApiSuccessResponse<RentabilidadProyectoListItem[]>
    >(queryString ? `/project-profitability?${queryString}` : "/project-profitability");

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getProjectProfitabilityByProjectId(
    projectId: string,
  ): Promise<RentabilidadProyectoDetailRecord> {
    const response = await apiClient.get<
      ApiSuccessResponse<RentabilidadProyectoDetailRecord>
    >(`/project-profitability/projects/${projectId}`);

    return response.data.data;
  },
};
