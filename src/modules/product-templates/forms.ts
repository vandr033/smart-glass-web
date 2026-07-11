import { z } from "zod";

import type {
  ProductTemplateDetailRecord,
  ProductTemplateVersionDetailRecord,
} from "@/types";

import {
  PRODUCT_TEMPLATE_INPUT_TYPES,
  PRODUCT_TEMPLATE_LABOR_TYPES,
  PRODUCT_TEMPLATE_MATERIAL_RULE_TYPES,
  PRODUCT_TEMPLATE_STATUSES,
  PRODUCT_TEMPLATE_TYPES,
  PRODUCT_TEMPLATE_VERSION_STATUSES,
} from "./constants";

const nullableStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  });

const nullableNumberSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (trimmedValue.length === 0) {
        return null;
      }

      return Number(trimmedValue);
    }

    return value;
  })
  .refine((value) => value === null || Number.isFinite(value), {
    message: "El valor debe ser un número válido.",
  });

const jsonTextSchema = z.string().default("null");

export const productTemplateCreateFormSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio."),
  description: nullableStringSchema,
  initialVersionDefaultMarginPercent: nullableNumberSchema,
  initialVersionDefaultWastePercent: nullableNumberSchema,
  initialVersionDescription: nullableStringSchema,
  initialVersionName: z.string().trim().min(1, "El nombre de la versión inicial es obligatorio."),
  initialVersionNotes: nullableStringSchema,
  name: z.string().trim().min(1, "El nombre de la plantilla es obligatorio."),
  productType: z.enum(PRODUCT_TEMPLATE_TYPES),
  status: z.enum(PRODUCT_TEMPLATE_STATUSES),
});

export const productTemplateEditFormSchema = z.object({
  code: z.string().trim().min(1, "El código es obligatorio."),
  description: nullableStringSchema,
  name: z.string().trim().min(1, "El nombre de la plantilla es obligatorio."),
  productType: z.enum(PRODUCT_TEMPLATE_TYPES),
  status: z.enum(PRODUCT_TEMPLATE_STATUSES),
});

export const productTemplateVersionFormSchema = z.object({
  defaultMarginPercent: nullableNumberSchema,
  defaultWastePercent: nullableNumberSchema,
  description: nullableStringSchema,
  duplicateFromVersionId: nullableStringSchema,
  name: z.string().trim().min(1, "El nombre de la versión es obligatorio."),
  notes: nullableStringSchema,
  status: z.enum(PRODUCT_TEMPLATE_VERSION_STATUSES),
});

const rulesInputItemSchema = z.object({
  defaultValueJsonText: jsonTextSchema,
  inputType: z.enum(PRODUCT_TEMPLATE_INPUT_TYPES),
  isRequired: z.boolean(),
  key: z.string().trim().min(1, "La clave de entrada es obligatoria."),
  label: z.string().trim().min(1, "La etiqueta de entrada es obligatoria."),
  optionsJsonText: jsonTextSchema,
  sortOrder: z.coerce.number().int().min(0),
  unit: nullableStringSchema,
  validationJsonText: jsonTextSchema,
});

const materialRuleItemSchema = z.object({
  allowRemnantUse: z.boolean(),
  allowRotation: z.boolean(),
  formulaJsonText: jsonTextSchema,
  isActive: z.boolean(),
  label: z.string().trim().min(1, "La etiqueta de la regla es obligatoria."),
  materialId: z.string().trim().min(1, "El material es obligatorio."),
  ruleType: z.enum(PRODUCT_TEMPLATE_MATERIAL_RULE_TYPES),
  sortOrder: z.coerce.number().int().min(0),
  wastePercent: nullableNumberSchema,
});

const accessoryRuleItemSchema = z.object({
  isActive: z.boolean(),
  isOptional: z.boolean(),
  label: z.string().trim().min(1, "La etiqueta del accesorio es obligatoria."),
  materialId: z.string().trim().min(1, "El material es obligatorio."),
  quantityFormulaJsonText: jsonTextSchema,
  sortOrder: z.coerce.number().int().min(0),
});

const laborRuleItemSchema = z.object({
  formulaJsonText: jsonTextSchema,
  isActive: z.boolean(),
  label: z.string().trim().min(1, "La etiqueta de mano de obra es obligatoria."),
  laborType: z.enum(PRODUCT_TEMPLATE_LABOR_TYPES),
  sortOrder: z.coerce.number().int().min(0),
  unitCost: nullableNumberSchema,
});

export const productTemplateRulesEditorSchema = z.object({
  accessoryRules: z.array(accessoryRuleItemSchema).default([]),
  inputs: z.array(rulesInputItemSchema).default([]),
  laborRules: z.array(laborRuleItemSchema).default([]),
  materialRules: z.array(materialRuleItemSchema).default([]),
});

export type ProductTemplateCreateFormValues = z.infer<
  typeof productTemplateCreateFormSchema
>;

export type ProductTemplateEditFormValues = z.infer<
  typeof productTemplateEditFormSchema
>;

export type ProductTemplateVersionFormValues = z.infer<
  typeof productTemplateVersionFormSchema
>;

export type ProductTemplateRulesEditorValues = z.infer<
  typeof productTemplateRulesEditorSchema
>;

export const EMPTY_PRODUCT_TEMPLATE_CREATE_FORM_VALUES: ProductTemplateCreateFormValues = {
  code: "",
  description: null,
  initialVersionDefaultMarginPercent: 18,
  initialVersionDefaultWastePercent: 10,
  initialVersionDescription: null,
  initialVersionName: "Version 1",
  initialVersionNotes: null,
  name: "",
  productType: "WINDOW",
  status: "DRAFT",
};

export const mapTemplateToEditFormValues = (
  template: ProductTemplateDetailRecord,
): ProductTemplateEditFormValues => ({
  code: template.code,
  description: template.description,
  name: template.name,
  productType: template.productType,
  status: template.status,
});

export const mapVersionToFormValues = (
  version: ProductTemplateVersionDetailRecord,
): ProductTemplateVersionFormValues => ({
  defaultMarginPercent: version.defaultMarginPercent,
  defaultWastePercent: version.defaultWastePercent,
  description: version.description,
  duplicateFromVersionId: null,
  name: version.name,
  notes: version.notes,
  status: version.status,
});

const toJsonText = (value: unknown): string => {
  return JSON.stringify(value ?? null, null, 2);
};

export const mapVersionToRulesEditorValues = (
  version: ProductTemplateVersionDetailRecord,
): ProductTemplateRulesEditorValues => ({
  accessoryRules: version.accessoryRules.map((rule) => ({
    isActive: rule.isActive,
    isOptional: rule.isOptional,
    label: rule.label,
    materialId: rule.materialId,
    quantityFormulaJsonText: toJsonText(rule.quantityFormulaJson),
    sortOrder: rule.sortOrder,
  })),
  inputs: version.inputs.map((input) => ({
    defaultValueJsonText: toJsonText(input.defaultValueJson),
    inputType: input.inputType,
    isRequired: input.isRequired,
    key: input.key,
    label: input.label,
    optionsJsonText: toJsonText(input.optionsJson),
    sortOrder: input.sortOrder,
    unit: input.unit,
    validationJsonText: toJsonText(input.validationJson),
  })),
  laborRules: version.laborRules.map((rule) => ({
    formulaJsonText: toJsonText(rule.formulaJson),
    isActive: rule.isActive,
    label: rule.label,
    laborType: rule.laborType,
    sortOrder: rule.sortOrder,
    unitCost: rule.unitCost,
  })),
  materialRules: version.materialRules.map((rule) => ({
    allowRemnantUse: rule.allowRemnantUse,
    allowRotation: rule.allowRotation,
    formulaJsonText: toJsonText(rule.formulaJson),
    isActive: rule.isActive,
    label: rule.label,
    materialId: rule.materialId,
    ruleType: rule.ruleType,
    sortOrder: rule.sortOrder,
    wastePercent: rule.wastePercent,
  })),
});

export const parseJsonText = (value: string): unknown => {
  const trimmedValue = value.trim();
  return JSON.parse(trimmedValue.length > 0 ? trimmedValue : "null");
};
