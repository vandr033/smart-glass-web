import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, SystemSettingRecord } from "@/types";

export const systemSettingService = {
  async getSettings(): Promise<SystemSettingRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<SystemSettingRecord[]>>(
      "/settings",
    );

    return response.data.data;
  },

  async updateSetting(
    key: string,
    input: {
      description?: string | null;
      valueJson: unknown;
    },
  ): Promise<SystemSettingRecord> {
    const response = await apiClient.put<ApiSuccessResponse<SystemSettingRecord>>(
      `/settings/${encodeURIComponent(key)}`,
      input,
    );

    return response.data.data;
  },
};
