export type PortalClienteEstado =
  | "ACTIVO"
  | "INACTIVO"
  | "PENDIENTE_INVITACION"
  | "INVITACION_ENVIADA"
  | "ACCESO_BLOQUEADO";

export type PortalTipoDocumento =
  | "COTIZACION"
  | "CONTRATO"
  | "PLANO"
  | "MEDICION"
  | "REPORTE_INSTALACION"
  | "GARANTIA"
  | "DOCUMENTO_ADICIONAL";

export type PortalRemitenteMensaje = "CLIENTE" | "EQUIPO_INTERNO";

export type PortalClienteResumen = {
  displayName: string;
  id: string;
};

export type PortalProyectoResumen = {
  code: string;
  id: string;
  status?: string;
  title: string;
} | null;

export type PortalInstalacionResumen = {
  code: string;
  id: string;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
  status: string;
};

export type PortalUsuarioProyecto = {
  code: string;
  id: string;
  permissions: string[];
  status: string;
  title: string;
};

export type PortalSesion = {
  client: PortalClienteResumen;
  email: string;
  id: string;
  lastAccessAt: string | null;
  name: string;
  phone: string | null;
  projects: PortalUsuarioProyecto[];
  status: PortalClienteEstado;
};

export type PortalResumenPrincipal = {
  cliente: PortalClienteResumen;
  contadores: {
    casosPostventaAbiertos: number;
    cotizacionesPendientes: number;
    documentosDisponibles: number;
    garantiasVigentes: number;
    instalacionesProximas: number;
    proyectosActivos: number;
  };
  instalacionesProximas: Array<
    PortalInstalacionResumen & {
      address: {
        address: string | null;
        label: string;
      } | null;
      project: PortalProyectoResumen;
    }
  >;
  resumenCotizaciones: PortalCotizacionListaItem[];
  resumenDocumentos: PortalDocumentoItem[];
};

export type PortalCotizacionListaItem = {
  client: {
    clientType: "COMPANY" | "INDIVIDUAL";
    displayName: string;
    id: string;
  };
  code: string;
  createdAt: string;
  currency: string;
  id: string;
  project: PortalProyectoResumen;
  status: string;
  totalSale: number;
  validUntil: string | null;
};

export type PortalCotizacionDetalle = {
  client: PortalCotizacionListaItem["client"];
  code: string;
  createdAt: string;
  currency: string;
  id: string;
  items: Array<{
    description: string | null;
    id: string;
    itemType: string;
    name: string;
    quantity: number;
    subtotalSale: number;
  }>;
  notes: string | null;
  project: PortalProyectoResumen;
  status: string;
  statusHistory: Array<{
    changedByUser?: unknown;
    createdAt: string;
    fromStatus: string | null;
    id: string;
    notes: string | null;
    toStatus: string;
  }>;
  totalSale: number;
  validUntil: string | null;
};

export type PortalProyectoListaItem = {
  avanceGeneral: number;
  code: string;
  expectedDeliveryDate: string | null;
  expectedInstallationDate: string | null;
  expectedMeasurementDate: string | null;
  id: string;
  priority: string;
  projectType: string;
  status: string;
  title: string;
  updatedAt: string;
};

export type PortalProyectoDetalle = {
  attachments: Array<{
    attachmentType: string;
    createdAt: string;
    description: string | null;
    fileName: string;
    fileUrl: string;
    id: string;
    mimeType: string | null;
    sizeBytes: number | null;
  }>;
  approvedMeasurements: Array<{
    code: string;
    id: string;
    requestedDate: string;
    scheduledDate: string | null;
    scheduledEndTime: string | null;
    scheduledStartTime: string | null;
    status: string;
    visits: Array<{
      evidence: Array<{
        fileName: string;
        fileUrl: string;
        id: string;
        type: string;
        uploadedAt: string;
      }>;
      id: string;
      openings: Array<{
        code: string;
        depthMm: number | null;
        elementType: string;
        environment: string;
        heightMm: number | null;
        id: string;
        observations: string | null;
        quantity: number;
        status: string;
        widthMm: number | null;
      }>;
    }>;
  }>;
  avanceGeneral: number;
  code: string;
  description: string | null;
  expectedDeliveryDate: string | null;
  expectedInstallationDate: string | null;
  expectedMeasurementDate: string | null;
  id: string;
  installations: PortalInstalacionResumen[];
  measurements: Array<{
    createdAt: string;
    depthMm: number | null;
    heightMm: number | null;
    id: string;
    locationDescription: string | null;
    measurementDate: string | null;
    notes: string | null;
    quantity: number;
    widthMm: number | null;
  }>;
  priority: string;
  projectType: string;
  siteAddress: string | null;
  status: string;
  statusHistory: Array<{
    createdAt: string;
    fromStatus: string | null;
    id: string;
    reason: string | null;
    toStatus: string;
  }>;
  title: string;
};

export type PortalInstalacionDetalle = {
  address: {
    address: string | null;
    city: string | null;
    id: string | null;
    label: string;
  } | null;
  code: string;
  evidence: Array<{
    description: string | null;
    fileName: string;
    fileUrl: string;
    id: string;
    mimeType: string | null;
    sizeBytes: number | null;
    type: string;
    uploadedAt: string;
  }>;
  id: string;
  installationType: string;
  issues: Array<{
    description: string;
    id: string;
    severity: string;
    status: string;
    type: string;
  }>;
  notes: string | null;
  project: PortalProyectoResumen;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
  status: string;
  tasks: Array<{
    completedAt: string | null;
    description: string | null;
    estimatedMinutes: number | null;
    id: string;
    sortOrder: number;
    status: string;
    title: string;
  }>;
};

export type PortalGarantiaItem = {
  conditions: string | null;
  endDate: string;
  estaVigente: boolean;
  id: string;
  productType: string;
  project: PortalProyectoResumen;
  startDate: string;
  status: string;
};

export type PortalGarantiaDocumento = {
  client: PortalClienteResumen;
  conditions: string | null;
  endDate: string;
  id: string;
  productType: string;
  project: PortalProyectoResumen;
  startDate: string;
  status: string;
};

export type PortalPostventaListaItem = {
  code: string;
  commitmentDate: string | null;
  description: string;
  evidenceCount: number;
  id: string;
  installation: {
    code: string;
    id: string;
    scheduledDate: string;
    status: string;
  } | null;
  priority: string;
  project: PortalProyectoResumen;
  proposedSolution: string | null;
  reportedAt: string;
  status: string;
  type: string;
  warranty: {
    endDate: string;
    id: string;
    productType: string;
    startDate: string;
    status: string;
  } | null;
};

export type PortalPostventaDetalle = {
  activities: Array<{
    createdAt: string;
    description: string;
    executedAt: string | null;
    id: string;
    scheduledAt: string | null;
    status: string;
    type: string;
  }>;
  code: string;
  commitmentDate: string | null;
  description: string;
  evidences: Array<{
    description: string | null;
    fileName: string;
    fileUrl: string;
    id: string;
    mimeType: string | null;
    sizeBytes: number | null;
    uploadedAt: string;
  }>;
  id: string;
  installation: PortalPostventaListaItem["installation"];
  priority: string;
  project: PortalProyectoResumen;
  proposedSolution: string | null;
  quotation: {
    code: string;
    id: string;
    status: string;
  } | null;
  reportedAt: string;
  status: string;
  statusHistory: Array<{
    createdAt: string;
    fromStatus: string | null;
    id: string;
    notes: string | null;
    toStatus: string;
  }>;
  type: string;
  warranty: PortalPostventaListaItem["warranty"];
};

export type PortalDocumentoItem = {
  createdAt: string;
  documentType: PortalTipoDocumento;
  downloadKind:
    | "ARCHIVO"
    | "COTIZACION_PDF"
    | "REPORTE_INSTALACION_PDF"
    | "GARANTIA_PDF";
  fileUrl: string | null;
  id: string;
  name: string;
  project: PortalProyectoResumen;
  referenceId: string;
  referenceKey: string;
};

export type PortalMensajeItem = {
  attachmentName: string | null;
  attachmentSizeBytes: number | null;
  createdAt: string;
  fileUrl: string | null;
  id: string;
  message: string;
  portalUser: {
    email: string;
    id: string;
    name: string;
  } | null;
  project: PortalProyectoResumen;
  readAt: string | null;
  sentBy: PortalRemitenteMensaje;
};

export type PortalInvitacionPreview = {
  client: PortalClienteResumen;
  email: string;
  expiresAt: string;
  name: string;
  phone: string | null;
  projectAccesses: Array<{
    code: string;
    id: string;
    title: string;
  }>;
  status: PortalClienteEstado;
  userId: string;
};

export type PortalAdminUsuario = {
  client: PortalClienteResumen;
  createdAt: string;
  email: string;
  id: string;
  lastAccessAt: string | null;
  name: string;
  phone: string | null;
  projectAccesses: Array<{
    code: string;
    id: string;
    status: string;
    title: string;
  }>;
  status: PortalClienteEstado;
};

export type PortalAdminClienteOpcion = {
  displayName: string;
  id: string;
  projects: Array<{
    code: string;
    id: string;
    status: string;
    title: string;
  }>;
};

export type PortalAdminDocumentoReciente = {
  client: PortalClienteResumen;
  id: string;
  name: string;
  project: PortalProyectoResumen;
  type: PortalTipoDocumento;
  uploadedAt: string;
  visibleToClient: boolean;
};

export type PortalAdminMensajeReciente = {
  client: PortalClienteResumen;
  createdAt: string;
  id: string;
  message: string;
  portalUser: {
    email: string;
    id: string;
    name: string;
  } | null;
  project: PortalProyectoResumen;
  readAt: string | null;
  sentBy: PortalRemitenteMensaje;
};

export type PortalAdminResumen = {
  options: PortalAdminClienteOpcion[];
  recentDocuments: PortalAdminDocumentoReciente[];
  recentMessages: PortalAdminMensajeReciente[];
  users: PortalAdminUsuario[];
};

export type PortalInvitarClienteInput = {
  clientId: string;
  email: string;
  name: string;
  phone: string | null;
  projectIds: string[];
};

export type PortalActualizarClienteInput = Partial<{
  name: string;
  phone: string | null;
  projectIds: string[];
  status: PortalClienteEstado;
}>;

export type PortalCambiarEstadoInput = {
  motivo: string | null;
  status: PortalClienteEstado;
};

export type PortalLoginInput = {
  correo: string;
  contrasena: string;
};

export type PortalAceptarInvitacionInput = {
  contrasena: string;
  telefono: string | null;
};

export type PortalRestablecerInput = {
  contrasena: string;
  token: string;
};

export type PortalOlvideClaveInput = {
  correo: string;
};

export type PortalDecisionCotizacionInput = {
  decision: "ACEPTAR" | "RECHAZAR";
  motivo: string | null;
};

export type PortalCrearDocumentoInput = {
  clientId: string;
  name: string;
  projectId: string | null;
  type: PortalTipoDocumento;
  visibleToClient: boolean;
};

export type PortalCrearMensajeInput = {
  mensaje: string;
  projectId: string;
};

export type PortalCrearMensajeInternoInput = PortalCrearMensajeInput & {
  sender?: PortalRemitenteMensaje;
};

export type PortalCrearPostventaInput = {
  descripcion: string;
  installationId: string | null;
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  projectId: string | null;
  quotationId: string | null;
  reportedAt: string;
  tipo:
    | "GARANTIA"
    | "RECLAMO"
    | "AJUSTE"
    | "ROTURA"
    | "FUGA"
    | "MALA_INSTALACION"
    | "PRODUCTO_INCOMPLETO"
    | "REPOSICION"
    | "OTRO";
  warrantyId: string | null;
};
