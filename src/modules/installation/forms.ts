import { z } from "zod";

import type {
  ChangeInstallationStatusInput,
  InstallationIssueInput,
  InstallationOrderInput,
  InstallationTaskInput,
  InstallationTeamInput,
  ResolveInstallationIssueInput,
  RescheduleInstallationOrderInput,
  UpdateInstallationOrderInput,
} from "@/types";

const optionalTextField = z.string().trim().max(4000).default("");

const optionalNumberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value.length === 0 || Number.isFinite(Number(value)), {
      message: `${label} debe ser un numero valido.`,
    })
    .default("");

export const installationOrderFormSchema = z.object({
  addressId: z.string().trim().default(""),
  assignedSupervisorId: z.string().trim().default(""),
  assignedTeamId: z.string().trim().default(""),
  clientId: z.string().trim().default(""),
  installationType: z.string().trim().min(1, "El tipo de instalacion es obligatorio."),
  notes: optionalTextField,
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  projectId: z.string().trim().default(""),
  quotationId: z.string().trim().default(""),
  scheduledDate: z.string().trim().min(1, "La fecha programada es obligatoria."),
  scheduledEndTime: z.string().trim().default(""),
  scheduledStartTime: z.string().trim().default(""),
  status: z.enum([
    "SCHEDULED",
    "EN_ROUTE",
    "IN_INSTALLATION",
    "PAUSED",
    "WITH_OBSERVATIONS",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULED",
  ]).default("SCHEDULED"),
  task1Description: optionalTextField,
  task1EstimatedMinutes: optionalNumberField("Los minutos estimados de la tarea 1"),
  task1Title: z.string().trim().default("Preparacion del sitio"),
  task2Description: optionalTextField,
  task2EstimatedMinutes: optionalNumberField("Los minutos estimados de la tarea 2"),
  task2Title: z.string().trim().default("Instalacion principal"),
  task3Description: optionalTextField,
  task3EstimatedMinutes: optionalNumberField("Los minutos estimados de la tarea 3"),
  task3Title: z.string().trim().default("Verificacion y cierre"),
});

export type InstallationOrderFormValues = z.infer<typeof installationOrderFormSchema>;

export const installationTeamFormSchema = z.object({
  member1Role: z.string().trim().default("LIDER"),
  member1UserId: z.string().trim().default(""),
  member2Role: z.string().trim().default("TECNICO"),
  member2UserId: z.string().trim().default(""),
  member3Role: z.string().trim().default("APOYO"),
  member3UserId: z.string().trim().default(""),
  name: z.string().trim().min(1, "El nombre de la cuadrilla es obligatorio."),
  notes: optionalTextField,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  supervisorId: z.string().trim().default(""),
});

export type InstallationTeamFormValues = z.infer<typeof installationTeamFormSchema>;

export const installationIssueFormSchema = z.object({
  description: z.string().trim().min(1, "La descripcion es obligatoria.").max(4000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  type: z.enum(["ACCESS", "CLIENT", "MATERIAL", "SAFETY", "TECHNICAL", "WEATHER", "OTHER"]).default("OTHER"),
});

export type InstallationIssueFormValues = z.infer<typeof installationIssueFormSchema>;

export const installationEvidenceFormSchema = z.object({
  description: optionalTextField,
  taskId: z.string().trim().default(""),
  type: z.enum(["PHOTO", "FILE", "SIGNATURE", "CHECKLIST", "OTHER"]).default("PHOTO"),
});

export type InstallationEvidenceFormValues = z.infer<typeof installationEvidenceFormSchema>;

export const installationStatusFormSchema = z.object({
  notes: optionalTextField,
  status: z.enum([
    "SCHEDULED",
    "EN_ROUTE",
    "IN_INSTALLATION",
    "PAUSED",
    "WITH_OBSERVATIONS",
    "COMPLETED",
    "CANCELLED",
    "RESCHEDULED",
  ]),
});

export type InstallationStatusFormValues = z.infer<typeof installationStatusFormSchema>;

export const installationRescheduleFormSchema = z.object({
  reason: z.string().trim().min(1, "El motivo es obligatorio.").max(4000),
  scheduledDate: z.string().trim().min(1, "La fecha es obligatoria."),
  scheduledEndTime: z.string().trim().default(""),
  scheduledStartTime: z.string().trim().default(""),
});

export type InstallationRescheduleFormValues = z.infer<typeof installationRescheduleFormSchema>;

const trimToNull = (value: string): string | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const numberOrNull = (value: string): number | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? Number(trimmedValue) : null;
};

const buildTasks = (values: InstallationOrderFormValues): InstallationTaskInput[] => {
  return [
    {
      description: trimToNull(values.task1Description),
      estimatedMinutes: numberOrNull(values.task1EstimatedMinutes),
      status: "PENDING",
      title: values.task1Title.trim() || "Preparacion del sitio",
    },
    {
      description: trimToNull(values.task2Description),
      estimatedMinutes: numberOrNull(values.task2EstimatedMinutes),
      status: "PENDING",
      title: values.task2Title.trim() || "Instalacion principal",
    },
    {
      description: trimToNull(values.task3Description),
      estimatedMinutes: numberOrNull(values.task3EstimatedMinutes),
      status: "PENDING",
      title: values.task3Title.trim() || "Verificacion y cierre",
    },
  ];
};

export const EMPTY_INSTALLATION_ORDER_FORM_VALUES: InstallationOrderFormValues = {
  addressId: "",
  assignedSupervisorId: "",
  assignedTeamId: "",
  clientId: "",
  installationType: "ESTANDAR",
  notes: "",
  priority: "NORMAL",
  projectId: "",
  quotationId: "",
  scheduledDate: "",
  scheduledEndTime: "",
  scheduledStartTime: "",
  status: "SCHEDULED",
  task1Description: "",
  task1EstimatedMinutes: "30",
  task1Title: "Preparacion del sitio",
  task2Description: "",
  task2EstimatedMinutes: "180",
  task2Title: "Instalacion principal",
  task3Description: "",
  task3EstimatedMinutes: "45",
  task3Title: "Verificacion y cierre",
};

export const EMPTY_INSTALLATION_TEAM_FORM_VALUES: InstallationTeamFormValues = {
  member1Role: "LIDER",
  member1UserId: "",
  member2Role: "TECNICO",
  member2UserId: "",
  member3Role: "APOYO",
  member3UserId: "",
  name: "",
  notes: "",
  status: "ACTIVE",
  supervisorId: "",
};

export const EMPTY_INSTALLATION_ISSUE_FORM_VALUES: InstallationIssueFormValues = {
  description: "",
  severity: "MEDIUM",
  type: "OTHER",
};

export const EMPTY_INSTALLATION_EVIDENCE_FORM_VALUES: InstallationEvidenceFormValues = {
  description: "",
  taskId: "",
  type: "PHOTO",
};

export const EMPTY_INSTALLATION_RESCHEDULE_FORM_VALUES: InstallationRescheduleFormValues = {
  reason: "",
  scheduledDate: "",
  scheduledEndTime: "",
  scheduledStartTime: "",
};

export const toInstallationOrderPayload = (
  values: InstallationOrderFormValues,
): InstallationOrderInput => {
  return {
    addressId: trimToNull(values.addressId),
    assignedSupervisorId: trimToNull(values.assignedSupervisorId),
    assignedTeamId: trimToNull(values.assignedTeamId),
    clientId: trimToNull(values.clientId),
    installationType: values.installationType.trim(),
    notes: trimToNull(values.notes),
    priority: values.priority,
    projectId: trimToNull(values.projectId),
    quotationId: trimToNull(values.quotationId),
    scheduledDate: values.scheduledDate,
    scheduledEndTime: trimToNull(values.scheduledEndTime),
    scheduledStartTime: trimToNull(values.scheduledStartTime),
    status: values.status,
    tasks: buildTasks(values),
  };
};

export const toInstallationUpdatePayload = (
  values: InstallationOrderFormValues,
): UpdateInstallationOrderInput => {
  return {
    addressId: trimToNull(values.addressId),
    assignedSupervisorId: trimToNull(values.assignedSupervisorId),
    assignedTeamId: trimToNull(values.assignedTeamId),
    installationType: values.installationType.trim(),
    notes: trimToNull(values.notes),
    priority: values.priority,
    scheduledDate: values.scheduledDate,
    scheduledEndTime: trimToNull(values.scheduledEndTime),
    scheduledStartTime: trimToNull(values.scheduledStartTime),
  };
};

export const toInstallationTeamPayload = (
  values: InstallationTeamFormValues,
): InstallationTeamInput => {
  const members = [
    {
      active: true,
      role: values.member1Role.trim(),
      userId: values.member1UserId.trim(),
    },
    {
      active: true,
      role: values.member2Role.trim(),
      userId: values.member2UserId.trim(),
    },
    {
      active: true,
      role: values.member3Role.trim(),
      userId: values.member3UserId.trim(),
    },
  ].filter((member) => member.userId.length > 0);

  return {
    members,
    name: values.name.trim(),
    notes: trimToNull(values.notes),
    status: values.status,
    supervisorId: trimToNull(values.supervisorId),
  };
};

export const toInstallationIssuePayload = (
  values: InstallationIssueFormValues,
): InstallationIssueInput => ({
  description: values.description.trim(),
  severity: values.severity,
  type: values.type,
});

export const toInstallationStatusPayload = (
  values: InstallationStatusFormValues,
): ChangeInstallationStatusInput => ({
  notes: trimToNull(values.notes),
  status: values.status,
});

export const toInstallationReschedulePayload = (
  values: InstallationRescheduleFormValues,
): RescheduleInstallationOrderInput => ({
  reason: values.reason.trim(),
  scheduledDate: values.scheduledDate,
  scheduledEndTime: trimToNull(values.scheduledEndTime),
  scheduledStartTime: trimToNull(values.scheduledStartTime),
});

export const toInstallationResolveIssuePayload = (
  values: {
    notes: string;
    status: "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  },
): ResolveInstallationIssueInput => ({
  notes: trimToNull(values.notes),
  status: values.status,
});
