"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { materialService } from "@/services/material-service";
import type {
  LogJsonValue,
  MaterialDetailRecord,
  MaterialDimensionPresetInput,
  MaterialMutationInput,
  SupplierMaterialEquivalenceInput,
} from "@/types";

import {
  MATERIALS_QUERY_KEYS,
  SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS,
  SUPPLIER_MATERIAL_STATUS_OPTIONS,
} from "../constants";

const materialTypeValues = ["LINEAR", "SHEET", "UNIT", "PACKAGE", "SERVICE"] as const;
const materialUnitValues = [
  "MM",
  "CM",
  "M",
  "M2",
  "UNIT",
  "PACKAGE",
  "KG",
  "LITER",
  "HOUR",
  "DAY",
] as const;
const materialStatusValues = ["ACTIVE", "INACTIVE", "DISCONTINUED"] as const;
const supplierMaterialConfidenceValues = [
  "PENDING",
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERIFIED",
] as const;
const supplierMaterialStatusValues = ["ACTIVE", "INACTIVE", "IGNORED"] as const;

const optionalTextField = z.string().trim().max(4000).default("");
const optionalShortTextField = z.string().trim().max(191).default("");
const optionalCodeField = z.string().trim().max(100).default("");

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

const optionalJsonTextField = z
  .string()
  .trim()
  .refine((value) => {
    if (value.length === 0) {
      return true;
    }

    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Ingresa un JSON valido o deja el campo vacio.",
  })
  .default("");

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

const parseJsonText = (value: string): LogJsonValue | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return JSON.parse(trimmedValue) as LogJsonValue;
};

export const materialCategoryFormSchema = z.object({
  description: optionalTextField,
  isActive: z.boolean().default(true),
  name: z.string().trim().min(1, "El nombre de la categoria es obligatorio.").max(191),
  parentId: z.string().default(""),
  sortOrder: optionalNumberStringField({
    integer: true,
    label: "El orden",
    min: 0,
  }),
});

export type MaterialCategoryFormValues = z.infer<typeof materialCategoryFormSchema>;

export const materialDimensionPresetFormSchema = z.object({
  heightMm: optionalNumberStringField({
    label: "Height",
    min: 0,
  }),
  isDefault: z.boolean().default(false),
    label: z.string().trim().min(1, "La etiqueta predefinida es obligatoria.").max(191),
  lengthMm: optionalNumberStringField({
    label: "Longitud",
    min: 0,
  }),
  thicknessMm: optionalNumberStringField({
    label: "Espesor",
    min: 0,
  }),
  widthMm: optionalNumberStringField({
    label: "Ancho",
    min: 0,
  }),
});

export type MaterialDimensionPresetFormValues = z.infer<
  typeof materialDimensionPresetFormSchema
>;

export const supplierMaterialEquivalenceFormSchema = z.object({
  confidence: z.enum(supplierMaterialConfidenceValues).default("PENDING"),
  conversionFactor: optionalNumberStringField({
    label: "El factor de conversion",
    min: 0,
  }),
  materialId: z.string().default(""),
  notes: optionalTextField,
  status: z.enum(supplierMaterialStatusValues).default("ACTIVE"),
  supplierDescription: optionalTextField,
  supplierId: z.string().trim().min(1, "El proveedor es obligatorio."),
  supplierName: z
    .string()
    .trim()
    .min(1, "El nombre del material del proveedor es obligatorio.")
    .max(191),
  supplierSku: optionalCodeField,
  supplierUnit: z.string().trim().max(50).default(""),
});

export type SupplierMaterialEquivalenceFormValues = z.infer<
  typeof supplierMaterialEquivalenceFormSchema
>;

type MaterialBehaviorSummary = {
  errors: Array<{
    message: string;
    path: keyof MaterialFormValues | string;
  }>;
  warnings: Array<{
    message: string;
    path: keyof MaterialFormValues | string;
  }>;
};

const getMaterialBehaviorSummary = (
  values: Pick<
    MaterialFormValues,
    | "isCuttable"
    | "isRemnantEligible"
    | "isStockable"
    | "materialType"
    | "minimumReusableHeightMm"
    | "minimumReusableLengthMm"
    | "minimumReusableWidthMm"
    | "standardLengthMm"
    | "standardWidthMm"
    | "unitConversionJsonText"
  >,
): MaterialBehaviorSummary => {
  const errors: MaterialBehaviorSummary["errors"] = [];
  const warnings: MaterialBehaviorSummary["warnings"] = [];
  const standardLengthMm = numberOrNull(values.standardLengthMm);
  const standardWidthMm = numberOrNull(values.standardWidthMm);
  const minimumReusableLengthMm = numberOrNull(values.minimumReusableLengthMm);
  const minimumReusableWidthMm = numberOrNull(values.minimumReusableWidthMm);
  const minimumReusableHeightMm = numberOrNull(values.minimumReusableHeightMm);

  if (values.materialType === "SERVICE" && values.isStockable) {
    errors.push({
      message: "Service materials cannot be stockable.",
      path: "isStockable",
    });
  }

  if (values.materialType === "SHEET" && values.isCuttable && standardLengthMm === null) {
    errors.push({
      message: "Cuttable sheet materials require a standard length in millimeters.",
      path: "standardLengthMm",
    });
  }

  if (values.materialType === "SHEET" && values.isCuttable && standardWidthMm === null) {
    errors.push({
      message: "Cuttable sheet materials require a standard width in millimeters.",
      path: "standardWidthMm",
    });
  }

  if (values.materialType === "LINEAR" && values.isCuttable && standardLengthMm === null) {
    warnings.push({
      message:
        "Linear cuttable materials should define a standard purchased length for later optimization.",
      path: "standardLengthMm",
    });
  }

  if (
    values.materialType === "PACKAGE" &&
    values.unitConversionJsonText.trim().length === 0
  ) {
    warnings.push({
      message:
        "Package materials should define unit conversion JSON so package-to-unit usage can be calculated later.",
      path: "unitConversionJsonText",
    });
  }

  if (values.isRemnantEligible && values.materialType === "LINEAR") {
    if (minimumReusableLengthMm === null) {
      errors.push({
        message:
          "Remnant-eligible linear materials require a minimum reusable length in millimeters.",
        path: "minimumReusableLengthMm",
      });
    }
  }

  if (values.isRemnantEligible && values.materialType === "SHEET") {
    if (minimumReusableWidthMm === null) {
      errors.push({
        message:
          "Remnant-eligible sheet materials require a minimum reusable width in millimeters.",
        path: "minimumReusableWidthMm",
      });
    }

    if (minimumReusableHeightMm === null) {
      errors.push({
        message:
          "Remnant-eligible sheet materials require a minimum reusable height in millimeters.",
        path: "minimumReusableHeightMm",
      });
    }
  }

  if (
    values.isRemnantEligible &&
    !["LINEAR", "SHEET"].includes(values.materialType)
  ) {
    errors.push({
      message: "Solo los materiales LINEAR o SHEET pueden habilitar reglas de remanentes reutilizables.",
      path: "isRemnantEligible",
    });
  }

  return {
    errors,
    warnings,
  };
};

export const materialFormSchema = z
  .object({
    allowsRotation: z.boolean().default(false),
    baseUnit: z.enum(materialUnitValues),
    brand: optionalShortTextField,
    categoryId: z.string().trim().min(1, "La categoría es obligatoria."),
    code: z.string().trim().min(1, "El código es obligatorio.").max(100),
    color: optionalShortTextField,
    consumptionUnit: z.enum(materialUnitValues),
    defaultWastePercent: optionalNumberStringField({
      label: "Default waste percent",
      max: 100,
      min: 0,
    }),
    description: optionalTextField,
    finish: optionalShortTextField,
    isCuttable: z.boolean().default(false),
    isPurchasable: z.boolean().default(true),
    isRemnantEligible: z.boolean().default(false),
    isSellable: z.boolean().default(false),
    isStockable: z.boolean().default(true),
    materialType: z.enum(materialTypeValues).default("UNIT"),
    minimumReusableHeightMm: optionalNumberStringField({
      label: "Minimum reusable height",
      min: 0,
    }),
    minimumReusableLengthMm: optionalNumberStringField({
      label: "Minimum reusable length",
      min: 0,
    }),
    minimumReusableWidthMm: optionalNumberStringField({
      label: "Minimum reusable width",
      min: 0,
    }),
    name: z.string().trim().min(1, "El nombre es obligatorio.").max(191),
    notes: optionalTextField,
    purchaseUnit: z.enum(materialUnitValues),
    standardHeightMm: optionalNumberStringField({
      label: "Standard height",
      min: 0,
    }),
    standardLengthMm: optionalNumberStringField({
      label: "Standard length",
      min: 0,
    }),
    standardWidthMm: optionalNumberStringField({
      label: "Standard width",
      min: 0,
    }),
    status: z.enum(materialStatusValues).default("ACTIVE"),
    stockUnit: z.enum(materialUnitValues),
    thicknessMm: optionalNumberStringField({
      label: "Thickness",
      min: 0,
    }),
    unitConversionJsonText: optionalJsonTextField,
  })
  .superRefine((value, context) => {
    const behaviorSummary = getMaterialBehaviorSummary(value);

    behaviorSummary.errors.forEach((issue) => {
      context.addIssue({
        code: "custom",
        message: issue.message,
        path: [issue.path],
      });
    });
  });

export type MaterialFormValues = z.infer<typeof materialFormSchema>;

export const EMPTY_MATERIAL_FORM_VALUES: MaterialFormValues = {
  allowsRotation: false,
  baseUnit: "UNIT",
  brand: "",
  categoryId: "",
  code: "",
  color: "",
  consumptionUnit: "UNIT",
  defaultWastePercent: "",
  description: "",
  finish: "",
  isCuttable: false,
  isPurchasable: true,
  isRemnantEligible: false,
  isSellable: false,
  isStockable: true,
  materialType: "UNIT",
  minimumReusableHeightMm: "",
  minimumReusableLengthMm: "",
  minimumReusableWidthMm: "",
  name: "",
  notes: "",
  purchaseUnit: "UNIT",
  standardHeightMm: "",
  standardLengthMm: "",
  standardWidthMm: "",
  status: "ACTIVE",
  stockUnit: "UNIT",
  thicknessMm: "",
  unitConversionJsonText: "",
};

export const EMPTY_MATERIAL_CATEGORY_FORM_VALUES: MaterialCategoryFormValues = {
  description: "",
  isActive: true,
  name: "",
  parentId: "",
  sortOrder: "0",
};

export const EMPTY_MATERIAL_DIMENSION_PRESET_FORM_VALUES: MaterialDimensionPresetFormValues =
  {
    heightMm: "",
    isDefault: false,
    label: "",
    lengthMm: "",
    thicknessMm: "",
    widthMm: "",
  };

export const EMPTY_SUPPLIER_MATERIAL_EQUIVALENCE_FORM_VALUES: SupplierMaterialEquivalenceFormValues =
  {
    confidence: "PENDING",
    conversionFactor: "",
    materialId: "",
    notes: "",
    status: "ACTIVE",
    supplierDescription: "",
    supplierId: "",
    supplierName: "",
    supplierSku: "",
    supplierUnit: "",
  };

const mapRecordToFormValues = (material: MaterialDetailRecord): MaterialFormValues => {
  return {
    allowsRotation: material.allowsRotation,
    baseUnit: material.baseUnit,
    brand: material.brand ?? "",
    categoryId: material.categoryId,
    code: material.code,
    color: material.color ?? "",
    consumptionUnit: material.consumptionUnit,
    defaultWastePercent:
      material.defaultWastePercent === null ? "" : String(material.defaultWastePercent),
    description: material.description ?? "",
    finish: material.finish ?? "",
    isCuttable: material.isCuttable,
    isPurchasable: material.isPurchasable,
    isRemnantEligible: material.isRemnantEligible,
    isSellable: material.isSellable,
    isStockable: material.isStockable,
    materialType: material.materialType,
    minimumReusableHeightMm:
      material.minimumReusableHeightMm === null
        ? ""
        : String(material.minimumReusableHeightMm),
    minimumReusableLengthMm:
      material.minimumReusableLengthMm === null
        ? ""
        : String(material.minimumReusableLengthMm),
    minimumReusableWidthMm:
      material.minimumReusableWidthMm === null
        ? ""
        : String(material.minimumReusableWidthMm),
    name: material.name,
    notes: material.notes ?? "",
    purchaseUnit: material.purchaseUnit,
    standardHeightMm:
      material.standardHeightMm === null ? "" : String(material.standardHeightMm),
    standardLengthMm:
      material.standardLengthMm === null ? "" : String(material.standardLengthMm),
    standardWidthMm:
      material.standardWidthMm === null ? "" : String(material.standardWidthMm),
    status: material.status,
    stockUnit: material.stockUnit,
    thicknessMm: material.thicknessMm === null ? "" : String(material.thicknessMm),
    unitConversionJsonText: material.unitConversionJson
      ? JSON.stringify(material.unitConversionJson, null, 2)
      : "",
  };
};

const toMaterialPayload = (values: MaterialFormValues): MaterialMutationInput => {
  return {
    allowsRotation: values.materialType === "SHEET" ? values.allowsRotation : false,
    baseUnit: values.baseUnit,
    brand: trimToNull(values.brand),
    categoryId: values.categoryId,
    code: values.code.trim(),
    color: trimToNull(values.color),
    consumptionUnit: values.consumptionUnit,
    defaultWastePercent: numberOrNull(values.defaultWastePercent),
    description: trimToNull(values.description),
    finish: trimToNull(values.finish),
    isCuttable: values.isCuttable,
    isPurchasable: values.isPurchasable,
    isRemnantEligible: values.isRemnantEligible,
    isSellable: values.isSellable,
    isStockable: values.materialType === "SERVICE" ? false : values.isStockable,
    materialType: values.materialType,
    minimumReusableHeightMm: numberOrNull(values.minimumReusableHeightMm),
    minimumReusableLengthMm: numberOrNull(values.minimumReusableLengthMm),
    minimumReusableWidthMm: numberOrNull(values.minimumReusableWidthMm),
    name: values.name.trim(),
    notes: trimToNull(values.notes),
    purchaseUnit: values.purchaseUnit,
    standardHeightMm: numberOrNull(values.standardHeightMm),
    standardLengthMm: numberOrNull(values.standardLengthMm),
    standardWidthMm: numberOrNull(values.standardWidthMm),
    status: values.status,
    stockUnit: values.stockUnit,
    thicknessMm: numberOrNull(values.thicknessMm),
    unitConversionJson: parseJsonText(values.unitConversionJsonText),
  };
};

const toMaterialDimensionPresetPayload = (
  values: MaterialDimensionPresetFormValues,
): MaterialDimensionPresetInput => {
  return {
    heightMm: numberOrNull(values.heightMm),
    isDefault: values.isDefault,
    label: values.label.trim(),
    lengthMm: numberOrNull(values.lengthMm),
    thicknessMm: numberOrNull(values.thicknessMm),
    widthMm: numberOrNull(values.widthMm),
  };
};

const toSupplierMaterialEquivalencePayload = (
  values: SupplierMaterialEquivalenceFormValues,
): SupplierMaterialEquivalenceInput => {
  return {
    confidence: values.confidence,
    conversionFactor: numberOrNull(values.conversionFactor),
    materialId: trimToNull(values.materialId),
    notes: trimToNull(values.notes),
    status: values.status,
    supplierDescription: trimToNull(values.supplierDescription),
    supplierId: values.supplierId.trim(),
    supplierName: values.supplierName.trim(),
    supplierSku: trimToNull(values.supplierSku),
    supplierUnit: trimToNull(values.supplierUnit),
  };
};

export const useMaterials = () => {
  const queryClient = useQueryClient();

  const useMaterial = (materialId: string) =>
    useQuery({
      enabled: Boolean(materialId),
      queryFn: () => materialService.getMaterialById(materialId),
      queryKey: MATERIALS_QUERY_KEYS.detail(materialId),
    });

  const useMaterialCategories = () =>
    useQuery({
      queryFn: () => materialService.listMaterialCategories(),
      queryKey: MATERIALS_QUERY_KEYS.categories,
      staleTime: 60_000,
    });

  const useMaterialDimensionPresets = (materialId: string) =>
    useQuery({
      enabled: Boolean(materialId),
      queryFn: () => materialService.listMaterialDimensionPresets(materialId),
      queryKey: MATERIALS_QUERY_KEYS.dimensionPresets(materialId),
    });

  const useSupplierMaterialEquivalences = ({
    confidence,
    materialId,
    page,
    perPage,
    search,
    status,
    supplierId,
  }: {
    confidence?: typeof SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS[number]["value"];
    materialId?: string;
    page: number;
    perPage: number;
    search: string;
    status?: typeof SUPPLIER_MATERIAL_STATUS_OPTIONS[number]["value"];
    supplierId?: string;
  }) =>
    useQuery({
      queryFn: () =>
        materialService.listSupplierMaterialEquivalences({
          confidence,
          materialId,
          page,
          perPage,
          search,
          status,
          supplierId,
        }),
      queryKey: [
        ...MATERIALS_QUERY_KEYS.equivalences(materialId ?? "all"),
        {
          confidence,
          page,
          perPage,
          search,
          status,
          supplierId,
        },
      ],
    });

  const useCreateMaterial = () =>
    useMutation({
      mutationFn: async (values: MaterialFormValues) => {
        return materialService.createMaterial(toMaterialPayload(values));
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: MATERIALS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: MATERIALS_QUERY_KEYS.categories,
          }),
        ]);
      },
    });

  const useUpdateMaterial = () =>
    useMutation({
      mutationFn: async ({
        materialId,
        values,
      }: {
        materialId: string;
        values: MaterialFormValues;
      }) => {
        return materialService.updateMaterial(materialId, toMaterialPayload(values));
      },
      onSuccess: async (_record, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: MATERIALS_QUERY_KEYS.all,
          }),
          queryClient.invalidateQueries({
            queryKey: MATERIALS_QUERY_KEYS.detail(variables.materialId),
          }),
          queryClient.invalidateQueries({
            queryKey: MATERIALS_QUERY_KEYS.categories,
          }),
        ]);
      },
    });

  const useDeleteMaterial = () =>
    useMutation({
      mutationFn: async (materialId: string) => {
        await materialService.deleteMaterial(materialId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        });
      },
    });

  const useCreateMaterialDimensionPreset = () =>
    useMutation({
      mutationFn: async ({
        materialId,
        values,
      }: {
        materialId: string;
        values: MaterialDimensionPresetFormValues;
      }) => {
        return materialService.createMaterialDimensionPreset(
          materialId,
          toMaterialDimensionPresetPayload(values),
        );
      },
      onSuccess: async (_record, variables) => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.dimensionPresets(variables.materialId),
        });
      },
    });

  const useUpdateMaterialDimensionPreset = () =>
    useMutation({
      mutationFn: async ({
        materialId,
        presetId,
        values,
      }: {
        materialId: string;
        presetId: string;
        values: MaterialDimensionPresetFormValues;
      }) => {
        return materialService.updateMaterialDimensionPreset(
          materialId,
          presetId,
          toMaterialDimensionPresetPayload(values),
        );
      },
      onSuccess: async (_record, variables) => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.dimensionPresets(variables.materialId),
        });
      },
    });

  const useDeleteMaterialDimensionPreset = () =>
    useMutation({
      mutationFn: async ({
        materialId,
        presetId,
      }: {
        materialId: string;
        presetId: string;
      }) => {
        await materialService.deleteMaterialDimensionPreset(materialId, presetId);
      },
      onSuccess: async (_record, variables) => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.dimensionPresets(variables.materialId),
        });
      },
    });

  const useCreateSupplierMaterialEquivalence = () =>
    useMutation({
      mutationFn: async (values: SupplierMaterialEquivalenceFormValues) => {
        return materialService.createSupplierMaterialEquivalence(
          toSupplierMaterialEquivalencePayload(values),
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        });
      },
    });

  const useUpdateSupplierMaterialEquivalence = () =>
    useMutation({
      mutationFn: async ({
        equivalenceId,
        values,
      }: {
        equivalenceId: string;
        values: SupplierMaterialEquivalenceFormValues;
      }) => {
        return materialService.updateSupplierMaterialEquivalence(
          equivalenceId,
          toSupplierMaterialEquivalencePayload(values),
        );
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        });
      },
    });

  const useDeleteSupplierMaterialEquivalence = () =>
    useMutation({
      mutationFn: async (equivalenceId: string) => {
        await materialService.deleteSupplierMaterialEquivalence(equivalenceId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        });
      },
    });

  const useVerifySupplierMaterialEquivalence = () =>
    useMutation({
      mutationFn: async (equivalenceId: string) => {
        return materialService.verifySupplierMaterialEquivalence(equivalenceId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        });
      },
    });

  const useMapSupplierMaterialEquivalence = () =>
    useMutation({
      mutationFn: async ({
        equivalenceId,
        materialId,
      }: {
        equivalenceId: string;
        materialId: string;
      }) => {
        return materialService.mapSupplierMaterialEquivalence(equivalenceId, {
          materialId,
        });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        });
      },
    });

  return {
    getMaterialBehaviorSummary,
    mapRecordToFormValues,
    useCreateMaterial,
    useCreateMaterialDimensionPreset,
    useCreateSupplierMaterialEquivalence,
    useDeleteMaterial,
    useDeleteMaterialDimensionPreset,
    useDeleteSupplierMaterialEquivalence,
    useMapSupplierMaterialEquivalence,
    useMaterial,
    useMaterialCategories,
    useMaterialDimensionPresets,
    useSupplierMaterialEquivalences,
    useUpdateMaterial,
    useUpdateMaterialDimensionPreset,
    useUpdateSupplierMaterialEquivalence,
    useVerifySupplierMaterialEquivalence,
  };
};
