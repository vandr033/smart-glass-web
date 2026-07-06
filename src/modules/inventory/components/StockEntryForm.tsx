"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  fieldClassName,
  primaryButtonClassName,
  sectionClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import {
  INVENTORY_CONDITION_LABELS,
  INVENTORY_QUERY_KEYS,
  INVENTORY_ROUTES,
  INVENTORY_SOURCE_TYPE_LABELS,
  INVENTORY_STOCK_TYPE_LABELS,
} from "@/modules/inventory/constants";
import { inventoryService } from "@/services/inventory-service";
import { materialService } from "@/services/material-service";
import type { InventoryStockEntryInput, MaterialListItem } from "@/types";
import { getApiErrorMessage } from "@/utils";

const STOCK_TYPE_OPTIONS = ["STANDARD", "REMNANT", "DAMAGED", "RESERVED", "QUARANTINE"] as const;
const SOURCE_TYPE_OPTIONS = ["MANUAL", "PURCHASE", "REMNANT_GENERATED", "RETURN", "ADJUSTMENT"] as const;
const CONDITION_OPTIONS = [
  "AVAILABLE",
  "RESERVED_SOFT",
  "RESERVED_FIRM",
  "DAMAGED",
  "CONSUMED",
  "SCRAPPED",
] as const;

const emptyFormState: InventoryStockEntryInput = {
  batchNumber: null,
  condition: "AVAILABLE",
  heightMm: null,
  lengthMm: null,
  locationCode: null,
  materialId: "",
  notes: null,
  quantity: 1,
  sourceId: null,
  sourceType: "MANUAL",
  stockType: "STANDARD",
  thicknessMm: null,
  unit: "UNIT",
  warehouseId: "",
  widthMm: null,
};

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsedValue = Number(trimmed);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export function StockEntryForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<InventoryStockEntryInput>(emptyFormState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
    staleTime: 60_000,
  });
  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["inventory", "stock-entry", "materials"],
    staleTime: 60_000,
  });

  const selectedMaterial = useMemo(
    () =>
      (materialsQuery.data ?? []).find((material) => material.id === formState.materialId) ??
      null,
    [formState.materialId, materialsQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: inventoryService.createStockEntry,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: INVENTORY_QUERY_KEYS.stockTable,
        }),
        queryClient.invalidateQueries({
          queryKey: INVENTORY_QUERY_KEYS.dashboard,
        }),
      ]);
      router.push(INVENTORY_ROUTES.stock);
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
    },
  });

  const handleMaterialChange = (materialId: string) => {
    const material = (materialsQuery.data ?? []).find((record) => record.id === materialId);

    setFormState((currentState) => ({
      ...currentState,
      materialId,
      unit: material?.stockUnit ?? currentState.unit,
    }));
  };

  if (warehousesQuery.isLoading || materialsQuery.isLoading) {
    return <LoadingState cards={3} title="Cargando formulario de ingreso de stock" />;
  }

  if (warehousesQuery.isError || materialsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void Promise.all([warehousesQuery.refetch(), materialsQuery.refetch()]);
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={
          warehousesQuery.error?.message ??
          materialsQuery.error?.message ??
          "No se pudieron cargar las opciones necesarias para registrar stock."
        }
        title="El formulario de ingreso de stock no está disponible"
      />
    );
  }

  const isSheetMaterial = selectedMaterial?.materialType === "SHEET";
  const isLinearMaterial = selectedMaterial?.materialType === "LINEAR";

  return (
    <section className={sectionClassName}>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitError(null);
          createMutation.mutate(formState);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Almacén</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  warehouseId: event.target.value,
                }));
              }}
              value={formState.warehouseId}
            >
              <option value="">Selecciona un almacén</option>
              {(warehousesQuery.data ?? []).map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} · {warehouse.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">Material</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                handleMaterialChange(event.target.value);
              }}
              value={formState.materialId}
            >
              <option value="">Selecciona un material</option>
              {(materialsQuery.data ?? []).map((material: MaterialListItem) => (
                <option key={material.id} value={material.id}>
                  {material.code} · {material.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Tipo de stock</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  stockType: event.target.value as InventoryStockEntryInput["stockType"],
                }));
              }}
              value={formState.stockType}
            >
              {STOCK_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INVENTORY_STOCK_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Condición</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  condition: event.target.value as InventoryStockEntryInput["condition"],
                }));
              }}
              value={formState.condition}
            >
              {CONDITION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INVENTORY_CONDITION_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Tipo de origen</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  sourceType: event.target.value as InventoryStockEntryInput["sourceType"],
                }));
              }}
              value={formState.sourceType}
            >
              {SOURCE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {INVENTORY_SOURCE_TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Cantidad</span>
            <input
              className={fieldClassName}
              min="0"
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  quantity: Number(event.target.value),
                }));
              }}
              step="0.0001"
              type="number"
              value={formState.quantity}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Unidad</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  unit: event.target.value as InventoryStockEntryInput["unit"],
                }));
              }}
              value={formState.unit}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Lote</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  batchNumber: event.target.value.trim() || null,
                }));
              }}
              value={formState.batchNumber ?? ""}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Ubicación</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setFormState((currentState) => ({
                  ...currentState,
                  locationCode: event.target.value.trim() || null,
                }));
              }}
              value={formState.locationCode ?? ""}
            />
          </label>
        </div>

        {isLinearMaterial ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Largo (mm)</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    lengthMm: parseOptionalNumber(event.target.value),
                  }));
                }}
                type="number"
                value={formState.lengthMm ?? ""}
              />
            </label>
          </div>
        ) : null}

        {isSheetMaterial ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Ancho (mm)</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    widthMm: parseOptionalNumber(event.target.value),
                  }));
                }}
                type="number"
                value={formState.widthMm ?? ""}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Alto (mm)</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    heightMm: parseOptionalNumber(event.target.value),
                  }));
                }}
                type="number"
                value={formState.heightMm ?? ""}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Espesor (mm)</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    thicknessMm: parseOptionalNumber(event.target.value),
                  }));
                }}
                type="number"
                value={formState.thicknessMm ?? ""}
              />
            </label>
          </div>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-700">Notas</span>
          <textarea
            className={textAreaClassName}
            onChange={(event) => {
              setFormState((currentState) => ({
                ...currentState,
                notes: event.target.value.trim() || null,
              }));
            }}
            value={formState.notes ?? ""}
          />
        </label>

        {submitError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button className={primaryButtonClassName} disabled={createMutation.isPending} type="submit">
            {createMutation.isPending ? "Guardando..." : "Crear ingreso de stock"}
          </button>
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              router.push(INVENTORY_ROUTES.stock);
            }}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
