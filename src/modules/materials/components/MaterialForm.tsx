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
        title="No se pudieron cargar los detalles del material"
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
        title="No se pudieron cargar las categorías de materiales"
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
              {props.mode === "create" ? "Agregar material al catálogo" : "Actualizar detalles del material"}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Mantén los atributos maestros del catálogo, las unidades y el comportamiento de corte del que dependerán los futuros flujos de cotización, inventario, optimización y compras.
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
            Volver
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "1. Información general",
          "Identidad principal del catálogo",
          "Usa códigos y nombres internos estables para que las importaciones, los precios y las optimizaciones posteriores puedan referenciar este material de forma consistente.",
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Código</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("code")} />
            {getFieldError("code") ? (
              <span className="block text-sm text-rose-700">{getFieldError("code")}</span>
            ) : null}
          </label>

          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Nombre</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("name")} />
            {getFieldError("name") ? (
              <span className="mt-2 block text-sm text-rose-700">{getFieldError("name")}</span>
            ) : null}
          </label>

          <label className="md:col-span-2 xl:col-span-4">
            <span className="mb-2 block text-sm font-medium text-stone-700">Descripción</span>
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
          "2. Clasificación",
          "Familia del material y atributos visibles",
          typeDefinition?.description,
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Categoría</span>
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
            <span className="text-sm font-medium text-stone-700">Tipo de material</span>
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
            <span className="text-sm font-medium text-stone-700">Estado</span>
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
            <span className="text-sm font-medium text-stone-700">Acabado</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("finish")} />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Marca</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("brand")} />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "3. Units",
          "Unidades base, de compra, de existencias y de consumo",
          "Define cómo se mide operativamente el material para que los módulos posteriores conviertan el uso de forma segura.",
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Unidad base</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("baseUnit")}>
              {MATERIAL_UNIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Unidad de compra</span>
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
            <span className="text-sm font-medium text-stone-700">Unidad de existencias</span>
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
            <span className="text-sm font-medium text-stone-700">Unidad de consumo</span>
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
              <span className="text-sm font-medium text-stone-700">JSON de conversión de unidades</span>
              <textarea
                className={`${fieldClassName} min-h-36 font-mono text-xs`}
                disabled={isBusy}
                {...form.register("unitConversionJsonText")}
                placeholder='{"unitsPerPackage": 1, "unitLabel": "cartucho"}'
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
          "4. Comportamiento de existencias y compras",
          "Indicadores operativos",
          "Estos interruptores indican si el material participa en los flujos de existencias, compras y catálogo vendible.",
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
                <p className="text-sm font-semibold text-stone-900">Almacenable</p>
                <p className="text-xs text-stone-600">
                  Registra este material como existencias o remanente.
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
                <p className="text-sm font-semibold text-stone-900">Comprable</p>
                <p className="text-xs text-stone-600">
                  Permite que el ítem participe posteriormente en flujos de compra a proveedores.
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
                <p className="text-sm font-semibold text-stone-900">Vendible</p>
                <p className="text-xs text-stone-600">
                  Marca el material como utilizable directamente en resultados comerciales.
                </p>
              </div>
            </div>
          </label>

          {materialType === "SERVICE" ? (
            <div className={`${checkboxCardClassName} text-sm text-stone-700`}>
              Los materiales de servicio establecen automáticamente `isStockable = false` y ocultan
              el comportamiento de corte y remanentes.
            </div>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "5. Comportamiento de corte",
          "Cómo se comporta este material al cortarlo",
          "Los materiales lineales y de hoja suelen mostrar campos de corte porque impulsan la optimización futura y la lógica de remanentes.",
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
                <p className="text-sm font-semibold text-stone-900">Cortable</p>
                <p className="text-xs text-stone-600">
                  Habilita esta opción cuando el material se consuma cortando largos o hojas.
                </p>
              </div>
            </div>
          </label>

          <label className={labelClassName}>
          <span className="text-sm font-medium text-stone-700">Desperdicio predeterminado %</span>
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
                  <p className="text-sm font-semibold text-stone-900">Permitir rotación</p>
                  <p className="text-xs text-stone-600">
                    Permite que futuras optimizaciones 2D roten este material en hoja.
                  </p>
                </div>
              </div>
            </label>
          ) : null}

          {materialType === "UNIT" && !showUnitAdvancedFields ? (
            <div className={`${checkboxCardClassName} text-sm text-stone-700`}>
              Los materiales unitarios mantienen ocultos los campos de corte hasta que habilites
              explícitamente un flujo especial de corte o remanentes.
            </div>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        {sectionHeader(
          "6. Remnant Rules",
          "Sobras reutilizables y tamaños mínimos de recuperación",
          "Normalmente, solo los materiales LINEAR y SHEET deben mostrar reglas de recuperación de remanentes.",
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
          <p className="text-sm font-semibold text-stone-900">Elegible para remanentes</p>
                <p className="text-xs text-stone-600">
                  Conserva sobras reutilizables para el seguimiento futuro de remanentes.
                </p>
              </div>
            </div>
          </label>

          {showLinearFields && isRemnantEligible ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">
                  Largo mínimo reutilizable (mm)
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
                  Ancho mínimo reutilizable (mm)
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
                  Alto mínimo reutilizable (mm)
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
          "7. Dimensiones físicas",
          "Tamaño de existencias y atributos físicos",
          "Muestra solo los campos dimensionales relevantes para el comportamiento actual del material.",
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {showLinearFields ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Largo estándar (mm)</span>
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
                <span className="text-sm font-medium text-stone-700">Largo estándar (mm)</span>
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
                <span className="text-sm font-medium text-stone-700">Ancho estándar (mm)</span>
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
              <span className="text-sm font-medium text-stone-700">Alto estándar (mm)</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("standardHeightMm")}
              />
            </label>
          ) : null}

          {showSheetFields || showUnitAdvancedFields ? (
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Espesor (mm)</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("thicknessMm")}
              />
            </label>
          ) : null}

          {!showLinearFields && !showSheetFields && !showUnitAdvancedFields ? (
            <div className="rounded-md border border-dashed border-stone-300 bg-white/60 px-4 py-5 text-sm text-stone-600 md:col-span-2 xl:col-span-4">
              Este tipo de material no necesita dimensiones explícitas de existencias a menos que habilites
              un flujo especial de corte o remanentes.
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
          <span className="text-sm font-medium text-stone-700">Notas internas</span>
          <textarea
            className={`${fieldClassName} min-h-32`}
            disabled={isBusy}
            {...form.register("notes")}
          />
        </label>
      </section>

      {behaviorSummary.warnings.length > 0 ? (
        <section className="rounded-lg border border-blue-200/80 bg-blue-50 px-5 py-4 text-sm text-blue-900">
          <p className="font-semibold text-blue-950">Recomendaciones de comportamiento</p>
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
          Cancelar
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
