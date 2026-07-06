import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, EnabledModule } from "@/types";

export const moduleService = {
  async getEnabledModules(): Promise<EnabledModule[]> {
    const response = await apiClient.get<ApiSuccessResponse<EnabledModule[]>>("/modules");
    return response.data.data;
  },
};
