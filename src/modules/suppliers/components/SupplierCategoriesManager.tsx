"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

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
import { supplierService } from "@/services/supplier-service";
import { getApiErrorMessage } from "@/utils";

import {
  SUPPLIERS_PERMISSIONS,
  SUPPLIERS_QUERY_KEYS,
} from "../constants";

type EditingCategoryState = {
  description: string;
  id: string | null;
  name: string;
};

const emptyCategoryState: EditingCategoryState = {
  description: "",
  id: null,
  name: "",
};

export function SupplierCategoriesManager() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(SUPPLIERS_PERMISSIONS.create);
  const canUpdate = permissions.includes(SUPPLIERS_PERMISSIONS.update);
  const canDelete = permissions.includes(SUPPLIERS_PERMISSIONS.delete);
  const [editingCategory, setEditingCategory] = useState<EditingCategoryState | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const categoriesQuery = useQuery({
    queryFn: () => supplierService.listSupplierCategories(searchInput),
    queryKey: [...SUPPLIERS_QUERY_KEYS.categories, searchInput],
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: EditingCategoryState) => {
      if (input.id) {
        return supplierService.updateSupplierCategory(input.id, {
          description: input.description.trim() || null,
          name: input.name.trim(),
        });
      }

      return supplierService.createSupplierCategory({
        description: input.description.trim() || null,
        name: input.name.trim(),
      });
    },
    onSuccess: async () => {
      setEditingCategory(null);
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SUPPLIERS_QUERY_KEYS.categories,
        }),
        queryClient.invalidateQueries({
          queryKey: SUPPLIERS_QUERY_KEYS.all,
        }),
      ]);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const category = categoriesQuery.data?.find((item) => item.id === categoryId);

      await supplierService.deleteSupplierCategory(
        categoryId,
        (category?.suppliersCount ?? 0) > 0,
      );
    },
    onSuccess: async () => {
      setPendingDeleteId(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SUPPLIERS_QUERY_KEYS.categories,
        }),
        queryClient.invalidateQueries({
          queryKey: SUPPLIERS_QUERY_KEYS.all,
        }),
        queryClient.invalidateQueries({
          queryKey: SUPPLIERS_QUERY_KEYS.scoringConfigs,
        }),
      ]);
    },
  });

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
        title="No se pudieron cargar las categorias de proveedores"
      />
    );
  }

  const pendingDeleteCategory = categoriesQuery.data?.find(
    (category) => category.id === pendingDeleteId,
  );

  return (
    <>
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Taxonomia de compras
            </p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.05em] text-stone-950">
              Categorias de proveedores
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
              Mantiene la clasificacion de compras consistente y ordena las reglas de puntaje
              por categoria.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              className={fieldClassName}
              onChange={(event) => {
                setSearchInput(event.target.value);
              }}
              placeholder="Buscar categorias"
              value={searchInput}
            />
            {canCreate ? (
              <button
                className={primaryButtonClassName}
                onClick={() => {
                  setFormError(null);
                  setEditingCategory(emptyCategoryState);
                }}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Nueva categoria
              </button>
            ) : null}
          </div>
        </div>

        {categoriesQuery.data && categoriesQuery.data.length > 0 ? (
          <div className={tableWrapperClassName}>
            <table className="min-w-full divide-y divide-stone-200/80">
              <thead className="bg-[var(--color-surface-muted)]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Descripcion</th>
                  <th className="px-4 py-3">Proveedores</th>
                  <th className="px-4 py-3">Configs activas</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 bg-white text-sm text-stone-700">
                {categoriesQuery.data.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-stone-900">{category.name}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      {category.description || "Sin descripcion registrada."}
                    </td>
                    <td className="px-4 py-4 align-top">{category.suppliersCount}</td>
                    <td className="px-4 py-4 align-top">
                      {category.activeScoringConfigsCount}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        {canUpdate ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setFormError(null);
                              setEditingCategory({
                                description: category.description ?? "",
                                id: category.id,
                                name: category.name,
                              });
                            }}
                            type="button"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            className={dangerButtonClassName}
                            onClick={() => {
                              setPendingDeleteId(category.id);
                            }}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
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
          <EmptyState
            description="Crea categorias para ordenar proveedores, reportes y reglas de puntaje especificas."
            title="No hay categorias registradas"
          />
        )}

        {!canCreate && !canUpdate && !canDelete ? (
          <div className="mt-5 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-muted)]">
            Tu acceso aqui es solo lectura. Los cambios siguen sujetos a permisos
            `suppliers.*`.
          </div>
        ) : null}
      </section>

      {editingCategory ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar editor de categoria"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={() => {
              setEditingCategory(null);
            }}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 rounded-md border border-[color:var(--color-border)] bg-white p-6 shadow-[0_28px_70px_rgba(15,47,91,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  {editingCategory.id ? "Editar categoria" : "Nueva categoria"}
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-[1.7rem] font-semibold uppercase tracking-[0.05em] text-stone-950">
                  {editingCategory.id ? editingCategory.name : "Crear categoria"}
                </h2>
              </div>
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  setEditingCategory(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">Nombre</span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setEditingCategory((current) =>
                      current
                        ? {
                            ...current,
                            name: event.target.value,
                          }
                        : current,
                    );
                  }}
                  value={editingCategory.name}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">Descripcion</span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setEditingCategory((current) =>
                      current
                        ? {
                            ...current,
                            description: event.target.value,
                          }
                        : current,
                    );
                  }}
                  value={editingCategory.description}
                />
              </label>

              {formError ? (
                <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  className={primaryButtonClassName}
                  disabled={
                    saveMutation.isPending || editingCategory.name.trim().length === 0
                  }
                  onClick={() => {
                    saveMutation.mutate(editingCategory);
                  }}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Guardando..." : "Guardar categoria"}
                </button>
                <button
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingCategory(null);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel={
          pendingDeleteCategory?.suppliersCount
            ? "Eliminar y quitar asignaciones"
            : "Eliminar categoria"
        }
        description={
          pendingDeleteCategory
            ? pendingDeleteCategory.suppliersCount > 0
              ? `${pendingDeleteCategory.name} esta asignada a ${pendingDeleteCategory.suppliersCount} proveedor${pendingDeleteCategory.suppliersCount === 1 ? "" : "es"}. Confirmar eliminara esas asignaciones y cualquier configuracion de puntaje asociada.`
              : `Eliminar ${pendingDeleteCategory.name}?`
            : ""
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDeleteCategory) {
            deleteMutation.mutate(pendingDeleteCategory.id);
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
        open={Boolean(pendingDeleteCategory)}
        title="Eliminar categoria?"
        tone="danger"
      />
    </>
  );
}
