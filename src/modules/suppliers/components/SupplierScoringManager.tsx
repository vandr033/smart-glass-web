"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Pencil, Plus, Save, Trash2, X } from "lucide-react";

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
} from "@/modules/commercial/ui";
import { supplierService } from "@/services/supplier-service";
import type {
  SupplierScoringConfigInput,
  SupplierScoringConfigRecord,
  SupplierScoringCriterionRecord,
  SupplierScoringSimulationResponse,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  SUPPLIER_SCORING_PERMISSIONS,
  SUPPLIERS_QUERY_KEYS,
} from "../constants";

type EditingConfigState = SupplierScoringConfigInput & {
  id: string | null;
};

const buildEditingState = (
  criteria: SupplierScoringCriterionRecord[],
  config?: SupplierScoringConfigRecord,
): EditingConfigState => {
  if (config) {
    return {
      categoryId: config.category?.id ?? null,
      id: config.id,
      isActive: config.isActive,
      isDefault: config.isDefault,
      name: config.name,
      scope: config.scope,
      weights: criteria.map((criterion) => ({
        criterionId: criterion.id,
        weight:
          config.weights.find((weight) => weight.criterionId === criterion.id)?.weight ?? 0,
      })),
    };
  }

  return {
    categoryId: null,
    id: null,
    isActive: true,
    isDefault: false,
    name: "",
    scope: "GLOBAL",
    weights: criteria.map((criterion) => ({
      criterionId: criterion.id,
      weight: 0,
    })),
  };
};

const formatWeightTotal = (values: EditingConfigState | null): number => {
  if (!values) {
    return 0;
  }

  return Number(
    values.weights.reduce((sum, weight) => sum + weight.weight, 0).toFixed(2),
  );
};

export function SupplierScoringManager() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canEdit = permissions.includes(SUPPLIER_SCORING_PERMISSIONS.update);
  const [editingConfig, setEditingConfig] = useState<EditingConfigState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [simulationCategoryId, setSimulationCategoryId] = useState<string>("");
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [manualScores, setManualScores] = useState<
    Record<string, { availability?: number; price?: number }>
  >({});

  const criteriaQuery = useQuery({
    queryFn: supplierService.getSupplierScoringCriteria,
    queryKey: SUPPLIERS_QUERY_KEYS.scoringCriteria,
    staleTime: 60_000,
  });
  const categoriesQuery = useQuery({
    queryFn: () => supplierService.listSupplierCategories(),
    queryKey: SUPPLIERS_QUERY_KEYS.categories,
    staleTime: 60_000,
  });
  const configsQuery = useQuery({
    queryFn: supplierService.listSupplierScoringConfigs,
    queryKey: SUPPLIERS_QUERY_KEYS.scoringConfigs,
    staleTime: 30_000,
  });
  const suppliersQuery = useQuery({
    queryFn: () =>
      supplierService.listSuppliers({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      }),
    queryKey: [...SUPPLIERS_QUERY_KEYS.all, "options"],
    staleTime: 30_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: EditingConfigState) => {
      const payload: SupplierScoringConfigInput = {
        categoryId: input.scope === "CATEGORY" ? input.categoryId : null,
        isActive: input.isActive,
        isDefault: input.scope === "GLOBAL" ? input.isDefault : false,
        name: input.name.trim(),
        scope: input.scope,
        weights: input.weights,
      };

      if (input.id) {
        return supplierService.updateSupplierScoringConfig(input.id, payload);
      }

      return supplierService.createSupplierScoringConfig(payload);
    },
    onSuccess: async () => {
      setEditingConfig(null);
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: SUPPLIERS_QUERY_KEYS.scoringConfigs,
      });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (configId: string) => {
      await supplierService.deleteSupplierScoringConfig(configId);
    },
    onSuccess: async () => {
      setPendingDeleteId(null);
      await queryClient.invalidateQueries({
        queryKey: SUPPLIERS_QUERY_KEYS.scoringConfigs,
      });
    },
  });

  const simulationMutation = useMutation({
    mutationFn: async () => {
      return supplierService.simulateSupplierScoring({
        categoryId: simulationCategoryId || null,
        manualScores,
        supplierIds: selectedSupplierIds,
      });
    },
  });

  if (
    criteriaQuery.isError ||
    categoriesQuery.isError ||
    configsQuery.isError ||
    suppliersQuery.isError
  ) {
    const message =
      criteriaQuery.error?.message ||
      categoriesQuery.error?.message ||
      configsQuery.error?.message ||
      suppliersQuery.error?.message ||
      "No se pudieron cargar los datos de puntaje.";

    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([
                criteriaQuery.refetch(),
                categoriesQuery.refetch(),
                configsQuery.refetch(),
                suppliersQuery.refetch(),
              ]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={message}
        title="No se pudieron cargar los puntajes de proveedores"
      />
    );
  }

  const criteria = criteriaQuery.data ?? [];
  const configs = configsQuery.data ?? [];
  const supplierOptions = suppliersQuery.data?.data ?? [];
  const selectedConfigToDelete = configs.find((config) => config.id === pendingDeleteId);
  const currentWeightTotal = formatWeightTotal(editingConfig);

  return (
    <>
      <section className="space-y-6">
        <section className={sectionClassName}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Registro de puntajes
              </p>
              <h2 className="mt-2 font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.05em] text-stone-950">
                Configuraciones de puntaje
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
                Define la ponderacion base para compras y permite sobrescribirla por categoria
                cuando la estrategia de abastecimiento cambie.
              </p>
            </div>

            {canEdit ? (
              <button
                className={primaryButtonClassName}
                onClick={() => {
                  setFormError(null);
                  setEditingConfig(buildEditingState(criteria));
                }}
                type="button"
              >
                <Plus className="h-4 w-4" />
                Nueva configuracion
              </button>
            ) : null}
          </div>

          {configs.length > 0 ? (
            <div className={tableWrapperClassName}>
              <table className="min-w-full divide-y divide-stone-200/80">
                <thead className="bg-[var(--color-surface-muted)]">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-4 py-3">Configuracion</th>
                    <th className="px-4 py-3">Alcance</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/80 bg-white text-sm text-stone-700">
                  {configs.map((config) => (
                    <tr key={config.id}>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-stone-900">{config.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {config.isDefault ? (
                            <span className="rounded-sm border border-blue-200 bg-[var(--color-primary-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--color-primary-soft-text)]">
                              Config global predeterminada
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {config.scope === "GLOBAL" ? "Global" : "Por categoria"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        {config.category?.name || "Aplica a todas las categorias"}
                      </td>
                      <td className="px-4 py-4 align-top">{config.totalWeight}</td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-sm px-2 py-1 text-[11px] font-semibold ${
                            config.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {config.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          {canEdit ? (
                            <button
                              className={secondaryButtonClassName}
                              onClick={() => {
                                setFormError(null);
                                setEditingConfig(buildEditingState(criteria, config));
                              }}
                              type="button"
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                          ) : null}
                          {canEdit ? (
                            <button
                              className={dangerButtonClassName}
                              onClick={() => {
                                setPendingDeleteId(config.id);
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
              description="Crea la configuracion base para que compras y comparativos tengan una referencia consistente."
              title="No hay configuraciones registradas"
            />
          )}

          {!canEdit ? (
            <div className="mt-5 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[color:var(--color-text-muted)]">
              Tu acceso aqui es solo lectura. Solo usuarios con `system.settings.update`
              pueden cambiar configuraciones.
            </div>
          ) : null}
        </section>

        <section className={sectionClassName}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Simulacion
              </p>
              <h2 className="mt-2 font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.05em] text-stone-950">
                Simulador de proveedores
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-700">
                Compara proveedores usando la configuracion activa por categoria o la regla
                global para anticipar decisiones de compra.
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">Categoria (opcional)</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSimulationCategoryId(event.target.value);
                  }}
                  value={simulationCategoryId}
                >
                  <option value="">Usar configuracion global</option>
                  {(categoriesQuery.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-3">
                <p className="text-sm font-medium text-stone-700">Selecciona proveedores</p>
                <div className="grid max-h-80 gap-3 overflow-auto pr-2">
                  {supplierOptions.map((supplier) => {
                    const isSelected = selectedSupplierIds.includes(supplier.id);

                    return (
                      <label
                        key={supplier.id}
                        className="flex items-start gap-3 rounded-md border border-stone-200/90 bg-white/80 px-4 py-4"
                      >
                        <input
                          checked={isSelected}
                          className="mt-1 h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                          onChange={(event) => {
                            setSelectedSupplierIds((current) =>
                              event.target.checked
                                ? [...current, supplier.id]
                                : current.filter((value) => value !== supplier.id),
                            );
                          }}
                          type="checkbox"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-stone-900">
                            {supplier.legalName}
                          </span>
                          <span className="mt-1 block text-sm text-stone-600">
                            {supplier.categories.map((category) => category.name).join(", ") ||
                              "Sin categoria"}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                className={primaryButtonClassName}
                disabled={selectedSupplierIds.length === 0 || simulationMutation.isPending}
                onClick={() => {
                  simulationMutation.mutate();
                }}
                type="button"
              >
                <Calculator className="h-4 w-4" />
                {simulationMutation.isPending ? "Ejecutando simulacion..." : "Ejecutar simulacion"}
              </button>
            </div>

            <div className="space-y-5">
              <div className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
                <p className="text-sm font-semibold text-stone-900">Puntajes manuales</p>
                <p className="mt-1 text-sm text-stone-600">
                  Precio y disponibilidad usan valores de 0 a 100 mientras los modulos
                  posteriores terminan de integrarse.
                </p>
              </div>

              {selectedSupplierIds.length > 0 ? (
                <div className="grid gap-4">
                  {selectedSupplierIds.map((supplierId) => {
                    const supplier = supplierOptions.find((item) => item.id === supplierId);

                    if (!supplier) {
                      return null;
                    }

                    return (
                      <div
                        key={supplierId}
                        className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4"
                      >
                        <p className="text-sm font-semibold text-stone-900">
                          {supplier.legalName}
                        </p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="grid gap-2">
                            <span className="text-sm font-medium text-stone-700">Puntaje de precio</span>
                            <input
                              className={fieldClassName}
                              onChange={(event) => {
                                setManualScores((current) => ({
                                  ...current,
                                  [supplierId]: {
                                    ...current[supplierId],
                                    price: event.target.value
                                      ? Number(event.target.value)
                                      : undefined,
                                  },
                                }));
                              }}
                              type="number"
                              value={manualScores[supplierId]?.price ?? ""}
                            />
                          </label>
                          <label className="grid gap-2">
                            <span className="text-sm font-medium text-stone-700">
                              Puntaje de disponibilidad
                            </span>
                            <input
                              className={fieldClassName}
                              onChange={(event) => {
                                setManualScores((current) => ({
                                  ...current,
                                  [supplierId]: {
                                    ...current[supplierId],
                                    availability: event.target.value
                                      ? Number(event.target.value)
                                      : undefined,
                                  },
                                }));
                              }}
                              type="number"
                              value={manualScores[supplierId]?.availability ?? ""}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  description="Selecciona uno o mas proveedores para previsualizar el orden sugerido por la configuracion activa."
                  title="La simulacion aparecera aqui"
                />
              )}
            </div>
          </div>

          {simulationMutation.isError ? (
            <div className="mt-5 rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {simulationMutation.error.message}
            </div>
          ) : null}

          {simulationMutation.data ? (
            <SimulationResults result={simulationMutation.data} />
          ) : null}
        </section>
      </section>

      {editingConfig ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar editor de configuracion"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={() => {
              setEditingConfig(null);
            }}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-4xl -translate-y-1/2 rounded-md border border-[color:var(--color-border)] bg-white p-6 shadow-[0_28px_70px_rgba(15,47,91,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  {editingConfig.id ? "Editar configuracion" : "Nueva configuracion"}
                </p>
                <h2 className="mt-2 font-[family:var(--font-display)] text-[1.7rem] font-semibold uppercase tracking-[0.05em] text-stone-950">
                  {editingConfig.id ? editingConfig.name : "Crear configuracion"}
                </h2>
              </div>
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  setEditingConfig(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">Nombre</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setEditingConfig((current) =>
                        current
                          ? {
                              ...current,
                              name: event.target.value,
                            }
                          : current,
                      );
                    }}
                    value={editingConfig.name}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-stone-700">Alcance</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      const nextScope = event.target.value as EditingConfigState["scope"];
                      setEditingConfig((current) =>
                        current
                          ? {
                              ...current,
                              categoryId: nextScope === "CATEGORY" ? current.categoryId : null,
                              isDefault: nextScope === "GLOBAL" ? current.isDefault : false,
                              scope: nextScope,
                            }
                          : current,
                      );
                    }}
                    value={editingConfig.scope}
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="CATEGORY">Por categoria</option>
                  </select>
                </label>
                {editingConfig.scope === "CATEGORY" ? (
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-sm font-medium text-stone-700">Categoria</span>
                    <select
                      className={fieldClassName}
                      onChange={(event) => {
                        setEditingConfig((current) =>
                          current
                            ? {
                                ...current,
                                categoryId: event.target.value || null,
                              }
                            : current,
                        );
                      }}
                      value={editingConfig.categoryId ?? ""}
                    >
                      <option value="">Selecciona una categoria</option>
                      {(categoriesQuery.data ?? []).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between gap-4 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
                  <span>
                    <span className="block text-sm font-medium text-stone-700">Activa</span>
                    <span className="mt-1 block text-xs text-stone-500">
                      Solo las configuraciones activas participan en la evaluacion.
                    </span>
                  </span>
                  <input
                    checked={editingConfig.isActive}
                    className="h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                    onChange={(event) => {
                      setEditingConfig((current) =>
                        current
                          ? {
                              ...current,
                              isActive: event.target.checked,
                            }
                          : current,
                      );
                    }}
                    type="checkbox"
                  />
                </label>
                {editingConfig.scope === "GLOBAL" ? (
                  <label className="flex items-center justify-between gap-4 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
                    <span>
                      <span className="block text-sm font-medium text-stone-700">
                        Config global predeterminada
                      </span>
                      <span className="mt-1 block text-xs text-stone-500">
                        Se usa cuando no existe una regla especifica para la categoria.
                      </span>
                    </span>
                    <input
                      checked={editingConfig.isDefault}
                      className="h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                      onChange={(event) => {
                        setEditingConfig((current) =>
                          current
                            ? {
                                ...current,
                                isDefault: event.target.checked,
                              }
                            : current,
                        );
                      }}
                      type="checkbox"
                    />
                  </label>
                ) : null}
              </div>

              <div className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Pesos</p>
                    <p className="mt-1 text-sm text-stone-600">
                      El total debe sumar exactamente 100 antes de guardar.
                    </p>
                  </div>
                  <span
                    className={`rounded-sm px-2 py-1 text-[11px] font-semibold ${
                      currentWeightTotal === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-900"
                    }`}
                  >
                    Total: {currentWeightTotal}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {criteria.map((criterion) => {
                    const currentWeight =
                      editingConfig.weights.find(
                        (weight) => weight.criterionId === criterion.id,
                      )?.weight ?? 0;

                    return (
                      <label
                        key={criterion.id}
                        className="grid gap-2 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
                      >
                        <span className="text-sm font-medium text-stone-900">
                          {criterion.label}
                        </span>
                        <span className="text-sm text-stone-600">
                          {criterion.description || "Sin descripcion registrada."}
                        </span>
                        <input
                          className={fieldClassName}
                          onChange={(event) => {
                            const nextWeight = event.target.value
                              ? Number(event.target.value)
                              : 0;
                            setEditingConfig((current) =>
                              current
                                ? {
                                    ...current,
                                    weights: current.weights.map((weight) =>
                                      weight.criterionId === criterion.id
                                        ? {
                                            ...weight,
                                            weight: nextWeight,
                                          }
                                        : weight,
                                    ),
                                  }
                                : current,
                            );
                          }}
                          type="number"
                          value={currentWeight}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {formError ? (
                <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  className={primaryButtonClassName}
                  disabled={
                    saveMutation.isPending ||
                    editingConfig.name.trim().length === 0 ||
                    currentWeightTotal !== 100 ||
                    (editingConfig.scope === "CATEGORY" && !editingConfig.categoryId)
                  }
                  onClick={() => {
                    saveMutation.mutate(editingConfig);
                  }}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Guardando..." : "Guardar configuracion"}
                </button>
                <button
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingConfig(null);
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
        confirmLabel="Eliminar configuracion"
        description={
          selectedConfigToDelete
            ? `Eliminar ${selectedConfigToDelete.name} y retirarla de futuras simulaciones de proveedores?`
            : ""
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (selectedConfigToDelete) {
            deleteMutation.mutate(selectedConfigToDelete.id);
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
        open={Boolean(selectedConfigToDelete)}
        title="Eliminar configuracion?"
        tone="danger"
      />
    </>
  );
}

function SimulationResults({
  result,
}: {
  result: SupplierScoringSimulationResponse;
}) {
  return (
    <section className="mt-6 rounded-md border border-[color:var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Configuracion activa
          </p>
          <h3 className="mt-2 font-[family:var(--font-display)] text-[1.7rem] font-semibold uppercase tracking-[0.05em] text-stone-950">
            {result.selectedConfig.name}
          </h3>
          <p className="mt-2 text-sm text-stone-600">
            {result.selectedConfig.scope === "CATEGORY"
              ? `Configuracion por categoria para ${result.selectedConfig.category?.name ?? "la categoria seleccionada"}`
              : "Configuracion global activa"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {result.weights.map((weight) => (
            <span
              key={weight.criterionId}
              className="rounded-sm border border-blue-200 bg-[var(--color-primary-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--color-primary-soft-text)]"
            >
              {weight.criterionLabel}: {weight.weight}
            </span>
          ))}
        </div>
      </div>

      <div className={`mt-5 ${tableWrapperClassName}`}>
        <table className="min-w-full divide-y divide-stone-200/80">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Puntaje final</th>
              <th className="px-4 py-3">Desglose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200/80 bg-white text-sm text-stone-700">
            {result.rankedSuppliers.map((supplier) => (
              <tr key={supplier.supplierId}>
                <td className="px-4 py-4 align-top font-semibold text-stone-900">
                  {supplier.supplierName}
                </td>
                <td className="px-4 py-4 align-top font-semibold text-stone-900">
                  {supplier.finalScore}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {supplier.breakdown.map((item) => (
                      <span
                        key={`${supplier.supplierId}-${item.criterionId}`}
                        className="rounded-sm border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-stone-700"
                      >
                        {item.criterionLabel}: {item.normalizedScore} x {item.weight} ={" "}
                        {item.contribution}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
