import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  ClientAddressInput,
  ClientAddressRecord,
  ClientContactInput,
  ClientContactRecord,
  ClientDetailRecord,
  ClientListItem,
  ClientMutationInput,
  ClientStatus,
  ClientType,
  PaginatedApiSuccessResponse,
  PaginationMeta,
} from "@/types";

const buildSearchParams = (params: {
  clientType?: ClientType;
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: "createdAt" | "name" | "status";
  sortDirection?: "asc" | "desc";
  status?: ClientStatus;
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

  if (params.clientType) {
    searchParams.set("filter.clientType", params.clientType);
  }

  if (params.status) {
    searchParams.set("filter.status", params.status);
  }

  return searchParams.toString();
};

export const clientService = {
  async listClients(params: {
    clientType?: ClientType;
    page?: number;
    perPage?: number;
    search?: string;
    sortBy?: "createdAt" | "name" | "status";
    sortDirection?: "asc" | "desc";
    status?: ClientStatus;
  }): Promise<{
    data: ClientListItem[];
    pagination: PaginationMeta;
  }> {
    const queryString = buildSearchParams(params);
    const response = await apiClient.get<PaginatedApiSuccessResponse<ClientListItem[]>>(
      queryString ? `/clients?${queryString}` : "/clients",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async getClientById(clientId: string): Promise<ClientDetailRecord> {
    const response = await apiClient.get<ApiSuccessResponse<ClientDetailRecord>>(
      `/clients/${clientId}`,
    );

    return response.data.data;
  },

  async createClient(input: ClientMutationInput): Promise<ClientDetailRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ClientDetailRecord>>(
      "/clients",
      input,
    );

    return response.data.data;
  },

  async updateClient(
    clientId: string,
    input: ClientMutationInput,
  ): Promise<ClientDetailRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ClientDetailRecord>>(
      `/clients/${clientId}`,
      input,
    );

    return response.data.data;
  },

  async deleteClient(clientId: string): Promise<void> {
    await apiClient.delete(`/clients/${clientId}`);
  },

  async listClientContacts(clientId: string): Promise<ClientContactRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ClientContactRecord[]>>(
      `/clients/${clientId}/contacts`,
    );

    return response.data.data;
  },

  async createClientContact(
    clientId: string,
    input: ClientContactInput,
  ): Promise<ClientContactRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ClientContactRecord>>(
      `/clients/${clientId}/contacts`,
      input,
    );

    return response.data.data;
  },

  async updateClientContact(
    clientId: string,
    contactId: string,
    input: ClientContactInput,
  ): Promise<ClientContactRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ClientContactRecord>>(
      `/clients/${clientId}/contacts/${contactId}`,
      input,
    );

    return response.data.data;
  },

  async deleteClientContact(clientId: string, contactId: string): Promise<void> {
    await apiClient.delete(`/clients/${clientId}/contacts/${contactId}`);
  },

  async listClientAddresses(clientId: string): Promise<ClientAddressRecord[]> {
    const response = await apiClient.get<ApiSuccessResponse<ClientAddressRecord[]>>(
      `/clients/${clientId}/addresses`,
    );

    return response.data.data;
  },

  async createClientAddress(
    clientId: string,
    input: ClientAddressInput,
  ): Promise<ClientAddressRecord> {
    const response = await apiClient.post<ApiSuccessResponse<ClientAddressRecord>>(
      `/clients/${clientId}/addresses`,
      input,
    );

    return response.data.data;
  },

  async updateClientAddress(
    clientId: string,
    addressId: string,
    input: ClientAddressInput,
  ): Promise<ClientAddressRecord> {
    const response = await apiClient.put<ApiSuccessResponse<ClientAddressRecord>>(
      `/clients/${clientId}/addresses/${addressId}`,
      input,
    );

    return response.data.data;
  },

  async deleteClientAddress(clientId: string, addressId: string): Promise<void> {
    await apiClient.delete(`/clients/${clientId}/addresses/${addressId}`);
  },
};
