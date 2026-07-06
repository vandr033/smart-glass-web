"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import {
  dangerButtonClassName,
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { materialService } from "@/services/material-service";
import { supplierService } from "@/services/supplier-service";
import { getApiErrorMessage } from "@/utils";

import {
  MATERIALS_PERMISSIONS,
  SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS,
  SUPPLIER_MATERIAL_STATUS_OPTIONS,
} from "../constants";
import {
  EMPTY_SUPPLIER_MATERIAL_EQUIVALENCE_FORM_VALUES,
  supplierMaterialEquivalenceFormSchema,
  type SupplierMaterialEquivalenceFormValues,
  useMaterials,
} from "../hooks/useMaterials";
import {
  SupplierMaterialConfidenceBadge,
  SupplierMaterialStatusBadge,
} from "./MaterialBadges";

type SupplierMaterialEquivalencesManagerProps = {
  materialId?: string;
};

type EditorMode = "create" | "edit" | "map" | null;

const labelClassName = "space-y-2";

const formatRelativeFallback = (value: string): string => {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export function SupplierMaterialEquivalencesManager({
  materialId,
}: SupplierMaterialEquivalencesManagerProps) {
  const { permissions } = usePermissions();
  const canReadSuppliers = permissions.includes("suppliers.read");
  const canCreate = permissions.includes(MATERIALS_PERMISSIONS.create) && canReadSuppliers;
  const canUpdate = permissions.includes(MATERIALS_PERMISSIONS.update);
  const canDelete = permissions.includes(MATERIALS_PERMISSIONS.delete);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState(materialId ?? "");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formValues, setFormValues] = useState<SupplierMaterialEquivalenceFormValues>(
    EMPTY_SUPPLIER_MATERIAL_EQUIVALENCE_FORM_VALUES,
  );
  const [mapMaterialId, setMapMaterialId] = useState(materialId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof SupplierMaterialEquivalenceFormValues, string>>
  >({});
  const [mapError, setMapError] = useState<string | null>(null);

  const {
    useCreateSupplierMaterialEquivalence,
    useDeleteSupplierMaterialEquivalence,
    useMapSupplierMaterialEquivalence,
    useSupplierMaterialEquivalences,
    useUpdateSupplierMaterialEquivalence,
    useVerifySupplierMaterialEquivalence,
  } = useMaterials();

  const createMutation = useCreateSupplierMaterialEquivalence();
  const updateMutation = useUpdateSupplierMaterialEquivalence();
  const deleteMutation = useDeleteSupplierMaterialEquivalence();
  const verifyMutation = useVerifySupplierMaterialEquivalence();
  const mapMutation = useMapSupplierMaterialEquivalence();
  const equivalencesQuery = useSupplierMaterialEquivalences({
    confidence:
      confidenceFilter.length > 0
        ? (confidenceFilter as (typeof SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS)[number]["value"])
        : undefined,
    materialId: materialId ?? (materialFilter || undefined),
    page,
    perPage: 10,
    search: searchInput,
    status:
      statusFilter.length > 0
        ? (statusFilter as (typeof SUPPLIER_MATERIAL_STATUS_OPTIONS)[number]["value"])
        : undefined,
    supplierId: supplierFilter || undefined,
  });

  const materialsOptionsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["materials", "options"],
    staleTime: 60_000,
  });

  const suppliersOptionsQuery = useQuery({
    enabled: canReadSuppliers,
    queryFn: async () => {
      const result = await supplierService.listSuppliers({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["suppliers", "options"],
    staleTime: 60_000,
  });

  const records = useMemo(
    () => equivalencesQuery.data?.data ?? [],
    [equivalencesQuery.data?.data],
  );
  const pagination = equivalencesQuery.data?.pagination;
  const pendingDeleteRecord =
    records.find((record) => record.id === pendingDeleteId) ?? null;
  const editingRecord =
    records.find((record) => record.id === editingRecordId) ?? null;
  const pendingMappings = useMemo(
    () => records.filter((record) => record.materialId === null).length,
    [records],
  );

  if (equivalencesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void equivalencesQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={equivalencesQuery.error.message}
        title="No se pudieron cargar las equivalencias de materiales de proveedor"
      />
    );
  }

  const closeEditor = () => {
    setEditorMode(null);
    setEditingRecordId(null);
    setFieldErrors({});
    setFormError(null);
    setMapError(null);
    setFormValues(EMPTY_SUPPLIER_MATERIAL_EQUIVALENCE_FORM_VALUES);
    setMapMaterialId(materialId ?? "");
  };

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditingRecordId(null);
    setFieldErrors({});
    setFormError(null);
    setMapError(null);
    setFormValues({
      ...EMPTY_SUPPLIER_MATERIAL_EQUIVALENCE_FORM_VALUES,
      materialId: materialId ?? "",
    });
  };

  const openEditEditor = (recordId: string) => {
    const record = records.find((item) => item.id === recordId);

    if (!record) {
      return;
    }

    setEditorMode("edit");
    setEditingRecordId(record.id);
    setFieldErrors({});
    setFormError(null);
    setMapError(null);
    setFormValues({
      confidence: record.confidence,
      conversionFactor:
        record.conversionFactor === null ? "" : String(record.conversionFactor),
      materialId: record.materialId ?? "",
      notes: record.notes ?? "",
      status: record.status,
      supplierDescription: record.supplierDescription ?? "",
      supplierId: record.supplierId,
      supplierName: record.supplierName,
      supplierSku: record.supplierSku ?? "",
      supplierUnit: record.supplierUnit ?? "",
    });
  };

  const openMapEditor = (recordId: string) => {
    const record = records.find((item) => item.id === recordId);

    if (!record) {
      return;
    }

    setEditorMode("map");
    setEditingRecordId(record.id);
    setFieldErrors({});
    setFormError(null);
    setMapError(null);
    setMapMaterialId(record.materialId ?? materialId ?? "");
  };

  const showFilters = !materialId;

  return (
    <>
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Equivalencias de proveedor
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Mapeos pendientes y vinculaciones verificadas
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              Relaciona SKUs y descripciones de proveedor con el maestro interno de
              materiales para que compras, precios e importaciones resuelvan catalogos
              externos sin friccion.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-3 text-sm text-stone-700">
              Mapeos pendientes:{" "}
              <span className="font-semibold text-stone-950">{pendingMappings}</span>
            </div>
            {canCreate ? (
              <button
                className={`${primaryButtonClassName} gap-2`}
                onClick={openCreateEditor}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Nueva equivalencia
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearchInput(event.target.value);
            }}
            placeholder="Buscar SKU del proveedor o nombre"
            value={searchInput}
          />
          {showFilters && canReadSuppliers ? (
            <select
              className={fieldClassName}
              onChange={(event) => {
                setPage(1);
                setSupplierFilter(event.target.value);
              }}
              value={supplierFilter}
            >
              <option value="">Todos los proveedores</option>
              {(suppliersOptionsQuery.data ?? []).map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.legalName}
                </option>
              ))}
            </select>
          ) : null}
          {showFilters ? (
            <select
              className={fieldClassName}
              onChange={(event) => {
                setPage(1);
                setMaterialFilter(event.target.value);
              }}
              value={materialFilter}
            >
              <option value="">Todos los materiales</option>
              {(materialsOptionsQuery.data ?? []).map((material) => (
                <option key={material.id} value={material.id}>
                  {material.code} · {material.name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setConfidenceFilter(event.target.value);
            }}
            value={confidenceFilter}
          >
            <option value="">Todos los niveles de confianza</option>
            {SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            value={statusFilter}
          >
            <option value="">Todos los estados</option>
            {SUPPLIER_MATERIAL_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {records.length > 0 ? (
          <div className={`mt-5 ${tableWrapperClassName}`}>
            <table className="min-w-full divide-y divide-stone-200/80">
              <thead className="bg-[var(--color-surface-muted)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  <th className="px-4 py-3">Articulo del proveedor</th>
                  <th className="px-4 py-3">Material vinculado</th>
                  <th className="px-4 py-3">Confianza</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Actualizado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 bg-white/75 text-sm text-stone-700">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-4 align-top">
                      <div className="min-w-[15rem] space-y-1">
                        <p className="font-semibold text-stone-900">{record.supplierName}</p>
                        <p className="text-xs text-stone-500">
                          {record.supplier.legalName}
                          {record.supplierSku ? ` • SKU ${record.supplierSku}` : ""}
                        </p>
                        {record.supplierDescription ? (
                          <p className="text-sm text-stone-600">
                            {record.supplierDescription}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {record.material ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-stone-900">
                            {record.material.code}
                          </p>
                          <p className="text-sm text-stone-700">{record.material.name}</p>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-sm border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                          Pendiente de mapeo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <SupplierMaterialConfidenceBadge value={record.confidence} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <SupplierMaterialStatusBadge value={record.status} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      {formatRelativeFallback(record.updatedAt)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap justify-end gap-2">
                        {canUpdate ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              openMapEditor(record.id);
                            }}
                            type="button"
                          >
                            {record.materialId ? "Reasignar" : "Mapear"}
                          </button>
                        ) : null}
                        {canUpdate && canReadSuppliers ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              openEditEditor(record.id);
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                        ) : null}
                        {canUpdate && record.confidence !== "VERIFIED" ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={async () => {
                              await verifyMutation.mutateAsync(record.id);
                            }}
                            type="button"
                          >
                            Verificar
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            className={dangerButtonClassName}
                            onClick={() => {
                              setPendingDeleteId(record.id);
                            }}
                            type="button"
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              description="Crea equivalencias o amplia los filtros para empezar a conectar articulos externos con el maestro interno de materiales."
              title="No hay equivalencias que coincidan con la vista actual"
            />
          </div>
        )}

        {pagination ? (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-md border border-stone-200/90 bg-white/80 px-4 py-3 text-sm text-stone-700">
            <p>
              Pagina {pagination.page} de{" "}
              {Math.max(1, Math.ceil(pagination.total / pagination.perPage))} •{" "}
              {pagination.total} registro(s)
            </p>
            <div className="flex gap-3">
              <button
                className={secondaryButtonClassName}
                disabled={pagination.page <= 1}
                onClick={() => {
                  setPage((current) => Math.max(1, current - 1));
                }}
                type="button"
              >
                Anterior
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={pagination.page * pagination.perPage >= pagination.total}
                onClick={() => {
                  setPage((current) => current + 1);
                }}
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {editorMode === "create" || editorMode === "edit" ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar editor de equivalencias de proveedor"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={closeEditor}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-3xl -translate-y-1/2 rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.99),rgba(226,240,255,0.99))] p-6 shadow-[0_28px_70px_rgba(15,47,91,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  {editorMode === "edit" ? "Editar equivalencia" : "Nueva equivalencia"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                  {editorMode === "edit"
                    ? editingRecord?.supplierName ?? "Actualizar articulo del proveedor"
                    : "Nuevo articulo de proveedor"}
                </h3>
              </div>
              <button
                className={secondaryButtonClassName}
                onClick={closeEditor}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = supplierMaterialEquivalenceFormSchema.safeParse(formValues);

                if (!result.success) {
                  const nextFieldErrors: Partial<
                    Record<keyof SupplierMaterialEquivalenceFormValues, string>
                  > = {};

                  result.error.issues.forEach((issue) => {
                    const path = issue.path[0];

                    if (typeof path === "string") {
                      nextFieldErrors[path as keyof SupplierMaterialEquivalenceFormValues] =
                        issue.message;
                    }
                  });

                  setFieldErrors(nextFieldErrors);
                  return;
                }

                try {
                  if (editorMode === "edit" && editingRecordId) {
                    await updateMutation.mutateAsync({
                      equivalenceId: editingRecordId,
                      values: result.data,
                    });
                  } else {
                    await createMutation.mutateAsync(result.data);
                  }

                  closeEditor();
                } catch (error) {
                  setFormError(getApiErrorMessage(error));
                }
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Proveedor</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        supplierId: event.target.value,
                      }));
                    }}
                    value={formValues.supplierId}
                  >
                    <option value="">Selecciona un proveedor</option>
                    {(suppliersOptionsQuery.data ?? []).map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.legalName}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.supplierId ? (
                    <span className="block text-sm text-rose-700">{fieldErrors.supplierId}</span>
                  ) : null}
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Material interno</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        materialId: event.target.value,
                      }));
                    }}
                    value={formValues.materialId}
                  >
                    <option value="">Pendiente de mapeo</option>
                    {(materialsOptionsQuery.data ?? []).map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.code} · {material.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`${labelClassName} md:col-span-2`}>
                  <span className="text-sm font-medium text-stone-700">
                    Nombre del material del proveedor
                  </span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        supplierName: event.target.value,
                      }));
                    }}
                    value={formValues.supplierName}
                  />
                  {fieldErrors.supplierName ? (
                    <span className="block text-sm text-rose-700">
                      {fieldErrors.supplierName}
                    </span>
                  ) : null}
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">SKU del proveedor</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        supplierSku: event.target.value,
                      }));
                    }}
                    value={formValues.supplierSku}
                  />
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Unidad del proveedor</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        supplierUnit: event.target.value,
                      }));
                    }}
                    value={formValues.supplierUnit}
                  />
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Confianza</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        confidence: event.target.value as SupplierMaterialEquivalenceFormValues["confidence"],
                      }));
                    }}
                    value={formValues.confidence}
                  >
                    {SUPPLIER_MATERIAL_CONFIDENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Estado</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        status: event.target.value as SupplierMaterialEquivalenceFormValues["status"],
                      }));
                    }}
                    value={formValues.status}
                  >
                    {SUPPLIER_MATERIAL_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Factor de conversion</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        conversionFactor: event.target.value,
                      }));
                    }}
                    value={formValues.conversionFactor}
                  />
                </label>

                <label className={`${labelClassName} md:col-span-2`}>
                  <span className="text-sm font-medium text-stone-700">Descripcion del proveedor</span>
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        supplierDescription: event.target.value,
                      }));
                    }}
                    value={formValues.supplierDescription}
                  />
                </label>

                <label className={`${labelClassName} md:col-span-2`}>
                  <span className="text-sm font-medium text-stone-700">Notas</span>
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        notes: event.target.value,
                      }));
                    }}
                    value={formValues.notes}
                  />
                </label>
              </div>

              {formError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  className={secondaryButtonClassName}
                  onClick={closeEditor}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={`${primaryButtonClassName} gap-2`}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : "Guardar equivalencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editorMode === "map" ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar editor de mapeo"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={closeEditor}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.99),rgba(226,240,255,0.99))] p-6 shadow-[0_28px_70px_rgba(15,47,91,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Mapear articulo del proveedor
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                  {editingRecord?.supplierName ?? "Selecciona el material interno"}
                </h3>
              </div>
              <button
                className={secondaryButtonClassName}
                onClick={closeEditor}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();

                if (!mapMaterialId) {
                  setMapError("Selecciona un material interno para completar el mapeo.");
                  return;
                }

                if (!editingRecordId) {
                  return;
                }

                try {
                  await mapMutation.mutateAsync({
                    equivalenceId: editingRecordId,
                    materialId: mapMaterialId,
                  });
                  closeEditor();
                } catch (error) {
                  setMapError(getApiErrorMessage(error));
                }
              }}
            >
              <label className={labelClassName}>
                <span className="text-sm font-medium text-stone-700">Material interno</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setMapMaterialId(event.target.value);
                  }}
                  value={mapMaterialId}
                >
                  <option value="">Selecciona un material interno</option>
                  {(materialsOptionsQuery.data ?? []).map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.code} · {material.name}
                    </option>
                  ))}
                </select>
              </label>

              {mapError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {mapError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  className={secondaryButtonClassName}
                  onClick={closeEditor}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={`${primaryButtonClassName} gap-2`}
                  disabled={mapMutation.isPending}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {mapMutation.isPending ? "Mapeando..." : "Guardar mapeo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel={deleteMutation.isPending ? "Eliminando..." : "Eliminar equivalencia"}
        description={
          pendingDeleteRecord
            ? `Eliminar la equivalencia del proveedor ${pendingDeleteRecord.supplierName}?`
            : "Eliminar esta equivalencia?"
        }
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!pendingDeleteId) {
            return;
          }

          await deleteMutation.mutateAsync(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setPendingDeleteId(null);
          }
        }}
        open={Boolean(pendingDeleteRecord)}
        title="Eliminar equivalencia?"
        tone="danger"
      />
    </>
  );
}
