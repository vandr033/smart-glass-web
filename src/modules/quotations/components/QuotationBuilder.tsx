"use client";

import { useState, type ReactNode } from "react";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileStack,
  PackagePlus,
  RefreshCcw,
  ScanSearch,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SquarePen,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { getApiErrorMessage } from "@/utils";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { INVENTORY_PERMISSIONS } from "@/modules/inventory/constants";
import { materialService } from "@/services/material-service";
import { productTemplateService } from "@/services/product-template-service";
import { quotationService } from "@/services/quotation-service";
import { supplierService } from "@/services/supplier-service";
import type {
  ProductTemplateInputRecord,
  ProductTemplateSimulationRecord,
  QuotationItemRecord,
  QuotationItemType,
} from "@/types";

import {
  QUOTATIONS_PERMISSIONS,
  QUOTATIONS_QUERY_KEYS,
  QUOTATIONS_ROUTES,
} from "../constants";
import { QuotationGlassOptimizationPanel } from "@/modules/cutting/components/QuotationGlassOptimizationPanel";
import { QuotationProfileOptimizationPanel } from "@/modules/profile-optimization/components/QuotationProfileOptimizationPanel";
import {
  formatQuotationCurrency,
  formatQuotationDate,
  formatQuotationDateTime,
  formatQuotationPercent,
  getQuotationStatusBadge,
} from "../ui";
import { QuotationInventoryAvailability } from "./QuotationInventoryAvailability";
import { QuotationItemsTable } from "./QuotationItemsTable";
import { QuotationTotalsPanel } from "./QuotationTotalsPanel";

const DEFAULT_APPROVAL_POLICY = {
  maximumDiscountPercent: 10,
  minimumMarginPercent: 15,
  requireApprovalForManualOverride: true,
} as const;

const SUPPLIERS_READ_PERMISSION = "suppliers.read";

type QuotationBuilderProps = {
  quotationId: string;
};

type TemplateDraft = {
  description: string;
  inputValues: Record<string, unknown>;
  name: string;
  productTemplateVersionId: string;
  quantity: string;
  templateId: string;
};

type ManualMaterialDraft = {
  description: string;
  marginPercent: string;
  materialId: string;
  name: string;
  quantity: string;
  supplierId: string;
  unit: string;
  unitCost: string;
  unitSalePrice: string;
};

type ManualServiceDraft = {
  description: string;
  marginPercent: string;
  name: string;
  quantity: string;
  unit: string;
  unitCost: string;
  unitSalePrice: string;
};

type BaseEditDraft = {
  description: string;
  itemId: string;
  itemType: QuotationItemType;
  name: string;
  quantity: string;
};

type TemplateEditDraft = BaseEditDraft & {
  clearManualOverride: boolean;
  inputValues: Record<string, unknown>;
  itemType: "TEMPLATE_PRODUCT";
  overrideMarginPercent: string;
  overrideSubtotalCost: string;
  overrideSubtotalSale: string;
  productTemplateVersionId: string;
};

type ManualMaterialEditDraft = BaseEditDraft & {
  itemType: "MANUAL_MATERIAL";
  marginPercent: string;
  materialId: string;
  supplierId: string;
  unit: string;
  unitCost: string;
  unitSalePrice: string;
};

type ManualServiceEditDraft = BaseEditDraft & {
  itemType: "MANUAL_SERVICE";
  marginPercent: string;
  unit: string;
  unitCost: string;
  unitSalePrice: string;
};

type GenericEditDraft = BaseEditDraft;

type ItemEditDraft =
  | TemplateEditDraft
  | ManualMaterialEditDraft
  | ManualServiceEditDraft
  | GenericEditDraft;

type ApprovalWarning = {
  body: string;
  title: string;
};

type ModalShellProps = {
  children: ReactNode;
  description: string;
  onClose: () => void;
  title: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const formatEditableNumber = (value: number | null | undefined): string => {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
};

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDefaultTemplateInputValue = (input: ProductTemplateInputRecord): unknown => {
  if (input.defaultValueJson !== null) {
    return input.defaultValueJson;
  }

  switch (input.inputType) {
    case "BOOLEAN":
      return false;
    case "NUMBER":
      return 0;
    default:
      return "";
  }
};

const buildDefaultTemplateInputValues = (
  inputs: ProductTemplateInputRecord[],
): Record<string, unknown> => {
  return Object.fromEntries(
    inputs.map((input) => [input.key, getDefaultTemplateInputValue(input)]),
  );
};

const getTemplateManualOverride = (item: QuotationItemRecord) => {
  const calculationResult = isRecord(item.calculationResultJson)
    ? item.calculationResultJson
    : null;
  const manualOverride = calculationResult?.manualOverride;
  const overrideRecord = isRecord(manualOverride) ? manualOverride : null;

  return {
    marginPercent:
      typeof overrideRecord?.marginPercent === "number"
        ? overrideRecord.marginPercent
        : null,
    subtotalCost:
      typeof overrideRecord?.subtotalCost === "number"
        ? overrideRecord.subtotalCost
        : null,
    subtotalSale:
      typeof overrideRecord?.subtotalSale === "number"
        ? overrideRecord.subtotalSale
        : null,
  };
};

const getApprovalWarnings = (
  quotation: {
    discountAmount: number;
    items: QuotationItemRecord[];
    marginPercent: number | null;
    status: string;
    subtotalSale: number;
  },
  canViewCost: boolean,
): ApprovalWarning[] => {
  const warnings: ApprovalWarning[] = [];
  const discountPercent =
    quotation.subtotalSale > 0
      ? (quotation.discountAmount / quotation.subtotalSale) * 100
      : quotation.discountAmount > 0
        ? 100
        : 0;
  const hasManualOverride = quotation.items.some((item) => item.hasManualOverride);

  if (
    canViewCost &&
    quotation.marginPercent !== null &&
    quotation.marginPercent < DEFAULT_APPROVAL_POLICY.minimumMarginPercent
  ) {
    warnings.push({
      body: `El margen actual es ${quotation.marginPercent.toFixed(
        2,
      )}% y la politica minima configurada es ${DEFAULT_APPROVAL_POLICY.minimumMarginPercent.toFixed(
        2,
      )}%. Las reglas del servidor aplicaran la configuracion activa al momento de enviar la cotizacion.`,
      title: "Margen bajo",
    });
  }

  if (discountPercent > DEFAULT_APPROVAL_POLICY.maximumDiscountPercent) {
    warnings.push({
      body: `El descuento es ${discountPercent.toFixed(
        2,
      )}% y la politica maxima configurada es ${DEFAULT_APPROVAL_POLICY.maximumDiscountPercent.toFixed(
        2,
      )}%.`,
      title: "Descuento alto",
    });
  }

  if (hasManualOverride && DEFAULT_APPROVAL_POLICY.requireApprovalForManualOverride) {
    warnings.push({
      body: "Uno o mas items de plantilla incluyen un ajuste manual de precios, configurado para requerir aprobacion por defecto.",
      title: "Ajuste manual detectado",
    });
  }

  if (quotation.status === "PENDING_APPROVAL") {
    warnings.push({
      body: "Esta cotizacion ya esta esperando a un aprobador, asi que las ediciones deberian pausarse hasta que vuelva a borrador.",
      title: "Aprobacion pendiente",
    });
  }

  return warnings;
};

const isTemplateEditDraft = (
  draft: ItemEditDraft | null,
): draft is TemplateEditDraft => draft?.itemType === "TEMPLATE_PRODUCT";

const isManualMaterialEditDraft = (
  draft: ItemEditDraft | null,
): draft is ManualMaterialEditDraft => draft?.itemType === "MANUAL_MATERIAL";

const isManualServiceEditDraft = (
  draft: ItemEditDraft | null,
): draft is ManualServiceEditDraft => draft?.itemType === "MANUAL_SERVICE";

function ModalShell({ children, description, onClose, title }: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg border border-stone-200 bg-white p-6 shadow-[0_32px_90px_rgba(15,47,91,0.2)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Modal del cotizador
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-700">{description}</p>
          </div>

          <button
            className={secondaryButtonClassName}
            onClick={onClose}
            type="button"
          >
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export function QuotationBuilder({ quotationId }: QuotationBuilderProps) {
  const queryClient = useQueryClient();
  const permissionsQuery = usePermissions();
  const permissions = permissionsQuery.permissions;
  const canUpdate = permissions.includes(QUOTATIONS_PERMISSIONS.update);
  const canViewCost = permissions.includes(QUOTATIONS_PERMISSIONS.viewCost);
  const canOverrideCost = permissions.includes(QUOTATIONS_PERMISSIONS.overrideCost);
  const canApprove = permissions.includes(QUOTATIONS_PERMISSIONS.approve);
  const canReadSuppliers = permissions.includes(SUPPLIERS_READ_PERMISSION);
  const canReadInventory = permissions.includes(INVENTORY_PERMISSIONS.read);
  const canReserveInventory = permissions.includes(INVENTORY_PERMISSIONS.reserve);

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [builderMessage, setBuilderMessage] = useState<string | null>(null);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<QuotationItemRecord | null>(null);
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null);
  const [templatePreview, setTemplatePreview] =
    useState<ProductTemplateSimulationRecord | null>(null);
  const [manualMaterialDraft, setManualMaterialDraft] =
    useState<ManualMaterialDraft | null>(null);
  const [manualServiceDraft, setManualServiceDraft] =
    useState<ManualServiceDraft | null>(null);
  const [editDraft, setEditDraft] = useState<ItemEditDraft | null>(null);
  const [editTemplatePreview, setEditTemplatePreview] =
    useState<ProductTemplateSimulationRecord | null>(null);

  const quotationQuery = useQuery({
    queryFn: async () => quotationService.getQuotationById(quotationId),
    queryKey: QUOTATIONS_QUERY_KEYS.detail(quotationId),
  });
  const templatesQuery = useQuery({
    enabled: canUpdate,
    queryFn: async () => {
      const result = await productTemplateService.listTemplates({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data.filter((template) => Boolean(template.currentVersionId));
    },
    queryKey: ["quotations", "builder", "template-options"],
    staleTime: 60_000,
  });
  const materialsQuery = useQuery({
    enabled: canUpdate,
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["quotations", "builder", "material-options"],
    staleTime: 60_000,
  });
  const suppliersQuery = useQuery({
    enabled:
      canReadSuppliers &&
      (Boolean(manualMaterialDraft) || isManualMaterialEditDraft(editDraft)),
    queryFn: async () => {
      const result = await supplierService.listSuppliers({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["quotations", "builder", "supplier-options"],
    staleTime: 60_000,
  });

  const activeTemplateVersionId =
    templateDraft?.productTemplateVersionId ??
    (isTemplateEditDraft(editDraft) ? editDraft.productTemplateVersionId : "");
  const activeTemplateVersionQuery = useQuery({
    enabled: Boolean(activeTemplateVersionId),
    queryFn: async () =>
      productTemplateService.getTemplateVersionById(activeTemplateVersionId),
    queryKey: ["quotations", "builder", "template-version", activeTemplateVersionId],
    staleTime: 60_000,
  });

  const isBusy = pendingAction !== null;

  const resetModalState = () => {
    setTemplateDraft(null);
    setTemplatePreview(null);
    setManualMaterialDraft(null);
    setManualServiceDraft(null);
    setEditDraft(null);
    setEditTemplatePreview(null);
  };

  const runAction = async (
    actionKey: string,
    action: () => Promise<void>,
  ) => {
    setBuilderError(null);
    setBuilderMessage(null);
    setPendingAction(actionKey);

    try {
      await action();
    } catch (error) {
      setBuilderError(getApiErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const refreshQuotationData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: QUOTATIONS_QUERY_KEYS.detail(quotationId),
      }),
      queryClient.invalidateQueries({
        queryKey: ["quotations"],
      }),
      queryClient.invalidateQueries({
        queryKey: QUOTATIONS_QUERY_KEYS.approvals(quotationId),
      }),
      queryClient.invalidateQueries({
        queryKey: QUOTATIONS_QUERY_KEYS.pendingApprovals,
      }),
    ]);
  };

  const syncQuotation = async (
    quotation: Awaited<ReturnType<typeof quotationService.getQuotationById>>,
    message: string,
  ) => {
    queryClient.setQueryData(QUOTATIONS_QUERY_KEYS.detail(quotationId), quotation);
    await refreshQuotationData();
    setBuilderMessage(message);
  };

  const parseRequiredPositiveNumber = (value: string, label: string) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`${label} debe ser mayor que cero.`);
    }

    return parsed;
  };

  const parseOptionalMarginPercent = (value: string) => {
    const parsed = parseOptionalNumber(value);

    if (parsed === null) {
      return null;
    }

    if (parsed < 0 || parsed > 99.99) {
      throw new Error("El margen debe estar entre 0 y 99.99.");
    }

    return parsed;
  };

  const parseOptionalSalePrice = (value: string) => {
    const parsed = parseOptionalNumber(value);

    if (parsed === null) {
      return null;
    }

    if (parsed < 0) {
      throw new Error("El precio de venta unitario no puede ser negativo.");
    }

    return parsed;
  };

  const parsePositiveUnitCost = (value: string) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error("El costo unitario debe ser mayor a cero.");
    }

    return parsed;
  };

  const openTemplateModal = () => {
    const firstTemplate = templatesQuery.data?.[0];

    setBuilderError(null);
    setBuilderMessage(null);
    setTemplatePreview(null);
    setTemplateDraft({
      description: "",
      inputValues: {},
      name: firstTemplate?.name ?? "",
      productTemplateVersionId: firstTemplate?.currentVersionId ?? "",
      quantity: "1",
      templateId: firstTemplate?.id ?? "",
    });
  };

  const openManualMaterialModal = () => {
    const firstMaterial = materialsQuery.data?.[0];

    setBuilderError(null);
    setBuilderMessage(null);
    setManualMaterialDraft({
      description: "",
      marginPercent: "",
      materialId: firstMaterial?.id ?? "",
      name: firstMaterial?.name ?? "",
      quantity: "1",
      supplierId: "",
      unit: firstMaterial?.consumptionUnit ?? "UNIT",
      unitCost: "",
      unitSalePrice: "",
    });
  };

  const openManualServiceModal = () => {
    setBuilderError(null);
    setBuilderMessage(null);
    setManualServiceDraft({
      description: "",
      marginPercent: "",
      name: "",
      quantity: "1",
      unit: "service",
      unitCost: "",
      unitSalePrice: "",
    });
  };

  const openEditModal = (item: QuotationItemRecord) => {
    const inputValues = isRecord(item.inputValuesJson) ? item.inputValuesJson : {};

    setBuilderError(null);
    setBuilderMessage(null);
    setEditTemplatePreview(null);

    if (item.itemType === "TEMPLATE_PRODUCT") {
      const override = getTemplateManualOverride(item);

      setEditDraft({
        clearManualOverride: false,
        description: item.description ?? "",
        inputValues,
        itemId: item.id,
        itemType: "TEMPLATE_PRODUCT",
        name: item.name,
        overrideMarginPercent: formatEditableNumber(override.marginPercent),
        overrideSubtotalCost: formatEditableNumber(override.subtotalCost),
        overrideSubtotalSale: formatEditableNumber(override.subtotalSale),
        productTemplateVersionId: item.productTemplateVersionId ?? "",
        quantity: String(item.quantity),
      });

      return;
    }

    if (item.itemType === "MANUAL_MATERIAL") {
      const firstMaterialRow = item.materials[0];

      setEditDraft({
        description: item.description ?? "",
        itemId: item.id,
        itemType: "MANUAL_MATERIAL",
        marginPercent: formatEditableNumber(
          typeof inputValues.marginPercent === "number"
            ? inputValues.marginPercent
            : item.marginPercent,
        ),
        materialId:
          typeof inputValues.materialId === "string"
            ? inputValues.materialId
            : firstMaterialRow?.materialId ?? "",
        name: item.name,
        quantity: String(item.quantity),
        supplierId:
          typeof inputValues.supplierId === "string" ? inputValues.supplierId : "",
        unit:
          typeof inputValues.unit === "string"
            ? inputValues.unit
            : firstMaterialRow?.unit ?? "UNIT",
        unitCost: formatEditableNumber(
          typeof inputValues.unitCost === "number"
            ? inputValues.unitCost
            : firstMaterialRow?.unitCost,
        ),
        unitSalePrice: formatEditableNumber(
          typeof inputValues.unitSalePrice === "number"
            ? inputValues.unitSalePrice
            : item.quantity > 0
              ? item.subtotalSale / item.quantity
              : null,
        ),
      });

      return;
    }

    if (item.itemType === "MANUAL_SERVICE") {
      const firstMaterialRow = item.materials[0];

      setEditDraft({
        description: item.description ?? "",
        itemId: item.id,
        itemType: "MANUAL_SERVICE",
        marginPercent: formatEditableNumber(
          typeof inputValues.marginPercent === "number"
            ? inputValues.marginPercent
            : item.marginPercent,
        ),
        name: item.name,
        quantity: String(item.quantity),
        unit:
          typeof inputValues.unit === "string"
            ? inputValues.unit
            : firstMaterialRow?.unit ?? "service",
        unitCost: formatEditableNumber(
          typeof inputValues.unitCost === "number"
            ? inputValues.unitCost
            : firstMaterialRow?.unitCost,
        ),
        unitSalePrice: formatEditableNumber(
          typeof inputValues.unitSalePrice === "number"
            ? inputValues.unitSalePrice
            : item.quantity > 0
              ? item.subtotalSale / item.quantity
              : null,
        ),
      });

      return;
    }

    setEditDraft({
      description: item.description ?? "",
      itemId: item.id,
      itemType: item.itemType,
      name: item.name,
      quantity: String(item.quantity),
    });
  };

  const renderTemplateInputField = (
    input: ProductTemplateInputRecord,
    values: Record<string, unknown>,
    onChange: (nextValue: unknown) => void,
  ) => {
    const value = values[input.key];

    switch (input.inputType) {
      case "BOOLEAN":
        return (
          <select
            className={fieldClassName}
            onChange={(event) => {
              onChange(event.target.value === "true");
            }}
            value={String(Boolean(value))}
          >
            <option value="true">Si</option>
            <option value="false">No</option>
          </select>
        );

      case "MATERIAL_SELECT":
        return (
          <select
            className={fieldClassName}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            value={typeof value === "string" ? value : ""}
          >
            <option value="">Seleccionar material</option>
            {(materialsQuery.data ?? []).map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} ({material.code})
              </option>
            ))}
          </select>
        );

      case "NUMBER":
        return (
          <input
            className={fieldClassName}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            type="number"
            value={
              typeof value === "number" || typeof value === "string" ? value : ""
            }
          />
        );

      case "SELECT": {
        const options = Array.isArray(input.optionsJson) ? input.optionsJson : [];

        return (
          <select
            className={fieldClassName}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
          >
            <option value="">Seleccionar opción</option>
            {options.map((option, index) => {
              if (isRecord(option) && "value" in option) {
                return (
                  <option key={`${input.id}-${index}`} value={String(option.value)}>
                    {String("label" in option ? option.label : option.value)}
                  </option>
                );
              }

              return (
                <option key={`${input.id}-${index}`} value={String(option)}>
                  {String(option)}
                </option>
              );
            })}
          </select>
        );
      }

      case "TEXT":
        return (
          <input
            className={fieldClassName}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            value={typeof value === "string" ? value : ""}
          />
        );
    }
  };

  if (
    quotationQuery.isLoading ||
    permissionsQuery.isLoading ||
    templatesQuery.isLoading ||
    materialsQuery.isLoading
  ) {
    return <LoadingState cards={5} title="Cargando cotizador de cotizaciones" />;
  }

  if (
    quotationQuery.isError ||
    permissionsQuery.isError ||
    templatesQuery.isError ||
    materialsQuery.isError ||
    !quotationQuery.data
  ) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                quotationQuery.refetch(),
                permissionsQuery.refetch(),
                templatesQuery.refetch(),
                materialsQuery.refetch(),
                suppliersQuery.refetch(),
                activeTemplateVersionQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          quotationQuery.error?.message ??
          permissionsQuery.error?.message ??
          templatesQuery.error?.message ??
          materialsQuery.error?.message ??
          "No se pudo preparar el cotizador de cotizaciones."
        }
        title="No se pudo preparar el cotizador"
      />
    );
  }

  const quotation = quotationQuery.data;
  const quotationStatusBadge = getQuotationStatusBadge(quotation.status);
  const approvalWarnings = getApprovalWarnings(quotation, canViewCost);
  const hasItems = quotation.items.length > 0;
  const isEditable = quotation.status === "DRAFT";
  const canCreateManualItems = isEditable && canUpdate && canViewCost;
  const templateOptions = templatesQuery.data ?? [];
  const selectedTemplate = templateDraft
    ? templateOptions.find((template) => template.id === templateDraft.templateId) ?? null
    : null;
  const activeTemplateVersion = activeTemplateVersionQuery.data;
  const resolvedTemplateInputValues =
    templateDraft &&
    activeTemplateVersion &&
    templateDraft.productTemplateVersionId === activeTemplateVersion.id
      ? Object.keys(templateDraft.inputValues).length > 0
        ? templateDraft.inputValues
        : buildDefaultTemplateInputValues(activeTemplateVersion.inputs)
      : templateDraft?.inputValues ?? {};

  return (
    <>
      <main className="space-y-6">
        <PageHeader
          actions={
            <>
              <Link className={secondaryButtonClassName} href={QUOTATIONS_ROUTES.view(quotation.id)}>
                <SquarePen className="mr-2 h-4 w-4" />
                Detalle
              </Link>
              <Link className={secondaryButtonClassName} href={QUOTATIONS_ROUTES.edit(quotation.id)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Cabecera
              </Link>
              <Link className={secondaryButtonClassName} href={QUOTATIONS_ROUTES.preview(quotation.id)}>
                <ScanSearch className="mr-2 h-4 w-4" />
                Vista previa
              </Link>
              <button
                className={secondaryButtonClassName}
                disabled={isBusy || quotation.status === "ACCEPTED"}
                onClick={() => {
                  void runAction("recalculate", async () => {
                    const updatedQuotation =
                      await quotationService.recalculateQuotation(quotation.id);
                    await syncQuotation(updatedQuotation, "Los totales de la cotizacion fueron recalculados.");
                  });
                }}
                type="button"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Recalcular
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={isBusy || !hasItems || !isEditable}
                onClick={() => {
                  void runAction("create-version", async () => {
                    const version = await quotationService.createVersion(quotation.id);
                    await queryClient.invalidateQueries({
                      queryKey: QUOTATIONS_QUERY_KEYS.versions(quotation.id),
                    });
                    await refreshQuotationData();
                    setBuilderMessage(`Version ${version.versionNumber} creada correctamente.`);
                  });
                }}
                type="button"
              >
                <FileStack className="mr-2 h-4 w-4" />
                Crear version
              </button>
              <button
                className={primaryButtonClassName}
                disabled={isBusy || !hasItems || !isEditable}
                onClick={() => {
                  const approvalNote =
                    typeof window !== "undefined"
                      ? window.prompt("Nota de aprobacion (opcional)")
                      : null;

                  void runAction("submit-approval", async () => {
                    const result = await quotationService.submitApproval(quotation.id, {
                      reason: approvalNote || null,
                    });
                    await syncQuotation(
                      result.quotation,
                      result.evaluation.requiresApproval
                        ? "La cotizacion fue enviada a aprobacion."
                        : "La cotizacion se aprobo automaticamente porque no se encontraron disparadores de aprobacion.",
                    );
                  });
                }}
                type="button"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Enviar a aprobacion
              </button>
            </>
          }
          description="Construye la estructura comercial, conserva calculos ligados a versiones de plantilla y detecta disparadores de aprobacion antes de enviar la cotizacion."
          eyebrow="Cotizador"
          title={`Cotizador ${quotation.code}`}
        />

        {builderMessage ? (
          <section className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {builderMessage}
          </section>
        ) : null}

        {builderError ? (
          <section className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {builderError}
          </section>
        ) : null}

        <section className={sectionClassName}>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${quotationStatusBadge.className}`}
                >
                  {quotationStatusBadge.label}
                </span>
                <span className="text-sm text-stone-600">
                  {quotation.client.displayName}
                  {quotation.project ? ` · ${quotation.project.code}` : ""}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Proyecto
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {quotation.project
                      ? `${quotation.project.code} · ${quotation.project.title}`
                      : "Cotizacion general"}
                  </p>
                </div>
                <div className="rounded-lg bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Vigencia
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {formatQuotationDate(quotation.validUntil)}
                  </p>
                </div>
                <div className="rounded-lg bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Items
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {quotation.items.length}
                  </p>
                </div>
                <div className="rounded-lg bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Actualizada
                  </p>
                  <p className="mt-2 text-sm font-semibold text-stone-950">
                    {formatQuotationDateTime(quotation.updatedAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Nota de flujo
                </p>
                <p className="mt-2 text-sm leading-7 text-stone-700">
                  {isEditable
                    ? "Las cotizaciones en borrador pueden editarse libremente. Los items de plantilla quedan fijados a la version especifica guardada en cada linea."
                    : "Esta cotizacion ya no esta en borrador, por lo que el cotizador queda en modo consulta. Si necesitas revisiones, devuelvela a borrador mediante el flujo de aprobacion."}
                </p>
              </div>
            </div>

            <QuotationTotalsPanel canViewCost={canViewCost} quotation={quotation} />
          </div>
        </section>

        <QuotationInventoryAvailability
          canReadInventory={canReadInventory}
          canReserve={canReserveInventory}
          projectId={quotation.project?.id ?? null}
          quotation={quotation}
        />

        <QuotationGlassOptimizationPanel quotationId={quotation.id} />

        <QuotationProfileOptimizationPanel quotationId={quotation.id} />

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <section className={sectionClassName}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Items
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Lineas valorizadas de la cotizacion
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-700">
                  Agrega productos simulados desde plantillas, materiales manuales o servicios manuales, y luego reordena o ajusta las lineas antes de la aprobacion.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className={primaryButtonClassName}
                  disabled={isBusy || !isEditable || templateOptions.length === 0}
                  onClick={openTemplateModal}
                  type="button"
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Agregar producto de plantilla
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={isBusy || !canCreateManualItems}
                  onClick={openManualMaterialModal}
                  type="button"
                >
                  Agregar material manual
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={isBusy || !canCreateManualItems}
                  onClick={openManualServiceModal}
                  type="button"
                >
                  Agregar servicio manual
                </button>
              </div>
            </div>

            {!canViewCost ? (
              <div className="mt-5 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                La creacion manual de materiales y servicios esta deshabilitada para usuarios sin acceso a costos, porque esos flujos requieren capturar costos.
              </div>
            ) : null}

            <div className="mt-6">
              {quotation.items.length === 0 ? (
                <EmptyState
                  description="Empieza agregando un producto de plantilla simulado o una linea comercial manual, y luego recalcula y versiona la cotizacion cuando estes conforme."
                  title="Todavia no hay items en la cotizacion"
                />
              ) : (
                <QuotationItemsTable
                  canEdit={isEditable && canUpdate}
                  canReorder={isEditable && canUpdate}
                  canViewCost={canViewCost}
                  currency={quotation.currency}
                  items={quotation.items}
                  onDelete={(item) => {
                    setItemToDelete(item);
                  }}
                  onEdit={openEditModal}
                  onMoveDown={(item) => {
                    void runAction("reorder", async () => {
                      const currentIndex = quotation.items.findIndex(
                        (record) => record.id === item.id,
                      );

                      if (
                        currentIndex < 0 ||
                        currentIndex >= quotation.items.length - 1
                      ) {
                        return;
                      }

                      const nextItems = [...quotation.items];
                      const swapIndex = currentIndex + 1;
                      const currentItem = nextItems[currentIndex];
                      const nextItem = nextItems[swapIndex];

                      nextItems[currentIndex] = nextItem;
                      nextItems[swapIndex] = currentItem;

                      for (const [index, record] of nextItems.entries()) {
                        if (record.sortOrder !== index) {
                          await quotationService.updateQuotationItem(record.id, {
                            sortOrder: index,
                          });
                        }
                      }

                      const updatedQuotation = await quotationService.getQuotationById(
                        quotation.id,
                      );
                      await syncQuotation(updatedQuotation, "Los items de la cotizacion fueron reordenados.");
                    });
                  }}
                  onMoveUp={(item) => {
                    void runAction("reorder", async () => {
                      const currentIndex = quotation.items.findIndex(
                        (record) => record.id === item.id,
                      );

                      if (currentIndex <= 0) {
                        return;
                      }

                      const nextItems = [...quotation.items];
                      const swapIndex = currentIndex - 1;
                      const currentItem = nextItems[currentIndex];
                      const previousItem = nextItems[swapIndex];

                      nextItems[currentIndex] = previousItem;
                      nextItems[swapIndex] = currentItem;

                      for (const [index, record] of nextItems.entries()) {
                        if (record.sortOrder !== index) {
                          await quotationService.updateQuotationItem(record.id, {
                            sortOrder: index,
                          });
                        }
                      }

                      const updatedQuotation = await quotationService.getQuotationById(
                        quotation.id,
                      );
                      await syncQuotation(updatedQuotation, "Los items de la cotizacion fueron reordenados.");
                    });
                  }}
                />
              )}
            </div>
          </section>

          <div className="space-y-6">
            <section className={sectionClassName}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Approval Warnings
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Review before submission
                </h2>
              </div>

              <div className="mt-5 space-y-3">
                {approvalWarnings.length === 0 ? (
                  <div className="rounded-lg bg-stone-50 px-4 py-4 text-sm text-stone-600">
                    No seeded approval triggers are currently visible in the builder.
                    Server-side rules still run when the quotation is submitted.
                  </div>
                ) : (
                  approvalWarnings.map((warning) => (
                    <div
                      key={warning.title}
                      className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700" />
                        <div>
                          <p className="font-semibold text-amber-900">{warning.title}</p>
                          <p className="mt-1 text-sm leading-7 text-amber-900/90">
                            {warning.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {canApprove && isEditable ? (
                <div className="mt-5">
                  <button
                    className={secondaryButtonClassName}
                    disabled={isBusy || !hasItems}
                    onClick={() => {
                      if (typeof window === "undefined") {
                        return;
                      }

                      const manualReason = window.prompt(
                        "Reason for manual review request",
                      );

                      if (manualReason === null) {
                        return;
                      }

                      void runAction("manual-review", async () => {
                        const result = await quotationService.submitApproval(quotation.id, {
                          forceManualReview: true,
                          reason: manualReason || null,
                        });
                        await syncQuotation(
                          result.quotation,
                          "Solicitud de revisión manual enviada.",
                        );
                      });
                    }}
                    type="button"
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Request Manual Review
                  </button>
                </div>
              ) : null}
            </section>

            <section className={sectionClassName}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Notas
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Contexto comercial
                </h2>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-md bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Notas visibles para el cliente
                  </p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    {quotation.notes || "Todavia no se agregaron notas publicas."}
                  </p>
                </div>
                <div className="rounded-md bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Notas internas
                  </p>
                  <p className="mt-2 text-sm leading-7 text-stone-700">
                    {quotation.internalNotes || "Todavia no se agregaron notas internas."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {templateDraft ? (
        <ModalShell
          description="Elige una plantilla de producto, fija la version activa actual en la linea de cotizacion, simula el resultado y agrégalo al desglose de costos."
          onClose={resetModalState}
          title="Agregar producto de plantilla"
        >
          <div className="space-y-6">
            {templateOptions.length === 0 ? (
              <EmptyState
                description="Todavia no hay versiones activas de plantillas de producto. Activa una version y luego vuelve al cotizador."
                title="No hay plantillas activas"
              />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Plantilla de producto</span>
                    <select
                      className={fieldClassName}
                      disabled={isBusy}
                      onChange={(event) => {
                        const nextTemplate =
                          templateOptions.find(
                            (template) => template.id === event.target.value,
                          ) ?? null;

                        setTemplatePreview(null);
                        setTemplateDraft((current) =>
                          current
                            ? {
                                ...current,
                                inputValues: {},
                                name: nextTemplate?.name ?? "",
                                productTemplateVersionId:
                                  nextTemplate?.currentVersionId ?? "",
                                templateId: event.target.value,
                              }
                            : current,
                        );
                      }}
                      value={templateDraft.templateId}
                    >
                      <option value="">Seleccionar plantilla</option>
                      {templateOptions.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.code} · {template.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Version activa</span>
                    <select
                      className={fieldClassName}
                      disabled
                      value={templateDraft.productTemplateVersionId}
                    >
                      <option value={templateDraft.productTemplateVersionId}>
                        {selectedTemplate?.currentVersion
                          ? `V${selectedTemplate.currentVersion.versionNumber} · ${selectedTemplate.currentVersion.name}`
                          : "Selecciona una plantilla primero"}
                      </option>
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Nombre del item</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      onChange={(event) => {
                        setTemplateDraft((current) =>
                          current ? { ...current, name: event.target.value } : current,
                        );
                      }}
                      value={templateDraft.name}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Cantidad</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      min="0.0001"
                      onChange={(event) => {
                        setTemplateDraft((current) =>
                          current ? { ...current, quantity: event.target.value } : current,
                        );
                      }}
                      step="0.0001"
                      type="number"
                      value={templateDraft.quantity}
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Descripcion</span>
                  <textarea
                    className={textAreaClassName}
                    disabled={isBusy}
                    onChange={(event) => {
                      setTemplateDraft((current) =>
                        current
                          ? { ...current, description: event.target.value }
                          : current,
                      );
                    }}
                    value={templateDraft.description}
                  />
                </label>

                {activeTemplateVersionQuery.isError ? (
                  <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {activeTemplateVersionQuery.error.message}
                  </div>
                ) : activeTemplateVersionQuery.isLoading ? (
                  <div className="rounded-lg bg-stone-50 px-4 py-4 text-sm text-stone-600">
                    Cargando entradas de plantilla...
                  </div>
                ) : activeTemplateVersion?.inputs.length ? (
                  <section className="rounded-lg border border-stone-200 bg-stone-50/60 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                        Entradas dinamicas
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-stone-950">
                        Fijado a la version {activeTemplateVersion.versionNumber}
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {activeTemplateVersion.inputs.map((input) => (
                        <label key={input.id} className="space-y-2">
                          <span className="text-sm font-medium text-stone-700">
                            {input.label}
                            {input.unit ? ` (${input.unit})` : ""}
                          </span>
                          {renderTemplateInputField(
                            input,
                            resolvedTemplateInputValues,
                            (nextValue) => {
                              setTemplatePreview(null);
                              setTemplateDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      inputValues: {
                                        ...(Object.keys(current.inputValues).length > 0
                                          ? current.inputValues
                                          : resolvedTemplateInputValues),
                                        [input.key]: nextValue,
                                      },
                                    }
                                  : current,
                              );
                            },
                          )}
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {templatePreview ? (
                  <section className="rounded-lg border border-emerald-200/70 bg-emerald-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          Resultado de simulacion
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-emerald-950">
                          Simulacion lista
                        </h3>
                      </div>
                      <span className="text-xs text-emerald-800">
                        {templatePreview.resultJson.materials.length} filas de material
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {canViewCost ? (
                        <div className="rounded-md bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            Costo total
                          </p>
                          <p className="mt-2 font-semibold text-stone-950">
                            {formatQuotationCurrency(
                              templatePreview.resultJson.totalCost,
                              quotation.currency,
                            )}
                          </p>
                        </div>
                      ) : null}
                      <div className="rounded-md bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                          Venta sugerida
                        </p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatQuotationCurrency(
                            templatePreview.resultJson.suggestedSalePrice,
                            quotation.currency,
                          )}
                        </p>
                      </div>
                      {canViewCost ? (
                        <div className="rounded-md bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            Margen
                          </p>
                          <p className="mt-2 font-semibold text-stone-950">
                            {formatQuotationPercent(templatePreview.resultJson.marginPercent)}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    {templatePreview.resultJson.warnings.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {templatePreview.resultJson.warnings.map((warning, index) => (
                          <p
                            key={`${warning}-${index}`}
                            className="rounded-md bg-white px-4 py-3 text-sm text-stone-700"
                          >
                            {warning}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    className={secondaryButtonClassName}
                    disabled={isBusy || !templateDraft.productTemplateVersionId}
                    onClick={() => {
                      void runAction("preview-template", async () => {
                        if (!templateDraft.productTemplateVersionId) {
                          throw new Error("Selecciona primero una version activa de plantilla.");
                        }

                        const preview =
                          await productTemplateService.simulateTemplateVersion(
                            templateDraft.productTemplateVersionId,
                            resolvedTemplateInputValues,
                          );
                        setTemplatePreview(preview);
                        setBuilderMessage("La vista previa de la plantilla fue actualizada.");
                      });
                    }}
                    type="button"
                  >
                    Simular calculo
                  </button>
                  <button
                    className={primaryButtonClassName}
                    disabled={isBusy || !templateDraft.productTemplateVersionId}
                    onClick={() => {
                      void runAction("add-template-item", async () => {
                        const quantity = parseRequiredPositiveNumber(
                          templateDraft.quantity,
                          "Cantidad",
                        );

                        const updatedQuotation = await quotationService.addTemplateItem(
                          quotation.id,
                          {
                            inputValues: resolvedTemplateInputValues,
                            name: templateDraft.name.trim(),
                            productTemplateVersionId:
                              templateDraft.productTemplateVersionId,
                            quantity,
                          },
                        );
                        resetModalState();
                        await syncQuotation(
                          updatedQuotation,
                          "Se agrego el item de plantilla a la cotizacion.",
                        );
                      });
                    }}
                    type="button"
                  >
                    Agregar item
                  </button>
                </div>
              </>
            )}
          </div>
        </ModalShell>
      ) : null}

      {manualMaterialDraft ? (
        <ModalShell
          description="Agrega una linea de material con precio manual para excepciones, accesorios personalizados o conceptos fuera de plantilla."
          onClose={resetModalState}
          title="Agregar material manual"
        >
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Material</span>
                <select
                  className={fieldClassName}
                  disabled={isBusy}
                  onChange={(event) => {
                    const selectedMaterial =
                      (materialsQuery.data ?? []).find(
                        (material) => material.id === event.target.value,
                      ) ?? null;

                    setManualMaterialDraft((current) =>
                      current
                        ? {
                            ...current,
                            materialId: event.target.value,
                            name: selectedMaterial?.name ?? current.name,
                            unit: selectedMaterial?.consumptionUnit ?? current.unit,
                          }
                        : current,
                    );
                  }}
                  value={manualMaterialDraft.materialId}
                >
                  <option value="">Seleccionar material</option>
                  {(materialsQuery.data ?? []).map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Nombre de linea</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  onChange={(event) => {
                    setManualMaterialDraft((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    );
                  }}
                  value={manualMaterialDraft.name}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className={textAreaClassName}
                disabled={isBusy}
                onChange={(event) => {
                  setManualMaterialDraft((current) =>
                    current
                      ? { ...current, description: event.target.value }
                      : current,
                  );
                }}
                value={manualMaterialDraft.description}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cantidad</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0.0001"
                  onChange={(event) => {
                    setManualMaterialDraft((current) =>
                      current ? { ...current, quantity: event.target.value } : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={manualMaterialDraft.quantity}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Unidad</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  onChange={(event) => {
                    setManualMaterialDraft((current) =>
                      current ? { ...current, unit: event.target.value } : current,
                    );
                  }}
                  value={manualMaterialDraft.unit}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Costo unitario</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0.0001"
                  onChange={(event) => {
                    setManualMaterialDraft((current) =>
                      current ? { ...current, unitCost: event.target.value } : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={manualMaterialDraft.unitCost}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Precio de venta unitario</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0"
                  onChange={(event) => {
                    setManualMaterialDraft((current) =>
                      current
                        ? { ...current, unitSalePrice: event.target.value }
                        : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={manualMaterialDraft.unitSalePrice}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Margen %</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  max="99.99"
                  min="0"
                  onChange={(event) => {
                    setManualMaterialDraft((current) =>
                      current
                        ? { ...current, marginPercent: event.target.value }
                        : current,
                    );
                  }}
                  step="0.01"
                  type="number"
                  value={manualMaterialDraft.marginPercent}
                />
              </label>
            </div>

            {canReadSuppliers ? (
              suppliersQuery.isError ? (
                <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {suppliersQuery.error.message}
                </div>
              ) : (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Proveedor preferido</span>
                  <select
                    className={fieldClassName}
                    disabled={isBusy || suppliersQuery.isLoading}
                    onChange={(event) => {
                      setManualMaterialDraft((current) =>
                        current
                          ? { ...current, supplierId: event.target.value }
                          : current,
                      );
                    }}
                    value={manualMaterialDraft.supplierId}
                  >
                    <option value="">Sin proveedor</option>
                    {(suppliersQuery.data ?? []).map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.legalName}
                      </option>
                    ))}
                  </select>
                </label>
              )
            ) : null}

            <p className="text-sm text-stone-500">
              Ingresa un precio de venta unitario o un margen objetivo. El servidor calculara totales y reglas de aprobacion despues de guardar el item.
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                className={primaryButtonClassName}
                disabled={isBusy}
                onClick={() => {
                  void runAction("add-manual-material", async () => {
                    const quantity = parseRequiredPositiveNumber(
                      manualMaterialDraft.quantity,
                      "Cantidad",
                    );
                    const unitCost = parsePositiveUnitCost(
                      manualMaterialDraft.unitCost,
                    );
                    const unitSalePrice = parseOptionalSalePrice(
                      manualMaterialDraft.unitSalePrice,
                    );
                    const marginPercent = parseOptionalMarginPercent(
                      manualMaterialDraft.marginPercent,
                    );

                    if (marginPercent === null && unitSalePrice === null) {
                      throw new Error("Ingresa un precio de venta unitario o un margen.");
                    }

                    const updatedQuotation =
                      await quotationService.addManualMaterialItem(quotation.id, {
                        description:
                          manualMaterialDraft.description.trim() || null,
                        marginPercent,
                        materialId: manualMaterialDraft.materialId,
                        name: manualMaterialDraft.name.trim() || null,
                        quantity,
                        supplierId: manualMaterialDraft.supplierId || null,
                        unit: manualMaterialDraft.unit.trim(),
                        unitCost,
                        unitSalePrice,
                      });
                    resetModalState();
                    await syncQuotation(
                      updatedQuotation,
                      "Se agrego el material manual a la cotizacion.",
                    );
                  });
                }}
                type="button"
              >
                Agregar item
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {manualServiceDraft ? (
        <ModalShell
          description="Agrega una linea de servicio con precio manual para mano de obra excepcional, transporte o cargos comerciales especiales."
          onClose={resetModalState}
          title="Agregar servicio manual"
        >
          <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Nombre del servicio</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  onChange={(event) => {
                    setManualServiceDraft((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    );
                  }}
                  value={manualServiceDraft.name}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Unidad</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  onChange={(event) => {
                    setManualServiceDraft((current) =>
                      current ? { ...current, unit: event.target.value } : current,
                    );
                  }}
                  value={manualServiceDraft.unit}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className={textAreaClassName}
                disabled={isBusy}
                onChange={(event) => {
                  setManualServiceDraft((current) =>
                    current
                      ? { ...current, description: event.target.value }
                      : current,
                  );
                }}
                value={manualServiceDraft.description}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cantidad</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0.0001"
                  onChange={(event) => {
                    setManualServiceDraft((current) =>
                      current ? { ...current, quantity: event.target.value } : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={manualServiceDraft.quantity}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Costo unitario</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0.0001"
                  onChange={(event) => {
                    setManualServiceDraft((current) =>
                      current ? { ...current, unitCost: event.target.value } : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={manualServiceDraft.unitCost}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Precio de venta unitario</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0"
                  onChange={(event) => {
                    setManualServiceDraft((current) =>
                      current
                        ? { ...current, unitSalePrice: event.target.value }
                        : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={manualServiceDraft.unitSalePrice}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Margen %</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  max="99.99"
                  min="0"
                  onChange={(event) => {
                    setManualServiceDraft((current) =>
                      current
                        ? { ...current, marginPercent: event.target.value }
                        : current,
                    );
                  }}
                  step="0.01"
                  type="number"
                  value={manualServiceDraft.marginPercent}
                />
              </label>
            </div>

            <p className="text-sm text-stone-500">
              Deja uno de los campos de precio vacio si el otro debe gobernar el calculo del servidor.
            </p>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                className={primaryButtonClassName}
                disabled={isBusy}
                onClick={() => {
                  void runAction("add-manual-service", async () => {
                    const quantity = parseRequiredPositiveNumber(
                      manualServiceDraft.quantity,
                      "Cantidad",
                    );
                    const unitCost = parsePositiveUnitCost(
                      manualServiceDraft.unitCost,
                    );
                    const unitSalePrice = parseOptionalSalePrice(
                      manualServiceDraft.unitSalePrice,
                    );
                    const marginPercent = parseOptionalMarginPercent(
                      manualServiceDraft.marginPercent,
                    );

                    if (marginPercent === null && unitSalePrice === null) {
                      throw new Error("Ingresa un precio de venta unitario o un margen.");
                    }

                    const updatedQuotation =
                      await quotationService.addManualServiceItem(quotation.id, {
                        description:
                          manualServiceDraft.description.trim() || null,
                        marginPercent,
                        name: manualServiceDraft.name.trim(),
                        quantity,
                        unit: manualServiceDraft.unit.trim(),
                        unitCost,
                        unitSalePrice,
                      });
                    resetModalState();
                    await syncQuotation(
                      updatedQuotation,
                      "Se agrego el servicio manual a la cotizacion.",
                    );
                  });
                }}
                type="button"
              >
                Agregar item
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {editDraft ? (
        <ModalShell
          description="Actualiza la linea guardada de la cotizacion. Los productos de plantilla permanecen vinculados a la version especifica ya guardada."
          onClose={resetModalState}
          title="Editar item de cotizacion"
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Nombre de linea</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  onChange={(event) => {
                    setEditDraft((current) =>
                      current ? { ...current, name: event.target.value } : current,
                    );
                  }}
                  value={editDraft.name}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Cantidad</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  min="0.0001"
                  onChange={(event) => {
                    setEditDraft((current) =>
                      current
                        ? { ...current, quantity: event.target.value }
                        : current,
                    );
                  }}
                  step="0.0001"
                  type="number"
                  value={editDraft.quantity}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Descripcion</span>
              <textarea
                className={textAreaClassName}
                disabled={isBusy}
                onChange={(event) => {
                  setEditDraft((current) =>
                    current
                      ? { ...current, description: event.target.value }
                      : current,
                  );
                }}
                value={editDraft.description}
              />
            </label>

            {isTemplateEditDraft(editDraft) ? (
              <>
                <div className="rounded-lg border border-blue-200/70 bg-blue-50 px-4 py-4 text-sm text-blue-900">
                  Esta linea queda fijada a la version de plantilla{" "}
                  <span className="font-semibold">
                    {activeTemplateVersion?.versionNumber ?? "..." }
                  </span>
                  , incluso si la plantilla ya tiene versiones activas mas nuevas.
                </div>

                {activeTemplateVersionQuery.isError ? (
                  <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {activeTemplateVersionQuery.error.message}
                  </div>
                ) : activeTemplateVersionQuery.isLoading ? (
                  <div className="rounded-lg bg-stone-50 px-4 py-4 text-sm text-stone-600">
                    Cargando entradas de plantilla...
                  </div>
                ) : activeTemplateVersion?.inputs.length ? (
                  <section className="rounded-lg border border-stone-200 bg-stone-50/60 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                        Entradas de plantilla
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-stone-950">
                        Version {activeTemplateVersion.versionNumber}
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {activeTemplateVersion.inputs.map((input) => (
                        <label key={input.id} className="space-y-2">
                          <span className="text-sm font-medium text-stone-700">
                            {input.label}
                            {input.unit ? ` (${input.unit})` : ""}
                          </span>
                          {renderTemplateInputField(
                            input,
                            editDraft.inputValues,
                            (nextValue) => {
                              setEditTemplatePreview(null);
                              setEditDraft((current) =>
                                isTemplateEditDraft(current)
                                  ? {
                                      ...current,
                                      inputValues: {
                                        ...current.inputValues,
                                        [input.key]: nextValue,
                                      },
                                    }
                                  : current,
                              );
                            },
                          )}
                        </label>
                      ))}
                    </div>
                  </section>
                ) : null}

                {canOverrideCost ? (
                  <section className="rounded-lg border border-amber-200/70 bg-amber-50 p-5">
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
                        Ajuste manual de precios
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-amber-950">
                        Restringido a usuarios autorizados
                      </h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Margen %</span>
                        <input
                          className={fieldClassName}
                          disabled={isBusy || editDraft.clearManualOverride}
                          max="99.99"
                          min="0"
                          onChange={(event) => {
                            setEditDraft((current) =>
                              isTemplateEditDraft(current)
                                ? {
                                    ...current,
                                    overrideMarginPercent: event.target.value,
                                  }
                                : current,
                            );
                          }}
                          step="0.01"
                          type="number"
                          value={editDraft.overrideMarginPercent}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Ajuste de subtotal costo</span>
                        <input
                          className={fieldClassName}
                          disabled={isBusy || editDraft.clearManualOverride}
                          min="0"
                          onChange={(event) => {
                            setEditDraft((current) =>
                              isTemplateEditDraft(current)
                                ? {
                                    ...current,
                                    overrideSubtotalCost: event.target.value,
                                  }
                                : current,
                            );
                          }}
                          step="0.0001"
                          type="number"
                          value={editDraft.overrideSubtotalCost}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Ajuste de subtotal venta</span>
                        <input
                          className={fieldClassName}
                          disabled={isBusy || editDraft.clearManualOverride}
                          min="0"
                          onChange={(event) => {
                            setEditDraft((current) =>
                              isTemplateEditDraft(current)
                                ? {
                                    ...current,
                                    overrideSubtotalSale: event.target.value,
                                  }
                                : current,
                            );
                          }}
                          step="0.0001"
                          type="number"
                          value={editDraft.overrideSubtotalSale}
                        />
                      </label>
                    </div>

                    <label className="mt-4 flex items-center gap-3 text-sm text-stone-700">
                      <input
                        checked={editDraft.clearManualOverride}
                        className="h-4 w-4 rounded border-stone-300"
                        disabled={isBusy}
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isTemplateEditDraft(current)
                              ? {
                                  ...current,
                                  clearManualOverride: event.target.checked,
                                }
                              : current,
                          );
                        }}
                        type="checkbox"
                      />
                      Limpiar el ajuste manual actual y volver al precio simulado.
                    </label>
                  </section>
                ) : null}

                {editTemplatePreview ? (
                  <section className="rounded-lg border border-emerald-200/70 bg-emerald-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          Vista previa actualizada
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-emerald-950">
                          Simulacion lista
                        </h3>
                      </div>
                      <span className="text-xs text-emerald-800">
                        {editTemplatePreview.resultJson.materials.length} filas de material
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {canViewCost ? (
                        <div className="rounded-md bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            Costo total
                          </p>
                          <p className="mt-2 font-semibold text-stone-950">
                            {formatQuotationCurrency(
                              editTemplatePreview.resultJson.totalCost,
                              quotation.currency,
                            )}
                          </p>
                        </div>
                      ) : null}
                      <div className="rounded-md bg-white px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                          Venta sugerida
                        </p>
                        <p className="mt-2 font-semibold text-stone-950">
                          {formatQuotationCurrency(
                            editTemplatePreview.resultJson.suggestedSalePrice,
                            quotation.currency,
                          )}
                        </p>
                      </div>
                      {canViewCost ? (
                        <div className="rounded-md bg-white px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            Margen
                          </p>
                          <p className="mt-2 font-semibold text-stone-950">
                            {formatQuotationPercent(editTemplatePreview.resultJson.marginPercent)}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    className={secondaryButtonClassName}
                    disabled={isBusy || !editDraft.productTemplateVersionId}
                    onClick={() => {
                      void runAction("preview-edit-template", async () => {
                        const preview =
                          await productTemplateService.simulateTemplateVersion(
                            editDraft.productTemplateVersionId,
                            editDraft.inputValues,
                          );
                        setEditTemplatePreview(preview);
                        setBuilderMessage("La vista previa de la plantilla fue actualizada.");
                      });
                    }}
                    type="button"
                  >
                    Simular calculo
                  </button>
                  <button
                    className={primaryButtonClassName}
                    disabled={isBusy}
                    onClick={() => {
                      void runAction("update-item", async () => {
                        const quantity = parseRequiredPositiveNumber(
                          editDraft.quantity,
                          "Cantidad",
                        );
                        const hasOverrideValues =
                          editDraft.overrideMarginPercent.trim() !== "" ||
                          editDraft.overrideSubtotalCost.trim() !== "" ||
                          editDraft.overrideSubtotalSale.trim() !== "";

                        const updatedQuotation =
                          await quotationService.updateQuotationItem(editDraft.itemId, {
                            clearManualOverride:
                              editDraft.clearManualOverride || undefined,
                            description: editDraft.description.trim() || null,
                            inputValues: editDraft.inputValues,
                            marginPercent:
                              !editDraft.clearManualOverride && hasOverrideValues
                                ? parseOptionalMarginPercent(
                                    editDraft.overrideMarginPercent,
                                  )
                                : undefined,
                            name: editDraft.name.trim(),
                            quantity,
                            unitCost:
                              !editDraft.clearManualOverride && hasOverrideValues
                                ? parseOptionalNumber(editDraft.overrideSubtotalCost)
                                : undefined,
                            unitSalePrice:
                              !editDraft.clearManualOverride && hasOverrideValues
                                ? parseOptionalSalePrice(
                                    editDraft.overrideSubtotalSale,
                                  )
                                : undefined,
                        });
                        resetModalState();
                        await syncQuotation(updatedQuotation, "El item de la cotizacion fue actualizado.");
                      });
                    }}
                    type="button"
                  >
                    Guardar cambios
                  </button>
                </div>
              </>
            ) : null}

            {isManualMaterialEditDraft(editDraft) ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {canViewCost ? (
                    <>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Material</span>
                        <select
                          className={fieldClassName}
                          disabled={isBusy}
                          onChange={(event) => {
                            const selectedMaterial =
                              (materialsQuery.data ?? []).find(
                                (material) => material.id === event.target.value,
                              ) ?? null;

                            setEditDraft((current) =>
                              isManualMaterialEditDraft(current)
                                ? {
                                    ...current,
                                    materialId: event.target.value,
                                    unit:
                                      selectedMaterial?.consumptionUnit ?? current.unit,
                                  }
                                : current,
                            );
                          }}
                          value={editDraft.materialId}
                        >
                          <option value="">Seleccionar material</option>
                          {(materialsQuery.data ?? []).map((material) => (
                            <option key={material.id} value={material.id}>
                              {material.name} ({material.code})
                            </option>
                          ))}
                        </select>
                      </label>

                      {canReadSuppliers ? (
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-stone-700">Proveedor preferido</span>
                          <select
                            className={fieldClassName}
                            disabled={isBusy || suppliersQuery.isLoading}
                            onChange={(event) => {
                              setEditDraft((current) =>
                                isManualMaterialEditDraft(current)
                                  ? { ...current, supplierId: event.target.value }
                                  : current,
                              );
                            }}
                            value={editDraft.supplierId}
                          >
                            <option value="">Sin proveedor</option>
                            {(suppliersQuery.data ?? []).map((supplier) => (
                              <option key={supplier.id} value={supplier.id}>
                                {supplier.legalName}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}
                    </>
                  ) : (
                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                      La configuracion sensible a costos del material esta oculta para tu rol. Aun puedes actualizar nombre, descripcion y cantidad.
                    </div>
                  )}
                </div>

                {canViewCost ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Unidad</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualMaterialEditDraft(current)
                              ? { ...current, unit: event.target.value }
                              : current,
                          );
                        }}
                        value={editDraft.unit}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Costo unitario</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        min="0"
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualMaterialEditDraft(current)
                              ? { ...current, unitCost: event.target.value }
                              : current,
                          );
                        }}
                        step="0.0001"
                        type="number"
                        value={editDraft.unitCost}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Precio de venta unitario</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        min="0"
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualMaterialEditDraft(current)
                              ? { ...current, unitSalePrice: event.target.value }
                              : current,
                          );
                        }}
                        step="0.0001"
                        type="number"
                        value={editDraft.unitSalePrice}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Margin %</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        max="99.99"
                        min="0"
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualMaterialEditDraft(current)
                              ? { ...current, marginPercent: event.target.value }
                              : current,
                          );
                        }}
                        step="0.01"
                        type="number"
                        value={editDraft.marginPercent}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={isBusy}
                    onClick={() => {
                      void runAction("update-item", async () => {
                        const quantity = parseRequiredPositiveNumber(
                          editDraft.quantity,
                          "Cantidad",
                        );
                        const updatedQuotation =
                          await quotationService.updateQuotationItem(editDraft.itemId, {
                            description: editDraft.description.trim() || null,
                            marginPercent: canViewCost
                              ? parseOptionalMarginPercent(editDraft.marginPercent)
                              : undefined,
                            materialId: canViewCost ? editDraft.materialId : undefined,
                            name: editDraft.name.trim(),
                            quantity,
                            supplierId: canViewCost
                              ? editDraft.supplierId || null
                              : undefined,
                            unit: canViewCost ? editDraft.unit.trim() : undefined,
                            unitCost: canViewCost
                              ? (() => {
                                  const parsed = parseOptionalNumber(editDraft.unitCost);

                                  if (parsed !== null && parsed < 0) {
                                    throw new Error("El costo unitario no puede ser negativo.");
                                  }

                                  return parsed;
                                })()
                              : undefined,
                            unitSalePrice: canViewCost
                              ? parseOptionalSalePrice(editDraft.unitSalePrice)
                              : undefined,
                          });
                        resetModalState();
                        await syncQuotation(updatedQuotation, "El item de la cotizacion fue actualizado.");
                      });
                    }}
                    type="button"
                  >
                    Guardar cambios
                  </button>
                </div>
              </>
            ) : null}

            {isManualServiceEditDraft(editDraft) ? (
              <>
                {canViewCost ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Unidad</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualServiceEditDraft(current)
                              ? { ...current, unit: event.target.value }
                              : current,
                          );
                        }}
                        value={editDraft.unit}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Costo unitario</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        min="0"
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualServiceEditDraft(current)
                              ? { ...current, unitCost: event.target.value }
                              : current,
                          );
                        }}
                        step="0.0001"
                        type="number"
                        value={editDraft.unitCost}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Precio de venta unitario</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        min="0"
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualServiceEditDraft(current)
                              ? { ...current, unitSalePrice: event.target.value }
                              : current,
                          );
                        }}
                        step="0.0001"
                        type="number"
                        value={editDraft.unitSalePrice}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-stone-700">Margen %</span>
                      <input
                        className={fieldClassName}
                        disabled={isBusy}
                        max="99.99"
                        min="0"
                        onChange={(event) => {
                          setEditDraft((current) =>
                            isManualServiceEditDraft(current)
                              ? { ...current, marginPercent: event.target.value }
                              : current,
                          );
                        }}
                        step="0.01"
                        type="number"
                        value={editDraft.marginPercent}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
                    La configuracion sensible a costos del servicio esta oculta para tu rol. Aun puedes actualizar nombre, descripcion y cantidad.
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    className={primaryButtonClassName}
                    disabled={isBusy}
                    onClick={() => {
                      void runAction("update-item", async () => {
                        const quantity = parseRequiredPositiveNumber(
                          editDraft.quantity,
                          "Cantidad",
                        );
                        const updatedQuotation =
                          await quotationService.updateQuotationItem(editDraft.itemId, {
                            description: editDraft.description.trim() || null,
                            marginPercent: canViewCost
                              ? parseOptionalMarginPercent(editDraft.marginPercent)
                              : undefined,
                            name: editDraft.name.trim(),
                            quantity,
                            unit: canViewCost ? editDraft.unit.trim() : undefined,
                            unitCost: canViewCost
                              ? (() => {
                                  const parsed = parseOptionalNumber(editDraft.unitCost);

                                  if (parsed !== null && parsed < 0) {
                                    throw new Error("El costo unitario no puede ser negativo.");
                                  }

                                  return parsed;
                                })()
                              : undefined,
                            unitSalePrice: canViewCost
                              ? parseOptionalSalePrice(editDraft.unitSalePrice)
                              : undefined,
                          });
                        resetModalState();
                        await syncQuotation(updatedQuotation, "El item de la cotizacion fue actualizado.");
                      });
                    }}
                    type="button"
                  >
                    Guardar cambios
                  </button>
                </div>
              </>
            ) : null}

            {!isTemplateEditDraft(editDraft) &&
            !isManualMaterialEditDraft(editDraft) &&
            !isManualServiceEditDraft(editDraft) ? (
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  className={primaryButtonClassName}
                  disabled={isBusy}
                  onClick={() => {
                    void runAction("update-item", async () => {
                      const quantity = parseRequiredPositiveNumber(
                        editDraft.quantity,
                        "Cantidad",
                      );
                      const updatedQuotation = await quotationService.updateQuotationItem(
                        editDraft.itemId,
                        {
                          description: editDraft.description.trim() || null,
                          name: editDraft.name.trim(),
                          quantity,
                        },
                      );
                      resetModalState();
                      await syncQuotation(updatedQuotation, "El item de la cotizacion fue actualizado.");
                    });
                  }}
                  type="button"
                >
                  Guardar cambios
                </button>
              </div>
            ) : null}
          </div>
        </ModalShell>
      ) : null}

      <ConfirmDialog
        confirmLabel="Eliminar item"
        description={
          itemToDelete
            ? `Se eliminara ${itemToDelete.name} de ${quotation.code} y se recalcularan los totales inmediatamente.`
            : ""
        }
        isLoading={pendingAction === "delete-item"}
        onConfirm={() => {
          if (!itemToDelete) {
            return;
          }

          void runAction("delete-item", async () => {
            const updatedQuotation = await quotationService.deleteQuotationItem(
              itemToDelete.id,
            );
            setItemToDelete(null);
            await syncQuotation(updatedQuotation, "El item de la cotizacion fue eliminado.");
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setItemToDelete(null);
          }
        }}
        open={Boolean(itemToDelete)}
        title="¿Eliminar item de cotizacion?"
      />
    </>
  );
}
