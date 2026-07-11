"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { inventoryService } from "@/services/inventory-service";
import type { InventoryReservationRecord } from "@/types";
import { formatDateValue } from "@/modules/commercial/ui";

import {
  INVENTORY_PERMISSIONS,
  INVENTORY_QUERY_KEYS,
  INVENTORY_RESERVATION_STATUS_LABELS,
  INVENTORY_RESERVATION_TYPE_LABELS,
} from "../constants";
import {
  InventoryReservationStatusBadge,
  InventoryReservationTypeBadge,
} from "./InventoryBadges";

const reservationColumns: ColumnDef<InventoryReservationRecord>[] = [
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
    accessorKey: "reference",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1 text-sm text-stone-700">
        <p>
          {row.original.quotation
            ? `Cotización ${row.original.quotation.code}`
            : "Sin cotización"}
        </p>
        <p>{row.original.project ? `Proyecto ${row.original.project.code}` : "Sin proyecto"}</p>
      </div>
    ),
    header: "Referencia",
  },
  {
    accessorKey: "reservationType",
    cell: ({ row }) => <InventoryReservationTypeBadge value={row.original.reservationType} />,
    header: "Tipo",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => <InventoryReservationStatusBadge value={row.original.status} />,
    header: "Estado",
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
    accessorKey: "expiresAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {formatDateValue(row.original.expiresAt)}
      </span>
    ),
    header: "Vencimiento",
  },
];

export function InventoryReservationsTable() {
  const { permissions } = usePermissions();
  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await inventoryService.listStock({
        page: 1,
        perPage: 100,
      });

      return Array.from(
        new Map(result.data.map((stock) => [stock.material.id, stock.material])).values(),
      );
    },
    queryKey: ["inventory", "reservations", "material-options"],
    staleTime: 60_000,
  });
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
    staleTime: 60_000,
  });

  const canRelease = permissions.includes(INVENTORY_PERMISSIONS.releaseReservation);

  const tableConfig: DataTableConfig<InventoryReservationRecord> = {
    columns: reservationColumns,
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Las reservas blandas y firmes aparecerán aquí cuando las existencias empiecen a asignarse a cotizaciones o proyectos.",
      title: "No hay reservas para la vista actual",
    },
    filters: [
      {
        id: "warehouseId",
        label: "Almacén",
        options: (warehousesQuery.data ?? []).map((warehouse) => ({
          label: warehouse.name,
          value: warehouse.id,
        })),
        placeholder: "Cualquier almacén",
        type: "select",
      },
      {
        id: "materialId",
        label: "Material",
        options: (materialsQuery.data ?? []).map((material) => ({
          label: `${material.code} · ${material.name}`,
          value: material.id,
        })),
        placeholder: "Cualquier material",
        type: "select",
      },
      {
        id: "reservationType",
        label: "Tipo",
        options: Object.entries(INVENTORY_RESERVATION_TYPE_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier tipo de reserva",
        type: "select",
      },
      {
        id: "status",
        label: "Estado",
        options: Object.entries(INVENTORY_RESERVATION_STATUS_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier estado",
        type: "select",
      },
    ],
    queryKey: INVENTORY_QUERY_KEYS.reservations({}),
    rowActions: [
      {
        disabled: (row) => row.status !== "ACTIVE",
        hidden: () => !canRelease,
        icon: RotateCcw,
        id: "release",
        invalidateAfterSuccess: true,
        label: "Liberar",
        onClick: async (row) => {
          await inventoryService.releaseReservation(row.id);
        },
        variant: "custom",
      },
      {
        disabled: (row) => row.status !== "ACTIVE",
        hidden: () => !canRelease,
        icon: CheckCircle2,
        id: "consume",
        invalidateAfterSuccess: true,
        label: "Consumir",
        onClick: async (row) => {
          await inventoryService.consumeReservation(row.id);
        },
        variant: "custom",
      },
    ],
    searchPlaceholder: "Buscar por cotización, proyecto o material",
  };

  return <DataTable config={tableConfig} endpoint="/inventory/reservations" />;
}
