"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Pencil,
  ShoppingCart,
  Truck,
  Trash2,
} from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateValue, formatStatusLabel } from "@/lib/formatters";
import {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName as sharedSectionClassName,
} from "@/modules/commercial/ui";

import {
  SUPPLIERS_PERMISSIONS,
  SUPPLIERS_ROUTES,
} from "../constants";
import { useSuppliers } from "../hooks/useSuppliers";

type SupplierDetailProps = {
  supplierId: string;
};

const formatDate = (value: string | null): string => {
  if (!value) {
    return "No disponible";
  }

  return formatDateValue(value);
};

const formatScore = (value: number | null): string => {
  if (value === null) {
    return "Sin calificar";
  }

  return `${value.toFixed(1)} / 100`;
};

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { useDeleteSupplier, useSupplier } = useSuppliers();
  const supplierQuery = useSupplier(supplierId);
  const deleteMutation = useDeleteSupplier();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const canEdit = permissions.includes(SUPPLIERS_PERMISSIONS.update);
  const canDelete = permissions.includes(SUPPLIERS_PERMISSIONS.delete);
  const sectionClassName = sharedSectionClassName;

  if (supplierQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
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

  if (supplierQuery.isLoading || !supplierQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Cargando datos del proveedor...</p>
      </section>
    );
  }

  const supplier = supplierQuery.data;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[var(--color-primary)] p-4 text-blue-100">
              <Truck className="h-7 w-7" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Ficha del proveedor
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {supplier.legalName}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                {supplier.commercialName ? (
                  <span className="rounded-full bg-white/85 px-3 py-1.5">
                    {supplier.commercialName}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    supplier.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : supplier.status === "BLOCKED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {formatStatusLabel(supplier.status)}
                </span>
                {supplier.taxId ? (
                  <span className="rounded-full bg-white/85 px-3 py-1.5">
                    NIT: {supplier.taxId}
                  </span>
                ) : null}
              </div>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                {supplier.notes ||
                  "Aun no hay notas internas. Usa esta ficha para comparar precios, tiempos de entrega, confiabilidad y credito."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className={secondaryButtonClassName}
              href={SUPPLIERS_ROUTES.list}
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a proveedores
            </Link>
            {canEdit ? (
              <Link
                className={primaryButtonClassName}
                href={SUPPLIERS_ROUTES.edit(supplier.id)}
              >
                <Pencil className="h-4 w-4" />
                Editar proveedor
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Confiabilidad
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {formatScore(supplier.reliabilityScore)}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Preferencia
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {formatScore(supplier.preferenceScore)}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Tiempo de entrega
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
              {supplier.defaultLeadTimeDays === null
              ? "No definido"
              : `${supplier.defaultLeadTimeDays} d`}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Categorias
          </p>
          <p className="mt-3 text-3xl font-semibold text-stone-950">
            {supplier.categories.length}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Resumen
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Telefono
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {supplier.phone || "No disponible"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Email
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {supplier.email || "No disponible"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Ubicacion
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {[supplier.city, supplier.country].filter(Boolean).join(", ") || "No disponible"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Sitio web
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {supplier.website || "No disponible"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Categorias
              </dt>
              <dd className="mt-3 flex flex-wrap gap-2">
                {supplier.categories.length > 0 ? (
                  supplier.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900"
                    >
                      {category.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-stone-500">Sin categorias asignadas.</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Condiciones comerciales
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Condiciones de pago
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {supplier.paymentTerms || "No disponible"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Perfil de credito
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {supplier.creditAvailable
                  ? supplier.creditLimit === null
                    ? "Credito disponible"
                    : `Credito disponible hasta ${supplier.creditLimit.toFixed(2)}`
                  : "Sin credito disponible"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Contacto principal
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {supplier.contactName || "No disponible"}
              </dd>
              <p className="mt-1 text-sm text-stone-600">
                {[supplier.contactPosition, supplier.contactPhone, supplier.contactEmail]
                  .filter(Boolean)
                  .join(" | ") || "Sin datos directos de contacto"}
              </p>
            </div>
          </dl>

          {canDelete ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={dangerButtonClassName}
                disabled={deleteMutation.isPending}
                onClick={() => {
                  setIsDeleteDialogOpen(true);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar proveedor
              </button>
            </div>
          ) : null}
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Contactos adicionales
          </p>
          {supplier.contacts.length > 0 ? (
            <div className="mt-5 grid gap-4">
              {supplier.contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-semibold text-stone-950">{contact.name}</p>
                    {contact.isPrimary ? (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                        Principal
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    {[contact.position, contact.phone, contact.email]
                      .filter(Boolean)
                      .join(" | ") || "Sin datos directos"}
                  </p>
                  {contact.notes ? (
                    <p className="mt-2 text-sm leading-6 text-stone-700">{contact.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Aun no se agregaron contactos adicionales del proveedor."
              title="Los contactos apareceran aqui"
            />
          )}
        </section>

        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Registro
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Creado
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(supplier.createdAt)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Actualizado
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(supplier.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section className={sectionClassName}>
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-[var(--color-primary)] p-3 text-blue-100">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Futuras ordenes de compra
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Espacio de compras
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-700">
                La generacion de ordenes de compra aun esta diferida. Esta ficha ya esta lista
                para futuros flujos de recomendacion, aprobacion y recepcion.
              </p>
            </div>
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="flex items-start gap-4">
            <div className="rounded-md bg-[var(--color-primary)] p-3 text-blue-100">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Futuras listas de precios
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Espacio de comparacion de precios
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-700">
                Las importaciones de listas de precios todavia no forman parte de este modulo.
                Los puntajes manuales y los datos base del proveedor ya estan listos para esa
                siguiente capa.
              </p>
            </div>
          </div>
        </section>
      </section>

      <ConfirmDialog
        confirmLabel="Eliminar proveedor"
        description={`Eliminar ${supplier.legalName} de las vistas operativas activas?`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          deleteMutation.mutate(supplier.id, {
            onSuccess: () => {
              router.push(SUPPLIERS_ROUTES.list);
              router.refresh();
            },
          });
        }}
        onOpenChange={setIsDeleteDialogOpen}
        open={isDeleteDialogOpen}
        title="¿Eliminar este proveedor?"
        tone="danger"
      />
    </main>
  );
}
