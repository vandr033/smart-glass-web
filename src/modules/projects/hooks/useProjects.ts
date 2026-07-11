"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { clientService } from "@/services/client-service";
import { projectService } from "@/services/project-service";
import type {
  ProjectDetailRecord,
  ProjectMeasurementInput,
  ProjectMutationInput,
} from "@/types";

import { CLIENTS_QUERY_KEYS } from "@/modules/clients/constants";

import { PROJECTS_QUERY_KEYS } from "../constants";

const optionalTextField = z.string().trim().max(4000).default("");

const optionalNumberField = ({ label }: { label: string }) =>
  z
    .string()
    .trim()
    .refine(
      (value) => {
        if (value.length === 0) {
          return true;
        }

        const parsedValue = Number(value);
        return Number.isFinite(parsedValue);
      },
      {
        message: `${label} debe ser un numero valido.`,
      },
    )
    .default("");

export const projectFormSchema = z.object({
  city: z.string().trim().max(100).default(""),
  clientId: z.string().trim().min(1, "El cliente es obligatorio."),
  description: optionalTextField,
  expectedDeliveryDate: z.string().trim().default(""),
  expectedInstallationDate: z.string().trim().default(""),
  expectedMeasurementDate: z.string().trim().default(""),
  latitude: optionalNumberField({
    label: "La latitud",
  }),
  longitude: optionalNumberField({
    label: "La longitud",
  }),
  notes: optionalTextField,
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  projectType: z.enum([
    "WINDOW",
    "DOOR",
    "SHOWER",
    "FACADE",
    "RAILING",
    "MIRROR",
    "CUSTOM",
    "SERVICE",
  ]),
  responsibleUserId: z.string().trim().default(""),
  salesUserId: z.string().trim().default(""),
  siteAddress: z.string().trim().max(255).default(""),
  status: z
    .enum([
      "LEAD",
      "MEASUREMENT_PENDING",
      "QUOTATION_PENDING",
      "QUOTED",
      "APPROVED",
      "PURCHASE_PENDING",
      "PRODUCTION_PENDING",
      "IN_PRODUCTION",
      "INSTALLATION_PENDING",
      "IN_INSTALLATION",
      "COMPLETED",
      "CANCELLED",
      "ON_HOLD",
    ])
    .default("LEAD"),
  title: z.string().trim().min(1, "El titulo es obligatorio.").max(191),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const measurementFormSchema = z.object({
  depthMm: optionalNumberField({
    label: "La profundidad",
  }),
  heightMm: optionalNumberField({
    label: "La altura",
  }),
  locationDescription: z.string().trim().max(255).default(""),
  measurementDate: z.string().trim().default(""),
  notes: optionalTextField,
  quantity: z.coerce.number().int().min(1).default(1),
  widthMm: optionalNumberField({
    label: "El ancho",
  }),
});

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

const trimToNull = (value: string): string | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const numberOrNull = (value: string): number | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return Number(trimmedValue);
};

export const EMPTY_PROJECT_FORM_VALUES: ProjectFormValues = {
  city: "",
  clientId: "",
  description: "",
  expectedDeliveryDate: "",
  expectedInstallationDate: "",
  expectedMeasurementDate: "",
  latitude: "",
  longitude: "",
  notes: "",
  priority: "NORMAL",
  projectType: "WINDOW",
  responsibleUserId: "",
  salesUserId: "",
  siteAddress: "",
  status: "LEAD",
  title: "",
};

export const EMPTY_MEASUREMENT_FORM_VALUES: MeasurementFormValues = {
  depthMm: "",
  heightMm: "",
  locationDescription: "",
  measurementDate: "",
  notes: "",
  quantity: 1,
  widthMm: "",
};

export const mapRecordToFormValues = (
  project: ProjectDetailRecord,
): ProjectFormValues => {
  return {
    city: project.city ?? "",
    clientId: project.client.id,
    description: project.description ?? "",
    expectedDeliveryDate: project.expectedDeliveryDate?.slice(0, 10) ?? "",
    expectedInstallationDate:
      project.expectedInstallationDate?.slice(0, 10) ?? "",
    expectedMeasurementDate:
      project.expectedMeasurementDate?.slice(0, 10) ?? "",
    latitude: project.latitude === null ? "" : String(project.latitude),
    longitude: project.longitude === null ? "" : String(project.longitude),
    notes: project.notes ?? "",
    priority: project.priority,
    projectType: project.projectType,
    responsibleUserId: project.responsibleUser?.id ?? "",
    salesUserId: project.salesUser?.id ?? "",
    siteAddress: project.siteAddress ?? "",
    status: project.status,
    title: project.title,
  };
};

const toProjectPayload = (values: ProjectFormValues): ProjectMutationInput => {
  return {
    city: trimToNull(values.city),
    clientId: values.clientId,
    description: trimToNull(values.description),
    expectedDeliveryDate: trimToNull(values.expectedDeliveryDate),
    expectedInstallationDate: trimToNull(values.expectedInstallationDate),
    expectedMeasurementDate: trimToNull(values.expectedMeasurementDate),
    latitude: numberOrNull(values.latitude),
    longitude: numberOrNull(values.longitude),
    notes: trimToNull(values.notes),
    priority: values.priority,
    projectType: values.projectType,
    responsibleUserId: trimToNull(values.responsibleUserId),
    salesUserId: trimToNull(values.salesUserId),
    siteAddress: trimToNull(values.siteAddress),
    status: values.status,
    title: values.title.trim(),
  };
};

export const toMeasurementPayload = (
  values: MeasurementFormValues,
): ProjectMeasurementInput => {
  return {
    depthMm: numberOrNull(values.depthMm),
    heightMm: numberOrNull(values.heightMm),
    locationDescription: trimToNull(values.locationDescription),
    measurementDate: trimToNull(values.measurementDate),
    notes: trimToNull(values.notes),
    quantity: values.quantity,
    rawJson: null,
    widthMm: numberOrNull(values.widthMm),
  };
};

export const useProjects = () => {
  const queryClient = useQueryClient();

  const useProject = (projectId: string) =>
    useQuery({
      enabled: Boolean(projectId),
      queryFn: () => projectService.getProjectById(projectId),
      queryKey: PROJECTS_QUERY_KEYS.detail(projectId),
    });

  const useProjectUserOptions = () =>
    useQuery({
      queryFn: projectService.listProjectUserOptions,
      queryKey: PROJECTS_QUERY_KEYS.userOptions,
      staleTime: 60_000,
    });

  const useClientOptions = () =>
    useQuery({
      queryFn: async () => {
        const result = await clientService.listClients({
          page: 1,
          perPage: 100,
          sortBy: "name",
          sortDirection: "asc",
        });

        return result.data;
      },
      queryKey: CLIENTS_QUERY_KEYS.all,
      staleTime: 60_000,
    });

  const useClientDetails = (clientId: string) =>
    useQuery({
      enabled: Boolean(clientId),
      queryFn: () => clientService.getClientById(clientId),
      queryKey: CLIENTS_QUERY_KEYS.detail(clientId),
      staleTime: 60_000,
    });

  const useCreateProject = () =>
    useMutation({
      mutationFn: async (values: ProjectFormValues) => {
        return projectService.createProject(toProjectPayload(values));
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: PROJECTS_QUERY_KEYS.all,
        });
      },
    });

  const useUpdateProject = () =>
    useMutation({
      mutationFn: async (input: {
        projectId: string;
        values: ProjectFormValues;
      }) => {
        return projectService.updateProject(
          input.projectId,
          toProjectPayload(input.values),
        );
      },
      onSuccess: async (_, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: PROJECTS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: PROJECTS_QUERY_KEYS.detail(variables.projectId),
          }),
          queryClient.invalidateQueries({
            queryKey: PROJECTS_QUERY_KEYS.dashboard,
          }),
        ]);
      },
    });

  const useDeleteProject = () =>
    useMutation({
      mutationFn: async (projectId: string) => {
        await projectService.deleteProject(projectId);
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: PROJECTS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: PROJECTS_QUERY_KEYS.dashboard,
          }),
        ]);
      },
    });

  return {
    mapRecordToFormValues,
    useClientDetails,
    useClientOptions,
    useCreateProject,
    useDeleteProject,
    useProject,
    useProjectUserOptions,
    useUpdateProject,
  };
};
