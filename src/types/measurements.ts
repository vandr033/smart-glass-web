export type MeasurementRequestStatus =
  | "REQUESTED"
  | "SCHEDULED"
  | "IN_VISIT"
  | "REGISTERED"
  | "WITH_OBSERVATIONS"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "RESCHEDULED"
  | "CANCELLED";

export type MeasurementVisitStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type MeasurementVisitResult =
  | "PENDING"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "REQUIRES_REVISIT";

export type MeasurementElementType =
  | "WINDOW"
  | "DOOR"
  | "SHOWER"
  | "RAILING"
  | "MIRROR"
  | "DIVISION"
  | "COVER"
  | "OTHER";

export type MeasurementOpeningStatus =
  | "DRAFT"
  | "REGISTERED"
  | "NEEDS_CORRECTION"
  | "APPROVED"
  | "REJECTED";

export type MeasurementEvidenceType =
  | "PHOTO"
  | "FILE"
  | "SKETCH"
  | "CHECKLIST"
  | "OTHER";

export type TechnicalObservationType =
  | "ACCESS"
  | "STRUCTURAL"
  | "LEVEL"
  | "MATERIAL"
  | "SAFETY"
  | "OTHER";

export type TechnicalObservationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TechnicalObservationStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export type MeasurementCalendarView = "day" | "week" | "month";

export type MeasurementUserSummary = {
  email: string;
  id: string;
  name: string;
} | null;

export type MeasurementClientSummary = {
  clientType: "COMPANY" | "INDIVIDUAL";
  displayName: string;
  id: string;
};

export type MeasurementProjectSummary = {
  code: string;
  id: string;
  status: string;
  title: string;
} | null;

export type MeasurementAddressSummary = {
  address: string | null;
  city: string | null;
  id: string | null;
  label: string;
  latitude: number | null;
  longitude: number | null;
} | null;

export type MeasurementQuotationSummary = {
  code: string;
  id: string;
  status: string;
};

export type MeasurementProductionJobSummary = {
  code: string;
  id: string;
  status: string;
};

export type MeasurementEvidenceRecord = {
  description: string | null;
  fileName: string;
  fileUrl: string;
  id: string;
  measurementOpeningId: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  type: MeasurementEvidenceType;
  uploadedAt: string;
  uploadedByUser: MeasurementUserSummary;
};

export type MeasurementOpeningRecord = {
  code: string;
  createdAt: string;
  depthMm: number | null;
  elementType: MeasurementElementType;
  environment: string;
  evidence: MeasurementEvidenceRecord[];
  heightMm: number;
  id: string;
  observations: string | null;
  quantity: number;
  requiresCorrection: boolean;
  status: MeasurementOpeningStatus;
  updatedAt: string;
  widthMm: number;
};

export type TechnicalObservationRecord = {
  createdAt: string;
  createdByUser: MeasurementUserSummary;
  description: string;
  id: string;
  resolvedAt: string | null;
  resolvedByUser: MeasurementUserSummary;
  severity: TechnicalObservationSeverity;
  status: TechnicalObservationStatus;
  type: TechnicalObservationType;
  updatedAt: string;
};

export type MeasurementVisitRecord = {
  createdAt: string;
  evidence: MeasurementEvidenceRecord[];
  finishedAt: string | null;
  generalObservations: string | null;
  id: string;
  locationConfirmed: boolean;
  observations: TechnicalObservationRecord[];
  openings: MeasurementOpeningRecord[];
  result: MeasurementVisitResult;
  startedAt: string | null;
  status: MeasurementVisitStatus;
  technician: MeasurementUserSummary;
  updatedAt: string;
};

export type MeasurementStatusHistoryRecord = {
  changedByUser: MeasurementUserSummary;
  createdAt: string;
  fromStatus: MeasurementRequestStatus | null;
  id: string;
  metadataJson: unknown;
  notes: string | null;
  toStatus: MeasurementRequestStatus;
};

export type MeasurementRequestListItem = {
  address: MeasurementAddressSummary;
  approvedAt: string | null;
  approvedByUser: MeasurementUserSummary;
  assignedTechnician: MeasurementUserSummary;
  client: MeasurementClientSummary;
  code: string;
  createdAt: string;
  evidenceCount: number;
  hasScheduleConflict: boolean;
  id: string;
  latestVisit: {
    id: string;
    result: MeasurementVisitResult;
    status: MeasurementVisitStatus;
  } | null;
  observations: string | null;
  openingCount: number;
  openObservationCount: number;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  productionJobCount: number;
  project: MeasurementProjectSummary;
  quotationCount: number;
  rejectedAt: string | null;
  requestedDate: string;
  scheduledDate: string | null;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
  status: MeasurementRequestStatus;
  updatedAt: string;
  visitCount: number;
};

export type MeasurementRequestDetailRecord = MeasurementRequestListItem & {
  alerts: {
    production: string[];
    quotation: string[];
  };
  createdByUser: MeasurementUserSummary;
  productionJobs: MeasurementProductionJobSummary[];
  quotations: MeasurementQuotationSummary[];
  statusHistory: MeasurementStatusHistoryRecord[];
  visits: MeasurementVisitRecord[];
};

export type MeasurementRequestInput = {
  addressId: string | null;
  assignedTechnicianId: string | null;
  clientId: string;
  observations: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  projectId: string | null;
  requestedDate: string;
  scheduledDate: string | null;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
};

export type UpdateMeasurementRequestInput = MeasurementRequestInput;

export type ScheduleMeasurementRequestInput = {
  assignedTechnicianId: string | null;
  notes: string | null;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
};

export type ReprogramMeasurementRequestInput = {
  assignedTechnicianId: string | null;
  reason: string;
  scheduledDate: string;
  scheduledEndTime: string | null;
  scheduledStartTime: string | null;
};

export type CancelMeasurementRequestInput = {
  notes: string | null;
};

export type StartMeasurementVisitInput = {
  generalObservations: string | null;
  locationConfirmed: boolean;
};

export type SubmitMeasurementApprovalInput = {
  notes: string | null;
  result: MeasurementVisitResult;
};

export type MeasurementDecisionInput = {
  notes: string | null;
};

export type MeasurementOpeningInput = {
  code: string | null;
  depthMm: number | null;
  elementType: MeasurementElementType;
  environment: string;
  heightMm: number;
  observations: string | null;
  quantity: number;
  requiresCorrection: boolean;
  status: MeasurementOpeningStatus;
  widthMm: number;
};

export type TechnicalObservationInput = {
  description: string;
  severity: TechnicalObservationSeverity;
  status: TechnicalObservationStatus;
  type: TechnicalObservationType;
};

export type ResolveTechnicalObservationInput = {
  notes: string | null;
  status: "IN_PROGRESS" | "RESOLVED" | "REJECTED";
};

export type MeasurementEvidenceInput = {
  description: string | null;
  measurementOpeningId: string | null;
  type: MeasurementEvidenceType;
  visitId: string | null;
};

export type CreatedQuotationFromMeasurement = {
  code: string;
  id: string;
  status: string;
};
