import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse, CurrentUserPayload } from "@/types";

export const meService = {
  async getCurrentUser(): Promise<CurrentUserPayload> {
    const response = await apiClient.get<ApiSuccessResponse<CurrentUserPayload>>("/me");
    return response.data.data;
  },
};
