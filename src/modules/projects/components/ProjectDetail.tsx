"use client";

import { useRef, useState } from "react";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileImage,
  FileStack,
  Flag,
  Paperclip,
  Pencil,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import {
  dangerButtonClassName,
  fieldClassName,
  formatDateOnlyValue,
  formatDateValue,
  formatDimensionMeters,
  formatDimensionMm,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { POSTVENTA_ROUTES } from "@/modules/postventa/constants";
import { getApiErrorMessage } from "@/utils";
import { projectService } from "@/services/project-service";
import type { ProjectNoteVisibility, ProjectStatus } from "@/types";

import {
  EMPTY_MEASUREMENT_FORM_VALUES,
  toMeasurementPayload,
  useProjects,
} from "../hooks/useProjects";
import {
  PROJECTS_PERMISSIONS,
  PROJECTS_QUERY_KEYS,
  PROJECTS_ROUTES,
  PROJECT_ATTACHMENT_TYPE_OPTIONS,
  PROJECT_NOTE_VISIBILITY_OPTIONS,
  PROJECT_STATUS_LABELS,
} from "../constants";
import {
  ProjectAttachmentTypeBadge,
  ProjectPriorityBadge,
  ProjectStatusBadge,
} from "../badges";

type ProjectDetailProps = {
  projectId: string;
};

type DeleteTarget =
  | {
      id: string;
      kind: "attachment";
      label: string;
    }
  | {
      id: string;
      kind: "measurement";
      label: string;
    }
  | {
      id: string;
      kind: "note";
      label: string;
    }
  | {
      id: string;
      kind: "project";
      label: string;
    };

const emptyNoteForm: {
  note: string;
  visibility: ProjectNoteVisibility;
} = {
  note: "",
  visibility: "INTERNAL",
};

const trimToNull = (value: string): string | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const { useDeleteProject, useProject } = useProjects();
  const projectQuery = useProject(projectId);
  const deleteProjectMutation = useDeleteProject();
  const [transitionToStatus, setTransitionToStatus] = useState<
    ProjectStatus | ""
  >("");
  const [transitionReason, setTransitionReason] = useState("");
  const [noteForm, setNoteForm] = useState(emptyNoteForm);
  const [measurementForm, setMeasurementForm] = useState(
    EMPTY_MEASUREMENT_FORM_VALUES,
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingMeasurementId, setEditingMeasurementId] = useState<
    string | null
  >(null);
  const [attachmentType, setAttachmentType] = useState<
    "PHOTO" | "PLAN" | "MEASUREMENT" | "CONTRACT" | "QUOTATION" | "OTHER"
  >("OTHER");
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const canUpdate = permissions.includes(PROJECTS_PERMISSIONS.update);
  const canDelete = permissions.includes(PROJECTS_PERMISSIONS.delete);
  const canCreatePostventa = permissions.includes("postventa.crear");

  const invalidateProject = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: PROJECTS_QUERY_KEYS.all,
      }),
      queryClient.invalidateQueries({
        queryKey: PROJECTS_QUERY_KEYS.detail(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: PROJECTS_QUERY_KEYS.dashboard,
      }),
    ]);
  };

  const transitionMutation = useMutation({
    mutationFn: async () => {
      if (!transitionToStatus) {
        throw new Error(
          "Selecciona el estado al que deseas mover el proyecto.",
        );
      }

      return projectService.transitionProject(projectId, {
        metadata: null,
        reason: trimToNull(transitionReason),
        toStatus: transitionToStatus,
      });
    },
    onSuccess: async () => {
      setTransitionReason("");
      setTransitionToStatus("");
      await invalidateProject();
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async () =>
      projectService.createProjectNote(projectId, {
        note: noteForm.note.trim(),
        visibility: noteForm.visibility,
      }),
    onSuccess: async () => {
      setNoteForm(emptyNoteForm);
      await invalidateProject();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async () => {
      if (!editingNoteId) {
        throw new Error("Selecciona una nota para actualizar.");
      }

      return projectService.updateProjectNote(projectId, editingNoteId, {
        note: noteForm.note.trim(),
        visibility: noteForm.visibility,
      });
    },
    onSuccess: async () => {
      setEditingNoteId(null);
      setNoteForm(emptyNoteForm);
      await invalidateProject();
    },
  });

  const createMeasurementMutation = useMutation({
    mutationFn: async () =>
      projectService.createProjectMeasurement(
        projectId,
        toMeasurementPayload(measurementForm),
      ),
    onSuccess: async () => {
      setMeasurementForm(EMPTY_MEASUREMENT_FORM_VALUES);
      await invalidateProject();
    },
  });

  const updateMeasurementMutation = useMutation({
    mutationFn: async () => {
      if (!editingMeasurementId) {
        throw new Error("Selecciona una medición para actualizar.");
      }

      return projectService.updateProjectMeasurement(
        projectId,
        editingMeasurementId,
        toMeasurementPayload(measurementForm),
      );
    },
    onSuccess: async () => {
      setEditingMeasurementId(null);
      setMeasurementForm(EMPTY_MEASUREMENT_FORM_VALUES);
      await invalidateProject();
    },
  });

  const createAttachmentMutation = useMutation({
    mutationFn: async () => {
      if (!attachmentFile) {
        throw new Error("Selecciona un archivo antes de cargarlo.");
      }

      return projectService.createProjectAttachment(
        projectId,
        {
          attachmentType,
          description: trimToNull(attachmentDescription),
        },
        attachmentFile,
      );
    },
    onSuccess: async () => {
      setAttachmentDescription("");
      setAttachmentFile(null);
      setAttachmentType("OTHER");
      setAttachmentError(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
      await invalidateProject();
    },
  });

  if (projectQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void projectQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={projectQuery.error.message}
        title="No se pudo cargar el detalle del proyecto"
      />
    );
  }

  if (projectQuery.isLoading || !projectQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">
          Cargando detalle del proyecto...
        </p>
      </section>
    );
  }

  const project = projectQuery.data;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Ciclo del proyecto
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              {project.code} · {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={project.status} />
              <ProjectPriorityBadge priority={project.priority} />
              <span className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-stone-700">
                {project.client.displayName}
              </span>
            </div>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              {project.description ||
                "Aun no hay descripcion del proyecto. Usa este registro para centralizar notas de campo, mediciones y decisiones del ciclo operativo."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className={secondaryButtonClassName}
              href={PROJECTS_ROUTES.list}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a proyectos
            </Link>
            {canCreatePostventa ? (
              <Link
                className={secondaryButtonClassName}
                href={POSTVENTA_ROUTES.registrarDesde({
                  clientId: project.client.id,
                  origen: "proyecto",
                  projectId: project.id,
                })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Registrar postventa
              </Link>
            ) : null}
            {canUpdate ? (
              <Link
                className={primaryButtonClassName}
                href={PROJECTS_ROUTES.edit(project.id)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar proyecto
              </Link>
            ) : null}
            {canDelete ? (
              <button
                className={dangerButtonClassName}
                onClick={() => {
                  setDeleteTarget({
                    id: project.id,
                    kind: "project",
                    label: `${project.code} · ${project.title}`,
                  });
                }}
                type="button"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar proyecto
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {canUpdate && project.availableTransitions.length > 0 ? (
        <section className={sectionClassName}>
          <div className="mb-5">
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Cambio de estado
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Avanza el proyecto
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto]">
            <select
              className={fieldClassName}
              onChange={(event) => {
                setTransitionToStatus(event.target.value as ProjectStatus | "");
              }}
              value={transitionToStatus}
            >
              <option value="">Elegir el siguiente estado</option>
              {project.availableTransitions.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>

            <input
              className={fieldClassName}
              onChange={(event) => {
                setTransitionReason(event.target.value);
              }}
              placeholder="Motivo, obligatorio para poner en espera o cancelar"
              value={transitionReason}
            />

            <button
              className={primaryButtonClassName}
              disabled={!transitionToStatus || transitionMutation.isPending}
              onClick={() => {
                setSectionError(null);
                void transitionMutation.mutateAsync().catch((error) => {
                  setSectionError(getApiErrorMessage(error));
                });
              }}
              type="button"
            >
              Actualizar estado
            </button>
          </div>

          {sectionError ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {sectionError}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className={sectionClassName}>
          <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
            Entrega estimada
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {formatDateOnlyValue(project.expectedDeliveryDate)}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
            Mediciones
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {project.summary.measurementCount}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
            Notas
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {project.summary.noteCount}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
            Archivos adjuntos
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {project.summary.attachmentCount}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
            Último cambio de estado
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {formatDateValue(project.summary.lastStatusChangeAt)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <section className={sectionClassName}>
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Información del sitio
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Dirección y contexto de campo
            </h2>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Dirección de obra
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.siteAddress || "Sin configurar"}
                </dd>
              </div>
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Ciudad
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.city || "Sin configurar"}
                </dd>
              </div>
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Responsable operativo
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.responsibleUser?.name || "Sin asignar"}
                </dd>
              </div>
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Responsable comercial
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.salesUser?.name || "Sin asignar"}
                </dd>
              </div>
            </dl>
          </section>

          <section className={sectionClassName}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
                  Mediciones
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Registro de dimensiones
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              {project.measurements.length > 0 ? (
                project.measurements.map((measurement) => (
                  <article
                    key={measurement.id}
                    className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          Medición · Cantidad {measurement.quantity}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {measurement.locationDescription ||
                            "Sin descripción de ubicación"}
                        </p>
                      </div>
                      {canUpdate ? (
                        <div className="flex gap-2">
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setEditingMeasurementId(measurement.id);
                              setMeasurementForm({
                                depthMm:
                                  measurement.depthMm === null
                                    ? ""
                                    : String(measurement.depthMm),
                                heightMm:
                                  measurement.heightMm === null
                                    ? ""
                                    : String(measurement.heightMm),
                                locationDescription:
                                  measurement.locationDescription ?? "",
                                measurementDate:
                                  measurement.measurementDate?.slice(0, 10) ??
                                  "",
                                notes: measurement.notes ?? "",
                                quantity: measurement.quantity,
                                widthMm:
                                  measurement.widthMm === null
                                    ? ""
                                    : String(measurement.widthMm),
                              });
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setDeleteTarget({
                                id: measurement.id,
                                kind: "measurement",
                                label:
                                  measurement.locationDescription || "medición",
                              });
                            }}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-md bg-stone-50/80 px-3 py-3">
                        <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">
                          Ancho
                        </p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatDimensionMm(measurement.widthMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDimensionMeters(measurement.widthMm)}
                        </p>
                      </div>
                      <div className="rounded-md bg-stone-50/80 px-3 py-3">
                        <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">
                          Alto
                        </p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatDimensionMm(measurement.heightMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDimensionMeters(measurement.heightMm)}
                        </p>
                      </div>
                      <div className="rounded-md bg-stone-50/80 px-3 py-3">
                        <p className="text-xs tracking-[0.18em] text-stone-500 uppercase">
                          Profundidad
                        </p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatDimensionMm(measurement.depthMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDimensionMeters(measurement.depthMm)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Agrega aquí las mediciones de campo para que las plantillas de cotización utilicen dimensiones reales sin volver a capturarlas."
                  title="Aún no hay mediciones"
                />
              )}
            </div>

            {canUpdate ? (
              <form
                className="mt-6 space-y-4 rounded-md border border-dashed border-stone-300 bg-white/75 px-4 py-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSectionError(null);

                  try {
                    if (editingMeasurementId) {
                      await updateMeasurementMutation.mutateAsync();
                    } else {
                      await createMeasurementMutation.mutateAsync();
                    }
                  } catch (error) {
                    setSectionError(getApiErrorMessage(error));
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">
                    {editingMeasurementId
                      ? "Editar medición"
                      : "Agregar medición"}
                  </p>
                  {editingMeasurementId ? (
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => {
                        setEditingMeasurementId(null);
                        setMeasurementForm(EMPTY_MEASUREMENT_FORM_VALUES);
                        setSectionError(null);
                      }}
                      type="button"
                    >
                      Cancelar edición
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setMeasurementForm((current) => ({
                        ...current,
                        locationDescription: event.target.value,
                      }));
                    }}
                    placeholder="Descripción de ubicación"
                    value={measurementForm.locationDescription}
                  />
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setMeasurementForm((current) => ({
                        ...current,
                        measurementDate: event.target.value,
                      }));
                    }}
                    type="date"
                    value={measurementForm.measurementDate}
                  />
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setMeasurementForm((current) => ({
                        ...current,
                        widthMm: event.target.value,
                      }));
                    }}
                    placeholder="Ancho en mm"
                    value={measurementForm.widthMm}
                  />
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setMeasurementForm((current) => ({
                        ...current,
                        heightMm: event.target.value,
                      }));
                    }}
                    placeholder="Alto en mm"
                    value={measurementForm.heightMm}
                  />
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setMeasurementForm((current) => ({
                        ...current,
                        depthMm: event.target.value,
                      }));
                    }}
                    placeholder="Profundidad en mm"
                    value={measurementForm.depthMm}
                  />
                  <input
                    className={fieldClassName}
                    min={1}
                    onChange={(event) => {
                      setMeasurementForm((current) => ({
                        ...current,
                        quantity: Number(event.target.value),
                      }));
                    }}
                    type="number"
                    value={measurementForm.quantity}
                  />
                </div>

                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setMeasurementForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }));
                  }}
                  placeholder="Notas de medición"
                  value={measurementForm.notes}
                />

                <button
                  className={primaryButtonClassName}
                  disabled={
                    createMeasurementMutation.isPending ||
                    updateMeasurementMutation.isPending
                  }
                  type="submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingMeasurementId
                    ? "Guardar medición"
                    : "Agregar medición"}
                </button>
              </form>
            ) : null}
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Notas
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Registro de coordinación
            </h2>

            <div className="mt-5 space-y-4">
              {project.projectNotes.length > 0 ? (
                project.projectNotes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {note.user?.name || "Nota del sistema"}
                        </p>
                        <p className="mt-1 text-xs tracking-[0.18em] text-stone-500 uppercase">
                          {note.visibility.replace("_", " ")} ·{" "}
                          {formatDateValue(note.createdAt)}
                        </p>
                      </div>
                      {canUpdate ? (
                        <div className="flex gap-2">
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setNoteForm({
                                note: note.note,
                                visibility: note.visibility,
                              });
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setDeleteTarget({
                                id: note.id,
                                kind: "note",
                                label: note.note.slice(0, 40) || "nota",
                              });
                            }}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-700">
                      {note.note}
                    </p>
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Agrega aquí notas internas o visibles para el cliente para conservar el contexto entre ventas, medición y equipos de campo."
                  title="Aún no hay notas"
                />
              )}
            </div>

            {canUpdate ? (
              <form
                className="mt-6 space-y-4 rounded-md border border-dashed border-stone-300 bg-white/75 px-4 py-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setSectionError(null);

                  try {
                    if (editingNoteId) {
                      await updateNoteMutation.mutateAsync();
                    } else {
                      await createNoteMutation.mutateAsync();
                    }
                  } catch (error) {
                    setSectionError(getApiErrorMessage(error));
                  }
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">
                    {editingNoteId ? "Editar nota" : "Agregar nota"}
                  </p>
                  {editingNoteId ? (
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => {
                        setEditingNoteId(null);
                        setNoteForm(emptyNoteForm);
                        setSectionError(null);
                      }}
                      type="button"
                    >
                      Cancelar edición
                    </button>
                  ) : null}
                </div>

                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setNoteForm((current) => ({
                      ...current,
                      visibility: event.target.value as
                        | "INTERNAL"
                        | "CLIENT_VISIBLE",
                    }));
                  }}
                  value={noteForm.visibility}
                >
                  {PROJECT_NOTE_VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setNoteForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }));
                  }}
                  placeholder="Nota"
                  value={noteForm.note}
                />

                <button
                  className={primaryButtonClassName}
                  disabled={
                    createNoteMutation.isPending || updateNoteMutation.isPending
                  }
                  type="submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingNoteId ? "Guardar nota" : "Agregar nota"}
                </button>
              </form>
            ) : null}
          </section>
        </section>

        <section className="space-y-6">
          <section className={sectionClassName}>
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Archivos adjuntos
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Fotos, planos y contratos
            </h2>

            <div className="mt-5 space-y-4">
              {project.attachments.length > 0 ? (
                project.attachments.map((attachment) => (
                  <article
                    key={attachment.id}
                    className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <a
                          className="font-semibold text-stone-950 underline decoration-stone-300 underline-offset-4"
                          href={attachment.fileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {attachment.fileName}
                        </a>
                        <p className="mt-1 text-sm text-stone-600">
                          {attachment.description || "Sin descripción"}
                        </p>
                      </div>
                      {canUpdate ? (
                        <button
                          className={secondaryButtonClassName}
                          onClick={() => {
                            setDeleteTarget({
                              id: attachment.id,
                              kind: "attachment",
                              label: attachment.fileName,
                            });
                          }}
                          type="button"
                        >
                          Eliminar
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <ProjectAttachmentTypeBadge
                        attachmentType={attachment.attachmentType}
                      />
                      <span className="text-sm text-stone-500">
                        {formatDateValue(attachment.createdAt)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Carga aquí fotografías de medición, planos de campo, contratos u otros archivos de referencia."
                  title="Aún no hay archivos adjuntos"
                />
              )}
            </div>

            {canUpdate ? (
              <form
                className="mt-6 space-y-4 rounded-md border border-dashed border-stone-300 bg-white/75 px-4 py-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setAttachmentError(null);

                  try {
                    await createAttachmentMutation.mutateAsync();
                  } catch (error) {
                    setAttachmentError(getApiErrorMessage(error));
                  }
                }}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setAttachmentType(
                        event.target.value as typeof attachmentType,
                      );
                    }}
                    value={attachmentType}
                  >
                    {PROJECT_ATTACHMENT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setAttachmentDescription(event.target.value);
                    }}
                    placeholder="Descripción"
                    value={attachmentDescription}
                  />
                </div>
                <input
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  className={fieldClassName}
                  ref={attachmentInputRef}
                  onChange={(event) => {
                    setAttachmentError(null);
                    setAttachmentFile(event.target.files?.[0] ?? null);
                  }}
                  type="file"
                />
                {attachmentFile ? (
                  <p className="text-sm text-stone-600">
                    Archivo seleccionado: <span className="font-medium text-stone-900">{attachmentFile.name}</span>
                  </p>
                ) : null}
                {attachmentError ? (
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {attachmentError}
                  </div>
                ) : null}
                <button
                  className={primaryButtonClassName}
                  disabled={!attachmentFile || createAttachmentMutation.isPending}
                  type="submit"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  {createAttachmentMutation.isPending ? "Cargando…" : "Cargar archivo adjunto"}
                </button>
              </form>
            ) : null}
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Historial de estados
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Línea de tiempo del ciclo de vida
            </h2>

            <div className="mt-5 space-y-4">
              {project.statusHistory.length > 0 ? (
                project.statusHistory.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {entry.fromStatus
                            ? PROJECT_STATUS_LABELS[entry.fromStatus]
                            : "Creado"}{" "}
                          → {PROJECT_STATUS_LABELS[entry.toStatus]}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {entry.changedByUser?.name || "Sistema"} ·{" "}
                          {formatDateValue(entry.createdAt)}
                        </p>
                      </div>
                      <ProjectStatusBadge status={entry.toStatus} />
                    </div>
                    {entry.reason ? (
                      <p className="mt-3 text-sm leading-6 text-stone-700">
                        {entry.reason}
                      </p>
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Los cambios de estado construirán aquí la línea de tiempo del proyecto."
                  title="Aún no hay historial de estados"
                />
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold tracking-[0.24em] text-[color:var(--color-primary)] uppercase">
              Accesos del proyecto
            </p>
            <div className="mt-4 grid gap-3">
              {[
                {
                  description: "Consulta y administra las cotizaciones comerciales.",
                  href: "/admin/quotations",
                  icon: ClipboardList,
                  permission: "quotations.read",
                  title: "Cotizaciones",
                },
                {
                  description: "Crea y revisa solicitudes de materiales para compras.",
                  href: "/purchasing/requests",
                  icon: Ruler,
                  permission: "purchasing.read",
                  title: "Requerimientos de materiales",
                },
                {
                  description: "Revisa optimizaciones y planes de corte disponibles.",
                  href: "/cutting/plans",
                  icon: Flag,
                  permission: "cutting.read",
                  title: "Plan de corte",
                },
                {
                  description: "Gestiona solicitudes, comparativos, órdenes y recepciones.",
                  href: "/purchasing",
                  icon: FileStack,
                  permission: "purchasing.read",
                  title: "Compras",
                },
                {
                  description: "Consulta la planificación y ejecución de producción.",
                  href: "/production",
                  icon: CalendarClock,
                  permission: "production.read",
                  title: "Produccion",
                },
                {
                  description: "Programa y da seguimiento a las instalaciones en campo.",
                  href: "/admin/installation",
                  icon: FileImage,
                  permission: "installations.view",
                  title: "Instalacion",
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  className="rounded-md border border-stone-200 bg-white/80 px-4 py-4 transition hover:border-[color:var(--color-primary)] hover:bg-blue-50/40"
                  href={item.href}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-[1rem] bg-white p-3 text-[color:var(--color-primary)]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-950">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </section>

      <ConfirmDialog
        confirmLabel={
          deleteTarget?.kind === "project"
            ? "Eliminar proyecto"
            : deleteTarget?.kind === "note"
              ? "Eliminar nota"
              : deleteTarget?.kind === "measurement"
                ? "Eliminar medición"
                : "Eliminar archivo adjunto"
        }
        description={`¿Eliminar ${deleteTarget?.label ?? "este elemento"}? Este cambio quedará registrado en la auditoría.`}
        isLoading={deleteProjectMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          const runDelete = async () => {
            if (deleteTarget.kind === "project") {
              await deleteProjectMutation.mutateAsync(project.id);
              router.push(PROJECTS_ROUTES.list);
              router.refresh();
              return;
            }

            if (deleteTarget.kind === "note") {
              await projectService.deleteProjectNote(
                project.id,
                deleteTarget.id,
              );
              await invalidateProject();
              return;
            }

            if (deleteTarget.kind === "measurement") {
              await projectService.deleteProjectMeasurement(
                project.id,
                deleteTarget.id,
              );
              await invalidateProject();
              return;
            }

            await projectService.deleteProjectAttachment(
              project.id,
              deleteTarget.id,
            );
            await invalidateProject();
          };

          void runDelete().then(() => {
            setDeleteTarget(null);
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title={`¿Eliminar ${deleteTarget?.kind ?? "elemento"}?`}
      />
    </main>
  );
}
