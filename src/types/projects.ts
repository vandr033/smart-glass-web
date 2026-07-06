export type ProjectType =
  | "WINDOW"
  | "DOOR"
  | "SHOWER"
  | "FACADE"
  | "RAILING"
  | "MIRROR"
  | "CUSTOM"
  | "SERVICE";

export type ProjectStatus =
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

export type ProjectPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type ProjectNoteVisibility = "INTERNAL" | "CLIENT_VISIBLE";
export type ProjectAttachmentType =
  | "PHOTO"
  | "PLAN"
  | "MEASUREMENT"
  | "CONTRACT"
  | "QUOTATION"
  | "OTHER";

export type ProjectClientSummary = {
  clientType: "INDIVIDUAL" | "COMPANY";
  displayName: string;
  id: string;
};

export type ProjectUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type ProjectStatusHistoryRecord = {
  changedByUser: ProjectUserSummary;
  createdAt: string;
  fromStatus: ProjectStatus | null;
  id: string;
  metadataJson: unknown;
  reason: string | null;
  toStatus: ProjectStatus;
};

export type ProjectNoteRecord = {
  createdAt: string;
  id: string;
  note: string;
  updatedAt: string;
  user: ProjectUserSummary;
  visibility: ProjectNoteVisibility;
};

export type ProjectAttachmentRecord = {
  attachmentType: ProjectAttachmentType;
  createdAt: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  id: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedByUser: ProjectUserSummary;
};

export type ProjectMeasurementRecord = {
  createdAt: string;
  depthMm: number | null;
  heightMm: number | null;
  id: string;
  locationDescription: string | null;
  measuredByUser: ProjectUserSummary;
  measurementDate: string | null;
  notes: string | null;
  quantity: number;
  rawJson: unknown;
  updatedAt: string;
  widthMm: number | null;
};

export type ProjectSummaryRecord = {
  allowedTransitions: ProjectStatus[];
  attachmentCount: number;
  lastStatusChangeAt: string | null;
  measurementCount: number;
  noteCount: number;
  statusHistoryCount: number;
};

export type ProjectListItem = {
  client: ProjectClientSummary;
  code: string;
  createdAt: string;
  expectedDeliveryDate: string | null;
  expectedInstallationDate: string | null;
  expectedMeasurementDate: string | null;
  id: string;
  priority: ProjectPriority;
  projectType: ProjectType;
  responsibleUser: ProjectUserSummary;
  salesUser: ProjectUserSummary;
  siteAddress: string | null;
  status: ProjectStatus;
  title: string;
  updatedAt: string;
};

export type ProjectDetailRecord = ProjectListItem & {
  attachments: ProjectAttachmentRecord[];
  availableTransitions: ProjectStatus[];
  city: string | null;
  deletedAt: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  measurements: ProjectMeasurementRecord[];
  notes: string | null;
  projectNotes: ProjectNoteRecord[];
  statusHistory: ProjectStatusHistoryRecord[];
  summary: ProjectSummaryRecord;
};

export type ProjectDashboardSummaryRecord = {
  activeProjects: number;
  approvedProjects: number;
  pendingInstallationProjects: number;
  pendingQuotationProjects: number;
  projectsInProduction: number;
};

export type ProjectUserOption = {
  email: string;
  id: string;
  name: string;
};

export type ProjectMutationInput = {
  city: string | null;
  clientId: string;
  description: string | null;
  expectedDeliveryDate: string | null;
  expectedInstallationDate: string | null;
  expectedMeasurementDate: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  priority: ProjectPriority;
  projectType: ProjectType;
  responsibleUserId: string | null;
  salesUserId: string | null;
  siteAddress: string | null;
  status: ProjectStatus;
  title: string;
};

export type ProjectTransitionInput = {
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
  toStatus: ProjectStatus;
};

export type ProjectTransitionResult = {
  availableTransitions: ProjectStatus[];
  currentStatus: ProjectStatus;
  historyEntry: ProjectStatusHistoryRecord;
  projectId: string;
};

export type ProjectNoteInput = {
  note: string;
  visibility: ProjectNoteVisibility;
};

export type ProjectMeasurementInput = {
  depthMm: number | null;
  heightMm: number | null;
  locationDescription: string | null;
  measurementDate: string | null;
  notes: string | null;
  quantity: number;
  rawJson: Record<string, unknown> | null;
  widthMm: number | null;
};

export type ProjectAttachmentInput = {
  attachmentType: ProjectAttachmentType;
  description: string | null;
};
