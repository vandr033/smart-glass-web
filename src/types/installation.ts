export type InstallationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type InstallationOrderStatus =
  | "SCHEDULED"
  | "EN_ROUTE"
  | "IN_INSTALLATION"
  | "PAUSED"
  | "WITH_OBSERVATIONS"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export type InstallationTeamStatus = "ACTIVE" | "INACTIVE";
export type InstallationTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED"
  | "CANCELLED";

export type InstallationEvidenceType =
  | "PHOTO"
  | "FILE"
  | "SIGNATURE"
  | "CHECKLIST"
  | "OTHER";

export type InstallationIssueType =
  | "ACCESS"
  | "CLIENT"
  | "MATERIAL"
  | "SAFETY"
  | "TECHNICAL"
  | "WEATHER"
  | "OTHER";

export type InstallationIssueSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type InstallationIssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type InstallationCalendarView = "day" | "week" | "month";

export type InstallationUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type InstallationClientSummary = {
  clientType: "INDIVIDUAL" | "COMPANY";
  displayName: string;
  id: string;
};

export type InstallationAddressSummary = {
  address: string | null;
  city: string | null;
  id: string | null;
  label: string;
  latitude: number | null;
  longitude: number | null;
};

export type InstallationProjectSummary = {
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

export type InstallationQuotationSummary = {
  code: string;
  id: string;
  status: string;
} | null;

export type InstallationTeamMemberRecord = {
  active: boolean;
  id: string;
  role: string;
  user: InstallationUserSummary;
};

export type InstallationTeamRecord = {
  id: string;
  members: InstallationTeamMemberRecord[];
  name: string;
  notes: string | null;
  status: InstallationTeamStatus;
  supervisor: InstallationUserSummary;
  updatedAt: string;
} | null;

export type InstallationReadinessSummary = {
  activeReservationCount: number;
  productionCompletedCount: number;
  productionPendingCount: number;
  productionReady: boolean;
  readyReservationCount: number;
  reservationsReady: boolean;
  warnings: string[];
};

export type InstallationTaskRecord = {
  completedAt: string | null;
  completedByUser: InstallationUserSummary;
  createdAt: string;
  description: string | null;
  estimatedMinutes: number | null;
  id: string;
  installationOrderId: string;
  sortOrder: number;
  status: InstallationTaskStatus;
  title: string;
  updatedAt: string;
};

export type InstallationEvidenceRecord = {
  description: string | null;
  fileName: string;
  fileUrl: string;
  id: string;
  mimeType: string | null;
  sizeBytes: number | null;
  task: {
    id: string;
    title: string;
  } | null;
  taskId: string | null;
  type: InstallationEvidenceType;
  uploadedAt: string;
  uploadedByUser: InstallationUserSummary;
};

export type InstallationIssueRecord = {
  createdAt: string;
  description: string;
  id: string;
  installationOrderId: string;
  reportedByUser: InstallationUserSummary;
  resolvedAt: string | null;
  resolvedByUser: InstallationUserSummary;
  severity: InstallationIssueSeverity;
  status: InstallationIssueStatus;
  type: InstallationIssueType;
  updatedAt: string;
};

export type InstallationStatusHistoryRecord = {
  changedByUser: InstallationUserSummary;
  createdAt: string;
  fromStatus: InstallationOrderStatus | null;
  id: string;
  metadataJson: unknown;
  notes: string | null;
  toStatus: InstallationOrderStatus;
};

export type InstallationOrderListItem = {
  address: InstallationAddressSummary;
  assignedSupervisor: InstallationUserSummary;
  assignedTeam: InstallationTeamRecord;
  client: InstallationClientSummary;
  code: string;
  completedTaskCount: number;
  createdAt: string;
  evidenceCount: number;
  id: string;
  installationType: string;
  notes: string | null;
  openIssueCount: number;
  pendingTaskCount: number;
  priority: InstallationPriority;
  project: InstallationProjectSummary;
  quotation: InstallationQuotationSummary;
  readiness: InstallationReadinessSummary;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
  status: InstallationOrderStatus;
  taskCount: number;
  updatedAt: string;
};

export type InstallationOrderDetailRecord = InstallationOrderListItem & {
  createdByUser: InstallationUserSummary;
  deletedAt: string | null;
  evidence: InstallationEvidenceRecord[];
  issues: InstallationIssueRecord[];
  statusHistory: InstallationStatusHistoryRecord[];
  tasks: InstallationTaskRecord[];
};

export type InstallationTaskInput = {
  description: string | null;
  estimatedMinutes: number | null;
  status: InstallationTaskStatus;
  title: string;
};

export type InstallationOrderInput = {
  addressId: string | null;
  assignedSupervisorId: string | null;
  assignedTeamId: string | null;
  clientId: string | null;
  installationType: string;
  notes: string | null;
  priority: InstallationPriority;
  projectId: string | null;
  quotationId: string | null;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
  status: InstallationOrderStatus;
  tasks: InstallationTaskInput[];
};

export type UpdateInstallationOrderInput = {
  addressId: string | null;
  assignedSupervisorId: string | null;
  assignedTeamId: string | null;
  installationType: string;
  notes: string | null;
  priority: InstallationPriority;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
};

export type AssignInstallationOrderInput = {
  assignedSupervisorId: string | null;
  assignedTeamId: string | null;
};

export type RescheduleInstallationOrderInput = {
  reason: string;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
};

export type ChangeInstallationStatusInput = {
  notes: string | null;
  status: InstallationOrderStatus;
};

export type UpdateInstallationTaskInput = {
  description: string | null;
  estimatedMinutes: number | null;
  sortOrder: number;
  status: InstallationTaskStatus;
  title: string;
};

export type InstallationEvidenceInput = {
  description: string | null;
  taskId: string | null;
  type: InstallationEvidenceType;
};

export type InstallationIssueInput = {
  description: string;
  severity: InstallationIssueSeverity;
  type: InstallationIssueType;
};

export type ResolveInstallationIssueInput = {
  notes: string | null;
  status: "IN_PROGRESS" | "RESOLVED" | "CLOSED";
};

export type InstallationTeamMemberInput = {
  active: boolean;
  role: string;
  userId: string;
};

export type InstallationTeamInput = {
  members: InstallationTeamMemberInput[];
  name: string;
  notes: string | null;
  status: InstallationTeamStatus;
  supervisorId: string | null;
};
