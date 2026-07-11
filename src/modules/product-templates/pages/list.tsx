"use client";

import Link from "next/link";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { FileCode2, Plus, RefreshCcw } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { productTemplateService } from "@/services/product-template-service";
import type {
  ProductTemplateStatus,
  ProductTemplateType,
} from "@/types";

import {
  PRODUCT_TEMPLATE_QUERY_KEYS,
  PRODUCT_TEMPLATE_STATUS_LABELS,
  PRODUCT_TEMPLATE_TYPE_LABELS,
  PRODUCT_TEMPLATE_VERSION_STATUS_LABELS,
  PRODUCT_TEMPLATES_ROUTES,
} from "../constants";

type ProductTemplatesListPageProps = {
  canManage: boolean;
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

const statusBadgeClassName = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-800";
    case "ARCHIVED":
      return "bg-stone-200 text-stone-700";
    case "INACTIVE":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-sky-100 text-sky-800";
  }
};

export default function ProductTemplatesListPage({
  canManage,
}: ProductTemplatesListPageProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productType, setProductType] = useState<"" | ProductTemplateType>("");
  const [status, setStatus] = useState<"" | ProductTemplateStatus>("");

  const templatesQuery = useQuery({
    queryFn: async () =>
      productTemplateService.listTemplates({
        page,
        perPage: 12,
        productType: productType || undefined,
        search,
        sortBy: "updatedAt",
        sortDirection: "desc",
        status: status || undefined,
      }),
    queryKey: PRODUCT_TEMPLATE_QUERY_KEYS.list({
      page,
      perPage: 12,
      productType,
      search,
      status,
    }),
  });

  if (templatesQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando plantillas" />;
  }

  if (templatesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void templatesQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={templatesQuery.error.message}
        title="Error cargando plantillas"
      />
    );
  }

  const records = templatesQuery.data?.data ?? [];
  const pagination = templatesQuery.data?.pagination;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.perPage)) : 1;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href="/admin/quotations">
              <FileCode2 className="mr-2 h-4 w-4" />
              Cotizaciones pendientes
            </Link>
            {canManage ? (
              <Link className={primaryButtonClassName} href={PRODUCT_TEMPLATES_ROUTES.create}>
                <Plus className="mr-2 h-4 w-4" />
                Crear plantilla
              </Link>
            ) : null}
          </>
        }
        description="Crea y administra plantillas de productos para estandarizar la configuración de cotizaciones y optimizaciones."
        eyebrow="Configuración de Cotización"
        title="Plantillas de productos"
      />

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Librería de plantillas de productos
            </h2>
          </div>

          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void templatesQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Recargar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por codigo o nombre"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setProductType((event.target.value as ProductTemplateType | "") ?? "");
            }}
            value={productType}
          >
            <option value="">Todos los tipos de producto</option>
            {Object.entries(PRODUCT_TEMPLATE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus((event.target.value as ProductTemplateStatus | "") ?? "");
            }}
            value={status}
          >
            <option value="">Cualquier Estado</option>
            {Object.entries(PRODUCT_TEMPLATE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          action={
            canManage ? (
              <Link className={primaryButtonClassName} href={PRODUCT_TEMPLATES_ROUTES.create}>
                Create plantilla
              </Link>
            ) : null
          }
          // Texto equivalente: la descripción de esta tabla se mantiene en español.
          description="Una vez que se creen plantillas, esta tabla mostrará su versión activa, la cobertura de reglas y el camino más rápido hacia la simulación."
          title="No hay plantillas de productos que mostrar"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Plantilla</th>
                  <th className="px-5 py-4 font-semibold">Tipo</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Versíon Actual</th>
                  <th className="px-5 py-4 font-semibold">Actualizado</th>
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-stone-200/80 align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-950">{record.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                        {record.code}
                      </p>
                      {record.description ? (
                        <p className="mt-2 max-w-lg text-sm leading-6 text-stone-600">
                          {record.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {PRODUCT_TEMPLATE_TYPE_LABELS[record.productType]}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName(record.status)}`}
                      >
                        {PRODUCT_TEMPLATE_STATUS_LABELS[record.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {record.currentVersion ? (
                        <>
                          <p className="font-medium text-stone-950">
                            V{record.currentVersion.versionNumber} · {record.currentVersion.name}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {PRODUCT_TEMPLATE_VERSION_STATUS_LABELS[
                              record.currentVersion.status
                            ]} · {formatDateTime(record.currentVersion.activatedAt)}
                          </p>
                        </>
                      ) : (
                        <span className="text-stone-500">No version yet</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateTime(record.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className={secondaryButtonClassName}
                          href={PRODUCT_TEMPLATES_ROUTES.view(record.id)}
                        >
                          View
                        </Link>
                        {record.currentVersion ? (
                          <Link
                            className={secondaryButtonClassName}
                            href={PRODUCT_TEMPLATES_ROUTES.versionSimulate(
                              record.currentVersion.id,
                            )}
                          >
                            Simulate
                          </Link>
                        ) : null}
                        {canManage ? (
                          <Link
                            className={secondaryButtonClassName}
                            href={PRODUCT_TEMPLATES_ROUTES.edit(record.id)}
                          >
                            Edit
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-stone-200/80 px-5 py-4">
            <p className="text-sm text-stone-600">
              Page {pagination?.page ?? 1} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                className={secondaryButtonClassName}
                disabled={page <= 1}
                onClick={() => {
                  setPage((currentPage) => Math.max(1, currentPage - 1));
                }}
                type="button"
              >
                Previous
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={page >= totalPages}
                onClick={() => {
                  setPage((currentPage) => Math.min(totalPages, currentPage + 1));
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
