import {
  INSTALLATION_ISSUE_SEVERITY_LABELS,
  INSTALLATION_ISSUE_STATUS_LABELS,
  INSTALLATION_PRIORITY_LABELS,
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_TASK_STATUS_LABELS,
} from "./constants";

import type {
  InstallationIssueSeverity,
  InstallationIssueStatus,
  InstallationOrderStatus,
  InstallationPriority,
  InstallationTaskStatus,
} from "@/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatInstallationDate = (value: string | null): string => {
  if (!value) {
    return "Sin fecha";
  }

  return DATE_FORMATTER.format(new Date(value));
};

export const formatInstallationDateTime = (value: string | null): string => {
  if (!value) {
    return "Sin registro";
  }

  return DATE_TIME_FORMATTER.format(new Date(value));
};

export const formatInstallationScheduleWindow = (
  scheduledDate: string,
  scheduledStartTime: string | null,
  scheduledEndTime: string | null,
): string => {
  const dateLabel = formatInstallationDate(scheduledDate);

  if (!scheduledStartTime && !scheduledEndTime) {
    return `${dateLabel} | Jornada abierta`;
  }

  return `${dateLabel} | ${scheduledStartTime ?? "--:--"} - ${scheduledEndTime ?? "--:--"}`;
};

export const buildMapLink = (input: {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}) => {
  if (input.latitude !== null && input.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  }

  if (!input.address) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.address)}`;
};

export const getInstallationStatusBadge = (status: InstallationOrderStatus) => {
  return {
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: INSTALLATION_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-emerald-100 text-emerald-800",
      label: INSTALLATION_STATUS_LABELS.COMPLETED,
    },
    EN_ROUTE: {
      className: "bg-sky-100 text-sky-800",
      label: INSTALLATION_STATUS_LABELS.EN_ROUTE,
    },
    IN_INSTALLATION: {
      className: "bg-amber-100 text-amber-800",
      label: INSTALLATION_STATUS_LABELS.IN_INSTALLATION,
    },
    PAUSED: {
      className: "bg-orange-100 text-orange-800",
      label: INSTALLATION_STATUS_LABELS.PAUSED,
    },
    RESCHEDULED: {
      className: "bg-violet-100 text-violet-800",
      label: INSTALLATION_STATUS_LABELS.RESCHEDULED,
    },
    SCHEDULED: {
      className: "bg-stone-100 text-stone-700",
      label: INSTALLATION_STATUS_LABELS.SCHEDULED,
    },
    WITH_OBSERVATIONS: {
      className: "bg-rose-100 text-rose-800",
      label: INSTALLATION_STATUS_LABELS.WITH_OBSERVATIONS,
    },
  }[status];
};

export const getInstallationPriorityBadge = (priority: InstallationPriority) => {
  return {
    HIGH: {
      className: "bg-orange-100 text-orange-800",
      label: INSTALLATION_PRIORITY_LABELS.HIGH,
    },
    LOW: {
      className: "bg-stone-100 text-stone-700",
      label: INSTALLATION_PRIORITY_LABELS.LOW,
    },
    NORMAL: {
      className: "bg-blue-100 text-blue-800",
      label: INSTALLATION_PRIORITY_LABELS.NORMAL,
    },
    URGENT: {
      className: "bg-red-100 text-red-800",
      label: INSTALLATION_PRIORITY_LABELS.URGENT,
    },
  }[priority];
};

export const getInstallationTaskStatusBadge = (status: InstallationTaskStatus) => {
  return {
    BLOCKED: {
      className: "bg-rose-100 text-rose-800",
      label: INSTALLATION_TASK_STATUS_LABELS.BLOCKED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: INSTALLATION_TASK_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-emerald-100 text-emerald-800",
      label: INSTALLATION_TASK_STATUS_LABELS.COMPLETED,
    },
    IN_PROGRESS: {
      className: "bg-amber-100 text-amber-800",
      label: INSTALLATION_TASK_STATUS_LABELS.IN_PROGRESS,
    },
    PENDING: {
      className: "bg-sky-100 text-sky-800",
      label: INSTALLATION_TASK_STATUS_LABELS.PENDING,
    },
  }[status];
};

export const getInstallationIssueSeverityBadge = (
  severity: InstallationIssueSeverity,
) => {
  return {
    CRITICAL: {
      className: "bg-red-100 text-red-800",
      label: INSTALLATION_ISSUE_SEVERITY_LABELS.CRITICAL,
    },
    HIGH: {
      className: "bg-orange-100 text-orange-800",
      label: INSTALLATION_ISSUE_SEVERITY_LABELS.HIGH,
    },
    LOW: {
      className: "bg-stone-100 text-stone-700",
      label: INSTALLATION_ISSUE_SEVERITY_LABELS.LOW,
    },
    MEDIUM: {
      className: "bg-amber-100 text-amber-800",
      label: INSTALLATION_ISSUE_SEVERITY_LABELS.MEDIUM,
    },
  }[severity];
};

export const getInstallationIssueStatusBadge = (status: InstallationIssueStatus) => {
  return {
    CLOSED: {
      className: "bg-stone-200 text-stone-700",
      label: INSTALLATION_ISSUE_STATUS_LABELS.CLOSED,
    },
    IN_PROGRESS: {
      className: "bg-amber-100 text-amber-800",
      label: INSTALLATION_ISSUE_STATUS_LABELS.IN_PROGRESS,
    },
    OPEN: {
      className: "bg-rose-100 text-rose-800",
      label: INSTALLATION_ISSUE_STATUS_LABELS.OPEN,
    },
    RESOLVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: INSTALLATION_ISSUE_STATUS_LABELS.RESOLVED,
    },
  }[status];
};
