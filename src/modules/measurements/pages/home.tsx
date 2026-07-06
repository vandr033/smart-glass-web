"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  MapPinned,
  RefreshCcw,
  Ruler,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExportMenu } from "@/components/ui/export-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { MEASUREMENTS_LABELS } from "@/modules/measurements/constants";
import { clientService } from "@/services/client-service";
import { measurementService } from "@/services/measurement-service";
import { projectService } from "@/services/project-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

import {
  MEASUREMENT_CALENDAR_VIEW_LABELS,
  MEASUREMENT_PRIORITY_OPTIONS,
  MEASUREMENTS_PERMISSIONS,
  MEASUREMENTS_QUERY_KEYS,
  MEASUREMENTS_ROUTES,
  MEASUREMENT_STATUS_OPTIONS,
} from "../constants";
import {
  buildMapLink,
  formatMeasurementDate,
  formatMeasurementWindow,
  getMeasurementPriorityBadge,
  getMeasurementStatusBadge,
} from "../ui";

import type {
  MeasurementCalendarView,
  MeasurementRequestInput,
  MeasurementRequestListItem,
  MeasurementRequestStatus,
} from "@/types";

const DAY_NAME_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  weekday: "short",
});

const DAY_NUMBER_FORMATTER = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "short",
});

const monthAnchor = (value: Date) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));

const addDaysUtc = (value: Date, days: number) => {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const addMonthsUtc = (value: Date, months: number) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + months, 1));

const startOfWeekUtc = (value: Date) => {
  const date = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const weekDay = date.getUTCDay();
  const offset = weekDay === 0 ? -6 : 1 - weekDay;
  return addDaysUtc(date, offset);
};

const formatDateInput = (value: Date) => value.toISOString().slice(0, 10);

const isSameDayUtc = (left: Date, right: Date) =>
  left.getUTCFullYear() === right.getUTCFullYear() &&
  left.getUTCMonth() === right.getUTCMonth() &&
  left.getUTCDate() === right.getUTCDate();

const getCalendarRange = (view: MeasurementCalendarView, anchorDate: Date) => {
  if (view === "day") {
    return {
      dateFrom: formatDateInput(anchorDate),
      dateTo: formatDateInput(anchorDate),
    };
  }

  if (view === "week") {
    const start = startOfWeekUtc(anchorDate);
    const end = addDaysUtc(start, 6);

    return {
      dateFrom: formatDateInput(start),
      dateTo: formatDateInput(end),
    };
  }

  const monthStart = monthAnchor(anchorDate);
  const gridStart = startOfWeekUtc(monthStart);
  const gridEnd = addDaysUtc(gridStart, 41);

  return {
    dateFrom: formatDateInput(gridStart),
    dateTo: formatDateInput(gridEnd),
  };
};

const groupRequestsByDate = (requests: MeasurementRequestListItem[]) => {
  return requests.reduce<Record<string, MeasurementRequestListItem[]>>((result, request) => {
    const baseDate = request.scheduledDate ?? request.requestedDate;
    const dateKey = baseDate.slice(0, 10);
    const currentItems = result[dateKey] ?? [];
    currentItems.push(request);
    result[dateKey] = currentItems.sort((left, right) =>
      (left.scheduledStartTime ?? "").localeCompare(right.scheduledStartTime ?? ""),
    );
    return result;
  }, {});
};

export default function MeasurementsHomePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(MEASUREMENTS_PERMISSIONS.create);
  const canExecute = permissions.includes(MEASUREMENTS_PERMISSIONS.execute);
  const canApprove = permissions.includes(MEASUREMENTS_PERMISSIONS.approve);
  const canExport = permissions.includes(MEASUREMENTS_PERMISSIONS.export);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MeasurementRequestStatus | "">("");
  const [technicianId, setTechnicianId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [calendarView, setCalendarView] = useState<MeasurementCalendarView>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [formClientId, setFormClientId] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [formAddressId, setFormAddressId] = useState("");
  const [formTechnicianId, setFormTechnicianId] = useState("");
  const [formRequestedDate, setFormRequestedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [formScheduledDate, setFormScheduledDate] = useState("");
  const [formScheduledStartTime, setFormScheduledStartTime] = useState("");
  const [formScheduledEndTime, setFormScheduledEndTime] = useState("");
  const [formPriority, setFormPriority] =
    useState<MeasurementRequestInput["priority"]>("NORMAL");
  const [formObservations, setFormObservations] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const calendarRange = useMemo(
    () => getCalendarRange(calendarView, anchorDate),
    [anchorDate, calendarView],
  );

  const requestsQuery = useQuery({
    queryFn: () =>
      measurementService.listRequests({
        clientId: clientId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        perPage: 10,
        projectId: projectId || undefined,
        search,
        sortBy: "scheduledDate",
        sortDirection: "asc",
        status: status || undefined,
        technicianId: technicianId || undefined,
      }),
    queryKey: MEASUREMENTS_QUERY_KEYS.requests({
      clientId,
      dateFrom,
      dateTo,
      page,
      projectId,
      search,
      status,
      technicianId,
    }),
  });

  const calendarQuery = useQuery({
    queryFn: () =>
      measurementService.listCalendar({
        clientId: clientId || undefined,
        dateFrom: calendarRange.dateFrom,
        dateTo: calendarRange.dateTo,
        projectId: projectId || undefined,
        status: status || undefined,
        technicianId: technicianId || undefined,
        view: calendarView,
      }),
    queryKey: MEASUREMENTS_QUERY_KEYS.calendar({
      calendarRange,
      calendarView,
      clientId,
      projectId,
      status,
      technicianId,
    }),
  });

  const clientsQuery = useQuery({
    queryFn: async () => {
      const result = await clientService.listClients({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["measurements", "client-options"],
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryFn: async () => {
      const result = await projectService.listProjects({
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["measurements", "project-options"],
    staleTime: 60_000,
  });

  const techniciansQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["measurements", "technician-options"],
    staleTime: 60_000,
  });

  const addressesQuery = useQuery({
    enabled: formClientId.trim().length > 0,
    queryFn: () => clientService.listClientAddresses(formClientId),
    queryKey: ["measurements", "address-options", formClientId],
    staleTime: 60_000,
  });

  const refreshMeasurements = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["measurements"],
      }),
      requestsQuery.refetch(),
      calendarQuery.refetch(),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (input: MeasurementRequestInput) => measurementService.createRequest(input),
    onSuccess: async (createdRequest) => {
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: ["measurements"],
      });
      router.push(MEASUREMENTS_ROUTES.detail(createdRequest.id));
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  const quickStartMutation = useMutation({
    mutationFn: (requestId: string) =>
      measurementService.startVisit(requestId, {
        generalObservations: null,
        locationConfirmed: true,
      }),
    onSuccess: (result) => {
      void refreshMeasurements();
      router.push(MEASUREMENTS_ROUTES.detail(result.id));
    },
  });

  const quickApproveMutation = useMutation({
    mutationFn: (requestId: string) =>
      measurementService.approveRequest(requestId, {
        notes: "Aprobada desde el tablero de mediciones.",
      }),
    onSuccess: () => {
      void refreshMeasurements();
    },
  });

  if (
    requestsQuery.isPending ||
    calendarQuery.isPending ||
    clientsQuery.isPending ||
    projectsQuery.isPending ||
    techniciansQuery.isPending
  ) {
    return <LoadingState title="Cargando modulo de mediciones" />;
  }

  if (
    requestsQuery.isError ||
    calendarQuery.isError ||
    clientsQuery.isError ||
    projectsQuery.isError ||
    techniciansQuery.isError
  ) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void refreshMeasurements();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          requestsQuery.error?.message ??
          calendarQuery.error?.message ??
          clientsQuery.error?.message ??
          projectsQuery.error?.message ??
          techniciansQuery.error?.message ??
          "No se pudo cargar el modulo de mediciones."
        }
        title="No se pudo cargar mediciones y visitas tecnicas"
      />
    );
  }

  const requestRows = requestsQuery.data?.data ?? [];
  const requestPagination = requestsQuery.data?.pagination;
  const calendarRows = calendarQuery.data ?? [];
  const groupedCalendar = groupRequestsByDate(calendarRows);
  const visibleDays = Array.from(
    { length: calendarView === "day" ? 1 : calendarView === "week" ? 7 : 42 },
    (_, index) => {
      const baseDate =
        calendarView === "day"
          ? new Date(anchorDate)
          : calendarView === "week"
            ? addDaysUtc(startOfWeekUtc(anchorDate), index)
            : addDaysUtc(startOfWeekUtc(monthAnchor(anchorDate)), index);

      return baseDate;
    },
  );

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            {canExport ? (
              <ExportMenu
                buttonClassName={secondaryButtonClassName}
                onExportExcel={() => {
                  exportRowsToExcel(requestRows, {
                    columns: [
                      { header: "Codigo", value: (row) => row.code },
                      { header: "Cliente", value: (row) => row.client.displayName },
                      { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
                      { header: "Estado", value: (row) => getMeasurementStatusBadge(row.status).label },
                      { header: "Tecnico", value: (row) => row.assignedTechnician?.name ?? "Sin asignar" },
                      { header: "Fecha solicitada", value: (row) => formatMeasurementDate(row.requestedDate) },
                      { header: "Horario", value: (row) => formatMeasurementWindow(row.scheduledDate, row.scheduledStartTime, row.scheduledEndTime) },
                    ],
                    fileName: "solicitudes-medicion.xls",
                    title: MEASUREMENTS_LABELS.exports.list,
                  });
                }}
                onExportPdf={() => {
                  exportRowsToPdf(requestRows, {
                    columns: [
                      { header: "Codigo", value: (row) => row.code },
                      { header: "Cliente", value: (row) => row.client.displayName },
                      { header: "Estado", value: (row) => getMeasurementStatusBadge(row.status).label },
                      { header: "Tecnico", value: (row) => row.assignedTechnician?.name ?? "Sin asignar" },
                      { header: "Fecha", value: (row) => formatMeasurementDate(row.scheduledDate ?? row.requestedDate) },
                      { header: "Observaciones", value: (row) => row.observations ?? "Sin observaciones" },
                    ],
                    fileName: "solicitudes-medicion.pdf",
                    title: MEASUREMENTS_LABELS.exports.list,
                  });
                }}
              />
            ) : null}
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void refreshMeasurements();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </button>
          </div>
        }
        description={MEASUREMENTS_LABELS.page.description}
        eyebrow={MEASUREMENTS_LABELS.page.eyebrow}
        title={MEASUREMENTS_LABELS.page.title}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <section className={sectionClassName}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                Solicitudes
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                Bandeja operativa de mediciones
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700">
              <ClipboardCheck className="h-4 w-4" />
              {requestPagination?.total ?? 0} solicitudes registradas
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Buscar</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Codigo, cliente o proyecto"
                type="search"
                value={search}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Estado</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setPage(1);
                  setStatus((event.target.value as MeasurementRequestStatus) || "");
                }}
                value={status}
              >
                <option value="">Todos los estados</option>
                {MEASUREMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Tecnico</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setPage(1);
                  setTechnicianId(event.target.value);
                }}
                value={technicianId}
              >
                <option value="">Todos los tecnicos</option>
                {techniciansQuery.data.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Cliente</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setPage(1);
                  setClientId(event.target.value);
                }}
                value={clientId}
              >
                <option value="">Todos los clientes</option>
                {clientsQuery.data.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Proyecto</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setPage(1);
                  setProjectId(event.target.value);
                }}
                value={projectId}
              >
                <option value="">Todos los proyectos</option>
                {projectsQuery.data.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Desde</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setPage(1);
                    setDateFrom(event.target.value);
                  }}
                  type="date"
                  value={dateFrom}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Hasta</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setPage(1);
                    setDateTo(event.target.value);
                  }}
                  type="date"
                  value={dateTo}
                />
              </label>
            </div>
          </div>

          <div className={`mt-5 ${tableWrapperClassName}`}>
            {requestRows.length === 0 ? (
              <EmptyState
                description={MEASUREMENTS_LABELS.emptyStates.requestsDescription}
                title={MEASUREMENTS_LABELS.emptyStates.requestsTitle}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 text-sm">
                  <thead className="bg-stone-50">
                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-stone-500">
                      <th className="px-4 py-3">Solicitud</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Agenda</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {requestRows.map((requestRow) => {
                      const statusBadge = getMeasurementStatusBadge(requestRow.status);
                      const priorityBadge = getMeasurementPriorityBadge(requestRow.priority);
                      const mapLink = buildMapLink({
                        address: requestRow.address?.address ?? null,
                        latitude: requestRow.address?.latitude ?? null,
                        longitude: requestRow.address?.longitude ?? null,
                      });

                      return (
                        <tr key={requestRow.id} className="align-top">
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  className="font-semibold text-stone-950 hover:text-[color:var(--color-primary)]"
                                  href={MEASUREMENTS_ROUTES.detail(requestRow.id)}
                                >
                                  {requestRow.code}
                                </Link>
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${priorityBadge.className}`}
                                >
                                  {priorityBadge.label}
                                </span>
                                {requestRow.hasScheduleConflict ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-800">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Conflicto
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-xs text-stone-500">
                                {requestRow.project
                                  ? `${requestRow.project.code} · ${requestRow.project.title}`
                                  : "Sin proyecto asociado"}
                              </p>
                              <p className="text-xs text-stone-500">
                                {requestRow.openingCount} medidas · {requestRow.evidenceCount} evidencias ·{" "}
                                {requestRow.openObservationCount} observaciones abiertas
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <p className="font-medium text-stone-900">
                                {requestRow.client.displayName}
                              </p>
                              <p className="text-xs text-stone-500">
                                {requestRow.assignedTechnician?.name ?? "Tecnico sin asignar"}
                              </p>
                              {requestRow.address ? (
                                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                                  <span>{requestRow.address.label}</span>
                                  {mapLink ? (
                                    <a
                                      className="inline-flex items-center gap-1 text-[color:var(--color-primary)] hover:underline"
                                      href={mapLink}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <MapPinned className="h-3.5 w-3.5" />
                                      Ubicar
                                    </a>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1.5">
                              <p className="font-medium text-stone-900">
                                {formatMeasurementWindow(
                                  requestRow.scheduledDate,
                                  requestRow.scheduledStartTime,
                                  requestRow.scheduledEndTime,
                                )}
                              </p>
                              <p className="text-xs text-stone-500">
                                Solicitada el {formatMeasurementDate(requestRow.requestedDate)}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                className={secondaryButtonClassName}
                                href={MEASUREMENTS_ROUTES.detail(requestRow.id)}
                              >
                                Detalle
                              </Link>
                              {canExecute &&
                              (requestRow.status === "SCHEDULED" ||
                                requestRow.status === "RESCHEDULED") ? (
                                <button
                                  className={secondaryButtonClassName}
                                  disabled={quickStartMutation.isPending}
                                  onClick={() => {
                                    void quickStartMutation.mutateAsync(requestRow.id);
                                  }}
                                  type="button"
                                >
                                  Iniciar
                                </button>
                              ) : null}
                              {canApprove && requestRow.status === "PENDING_APPROVAL" ? (
                                <button
                                  className={primaryButtonClassName}
                                  disabled={quickApproveMutation.isPending}
                                  onClick={() => {
                                    void quickApproveMutation.mutateAsync(requestRow.id);
                                  }}
                                  type="button"
                                >
                                  Aprobar
                                </button>
                              ) : null}
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

          {requestPagination && requestPagination.total > requestPagination.perPage ? (
            <div className="mt-4 flex items-center justify-between">
              <button
                className={secondaryButtonClassName}
                disabled={page <= 1}
                onClick={() => {
                  setPage((current) => Math.max(current - 1, 1));
                }}
                type="button"
              >
                Anterior
              </button>
              <p className="text-sm text-stone-600">
                Pagina {page} · {requestPagination.total} registros
              </p>
              <button
                className={secondaryButtonClassName}
                disabled={page * requestPagination.perPage >= requestPagination.total}
                onClick={() => {
                  setPage((current) => current + 1);
                }}
                type="button"
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </section>

        <section className={sectionClassName}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Alta rapida
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
              Nueva solicitud de medicion
            </h2>
          </div>

          {!canCreate ? (
            <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
              No tienes permiso para crear solicitudes de medicion.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cliente</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setFormClientId(event.target.value);
                    setFormAddressId("");
                  }}
                  value={formClientId}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientsQuery.data.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Proyecto</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setFormProjectId(event.target.value);
                  }}
                  value={formProjectId}
                >
                  <option value="">Sin proyecto</option>
                  {projectsQuery.data.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code} · {project.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Direccion</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setFormAddressId(event.target.value);
                  }}
                  value={formAddressId}
                >
                  <option value="">Sin direccion seleccionada</option>
                  {(addressesQuery.data ?? []).map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label} · {address.address}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Fecha solicitada</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormRequestedDate(event.target.value);
                    }}
                    type="date"
                    value={formRequestedDate}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Prioridad</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormPriority(event.target.value as MeasurementRequestInput["priority"]);
                    }}
                    value={formPriority}
                  >
                    {MEASUREMENT_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Tecnico asignado</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setFormTechnicianId(event.target.value);
                  }}
                  value={formTechnicianId}
                >
                  <option value="">Se asignara despues</option>
                  {techniciansQuery.data.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-stone-700">Fecha programada</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormScheduledDate(event.target.value);
                    }}
                    type="date"
                    value={formScheduledDate}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Hora inicio</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormScheduledStartTime(event.target.value);
                    }}
                    type="time"
                    value={formScheduledStartTime}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Hora fin</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormScheduledEndTime(event.target.value);
                    }}
                    type="time"
                    value={formScheduledEndTime}
                  />
                </label>
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Observaciones</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setFormObservations(event.target.value);
                  }}
                  placeholder="Accesos, condiciones del lugar, requerimientos previos o notas operativas."
                  value={formObservations}
                />
              </label>

              {formError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <button
                className={primaryButtonClassName}
                disabled={createMutation.isPending}
                onClick={() => {
                  if (!formClientId || !formRequestedDate) {
                    setFormError("Debes seleccionar un cliente y una fecha solicitada.");
                    return;
                  }

                  setFormError(null);

                  void createMutation.mutateAsync({
                    addressId: formAddressId || null,
                    assignedTechnicianId: formTechnicianId || null,
                    clientId: formClientId,
                    observations: formObservations.trim() || null,
                    priority: formPriority,
                    projectId: formProjectId || null,
                    requestedDate: formRequestedDate,
                    scheduledDate: formScheduledDate || null,
                    scheduledEndTime: formScheduledEndTime || null,
                    scheduledStartTime: formScheduledStartTime || null,
                  });
                }}
                type="button"
              >
                <Ruler className="mr-2 h-4 w-4" />
                {MEASUREMENTS_LABELS.buttons.create}
              </button>
            </div>
          )}
        </section>
      </div>

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Calendario tecnico
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-950">
              Agenda diaria, semanal y mensual
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-stone-200 bg-white p-1">
              {(["day", "week", "month"] as const).map((viewValue) => (
                <button
                  key={viewValue}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    calendarView === viewValue
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-stone-600"
                  }`}
                  onClick={() => {
                    setCalendarView(viewValue);
                  }}
                  type="button"
                >
                  {MEASUREMENT_CALENDAR_VIEW_LABELS[viewValue]}
                </button>
              ))}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1">
              <button
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100"
                onClick={() => {
                  setAnchorDate((current) =>
                    calendarView === "month"
                      ? addMonthsUtc(current, -1)
                      : addDaysUtc(current, calendarView === "week" ? -7 : -1),
                  );
                }}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[10rem] text-center text-sm font-semibold text-stone-800">
                {formatMeasurementDate(anchorDate.toISOString())}
              </span>
              <button
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100"
                onClick={() => {
                  setAnchorDate((current) =>
                    calendarView === "month"
                      ? addMonthsUtc(current, 1)
                      : addDaysUtc(current, calendarView === "week" ? 7 : 1),
                  );
                }}
                type="button"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {calendarRows.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              description={MEASUREMENTS_LABELS.emptyStates.calendarDescription}
              title={MEASUREMENTS_LABELS.emptyStates.calendarTitle}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {visibleDays.map((day) => {
              const dateKey = formatDateInput(day);
              const dayRequests = groupedCalendar[dateKey] ?? [];
              const isCurrentMonth = day.getUTCMonth() === anchorDate.getUTCMonth();

              return (
                <article
                  key={dateKey}
                  className={`rounded-2xl border px-3 py-3 ${
                    isCurrentMonth
                      ? "border-stone-200 bg-white"
                      : "border-stone-200 bg-stone-50/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        {DAY_NAME_FORMATTER.format(day)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-stone-950">
                        {DAY_NUMBER_FORMATTER.format(day)}
                      </p>
                    </div>
                    {isSameDayUtc(day, new Date()) ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-800">
                        Hoy
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-2">
                    {dayRequests.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-400">
                        Sin agenda
                      </div>
                    ) : (
                      dayRequests.map((requestRow) => {
                        const statusBadge = getMeasurementStatusBadge(requestRow.status);

                        return (
                          <Link
                            key={requestRow.id}
                            className="block rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 transition hover:border-[color:var(--color-primary)] hover:bg-white"
                            href={MEASUREMENTS_ROUTES.detail(requestRow.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-stone-900">
                                  {requestRow.code}
                                </p>
                                <p className="text-xs text-stone-500">
                                  {requestRow.client.displayName}
                                </p>
                              </div>
                              {requestRow.hasScheduleConflict ? (
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                              ) : (
                                <CalendarDays className="h-4 w-4 text-stone-400" />
                              )}
                            </div>
                            <p className="mt-2 text-xs font-medium text-stone-700">
                              {requestRow.assignedTechnician?.name ?? "Tecnico por asignar"}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                              {requestRow.scheduledStartTime ?? "--:--"} -{" "}
                              {requestRow.scheduledEndTime ?? "--:--"}
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
