import {
  MEASUREMENT_OPENING_STATUS_LABELS,
  MEASUREMENT_PRIORITY_LABELS,
  MEASUREMENT_STATUS_LABELS,
  MEASUREMENT_VISIT_RESULT_LABELS,
  MEASUREMENT_VISIT_STATUS_LABELS,
  TECHNICAL_OBSERVATION_SEVERITY_LABELS,
  TECHNICAL_OBSERVATION_STATUS_LABELS,
} from "./constants";

import type {
  MeasurementOpeningStatus,
  MeasurementRequestStatus,
  MeasurementVisitResult,
  MeasurementVisitStatus,
  TechnicalObservationSeverity,
  TechnicalObservationStatus,
} from "@/types";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatMeasurementDate = (value: string | null): string => {
  if (!value) {
    return "Sin fecha";
  }

  return DATE_FORMATTER.format(new Date(value));
};

export const formatMeasurementDateTime = (value: string | null): string => {
  if (!value) {
    return "Sin registro";
  }

  return DATE_TIME_FORMATTER.format(new Date(value));
};

export const formatMeasurementWindow = (
  scheduledDate: string | null,
  startTime: string | null,
  endTime: string | null,
) => {
  const dateLabel = formatMeasurementDate(scheduledDate);

  if (!startTime && !endTime) {
    return `${dateLabel} | Jornada abierta`;
  }

  return `${dateLabel} | ${startTime ?? "--:--"} - ${endTime ?? "--:--"}`;
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

export const getMeasurementStatusBadge = (status: MeasurementRequestStatus) => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: MEASUREMENT_STATUS_LABELS.APPROVED,
    },
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: MEASUREMENT_STATUS_LABELS.CANCELLED,
    },
    IN_VISIT: {
      className: "bg-sky-100 text-sky-800",
      label: MEASUREMENT_STATUS_LABELS.IN_VISIT,
    },
    PENDING_APPROVAL: {
      className: "bg-amber-100 text-amber-800",
      label: MEASUREMENT_STATUS_LABELS.PENDING_APPROVAL,
    },
    REGISTERED: {
      className: "bg-cyan-100 text-cyan-800",
      label: MEASUREMENT_STATUS_LABELS.REGISTERED,
    },
    REJECTED: {
      className: "bg-rose-100 text-rose-800",
      label: MEASUREMENT_STATUS_LABELS.REJECTED,
    },
    REQUESTED: {
      className: "bg-stone-100 text-stone-700",
      label: MEASUREMENT_STATUS_LABELS.REQUESTED,
    },
    RESCHEDULED: {
      className: "bg-violet-100 text-violet-800",
      label: MEASUREMENT_STATUS_LABELS.RESCHEDULED,
    },
    SCHEDULED: {
      className: "bg-blue-100 text-blue-800",
      label: MEASUREMENT_STATUS_LABELS.SCHEDULED,
    },
    WITH_OBSERVATIONS: {
      className: "bg-orange-100 text-orange-800",
      label: MEASUREMENT_STATUS_LABELS.WITH_OBSERVATIONS,
    },
  }[status];
};

export const getMeasurementPriorityBadge = (
  priority: keyof typeof MEASUREMENT_PRIORITY_LABELS,
) => {
  return {
    HIGH: {
      className: "bg-orange-100 text-orange-800",
      label: MEASUREMENT_PRIORITY_LABELS.HIGH,
    },
    LOW: {
      className: "bg-stone-100 text-stone-700",
      label: MEASUREMENT_PRIORITY_LABELS.LOW,
    },
    NORMAL: {
      className: "bg-blue-100 text-blue-800",
      label: MEASUREMENT_PRIORITY_LABELS.NORMAL,
    },
    URGENT: {
      className: "bg-rose-100 text-rose-800",
      label: MEASUREMENT_PRIORITY_LABELS.URGENT,
    },
  }[priority];
};

export const getMeasurementVisitStatusBadge = (status: MeasurementVisitStatus) => {
  return {
    CANCELLED: {
      className: "bg-stone-200 text-stone-700",
      label: MEASUREMENT_VISIT_STATUS_LABELS.CANCELLED,
    },
    COMPLETED: {
      className: "bg-emerald-100 text-emerald-800",
      label: MEASUREMENT_VISIT_STATUS_LABELS.COMPLETED,
    },
    IN_PROGRESS: {
      className: "bg-sky-100 text-sky-800",
      label: MEASUREMENT_VISIT_STATUS_LABELS.IN_PROGRESS,
    },
    SCHEDULED: {
      className: "bg-blue-100 text-blue-800",
      label: MEASUREMENT_VISIT_STATUS_LABELS.SCHEDULED,
    },
  }[status];
};

export const getMeasurementVisitResultBadge = (result: MeasurementVisitResult) => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: MEASUREMENT_VISIT_RESULT_LABELS.APPROVED,
    },
    PENDING: {
      className: "bg-stone-100 text-stone-700",
      label: MEASUREMENT_VISIT_RESULT_LABELS.PENDING,
    },
    READY_FOR_APPROVAL: {
      className: "bg-amber-100 text-amber-800",
      label: MEASUREMENT_VISIT_RESULT_LABELS.READY_FOR_APPROVAL,
    },
    REJECTED: {
      className: "bg-rose-100 text-rose-800",
      label: MEASUREMENT_VISIT_RESULT_LABELS.REJECTED,
    },
    REQUIRES_REVISIT: {
      className: "bg-orange-100 text-orange-800",
      label: MEASUREMENT_VISIT_RESULT_LABELS.REQUIRES_REVISIT,
    },
  }[result];
};

export const getMeasurementOpeningStatusBadge = (status: MeasurementOpeningStatus) => {
  return {
    APPROVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: MEASUREMENT_OPENING_STATUS_LABELS.APPROVED,
    },
    DRAFT: {
      className: "bg-stone-100 text-stone-700",
      label: MEASUREMENT_OPENING_STATUS_LABELS.DRAFT,
    },
    NEEDS_CORRECTION: {
      className: "bg-orange-100 text-orange-800",
      label: MEASUREMENT_OPENING_STATUS_LABELS.NEEDS_CORRECTION,
    },
    REGISTERED: {
      className: "bg-cyan-100 text-cyan-800",
      label: MEASUREMENT_OPENING_STATUS_LABELS.REGISTERED,
    },
    REJECTED: {
      className: "bg-rose-100 text-rose-800",
      label: MEASUREMENT_OPENING_STATUS_LABELS.REJECTED,
    },
  }[status];
};

export const getTechnicalObservationSeverityBadge = (
  severity: TechnicalObservationSeverity,
) => {
  return {
    CRITICAL: {
      className: "bg-rose-100 text-rose-800",
      label: TECHNICAL_OBSERVATION_SEVERITY_LABELS.CRITICAL,
    },
    HIGH: {
      className: "bg-orange-100 text-orange-800",
      label: TECHNICAL_OBSERVATION_SEVERITY_LABELS.HIGH,
    },
    LOW: {
      className: "bg-stone-100 text-stone-700",
      label: TECHNICAL_OBSERVATION_SEVERITY_LABELS.LOW,
    },
    MEDIUM: {
      className: "bg-amber-100 text-amber-800",
      label: TECHNICAL_OBSERVATION_SEVERITY_LABELS.MEDIUM,
    },
  }[severity];
};

export const getTechnicalObservationStatusBadge = (
  status: TechnicalObservationStatus,
) => {
  return {
    IN_PROGRESS: {
      className: "bg-amber-100 text-amber-800",
      label: TECHNICAL_OBSERVATION_STATUS_LABELS.IN_PROGRESS,
    },
    OPEN: {
      className: "bg-rose-100 text-rose-800",
      label: TECHNICAL_OBSERVATION_STATUS_LABELS.OPEN,
    },
    REJECTED: {
      className: "bg-stone-200 text-stone-700",
      label: TECHNICAL_OBSERVATION_STATUS_LABELS.REJECTED,
    },
    RESOLVED: {
      className: "bg-emerald-100 text-emerald-800",
      label: TECHNICAL_OBSERVATION_STATUS_LABELS.RESOLVED,
    },
  }[status];
};
