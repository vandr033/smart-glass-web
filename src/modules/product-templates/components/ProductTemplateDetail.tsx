"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";

import { EmptyState } from "@/components/ui/empty-state";
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
  productTemplateVersionFormSchema,
  type ProductTemplateVersionFormValues,
} from "../forms";
import {
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATE_STATUS_LABELS,
  PRODUCT_TEMPLATE_TYPE_LABELS,
  PRODUCT_TEMPLATE_VERSION_STATUS_LABELS,
  PRODUCT_TEMPLATE_VERSION_STATUS_OPTIONS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplateDetailProps = {
  canManage: boolean;
  templateId: string;
};

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return "Sin configurar";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function ProductTemplateDetail({
  canManage,
  templateId,
}: ProductTemplateDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateQuery = useQuery({
    queryFn: async () => productTemplateService.getTemplateById(templateId),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.detail(templateId),
  });
  const versionsQuery = useQuery({
    queryFn: async () => productTemplateService.listTemplateVersions(templateId),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.versions(templateId),
  });
  const createVersionMutation = useMutation({
    mutationFn: (input: ProductTemplateVersionFormValues) =>
      productTemplateService.createTemplateVersion(templateId, {
        defaultMarginPercent: input.defaultMarginPercent,
        defaultWastePercent: input.defaultWastePercent,
        description: input.description,
        duplicateFromVersionId: input.duplicateFromVersionId,
        name: input.name,
        notes: input.notes,
        status: input.status,
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: async () => productTemplateService.deleteTemplate(templateId),
  });

  const createVersionForm = useForm<ProductTemplateVersionFormValues>({
    defaultValues: {
      defaultMarginPercent: 18,
      defaultWastePercent: 10,
      description: null,
      duplicateFromVersionId: null,
      name: "Nueva versión de borrador",
      notes: null,
      status: "DRAFT",
    },
    resolver: zodResolver(productTemplateVersionFormSchema) as Resolver<ProductTemplateVersionFormValues>,
  });

  if (templateQuery.isLoading || versionsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando plantilla de producto" />;
  }

  if (templateQuery.isError || versionsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                templateQuery.refetch(),
                versionsQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          templateQuery.error?.message ??
          versionsQuery.error?.message ??
          "No se pudieron cargar los datos de la plantilla."
        }
        title="No se pudieron cargar los detalles de la plantilla de producto"
      />
    );
  }

  const template = templateQuery.data;

  if (!template) {
    return (
      <ErrorState
        description="Los datos de la plantilla no están disponibles en este momento."
        title="No se pudo cargar la plantilla de producto"
      />
    );
  }

  const versions = versionsQuery.data ?? template.versions;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link
              className="inline-flex items-center text-sm font-medium text-stone-600 transition hover:text-stone-950"
              href={PRODUCT_TEMPLATES_ROUTES.list}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a plantillas
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                {PRODUCT_TEMPLATE_TYPE_LABELS[template.productType]}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                {template.name}
              </h1>
              <p className="mt-2 text-sm uppercase tracking-[0.22em] text-stone-500">
                {template.code}
              </p>
              {template.description ? (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-700">
                  {template.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {template.currentVersion ? (
              <Link
                className={secondaryButtonClassName}
                href={PRODUCT_TEMPLATES_ROUTES.versionSimulate(template.currentVersion.id)}
              >
                Simular versión actual
              </Link>
            ) : null}
            {canManage ? (
              <>
                <Link
                  className={secondaryButtonClassName}
                  href={PRODUCT_TEMPLATES_ROUTES.edit(template.id)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                Editar plantilla
                </Link>
                <button
                  className={secondaryButtonClassName}
                  disabled={deleteMutation.isPending}
                  onClick={async () => {
                    if (!window.confirm("¿Archivar esta plantilla? Las versiones existentes permanecerán en el historial de auditoría.")) {
                      return;
                    }

                    try {
                      await deleteMutation.mutateAsync();
                      await queryClient.invalidateQueries({
                        queryKey: ["product-templates"],
                      });
                      router.push(PRODUCT_TEMPLATES_ROUTES.list);
                      router.refresh();
                    } catch (error) {
                      window.alert(getApiErrorMessage(error));
                    }
                  }}
                  type="button"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
                </button>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Estado</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {PRODUCT_TEMPLATE_STATUS_LABELS[template.status]}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Versión vigente</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {template.currentVersion
                ? `V${template.currentVersion.versionNumber}`
                : "Sin asignar"}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Creado</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {formatDateTime(template.createdAt)}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Actualizado</p>
            <p className="mt-3 text-lg font-semibold text-stone-950">
              {formatDateTime(template.updatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Versiones
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Historial de versiones
            </h2>
          </div>
        </div>

        {versions.length === 0 ? (
          <EmptyState
            description="Crea la primera versión para definir entradas, fórmulas y comportamiento de simulación."
            title="Aún no hay versiones"
          />
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="rounded-lg border border-stone-200 bg-white px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-stone-950">
                      V{version.versionNumber} · {version.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {PRODUCT_TEMPLATE_VERSION_STATUS_LABELS[version.status]} · Actualizada{" "}
                      {formatDateTime(version.updatedAt)}
                    </p>
                    {version.description ? (
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">
                        {version.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      className={secondaryButtonClassName}
                      href={PRODUCT_TEMPLATES_ROUTES.versionView(version.id)}
                    >
                      Ver versión
                    </Link>
                    <Link
                      className={secondaryButtonClassName}
                      href={PRODUCT_TEMPLATES_ROUTES.versionSimulate(version.id)}
                    >
                      Simular
                    </Link>
                    {canManage ? (
                      <Link
                        className={secondaryButtonClassName}
                        href={PRODUCT_TEMPLATES_ROUTES.versionRules(version.id)}
                      >
                        Editar reglas
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {canManage ? (
        <section className={sectionClassName}>
          <div className="mb-6 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Crear versión
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Crear una nueva versión
            </h2>
          </div>

          <form
            className="space-y-5"
            onSubmit={createVersionForm.handleSubmit(async (values) => {
              try {
                const version = await createVersionMutation.mutateAsync(values);
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.detail(templateId),
                  }),
                  queryClient.invalidateQueries({
                    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.versions(templateId),
                  }),
                ]);
                router.push(PRODUCT_TEMPLATES_ROUTES.versionRules(version.id));
                router.refresh();
              } catch (error) {
                createVersionForm.setError("root", {
                  message: getApiErrorMessage(error),
                });
              }
            })}
          >
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              <label className="md:col-span-2 xl:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Nombre</span>
                <input className={fieldClassName} {...createVersionForm.register("name")} />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">Estado</span>
                <select className={fieldClassName} {...createVersionForm.register("status")}>
                  {PRODUCT_TEMPLATE_VERSION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Duplicar desde
                </span>
                <select
                  className={fieldClassName}
                  {...createVersionForm.register("duplicateFromVersionId")}
                >
                  <option value="">Comenzar vacío</option>
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      V{version.versionNumber} · {version.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Margen predeterminado %
                </span>
                <input
                  className={fieldClassName}
                  type="number"
                  {...createVersionForm.register("defaultMarginPercent")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Desperdicio predeterminado %
                </span>
                <input
                  className={fieldClassName}
                  type="number"
                  {...createVersionForm.register("defaultWastePercent")}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Descripción</span>
                <textarea
                  className={textAreaClassName}
                  rows={4}
                  {...createVersionForm.register("description")}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">Notas</span>
                <textarea
                  className={textAreaClassName}
                  rows={4}
                  {...createVersionForm.register("notes")}
                />
              </label>
            </div>

            {createVersionForm.formState.errors.root?.message ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {createVersionForm.formState.errors.root.message}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                className={primaryButtonClassName}
                disabled={createVersionMutation.isPending}
                type="submit"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear versión borrador
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className={sectionClassName}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Uso actual
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
            Integraciones disponibles
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-stone-700">
            La plantilla se puede configurar, simular y utilizar desde el cotizador. Las compras,
            la optimización de cortes y la producción reciben los materiales calculados a través
            de la cotización.
          </p>
        </div>
      </section>
    </main>
  );
}
