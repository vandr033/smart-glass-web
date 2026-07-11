import { apiClient } from "@/services/api-client";
import type { ApiSuccessResponse } from "@/types";

export type OperationalSummary = {
  almacen: number;
  instalaciones: number;
  mediciones: number;
  notificaciones: number;
  ordenesProduccion: number;
  tareasAsignadas: number;
  tareasPendientes: number;
};

export type OperationalTask = {
  assignedToUserId: string | null;
  completedAt: string | null;
  description: string | null;
  id: string;
  productionJob: {
    code: string;
    plannedEndDate: string | null;
    priority: string;
  };
  startedAt: string | null;
  status: string;
  taskType: string;
  title: string;
  updatedAt: string;
};

export type ScanResult = {
  encontrado: boolean;
  entidad?: string;
  mensaje?: string;
  registro?: Record<string, unknown>;
};

export const operationalPortalService = {
  async getSummary(): Promise<OperationalSummary> {
    const response = await apiClient.get<ApiSuccessResponse<OperationalSummary>>("/operaciones/resumen");
    return response.data.data;
  },

  async listTasks(): Promise<OperationalTask[]> {
    const response = await apiClient.get<ApiSuccessResponse<OperationalTask[]>>("/operaciones/mis-tareas");
    return response.data.data;
  },

  async resolveScan(code: string): Promise<ScanResult> {
    const response = await apiClient.post<ApiSuccessResponse<ScanResult>>("/operaciones/escanear/resolver", { code });
    return response.data.data;
  },
};

