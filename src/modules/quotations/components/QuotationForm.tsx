"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { clientService } from "@/services/client-service";
import { projectService } from "@/services/project-service";
import { quotationService } from "@/services/quotation-service";
import { getApiErrorMessage } from "@/utils";

import {
  EMPTY_QUOTATION_FORM_VALUES,
  mapQuotationRecordToFormValues,
  quotationFormSchema,
  toQuotationPayload,
  type QuotationFormValues,
} from "../forms";
import { QUOTATIONS_QUERY_KEYS, QUOTATIONS_ROUTES } from "../constants";

type QuotationFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      quotationId: string;
    };

const labelClassName = "space-y-2";

export function QuotationForm(props: QuotationFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const quotationQuery = useQuery({
    enabled: props.mode === "edit",
    queryFn: async () =>
      props.mode === "edit"
        ? quotationService.getQuotationById(props.quotationId)
        : null,
    queryKey:
      props.mode === "edit"
        ? QUOTATIONS_QUERY_KEYS.detail(props.quotationId)
        : ["quotations", "new-form"],
  });
  const clientsQuery = useQuery({
    queryFn: async () => {
      const result = await clientService.listClients({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["quotations", "client-options"],
    staleTime: 60_000,
  });
  const form = useForm<QuotationFormValues>({
    defaultValues: EMPTY_QUOTATION_FORM_VALUES,
    resolver: zodResolver(quotationFormSchema) as Resolver<QuotationFormValues>,
  });
  const clientId = useWatch({
    control: form.control,
    name: "clientId",
  });
  const projectsQuery = useQuery({
    enabled: Boolean(clientId),
    queryFn: async () => {
      const result = await projectService.listProjects({
        clientId,
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["quotations", "project-options", clientId],
    staleTime: 60_000,
  });
  const createMutation = useMutation({
    mutationFn: async (values: QuotationFormValues) =>
      quotationService.createQuotation(toQuotationPayload(values)),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({
        queryKey: ["quotations"],
      });
      router.push(QUOTATIONS_ROUTES.builder(quotation.id));
      router.refresh();
    },
  });
  const updateMutation = useMutation({
    mutationFn: async (values: QuotationFormValues) => {
      if (props.mode !== "edit") {
        throw new Error("Quotation id is required.");
      }

      return quotationService.updateQuotation(
        props.quotationId,
        toQuotationPayload(values),
      );
    },
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({
        queryKey: QUOTATIONS_QUERY_KEYS.detail(quotation.id),
      });
      await queryClient.invalidateQueries({
        queryKey: ["quotations"],
      });
      router.push(QUOTATIONS_ROUTES.view(quotation.id));
      router.refresh();
    },
  });

  useEffect(() => {
    if (props.mode !== "edit" || !quotationQuery.data) {
      return;
    }

    form.reset(mapQuotationRecordToFormValues(quotationQuery.data));
  }, [form, props.mode, quotationQuery.data]);

  if (props.mode === "edit" && quotationQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void quotationQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={quotationQuery.error.message}
        title="No se pudo cargar el detalle de la cotizacion"
      />
    );
  }

  if (clientsQuery.isError || projectsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                clientsQuery.refetch(),
                projectsQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          clientsQuery.error?.message ??
          projectsQuery.error?.message ??
          "No se pudieron cargar los datos de referencia."
        }
        title="No se pudo preparar el formulario de cotizacion"
      />
    );
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    clientsQuery.isLoading ||
    projectsQuery.isLoading ||
    (props.mode === "edit" && quotationQuery.isLoading);

  const getFieldError = (name: keyof QuotationFormValues): string | null => {
    const issue = form.formState.errors[name];
    return issue?.message ? String(issue.message) : null;
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          if (props.mode === "create") {
            await createMutation.mutateAsync(values);
          } else {
            await updateMutation.mutateAsync(values);
          }
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
              {props.mode === "create" ? "Nueva cotizacion" : "Editar cotizacion"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Abrir el encabezado comercial"
                : "Actualizar datos comerciales de cabecera"}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Define cliente, proyecto relacionado, moneda, vigencia y controles financieros antes de construir las lineas y el flujo de aprobacion.
            </p>
          </div>

          <Link
            className={secondaryButtonClassName}
            href={
              props.mode === "create"
                ? QUOTATIONS_ROUTES.list
                : QUOTATIONS_ROUTES.view(props.quotationId)
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            1. Contexto comercial
          </p>
          <h3 className="text-xl font-semibold text-stone-950">
            Cliente y proyecto
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Cliente</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("clientId")}>
              <option value="">Seleccionar cliente</option>
              {(clientsQuery.data ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </select>
            {getFieldError("clientId") ? (
              <span className="text-sm text-rose-700">{getFieldError("clientId")}</span>
            ) : null}
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Proyecto</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("projectId")}>
              <option value="">Sin proyecto vinculado</option>
              {(projectsQuery.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            2. Terminos comerciales
          </p>
          <h3 className="text-xl font-semibold text-stone-950">
            Moneda, vigencia y ajustes financieros
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Moneda</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("currency")} />
            {getFieldError("currency") ? (
              <span className="text-sm text-rose-700">{getFieldError("currency")}</span>
            ) : null}
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Tipo de cambio</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              placeholder="Opcional"
              {...form.register("exchangeRate")}
            />
            {getFieldError("exchangeRate") ? (
              <span className="text-sm text-rose-700">{getFieldError("exchangeRate")}</span>
            ) : null}
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Vigencia</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="date"
              {...form.register("validUntil")}
            />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Monto de descuento</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("discountAmount")} />
            {getFieldError("discountAmount") ? (
              <span className="text-sm text-rose-700">{getFieldError("discountAmount")}</span>
            ) : null}
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Monto de impuesto</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("taxAmount")} />
            {getFieldError("taxAmount") ? (
              <span className="text-sm text-rose-700">{getFieldError("taxAmount")}</span>
            ) : null}
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            3. Notas
          </p>
          <h3 className="text-xl font-semibold text-stone-950">
            Contexto comercial e interno
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Notas visibles para el cliente</span>
            <textarea
              className={textAreaClassName}
              disabled={isBusy}
              {...form.register("notes")}
            />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Notas internas</span>
            <textarea
              className={textAreaClassName}
              disabled={isBusy}
              {...form.register("internalNotes")}
            />
          </label>
        </div>
      </section>

      {form.formState.errors.root?.message ? (
        <section className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {String(form.formState.errors.root.message)}
        </section>
      ) : null}

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {props.mode === "create"
                ? "Guarda la cabecera y luego continua en el cotizador."
                : "Guarda los cambios de cabecera y vuelve al detalle de la cotizacion."}
            </p>
          </div>

          <button
            className={primaryButtonClassName}
            disabled={isBusy}
            type="submit"
          >
            {isBusy
              ? "Guardando..."
              : props.mode === "create"
                ? "Crear cotizacion"
                : "Guardar cambios"}
          </button>
        </div>
      </section>
    </form>
  );
}
