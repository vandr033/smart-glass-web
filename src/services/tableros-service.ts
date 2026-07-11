import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, PanelEjecutivoRecord } from "@/types";

const toQueryString = (
  values: Record<string, string | undefined | null>,
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    searchParams.set(key, value);
  });

  return searchParams.toString();
};

export const tablerosService = {
  async getPanelEjecutivo(params: {
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    projectId?: string;
    responsibleId?: string;
    salesUserId?: string;
    status?: string;
    warehouseId?: string;
  }): Promise<PanelEjecutivoRecord> {
    const queryString = toQueryString({
      "filter.clientId": params.clientId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      "filter.projectId": params.projectId,
      "filter.responsibleId": params.responsibleId,
      "filter.salesUserId": params.salesUserId,
      "filter.status": params.status,
      "filter.warehouseId": params.warehouseId,
    });
    const response = await apiClient.get<ApiSuccessResponse<PanelEjecutivoRecord>>(
      queryString ? `/tableros/panel-ejecutivo?${queryString}` : "/tableros/panel-ejecutivo",
    );

    return response.data.data;
  },
};
