"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  type Resolver,
} from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
} from "@/modules/commercial/ui";
import { materialService } from "@/services/material-service";
import { productTemplateService } from "@/services/product-template-service";
import { getApiErrorMessage } from "@/utils";

import {
  mapVersionToRulesEditorValues,
  parseJsonText,
  productTemplateRulesEditorSchema,
  type ProductTemplateRulesEditorValues,
} from "../forms";
import {
  PRODUCT_TEMPLATE_INPUT_TYPE_OPTIONS,
  PRODUCT_TEMPLATE_LABOR_TYPE_OPTIONS,
  PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_OPTIONS,
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplateRulesEditorProps = {
  versionId: string;
};

const defaultFormulaJson = JSON.stringify(
  {
    type: "INPUT",
    key: "quantity",
  },
  null,
  2,
);

const emptyInput = {
  defaultValueJsonText: "null",
  inputType: "NUMBER" as const,
  isRequired: false,
  key: "",
  label: "",
  optionsJsonText: "null",
  sortOrder: 0,
  unit: null,
  validationJsonText: "null",
};

const emptyMaterialRule = {
  allowRemnantUse: true,
  allowRotation: false,
  formulaJsonText: JSON.stringify(
    {
      quantityFormula: {
        type: "CONSTANT",
        value: 1,
      },
      requiredLengthMmFormula: {
        type: "INPUT",
        key: "widthMm",
      },
    },
    null,
    2,
  ),
  isActive: true,
  label: "",
  materialId: "",
  ruleType: "LINEAR_CUT" as const,
  sortOrder: 0,
  wastePercent: null,
};

const emptyAccessoryRule = {
  isActive: true,
  isOptional: false,
  label: "",
  materialId: "",
  quantityFormulaJsonText: defaultFormulaJson,
  sortOrder: 0,
};

const emptyLaborRule = {
  formulaJsonText: JSON.stringify(
    {
      quantityFormula: {
        type: "CONSTANT",
        value: 1,
      },
    },
    null,
    2,
  ),
  isActive: true,
  label: "",
  laborType: "FABRICATION" as const,
  sortOrder: 0,
  unitCost: null,
};

export function ProductTemplateRulesEditor({
  versionId,
}: ProductTemplateRulesEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const versionQuery = useQuery({
    queryFn: async () => productTemplateService.getTemplateVersionById(versionId),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.version(versionId),
  });
  const materialsQuery = useQuery({
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
    queryKey: ["materials", "product-template-options"],
  });
  const updateMutation = useMutation({
    mutationFn: async (input: ProductTemplateRulesEditorValues) =>
      productTemplateService.updateTemplateVersionRules(versionId, {
        accessoryRules: input.accessoryRules.map((rule) => ({
          isActive: rule.isActive,
          isOptional: rule.isOptional,
          label: rule.label,
          materialId: rule.materialId,
          quantityFormulaJson: parseJsonText(rule.quantityFormulaJsonText) as never,
          sortOrder: rule.sortOrder,
        })),
        inputs: input.inputs.map((item) => ({
          defaultValueJson: parseJsonText(item.defaultValueJsonText) as never,
          inputType: item.inputType,
          isRequired: item.isRequired,
          key: item.key,
          label: item.label,
          optionsJson: parseJsonText(item.optionsJsonText) as never,
          sortOrder: item.sortOrder,
          unit: item.unit,
          validationJson: parseJsonText(item.validationJsonText) as never,
        })),
        laborRules: input.laborRules.map((rule) => ({
          formulaJson: parseJsonText(rule.formulaJsonText) as never,
          isActive: rule.isActive,
          label: rule.label,
          laborType: rule.laborType,
          sortOrder: rule.sortOrder,
          unitCost: rule.unitCost,
        })),
        materialRules: input.materialRules.map((rule) => ({
          allowRemnantUse: rule.allowRemnantUse,
          allowRotation: rule.allowRotation,
          formulaJson: parseJsonText(rule.formulaJsonText) as never,
          isActive: rule.isActive,
          label: rule.label,
          materialId: rule.materialId,
          ruleType: rule.ruleType,
          sortOrder: rule.sortOrder,
          wastePercent: rule.wastePercent,
        })),
      }),
  });

  const form = useForm<ProductTemplateRulesEditorValues>({
    defaultValues: {
      accessoryRules: [],
      inputs: [],
      laborRules: [],
      materialRules: [],
    },
    resolver: zodResolver(productTemplateRulesEditorSchema) as Resolver<ProductTemplateRulesEditorValues>,
  });

  const inputsFieldArray = useFieldArray({
    control: form.control,
    name: "inputs",
  });
  const materialRulesFieldArray = useFieldArray({
    control: form.control,
    name: "materialRules",
  });
  const accessoryRulesFieldArray = useFieldArray({
    control: form.control,
    name: "accessoryRules",
  });
  const laborRulesFieldArray = useFieldArray({
    control: form.control,
    name: "laborRules",
  });

  useEffect(() => {
    if (!versionQuery.data) {
      return;
    }

    form.reset(mapVersionToRulesEditorValues(versionQuery.data));
  }, [form, versionQuery.data]);

  if (versionQuery.isLoading || materialsQuery.isLoading) {
    return <LoadingState cards={4} title="Loading rule editor" />;
  }

  if (versionQuery.isError || materialsQuery.isError || !versionQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                versionQuery.refetch(),
                materialsQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={
          versionQuery.error?.message ??
          materialsQuery.error?.message ??
          "Reference data could not be loaded."
        }
        title="Rule editor could not be prepared"
      />
    );
  }

  const version = versionQuery.data;
  const materials = materialsQuery.data ?? [];

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link
              className="inline-flex items-center text-sm font-medium text-stone-600 transition hover:text-stone-950"
              href={PRODUCT_TEMPLATES_ROUTES.versionView(versionId)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to version
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Rule Builder
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                V{version.versionNumber} · {version.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
                Define inputs, material rules, accessory rules, and labor rules. Formula editors
                accept JSON only, and the backend validates everything before activation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className={secondaryButtonClassName}
              href={PRODUCT_TEMPLATES_ROUTES.versionSimulate(version.id)}
            >
              Simulate
            </Link>
          </div>
        </div>
      </section>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await updateMutation.mutateAsync(values);
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.version(versionId),
              }),
              queryClient.invalidateQueries({
                queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.detail(version.templateId),
              }),
            ]);
            router.push(PRODUCT_TEMPLATES_ROUTES.versionView(versionId));
            router.refresh();
          } catch (error) {
            form.setError("root", {
              message: getApiErrorMessage(error),
            });
          }
        })}
      >
        <section className={sectionClassName}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Inputs
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Dynamic form fields
              </h2>
            </div>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                inputsFieldArray.append({
                  ...emptyInput,
                  sortOrder: inputsFieldArray.fields.length * 10,
                });
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add input
            </button>
          </div>

          <div className="space-y-4">
            {inputsFieldArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Input {index + 1}</p>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      inputsFieldArray.remove(index);
                    }}
                    type="button"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input className={fieldClassName} placeholder="Key" {...form.register(`inputs.${index}.key`)} />
                  <input className={fieldClassName} placeholder="Label" {...form.register(`inputs.${index}.label`)} />
                  <select className={fieldClassName} {...form.register(`inputs.${index}.inputType`)}>
                    {PRODUCT_TEMPLATE_INPUT_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input className={fieldClassName} placeholder="Unit" {...form.register(`inputs.${index}.unit`)} />
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`inputs.${index}.isRequired`)} />
                    Required
                  </label>
                  <input
                    className={fieldClassName}
                    placeholder="Sort order"
                    type="number"
                    {...form.register(`inputs.${index}.sortOrder`)}
                  />
                  <textarea
                    className="md:col-span-2 xl:col-span-2 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Default value JSON"
                    rows={5}
                    {...form.register(`inputs.${index}.defaultValueJsonText`)}
                  />
                  <textarea
                    className="md:col-span-2 xl:col-span-2 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Options JSON"
                    rows={5}
                    {...form.register(`inputs.${index}.optionsJsonText`)}
                  />
                  <textarea
                    className="md:col-span-2 xl:col-span-4 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Validation JSON"
                    rows={5}
                    {...form.register(`inputs.${index}.validationJsonText`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Material Rules
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Core bill-of-material rules
              </h2>
            </div>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                materialRulesFieldArray.append({
                  ...emptyMaterialRule,
                  sortOrder: materialRulesFieldArray.fields.length * 10,
                });
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add material rule
            </button>
          </div>

          <div className="space-y-4">
            {materialRulesFieldArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Material rule {index + 1}</p>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      materialRulesFieldArray.remove(index);
                    }}
                    type="button"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input className={fieldClassName} placeholder="Label" {...form.register(`materialRules.${index}.label`)} />
                  <select className={fieldClassName} {...form.register(`materialRules.${index}.ruleType`)}>
                    {PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select className={fieldClassName} {...form.register(`materialRules.${index}.materialId`)}>
                    <option value="">Select material</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.code})
                      </option>
                    ))}
                  </select>
                  <input
                    className={fieldClassName}
                    placeholder="Waste %"
                    type="number"
                    {...form.register(`materialRules.${index}.wastePercent`)}
                  />
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`materialRules.${index}.allowRemnantUse`)} />
                    Allow remnants
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`materialRules.${index}.allowRotation`)} />
                    Allow rotation
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`materialRules.${index}.isActive`)} />
                    Active
                  </label>
                  <input
                    className={fieldClassName}
                    placeholder="Sort order"
                    type="number"
                    {...form.register(`materialRules.${index}.sortOrder`)}
                  />
                  <textarea
                    className="md:col-span-2 xl:col-span-4 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Formula JSON"
                    rows={10}
                    {...form.register(`materialRules.${index}.formulaJsonText`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Accessory Rules
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Optional and consumable items
              </h2>
            </div>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                accessoryRulesFieldArray.append({
                  ...emptyAccessoryRule,
                  sortOrder: accessoryRulesFieldArray.fields.length * 10,
                });
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add accessory rule
            </button>
          </div>

          <div className="space-y-4">
            {accessoryRulesFieldArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Accessory rule {index + 1}</p>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      accessoryRulesFieldArray.remove(index);
                    }}
                    type="button"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input className={fieldClassName} placeholder="Label" {...form.register(`accessoryRules.${index}.label`)} />
                  <select className={fieldClassName} {...form.register(`accessoryRules.${index}.materialId`)}>
                    <option value="">Select material</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.code})
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`accessoryRules.${index}.isOptional`)} />
                    Optional
                  </label>
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`accessoryRules.${index}.isActive`)} />
                    Active
                  </label>
                  <input
                    className={fieldClassName}
                    placeholder="Sort order"
                    type="number"
                    {...form.register(`accessoryRules.${index}.sortOrder`)}
                  />
                  <textarea
                    className="md:col-span-2 xl:col-span-3 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Quantity formula JSON"
                    rows={8}
                    {...form.register(`accessoryRules.${index}.quantityFormulaJsonText`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Labor Rules
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Fabrication and installation
              </h2>
            </div>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                laborRulesFieldArray.append({
                  ...emptyLaborRule,
                  sortOrder: laborRulesFieldArray.fields.length * 10,
                });
              }}
              type="button"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add labor rule
            </button>
          </div>

          <div className="space-y-4">
            {laborRulesFieldArray.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-stone-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Labor rule {index + 1}</p>
                  <button
                    className={secondaryButtonClassName}
                    onClick={() => {
                      laborRulesFieldArray.remove(index);
                    }}
                    type="button"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <input className={fieldClassName} placeholder="Label" {...form.register(`laborRules.${index}.label`)} />
                  <select className={fieldClassName} {...form.register(`laborRules.${index}.laborType`)}>
                    {PRODUCT_TEMPLATE_LABOR_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    className={fieldClassName}
                    placeholder="Unit cost"
                    type="number"
                    {...form.register(`laborRules.${index}.unitCost`)}
                  />
                  <label className="flex items-center gap-2 text-sm text-stone-700">
                    <input type="checkbox" {...form.register(`laborRules.${index}.isActive`)} />
                    Active
                  </label>
                  <input
                    className={fieldClassName}
                    placeholder="Sort order"
                    type="number"
                    {...form.register(`laborRules.${index}.sortOrder`)}
                  />
                  <textarea
                    className="md:col-span-2 xl:col-span-3 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 font-mono text-xs text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Formula JSON"
                    rows={8}
                    {...form.register(`laborRules.${index}.formulaJsonText`)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {form.formState.errors.root?.message ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link
            className={secondaryButtonClassName}
            href={PRODUCT_TEMPLATES_ROUTES.versionView(versionId)}
          >
            Cancel
          </Link>
          <button className={primaryButtonClassName} disabled={updateMutation.isPending} type="submit">
            Save rules
          </button>
        </div>
      </form>
    </main>
  );
}
