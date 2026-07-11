"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileUp,
  MapPinned,
  RefreshCcw,
  Route,
  Wrench,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExportMenu } from "@/components/ui/export-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { POSTVENTA_ROUTES } from "@/modules/postventa/constants";
import { installationService } from "@/services/installation-service";
import { userService } from "@/services/user-service";
import { getApiErrorMessage } from "@/utils";

import {
  EMPTY_INSTALLATION_EVIDENCE_FORM_VALUES,
  EMPTY_INSTALLATION_ISSUE_FORM_VALUES,
  EMPTY_INSTALLATION_RESCHEDULE_FORM_VALUES,
  installationEvidenceFormSchema,
  installationIssueFormSchema,
  installationRescheduleFormSchema,
  toInstallationIssuePayload,
  toInstallationReschedulePayload,
  type InstallationEvidenceFormValues,
  type InstallationIssueFormValues,
  type InstallationRescheduleFormValues,
} from "../forms";
import {
  exportInstallationCompletionReportPdf,
  exportInstallationInternalReportPdf,
  exportInstallationOrderPdf,
} from "../exports";
import {
  INSTALLATION_EVIDENCE_TYPE_LABELS,
  INSTALLATION_EVIDENCE_TYPE_OPTIONS,
  INSTALLATION_ISSUE_SEVERITY_OPTIONS,
  INSTALLATION_ISSUE_TYPE_LABELS,
  INSTALLATION_ISSUE_TYPE_OPTIONS,
  INSTALLATION_LABELS,
  INSTALLATION_PERMISSIONS,
  INSTALLATION_QUERY_KEYS,
  INSTALLATION_ROUTES,
  INSTALLATION_STATUS_LABELS,
} from "../constants";
import {
  buildMapLink,
  formatInstallationDateTime,
  formatInstallationScheduleWindow,
  getInstallationIssueSeverityBadge,
  getInstallationIssueStatusBadge,
  getInstallationPriorityBadge,
  getInstallationStatusBadge,
  getInstallationTaskStatusBadge,
} from "../ui";

type InstallationDetailPageProps = {
  orderId: string;
};

export default function InstallationDetailPage({
  orderId,
}: InstallationDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canAssign = permissions.includes(INSTALLATION_PERMISSIONS.assign);
  const canCancel = permissions.includes(INSTALLATION_PERMISSIONS.cancel);
  const canComplete = permissions.includes(INSTALLATION_PERMISSIONS.complete);
  const canExecute = permissions.includes(INSTALLATION_PERMISSIONS.execute);
  const canExport = permissions.includes(INSTALLATION_PERMISSIONS.export);
  const canCreatePostventa = permissions.includes("postventa.crear");
  const canSchedule = permissions.includes(INSTALLATION_PERMISSIONS.schedule);
  const canUpdate = permissions.includes(INSTALLATION_PERMISSIONS.update);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<keyof typeof INSTALLATION_STATUS_LABELS | "">("");
  const [statusNotes, setStatusNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const issueForm = useForm<InstallationIssueFormValues>({
    defaultValues: EMPTY_INSTALLATION_ISSUE_FORM_VALUES,
    resolver: zodResolver(installationIssueFormSchema) as Resolver<InstallationIssueFormValues>,
  });
  const evidenceForm = useForm<InstallationEvidenceFormValues>({
    defaultValues: EMPTY_INSTALLATION_EVIDENCE_FORM_VALUES,
    resolver: zodResolver(installationEvidenceFormSchema) as Resolver<InstallationEvidenceFormValues>,
  });
  const rescheduleForm = useForm<InstallationRescheduleFormValues>({
    defaultValues: EMPTY_INSTALLATION_RESCHEDULE_FORM_VALUES,
    resolver: zodResolver(installationRescheduleFormSchema) as Resolver<InstallationRescheduleFormValues>,
  });

  const orderQuery = useQuery({
    queryFn: () => installationService.getOrderById(orderId),
    queryKey: INSTALLATION_QUERY_KEYS.order(orderId),
    staleTime: 30_000,
  });
  const teamsQuery = useQuery({
    enabled: canAssign,
    queryFn: installationService.listTeams,
    queryKey: INSTALLATION_QUERY_KEYS.teams,
    staleTime: 60_000,
  });
  const usersQuery = useQuery({
    enabled: canAssign,
    queryFn: userService.getUserOptions,
    queryKey: ["installations", "detail", orderId, "users"],
    staleTime: 60_000,
  });

  const refreshOrder = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["installations"],
      }),
      queryClient.invalidateQueries({
        queryKey: INSTALLATION_QUERY_KEYS.order(orderId),
      }),
    ]);
  };

  const assignMutation = useMutation({
    mutationFn: () =>
      installationService.assignOrder(orderId, {
        assignedSupervisorId: selectedSupervisorId || null,
        assignedTeamId: selectedTeamId || null,
      }),
    onSuccess: refreshOrder,
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      installationService.changeOrderStatus(orderId, {
        notes: statusNotes.trim() || null,
        status: (selectedStatus || "SCHEDULED") as keyof typeof INSTALLATION_STATUS_LABELS,
      }),
    onSuccess: async () => {
      setStatusNotes("");
      setSelectedStatus("");
      await refreshOrder();
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => installationService.completeTask(taskId),
    onSuccess: refreshOrder,
  });

  const evidenceMutation = useMutation({
    mutationFn: async (values: InstallationEvidenceFormValues) => {
      if (!evidenceFile) {
        throw new Error("Debes seleccionar un archivo.");
      }

      return installationService.uploadEvidence(orderId, {
        description: values.description.trim() || null,
        file: evidenceFile,
        taskId: values.taskId.trim() || null,
        type: values.type,
      });
    },
    onSuccess: async () => {
      setEvidenceFile(null);
      evidenceForm.reset(EMPTY_INSTALLATION_EVIDENCE_FORM_VALUES);
      await refreshOrder();
    },
  });

  const issueMutation = useMutation({
    mutationFn: (values: InstallationIssueFormValues) =>
      installationService.createIssue(orderId, toInstallationIssuePayload(values)),
    onSuccess: async () => {
      issueForm.reset(EMPTY_INSTALLATION_ISSUE_FORM_VALUES);
      await refreshOrder();
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (values: InstallationRescheduleFormValues) =>
      installationService.rescheduleOrder(orderId, toInstallationReschedulePayload(values)),
    onSuccess: async () => {
      rescheduleForm.reset(EMPTY_INSTALLATION_RESCHEDULE_FORM_VALUES);
      await refreshOrder();
    },
  });

  const resolveIssueMutation = useMutation({
    mutationFn: (issueId: string) =>
      installationService.resolveIssue(issueId, {
        notes: "Resuelto desde el panel de instalacion.",
        status: "RESOLVED",
      }),
    onSuccess: refreshOrder,
  });

  useEffect(() => {
    if (!orderQuery.data) {
      return;
    }

    const syncFrame = window.requestAnimationFrame(() => {
      setSelectedTeamId(orderQuery.data.assignedTeam?.id ?? "");
      setSelectedSupervisorId(orderQuery.data.assignedSupervisor?.id ?? "");
      setSelectedStatus(orderQuery.data.status);
      rescheduleForm.reset({
        reason: "",
        scheduledDate: orderQuery.data.scheduledDate.slice(0, 10),
        scheduledEndTime: orderQuery.data.scheduledEndTime ?? "",
        scheduledStartTime: orderQuery.data.scheduledStartTime ?? "",
      });
    });

    return () => {
      window.cancelAnimationFrame(syncFrame);
    };
  }, [orderQuery.data, rescheduleForm]);

  if (orderQuery.isPending || (canAssign && (teamsQuery.isPending || usersQuery.isPending))) {
    return <LoadingState title="Cargando orden de instalacion" />;
  }

  if (orderQuery.isError || teamsQuery.isError || usersQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                orderQuery.refetch(),
                teamsQuery.refetch(),
                usersQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          orderQuery.error?.message ??
          teamsQuery.error?.message ??
          usersQuery.error?.message ??
          "No se pudo cargar la orden."
        }
        title="No se pudo abrir la orden de instalacion"
      />
    );
  }

  const order = orderQuery.data;
  const mapLink = buildMapLink({
    address: order.address.address,
    latitude: order.address.latitude,
    longitude: order.address.longitude,
  });
  const statusBadge = getInstallationStatusBadge(order.status);
  const priorityBadge = getInstallationPriorityBadge(order.priority);
  const activeError =
    assignMutation.error ??
    statusMutation.error ??
    completeTaskMutation.error ??
    evidenceMutation.error ??
    issueMutation.error ??
    rescheduleMutation.error ??
    resolveIssueMutation.error;
  const canChangeSelectedStatus =
    selectedStatus === "COMPLETED"
      ? canComplete
      : selectedStatus === "CANCELLED"
        ? canCancel
        : selectedStatus === "SCHEDULED" || selectedStatus === "RESCHEDULED"
          ? canSchedule
          : canExecute;
  const statusActionLabel =
    selectedStatus === "EN_ROUTE"
      ? "Marcar en ruta"
      : selectedStatus === "IN_INSTALLATION"
        ? "Marcar en instalacion"
        : selectedStatus === "COMPLETED"
          ? INSTALLATION_LABELS.buttons.complete
          : selectedStatus === "CANCELLED"
            ? "Cancelar instalacion"
            : selectedStatus === "RESCHEDULED"
              ? "Marcar reprogramada"
              : selectedStatus === "SCHEDULED"
                ? "Marcar programada"
                : selectedStatus === "WITH_OBSERVATIONS"
                  ? "Marcar con observaciones"
                  : selectedStatus === "PAUSED"
                    ? "Pausar instalacion"
                    : "Actualizar estado";

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-3">
            <Link className={secondaryButtonClassName} href={INSTALLATION_ROUTES.home}>
              Volver a instalaciones
            </Link>
            {canCreatePostventa ? (
              <Link
                className={secondaryButtonClassName}
                href={POSTVENTA_ROUTES.registrarDesde({
                  installationId: order.id,
                  origen: "instalacion",
                  projectId: order.project?.id ?? undefined,
                  quotationId: order.quotation?.id ?? undefined,
                })}
              >
                Registrar postventa
              </Link>
            ) : null}
            {canExport ? (
              <ExportMenu
                buttonClassName={secondaryButtonClassName}
                actions={[
                  {
                    id: "orden",
                    label: "Orden PDF",
                    onClick: () => {
                      exportInstallationOrderPdf(order);
                    },
                  },
                  {
                    id: "acta",
                    label: "Acta de cierre PDF",
                    onClick: () => {
                      exportInstallationCompletionReportPdf(order);
                    },
                  },
                  {
                    id: "interno",
                    label: "Reporte interno PDF",
                    onClick: () => {
                      exportInstallationInternalReportPdf(order);
                    },
                  },
                ]}
              />
            ) : null}
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void refreshOrder();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </button>
          </div>
        }
        description="Ejecuta la orden en campo, completa tareas, registra evidencias, resuelve observaciones y cierra la instalacion con trazabilidad."
        eyebrow="Orden de instalacion"
        title={order.code}
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.className}`}>
            {priorityBadge.label}
          </span>
          <span className="text-sm text-stone-700">
            {order.assignedTeam?.name ?? "Sin cuadrilla"} | {order.assignedSupervisor?.name ?? "Sin supervisor"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Cliente
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">{order.client.displayName}</p>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Proyecto
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {order.project?.title ?? "Sin proyecto"}
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Ventana
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {formatInstallationScheduleWindow(
                order.scheduledDate,
                order.scheduledStartTime,
                order.scheduledEndTime,
              )}
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Direccion
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-950">
              {order.address.address ?? "Sin direccion"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-6">
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Lista de verificacion
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Tareas de instalacion
                  </h2>
                </div>
                <Clock3 className="h-5 w-5 text-[color:var(--color-primary)]" />
              </div>

              <div className="mt-4 grid gap-3">
                {order.tasks.map((task) => {
                  const taskBadge = getInstallationTaskStatusBadge(task.status);

                  return (
                    <div key={task.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-stone-950">{task.title}</p>
                          <p className="mt-1 text-sm text-stone-600">
                            {task.description || "Sin descripcion"}
                          </p>
                          <p className="mt-2 text-xs text-stone-500">
                            Estimado: {task.estimatedMinutes ?? 0} min | Completada: {formatInstallationDateTime(task.completedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${taskBadge.className}`}>
                            {taskBadge.label}
                          </span>
                          {(canExecute || canComplete) && task.status !== "COMPLETED" ? (
                            <button
                              className={primaryButtonClassName}
                              disabled={completeTaskMutation.isPending}
                              onClick={() => {
                                void completeTaskMutation.mutateAsync(task.id);
                              }}
                              type="button"
                            >
                              Completar
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Evidencia
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Galeria y archivos
                  </h2>
                </div>
                <FileUp className="h-5 w-5 text-[color:var(--color-primary)]" />
              </div>

              <form
                className="mt-4 grid gap-3 md:grid-cols-[0.7fr_0.7fr_1fr_auto]"
                onSubmit={evidenceForm.handleSubmit(async (values) => {
                  try {
                    await evidenceMutation.mutateAsync(values);
                  } catch (error) {
                    evidenceForm.setError("root", {
                      message: getApiErrorMessage(error),
                    });
                  }
                })}
              >
                <select className={fieldClassName} {...evidenceForm.register("type")}>
                  {INSTALLATION_EVIDENCE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select className={fieldClassName} {...evidenceForm.register("taskId")}>
                  <option value="">Sin tarea vinculada</option>
                  {order.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setEvidenceFile(event.target.files?.[0] ?? null);
                  }}
                  type="file"
                />
                {canExecute ? (
                  <button className={primaryButtonClassName} disabled={evidenceMutation.isPending} type="submit">
                    Subir
                  </button>
                ) : null}
                <textarea
                  className="md:col-span-4 min-h-24 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-3 text-sm text-[color:var(--color-text)]"
                  placeholder="Descripcion"
                  {...evidenceForm.register("description")}
                />
              </form>

              {evidenceForm.formState.errors.root?.message ? (
                <p className="mt-3 text-sm text-rose-700">{evidenceForm.formState.errors.root.message}</p>
              ) : null}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {order.evidence.length === 0 ? (
                  <EmptyState
                    description="Carga fotos, firmas o archivos para respaldar la ejecucion."
                    title="Sin evidencias"
                  />
                ) : (
                  order.evidence.map((evidence) => (
                    <div key={evidence.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                      <p className="font-semibold text-stone-950">{evidence.fileName}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {INSTALLATION_EVIDENCE_TYPE_LABELS[evidence.type]} | {formatInstallationDateTime(evidence.uploadedAt)}
                      </p>
                      <p className="mt-2 text-sm text-stone-700">
                        {evidence.description || "Sin descripcion"}
                      </p>
                      {evidence.mimeType?.startsWith("image/") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={evidence.fileName}
                          className="mt-3 h-44 w-full rounded-md border border-stone-200 object-cover"
                          src={evidence.fileUrl}
                        />
                      ) : (
                        <a
                          className={`${secondaryButtonClassName} mt-3`}
                          href={evidence.fileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Abrir archivo
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Observaciones
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Incidencias y hallazgos
                  </h2>
                </div>
                <AlertTriangle className="h-5 w-5 text-[color:var(--color-primary)]" />
              </div>

              <form
                className="mt-4 grid gap-3 md:grid-cols-[0.8fr_0.8fr_1fr_auto]"
                onSubmit={issueForm.handleSubmit(async (values) => {
                  try {
                    await issueMutation.mutateAsync(values);
                  } catch (error) {
                    issueForm.setError("root", {
                      message: getApiErrorMessage(error),
                    });
                  }
                })}
              >
                <select className={fieldClassName} {...issueForm.register("type")}>
                  {INSTALLATION_ISSUE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select className={fieldClassName} {...issueForm.register("severity")}>
                  {INSTALLATION_ISSUE_SEVERITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <textarea
                  className="min-h-24 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-3 text-sm text-[color:var(--color-text)]"
                  placeholder="Describe la observacion o incidencia"
                  {...issueForm.register("description")}
                />
                {canExecute ? (
                  <button className={primaryButtonClassName} disabled={issueMutation.isPending} type="submit">
                    Registrar
                  </button>
                ) : null}
              </form>

              {issueForm.formState.errors.root?.message ? (
                <p className="mt-3 text-sm text-rose-700">{issueForm.formState.errors.root.message}</p>
              ) : null}

              <div className="mt-4 grid gap-3">
                {order.issues.length === 0 ? (
                  <EmptyState
                    description={INSTALLATION_LABELS.emptyStates.issuesDescription}
                    title={INSTALLATION_LABELS.emptyStates.issuesTitle}
                  />
                ) : (
                  order.issues.map((issue) => {
                    const severityBadge = getInstallationIssueSeverityBadge(issue.severity);
                    const issueStatusBadge = getInstallationIssueStatusBadge(issue.status);

                    return (
                      <div key={issue.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-stone-950">
                              {INSTALLATION_ISSUE_TYPE_LABELS[issue.type]}
                            </p>
                            <p className="mt-1 text-sm text-stone-700">{issue.description}</p>
                            <p className="mt-2 text-xs text-stone-500">
                              Reportada: {formatInstallationDateTime(issue.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${severityBadge.className}`}>
                              {severityBadge.label}
                            </span>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${issueStatusBadge.className}`}>
                              {issueStatusBadge.label}
                            </span>
                            {canUpdate && issue.status !== "RESOLVED" && issue.status !== "CLOSED" ? (
                              <button
                                className={secondaryButtonClassName}
                                disabled={resolveIssueMutation.isPending}
                                onClick={() => {
                                  void resolveIssueMutation.mutateAsync(issue.id);
                                }}
                                type="button"
                              >
                                Marcar resuelta
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Route className="h-5 w-5 text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Ruta y estado
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Acciones de campo
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSelectedTeamId(event.target.value);
                  }}
                  value={selectedTeamId}
                >
                  <option value="">Sin cuadrilla</option>
                  {(teamsQuery.data ?? []).filter(Boolean).map((team) => (
                    <option key={team!.id} value={team!.id}>
                      {team!.name}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSelectedSupervisorId(event.target.value);
                  }}
                  value={selectedSupervisorId}
                >
                  <option value="">Sin supervisor</option>
                  {usersQuery.data?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {canAssign ? (
                  <button
                    className={primaryButtonClassName}
                    disabled={assignMutation.isPending}
                    onClick={() => {
                      void assignMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    {INSTALLATION_LABELS.buttons.assign}
                  </button>
                ) : null}

                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSelectedStatus((event.target.value as typeof selectedStatus) ?? "");
                  }}
                  value={selectedStatus}
                >
                  {Object.entries(INSTALLATION_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setStatusNotes(event.target.value);
                  }}
                  placeholder="Notas del cambio de estado"
                  value={statusNotes}
                />
                {canChangeSelectedStatus ? (
                  <button
                    className={primaryButtonClassName}
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      void statusMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    {statusActionLabel}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Ubicacion
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Direccion y mapa
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm text-stone-700">{order.address.address ?? "Sin direccion"}</p>
              <p className="mt-2 text-xs text-stone-500">{order.address.city ?? "Sin ciudad"}</p>
              {mapLink ? (
                <a
                  className={`${secondaryButtonClassName} mt-4`}
                  href={mapLink}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir en mapa
                </a>
              ) : null}
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Reprogramacion
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Mover agenda
                  </h2>
                </div>
              </div>

              <form
                className="mt-4 grid gap-3"
                onSubmit={rescheduleForm.handleSubmit(async (values) => {
                  try {
                    await rescheduleMutation.mutateAsync(values);
                  } catch (error) {
                    rescheduleForm.setError("root", {
                      message: getApiErrorMessage(error),
                    });
                  }
                })}
              >
                <input className={fieldClassName} type="date" {...rescheduleForm.register("scheduledDate")} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={fieldClassName} type="time" {...rescheduleForm.register("scheduledStartTime")} />
                  <input className={fieldClassName} type="time" {...rescheduleForm.register("scheduledEndTime")} />
                </div>
                <textarea
                  className={textAreaClassName}
                  placeholder="Motivo de la reprogramacion"
                  {...rescheduleForm.register("reason")}
                />
                {rescheduleForm.formState.errors.root?.message ? (
                  <p className="text-sm text-rose-700">{rescheduleForm.formState.errors.root.message}</p>
                ) : null}
                {canSchedule ? (
                  <button className={primaryButtonClassName} disabled={rescheduleMutation.isPending} type="submit">
                    {INSTALLATION_LABELS.buttons.reschedule}
                  </button>
                ) : null}
              </form>
            </div>

            <div className="rounded-md border border-stone-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[color:var(--color-primary)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Preparacion
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-stone-950">
                    Produccion e inventario
                  </h2>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">
                    Produccion relacionada
                  </p>
                  <p className="mt-1 text-sm text-stone-700">
                    {order.readiness.productionReady
                      ? "Completada"
                      : `Pendiente (${order.readiness.productionPendingCount})`}
                  </p>
                </div>
                <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <p className="text-sm font-semibold text-stone-950">
                    Material reservado
                  </p>
                  <p className="mt-1 text-sm text-stone-700">
                    {order.readiness.reservationsReady
                      ? "Listo"
                      : `Pendiente (${order.readiness.activeReservationCount - order.readiness.readyReservationCount})`}
                  </p>
                </div>
                {order.readiness.warnings.map((warning) => (
                  <div key={warning} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {activeError ? (
          <p className="mt-5 text-sm text-rose-700">{getApiErrorMessage(activeError)}</p>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Linea de tiempo
            </p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">
              Historial de estados
            </h2>
            <div className="mt-4 grid gap-3">
              {order.statusHistory.map((entry) => (
                <div key={entry.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
                  <p className="font-semibold text-stone-950">
                    {INSTALLATION_STATUS_LABELS[entry.toStatus]} | {formatInstallationDateTime(entry.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-stone-700">{entry.notes || "Sin notas"}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Notas
            </p>
            <h2 className="mt-2 text-lg font-semibold text-stone-950">
              Comentarios internos
            </h2>
            <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
              {order.notes || "Sin notas internas registradas."}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
