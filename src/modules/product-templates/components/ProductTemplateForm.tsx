"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
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
  EMPTY_PRODUCT_TEMPLATE_CREATE_FORM_VALUES,
  mapTemplateToEditFormValues,
  productTemplateCreateFormSchema,
  productTemplateEditFormSchema,
  type ProductTemplateCreateFormValues,
  type ProductTemplateEditFormValues,
} from "../forms";
import {
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATE_STATUS_OPTIONS,
  PRODUCT_TEMPLATE_TYPE_OPTIONS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplateFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      templateId: string;
    };

const labelClassName = "space-y-2";

export function ProductTemplateForm(props: ProductTemplateFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editTemplateId = props.mode === "edit" ? props.templateId : "";
  const templateQuery = useQuery({
    enabled: props.mode === "edit",
    queryFn: async () => productTemplateService.getTemplateById(editTemplateId),
    queryKey:
      props.mode === "edit"
        ? PRODUCT_TEMPLATE_QUERY_KEYS.detail(editTemplateId)
        : ["product-templates", "new"],
  });
  const createMutation = useMutation({
    mutationFn: productTemplateService.createTemplate,
  });
  const updateMutation = useMutation({
    mutationFn: async (input: ProductTemplateEditFormValues) =>
      productTemplateService.updateTemplate(editTemplateId, input),
  });

  const createForm = useForm<ProductTemplateCreateFormValues>({
    defaultValues: EMPTY_PRODUCT_TEMPLATE_CREATE_FORM_VALUES,
    resolver: zodResolver(productTemplateCreateFormSchema) as Resolver<ProductTemplateCreateFormValues>,
  });
  const editForm = useForm<ProductTemplateEditFormValues>({
    defaultValues: {
      code: "",
      description: null,
      name: "",
      productType: "WINDOW",
      status: "DRAFT",
    },
    resolver: zodResolver(productTemplateEditFormSchema) as Resolver<ProductTemplateEditFormValues>,
  });

  useEffect(() => {
    if (props.mode !== "edit" || !templateQuery.data) {
      return;
    }

    editForm.reset(mapTemplateToEditFormValues(templateQuery.data));
  }, [editForm, props.mode, templateQuery.data]);

  if (props.mode === "edit" && templateQuery.isLoading) {
    return <ErrorState description="Loading template details..." title="Preparing template form" />;
  }

  if (props.mode === "edit" && templateQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void templateQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={templateQuery.error.message}
        title="Template details could not be loaded"
      />
    );
  }

  if (props.mode === "create") {
    const form = createForm;
    const isBusy = createMutation.isPending;
    const getFieldError = (name: keyof ProductTemplateCreateFormValues): string | null => {
      const issue = form.formState.errors[name];
      return issue?.message ? String(issue.message) : null;
    };

    return (
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const template = await createMutation.mutateAsync({
              code: values.code,
              description: values.description,
              initialVersion: {
                defaultMarginPercent: values.initialVersionDefaultMarginPercent,
                defaultWastePercent: values.initialVersionDefaultWastePercent,
                description: values.initialVersionDescription,
                name: values.initialVersionName,
                notes: values.initialVersionNotes,
                status: "DRAFT",
              },
              name: values.name,
              productType: values.productType,
              status: values.status,
            });

            await queryClient.invalidateQueries({
              queryKey: ["product-templates"],
            });
            router.push(PRODUCT_TEMPLATES_ROUTES.view(template.id));
            router.refresh();
          } catch (error) {
            form.setError("root", {
              message: getApiErrorMessage(error),
            });
          }
        })}
      >
        <section className={sectionClassName}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Create Template
              </p>
              <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
                Start a reusable product blueprint
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                Define the commercial identity of the template and seed an initial version so the
                rule editor and simulator have a safe place to start from.
              </p>
            </div>

            <Link className={secondaryButtonClassName} href={PRODUCT_TEMPLATES_ROUTES.list}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="mb-6 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              1. Template Identity
            </p>
            <h3 className="text-xl font-semibold text-stone-950">General information</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Code</span>
              <input className={fieldClassName} disabled={isBusy} {...form.register("code")} />
              {getFieldError("code") ? (
                <span className="text-sm text-rose-700">{getFieldError("code")}</span>
              ) : null}
            </label>
            <label className="md:col-span-2 xl:col-span-2">
              <span className="mb-2 block text-sm font-medium text-stone-700">Name</span>
              <input className={fieldClassName} disabled={isBusy} {...form.register("name")} />
              {getFieldError("name") ? (
                <span className="text-sm text-rose-700">{getFieldError("name")}</span>
              ) : null}
            </label>
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Product type</span>
              <select className={fieldClassName} disabled={isBusy} {...form.register("productType")}>
                {PRODUCT_TEMPLATE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Status</span>
              <select className={fieldClassName} disabled={isBusy} {...form.register("status")}>
                {PRODUCT_TEMPLATE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 xl:col-span-4">
              <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
              <textarea
                className={textAreaClassName}
                disabled={isBusy}
                rows={4}
                {...form.register("description")}
              />
            </label>
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="mb-6 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              2. Initial Version
            </p>
            <h3 className="text-xl font-semibold text-stone-950">Draft version defaults</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Version name
              </span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                {...form.register("initialVersionName")}
              />
            </label>
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Default margin %</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                type="number"
                {...form.register("initialVersionDefaultMarginPercent")}
              />
            </label>
            <label className={labelClassName}>
              <span className="text-sm font-medium text-stone-700">Default waste %</span>
              <input
                className={fieldClassName}
                disabled={isBusy}
                type="number"
                {...form.register("initialVersionDefaultWastePercent")}
              />
            </label>
            <label className="md:col-span-2 xl:col-span-2">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                Version description
              </span>
              <textarea
                className={textAreaClassName}
                disabled={isBusy}
                rows={4}
                {...form.register("initialVersionDescription")}
              />
            </label>
            <label className="md:col-span-2 xl:col-span-2">
              <span className="mb-2 block text-sm font-medium text-stone-700">Notes</span>
              <textarea
                className={textAreaClassName}
                disabled={isBusy}
                rows={4}
                {...form.register("initialVersionNotes")}
              />
            </label>
          </div>
        </section>

        {form.formState.errors.root?.message ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link className={secondaryButtonClassName} href={PRODUCT_TEMPLATES_ROUTES.list}>
            Cancel
          </Link>
          <button className={primaryButtonClassName} disabled={isBusy} type="submit">
            Create template
          </button>
        </div>
      </form>
    );
  }

  const form = editForm;
  const isBusy = updateMutation.isPending;
  const getFieldError = (name: keyof ProductTemplateEditFormValues): string | null => {
    const issue = form.formState.errors[name];
    return issue?.message ? String(issue.message) : null;
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const template = await updateMutation.mutateAsync(values);

          await queryClient.invalidateQueries({
            queryKey: ["product-templates"],
          });
          await queryClient.invalidateQueries({
            queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.detail(props.templateId),
          });
          router.push(PRODUCT_TEMPLATES_ROUTES.view(template.id));
          router.refresh();
        } catch (error) {
          form.setError("root", {
            message: getApiErrorMessage(error),
          });
        }
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Edit Template
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Update the commercial shell
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Template rules, inputs, and simulation behavior stay in the version workspace. This
              form only updates the reusable template identity and lifecycle status.
            </p>
          </div>

          <Link
            className={secondaryButtonClassName}
            href={PRODUCT_TEMPLATES_ROUTES.view(props.templateId)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Code</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("code")} />
            {getFieldError("code") ? (
              <span className="text-sm text-rose-700">{getFieldError("code")}</span>
            ) : null}
          </label>
          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Name</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("name")} />
            {getFieldError("name") ? (
              <span className="text-sm text-rose-700">{getFieldError("name")}</span>
            ) : null}
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Product type</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("productType")}>
              {PRODUCT_TEMPLATE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Status</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("status")}>
              {PRODUCT_TEMPLATE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 xl:col-span-4">
            <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
            <textarea
              className={textAreaClassName}
              disabled={isBusy}
              rows={4}
              {...form.register("description")}
            />
          </label>
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
          href={PRODUCT_TEMPLATES_ROUTES.view(props.templateId)}
        >
          Cancel
        </Link>
        <button className={primaryButtonClassName} disabled={isBusy} type="submit">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}
