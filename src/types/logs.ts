export interface LogUserReference {
  email: string;
  id: string;
  name: string;
}

export type LogJsonValue =
  | boolean
  | number
  | string
  | null
  | LogJsonValue[]
  | {
      [key: string]: LogJsonValue;
    };

export interface ActivityLogTableRow {
  action: string;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  ipAddress: string | null;
  metadata: LogJsonValue | null;
  user: LogUserReference | null;
}

export type AuditAction = "Created" | "Deleted" | "Updated";

export interface AuditLogTableRow {
  action: string;
  actorUser: LogUserReference | null;
  afterJson: LogJsonValue | null;
  beforeJson: LogJsonValue | null;
  changedBy: LogUserReference | null;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  ipAddress: string | null;
  metadataJson: LogJsonValue | null;
  newValues: LogJsonValue | null;
  oldValues: LogJsonValue | null;
  userAgent: string | null;
}
