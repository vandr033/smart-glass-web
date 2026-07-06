"use client";

import { useEffect } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Save, Trash2, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";

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
  SUPPLIERS_ROUTES,
  SUPPLIER_STATUS_OPTIONS,
} from "../constants";
import {
  EMPTY_SUPPLIER_FORM_VALUES,
  supplierFormSchema,
  type SupplierFormValues,
  useSuppliers,
} from "../hooks/useSuppliers";

type SupplierFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      supplierId: string;
    };

const labelClassName = "block space-y-2";

const checkboxCardClassName =
  "rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-4";

export function SupplierForm(props: SupplierFormProps) {
  const router = useRouter();
  const {
    mapRecordToFormValues,
    useCreateSupplier,
    useSupplier,
    useSupplierCategories,
    useUpdateSupplier,
  } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const categoriesQuery = useSupplierCategories();
  const supplierQuery = useSupplier(props.mode === "edit" ? props.supplierId : "");

  const form = useForm<SupplierFormValues>({
    defaultValues: EMPTY_SUPPLIER_FORM_VALUES,
    resolver: zodResolver(supplierFormSchema) as Resolver<SupplierFormValues>,
  });

  const contactsFieldArray = useFieldArray({
    control: form.control,
    name: "contacts",
  });
  const currentCategoryIds =
    useWatch({
      control: form.control,
      name: "categoryIds",
    }) ?? [];
  const latitude = useWatch({
    control: form.control,
    name: "latitude",
  });
  const longitude = useWatch({
    control: form.control,
    name: "longitude",
  });
  const creditAvailable = useWatch({
    control: form.control,
    name: "creditAvailable",
  });

  useEffect(() => {
    if (props.mode !== "edit" || !supplierQuery.data) {
      return;
    }

    form.reset(mapRecordToFormValues(supplierQuery.data));
  }, [form, mapRecordToFormValues, props.mode, supplierQuery.data]);

  if (props.mode === "edit" && supplierQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void supplierQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={supplierQuery.error.message}
        title="No se pudieron cargar los datos del proveedor"
      />
    );
  }

  if (categoriesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void categoriesQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={categoriesQuery.error.message}
        title="No se pudieron cargar las categorias"
      />
    );
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    categoriesQuery.isLoading ||
    (props.mode === "edit" && supplierQuery.isLoading);
  const contactsError = form.formState.errors.contacts;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const supplier =
            props.mode === "create"
              ? await createMutation.mutateAsync(values)
              : await updateMutation.mutateAsync({
                  supplierId: props.supplierId,
                  values,
                });

          router.push(SUPPLIERS_ROUTES.view(supplier.id));
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
              {props.mode === "create" ? "Crear proveedor" : "Editar proveedor"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create" ? "Registrar proveedor" : "Actualizar proveedor"}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Registra el perfil comercial, las condiciones, las puntuaciones y los
              contactos reutilizables que usara el modulo de compras.
            </p>
          </div>

          <Link
            className={secondaryButtonClassName}
            href={
              props.mode === "create"
                ? SUPPLIERS_ROUTES.list
                : SUPPLIERS_ROUTES.view(props.supplierId)
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            1. Informacion general
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Identidad del proveedor</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Codigo</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("code")} />
          </label>

          <label className="md:col-span-2 xl:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Razon social</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("legalName")}
            />
            {form.formState.errors.legalName ? (
              <span className="mt-2 block text-sm text-rose-700">
                {form.formState.errors.legalName.message}
              </span>
            ) : null}
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Nombre comercial</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("commercialName")}
            />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">NIT</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("taxId")} />
          </label>

          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Estado</span>
            <select
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("status")}
            >
              {SUPPLIER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            2. Contacto
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Canales principales y responsables</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Controller
            control={form.control}
            name="phone"
            render={({ field }) => (
              <PhoneInputWithCountry
                disabled={isBusy}
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
                label="WhatsApp"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Correo</span>
            <input className={fieldClassName} disabled={isBusy} {...form.register("email")} />
            {form.formState.errors.email ? (
              <span className="mt-2 block text-sm text-rose-700">
                {form.formState.errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">Sitio web</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              placeholder="https://proveedor.ejemplo"
              {...form.register("website")}
            />
            {form.formState.errors.website ? (
              <span className="mt-2 block text-sm text-rose-700">
                {form.formState.errors.website.message}
              </span>
            ) : null}
          </label>
          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="address"
              render={({ field }) => (
                <AddressMapPicker
                  disabled={isBusy}
                  error={form.formState.errors.address?.message}
                  label="Direccion"
                  onChange={(nextValue) => {
                    field.onChange(nextValue.addressText);
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
                    addressText: field.value ?? "",
                    latitude: latitude ? Number(latitude) : null,
                    longitude: longitude ? Number(longitude) : null,
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
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("country")}
            />
          </label>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Contacto principal</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("contactName")}
            />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Cargo</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("contactPosition")}
            />
          </label>
          <Controller
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <PhoneInputWithCountry
                disabled={isBusy}
                label="Telefono directo"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Correo directo</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              {...form.register("contactEmail")}
            />
            {form.formState.errors.contactEmail ? (
              <span className="mt-2 block text-sm text-rose-700">
                {form.formState.errors.contactEmail.message}
              </span>
            ) : null}
          </label>
        </div>

          <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">Contactos adicionales</p>
              <p className="text-sm text-stone-600">
                Agrega contactos de compras, contabilidad o logistica y marca uno como principal.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-[color:var(--color-border-strong)] hover:text-stone-950"
              onClick={() => {
                contactsFieldArray.append({
                  email: "",
                  isPrimary: contactsFieldArray.fields.length === 0,
                  name: "",
                  notes: "",
                  phone: "",
                  position: "",
                  whatsapp: "",
                });
              }}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Agregar contacto
            </button>
          </div>

          {contactsFieldArray.fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[color:var(--color-border)] bg-white px-4 py-5 text-sm text-stone-500">
              No hay contactos adicionales.
            </div>
          ) : null}

          <div className="grid gap-4">
            {contactsFieldArray.fields.map((field, index) => (
              <div key={field.id} className={checkboxCardClassName}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-stone-900">
                    Contacto {index + 1}
                  </p>
                  <button
                    className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-[color:var(--color-border-strong)] hover:text-rose-700"
                    onClick={() => {
                      contactsFieldArray.remove(index);
                    }}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className={labelClassName}>
                    <span className="text-sm font-medium text-stone-700">Nombre</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      {...form.register(`contacts.${index}.name`)}
                    />
                  </label>
                  <label className={labelClassName}>
                    <span className="text-sm font-medium text-stone-700">Cargo</span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      {...form.register(`contacts.${index}.position`)}
                    />
                  </label>
                  <Controller
                    control={form.control}
                    name={`contacts.${index}.phone`}
                    render={({ field }) => (
                      <PhoneInputWithCountry
                        disabled={isBusy}
                        label="Telefono"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={form.control}
                    name={`contacts.${index}.whatsapp`}
                    render={({ field }) => (
                      <PhoneInputWithCountry
                        disabled={isBusy}
                        label="WhatsApp"
                        onChange={field.onChange}
                        value={field.value}
                      />
                    )}
                  />
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-stone-700">
                      Correo
                    </span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      {...form.register(`contacts.${index}.email`)}
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-stone-700">
                      Notas
                    </span>
                    <input
                      className={fieldClassName}
                      disabled={isBusy}
                      {...form.register(`contacts.${index}.notes`)}
                    />
                  </label>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
                    <input
                      className="h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                      disabled={isBusy}
                      type="checkbox"
                      {...form.register(`contacts.${index}.isPrimary`)}
                    />
                    <span className="text-sm font-medium text-stone-700">
                      Marcar como contacto adicional principal
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {typeof contactsError?.message === "string" ? (
            <div className="rounded-md border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {contactsError.message}
            </div>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            3. Condiciones comerciales
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Pago y entrega</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-stone-700">
              Condiciones de pago
            </span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              placeholder="30 dias, anticipo, liquidacion semanal..."
              {...form.register("paymentTerms")}
            />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Limite de credito</span>
            <input
              className={fieldClassName}
              disabled={!creditAvailable || isBusy}
              type="number"
              {...form.register("creditLimit")}
            />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Tiempo de entrega (dias)</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="number"
              {...form.register("defaultLeadTimeDays")}
            />
          </label>
        </div>

        <label className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-[color:var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
          <span className="space-y-1">
            <span className="block text-sm font-medium text-stone-700">Credito disponible</span>
            <span className="block text-xs text-stone-500">
              Activalo cuando el proveedor ofrezca linea de credito.
            </span>
          </span>
          <input
            className="h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
            disabled={isBusy}
            type="checkbox"
            {...form.register("creditAvailable")}
          />
        </label>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            4. Categorias
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Capacidades del proveedor</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(categoriesQuery.data ?? []).map((category) => {
            const isSelected = currentCategoryIds.includes(category.id);

            return (
              <label key={category.id} className={checkboxCardClassName}>
                <div className="flex items-start gap-3">
                  <input
                    checked={isSelected}
                    className="mt-1 h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                    disabled={isBusy}
                    onChange={(event) => {
                      const nextIds = event.target.checked
                        ? [...currentCategoryIds, category.id]
                        : currentCategoryIds.filter((value) => value !== category.id);

                      form.setValue("categoryIds", nextIds, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    type="checkbox"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-stone-900">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-stone-600">
                      {category.description || "Sin descripcion."}
                    </span>
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            5. Puntuacion y notas
          </p>
          <h3 className="text-xl font-semibold text-stone-950">Datos de evaluacion</h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Confiabilidad</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="number"
              {...form.register("reliabilityScore")}
            />
          </label>
          <label className={labelClassName}>
            <span className="text-sm font-medium text-stone-700">Preferencia</span>
            <input
              className={fieldClassName}
              disabled={isBusy}
              type="number"
              {...form.register("preferenceScore")}
            />
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-medium text-stone-700">Notas</span>
          <textarea
            className={textAreaClassName}
            disabled={isBusy}
            placeholder="Contexto comercial, historial de negociacion o alertas de entrega."
            {...form.register("notes")}
          />
        </label>
      </section>

      {form.formState.errors.root?.message ? (
        <div className="rounded-md border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {form.formState.errors.root.message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className={primaryButtonClassName}
          disabled={isBusy}
          type="submit"
        >
          {props.mode === "create" ? <Truck className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isBusy
            ? props.mode === "create"
              ? "Creando proveedor..."
              : "Guardando cambios..."
            : props.mode === "create"
              ? "Crear proveedor"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
