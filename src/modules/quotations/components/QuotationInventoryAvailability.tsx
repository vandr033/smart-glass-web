"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, PackageSearch } from "lucide-react";

import { secondaryButtonClassName } from "@/modules/commercial/ui";
import { INVENTORY_QUERY_KEYS, INVENTORY_ROUTES } from "@/modules/inventory/constants";
import { inventoryService } from "@/services/inventory-service";
import type {
  InventoryStockRecord,
  QuotationDetailRecord,
  QuotationItemMaterialRecord,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

type QuotationInventoryAvailabilityProps = {
  canReserve: boolean;
  canReadInventory: boolean;
  projectId: string | null;
  quotation: QuotationDetailRecord;
};

type AggregatedMaterialRequirement = {
  inventoryUnit: InventoryStockRecord["unit"] | null;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: QuotationItemMaterialRecord["unit"];
};

const INVENTORY_UNITS: InventoryStockRecord["unit"][] = [
  "MM",
  "CM",
  "M",
  "M2",
  "UNIT",
  "PACKAGE",
  "KG",
  "LITER",
  "HOUR",
  "DAY",
];

const toInventoryUnit = (
  value: QuotationItemMaterialRecord["unit"],
): InventoryStockRecord["unit"] | null => {
  return INVENTORY_UNITS.includes(value as InventoryStockRecord["unit"])
    ? (value as InventoryStockRecord["unit"])
    : null;
};

export function QuotationInventoryAvailability({
  canReserve,
  canReadInventory,
  projectId,
  quotation,
}: QuotationInventoryAvailabilityProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const materialRequirements = useMemo(() => {
    const map = new Map<string, AggregatedMaterialRequirement>();

    quotation.items.forEach((item) => {
      item.materials.forEach((material) => {
        if (!material.materialId) {
          return;
        }

        const existing = map.get(material.materialId);

        if (existing) {
          existing.quantity += material.requiredQuantity;
          return;
        }

        map.set(material.materialId, {
          inventoryUnit: toInventoryUnit(material.unit),
          materialId: material.materialId,
          materialName: material.materialName,
          quantity: material.requiredQuantity,
          unit: material.unit,
        });
      });
    });

    return Array.from(map.values());
  }, [quotation.items]);

  const availabilityQueries = useQueries({
    queries: materialRequirements.map((materialRequirement) => ({
      enabled: canReadInventory,
      queryFn: async () => {
        if (!materialRequirement.inventoryUnit) {
          throw new Error(
            `La unidad "${materialRequirement.unit}" no esta soportada para revisar disponibilidad en inventario.`,
          );
        }

        return inventoryService.getMaterialAvailability(materialRequirement.materialId, {
          quantity: materialRequirement.quantity,
          unit: materialRequirement.inventoryUnit,
        });
      },
      queryKey: INVENTORY_QUERY_KEYS.availability({
        materialId: materialRequirement.materialId,
        quantity: materialRequirement.quantity,
        unit: materialRequirement.inventoryUnit,
      }),
    })),
  });

  const reserveMutation = useMutation({
    mutationFn: async (materialRequirement: AggregatedMaterialRequirement) => {
      if (!materialRequirement.inventoryUnit) {
        throw new Error(
          `La unidad "${materialRequirement.unit}" no esta soportada para reservar inventario.`,
        );
      }

      const availability = await inventoryService.getMaterialAvailability(
        materialRequirement.materialId,
        {
          quantity: materialRequirement.quantity,
          unit: materialRequirement.inventoryUnit,
        },
      );
      const primaryStock = availability.stocks.find((stock) => stock.availableQuantity > 0);

      if (!primaryStock) {
        throw new Error("No se encontró una fila de existencias disponible para este material.");
      }

      return inventoryService.createSoftReservation({
        expiresAt: null,
        inventoryStockId: primaryStock.id,
        materialId: materialRequirement.materialId,
        projectId: projectId ?? undefined,
        quantity: materialRequirement.quantity,
        quotationId: quotation.id,
        unit: materialRequirement.inventoryUnit,
        warehouseId: primaryStock.warehouseId,
      });
    },
    onError: (error) => {
      setMessage(getApiErrorMessage(error));
    },
    onSuccess: async () => {
      setMessage("Se creo una reserva blanda desde la disponibilidad de inventario de la cotizacion.");
      await queryClient.invalidateQueries({
        queryKey: ["inventory"],
      });
    },
  });

  if (!canReadInventory || materialRequirements.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Inventario
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
            Disponibilidad de materiales
          </h2>
        </div>

        <Link className={secondaryButtonClassName} href={INVENTORY_ROUTES.stock}>
          Abrir existencias
        </Link>
      </div>

      {message ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4">
        {materialRequirements.map((materialRequirement, index) => {
          const availabilityQuery = availabilityQueries[index];
          const availability = availabilityQuery.data;
          const insufficient = availability?.sufficientForRequestedQuantity === false;

          return (
            <article
              key={materialRequirement.materialId}
              className="rounded-lg border border-stone-200 bg-white px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="font-semibold text-stone-950">{materialRequirement.materialName}</p>
                  <p className="text-sm text-stone-600">
                    Requerido {materialRequirement.quantity.toLocaleString("es-BO")}{" "}
                    {materialRequirement.unit}
                  </p>
                </div>

                {insufficient ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Stock insuficiente
                  </span>
                ) : availability ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Stock disponible
                  </span>
                ) : null}
              </div>

              {availabilityQuery.isLoading ? (
                <p className="mt-4 text-sm text-stone-500">Revisando disponibilidad de existencias…</p>
              ) : availabilityQuery.isError ? (
                <p className="mt-4 text-sm text-rose-700">{availabilityQuery.error.message}</p>
              ) : availability ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-md bg-stone-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Existencia</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">
                      {availability.summary.totalQuantity.toLocaleString("es-BO")}
                    </p>
                  </div>
                  <div className="rounded-md bg-stone-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Disponible</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">
                      {availability.summary.availableQuantity.toLocaleString("es-BO")}
                    </p>
                  </div>
                  <div className="rounded-md bg-stone-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Reserva blanda</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">
                      {availability.summary.reservedSoftQuantity.toLocaleString("es-BO")}
                    </p>
                  </div>
                  <div className="rounded-md bg-stone-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Reserva firme</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">
                      {availability.summary.reservedFirmQuantity.toLocaleString("es-BO")}
                    </p>
                  </div>
                  <div className="rounded-md bg-stone-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Remanentes</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">
                      {availability.summary.remnantQuantity.toLocaleString("es-BO")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <PackageSearch className="h-4 w-4" />
                    Todavia no hay disponibilidad calculada para este material.
                  </div>
                </div>
              )}

              {canReserve && availability && availability.stocks.length > 0 ? (
                <div className="mt-4">
                  <button
                    className={secondaryButtonClassName}
                    disabled={reserveMutation.isPending || insufficient}
                    onClick={() => {
                      reserveMutation.mutate(materialRequirement);
                    }}
                    type="button"
                  >
                    Crear reserva blanda
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
