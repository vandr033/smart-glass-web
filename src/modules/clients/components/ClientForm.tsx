"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";

import { AddressMapPicker } from "@/components/ui/address-map-picker";
import { ErrorState } from "@/components/ui/error-state";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { getApiErrorMessage } from "@/utils";

import {
  CLIENTS_ROUTES,
  CLIENT_STATUS_OPTIONS,
  CLIENT_TYPE_OPTIONS,
} from "../constants";
import {
  clientFormSchema,
  EMPTY_CLIENT_FORM_VALUES,
  type ClientFormValues,
  useClients,
} from "../hooks/useClients";

type ClientFormProps =
  | {
      mode: "create";
    }
  | {
      clientId: string;
      mode: "edit";
    };

const labelClassName = "space-y-2";

export function ClientForm(props: ClientFormProps) {
  const router = useRouter();
  const { mapRecordToFormValues, useClient, useCreateClient, useUpdateClient } =
    useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const clientQuery = useClient(props.mode === "edit" ? props.clientId : "");

  const form = useForm<ClientFormValues>({
    defaultValues: EMPTY_CLIENT_FORM_VALUES,
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormValues>,
  });

  const clientType = useWatch({
    control: form.control,
    name: "clientType",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !clientQuery.data) {
      return;
    }

    form.reset(mapRecordToFormValues(clientQuery.data));
  }, [clientQuery.data, form, mapRecordToFormValues, props.mode]);

  if (props.mode === "edit" && clientQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void clientQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={clientQuery.error.message}
        title="No se pudieron cargar los datos del cliente"
      />
    );
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    (props.mode === "edit" && clientQuery.isLoading);

  const getFieldError = (name: keyof ClientFormValues): string | null => {
    const issue = form.formState.errors[name];
    return issue?.message ? String(issue.message) : null;
  };

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const client =
            props.mode === "create"
              ? await createMutation.mutateAsync(values)
              : await updateMutation.mutateAsync({
                  clientId: props.clientId,
                  values,
                });

          router.push(CLIENTS_ROUTES.view(client.id));
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
              {props.mode === "create" ? "Crear cliente" : "Editar cliente"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create" ? "Registrar cliente" : "Actualizar cliente"}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Registra la identidad comercial, los canales de contacto y el contexto
              de facturacion que usaran los proyectos y las cotizaciones.
            </p>
          </div>

          <Link
            className={secondaryButtonClassName}
            href={
              props.mode === "create"
                ? CLIENTS_ROUTES.list
                : CLIENTS_ROUTES.view(props.clientId)
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
            1. Tipo de cliente
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Selecciona el perfil comercial</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CLIENT_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`rounded-lg border px-5 py-5 transition ${
                clientType === option.value
                  ? "border-[color:var(--color-primary)] bg-[var(--color-primary-soft)]"
                  : "border-stone-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  checked={clientType === option.value}
                  className="mt-1 h-4 w-4"
                  disabled={isBusy}
                  onChange={() => {
                    form.setValue("clientType", option.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  type="radio"
                />
                <div>
                  <p className="font-semibold text-stone-950">{option.label}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {option.description}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            2. Identificacion
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Identidad oficial</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Codigo</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("code")} />
          </label>

          {clientType === "COMPANY" ? (
            <>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Razon social
                </span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("legalName")}
                />
              </label>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Nombre comercial</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("commercialName")}
                />
              </label>
            </>
          ) : (
            <>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Nombre</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("firstName")}
                />
              </label>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Apellido</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("lastName")}
                />
              </label>
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Nombre comercial</span>
                <input
                  className={fieldClassName}
                  disabled={isBusy}
                  {...form.register("commercialName")}
                />
              </label>
            </>
          )}

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">NIT</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("taxId")} />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Estado</span>
            <select className={fieldClassName} disabled={isBusy} {...form.register("status")}>
              {CLIENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {getFieldError("firstName") || getFieldError("legalName") ? (
          <p className="mt-4 text-sm text-rose-700">
            {getFieldError("firstName") ?? getFieldError("legalName")}
          </p>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            3. Contacto
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Canales principales</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneInputWithCountry
                disabled={isBusy}
                error={getFieldError("phone")}
                label="Telefono"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <Controller
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <PhoneInputWithCountry
                disabled={isBusy}
                error={getFieldError("whatsapp")}
                label="WhatsApp"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Correo</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("email")} />
            {getFieldError("email") ? (
              <span className="mt-2 block text-sm text-rose-700">
                {getFieldError("email")}
              </span>
            ) : null}
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            4. Direccion de facturacion
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Ubicacion base</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="md:col-span-2 xl:col-span-2">
            <Controller
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <AddressMapPicker
                  disabled={isBusy}
                  error={getFieldError("billingAddress")}
                  label="Direccion de facturacion"
                  onChange={(nextValue) => {
                    field.onChange(nextValue.addressText);
                  }}
                  value={{
                    addressText: field.value,
                  }}
                />
              )}
            />
          </div>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Ciudad</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("city")} />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Pais</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("country")} />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            5. Notas
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Contexto comercial interno</h3>
        </div>

        <textarea
          className={textAreaClassName}
          disabled={isBusy}
          {...form.register("notes")}
        />

        {form.formState.errors.root?.message ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {form.formState.errors.root.message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={isBusy} type="submit">
            {isBusy
              ? "Guardando..."
              : props.mode === "create"
                ? "Crear cliente"
                : "Guardar cambios"}
          </button>
          <Link
            className={secondaryButtonClassName}
            href={
              props.mode === "create"
                ? CLIENTS_ROUTES.list
                : CLIENTS_ROUTES.view(props.clientId)
            }
          >
            Cancelar
          </Link>
        </div>
      </section>
    </form>
  );
}
