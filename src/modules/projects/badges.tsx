import { badgeBaseClassName } from "@/modules/commercial/ui";
import type { ProjectAttachmentType, ProjectPriority, ProjectStatus } from "@/types";

import {
  PROJECT_ATTACHMENT_TYPE_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
} from "./constants";

const statusClassNames: Record<ProjectStatus, string> = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-700",
  COMPLETED: "bg-sky-100 text-sky-800",
  IN_INSTALLATION: "bg-orange-100 text-orange-800",
  IN_PRODUCTION: "bg-blue-100 text-blue-900",
  INSTALLATION_PENDING: "bg-amber-100 text-amber-800",
  LEAD: "bg-stone-200 text-stone-700",
  MEASUREMENT_PENDING: "bg-cyan-100 text-cyan-800",
  ON_HOLD: "bg-yellow-100 text-yellow-900",
  PRODUCTION_PENDING: "bg-indigo-100 text-indigo-800",
  PURCHASE_PENDING: "bg-violet-100 text-violet-800",
  QUOTATION_PENDING: "bg-fuchsia-100 text-fuchsia-800",
  QUOTED: "bg-lime-100 text-lime-800",
};

const priorityClassNames: Record<ProjectPriority, string> = {
  HIGH: "bg-orange-100 text-orange-800",
  LOW: "bg-stone-200 text-stone-700",
  NORMAL: "bg-blue-100 text-blue-900",
  URGENT: "bg-rose-100 text-rose-700",
};

const attachmentClassNames: Record<ProjectAttachmentType, string> = {
  CONTRACT: "bg-violet-100 text-violet-800",
  MEASUREMENT: "bg-cyan-100 text-cyan-800",
  OTHER: "bg-stone-200 text-stone-700",
  PHOTO: "bg-emerald-100 text-emerald-800",
  PLAN: "bg-blue-100 text-blue-900",
  QUOTATION: "bg-amber-100 text-amber-800",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`${badgeBaseClassName} ${statusClassNames[status]}`}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  );
}

export function ProjectPriorityBadge({ priority }: { priority: ProjectPriority }) {
  return (
    <span className={`${badgeBaseClassName} ${priorityClassNames[priority]}`}>
      {PROJECT_PRIORITY_LABELS[priority]}
    </span>
  );
}

export function ProjectAttachmentTypeBadge({
  attachmentType,
}: {
  attachmentType: ProjectAttachmentType;
}) {
  return (
    <span className={`${badgeBaseClassName} ${attachmentClassNames[attachmentType]}`}>
      {PROJECT_ATTACHMENT_TYPE_LABELS[attachmentType]}
    </span>
  );
}
