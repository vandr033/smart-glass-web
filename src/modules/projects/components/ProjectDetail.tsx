"use client";

import { useState } from "react";

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
import { getApiErrorMessage } from "@/utils";
import { projectService } from "@/services/project-service";
import type { ProjectNoteVisibility } from "@/types";

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
  const [transitionToStatus, setTransitionToStatus] = useState("");
  const [transitionReason, setTransitionReason] = useState("");
  const [noteForm, setNoteForm] = useState(emptyNoteForm);
  const [measurementForm, setMeasurementForm] = useState(EMPTY_MEASUREMENT_FORM_VALUES);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<"PHOTO" | "PLAN" | "MEASUREMENT" | "CONTRACT" | "QUOTATION" | "OTHER">("OTHER");
  const [attachmentDescription, setAttachmentDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const canUpdate = permissions.includes(PROJECTS_PERMISSIONS.update);
  const canDelete = permissions.includes(PROJECTS_PERMISSIONS.delete);

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
    mutationFn: async () =>
      projectService.transitionProject(projectId, {
        reason: trimToNull(transitionReason),
        toStatus: transitionToStatus as never,
      }),
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
        throw new Error("Choose a note to update.");
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
        throw new Error("Choose a measurement to update.");
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
        throw new Error("Choose a file before uploading.");
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
            Retry
          </button>
        }
        description={projectQuery.error.message}
        title="Project details could not be loaded"
      />
    );
  }

  if (projectQuery.isLoading || !projectQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Loading project details...</p>
      </section>
    );
  }

  const project = projectQuery.data;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Project Lifecycle
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
                "No project description yet. Use this record to centralize field notes, measurements, and lifecycle checkpoints before downstream modules are enabled."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className={secondaryButtonClassName} href={PROJECTS_ROUTES.list}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Link>
            {canUpdate ? (
              <Link className={primaryButtonClassName} href={PROJECTS_ROUTES.edit(project.id)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit project
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
                Delete project
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {canUpdate && project.availableTransitions.length > 0 ? (
        <section className={sectionClassName}>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Status Transition
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Move the project forward
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_auto]">
            <select
              className={fieldClassName}
              onChange={(event) => {
                setTransitionToStatus(event.target.value);
              }}
              value={transitionToStatus}
            >
              <option value="">Choose next status</option>
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
              placeholder="Reason, required for on hold or cancelled"
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
              Update status
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Expected Delivery
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {formatDateOnlyValue(project.expectedDeliveryDate)}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Measurements
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {project.summary.measurementCount}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Notes
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {project.summary.noteCount}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Attachments
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {project.summary.attachmentCount}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Last Status Change
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {formatDateValue(project.summary.lastStatusChangeAt)}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Site Information
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Address and field context
            </h2>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Site address
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.siteAddress || "Not set"}
                </dd>
              </div>
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  City
                </dt>
                <dd className="mt-2 font-medium text-stone-900">{project.city || "Not set"}</dd>
              </div>
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Responsible user
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.responsibleUser?.name || "Unassigned"}
                </dd>
              </div>
              <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Sales user
                </dt>
                <dd className="mt-2 font-medium text-stone-900">
                  {project.salesUser?.name || "Unassigned"}
                </dd>
              </div>
            </dl>
          </section>

          <section className={sectionClassName}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Measurements
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Dimension capture
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
                          Measurement · Qty {measurement.quantity}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {measurement.locationDescription || "No location description"}
                        </p>
                      </div>
                      {canUpdate ? (
                        <div className="flex gap-2">
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setEditingMeasurementId(measurement.id);
                              setMeasurementForm({
                                depthMm: measurement.depthMm === null ? "" : String(measurement.depthMm),
                                heightMm:
                                  measurement.heightMm === null ? "" : String(measurement.heightMm),
                                locationDescription: measurement.locationDescription ?? "",
                                measurementDate: measurement.measurementDate?.slice(0, 10) ?? "",
                                notes: measurement.notes ?? "",
                                quantity: measurement.quantity,
                                widthMm: measurement.widthMm === null ? "" : String(measurement.widthMm),
                              });
                            }}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setDeleteTarget({
                                id: measurement.id,
                                kind: "measurement",
                                label: measurement.locationDescription || "measurement",
                              });
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-md bg-stone-50/80 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Width</p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatDimensionMm(measurement.widthMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDimensionMeters(measurement.widthMm)}
                        </p>
                      </div>
                      <div className="rounded-md bg-stone-50/80 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Height</p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatDimensionMm(measurement.heightMm)}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDimensionMeters(measurement.heightMm)}
                        </p>
                      </div>
                      <div className="rounded-md bg-stone-50/80 px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Depth</p>
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
                  description="Add field measurements here so later quotation templates can consume real dimensions without rekeying."
                  title="No measurements yet"
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
                    {editingMeasurementId ? "Edit measurement" : "Add measurement"}
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
                      Cancel edit
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
                    placeholder="Location description"
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
                    placeholder="Width mm"
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
                    placeholder="Height mm"
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
                    placeholder="Depth mm"
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
                  placeholder="Measurement notes"
                  value={measurementForm.notes}
                />

                <button
                  className={primaryButtonClassName}
                  disabled={
                    createMeasurementMutation.isPending || updateMeasurementMutation.isPending
                  }
                  type="submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingMeasurementId ? "Save measurement" : "Add measurement"}
                </button>
              </form>
            ) : null}
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Notes
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Coordination log
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
                          {note.user?.name || "System note"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">
                          {note.visibility.replace("_", " ")} · {formatDateValue(note.createdAt)}
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
                            Edit
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setDeleteTarget({
                                id: note.id,
                                kind: "note",
                                label: note.note.slice(0, 40) || "note",
                              });
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-stone-700">{note.note}</p>
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Add internal or client-visible notes here to preserve context between sales, measurement, and field teams."
                  title="No notes yet"
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
                    {editingNoteId ? "Edit note" : "Add note"}
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
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setNoteForm((current) => ({
                      ...current,
                      visibility: event.target.value as "INTERNAL" | "CLIENT_VISIBLE",
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
                  placeholder="Note"
                  value={noteForm.note}
                />

                <button
                  className={primaryButtonClassName}
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  type="submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingNoteId ? "Save note" : "Add note"}
                </button>
              </form>
            ) : null}
          </section>
        </section>

        <section className="space-y-6">
          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Attachments
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Photos, plans, and contracts
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
                          {attachment.description || "No description"}
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
                          Delete
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <ProjectAttachmentTypeBadge attachmentType={attachment.attachmentType} />
                      <span className="text-sm text-stone-500">
                        {formatDateValue(attachment.createdAt)}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Upload measurement photos, field plans, contracts, or other reference files here."
                  title="No attachments yet"
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
                    await createAttachmentMutation.mutateAsync();
                  } catch (error) {
                    setSectionError(getApiErrorMessage(error));
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
                    placeholder="Description"
                    value={attachmentDescription}
                  />
                </div>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setAttachmentFile(event.target.files?.[0] ?? null);
                  }}
                  type="file"
                />
                <button
                  className={primaryButtonClassName}
                  disabled={createAttachmentMutation.isPending}
                  type="submit"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  Upload attachment
                </button>
              </form>
            ) : null}
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Status History
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Lifecycle timeline
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
                          {entry.fromStatus ? PROJECT_STATUS_LABELS[entry.fromStatus] : "Created"}{" "}
                          → {PROJECT_STATUS_LABELS[entry.toStatus]}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {entry.changedByUser?.name || "System"} · {formatDateValue(entry.createdAt)}
                        </p>
                      </div>
                      <ProjectStatusBadge status={entry.toStatus} />
                    </div>
                    {entry.reason ? (
                      <p className="mt-3 text-sm leading-6 text-stone-700">{entry.reason}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <EmptyState
                  description="Status changes will build a project timeline here as the record moves through its lifecycle."
                  title="No status history yet"
                />
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Future Modules
            </p>
            <div className="mt-4 grid gap-3">
              {[
                {
                  description: "Espacio reservado. Las cotizaciones siguen fuera del alcance de este modulo.",
                  icon: ClipboardList,
                  title: "Cotizaciones",
                },
                {
                  description: "Espacio reservado. Los requerimientos de materiales se vincularan aqui mas adelante.",
                  icon: Ruler,
                  title: "Requerimientos de materiales",
                },
                {
                  description: "Espacio reservado. Los planes de corte siguen deshabilitados por ahora.",
                  icon: Flag,
                  title: "Plan de corte",
                },
                {
                  description: "Espacio reservado. Los flujos de compras aun no estan implementados.",
                  icon: FileStack,
                  title: "Compras",
                },
                {
                  description: "Espacio reservado. La ejecucion de produccion llegara mas adelante.",
                  icon: CalendarClock,
                  title: "Produccion",
                },
                {
                  description: "Espacio reservado. La programacion de instalaciones esta diferida.",
                  icon: FileImage,
                  title: "Instalacion",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-md border border-dashed border-stone-300 bg-stone-50/80 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-[1rem] bg-white p-3 text-[color:var(--color-primary)]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>

      <ConfirmDialog
        confirmLabel={
          deleteTarget?.kind === "project"
            ? "Delete project"
            : deleteTarget?.kind === "note"
              ? "Delete note"
              : deleteTarget?.kind === "measurement"
                ? "Delete measurement"
                : "Delete attachment"
        }
        description={`Delete ${deleteTarget?.label ?? "this item"}? This change will be tracked in the audit trail.`}
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
              await projectService.deleteProjectNote(project.id, deleteTarget.id);
              await invalidateProject();
              return;
            }

            if (deleteTarget.kind === "measurement") {
              await projectService.deleteProjectMeasurement(project.id, deleteTarget.id);
              await invalidateProject();
              return;
            }

            await projectService.deleteProjectAttachment(project.id, deleteTarget.id);
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
        title={`Delete ${deleteTarget?.kind ?? "item"}?`}
      />
    </main>
  );
}
