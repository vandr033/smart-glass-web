"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { supplierService } from "@/services/supplier-service";
import type {
  SupplierDetailRecord,
  SupplierMutationInput,
} from "@/types";

import { SUPPLIERS_QUERY_KEYS } from "../constants";

const optionalTextField = z.string().trim().max(4000).default("");

const optionalEmailField = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
    message: "Ingresa un correo valido.",
  })
  .default("");

const optionalUrlField = z
  .string()
  .trim()
  .refine((value) => {
    if (value.length === 0) {
      return true;
    }

    try {
      const parsedUrl = new URL(value);
      return ["http:", "https:"].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }, {
    message: "Ingresa una URL valida.",
  })
  .default("");

const optionalNumberStringField = ({
  integer = false,
  label,
  max,
  min,
}: {
  integer?: boolean;
  label: string;
  max?: number;
  min?: number;
}) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) {
        return true;
      }

      const parsedValue = Number(value);

      if (!Number.isFinite(parsedValue)) {
        return false;
      }

      if (integer && !Number.isInteger(parsedValue)) {
        return false;
      }

      if (min !== undefined && parsedValue < min) {
        return false;
      }

      if (max !== undefined && parsedValue > max) {
        return false;
      }

      return true;
    }, {
      message:
        max !== undefined || min !== undefined
          ? `${label} debe estar entre ${min ?? "-inf"} y ${max ?? "+inf"}.`
          : `${label} debe ser un numero valido.`,
    })
    .default("");

export const supplierContactFormSchema = z.object({
  email: optionalEmailField,
  id: z.string().optional(),
  isPrimary: z.boolean().default(false),
  name: z.string().trim().min(1, "El nombre del contacto es obligatorio.").max(191),
  notes: optionalTextField,
  phone: z.string().trim().max(50).default(""),
  position: z.string().trim().max(191).default(""),
  whatsapp: z.string().trim().max(50).default(""),
});

export const supplierFormSchema = z
  .object({
    address: z.string().trim().max(255).default(""),
    categoryIds: z.array(z.string()).default([]),
    city: z.string().trim().max(100).default(""),
    code: z.string().trim().max(100).default(""),
    commercialName: z.string().trim().max(191).default(""),
    contactEmail: optionalEmailField,
    contactName: z.string().trim().max(191).default(""),
    contactPhone: z.string().trim().max(50).default(""),
    contactPosition: z.string().trim().max(191).default(""),
    contacts: z
      .array(supplierContactFormSchema)
      .default([])
      .refine(
        (contacts) => contacts.filter((contact) => contact.isPrimary).length <= 1,
        {
          message: "Solo un contacto adicional puede marcarse como principal.",
        },
      ),
    country: z.string().trim().min(1, "El pais es obligatorio.").max(100).default("Bolivia"),
    creditAvailable: z.boolean().default(false),
    creditLimit: optionalNumberStringField({
      label: "El limite de credito",
      min: 0,
    }),
    defaultLeadTimeDays: optionalNumberStringField({
      integer: true,
      label: "El tiempo de entrega",
      min: 0,
    }),
    email: optionalEmailField,
    legalName: z.string().trim().min(1, "La razon social es obligatoria.").max(191),
    latitude: optionalNumberStringField({
      label: "La latitud",
    }),
    longitude: optionalNumberStringField({
      label: "La longitud",
    }),
    notes: optionalTextField,
    paymentTerms: z.string().trim().max(255).default(""),
    phone: z.string().trim().max(50).default(""),
    preferenceScore: optionalNumberStringField({
      label: "La preferencia",
      max: 100,
      min: 0,
    }),
    reliabilityScore: optionalNumberStringField({
      label: "La confiabilidad",
      max: 100,
      min: 0,
    }),
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
    taxId: z.string().trim().max(100).default(""),
    website: optionalUrlField,
    whatsapp: z.string().trim().max(50).default(""),
  })
  .superRefine((value, context) => {
    if (value.contacts.length > 0 && value.contacts.every((contact) => !contact.isPrimary)) {
      context.addIssue({
        code: "custom",
        message: "Selecciona un contacto principal o elimina los contactos adicionales.",
        path: ["contacts"],
      });
    }
  });

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

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

const mapRecordToFormValues = (
  supplier: SupplierDetailRecord,
): SupplierFormValues => {
  return {
    address: supplier.address ?? "",
    categoryIds: supplier.categories.map((category) => category.id),
    city: supplier.city ?? "",
    code: supplier.code ?? "",
    commercialName: supplier.commercialName ?? "",
    contactEmail: supplier.contactEmail ?? "",
    contactName: supplier.contactName ?? "",
    contactPhone: supplier.contactPhone ?? "",
    contactPosition: supplier.contactPosition ?? "",
    contacts: supplier.contacts.map((contact) => ({
      email: contact.email ?? "",
      id: contact.id,
      isPrimary: contact.isPrimary,
      name: contact.name,
      notes: contact.notes ?? "",
      phone: contact.phone ?? "",
      position: contact.position ?? "",
      whatsapp: contact.whatsapp ?? "",
    })),
    country: supplier.country,
    creditAvailable: supplier.creditAvailable,
    creditLimit: supplier.creditLimit === null ? "" : String(supplier.creditLimit),
    defaultLeadTimeDays:
      supplier.defaultLeadTimeDays === null ? "" : String(supplier.defaultLeadTimeDays),
    email: supplier.email ?? "",
    legalName: supplier.legalName,
    latitude: supplier.latitude === null ? "" : String(supplier.latitude),
    longitude: supplier.longitude === null ? "" : String(supplier.longitude),
    notes: supplier.notes ?? "",
    paymentTerms: supplier.paymentTerms ?? "",
    phone: supplier.phone ?? "",
    preferenceScore:
      supplier.preferenceScore === null ? "" : String(supplier.preferenceScore),
    reliabilityScore:
      supplier.reliabilityScore === null ? "" : String(supplier.reliabilityScore),
    status: supplier.status,
    taxId: supplier.taxId ?? "",
    website: supplier.website ?? "",
    whatsapp: supplier.whatsapp ?? "",
  };
};

const toSupplierPayload = (values: SupplierFormValues): SupplierMutationInput => {
  return {
    address: trimToNull(values.address),
    categoryIds: values.categoryIds,
    city: trimToNull(values.city),
    code: trimToNull(values.code),
    commercialName: trimToNull(values.commercialName),
    contactEmail: trimToNull(values.contactEmail),
    contactName: trimToNull(values.contactName),
    contactPhone: trimToNull(values.contactPhone),
    contactPosition: trimToNull(values.contactPosition),
    contacts: values.contacts.map((contact) => ({
      email: trimToNull(contact.email),
      ...(contact.id ? { id: contact.id } : {}),
      isPrimary: contact.isPrimary,
      name: contact.name.trim(),
      notes: trimToNull(contact.notes),
      phone: trimToNull(contact.phone),
      position: trimToNull(contact.position),
      whatsapp: trimToNull(contact.whatsapp),
    })),
    country: values.country.trim(),
    creditAvailable: values.creditAvailable,
    creditLimit: numberOrNull(values.creditLimit),
    defaultLeadTimeDays: numberOrNull(values.defaultLeadTimeDays),
    email: trimToNull(values.email),
    legalName: values.legalName.trim(),
    latitude: numberOrNull(values.latitude),
    longitude: numberOrNull(values.longitude),
    notes: trimToNull(values.notes),
    paymentTerms: trimToNull(values.paymentTerms),
    phone: trimToNull(values.phone),
    preferenceScore: numberOrNull(values.preferenceScore),
    reliabilityScore: numberOrNull(values.reliabilityScore),
    status: values.status,
    taxId: trimToNull(values.taxId),
    website: trimToNull(values.website),
    whatsapp: trimToNull(values.whatsapp),
  };
};

export const EMPTY_SUPPLIER_FORM_VALUES: SupplierFormValues = {
  address: "",
  categoryIds: [],
  city: "",
  code: "",
  commercialName: "",
  contactEmail: "",
  contactName: "",
  contactPhone: "",
  contactPosition: "",
  contacts: [],
  country: "Bolivia",
  creditAvailable: false,
  creditLimit: "",
  defaultLeadTimeDays: "",
  email: "",
  legalName: "",
  latitude: "",
  longitude: "",
  notes: "",
  paymentTerms: "",
  phone: "",
  preferenceScore: "",
  reliabilityScore: "",
  status: "ACTIVE",
  taxId: "",
  website: "",
  whatsapp: "",
};

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  const useSupplier = (supplierId: string) =>
    useQuery({
      enabled: Boolean(supplierId),
      queryFn: () => supplierService.getSupplierById(supplierId),
      queryKey: SUPPLIERS_QUERY_KEYS.detail(supplierId),
    });

  const useSupplierCategories = () =>
    useQuery({
      queryFn: () => supplierService.listSupplierCategories(),
      queryKey: SUPPLIERS_QUERY_KEYS.categories,
      staleTime: 60_000,
    });

  const useCreateSupplier = () =>
    useMutation({
      mutationFn: async (values: SupplierFormValues) => {
        return supplierService.createSupplier(toSupplierPayload(values));
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: SUPPLIERS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: SUPPLIERS_QUERY_KEYS.categories,
          }),
        ]);
      },
    });

  const useUpdateSupplier = () =>
    useMutation({
      mutationFn: async ({
        supplierId,
        values,
      }: {
        supplierId: string;
        values: SupplierFormValues;
      }) => {
        return supplierService.updateSupplier(supplierId, toSupplierPayload(values));
      },
      onSuccess: async (_record, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: SUPPLIERS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: SUPPLIERS_QUERY_KEYS.detail(variables.supplierId),
          }),
          queryClient.invalidateQueries({
            queryKey: SUPPLIERS_QUERY_KEYS.categories,
          }),
        ]);
      },
    });

  const useDeleteSupplier = () =>
    useMutation({
      mutationFn: async (supplierId: string) => {
        await supplierService.deleteSupplier(supplierId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: SUPPLIERS_QUERY_KEYS.all,
        });
      },
    });

  return {
    mapRecordToFormValues,
    useCreateSupplier,
    useDeleteSupplier,
    useSupplier,
    useSupplierCategories,
    useUpdateSupplier,
  };
};
