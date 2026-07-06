import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  AuthorizationSummary,
  PermissionCatalogGroup,
  PermissionCatalogItem,
} from "@/types";

export const permissionService = {
  async getPermissionCatalog(): Promise<{
    groups: PermissionCatalogGroup[];
    permissions: PermissionCatalogItem[];
  }> {
    const response = await apiClient.get<
      ApiSuccessResponse<{
        groups: PermissionCatalogGroup[];
        permissions: PermissionCatalogItem[];
      }>
    >("/permissions");

    return response.data.data;
  },

  async getMyAuthorization(): Promise<AuthorizationSummary> {
    const response =
      await apiClient.get<ApiSuccessResponse<AuthorizationSummary>>("/permissions/me");

    return response.data.data;
  },
};
