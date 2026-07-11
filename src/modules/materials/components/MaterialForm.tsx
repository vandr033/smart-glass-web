"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { getApiErrorMessage } from "@/utils";

import {
  MATERIALS_ROUTES,
  MATERIAL_STATUS_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  MATERIAL_UNIT_OPTIONS,
} from "../constants";
import {
  EMPTY_MATERIAL_FORM_VALUES,
  materialFormSchema,
  type MaterialFormValues,
  useMaterials,
} from "../hooks/useMaterials";

type MaterialFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      materialId: string;
    };

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

const fieldClassName =
  "w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70";

const labelClassName = "space-y-2";

const checkboxCardClassName =
  "rounded-md border border-stone-200/90 bg-white/80 px-4 py-4";

const sectionHeader = (
  step: string,
  title: string,
  description?: string,
) => (
  <div className="mb-6 space-y-1">
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
      {step}
    </p>
    <h3 className="text-xl font-semibold text-stone-950">{title}</h3>
    {description ? (
      <p className="text-sm leading-7 text-stone-700">{description}</p>
    ) : null}
  </div>
);

export function MaterialForm(props: MaterialFormProps) {
  const router = useRouter();
  const {
    getMaterialBehaviorSummary,
    mapRecordToFormValues,
    useCreateMaterial,
    useMaterial,
    useMaterialCategories,
    useUpdateMaterial,
  } = useMaterials();
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const categoriesQuery = useMaterialCategories();
  const materialQuery = useMaterial(props.mode === "edit" ? props.materialId : "");

  const form = useForm<MaterialFormValues>({
    defaultValues: EMPTY_MATERIAL_FORM_VALUES,
    resolver: zodResolver(materialFormSchema) as Resolver<MaterialFormValues>,
  });

  const materialType = useWatch({
    control: form.control,
    name: "materialType",
  });
  const isCuttable = useWatch({
    control: form.control,
    name: "isCuttable",
  });
  const isRemnantEligible = useWatch({
    control: form.control,
    name: "isRemnantEligible",
  });
  const [
    isStockable,
    minimumReusableHeightMm,
    minimumReusableLengthMm,
    minimumReusableWidthMm,
    standardLengthMm,
    standardWidthMm,
    unitConversionJsonText,
  ] = useWatch({
    control: form.control,
    name: [
      "isStockable",
      "minimumReusableHeightMm",
      "minimumReusableLengthMm",
      "minimumReusableWidthMm",
      "standardLengthMm",
      "standardWidthMm",
      "unitConversionJsonText",
    ],
  });
  const behaviorSummary = getMaterialBehaviorSummary({
    isCuttable,
    isRemnantEligible,
    isStockable,
    materialType,
    minimumReusableHeightMm,
    minimumReusableLengthMm,
    minimumReusableWidthMm,
    standardLengthMm,
    standardWidthMm,
    unitConversionJsonText,
  });

  useEffect(() => {
    if (props.mode !== "edit" || !materialQuery.data) {
      return;
    }

    form.reset(mapRecordToFormValues(materialQuery.data));
  }, [form, mapRecordToFormValues, materialQuery.data, props.mode]);

  useEffect(() => {
    if (materialType !== "SERVICE") {
      return;
    }

    form.setValue("isStockable", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("isCuttable", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("isRemnantEligible", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("allowsRotation", false, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, materialType]);

  if (props.mode === "edit" && materialQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void materialQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={materialQuery.error.message}
        title="Material details could not be loaded"
      />
    );
  }

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void categoriesQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={categoriesQuery.error.message}
        title="Material categories could not be loaded"
      />
    );
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    categoriesQuery.isLoading ||
    (props.mode === "edit" && materialQuery.isLoading);
  const typeDefinition = MATERIAL_TYPE_OPTIONS.find((option) => option.value === materialType);
  const showLinearFields = materialType === "LINEAR";
  const showSheetFields = materialType === "SHEET";
  const showPackageFields = materialType === "PACKAGE";
  const showUnitAdvancedFields =
    materialType === "UNIT" && (isCuttable || isRemnantEligible);

  const getFieldError = (name: keyof MaterialFormValues): string | null => {
    const issue = form.formState.errors[name];

    return issue?.message ? String(issue.message) : null;
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const material =
            props.mode === "create"
              ? await createMutation.mutateAsync(values)
              : await updateMutation.mutateAsync({
                  materialId: props.materialId,
                  values,
                });

          router.push(MATERIALS_ROUTES.view(material.id));
          router.refresh();
        } catch (error) {
          form.setError("root", {
            message: getApiErrorMessage(error),
          });
        }
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              {props.mode === "create" ? "Crear material" : "Editar material"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create" ? "Add a catalog material" : "Update material details"}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Maintain the master catalog attributes, units, and cutting behavior that future
              quotation, inventory, optimization, and purchasing flows will depend on.
            </p>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            href={
              props.mode === "create"
                ? MATERIALS_ROUTES.list
                : MATERIALS_ROUTES.view(props.materialId)
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "1. General Information",
          "Core catalog identity",
          "Use stable internal codes and names so downstream imports, pricing, and optimization jobs can reference this material consistently.",
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Code</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("code")} />
            {getFieldError("code") ? (
              <span className="block text-sm text-rose-700">{getFieldError("code")}</span>
            ) : null}
          </label>

          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Name</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("name")} />
            {getFieldError("name") ? (
              <span className="mt-2 block text-sm text-rose-700">{getFieldError("name")}</span>
            ) : null}
          </label>

          <label className="md:col-span-2 xl:col-span-4">
            <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
            <textarea
              className={`${fieldClassName} min-h-28`}
              disabled={isBusy}
              {...form.register("description")}
            />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "2. Classification",
          "Material family and visible attributes",
          typeDefinition?.description,
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Category</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("categoryId")}
            >
              <option value="">Seleccione una categoría</option>
              {(categoriesQuery.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {getFieldError("categoryId") ? (
              <span className="block text-sm text-rose-700">
                {getFieldError("categoryId")}
              </span>
            ) : null}
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Material type</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("materialType")}
            >
              {MATERIAL_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Status</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("status")}
            >
              {MATERIAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Color</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("color")} />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Finish</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("finish")} />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Brand</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("brand")} />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "3. Units",
          "Base, purchasing, stock, and consumption units",
          "Define how the material is measured operationally today so later modules can convert usage safely.",
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Base unit</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("baseUnit")}>
              {MATERIAL_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Purchase unit</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("purchaseUnit")}
            >
              {MATERIAL_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Stock unit</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("stockUnit")}
            >
              {MATERIAL_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Consumption unit</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("consumptionUnit")}
            >
              {MATERIAL_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {showPackageFields ? (
            <label className="space-y-2 md:col-span-2 xl:col-span-4">
              <span className="text-sm font-medium text-stone-700">Unit conversion JSON</span>
              <textarea
                className={`${fieldClassName} min-h-36 font-mono text-xs`}
                disabled={isBusy}
                {...form.register("unitConversionJsonText")}
                placeholder='{"unitsPerPackage": 1, "unitLabel": "cartridge"}'
              />
              {getFieldError("unitConversionJsonText") ? (
                <span className="block text-sm text-rose-700">
                  {getFieldError("unitConversionJsonText")}
                </span>
              ) : null}
            </label>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "4. Stock And Purchasing Behavior",
          "Operational flags",
          "These toggles describe whether the material should participate in stock, purchasing, and sellable catalog flows.",
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className={checkboxCardClassName}>
            <div className="flex items-start gap-3">
              <input
                className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                disabled={isBusy || materialType === "SERVICE"}
                type="checkbox"
                {...form.register("isStockable")}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Stockable</p>
                <p className="text-xs text-stone-600">
                  Track this material as inventory or remaining stock.
                </p>
              </div>
            </div>
          </label>

          <label className={checkboxCardClassName}>
            <div className="flex items-start gap-3">
              <input
                className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                disabled={isBusy}
                type="checkbox"
                {...form.register("isPurchasable")}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Purchasable</p>
                <p className="text-xs text-stone-600">
                  Allow the item to participate in vendor purchasing flows later.
                </p>
              </div>
            </div>
          </label>

          <label className={checkboxCardClassName}>
            <div className="flex items-start gap-3">
              <input
                className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                disabled={isBusy}
                type="checkbox"
                {...form.register("isSellable")}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Sellable</p>
                <p className="text-xs text-stone-600">
                  Mark the material as directly usable in commercial outputs.
                </p>
              </div>
            </div>
          </label>

          {materialType === "SERVICE" ? (
            <div className={`${checkboxCardClassName} text-sm text-stone-700`}>
              Service materials automatically force `isStockable = false` and hide
              cut/remnant behavior.
            </div>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "5. Cutting Behavior",
          "How this material behaves when cut",
          "Linear and sheet materials usually expose cut-aware fields because they drive future optimization and remnant logic.",
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className={checkboxCardClassName}>
            <div className="flex items-start gap-3">
              <input
                className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                disabled={isBusy || materialType === "SERVICE"}
                type="checkbox"
                {...form.register("isCuttable")}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Cuttable</p>
                <p className="text-xs text-stone-600">
                  Enable when the material is consumed by cutting stock lengths or sheets.
                </p>
              </div>
            </div>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Default waste %</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("defaultWastePercent")}
            />
            {getFieldError("defaultWastePercent") ? (
              <span className="block text-sm text-rose-700">
                {getFieldError("defaultWastePercent")}
              </span>
            ) : null}
          </label>

          {showSheetFields ? (
            <label className={checkboxCardClassName}>
              <div className="flex items-start gap-3">
                <input
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                  disabled={isBusy}
                  type="checkbox"
                  {...form.register("allowsRotation")}
                />
                <div>
                  <p className="text-sm font-semibold text-stone-900">Allow rotation</p>
                  <p className="text-xs text-stone-600">
                    Permit future 2D optimization to rotate this sheet material.
                  </p>
                </div>
              </div>
            </label>
          ) : null}

          {materialType === "UNIT" && !showUnitAdvancedFields ? (
            <div className={`${checkboxCardClassName} text-sm text-stone-700`}>
              Unit materials keep cutting fields hidden until you explicitly enable a special
              cuttable or remnant workflow.
            </div>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "6. Remnant Rules",
          "Reusable leftovers and minimum salvage sizes",
          "Only LINEAR and SHEET materials should normally expose remnant recovery rules.",
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className={checkboxCardClassName}>
            <div className="flex items-start gap-3">
              <input
                className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-950"
                disabled={isBusy || materialType === "SERVICE"}
                type="checkbox"
                {...form.register("isRemnantEligible")}
              />
              <div>
                <p className="text-sm font-semibold text-stone-900">Remnant eligible</p>
                <p className="text-xs text-stone-600">
                  Preserve reusable leftovers for future remnant tracking.
                </p>
              </div>
            </div>
          </label>

          {showLinearFields && isRemnantEligible ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">
                Minimum reusable length (mm)
              </span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("minimumReusableLengthMm")}
              />
              {getFieldError("minimumReusableLengthMm") ? (
                <span className="block text-sm text-rose-700">
                  {getFieldError("minimumReusableLengthMm")}
                </span>
              ) : null}
            </label>
          ) : null}

          {showSheetFields && isRemnantEligible ? (
            <>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">
                  Minimum reusable width (mm)
                </span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("minimumReusableWidthMm")}
                />
                {getFieldError("minimumReusableWidthMm") ? (
                  <span className="block text-sm text-rose-700">
                    {getFieldError("minimumReusableWidthMm")}
                  </span>
                ) : null}
              </label>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">
                  Minimum reusable height (mm)
                </span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("minimumReusableHeightMm")}
                />
                {getFieldError("minimumReusableHeightMm") ? (
                  <span className="block text-sm text-rose-700">
                    {getFieldError("minimumReusableHeightMm")}
                  </span>
                ) : null}
              </label>
            </>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "7. Physical Dimensions",
          "Stock size and physical attributes",
          "Expose only the dimensional fields that matter for the current material behavior.",
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {showLinearFields ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Standard length (mm)</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("standardLengthMm")}
              />
              {getFieldError("standardLengthMm") ? (
                <span className="block text-sm text-rose-700">
                  {getFieldError("standardLengthMm")}
                </span>
              ) : null}
            </label>
          ) : null}

          {showSheetFields || showUnitAdvancedFields ? (
            <>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Standard length (mm)</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("standardLengthMm")}
                />
                {getFieldError("standardLengthMm") ? (
                  <span className="block text-sm text-rose-700">
                    {getFieldError("standardLengthMm")}
                  </span>
                ) : null}
              </label>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Standard width (mm)</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("standardWidthMm")}
                />
                {getFieldError("standardWidthMm") ? (
                  <span className="block text-sm text-rose-700">
                    {getFieldError("standardWidthMm")}
                  </span>
                ) : null}
              </label>
            </>
          ) : null}

          {showUnitAdvancedFields ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Standard height (mm)</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("standardHeightMm")}
              />
            </label>
          ) : null}

          {showSheetFields || showUnitAdvancedFields ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Thickness (mm)</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("thicknessMm")}
              />
            </label>
          ) : null}

          {!showLinearFields && !showSheetFields && !showUnitAdvancedFields ? (
            <div className="rounded-md border border-dashed border-stone-300 bg-white/60 px-4 py-5 text-sm text-stone-600 md:col-span-2 xl:col-span-4">
              This material type does not need explicit stock dimensions unless you enable a
              special cuttable or remnant workflow.
            </div>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "8. Notas",
          "Guia operativa y contexto futuro",
          "Guarda aqui notas de implementacion, observaciones de proveedores o lineamientos de uso hasta que existan modulos posteriores mas ricos.",
        )}

        <label className={labelClassName}>
          <span className="text-sm font-medium text-stone-700">Internal notes</span>
          <textarea
            className={`${fieldClassName} min-h-32`}
            disabled={isBusy}
            {...form.register("notes")}
          />
        </label>
      </section>

      {behaviorSummary.warnings.length > 0 ? (
        <section className="rounded-lg border border-blue-200/80 bg-blue-50 px-5 py-4 text-sm text-blue-900">
          <p className="font-semibold text-blue-950">Behavior recommendations</p>
          <ul className="mt-2 space-y-1">
            {behaviorSummary.warnings.map((warning) => (
              <li key={`${warning.path}:${warning.message}`}>{warning.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {form.formState.errors.root?.message ? (
        <section className="rounded-lg border border-rose-200/80 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {form.formState.errors.root.message}
        </section>
      ) : null}

      <div className="flex justify-end gap-3">
        <Link
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
          href={
            props.mode === "create"
              ? MATERIALS_ROUTES.list
              : MATERIALS_ROUTES.view(props.materialId)
          }
        >
          Cancel
        </Link>
        <button
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {isBusy ? "Guardando…" : props.mode === "create" ? "Crear material" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
