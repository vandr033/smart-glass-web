"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { clientService } from "@/services/client-service";
import type { ClientDetailRecord, ClientMutationInput } from "@/types";

import { CLIENTS_QUERY_KEYS } from "../constants";

const optionalTextField = z.string().trim().max(4000).default("");
const optionalShortField = z.string().trim().max(191).default("");

const optionalEmailField = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
    message: "Ingresa un correo valido.",
  })
  .default("");

export const clientFormSchema = z
  .object({
    billingAddress: z.string().trim().max(255).default(""),
    city: z.string().trim().max(100).default(""),
    clientType: z.enum(["INDIVIDUAL", "COMPANY"]).default("INDIVIDUAL"),
    code: z.string().trim().max(100).default(""),
    commercialName: optionalShortField,
    country: z.string().trim().min(1, "El pais es obligatorio.").max(100).default("Bolivia"),
    email: optionalEmailField,
    firstName: optionalShortField,
    lastName: optionalShortField,
    legalName: optionalShortField,
    notes: optionalTextField,
    phone: z.string().trim().max(50).default(""),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
    taxId: z.string().trim().max(100).default(""),
    whatsapp: z.string().trim().max(50).default(""),
  })
  .superRefine((value, context) => {
    if (value.clientType === "INDIVIDUAL") {
      if (!value.firstName && !value.lastName) {
        context.addIssue({
          code: "custom",
          message: "Debes ingresar el nombre o el apellido para clientes persona.",
          path: ["firstName"],
        });
      }

      return;
    }

    if (!value.legalName && !value.commercialName) {
      context.addIssue({
        code: "custom",
        message: "Debes ingresar la razon social o el nombre comercial para empresas.",
        path: ["legalName"],
      });
    }
  });

export type ClientFormValues = z.infer<typeof clientFormSchema>;

const trimToNull = (value: string): string | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const EMPTY_CLIENT_FORM_VALUES: ClientFormValues = {
  billingAddress: "",
  city: "",
  clientType: "INDIVIDUAL",
  code: "",
  commercialName: "",
  country: "Bolivia",
  email: "",
  firstName: "",
  lastName: "",
  legalName: "",
  notes: "",
  phone: "",
  status: "ACTIVE",
  taxId: "",
  whatsapp: "",
};

const mapRecordToFormValues = (client: ClientDetailRecord): ClientFormValues => {
  return {
    billingAddress: client.billingAddress ?? "",
    city: client.city ?? "",
    clientType: client.clientType,
    code: client.code ?? "",
    commercialName: client.commercialName ?? "",
    country: client.country,
    email: client.email ?? "",
    firstName: client.firstName ?? "",
    lastName: client.lastName ?? "",
    legalName: client.legalName ?? "",
    notes: client.notes ?? "",
    phone: client.phone ?? "",
    status: client.status,
    taxId: client.taxId ?? "",
    whatsapp: client.whatsapp ?? "",
  };
};

const toClientPayload = (values: ClientFormValues): ClientMutationInput => {
  return {
    billingAddress: trimToNull(values.billingAddress),
    city: trimToNull(values.city),
    clientType: values.clientType,
    code: trimToNull(values.code),
    commercialName: trimToNull(values.commercialName),
    country: values.country.trim(),
    email: trimToNull(values.email),
    firstName: trimToNull(values.firstName),
    lastName: trimToNull(values.lastName),
    legalName: trimToNull(values.legalName),
    notes: trimToNull(values.notes),
    phone: trimToNull(values.phone),
    status: values.status,
    taxId: trimToNull(values.taxId),
    whatsapp: trimToNull(values.whatsapp),
  };
};

export const useClients = () => {
  const queryClient = useQueryClient();

  const useClient = (clientId: string) =>
    useQuery({
      enabled: Boolean(clientId),
      queryFn: () => clientService.getClientById(clientId),
      queryKey: CLIENTS_QUERY_KEYS.detail(clientId),
    });

  const useCreateClient = () =>
    useMutation({
      mutationFn: async (values: ClientFormValues) => {
        return clientService.createClient(toClientPayload(values));
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: CLIENTS_QUERY_KEYS.all,
        });
      },
    });

  const useUpdateClient = () =>
    useMutation({
      mutationFn: async (input: {
        clientId: string;
        values: ClientFormValues;
      }) => {
        return clientService.updateClient(
          input.clientId,
          toClientPayload(input.values),
        );
      },
      onSuccess: async (_, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: CLIENTS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: CLIENTS_QUERY_KEYS.detail(variables.clientId),
          }),
        ]);
      },
    });

  const useDeleteClient = () =>
    useMutation({
      mutationFn: async (clientId: string) => {
        await clientService.deleteClient(clientId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: CLIENTS_QUERY_KEYS.all,
        });
      },
    });

  return {
    mapRecordToFormValues,
    useClient,
    useCreateClient,
    useDeleteClient,
    useUpdateClient,
  };
};
