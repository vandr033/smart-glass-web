"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Scissors } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  primaryButtonClassName,
  sectionClassName,
} from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";
import { materialService } from "@/services/material-service";
import type { RemnantPieceRecord } from "@/types";

import { INVENTORY_PERMISSIONS, INVENTORY_QUERY_KEYS, REMNANT_STATUS_LABELS } from "../constants";
import { RemnantStatusBadge } from "./InventoryBadges";

const remnantColumns: ColumnDef<RemnantPieceRecord>[] = [
  {
    accessorKey: "code",
    cell: ({ row }) => (
      <div className="min-w-[12rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.code}</p>
        <p className="text-xs text-stone-500">{row.original.material.code}</p>
      </div>
    ),
    header: "Remanente",
  },
  {
    accessorKey: "material",
    cell: ({ row }) => (
      <div className="min-w-[14rem]">
        <p className="font-medium text-stone-900">{row.original.material.name}</p>
        <p className="text-xs text-stone-500">{row.original.material.category.name}</p>
      </div>
    ),
    header: "Material",
  },
  {
    accessorKey: "warehouse",
    cell: ({ row }) => <span className="text-sm text-stone-700">{row.original.warehouse.name}</span>,
    header: "Almacen",
  },
  {
    accessorKey: "dimensions",
    cell: ({ row }) => (
      <div className="min-w-[12rem] text-sm text-stone-700">
        {(row.original.lengthMm ?? 0).toLocaleString("es-BO")} x{" "}
        {(row.original.widthMm ?? 0).toLocaleString("es-BO")} x{" "}
        {(row.original.thicknessMm ?? 0).toLocaleString("es-BO")} mm
      </div>
    ),
    enableSorting: false,
    header: "Dimensiones",
  },
  {
    accessorKey: "usableAreaM2",
    cell: ({ row }) => (
      <span className="text-sm text-stone-700">
        {row.original.usableAreaM2 !== null
          ? `${row.original.usableAreaM2.toFixed(3)} m2`
          : "No calculada"}
      </span>
    ),
    header: "Area util",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => <RemnantStatusBadge value={row.original.status} />,
    header: "Estado",
  },
];

export function InventoryRemnantsTable() {
  const { permissions } = usePermissions();
  const [finderValues, setFinderValues] = useState({
    materialId: "",
    requiredHeightMm: "",
    requiredWidthMm: "",
    thicknessMm: "",
    warehouseId: "",
  });
  const [submittedFinderValues, setSubmittedFinderValues] = useState<null | {
    materialId: string;
    requiredHeightMm: number;
    requiredWidthMm: number;
    thicknessMm?: number;
    warehouseId?: string;
  }>(null);

  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data.filter((material) => material.materialType === "SHEET");
    },
    queryKey: ["inventory", "remnants", "materials"],
    staleTime: 60_000,
  });
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
    staleTime: 60_000,
  });

  const usableRemnantsQuery = useQuery({
    enabled: Boolean(submittedFinderValues?.materialId),
    queryFn: async () => {
      if (!submittedFinderValues) {
        return [];
      }

      return inventoryService.findUsableRemnants(submittedFinderValues);
    },
    queryKey: INVENTORY_QUERY_KEYS.usableRemnants(submittedFinderValues),
  });

  const canScrap = permissions.includes(INVENTORY_PERMISSIONS.scrap);

  const tableConfig: DataTableConfig<RemnantPieceRecord> = useMemo(
    () => ({
      columns: remnantColumns,
      csv: {
        columns: [
          { header: "Codigo", key: "code", value: (row) => row.code },
          { header: "Material", key: "material", value: (row) => row.material.name },
          { header: "Almacen", key: "warehouse", value: (row) => row.warehouse.name },
          {
            header: "Dimensiones",
            key: "dimensions",
            value: (row) => `${row.lengthMm ?? 0} x ${row.widthMm ?? 0} x ${row.thicknessMm ?? 0} mm`,
          },
          {
            header: "Area util",
            key: "usableAreaM2",
            value: (row) => (row.usableAreaM2 !== null ? `${row.usableAreaM2.toFixed(3)} m2` : "No calculada"),
          },
          { header: "Estado", key: "status", value: (row) => REMNANT_STATUS_LABELS[row.status] },
        ],
        fileName: "inventario-remanentes.csv",
      },
      defaultSort: {
        desc: true,
        id: "createdAt",
      },
      emptyState: {
        description:
          "Los sobrantes reutilizables apareceran aqui cuando empieces a registrar remanentes.",
        title: "No hay remanentes para la vista actual",
      },
      filters: [
        {
          id: "warehouseId",
          label: "Almacen",
          options: (warehousesQuery.data ?? []).map((warehouse) => ({
            label: warehouse.name,
            value: warehouse.id,
          })),
          placeholder: "Todos los almacenes",
          type: "select",
        },
        {
          id: "materialId",
          label: "Material",
          options: (materialsQuery.data ?? []).map((material) => ({
            label: `${material.code} · ${material.name}`,
            value: material.id,
          })),
          placeholder: "Todos los materiales",
          type: "select",
        },
        {
          id: "status",
          label: "Estado",
          options: Object.entries(REMNANT_STATUS_LABELS).map(([value, label]) => ({
            label,
            value,
          })),
          placeholder: "Cualquier estado",
          type: "select",
        },
      ],
      queryKey: INVENTORY_QUERY_KEYS.remnants({}),
      rowActions: canScrap
        ? [
            {
              hidden: (row) => row.status === "SCRAPPED" || row.status === "CONSUMED",
              icon: Scissors,
              id: "scrap",
              invalidateAfterSuccess: true,
              label: "Desechar",
              onClick: async (row) => {
                await inventoryService.scrapRemnant(row.id, "Desechado desde la pagina de remanentes");
              },
              tone: "danger",
              variant: "custom",
            },
          ]
        : [],
      searchPlaceholder: "Buscar por codigo de remanente, material o almacen",
    }),
    [canScrap, materialsQuery.data, warehousesQuery.data],
  );

  return (
    <div className="space-y-6">
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Buscador
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Buscar remanente util
            </h2>
          </div>
        </div>

        <form
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedFinderValues({
              materialId: finderValues.materialId,
              requiredHeightMm: Number(finderValues.requiredHeightMm),
              requiredWidthMm: Number(finderValues.requiredWidthMm),
              ...(finderValues.thicknessMm
                ? {
                    thicknessMm: Number(finderValues.thicknessMm),
                  }
                : {}),
              ...(finderValues.warehouseId
                ? {
                    warehouseId: finderValues.warehouseId,
                  }
                : {}),
            });
          }}
        >
          <select
            className={fieldClassName}
            onChange={(event) => {
              setFinderValues((currentState) => ({
                ...currentState,
                materialId: event.target.value,
              }));
            }}
            value={finderValues.materialId}
          >
            <option value="">Seleccionar material</option>
            {(materialsQuery.data ?? []).map((material) => (
              <option key={material.id} value={material.id}>
                {material.code} · {material.name}
              </option>
            ))}
          </select>
          <input
            className={fieldClassName}
            onChange={(event) => {
              setFinderValues((currentState) => ({
                ...currentState,
                requiredWidthMm: event.target.value,
              }));
            }}
            placeholder="Ancho requerido (mm)"
            type="number"
            value={finderValues.requiredWidthMm}
          />
          <input
            className={fieldClassName}
            onChange={(event) => {
              setFinderValues((currentState) => ({
                ...currentState,
                requiredHeightMm: event.target.value,
              }));
            }}
            placeholder="Alto requerido (mm)"
            type="number"
            value={finderValues.requiredHeightMm}
          />
          <input
            className={fieldClassName}
            onChange={(event) => {
              setFinderValues((currentState) => ({
                ...currentState,
                thicknessMm: event.target.value,
              }));
            }}
            placeholder="Espesor (mm)"
            type="number"
            value={finderValues.thicknessMm}
          />
          <button className={primaryButtonClassName} type="submit">
            Buscar remanentes
          </button>
        </form>

        {usableRemnantsQuery.data ? (
          usableRemnantsQuery.data.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {usableRemnantsQuery.data.map((remnant) => (
                <article
                  key={remnant.id}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-950">{remnant.code}</p>
                      <p className="mt-1 text-xs text-stone-500">{remnant.material.name}</p>
                    </div>
                    <RemnantStatusBadge value={remnant.status} />
                  </div>
                  <p className="mt-3 text-sm text-stone-700">
                    {remnant.lengthMm} x {remnant.widthMm} x {remnant.thicknessMm} mm
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
                    {remnant.warehouse.name} · {remnant.usableAreaM2?.toFixed(3) ?? "0.000"} m2
                  </p>
                </article>
              ))}
            </div>
          ) : submittedFinderValues ? (
            <div className="mt-5">
              <EmptyState
                description="Prueba reduciendo las dimensiones solicitadas, ajustando el espesor o registrando un nuevo remanente."
                title="Ningun remanente cumple con la medida solicitada"
              />
            </div>
          ) : null
        ) : null}
      </section>

      <DataTable config={tableConfig} endpoint="/inventory/remnants" />
    </div>
  );
}
