"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

import { AddressMapPicker } from "@/components/ui/address-map-picker";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  fieldClassName,
  primaryButtonClassName,
  sectionClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";
import type { WarehouseMutationInput } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { INVENTORY_QUERY_KEYS } from "../constants";
import { WarehouseStatusBadge } from "./InventoryBadges";

const emptyWarehouseForm: WarehouseMutationInput = {
  address: null,
  code: "",
  description: null,
  latitude: null,
  longitude: null,
  name: "",
  status: "ACTIVE",
};

export function WarehouseManager() {
  const queryClient = useQueryClient();
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<WarehouseMutationInput>(emptyWarehouseForm);
  const [formError, setFormError] = useState<string | null>(null);

  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
  });

  const saveMutation = useMutation({
    mutationFn: async (input: WarehouseMutationInput) => {
      if (editingWarehouseId) {
        return inventoryService.updateWarehouse(editingWarehouseId, input);
      }

      return inventoryService.createWarehouse(input);
    },
    onSuccess: async () => {
      setEditingWarehouseId(null);
      setFormValues(emptyWarehouseForm);
      setFormError(null);
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.warehouses,
      });
    },
    onError: (error) => {
      setFormError(getApiErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: inventoryService.deleteWarehouse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: INVENTORY_QUERY_KEYS.warehouses,
      });
    },
  });

  const editingWarehouse = useMemo(
    () => (warehousesQuery.data ?? []).find((warehouse) => warehouse.id === editingWarehouseId) ?? null,
    [editingWarehouseId, warehousesQuery.data],
  );
  const warehouses = warehousesQuery.data ?? [];

  if (warehousesQuery.isLoading) {
    return <LoadingState cards={2} title="Cargando almacenes" />;
  }

  if (warehousesQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void warehousesQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={warehousesQuery.error.message}
        title="No se pudieron cargar los almacenes"
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
      <section className={sectionClassName}>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            {editingWarehouse ? "Editar almacen" : "Nuevo almacen"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Registro de almacen
          </h2>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setFormError(null);
            saveMutation.mutate(formValues);
          }}
        >
          <input
            className={fieldClassName}
            onChange={(event) => {
              setFormValues((currentState) => ({
                ...currentState,
                code: event.target.value,
              }));
            }}
            placeholder="Codigo del almacen"
            value={formValues.code}
          />
          <input
            className={fieldClassName}
            onChange={(event) => {
              setFormValues((currentState) => ({
                ...currentState,
                name: event.target.value,
              }));
            }}
            placeholder="Nombre del almacen"
            value={formValues.name}
          />
          <AddressMapPicker
            onChange={(nextValue) => {
              setFormValues((currentState) => ({
                ...currentState,
                address: nextValue.addressText.trim() || null,
                latitude: nextValue.latitude ?? null,
                longitude: nextValue.longitude ?? null,
              }));
            }}
            value={{
              addressText: formValues.address ?? "",
              latitude: formValues.latitude,
              longitude: formValues.longitude,
            }}
          />
          <select
            className={fieldClassName}
            onChange={(event) => {
              setFormValues((currentState) => ({
                ...currentState,
                status: event.target.value as WarehouseMutationInput["status"],
              }));
            }}
            value={formValues.status}
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
          <textarea
            className={textAreaClassName}
            onChange={(event) => {
              setFormValues((currentState) => ({
                ...currentState,
                description: event.target.value.trim() || null,
              }));
            }}
            placeholder="Descripcion"
            value={formValues.description ?? ""}
          />

          {formError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {formError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button className={primaryButtonClassName} disabled={saveMutation.isPending} type="submit">
              {saveMutation.isPending
                ? "Guardando..."
                : editingWarehouse
                  ? "Actualizar almacen"
                  : "Crear almacen"}
            </button>
            {editingWarehouse ? (
              <button
                className={secondaryButtonClassName}
                onClick={() => {
                  setEditingWarehouseId(null);
                  setFormValues(emptyWarehouseForm);
                  setFormError(null);
                }}
                type="button"
              >
                Cancelar edicion
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className={sectionClassName}>
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Registros actuales
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Almacenes
          </h2>
        </div>

        {warehouses.length === 0 ? (
          <EmptyState
            description="Crea el primer almacen para vincular ingresos, traslados, reservas y remanentes a una ubicacion fisica."
            title="No hay almacenes registrados"
          />
        ) : (
          <div className="space-y-3">
            {warehouses.map((warehouse) => (
              <article
                key={warehouse.id}
                className="rounded-lg border border-stone-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-stone-950">
                        {warehouse.code} · {warehouse.name}
                      </p>
                      <WarehouseStatusBadge value={warehouse.status} />
                    </div>
                    <p className="text-sm text-stone-600">
                      {warehouse.address || "No hay direccion registrada"}
                    </p>
                    <p className="text-xs text-stone-500">
                      {warehouse.description || "Sin descripcion"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className={secondaryButtonClassName}
                      onClick={() => {
                        setEditingWarehouseId(warehouse.id);
                        setFormValues({
                          address: warehouse.address,
                          code: warehouse.code,
                          description: warehouse.description,
                          latitude: warehouse.latitude,
                          longitude: warehouse.longitude,
                          name: warehouse.name,
                          status: warehouse.status,
                        });
                      }}
                      type="button"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </button>
                    <button
                      className={secondaryButtonClassName}
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Eliminar el almacen ${warehouse.code}? Solo se permite si ya no tiene stock activo.`,
                        );

                        if (!confirmed) {
                          return;
                        }

                        void deleteMutation.mutateAsync(warehouse.id);
                      }}
                      type="button"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
