"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { formatDateValue } from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";
import type { InventoryMovementRecord } from "@/types";

import { INVENTORY_MOVEMENT_TYPE_LABELS, INVENTORY_QUERY_KEYS } from "../constants";

const movementColumns: ColumnDef<InventoryMovementRecord>[] = [
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {formatDateValue(row.original.createdAt)}
      </span>
    ),
    header: "Fecha",
  },
  {
    accessorKey: "movementType",
    cell: ({ row }) => (
      <span className="font-medium text-stone-900">
        {INVENTORY_MOVEMENT_TYPE_LABELS[row.original.movementType]}
      </span>
    ),
    header: "Movimiento",
  },
  {
    accessorKey: "material",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.material.name}</p>
        <p className="text-sm text-stone-700">{row.original.material.code}</p>
      </div>
    ),
    header: "Material",
  },
  {
    accessorKey: "warehouse",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1 text-sm text-stone-700">
        <p>{row.original.warehouse.name}</p>
        <p className="text-xs text-stone-500">
          {row.original.fromWarehouse?.code ?? row.original.warehouse.code}
          {row.original.toWarehouse ? ` -> ${row.original.toWarehouse.code}` : ""}
        </p>
      </div>
    ),
    header: "Flujo entre almacenes",
  },
  {
    accessorKey: "quantity",
    cell: ({ row }) => (
      <span className="font-medium text-stone-900">
        {row.original.quantity.toLocaleString("es-BO")} {row.original.unit}
      </span>
    ),
    header: "Cantidad",
  },
  {
    accessorKey: "reference",
    cell: ({ row }) => (
      <div className="min-w-[12rem] text-xs text-stone-500">
        {row.original.referenceType && row.original.referenceId
          ? `${row.original.referenceType} · ${row.original.referenceId}`
          : "Sin referencia"}
      </div>
    ),
    enableSorting: false,
    header: "Referencia",
  },
];

export function InventoryMovementsTable() {
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
    staleTime: 60_000,
  });

  const tableConfig: DataTableConfig<InventoryMovementRecord> = {
    columns: movementColumns,
    csv: {
      columns: [
        { header: "Fecha", key: "createdAt", value: (row) => formatDateValue(row.createdAt) },
        {
          header: "Movimiento",
          key: "movementType",
          value: (row) => INVENTORY_MOVEMENT_TYPE_LABELS[row.movementType],
        },
        { header: "Material", key: "material", value: (row) => row.material.name },
        { header: "Almacen", key: "warehouse", value: (row) => row.warehouse.name },
        { header: "Cantidad", key: "quantity", value: (row) => `${row.quantity} ${row.unit}` },
        {
          header: "Referencia",
          key: "reference",
          value: (row) =>
            row.referenceType && row.referenceId
              ? `${row.referenceType} · ${row.referenceId}`
              : "Sin referencia",
        },
      ],
      fileName: "movimientos-inventario.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "El historial aparecerá cuando las existencias empiecen a moverse entre ingresos, traslados, reservas o daños.",
      title: "No hay movimientos para la vista actual",
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
        id: "movementType",
        label: "Tipo de movimiento",
        options: Object.entries(INVENTORY_MOVEMENT_TYPE_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier tipo",
        type: "select",
      },
    ],
    queryKey: INVENTORY_QUERY_KEYS.movements({}),
    searchPlaceholder: "Buscar por motivo, referencia o material",
  };

  return <DataTable config={tableConfig} endpoint="/inventory/movements" />;
}
