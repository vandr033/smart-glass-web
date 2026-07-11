"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  MapPinned,
  PencilLine,
  Plus,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  TimerReset,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel } from "@/lib/exports";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { PRODUCTION_ROUTES } from "@/modules/production/constants";
import { PROJECTS_ROUTES } from "@/modules/projects/constants";
import { QUOTATIONS_ROUTES } from "@/modules/quotations/constants";
import {
  exportMeasurementInternalPdf,
  exportMeasurementRequestPdf,
  exportMeasurementVisitPdf,
} from "@/modules/measurements/exports";
import { measurementService } from "@/services/measurement-service";
import { userService } from "@/services/user-service";
import type {
  MeasurementEvidenceInput,
  MeasurementOpeningInput,
  MeasurementOpeningRecord,
  MeasurementVisitRecord,
  TechnicalObservationRecord,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  MEASUREMENT_ELEMENT_LABELS,
  MEASUREMENT_ELEMENT_OPTIONS,
  MEASUREMENT_EVIDENCE_TYPE_OPTIONS,
  MEASUREMENT_OPENING_STATUS_LABELS,
  MEASUREMENT_STATUS_LABELS,
  MEASUREMENT_VISIT_RESULT_LABELS,
  MEASUREMENTS_LABELS,
  MEASUREMENTS_PERMISSIONS,
  MEASUREMENTS_QUERY_KEYS,
  MEASUREMENTS_ROUTES,
  TECHNICAL_OBSERVATION_SEVERITY_OPTIONS,
  TECHNICAL_OBSERVATION_STATUS_OPTIONS,
  TECHNICAL_OBSERVATION_TYPE_LABELS,
  TECHNICAL_OBSERVATION_TYPE_OPTIONS,
} from "../constants";
import {
  buildMapLink,
  formatMeasurementDate,
  formatMeasurementDateTime,
  formatMeasurementWindow,
  getMeasurementOpeningStatusBadge,
  getMeasurementPriorityBadge,
  getMeasurementStatusBadge,
  getMeasurementVisitResultBadge,
  getMeasurementVisitStatusBadge,
  getTechnicalObservationSeverityBadge,
  getTechnicalObservationStatusBadge,
} from "../ui";

type MeasurementsDetailPageProps = {
  requestId: string;
};

type OpeningFormState = {
  code: string;
  depthMm: string;
  elementType: MeasurementOpeningInput["elementType"];
  environment: string;
  heightMm: string;
  observations: string;
  quantity: string;
  requiresCorrection: boolean;
  status: MeasurementOpeningInput["status"];
  widthMm: string;
};

const EMPTY_OPENING_FORM: OpeningFormState = {
  code: "",
  depthMm: "",
  elementType: "WINDOW",
  environment: "",
  heightMm: "",
  observations: "",
  quantity: "1",
  requiresCorrection: false,
  status: "REGISTERED",
  widthMm: "",
};

const OPENING_STATUS_OPTIONS = Object.entries(MEASUREMENT_OPENING_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value: value as MeasurementOpeningInput["status"],
  }),
);

const VISIT_RESULT_OPTIONS = [
  {
    label: MEASUREMENT_VISIT_RESULT_LABELS.READY_FOR_APPROVAL,
    value: "READY_FOR_APPROVAL" as const,
  },
  {
    label: MEASUREMENT_VISIT_RESULT_LABELS.REQUIRES_REVISIT,
    value: "REQUIRES_REVISIT" as const,
  },
];

const toPositiveNumber = (value: string): number | null => {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
};

const flattenOpenings = (visits: MeasurementVisitRecord[]) =>
  visits.flatMap((visit) =>
    visit.openings.map((opening) => ({
      ...opening,
      technicianName: visit.technician?.name ?? "Tecnico sin asignar",
      visitId: visit.id,
      visitStartedAt: visit.startedAt,
    })),
  );

const flattenEvidence = (visits: MeasurementVisitRecord[]) =>
  visits.flatMap((visit) =>
    visit.evidence.map((evidence) => ({
      ...evidence,
      technicianName: visit.technician?.name ?? "Tecnico sin asignar",
      visitId: visit.id,
    })),
  );

const flattenObservations = (visits: MeasurementVisitRecord[]) =>
  visits.flatMap((visit) =>
    visit.observations.map((observation) => ({
      ...observation,
      technicianName: visit.technician?.name ?? "Tecnico sin asignar",
      visitId: visit.id,
    })),
  );

const loadOpeningIntoForm = (opening: MeasurementOpeningRecord): OpeningFormState => ({
  code: opening.code,
  depthMm: opening.depthMm === null ? "" : String(opening.depthMm),
  elementType: opening.elementType,
  environment: opening.environment,
  heightMm: String(opening.heightMm),
  observations: opening.observations ?? "",
  quantity: String(opening.quantity),
  requiresCorrection: opening.requiresCorrection,
  status: opening.status,
  widthMm: String(opening.widthMm),
});

const renderObservationActionLabel = (status: TechnicalObservationRecord["status"]) => {
  if (status === "OPEN") {
    return "Marcar en seguimiento";
  }

  if (status === "IN_PROGRESS") {
    return "Resolver";
  }

  return null;
};

export default function MeasurementsDetailPage({
  requestId,
}: MeasurementsDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();

  const canApprove = permissions.includes(MEASUREMENTS_PERMISSIONS.approve);
  const canAssign = permissions.includes(MEASUREMENTS_PERMISSIONS.assign);
  const canExecute = permissions.includes(MEASUREMENTS_PERMISSIONS.execute);
  const canExport = permissions.includes(MEASUREMENTS_PERMISSIONS.export);
  const canReject = permissions.includes(MEASUREMENTS_PERMISSIONS.reject);
  const canSchedule = permissions.includes(MEASUREMENTS_PERMISSIONS.schedule);
  const canUpdate = permissions.includes(MEASUREMENTS_PERMISSIONS.update);

  const [assignedTechnicianId, setAssignedTechnicianId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [reprogramReason, setReprogramReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [openingForm, setOpeningForm] = useState<OpeningFormState>(EMPTY_OPENING_FORM);
  const [editingOpeningId, setEditingOpeningId] = useState<string | null>(null);
  const [openingFormError, setOpeningFormError] = useState<string | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState<MeasurementEvidenceInput["type"]>("PHOTO");
  const [selectedOpeningId, setSelectedOpeningId] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [observationType, setObservationType] =
    useState<(typeof TECHNICAL_OBSERVATION_TYPE_OPTIONS)[number]["value"]>("ACCESS");
  const [observationSeverity, setObservationSeverity] =
    useState<(typeof TECHNICAL_OBSERVATION_SEVERITY_OPTIONS)[number]["value"]>("MEDIUM");
  const [observationStatus, setObservationStatus] =
    useState<(typeof TECHNICAL_OBSERVATION_STATUS_OPTIONS)[number]["value"]>("OPEN");
  const [observationDescription, setObservationDescription] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [submissionResult, setSubmissionResult] =
    useState<(typeof VISIT_RESULT_OPTIONS)[number]["value"]>("READY_FOR_APPROVAL");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  const requestQuery = useQuery({
    queryFn: () => measurementService.getRequestById(requestId),
    queryKey: MEASUREMENTS_QUERY_KEYS.detail(requestId),
    staleTime: 30_000,
  });

  const techniciansQuery = useQuery({
    enabled: canAssign || canSchedule || canExecute,
    queryFn: userService.getUserOptions,
    queryKey: ["measurements", "detail", requestId, "technicians"],
    staleTime: 60_000,
  });

  const refreshRequest = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["measurements"],
      }),
      queryClient.invalidateQueries({
        queryKey: MEASUREMENTS_QUERY_KEYS.detail(requestId),
      }),
    ]);
  };

  const scheduleMutation = useMutation({
    mutationFn: () => {
      if (!scheduledDate) {
        throw new Error("Debes indicar una fecha programada.");
      }

      return measurementService.scheduleRequest(requestId, {
        assignedTechnicianId: assignedTechnicianId || null,
        notes: scheduleNotes.trim() || null,
        scheduledDate,
        scheduledEndTime: scheduledEndTime || null,
        scheduledStartTime: scheduledStartTime || null,
      });
    },
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const reprogramMutation = useMutation({
    mutationFn: () => {
      if (!scheduledDate) {
        throw new Error("Debes indicar una nueva fecha programada.");
      }

      if (!reprogramReason.trim()) {
        throw new Error("Debes indicar el motivo de la reprogramacion.");
      }

      return measurementService.reprogramRequest(requestId, {
        assignedTechnicianId: assignedTechnicianId || null,
        reason: reprogramReason.trim(),
        scheduledDate,
        scheduledEndTime: scheduledEndTime || null,
        scheduledStartTime: scheduledStartTime || null,
      });
    },
    onSuccess: async () => {
      setReprogramReason("");
      await refreshRequest();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      measurementService.cancelRequest(requestId, {
        notes: cancelNotes.trim() || null,
      }),
    onSuccess: async () => {
      setCancelNotes("");
      await refreshRequest();
    },
  });

  const startVisitMutation = useMutation({
    mutationFn: () =>
      measurementService.startVisit(requestId, {
        generalObservations: visitNotes.trim() || null,
        locationConfirmed,
      }),
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const saveOpeningMutation = useMutation({
    mutationFn: () => {
      const widthMm = toPositiveNumber(openingForm.widthMm);
      const heightMm = toPositiveNumber(openingForm.heightMm);
      const quantity = toPositiveNumber(openingForm.quantity);
      const depthMm =
        openingForm.depthMm.trim().length > 0 ? toPositiveNumber(openingForm.depthMm) : null;

      if (!openingForm.environment.trim()) {
        throw new Error("Debes indicar el ambiente de la abertura.");
      }

      if (widthMm === null || heightMm === null || quantity === null) {
        throw new Error(
          "Debes completar ancho, alto y cantidad con valores mayores a cero.",
        );
      }

      const payload: MeasurementOpeningInput = {
        code: openingForm.code.trim() || null,
        depthMm,
        elementType: openingForm.elementType,
        environment: openingForm.environment.trim(),
        heightMm,
        observations: openingForm.observations.trim() || null,
        quantity,
        requiresCorrection: openingForm.requiresCorrection,
        status: openingForm.status,
        widthMm,
      };

      return editingOpeningId
        ? measurementService.updateOpening(editingOpeningId, payload)
        : measurementService.createOpening(requestId, payload);
    },
    onSuccess: async () => {
      setEditingOpeningId(null);
      setOpeningForm(EMPTY_OPENING_FORM);
      setOpeningFormError(null);
      await refreshRequest();
    },
    onError: (error) => {
      setOpeningFormError(getApiErrorMessage(error));
    },
  });

  const duplicateOpeningMutation = useMutation({
    mutationFn: (openingId: string) => measurementService.duplicateOpening(openingId),
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const evidenceMutation = useMutation({
    mutationFn: () => {
      if (!evidenceFile) {
        throw new Error("Debes seleccionar un archivo de evidencia.");
      }

      return measurementService.uploadEvidence(requestId, {
        description: evidenceDescription.trim() || null,
        file: evidenceFile,
        measurementOpeningId: selectedOpeningId || null,
        type: evidenceType,
        visitId: null,
      });
    },
    onSuccess: async () => {
      setEvidenceDescription("");
      setEvidenceType("PHOTO");
      setSelectedOpeningId("");
      setEvidenceFile(null);
      await refreshRequest();
    },
  });

  const observationMutation = useMutation({
    mutationFn: () => {
      if (!observationDescription.trim()) {
        throw new Error("Debes describir la observacion tecnica.");
      }

      return measurementService.createObservation(requestId, {
        description: observationDescription.trim(),
        severity: observationSeverity,
        status: observationStatus,
        type: observationType,
      });
    },
    onSuccess: async () => {
      setObservationDescription("");
      setObservationSeverity("MEDIUM");
      setObservationStatus("OPEN");
      setObservationType("ACCESS");
      await refreshRequest();
    },
  });

  const resolveObservationMutation = useMutation({
    mutationFn: ({
      observationId,
      status,
    }: {
      observationId: string;
      status: "IN_PROGRESS" | "RESOLVED";
    }) =>
      measurementService.resolveObservation(observationId, {
        notes:
          status === "RESOLVED"
            ? "Observacion resuelta desde el panel de mediciones."
            : "Observacion en seguimiento desde el panel de mediciones.",
        status,
      }),
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const submitApprovalMutation = useMutation({
    mutationFn: () =>
      measurementService.submitForApproval(requestId, {
        notes: submissionNotes.trim() || null,
        result: submissionResult,
      }),
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      measurementService.approveRequest(requestId, {
        notes: approvalNotes.trim() || null,
      }),
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      measurementService.rejectRequest(requestId, {
        notes: rejectionNotes.trim() || null,
      }),
    onSuccess: async () => {
      await refreshRequest();
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: () => measurementService.createQuotationFromMeasurement(requestId),
    onSuccess: (quotation) => {
      router.push(QUOTATIONS_ROUTES.builder(quotation.id));
    },
  });

  useEffect(() => {
    if (!requestQuery.data) {
      return;
    }

    const syncFrame = window.requestAnimationFrame(() => {
      setAssignedTechnicianId(requestQuery.data.assignedTechnician?.id ?? "");
      setScheduledDate(requestQuery.data.scheduledDate?.slice(0, 10) ?? "");
      setScheduledStartTime(requestQuery.data.scheduledStartTime ?? "");
      setScheduledEndTime(requestQuery.data.scheduledEndTime ?? "");
      setVisitNotes(requestQuery.data.visits[0]?.generalObservations ?? "");
    });

    return () => {
      window.cancelAnimationFrame(syncFrame);
    };
  }, [requestQuery.data]);

  const isTechniciansPending =
    (canAssign || canSchedule || canExecute) && techniciansQuery.isPending;
  const isTechniciansError =
    (canAssign || canSchedule || canExecute) && techniciansQuery.isError;
  const request = requestQuery.data ?? null;
  const openings = useMemo(() => flattenOpenings(request?.visits ?? []), [request?.visits]);

  const openingStatusSummary = useMemo(() => {
    return openings.reduce<Record<string, number>>((result, opening) => {
      result[opening.status] = (result[opening.status] ?? 0) + 1;
      return result;
    }, {});
  }, [openings]);
  const retryQueries = () => {
    void Promise.all([requestQuery.refetch(), techniciansQuery.refetch()]);
  };

  if (requestQuery.isPending || isTechniciansPending) {
    return <LoadingState title="Cargando solicitud de medicion" />;
  }

  if (requestQuery.isError || isTechniciansError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={retryQueries}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          requestQuery.error?.message ??
          techniciansQuery.error?.message ??
          "No se pudo cargar la solicitud de medicion."
        }
        title="El detalle de medicion no esta disponible"
      />
    );
  }

  if (!request) {
    return (
      <ErrorState
        action={
          <button className={secondaryButtonClassName} onClick={retryQueries} type="button">
            Reintentar
          </button>
        }
        description="No se encontro la solicitud de medicion."
        title="El detalle de medicion no esta disponible"
      />
    );
  }

  const evidence = flattenEvidence(request.visits);
  const observations = flattenObservations(request.visits);
  const latestVisit = request.visits[0] ?? null;
  const statusBadge = getMeasurementStatusBadge(request.status);
  const priorityBadge = getMeasurementPriorityBadge(request.priority);
  const visitStatusBadge = latestVisit
    ? getMeasurementVisitStatusBadge(latestVisit.status)
    : null;
  const visitResultBadge = latestVisit
    ? getMeasurementVisitResultBadge(latestVisit.result)
    : null;
  const mapLink = buildMapLink({
    address: request.address?.address ?? null,
    latitude: request.address?.latitude ?? null,
    longitude: request.address?.longitude ?? null,
  });
  const activeError = [
    scheduleMutation.error,
    reprogramMutation.error,
    cancelMutation.error,
    startVisitMutation.error,
    evidenceMutation.error,
    observationMutation.error,
    submitApprovalMutation.error,
    approveMutation.error,
    rejectMutation.error,
    duplicateOpeningMutation.error,
    resolveObservationMutation.error,
    createQuotationMutation.error,
  ]
    .filter(Boolean)
    .map((error) => getApiErrorMessage(error))[0] ?? null;
  const relatedQuotation = request.quotations[0] ?? null;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={MEASUREMENTS_ROUTES.home}>
              Volver a mediciones
            </Link>
            {canExport ? (
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  exportRowsToExcel(openings, {
                    columns: [
                      { header: "Codigo", value: (row) => row.code },
                      { header: "Ambiente", value: (row) => row.environment },
                      {
                        header: "Elemento",
                        value: (row) => MEASUREMENT_ELEMENT_LABELS[row.elementType],
                      },
                      { header: "Ancho (mm)", value: (row) => String(row.widthMm) },
                      { header: "Alto (mm)", value: (row) => String(row.heightMm) },
                      {
                        header: "Profundidad (mm)",
                        value: (row) => (row.depthMm === null ? "" : String(row.depthMm)),
                      },
                      { header: "Cantidad", value: (row) => String(row.quantity) },
                      {
                        header: "Requiere correccion",
                        value: (row) => (row.requiresCorrection ? "Si" : "No"),
                      },
                      {
                        header: "Estado",
                        value: (row) => MEASUREMENT_OPENING_STATUS_LABELS[row.status],
                      },
                      {
                        header: "Tecnico",
                        value: (row) => row.technicianName,
                      },
                    ],
                    fileName: `${request.code}-medidas.xls`,
                    title: "Medidas registradas",
                  });
                }}
                type="button"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {MEASUREMENTS_LABELS.buttons.exportExcel}
              </button>
            ) : null}
            {canExport ? (
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  exportMeasurementRequestPdf(request);
                }}
                type="button"
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF medicion
              </button>
            ) : null}
            {canExport ? (
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  exportMeasurementInternalPdf(request);
                }}
                type="button"
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                PDF interno
              </button>
            ) : null}
            {canExport ? (
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  exportMeasurementVisitPdf(request);
                }}
                type="button"
              >
                <Camera className="mr-2 h-4 w-4" />
                PDF visita
              </button>
            ) : null}
            {relatedQuotation ? (
              <Link
                className={primaryButtonClassName}
                href={QUOTATIONS_ROUTES.builder(relatedQuotation.id)}
              >
                Abrir cotizacion
              </Link>
            ) : canApprove && request.status === "APPROVED" ? (
              <button
                className={primaryButtonClassName}
                disabled={createQuotationMutation.isPending}
                onClick={() => {
                  void createQuotationMutation.mutateAsync();
                }}
                type="button"
              >
                {MEASUREMENTS_LABELS.buttons.createQuotation}
              </button>
            ) : null}
          </>
        }
        description="Gestiona la coordinacion tecnica, consolida medidas de obra, registra evidencias y resuelve la aprobacion antes de pasar a cotizacion o produccion."
        eyebrow="Detalle operativo"
        title={request.code}
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.className}`}
          >
            {priorityBadge.label}
          </span>
          {visitStatusBadge ? (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${visitStatusBadge.className}`}
            >
              Visita: {visitStatusBadge.label}
            </span>
          ) : null}
          {visitResultBadge ? (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${visitResultBadge.className}`}
            >
              Resultado: {visitResultBadge.label}
            </span>
          ) : null}
          {request.hasScheduleConflict ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
              <AlertTriangle className="h-3.5 w-3.5" />
              Conflicto horario detectado
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Cliente
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {request.client.displayName}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Solicitada el {formatMeasurementDate(request.requestedDate)}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Proyecto
            </p>
            {request.project ? (
              <Link
                className="mt-2 block text-sm font-semibold text-[color:var(--color-primary)] hover:underline"
                href={PROJECTS_ROUTES.view(request.project.id)}
              >
                {request.project.code} · {request.project.title}
              </Link>
            ) : (
              <p className="mt-2 text-sm font-semibold text-stone-950">Sin proyecto asociado</p>
            )}
            <p className="mt-1 text-xs text-stone-500">
              {request.project ? request.project.status : "Se puede cotizar sin proyecto"}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Agenda tecnica
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatMeasurementWindow(
                request.scheduledDate,
                request.scheduledStartTime,
                request.scheduledEndTime,
              )}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {request.assignedTechnician?.name ?? "Tecnico por asignar"}
            </p>
          </div>
          <div className="rounded-[1.1rem] border border-stone-200 bg-stone-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Resumen de campo
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {request.openingCount} medidas · {request.evidenceCount} evidencias
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {request.openObservationCount} observaciones abiertas
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Direccion de obra
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">
                  {request.address?.label ?? "Sin direccion registrada"}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {request.address?.address ?? "Asocia una direccion del cliente para la visita."}
                </p>
              </div>
              {mapLink ? (
                <a
                  className={secondaryButtonClassName}
                  href={mapLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MapPinned className="mr-2 h-4 w-4" />
                  Abrir mapa
                </a>
              ) : null}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-stone-600 md:grid-cols-2">
              <p>
                Creada por:{" "}
                <span className="font-medium text-stone-950">
                  {request.createdByUser?.name ?? "Sistema"}
                </span>
              </p>
              <p>
                Ultima actualizacion:{" "}
                <span className="font-medium text-stone-950">
                  {formatMeasurementDateTime(request.updatedAt)}
                </span>
              </p>
              <p>
                Aprobada por:{" "}
                <span className="font-medium text-stone-950">
                  {request.approvedByUser?.name ?? "Pendiente"}
                </span>
              </p>
              <p>
                Fecha de aprobacion:{" "}
                <span className="font-medium text-stone-950">
                  {formatMeasurementDateTime(request.approvedAt)}
                </span>
              </p>
            </div>
            {request.observations ? (
              <div className="mt-4 rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Observaciones generales
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{request.observations}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Estado de aberturas
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {OPENING_STATUS_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className="rounded-[1rem] border border-stone-200 bg-stone-50 px-3 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {option.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {openingStatusSummary[option.value] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {request.alerts.quotation.length > 0 || request.alerts.production.length > 0 ? (
        <section className={sectionClassName}>
          <div className="grid gap-4 lg:grid-cols-2">
            {request.alerts.quotation.length > 0 ? (
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Alertas para cotizacion
                </p>
                <div className="mt-3 space-y-2 text-sm text-amber-900">
                  {request.alerts.quotation.map((alertText) => (
                    <p key={alertText}>{alertText}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {request.alerts.production.length > 0 ? (
              <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                  Alertas para produccion
                </p>
                <div className="mt-3 space-y-2 text-sm text-rose-900">
                  {request.alerts.production.map((alertText) => (
                    <p key={alertText}>{alertText}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeError ? (
        <section className={sectionClassName}>
          <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {activeError}
          </div>
        </section>
      ) : null}

      <section className={sectionClassName}>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Programacion de visita
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Coordinar tecnico y horario
                </h2>
              </div>
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  void refreshRequest();
                }}
                type="button"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Tecnico asignado</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setAssignedTechnicianId(event.target.value);
                  }}
                  value={assignedTechnicianId}
                >
                  <option value="">Sin asignar</option>
                  {(techniciansQuery.data ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Fecha programada</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setScheduledDate(event.target.value);
                  }}
                  type="date"
                  value={scheduledDate}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Hora inicio</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setScheduledStartTime(event.target.value);
                  }}
                  type="time"
                  value={scheduledStartTime}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Hora fin</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setScheduledEndTime(event.target.value);
                  }}
                  type="time"
                  value={scheduledEndTime}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Notas de agenda</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setScheduleNotes(event.target.value);
                  }}
                  placeholder="Accesos, referencias del lugar, contacto en obra o notas de coordinacion."
                  value={scheduleNotes}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">
                  Motivo de reprogramacion
                </span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setReprogramReason(event.target.value);
                  }}
                  placeholder="Explica por que debe moverse la visita tecnica."
                  value={reprogramReason}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Notas para cancelar</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setCancelNotes(event.target.value);
                  }}
                  placeholder="Indica el motivo si la solicitud ya no continuara."
                  value={cancelNotes}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {canSchedule || canAssign ? (
                <button
                  className={primaryButtonClassName}
                  disabled={scheduleMutation.isPending}
                  onClick={() => {
                    void scheduleMutation.mutateAsync();
                  }}
                  type="button"
                >
                  {MEASUREMENTS_LABELS.buttons.schedule}
                </button>
              ) : null}
              {canSchedule ? (
                <button
                  className={secondaryButtonClassName}
                  disabled={reprogramMutation.isPending}
                  onClick={() => {
                    void reprogramMutation.mutateAsync();
                  }}
                  type="button"
                >
                  <TimerReset className="mr-2 h-4 w-4" />
                  {MEASUREMENTS_LABELS.buttons.reprogram}
                </button>
              ) : null}
              {canUpdate && request.status !== "APPROVED" && request.status !== "CANCELLED" ? (
                <button
                  className={secondaryButtonClassName}
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    void cancelMutation.mutateAsync();
                  }}
                  type="button"
                >
                  {MEASUREMENTS_LABELS.buttons.cancel}
                </button>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Control de visita y aprobacion
            </p>
            <div className="mt-4 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Observaciones de visita</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setVisitNotes(event.target.value);
                  }}
                  placeholder="Describe condiciones de obra, restricciones o hallazgos de campo."
                  value={visitNotes}
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                <input
                  checked={locationConfirmed}
                  onChange={(event) => {
                    setLocationConfirmed(event.target.checked);
                  }}
                  type="checkbox"
                />
                Ubicacion confirmada en obra
              </label>

              {canExecute &&
              (request.status === "SCHEDULED" || request.status === "RESCHEDULED") ? (
                <button
                  className={primaryButtonClassName}
                  disabled={startVisitMutation.isPending}
                  onClick={() => {
                    void startVisitMutation.mutateAsync();
                  }}
                  type="button"
                >
                  {MEASUREMENTS_LABELS.buttons.startVisit}
                </button>
              ) : null}

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Resultado para revision</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSubmissionResult(
                      event.target.value as (typeof VISIT_RESULT_OPTIONS)[number]["value"],
                    );
                  }}
                  value={submissionResult}
                >
                  {VISIT_RESULT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Notas para revision</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setSubmissionNotes(event.target.value);
                  }}
                  placeholder="Indica si la medicion queda lista para cotizar o si requiere retorno."
                  value={submissionNotes}
                />
              </label>

              {canExecute ? (
                <button
                  className={secondaryButtonClassName}
                  disabled={submitApprovalMutation.isPending}
                  onClick={() => {
                    void submitApprovalMutation.mutateAsync();
                  }}
                  type="button"
                >
                  {MEASUREMENTS_LABELS.buttons.submitApproval}
                </button>
              ) : null}

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Notas de aprobacion</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setApprovalNotes(event.target.value);
                  }}
                  placeholder="Observaciones finales para aprobar el relevamiento."
                  value={approvalNotes}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Notas de rechazo</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setRejectionNotes(event.target.value);
                  }}
                  placeholder="Explica por que la medicion debe rechazarse o rehacerse."
                  value={rejectionNotes}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {canApprove ? (
                  <button
                    className={primaryButtonClassName}
                    disabled={approveMutation.isPending}
                    onClick={() => {
                      void approveMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {MEASUREMENTS_LABELS.buttons.approve}
                  </button>
                ) : null}
                {canReject ? (
                  <button
                    className={secondaryButtonClassName}
                    disabled={rejectMutation.isPending}
                    onClick={() => {
                      void rejectMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    {MEASUREMENTS_LABELS.buttons.reject}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Registro de medidas
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  Ambientes, elementos y dimensiones
                </h2>
              </div>
              {editingOpeningId ? (
                <button
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingOpeningId(null);
                    setOpeningForm(EMPTY_OPENING_FORM);
                    setOpeningFormError(null);
                  }}
                  type="button"
                >
                  Limpiar formulario
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Codigo interno</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      code: event.target.value,
                    }));
                  }}
                  placeholder="Se autogenera si lo dejas vacio"
                  value={openingForm.code}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Ambiente</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      environment: event.target.value,
                    }));
                  }}
                  placeholder="Ejemplo: Sala, cocina, fachada norte"
                  value={openingForm.environment}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Tipo de elemento</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      elementType: event.target.value as MeasurementOpeningInput["elementType"],
                    }));
                  }}
                  value={openingForm.elementType}
                >
                  {MEASUREMENT_ELEMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Ancho (mm)</span>
                <input
                  className={fieldClassName}
                  min="1"
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      widthMm: event.target.value,
                    }));
                  }}
                  step="0.01"
                  type="number"
                  value={openingForm.widthMm}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Alto (mm)</span>
                <input
                  className={fieldClassName}
                  min="1"
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      heightMm: event.target.value,
                    }));
                  }}
                  step="0.01"
                  type="number"
                  value={openingForm.heightMm}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Profundidad (mm)</span>
                <input
                  className={fieldClassName}
                  min="0"
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      depthMm: event.target.value,
                    }));
                  }}
                  step="0.01"
                  type="number"
                  value={openingForm.depthMm}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cantidad</span>
                <input
                  className={fieldClassName}
                  min="1"
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }));
                  }}
                  step="1"
                  type="number"
                  value={openingForm.quantity}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Estado</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      status: event.target.value as MeasurementOpeningInput["status"],
                    }));
                  }}
                  value={openingForm.status}
                >
                  {OPENING_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700 md:col-span-2">
                <input
                  checked={openingForm.requiresCorrection}
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      requiresCorrection: event.target.checked,
                      status:
                        event.target.checked && current.status === "REGISTERED"
                          ? "NEEDS_CORRECTION"
                          : current.status,
                    }));
                  }}
                  type="checkbox"
                />
                Requiere correccion antes de cotizar o producir
              </label>
              <label className="space-y-2 md:col-span-2 xl:col-span-4">
                <span className="text-sm font-medium text-stone-700">Observaciones</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setOpeningForm((current) => ({
                      ...current,
                      observations: event.target.value,
                    }));
                  }}
                  placeholder="Detalle de encuentros, desniveles, herrajes, tolerancias o requerimientos especiales."
                  value={openingForm.observations}
                />
              </label>
            </div>

            {openingFormError ? (
              <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {openingFormError}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={primaryButtonClassName}
                disabled={saveOpeningMutation.isPending}
                onClick={() => {
                  void saveOpeningMutation.mutateAsync();
                }}
                type="button"
              >
                <Ruler className="mr-2 h-4 w-4" />
                {editingOpeningId ? "Actualizar medida" : "Registrar medida"}
              </button>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Contexto de visita
            </p>
            {latestVisit ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-sm font-semibold text-stone-950">
                    {latestVisit.technician?.name ?? "Tecnico sin asignar"}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatMeasurementDateTime(latestVisit.startedAt)}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Estado de visita
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {visitStatusBadge?.label ?? "Sin visita"}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Resultado
                    </p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">
                      {visitResultBadge?.label ?? "Pendiente"}
                    </p>
                  </div>
                </div>
                <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                  {latestVisit.generalObservations || "Sin observaciones generales de visita."}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[1rem] border border-dashed border-stone-200 px-4 py-6 text-sm text-stone-500">
                Programa o inicia una visita tecnica para registrar medidas, evidencias y observaciones.
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 ${tableWrapperClassName}`}>
          {openings.length === 0 ? (
            <EmptyState
              description="Todavia no hay aberturas medidas para esta solicitud."
              title="Sin medidas registradas"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-4 py-3">Abertura</th>
                    <th className="px-4 py-3">Dimensiones</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {openings.map((opening) => {
                    const status = getMeasurementOpeningStatusBadge(opening.status);

                    return (
                      <tr key={opening.id} className="align-top">
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="font-semibold text-stone-950">{opening.code}</p>
                            <p className="text-xs text-stone-500">
                              {opening.environment} · {MEASUREMENT_ELEMENT_LABELS[opening.elementType]}
                            </p>
                            <p className="text-xs text-stone-500">
                              Tecnico: {opening.technicianName}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1 text-sm text-stone-700">
                            <p>
                              {opening.widthMm} × {opening.heightMm}
                              {opening.depthMm !== null ? ` × ${opening.depthMm}` : ""} mm
                            </p>
                            <p className="text-xs text-stone-500">
                              Cantidad: {opening.quantity}
                              {opening.requiresCorrection ? " · Requiere correccion" : ""}
                            </p>
                            <p className="text-xs text-stone-500">
                              {opening.observations || "Sin observaciones"}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className={secondaryButtonClassName}
                              onClick={() => {
                                setEditingOpeningId(opening.id);
                                setOpeningForm(loadOpeningIntoForm(opening));
                                setOpeningFormError(null);
                              }}
                              type="button"
                            >
                              <PencilLine className="mr-2 h-4 w-4" />
                              Editar
                            </button>
                            <button
                              className={secondaryButtonClassName}
                              disabled={duplicateOpeningMutation.isPending}
                              onClick={() => {
                                void duplicateOpeningMutation.mutateAsync(opening.id);
                              }}
                              type="button"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              {MEASUREMENTS_LABELS.buttons.duplicate}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Evidencias
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Tipo</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setEvidenceType(event.target.value as MeasurementEvidenceInput["type"]);
                  }}
                  value={evidenceType}
                >
                  {MEASUREMENT_EVIDENCE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Abertura asociada</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSelectedOpeningId(event.target.value);
                  }}
                  value={selectedOpeningId}
                >
                  <option value="">Sin asociar</option>
                  {openings.map((opening) => (
                    <option key={opening.id} value={opening.id}>
                      {opening.code} · {opening.environment}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Descripcion</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setEvidenceDescription(event.target.value);
                  }}
                  placeholder="Describe lo que muestra la evidencia."
                  value={evidenceDescription}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Archivo</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setEvidenceFile(event.target.files?.[0] ?? null);
                  }}
                  type="file"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={primaryButtonClassName}
                disabled={evidenceMutation.isPending}
                onClick={() => {
                  void evidenceMutation.mutateAsync();
                }}
                type="button"
              >
                <Upload className="mr-2 h-4 w-4" />
                {MEASUREMENTS_LABELS.buttons.uploadEvidence}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {evidence.length === 0 ? (
                <EmptyState
                  description="Las fotos, croquis y archivos de obra apareceran aqui."
                  title="Sin evidencias cargadas"
                />
              ) : (
                evidence.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">{item.fileName}</p>
                        <p className="mt-1 text-xs text-stone-500">
                          {item.technicianName} · {formatMeasurementDateTime(item.uploadedAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                        {MEASUREMENT_EVIDENCE_TYPE_OPTIONS.find(
                          (option) => option.value === item.type,
                        )?.label ?? item.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-stone-700">
                      {item.description || "Sin descripcion"}
                    </p>
                    {item.mimeType?.startsWith("image/") ? (
                      // Evidence files are user-provided URLs and are intentionally rendered as-is.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={item.fileName}
                        className="mt-3 h-48 w-full rounded-[1rem] border border-stone-200 object-cover"
                        src={item.fileUrl}
                      />
                    ) : (
                      <a
                        className="mt-3 inline-flex text-sm font-medium text-[color:var(--color-primary)] hover:underline"
                        href={item.fileUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Abrir archivo
                      </a>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Observaciones tecnicas
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Tipo</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setObservationType(
                      event.target.value as (typeof TECHNICAL_OBSERVATION_TYPE_OPTIONS)[number]["value"],
                    );
                  }}
                  value={observationType}
                >
                  {TECHNICAL_OBSERVATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Severidad</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setObservationSeverity(
                      event.target.value as (typeof TECHNICAL_OBSERVATION_SEVERITY_OPTIONS)[number]["value"],
                    );
                  }}
                  value={observationSeverity}
                >
                  {TECHNICAL_OBSERVATION_SEVERITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Estado inicial</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setObservationStatus(
                      event.target.value as (typeof TECHNICAL_OBSERVATION_STATUS_OPTIONS)[number]["value"],
                    );
                  }}
                  value={observationStatus}
                >
                  {TECHNICAL_OBSERVATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Descripcion</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setObservationDescription(event.target.value);
                  }}
                  placeholder="Detalla el hallazgo tecnico y su impacto sobre la medicion."
                  value={observationDescription}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={primaryButtonClassName}
                disabled={observationMutation.isPending}
                onClick={() => {
                  void observationMutation.mutateAsync();
                }}
                type="button"
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar observacion
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {observations.length === 0 ? (
                <EmptyState
                  description="Los hallazgos de acceso, seguridad o estructura apareceran aqui."
                  title="Sin observaciones tecnicas"
                />
              ) : (
                observations.map((observation) => {
                  const severityBadge = getTechnicalObservationSeverityBadge(
                    observation.severity,
                  );
                  const status = getTechnicalObservationStatusBadge(observation.status);
                  const actionLabel = renderObservationActionLabel(observation.status);

                  return (
                    <article
                      key={observation.id}
                      className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">
                            {TECHNICAL_OBSERVATION_TYPE_LABELS[observation.type]}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {observation.technicianName} ·{" "}
                            {formatMeasurementDateTime(observation.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${severityBadge.className}`}
                          >
                            {severityBadge.label}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-700">
                        {observation.description}
                      </p>
                      {actionLabel ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {observation.status === "OPEN" ? (
                            <button
                              className={secondaryButtonClassName}
                              disabled={resolveObservationMutation.isPending}
                              onClick={() => {
                                void resolveObservationMutation.mutateAsync({
                                  observationId: observation.id,
                                  status: "IN_PROGRESS",
                                });
                              }}
                              type="button"
                            >
                              {actionLabel}
                            </button>
                          ) : null}
                          {observation.status === "IN_PROGRESS" ? (
                            <button
                              className={primaryButtonClassName}
                              disabled={resolveObservationMutation.isPending}
                              onClick={() => {
                                void resolveObservationMutation.mutateAsync({
                                  observationId: observation.id,
                                  status: "RESOLVED",
                                });
                              }}
                              type="button"
                            >
                              Resolver observacion
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Historial de cambios
            </p>
            <div className="mt-4 space-y-3">
              {request.statusHistory.length === 0 ? (
                <EmptyState
                  description="Los cambios de estado y las decisiones apareceran aqui."
                  title="Sin historial registrado"
                />
              ) : (
                request.statusHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {MEASUREMENT_STATUS_LABELS[entry.toStatus]}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {entry.changedByUser?.name ?? "Sistema"} ·{" "}
                          {formatMeasurementDateTime(entry.createdAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                        {entry.fromStatus
                          ? `${MEASUREMENT_STATUS_LABELS[entry.fromStatus]} -> ${MEASUREMENT_STATUS_LABELS[entry.toStatus]}`
                          : `Inicio -> ${MEASUREMENT_STATUS_LABELS[entry.toStatus]}`}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-stone-700">
                      {entry.notes || "Sin notas registradas"}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Cotizaciones vinculadas
              </p>
              <div className="mt-4 space-y-3">
                {request.quotations.length === 0 ? (
                  <div className="rounded-[1rem] border border-dashed border-stone-200 px-4 py-5 text-sm text-stone-500">
                    {request.status === "APPROVED"
                      ? "La medicion ya puede convertirse en una cotizacion."
                      : "La cotizacion se habilita cuando la medicion este aprobada."}
                  </div>
                ) : (
                  request.quotations.map((quotation) => (
                    <Link
                      key={quotation.id}
                      className="block rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4 transition hover:border-[color:var(--color-primary)] hover:bg-white"
                      href={QUOTATIONS_ROUTES.view(quotation.id)}
                    >
                      <p className="text-sm font-semibold text-stone-950">{quotation.code}</p>
                      <p className="mt-1 text-xs text-stone-500">{quotation.status}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Produccion vinculada
              </p>
              <div className="mt-4 space-y-3">
                {request.productionJobs.length === 0 ? (
                  <div className="rounded-[1rem] border border-dashed border-stone-200 px-4 py-5 text-sm text-stone-500">
                    Las ordenes de trabajo asociadas apareceran aqui cuando la medicion se use en produccion.
                  </div>
                ) : (
                  request.productionJobs.map((job) => (
                    <Link
                      key={job.id}
                      className="block rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-4 transition hover:border-[color:var(--color-primary)] hover:bg-white"
                      href={PRODUCTION_ROUTES.jobDetail(job.id)}
                    >
                      <p className="text-sm font-semibold text-stone-950">{job.code}</p>
                      <p className="mt-1 text-xs text-stone-500">{job.status}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
