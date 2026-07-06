"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";

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
import { getApiErrorMessage } from "@/utils";

import { MATERIALS_PERMISSIONS, MATERIALS_QUERY_KEYS } from "../constants";
import {
  EMPTY_MATERIAL_CATEGORY_FORM_VALUES,
  materialCategoryFormSchema,
  type MaterialCategoryFormValues,
} from "../hooks/useMaterials";
import { BooleanBadge } from "./MaterialBadges";

type FlatMaterialCategoryRow = {
  depth: number;
  id: string;
  parentId: string | null;
};

export function MaterialCategoriesManager() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(MATERIALS_PERMISSIONS.create);
  const canUpdate = permissions.includes(MATERIALS_PERMISSIONS.update);
  const canDelete = permissions.includes(MATERIALS_PERMISSIONS.delete);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const form = useForm<MaterialCategoryFormValues>({
    defaultValues: EMPTY_MATERIAL_CATEGORY_FORM_VALUES,
    resolver: zodResolver(materialCategoryFormSchema) as Resolver<MaterialCategoryFormValues>,
  });

  const categoriesQuery = useQuery({
    queryFn: () => materialService.listMaterialCategories(searchInput),
    queryKey: [...MATERIALS_QUERY_KEYS.categories, searchInput],
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: MaterialCategoryFormValues) => {
      const payload = {
        description: values.description.trim() || null,
        isActive: values.isActive,
        name: values.name.trim(),
        parentId: values.parentId.trim() || null,
        sortOrder: Number(values.sortOrder.trim() || "0"),
      };

      if (editingCategoryId) {
        return materialService.updateMaterialCategory(editingCategoryId, payload);
      }

      return materialService.createMaterialCategory(payload);
    },
    onSuccess: async () => {
      setEditingCategoryId(null);
      setIsEditorOpen(false);
      setFormError(null);
      form.reset(EMPTY_MATERIAL_CATEGORY_FORM_VALUES);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.categories,
        }),
        queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        }),
      ]);
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await materialService.deleteMaterialCategory(categoryId);
    },
    onSuccess: async () => {
      setPendingDeleteId(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.categories,
        }),
        queryClient.invalidateQueries({
          queryKey: MATERIALS_QUERY_KEYS.all,
        }),
      ]);
    },
  });

  const flatRows = useMemo(() => {
    const categories = categoriesQuery.data ?? [];
    const groupedByParentId = new Map<string | null, typeof categories>();

    categories.forEach((category) => {
      const bucket = groupedByParentId.get(category.parentId) ?? [];
      bucket.push(category);
      groupedByParentId.set(category.parentId, bucket);
    });

    const sortCategories = (categoryRows: typeof categories) =>
      [...categoryRows].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      });

    const flatten = (parentId: string | null, depth: number): FlatMaterialCategoryRow[] => {
      const rows = sortCategories(groupedByParentId.get(parentId) ?? []);

      return rows.flatMap((category) => [
        {
          depth,
          id: category.id,
          parentId: category.parentId,
        },
        ...flatten(category.id, depth + 1),
      ]);
    };

    return flatten(null, 0);
  }, [categoriesQuery.data]);

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
        title="No se pudieron cargar las categorias de materiales"
      />
    );
  }

  const editingCategory =
    categoriesQuery.data?.find((category) => category.id === editingCategoryId) ?? null;
  const pendingDeleteCategory =
    categoriesQuery.data?.find((category) => category.id === pendingDeleteId) ?? null;
  const categoryById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category]));

  return (
    <>
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Taxonomia de materiales
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Categorias de materiales
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              Organiza vidrio, aluminio, herrajes, consumibles y servicios dentro de una
              estructura jerarquica que luego reutilizan compras, cotizaciones e inventario.
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
                className={`${primaryButtonClassName} gap-2`}
                onClick={() => {
                  setEditingCategoryId(null);
                  setIsEditorOpen(true);
                  setFormError(null);
                  form.reset(EMPTY_MATERIAL_CATEGORY_FORM_VALUES);
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
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Padre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Materiales</th>
                  <th className="px-4 py-3">Subcategorias</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 bg-white/75 text-sm text-stone-700">
                {flatRows.map((row) => {
                  const category = categoryById.get(row.id);

                  if (!category) {
                    return null;
                  }

                  return (
                    <tr key={category.id}>
                      <td className="px-4 py-4 align-top">
                        <div
                          className="space-y-1"
                          style={{
                            paddingLeft: `${row.depth * 18}px`,
                          }}
                        >
                          <p className="font-semibold text-stone-900">{category.name}</p>
                          <p className="text-xs text-stone-500">{category.slug}</p>
                          {category.description ? (
                            <p className="text-sm text-stone-600">{category.description}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {category.parent ? category.parent.name : "Raiz"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <BooleanBadge
                          falseLabel="Inactiva"
                          trueLabel="Activa"
                          value={category.isActive}
                        />
                      </td>
                      <td className="px-4 py-4 align-top">{category.materialsCount}</td>
                      <td className="px-4 py-4 align-top">{category.childrenCount}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          {canUpdate ? (
                            <button
                              className={`${secondaryButtonClassName} gap-2`}
                              onClick={() => {
                                setEditingCategoryId(category.id);
                                setIsEditorOpen(true);
                                setFormError(null);
                                form.reset({
                                  description: category.description ?? "",
                                  isActive: category.isActive,
                                  name: category.name,
                                  parentId: category.parentId ?? "",
                                  sortOrder: String(category.sortOrder),
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
                              className={`${dangerButtonClassName} gap-2`}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            description="Crea la primera jerarquia para clasificar materiales de forma consistente en compras, cotizaciones e inventario."
            title="Aun no hay categorias de materiales"
          />
        )}
      </section>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar editor de categoria"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={() => {
              setEditingCategoryId(null);
              setIsEditorOpen(false);
              setFormError(null);
              form.reset(EMPTY_MATERIAL_CATEGORY_FORM_VALUES);
            }}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.99),rgba(226,240,255,0.99))] p-6 shadow-[0_28px_70px_rgba(15,47,91,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  {editingCategory ? "Editar categoria" : "Crear categoria"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                  {editingCategory ? editingCategory.name : "Nueva categoria de material"}
                </h3>
              </div>
              <button
                className="rounded-md border border-[color:var(--color-border)] bg-white p-2 text-[color:var(--color-text-muted)] transition hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text)]"
                onClick={() => {
                  setEditingCategoryId(null);
                  setIsEditorOpen(false);
                  setFormError(null);
                  form.reset(EMPTY_MATERIAL_CATEGORY_FORM_VALUES);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await saveMutation.mutateAsync(values);
                } catch {
                  // handled by mutation state
                }
              })}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">Nombre</span>
                  <input
                    className={fieldClassName}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name ? (
                    <span className="block text-sm text-rose-700">
                      {form.formState.errors.name.message}
                    </span>
                  ) : null}
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Categoria padre</span>
                  <select
                    className={fieldClassName}
                    {...form.register("parentId")}
                  >
                    <option value="">Categoria raiz</option>
                    {(categoriesQuery.data ?? [])
                      .filter((category) => category.id !== editingCategoryId)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Orden</span>
                  <input
                    className={fieldClassName}
                    {...form.register("sortOrder")}
                  />
                  {form.formState.errors.sortOrder ? (
                    <span className="block text-sm text-rose-700">
                      {form.formState.errors.sortOrder.message}
                    </span>
                  ) : null}
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">Descripcion</span>
                  <textarea
                    className={textAreaClassName}
                    {...form.register("description")}
                  />
                </label>

                <label className="flex items-center gap-3 rounded-md border border-stone-200/90 bg-white/85 px-4 py-4 md:col-span-2">
                  <input
                    className="h-4 w-4 rounded border-stone-300 text-stone-950"
                    type="checkbox"
                    {...form.register("isActive")}
                  />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Categoria activa</p>
                    <p className="text-xs text-stone-600">
                      Las categorias inactivas se conservan para historial, pero no deberian
                      usarse en nuevos registros de materiales.
                    </p>
                  </div>
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
                  onClick={() => {
                    setEditingCategoryId(null);
                    setIsEditorOpen(false);
                    setFormError(null);
                    form.reset(EMPTY_MATERIAL_CATEGORY_FORM_VALUES);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className={`${primaryButtonClassName} gap-2`}
                  disabled={saveMutation.isPending}
                  type="submit"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Guardando..." : "Guardar categoria"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel={deleteMutation.isPending ? "Eliminando..." : "Eliminar categoria"}
        description={
          pendingDeleteCategory
            ? `Eliminar ${pendingDeleteCategory.name}? Solo es posible cuando la categoria no tiene subcategorias ni materiales asignados.`
            : "Eliminar esta categoria?"
        }
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!pendingDeleteId) {
            return;
          }

          await deleteMutation.mutateAsync(pendingDeleteId);
        }}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setPendingDeleteId(null);
          }
        }}
        open={Boolean(pendingDeleteCategory)}
        title="Eliminar categoria"
        tone="danger"
      />
    </>
  );
}
