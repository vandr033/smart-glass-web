import { z } from "zod";

import type { QuotationDetailRecord, QuotationMutationInput } from "@/types";

const optionalTextField = z.string().trim().max(4000).default("");

const optionalNumberField = ({ label }: { label: string }) =>
  z
    .string()
    .trim()
    .refine((value) => {
      if (value.length === 0) {
        return true;
      }

      return Number.isFinite(Number(value));
    }, {
      message: `${label} must be a valid number.`,
    })
    .default("");

export const quotationFormSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required."),
  currency: z.string().trim().min(1, "Currency is required.").max(16).default("BOB"),
  discountAmount: optionalNumberField({
    label: "Discount amount",
  }),
  exchangeRate: optionalNumberField({
    label: "Exchange rate",
  }),
  internalNotes: optionalTextField,
  notes: optionalTextField,
  projectId: z.string().trim().default(""),
  taxAmount: optionalNumberField({
    label: "Tax amount",
  }),
  validUntil: z.string().trim().default(""),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

const trimToNull = (value: string): string | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const numberOrZero = (value: string): number => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? Number(trimmedValue) : 0;
};

const numberOrNull = (value: string): number | null => {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? Number(trimmedValue) : null;
};

export const EMPTY_QUOTATION_FORM_VALUES: QuotationFormValues = {
  clientId: "",
  currency: "BOB",
  discountAmount: "",
  exchangeRate: "",
  internalNotes: "",
  notes: "",
  projectId: "",
  taxAmount: "",
  validUntil: "",
};

export const mapQuotationRecordToFormValues = (
  quotation: QuotationDetailRecord,
): QuotationFormValues => {
  return {
    clientId: quotation.client.id,
    currency: quotation.currency,
    discountAmount: String(quotation.discountAmount ?? 0),
    exchangeRate:
      quotation.exchangeRate === null ? "" : String(quotation.exchangeRate),
    internalNotes: quotation.internalNotes ?? "",
    notes: quotation.notes ?? "",
    projectId: quotation.project?.id ?? "",
    taxAmount: String(quotation.taxAmount ?? 0),
    validUntil: quotation.validUntil?.slice(0, 10) ?? "",
  };
};

export const toQuotationPayload = (
  values: QuotationFormValues,
): QuotationMutationInput => {
  return {
    clientId: values.clientId,
    currency: values.currency.trim(),
    discountAmount: numberOrZero(values.discountAmount),
    exchangeRate: numberOrNull(values.exchangeRate),
    internalNotes: trimToNull(values.internalNotes),
    notes: trimToNull(values.notes),
    projectId: trimToNull(values.projectId),
    taxAmount: numberOrZero(values.taxAmount),
    validUntil: trimToNull(values.validUntil),
  };
};
