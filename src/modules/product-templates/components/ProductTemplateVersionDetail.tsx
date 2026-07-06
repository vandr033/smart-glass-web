"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileCode2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { productTemplateService } from "@/services/product-template-service";
import { getApiErrorMessage } from "@/utils";

import {
  mapVersionToFormValues,
  productTemplateVersionFormSchema,
  type ProductTemplateVersionFormValues,
} from "../forms";
import {
  PRODUCT_TEMPLATE_INPUT_TYPE_LABELS,
  PRODUCT_TEMPLATE_LABOR_TYPE_LABELS,
  PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_LABELS,
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATE_STATUS_LABELS,
  PRODUCT_TEMPLATE_VERSION_STATUS_LABELS,
  PRODUCT_TEMPLATE_VERSION_STATUS_OPTIONS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplateVersionDetailProps = {
  canManage: boolean;
  versionId: string;
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function ProductTemplateVersionDetail({
  canManage,
  versionId,
}: ProductTemplateVersionDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const versionQuery = useQuery({
    queryFn: async () => productTemplateService.getTemplateVersionById(versionId),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.version(versionId),
  });
  const updateMutation = useMutation({
    mutationFn: (input: ProductTemplateVersionFormValues) =>
      productTemplateService.updateTemplateVersion(versionId, {
        defaultMarginPercent: input.defaultMarginPercent,
        defaultWastePercent: input.defaultWastePercent,
        description: input.description,
        name: input.name,
        notes: input.notes,
        status: input.status,
      }),
  });
  const activateMutation = useMutation({
    mutationFn: async () => productTemplateService.activateTemplateVersion(versionId),
  });

  const form = useForm<ProductTemplateVersionFormValues>({
    defaultValues: {
      defaultMarginPercent: null,
      defaultWastePercent: null,
      description: null,
      duplicateFromVersionId: null,
      name: "",
      notes: null,
      status: "DRAFT",
    },
    resolver: zodResolver(productTemplateVersionFormSchema) as Resolver<ProductTemplateVersionFormValues>,
  });

  useEffect(() => {
    if (!versionQuery.data) {
      return;
    }

    form.reset(mapVersionToFormValues(versionQuery.data));
  }, [form, versionQuery.data]);

  if (versionQuery.isLoading) {
    return <LoadingState cards={4} title="Loading template version" />;
  }

  if (versionQuery.isError || !versionQuery.data) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void versionQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={versionQuery.error?.message ?? "Version data could not be loaded."}
        title="Template version could not be loaded"
      />
    );
  }

  const version = versionQuery.data;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              className="inline-flex items-center text-sm font-medium text-stone-600 transition hover:text-stone-950"
              href={PRODUCT_TEMPLATES_ROUTES.view(version.templateId)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to template
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                {version.template.code}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                V{version.versionNumber} · {version.name}
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                {PRODUCT_TEMPLATE_STATUS_LABELS[version.template.status]} template ·{" "}
                {PRODUCT_TEMPLATE_VERSION_STATUS_LABELS[version.status]} version
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className={secondaryButtonClassName}
              href={PRODUCT_TEMPLATES_ROUTES.versionSimulate(version.id)}
            >
              <Play className="mr-2 h-4 w-4" />
              Simulate
            </Link>
            {canManage ? (
              <>
                <Link
                  className={secondaryButtonClassName}
                  href={PRODUCT_TEMPLATES_ROUTES.versionRules(version.id)}
                >
                  <FileCode2 className="mr-2 h-4 w-4" />
                  Edit rules
                </Link>
                <button
                  className={primaryButtonClassName}
                  disabled={
                    activateMutation.isPending ||
                    version.status === "ACTIVE" ||
                    !version.validation.isValid
                  }
                  onClick={async () => {
                    try {
                      await activateMutation.mutateAsync();
                      await Promise.all([
                        queryClient.invalidateQueries({
                          queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.version(versionId),
                        }),
                        queryClient.invalidateQueries({
                          queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.detail(version.templateId),
                        }),
                        queryClient.invalidateQueries({
                          queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.versions(version.templateId),
                        }),
                      ]);
                      router.refresh();
                    } catch (error) {
                      window.alert(getApiErrorMessage(error));
                    }
                  }}
                  type="button"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Activate
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Status</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {PRODUCT_TEMPLATE_VERSION_STATUS_LABELS[version.status]}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Inputs</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">{version.inputs.length}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Material rules</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {version.materialRules.length}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Activated</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {formatDateTime(version.activatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Validation
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
            Readiness check
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-900">
              {version.validation.isValid ? "Version is valid" : "Version still has blockers"}
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              {version.validation.isValid
                ? "This version can be activated and used for simulation."
                : "Fix the validation issues below before activation."}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-sm font-semibold text-stone-900">Warnings</p>
            {version.validation.warnings.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                {version.validation.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No warnings right now.</p>
            )}
          </div>
        </div>

        {version.validation.errors.length > 0 ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-5 py-4">
            <p className="text-sm font-semibold text-rose-900">Validation errors</p>
            <ul className="mt-3 space-y-2 text-sm text-rose-800">
              {version.validation.errors.map((error) => (
                <li key={error}>• {error}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {canManage ? (
        <section className={sectionClassName}>
          <div className="mb-6 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Version Settings
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              General information
            </h2>
          </div>

          <form
            className="space-y-5"
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
                router.refresh();
              } catch (error) {
                form.setError("root", {
                  message: getApiErrorMessage(error),
                });
              }
            })}
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Name</span>
                <input className={fieldClassName} {...form.register("name")} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">Status</span>
                <select className={fieldClassName} {...form.register("status")}>
                  {PRODUCT_TEMPLATE_VERSION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Default margin %
                </span>
                <input
                  className={fieldClassName}
                  type="number"
                  {...form.register("defaultMarginPercent")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Default waste %
                </span>
                <input
                  className={fieldClassName}
                  type="number"
                  {...form.register("defaultWastePercent")}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
                <textarea
                  className={textAreaClassName}
                  rows={4}
                  {...form.register("description")}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Notes</span>
                <textarea className={textAreaClassName} rows={4} {...form.register("notes")} />
              </label>
            </div>

            {form.formState.errors.root?.message ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {form.formState.errors.root.message}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                className={primaryButtonClassName}
                disabled={updateMutation.isPending}
                type="submit"
              >
                Save version settings
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={sectionClassName}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-5">
            <p className="text-sm font-semibold text-stone-900">Inputs</p>
            <div className="mt-4 space-y-3">
              {version.inputs.map((input) => (
                <div key={input.id} className="rounded-md border border-stone-200 px-4 py-3">
                  <p className="font-medium text-stone-950">
                    {input.label} · {PRODUCT_TEMPLATE_INPUT_TYPE_LABELS[input.inputType]}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Key: {input.key}
                    {input.unit ? ` · ${input.unit}` : ""}
                    {input.isRequired ? " · Required" : " · Optional"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white px-5 py-5">
            <p className="text-sm font-semibold text-stone-900">Rules summary</p>
            <div className="mt-4 space-y-3">
              {version.materialRules.map((rule) => (
                <div key={rule.id} className="rounded-md border border-stone-200 px-4 py-3">
                  <p className="font-medium text-stone-950">
                    {rule.label} · {PRODUCT_TEMPLATE_MATERIAL_RULE_TYPE_LABELS[rule.ruleType]}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{rule.material.name}</p>
                </div>
              ))}
              {version.accessoryRules.map((rule) => (
                <div key={rule.id} className="rounded-md border border-stone-200 px-4 py-3">
                  <p className="font-medium text-stone-950">Accessory · {rule.label}</p>
                  <p className="mt-1 text-sm text-stone-600">{rule.material.name}</p>
                </div>
              ))}
              {version.laborRules.map((rule) => (
                <div key={rule.id} className="rounded-md border border-stone-200 px-4 py-3">
                  <p className="font-medium text-stone-950">
                    {rule.label} · {PRODUCT_TEMPLATE_LABOR_TYPE_LABELS[rule.laborType]}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    Unit cost: {rule.unitCost ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
