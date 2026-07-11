import type { MaterialUnit } from "./materials";

export type PostventaCaseType =
  | "GARANTIA"
  | "RECLAMO"
  | "AJUSTE"
  | "ROTURA"
  | "FUGA"
  | "MALA_INSTALACION"
  | "PRODUCTO_INCOMPLETO"
  | "REPOSICION"
  | "OTRO";

export type PostventaCaseStatus =
  | "REPORTADO"
  | "EN_REVISION"
  | "VISITA_PROGRAMADA"
  | "EN_ATENCION"
  | "PENDIENTE_REPUESTO"
  | "RESUELTO"
  | "RECHAZADO"
  | "CERRADO";

export type PostventaPriority = "BAJA" | "MEDIA" | "ALTA" | "CRITICA";

export type ProductWarrantyStatus = "VIGENTE" | "VENCIDA" | "ANULADA";

export type PostventaActivityType =
  | "VISITA_REVISION"
  | "DIAGNOSTICO"
  | "SOLUCION"
  | "REPUESTO"
  | "CIERRE"
  | "NOTA_INTERNA";

export type PostventaActivityStatus =
  | "PENDIENTE"
  | "PROGRAMADA"
  | "EJECUTADA"
  | "CANCELADA";

export type PostventaEvidenceType = "FOTO" | "DOCUMENTO" | "VIDEO" | "OTRO";

export type PostventaCostCategory =
  | "GARANTIA"
  | "RECLAMO"
  | "REPOSICION"
  | "VISITA"
  | "DIAGNOSTICO"
  | "MATERIAL"
  | "MANO_DE_OBRA"
  | "TRANSPORTE"
  | "INSTALACION"
  | "OTRO";

export type PostventaCostOrigin =
  | "MANUAL"
  | "INVENTARIO"
  | "INSTALACION"
  | "PRODUCCION"
  | "GARANTIA"
  | "COTIZACION"
  | "OTRO";

export type PostventaUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type PostventaClientSummary = {
  clientType: "COMPANY" | "INDIVIDUAL";
  displayName: string;
  id: string;
};

export type PostventaProjectSummary = {
  code: string;
  id: string;
  status:
    | "LEAD"
    | "MEASUREMENT_PENDING"
    | "QUOTATION_PENDING"
    | "QUOTED"
    | "APPROVED"
    | "PURCHASE_PENDING"
    | "PRODUCTION_PENDING"
    | "IN_PRODUCTION"
    | "INSTALLATION_PENDING"
    | "IN_INSTALLATION"
    | "COMPLETED"
    | "CANCELLED"
    | "ON_HOLD";
  title: string;
} | null;

export type PostventaQuotationSummary = {
  code: string;
  id: string;
  status: string;
} | null;

export type PostventaInstallationSummary = {
  code: string;
  id: string;
  scheduledDate: string | null;
  status: string;
} | null;

export type ProductWarrantyRecord = {
  caseCount: number;
  client: PostventaClientSummary;
  conditions: string | null;
  createdAt: string;
  endDate: string;
  estaVigente: boolean;
  id: string;
  productType: string;
  project: PostventaProjectSummary;
  startDate: string;
  status: ProductWarrantyStatus;
  updatedAt: string;
};

export type PostventaActivityRecord = {
  createdAt: string;
  description: string;
  executedAt: string | null;
  id: string;
  postventaCaseId: string;
  responsible: PostventaUserSummary;
  scheduledAt: string | null;
  status: PostventaActivityStatus;
  type: PostventaActivityType;
  updatedAt: string;
};

export type PostventaEvidenceRecord = {
  activityId: string | null;
  createdAt?: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  id: string;
  mimeType: string | null;
  postventaCaseId: string;
  sizeBytes: number | null;
  type: PostventaEvidenceType;
  uploadedAt: string;
  uploadedBy: PostventaUserSummary;
};

export type PostventaCostRecord = {
  amount: number;
  category: PostventaCostCategory;
  costDate: string;
  description: string;
  id: string;
  origin: PostventaCostOrigin;
  postventaCaseId: string;
  referenceId: string | null;
};

export type PostventaStatusHistoryRecord = {
  changedBy: PostventaUserSummary;
  createdAt: string;
  fromStatus: PostventaCaseStatus | null;
  id: string;
  metadataJson: unknown;
  notes: string | null;
  postventaCaseId: string;
  toStatus: PostventaCaseStatus;
};

export type PostventaReservationRecord = {
  createdAt: string;
  id: string;
  inventoryReservation: {
    createdAt: string;
    expiresAt: string | null;
    id: string;
    inventoryStock: {
      condition: string;
      id: string;
      locationCode: string | null;
      stockType: string;
    } | null;
    material: {
      code: string;
      id: string;
      materialType: "LINEAR" | "PACKAGE" | "SERVICE" | "SHEET" | "UNIT";
      name: string;
    };
    project: {
      code: string;
      id: string;
      title: string;
    } | null;
    quantity: number;
    quotation: {
      code: string;
      id: string;
      status: string;
    } | null;
    reservationType: "SOFT" | "FIRM";
    reservedByUser: PostventaUserSummary;
    status: "ACTIVE" | "RELEASED" | "CONSUMED" | "EXPIRED" | "CANCELLED";
    unit: MaterialUnit;
    updatedAt: string;
    warehouse: {
      code: string;
      id: string;
      name: string;
    };
  };
  notes: string | null;
};

export type PostventaImpactoFinancieroRecord = {
  costoGarantia: number;
  costoReclamo: number;
  costoReposicion: number;
  costoTotal: number;
  porcentajeSobreUtilidad: number | null;
  porcentajeSobreVenta: number | null;
  utilidadProyecto: number | null;
  ventaProyecto: number | null;
};

export type PostventaCaseListItem = {
  activityPendingCount: number;
  client: PostventaClientSummary;
  closedAt: string | null;
  code: string;
  commitmentDate: string | null;
  createdAt: string;
  createdBy: PostventaUserSummary;
  descripcionCorta: string;
  evidenceCount: number;
  id: string;
  outsideWarranty: boolean;
  priority: PostventaPriority;
  project: PostventaProjectSummary;
  reportedAt: string;
  responsible: PostventaUserSummary;
  status: PostventaCaseStatus;
  totalCost: number;
  type: PostventaCaseType;
  updatedAt: string;
  warranty: ProductWarrantyRecord | null;
};

export type PostventaCaseDetailRecord = PostventaCaseListItem & {
  activities: PostventaActivityRecord[];
  costs: PostventaCostRecord[];
  description: string;
  evidences: PostventaEvidenceRecord[];
  financialImpact: PostventaImpactoFinancieroRecord;
  installation: PostventaInstallationSummary;
  internalNotes: string | null;
  inventoryReservations: PostventaReservationRecord[];
  proposedSolution: string | null;
  quotation: PostventaQuotationSummary;
  statusHistory: PostventaStatusHistoryRecord[];
};

export type ListPostventaCasesParams = {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
  priority?: PostventaPriority;
  projectId?: string;
  responsibleId?: string;
  search?: string;
  sortBy?: "commitmentDate" | "priority" | "reportedAt" | "status" | "updatedAt";
  sortDirection?: "asc" | "desc";
  status?: PostventaCaseStatus;
};

export type CreatePostventaCaseInput = {
  clientId: string | null;
  commitmentDate: string | null;
  description: string;
  installationId: string | null;
  internalNotes: string | null;
  outsideWarranty: boolean;
  priority: PostventaPriority;
  projectId: string | null;
  proposedSolution: string | null;
  quotationId: string | null;
  reportedAt: string;
  responsibleId: string | null;
  type: PostventaCaseType;
  warrantyId: string | null;
};

export type UpdatePostventaCaseInput = Partial<{
  commitmentDate: string | null;
  description: string;
  internalNotes: string | null;
  outsideWarranty: boolean;
  priority: PostventaPriority;
  proposedSolution: string | null;
  type: PostventaCaseType;
  warrantyId: string | null;
}>;

export type AssignPostventaCaseInput = {
  responsibleId: string | null;
};

export type ChangePostventaCaseStatusInput = {
  notes: string | null;
  status: Exclude<PostventaCaseStatus, "CERRADO">;
};

export type ClosePostventaCaseInput = {
  notes: string | null;
  proposedSolution: string | null;
};

export type ListProductWarrantiesParams = {
  clientId?: string;
  page?: number;
  perPage?: number;
  projectId?: string;
  search?: string;
  sortBy?: "endDate" | "startDate" | "status" | "updatedAt";
  sortDirection?: "asc" | "desc";
  status?: ProductWarrantyStatus;
  vigente?: boolean;
};

export type CreateProductWarrantyInput = {
  clientId: string | null;
  conditions: string | null;
  endDate: string;
  productType: string;
  projectId: string;
  startDate: string;
  status: ProductWarrantyStatus;
};

export type UpdateProductWarrantyInput = Partial<{
  clientId: string | null;
  conditions: string | null;
  endDate: string;
  productType: string;
  projectId: string;
  startDate: string;
  status: ProductWarrantyStatus;
}>;

export type CreatePostventaActivityInput = {
  description: string;
  executedAt: string | null;
  responsibleId: string | null;
  scheduledAt: string | null;
  status?: PostventaActivityStatus;
  type: PostventaActivityType;
};

export type UpdatePostventaActivityInput = Partial<{
  description: string;
  executedAt: string | null;
  responsibleId: string | null;
  scheduledAt: string | null;
  status: PostventaActivityStatus;
  type: PostventaActivityType;
}>;

export type CreatePostventaEvidenceInput = {
  activityId: string | null;
  description: string | null;
  file: File;
  type: PostventaEvidenceType;
};

export type CreatePostventaCostInput = {
  amount: number;
  category: PostventaCostCategory;
  costDate: string;
  description: string;
  origin: PostventaCostOrigin;
  referenceId: string | null;
};

export type CreatePostventaReservationInput = {
  expiresAt: string | null;
  inventoryStockId: string | null;
  materialId: string;
  notes: string | null;
  quantity: number;
  reservationType: "SOFT" | "FIRM";
  unit: MaterialUnit;
  warehouseId: string;
};

export type ConsumePostventaReservationInput = {
  amount: number;
  category: PostventaCostCategory;
  costDate: string;
  description: string;
};
