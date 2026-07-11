"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateValue } from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";
import type { DamagedMaterialRecord } from "@/types";

import {
  DAMAGED_STATUS_LABELS,
  DAMAGE_SEVERITY_LABELS,
  INVENTORY_PERMISSIONS,
  INVENTORY_QUERY_KEYS,
} from "../constants";
import { DamagedStatusBadge, DamageSeverityBadge } from "./InventoryBadges";

const damagedColumns: ColumnDef<DamagedMaterialRecord>[] = [
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
    cell: ({ row }) => <span className="text-sm text-stone-700">{row.original.warehouse.name}</span>,
    header: "Almacén",
  },
  {
    accessorKey: "severity",
    cell: ({ row }) => <DamageSeverityBadge value={row.original.severity} />,
    header: "Severidad",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => <DamagedStatusBadge value={row.original.status} />,
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
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {formatDateValue(row.original.createdAt)}
      </span>
    ),
    header: "Reportado",
  },
];

export function DamagedMaterialsTable() {
  const { permissions } = usePermissions();
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
    staleTime: 60_000,
  });

  const canDamage = permissions.includes(INVENTORY_PERMISSIONS.damage);
  const canScrap = permissions.includes(INVENTORY_PERMISSIONS.scrap);

  const tableConfig: DataTableConfig<DamagedMaterialRecord> = {
    columns: damagedColumns,
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Los reportes de material dañado aparecerán aquí cuando las existencias sean marcadas para revisión desde la página de existencias o desde el flujo de daños.",
      title: "No hay material dañado para la vista actual",
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
        id: "severity",
        label: "Severidad",
        options: Object.entries(DAMAGE_SEVERITY_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier severidad",
        type: "select",
      },
      {
        id: "status",
        label: "Estado",
        options: Object.entries(DAMAGED_STATUS_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier estado",
        type: "select",
      },
    ],
    queryKey: INVENTORY_QUERY_KEYS.damaged({}),
    rowActions: [
      {
        hidden: (row) => !canDamage || row.status !== "REPORTED",
        icon: CheckCircle2,
        id: "review",
        invalidateAfterSuccess: true,
        label: "Revisar",
        onClick: async (row) => {
          await inventoryService.reviewDamagedMaterial({
            damagedMaterialId: row.id,
            status: "REVIEWED",
          });
        },
        variant: "custom",
      },
      {
        hidden: (row) =>
          !canDamage || !["REPORTED", "REVIEWED"].includes(row.status),
        icon: RotateCcw,
        id: "reusable",
        invalidateAfterSuccess: true,
        label: "Marcar como reutilizable",
        onClick: async (row) => {
          await inventoryService.reviewDamagedMaterial({
            damagedMaterialId: row.id,
            status: "REUSABLE",
          });
        },
        variant: "custom",
      },
      {
        hidden: (row) =>
          !canDamage || !["REPORTED", "REVIEWED"].includes(row.status),
        icon: RotateCcw,
        id: "return",
        invalidateAfterSuccess: true,
        label: "Devolver al proveedor",
        onClick: async (row) => {
          await inventoryService.returnDamagedMaterialToSupplier(
            row.id,
            "Devuelto desde la página de material dañado",
          );
        },
        variant: "custom",
      },
      {
        hidden: (row) => !canScrap || row.status === "SCRAPPED",
        icon: Trash2,
        id: "scrap",
        invalidateAfterSuccess: true,
        label: "Desechar",
        onClick: async (row) => {
          await inventoryService.scrapDamagedMaterial(
            row.id,
            "Desechado desde la página de material dañado",
          );
        },
        tone: "danger",
        variant: "custom",
      },
    ],
    searchPlaceholder: "Buscar por material, almacén o descripción",
  };

  return <DataTable config={tableConfig} endpoint="/inventory/damaged" />;
}
