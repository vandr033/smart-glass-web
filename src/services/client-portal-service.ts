import { apiClient } from "@/services/api-client";
import type {
  ApiSuccessResponse,
  PaginatedApiSuccessResponse,
  PaginationMeta,
  PortalAceptarInvitacionInput,
  PortalAdminResumen,
  PortalAdminUsuario,
  PortalActualizarClienteInput,
  PortalCambiarEstadoInput,
  PortalCotizacionDetalle,
  PortalCotizacionListaItem,
  PortalCrearDocumentoInput,
  PortalCrearMensajeInput,
  PortalCrearMensajeInternoInput,
  PortalCrearPostventaInput,
  PortalDecisionCotizacionInput,
  PortalDocumentoItem,
  PortalGarantiaDocumento,
  PortalGarantiaItem,
  PortalInstalacionDetalle,
  PortalInvitacionPreview,
  PortalInvitarClienteInput,
  PortalLoginInput,
  PortalMensajeItem,
  PortalOlvideClaveInput,
  PortalPostventaDetalle,
  PortalPostventaListaItem,
  PortalProyectoDetalle,
  PortalProyectoListaItem,
  PortalProyectoResumen,
  PortalResumenPrincipal,
  PortalRestablecerInput,
  PortalSesion,
  PortalTipoDocumento,
} from "@/types";

const portalRequest = async <T>(
  promise: Promise<{ data: ApiSuccessResponse<T> }>,
): Promise<T> => {
  const response = await promise;
  return response.data.data;
};

export const clientPortalService = {
  async login(input: PortalLoginInput): Promise<{ user: PortalSesion }> {
    return portalRequest(
      apiClient.post("/portal-cliente/auth/iniciar-sesion", input),
    );
  },

  async logout(): Promise<{ cookieName: string; loggedOut: boolean }> {
    return portalRequest(apiClient.post("/portal-cliente/auth/cerrar-sesion"));
  },

  async getSession(): Promise<PortalSesion> {
    return portalRequest(apiClient.get("/portal-cliente/auth/sesion"));
  },

  async previewInvitation(token: string): Promise<PortalInvitacionPreview> {
    return portalRequest(apiClient.get(`/portal-cliente/auth/invitacion/${token}`));
  },

  async acceptInvitation(
    token: string,
    input: PortalAceptarInvitacionInput,
  ): Promise<{ user: PortalSesion }> {
    return portalRequest(
      apiClient.post(`/portal-cliente/auth/invitacion/${token}/aceptar`, input),
    );
  },

  async requestPasswordReset(input: PortalOlvideClaveInput): Promise<{ sent: boolean }> {
    return portalRequest(
      apiClient.post("/portal-cliente/auth/solicitar-restablecimiento", input),
    );
  },

  async resetPassword(input: PortalRestablecerInput): Promise<{ updated: boolean }> {
    return portalRequest(
      apiClient.post("/portal-cliente/auth/restablecer-contrasena", input),
    );
  },

  async getDashboard(): Promise<PortalResumenPrincipal> {
    return portalRequest(apiClient.get("/portal-cliente/resumen"));
  },

  async listQuotations(): Promise<PortalCotizacionListaItem[]> {
    return portalRequest(apiClient.get("/portal-cliente/cotizaciones"));
  },

  async getQuotation(quotationId: string): Promise<PortalCotizacionDetalle> {
    return portalRequest(apiClient.get(`/portal-cliente/cotizaciones/${quotationId}`));
  },

  async decideQuotation(
    quotationId: string,
    input: PortalDecisionCotizacionInput,
  ): Promise<{
    decision: "ACEPTAR" | "RECHAZAR";
    quotation: PortalCotizacionDetalle;
  }> {
    return portalRequest(
      apiClient.post(`/portal-cliente/cotizaciones/${quotationId}/decision`, input),
    );
  },

  async getQuotationPdfData(quotationId: string): Promise<PortalCotizacionDetalle> {
    return portalRequest(apiClient.get(`/portal-cliente/cotizaciones/${quotationId}/pdf`));
  },

  async listProjects(): Promise<PortalProyectoListaItem[]> {
    return portalRequest(apiClient.get("/portal-cliente/proyectos"));
  },

  async getProject(projectId: string): Promise<PortalProyectoDetalle> {
    return portalRequest(apiClient.get(`/portal-cliente/proyectos/${projectId}`));
  },

  async listInstallations(): Promise<
    Array<
      Pick<
        PortalInstalacionDetalle,
        | "address"
        | "code"
        | "id"
        | "installationType"
        | "notes"
        | "project"
        | "scheduledDate"
        | "scheduledEndTime"
        | "scheduledStartTime"
        | "status"
      >
    >
  > {
    return portalRequest(apiClient.get("/portal-cliente/instalaciones"));
  },

  async getInstallation(orderId: string): Promise<PortalInstalacionDetalle> {
    return portalRequest(apiClient.get(`/portal-cliente/instalaciones/${orderId}`));
  },

  async getInstallationReportData(orderId: string): Promise<PortalInstalacionDetalle> {
    return portalRequest(
      apiClient.get(`/portal-cliente/instalaciones/${orderId}/reporte`),
    );
  },

  async listWarranties(): Promise<PortalGarantiaItem[]> {
    return portalRequest(apiClient.get("/portal-cliente/garantias"));
  },

  async getWarrantyPdfData(warrantyId: string): Promise<PortalGarantiaDocumento> {
    return portalRequest(apiClient.get(`/portal-cliente/garantias/${warrantyId}/pdf`));
  },

  async listPostventaCases(): Promise<PortalPostventaListaItem[]> {
    return portalRequest(apiClient.get("/portal-cliente/postventa"));
  },

  async getPostventaCase(caseId: string): Promise<PortalPostventaDetalle> {
    return portalRequest(apiClient.get(`/portal-cliente/postventa/${caseId}`));
  },

  async createPostventaCase(
    input: PortalCrearPostventaInput,
    file?: File,
  ): Promise<PortalPostventaDetalle> {
    const formData = new FormData();
    formData.append("descripcion", input.descripcion);
    formData.append("prioridad", input.prioridad);
    formData.append("reportedAt", input.reportedAt);
    formData.append("tipo", input.tipo);

    if (input.projectId) {
      formData.append("projectId", input.projectId);
    }

    if (input.installationId) {
      formData.append("installationId", input.installationId);
    }

    if (input.quotationId) {
      formData.append("quotationId", input.quotationId);
    }

    if (input.warrantyId) {
      formData.append("warrantyId", input.warrantyId);
    }

    if (file) {
      formData.append("file", file);
    }

    return portalRequest(
      apiClient.post("/portal-cliente/postventa", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  async listDocuments(): Promise<PortalDocumentoItem[]> {
    return portalRequest(apiClient.get("/portal-cliente/documentos"));
  },

  async getDocumentDownload(documentId: string): Promise<PortalDocumentoItem> {
    return portalRequest(
      apiClient.get(`/portal-cliente/documentos/${documentId}/descargar`),
    );
  },

  async listMessages(projectId?: string): Promise<PortalMensajeItem[]> {
    const queryString = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
    return portalRequest(apiClient.get(`/portal-cliente/mensajes${queryString}`));
  },

  async createMessage(
    input: PortalCrearMensajeInput,
    file?: File,
  ): Promise<{ createdAt: string; id: string }> {
    const formData = new FormData();
    formData.append("mensaje", input.mensaje);
    formData.append("projectId", input.projectId);

    if (file) {
      formData.append("file", file);
    }

    return portalRequest(
      apiClient.post("/portal-cliente/mensajes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  async listAdminUsers(params: {
    page?: number;
    perPage?: number;
    search?: string;
    status?: string;
  }): Promise<{
    data: PortalAdminResumen;
    pagination: PaginationMeta;
  }> {
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

    if (params.status) {
      searchParams.set("status", params.status);
    }

    const response = await apiClient.get<PaginatedApiSuccessResponse<PortalAdminResumen>>(
      searchParams.size > 0
        ? `/portal-cliente/admin/usuarios?${searchParams.toString()}`
        : "/portal-cliente/admin/usuarios",
    );

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  async inviteUser(input: PortalInvitarClienteInput): Promise<PortalAdminUsuario> {
    return portalRequest(apiClient.post("/portal-cliente/admin/usuarios/invitar", input));
  },

  async updateUser(
    userId: string,
    input: PortalActualizarClienteInput,
  ): Promise<PortalSesion> {
    return portalRequest(apiClient.put(`/portal-cliente/admin/usuarios/${userId}`, input));
  },

  async changeUserStatus(
    userId: string,
    input: PortalCambiarEstadoInput,
  ): Promise<{ id: string; motivo: string | null; status: string }> {
    return portalRequest(
      apiClient.post(`/portal-cliente/admin/usuarios/${userId}/estado`, input),
    );
  },

  async createDocument(
    input: PortalCrearDocumentoInput,
    file: File,
  ): Promise<{
    fileUrl: string;
    id: string;
    name: string;
    project: PortalProyectoResumen;
    type: PortalTipoDocumento;
    uploadedAt: string;
    visibleToClient: boolean;
  }> {
    const formData = new FormData();
    formData.append("clientId", input.clientId);
    formData.append("name", input.name);
    formData.append("type", input.type);
    formData.append("visibleToClient", String(input.visibleToClient));
    formData.append("file", file);

    if (input.projectId) {
      formData.append("projectId", input.projectId);
    }

    return portalRequest(
      apiClient.post("/portal-cliente/admin/documentos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  async createInternalMessage(
    input: PortalCrearMensajeInternoInput,
    file?: File,
  ): Promise<{ createdAt: string; id: string }> {
    const formData = new FormData();
    formData.append("mensaje", input.mensaje);
    formData.append("projectId", input.projectId);

    if (input.sender) {
      formData.append("sender", input.sender);
    }

    if (file) {
      formData.append("file", file);
    }

    return portalRequest(
      apiClient.post("/portal-cliente/admin/mensajes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },
};
