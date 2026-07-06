"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type Resolver } from "react-hook-form";

import { AddressMapPicker } from "@/components/ui/address-map-picker";
import { ErrorState } from "@/components/ui/error-state";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { getApiErrorMessage } from "@/utils";

import { PROJECTS_ROUTES, PROJECT_PRIORITY_OPTIONS, PROJECT_TYPE_OPTIONS } from "../constants";
import {
  EMPTY_PROJECT_FORM_VALUES,
  mapRecordToFormValues,
  projectFormSchema,
  type ProjectFormValues,
  useProjects,
} from "../hooks/useProjects";

type ProjectFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      projectId: string;
    };

const labelClassName = "space-y-2";

export function ProjectForm(props: ProjectFormProps) {
  const router = useRouter();
  const {
    useClientOptions,
    useCreateProject,
    useProject,
    useProjectUserOptions,
    useUpdateProject,
  } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const projectQuery = useProject(props.mode === "edit" ? props.projectId : "");
  const clientOptionsQuery = useClientOptions();
  const userOptionsQuery = useProjectUserOptions();

  const form = useForm<ProjectFormValues>({
    defaultValues: EMPTY_PROJECT_FORM_VALUES,
    resolver: zodResolver(projectFormSchema) as Resolver<ProjectFormValues>,
  });
  const siteAddress = useWatch({
    control: form.control,
    name: "siteAddress",
  });
  const siteLatitude = useWatch({
    control: form.control,
    name: "latitude",
  });
  const siteLongitude = useWatch({
    control: form.control,
    name: "longitude",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !projectQuery.data) {
      return;
    }

    form.reset(mapRecordToFormValues(projectQuery.data));
  }, [form, projectQuery.data, props.mode]);

  if (props.mode === "edit" && projectQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void projectQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={projectQuery.error.message}
        title="No se pudieron cargar los datos del proyecto"
      />
    );
  }

  if (clientOptionsQuery.isError || userOptionsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                clientOptionsQuery.refetch(),
                userOptionsQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          clientOptionsQuery.error?.message ??
          userOptionsQuery.error?.message ??
          "No se pudieron cargar los datos de referencia."
        }
        title="No se pudo preparar el formulario"
      />
    );
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    clientOptionsQuery.isLoading ||
    userOptionsQuery.isLoading ||
    (props.mode === "edit" && projectQuery.isLoading);

  const getFieldError = (name: keyof ProjectFormValues): string | null => {
    const issue = form.formState.errors[name];
    return issue?.message ? String(issue.message) : null;
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const project =
            props.mode === "create"
              ? await createMutation.mutateAsync(values)
              : await updateMutation.mutateAsync({
                  projectId: props.projectId,
                  values,
                });

          router.push(PROJECTS_ROUTES.view(project.id));
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
              {props.mode === "create" ? "Crear proyecto" : "Editar proyecto"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create" ? "Registrar proyecto" : "Actualizar proyecto"}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Define el cliente, el tipo de trabajo, las fechas y los responsables que
              guiaran el proyecto durante su ciclo operativo.
            </p>
          </div>

          <Link
            className={secondaryButtonClassName}
            href={
              props.mode === "create"
                ? PROJECTS_ROUTES.list
                : PROJECTS_ROUTES.view(props.projectId)
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
            1. Cliente
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Selecciona al cliente</h3>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Cliente</span>
          <select className={fieldClassName} disabled={isBusy} {...form.register("clientId")}>
            <option value="">Selecciona un cliente</option>
            {(clientOptionsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </select>
          {getFieldError("clientId") ? (
            <span className="block text-sm text-rose-700">{getFieldError("clientId")}</span>
          ) : null}
        </label>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            2. Informacion del proyecto
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Describe el trabajo</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Titulo</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("title")} />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Tipo de proyecto</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("projectType")}>
              {PROJECT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Prioridad</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("priority")}>
              {PROJECT_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 xl:col-span-4">
            <span className="mb-2 block text-sm font-medium text-stone-700">Descripcion</span>
            <textarea
              className={textAreaClassName}
              disabled={isBusy}
              {...form.register("description")}
            />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            3. Ubicacion
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Direccion y coordenadas</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-2">
            <AddressMapPicker
              disabled={isBusy}
              error={getFieldError("siteAddress")}
              label="Direccion de obra"
              onChange={(nextValue) => {
                form.setValue("siteAddress", nextValue.addressText, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                form.setValue(
                  "latitude",
                  nextValue.latitude === null || nextValue.latitude === undefined
                    ? ""
                    : String(nextValue.latitude),
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );
                form.setValue(
                  "longitude",
                  nextValue.longitude === null || nextValue.longitude === undefined
                    ? ""
                    : String(nextValue.longitude),
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );
              }}
              value={{
                addressText: siteAddress,
                latitude: siteLatitude ? Number(siteLatitude) : null,
                longitude: siteLongitude ? Number(siteLongitude) : null,
              }}
            />
          </div>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Ciudad</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("city")} />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            4. Fechas operativas
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Planifica los hitos</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Medicion estimada</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="date"
              {...form.register("expectedMeasurementDate")}
            />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Entrega estimada</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="date"
              {...form.register("expectedDeliveryDate")}
            />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Instalacion estimada</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="date"
              {...form.register("expectedInstallationDate")}
            />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            5. Responsables
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Asigna responsables</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Responsable operativo</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("responsibleUserId")}
            >
              <option value="">Sin asignar</option>
              {(userOptionsQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Responsable comercial</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("salesUserId")}>
              <option value="">Sin asignar</option>
              {(userOptionsQuery.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            6. Notas
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Contexto interno del proyecto</h3>
        </div>

        <textarea
          className={textAreaClassName}
          disabled={isBusy}
          {...form.register("notes")}
        />

        {form.formState.errors.root?.message ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {form.formState.errors.root.message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={isBusy} type="submit">
            {isBusy
              ? "Guardando..."
              : props.mode === "create"
                ? "Crear proyecto"
                : "Guardar cambios"}
          </button>
          <Link
            className={secondaryButtonClassName}
            href={
              props.mode === "create"
                ? PROJECTS_ROUTES.list
                : PROJECTS_ROUTES.view(props.projectId)
            }
          >
            Cancelar
          </Link>
        </div>
      </section>
    </form>
  );
}
