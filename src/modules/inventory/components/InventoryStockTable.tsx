"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, ArrowRightLeft, ClipboardCheck, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { materialService } from "@/services/material-service";
import { inventoryService } from "@/services/inventory-service";
import type { InventoryStockRecord } from "@/types";

import {
  INVENTORY_CONDITION_LABELS,
  INVENTORY_PERMISSIONS,
  INVENTORY_QUERY_KEYS,
  INVENTORY_ROUTES,
  INVENTORY_STOCK_TYPE_LABELS,
} from "../constants";
import { InventoryConditionBadge, InventoryStockTypeBadge } from "./InventoryBadges";

const formatDimensions = (stock: InventoryStockRecord): string => {
  const parts = [
    stock.lengthMm ? `${stock.lengthMm} L` : null,
    stock.widthMm ? `${stock.widthMm} A` : null,
    stock.heightMm ? `${stock.heightMm} Al` : null,
    stock.thicknessMm ? `${stock.thicknessMm} E` : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length > 0 ? `${parts.join(" · ")} mm` : "Sin dimensiones";
};

const stockColumns: ColumnDef<InventoryStockRecord>[] = [
  {
    accessorKey: "material",
    cell: ({ row }) => (
      <div className="min-w-[16rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.material.name}</p>
        <p className="text-sm text-stone-700">{row.original.material.code}</p>
        <p className="text-xs text-stone-500">{row.original.material.category.name}</p>
      </div>
    ),
    header: "Material",
  },
  {
    accessorKey: "warehouse",
    cell: ({ row }) => (
      <div className="min-w-[12rem]">
        <p className="font-medium text-stone-900">{row.original.warehouse.name}</p>
        <p className="text-xs text-stone-500">{row.original.warehouse.code}</p>
      </div>
    ),
    header: "Almacen",
  },
  {
    accessorKey: "stockType",
    cell: ({ row }) => <InventoryStockTypeBadge value={row.original.stockType} />,
    header: "Tipo",
  },
  {
    accessorKey: "condition",
    cell: ({ row }) => <InventoryConditionBadge value={row.original.condition} />,
    header: "Condicion",
  },
  {
    accessorKey: "dimensions",
    cell: ({ row }) => (
      <div className="min-w-[16rem] text-sm text-stone-700">{formatDimensions(row.original)}</div>
    ),
    enableSorting: false,
    header: "Dimensiones",
  },
  {
    accessorKey: "quantity",
    cell: ({ row }) => (
      <div className="min-w-[10rem] space-y-1">
        <p className="font-medium text-stone-900">
          {row.original.quantity.toLocaleString("es-BO")} {row.original.unit}
        </p>
        <p className="text-xs text-stone-500">
          Disponible {row.original.availableQuantity.toLocaleString("es-BO")} · Blanda{" "}
          {row.original.reservedSoftQuantity.toLocaleString("es-BO")} · Firme{" "}
          {row.original.reservedFirmQuantity.toLocaleString("es-BO")}
        </p>
      </div>
    ),
    header: "Cantidad",
  },
];

export function InventoryStockTable() {
  const { permissions } = usePermissions();
  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["inventory", "material-options"],
    staleTime: 60_000,
  });
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: INVENTORY_QUERY_KEYS.warehouses,
    staleTime: 60_000,
  });

  const canAdjust = permissions.includes(INVENTORY_PERMISSIONS.adjust);
  const canReserve = permissions.includes(INVENTORY_PERMISSIONS.reserve);
  const canDamage = permissions.includes(INVENTORY_PERMISSIONS.damage);
  const canTransfer = permissions.includes(INVENTORY_PERMISSIONS.update);

  const tableConfig: DataTableConfig<InventoryStockRecord> = {
    columns: stockColumns,
    csv: {
      columns: [
        { header: "Material", key: "material", value: (row) => row.material.name },
        { header: "Codigo material", key: "materialCode", value: (row) => row.material.code },
        { header: "Almacen", key: "warehouse", value: (row) => row.warehouse.name },
        { header: "Tipo", key: "stockType", value: (row) => INVENTORY_STOCK_TYPE_LABELS[row.stockType] },
        { header: "Condicion", key: "condition", value: (row) => INVENTORY_CONDITION_LABELS[row.condition] },
        { header: "Dimensiones", key: "dimensions", value: (row) => formatDimensions(row) },
        { header: "Cantidad", key: "quantity", value: (row) => `${row.quantity} ${row.unit}` },
        {
          header: "Disponible",
          key: "availableQuantity",
          value: (row) => `${row.availableQuantity} ${row.unit}`,
        },
      ],
      fileName: "inventario-stock.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Registra el primer ingreso para empezar a seguir inventario fisico, reservas, remanentes y danos.",
      title: "No hay stock para la vista actual",
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
        id: "stockType",
        label: "Tipo de stock",
        options: Object.entries(INVENTORY_STOCK_TYPE_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier tipo",
        type: "select",
      },
      {
        id: "condition",
        label: "Condicion",
        options: Object.entries(INVENTORY_CONDITION_LABELS).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: "Cualquier condicion",
        type: "select",
      },
    ],
    queryKey: INVENTORY_QUERY_KEYS.stockTable,
    rowActions: [
      {
        hidden: () => !canAdjust,
        icon: Pencil,
        id: "adjust",
        invalidateAfterSuccess: true,
        label: "Ajustar",
        onClick: async (row) => {
          const rawDelta = window.prompt(
            "Cantidad de ajuste. Usa valores negativos para disminuir stock.",
            "1",
          );

          if (!rawDelta) {
            return;
          }

          const quantityDelta = Number(rawDelta);

          if (!Number.isFinite(quantityDelta) || quantityDelta === 0) {
            throw new Error("Ingresa una cantidad valida distinta de cero.");
          }

          const reason = window.prompt("Motivo del ajuste", "Actualizacion por conteo ciclico") ?? null;

          await inventoryService.adjustStock({
            inventoryStockId: row.id,
            notes: null,
            quantityDelta,
            reason,
          });
        },
        variant: "custom",
      },
      {
        disabled: (row) => row.availableQuantity <= 0,
        hidden: () => !canReserve,
        icon: ClipboardCheck,
        id: "reserve",
        invalidateAfterSuccess: true,
        label: "Reservar",
        onClick: async (row) => {
          const reservationType = (
            window.prompt("Tipo de reserva: SOFT o FIRM", "SOFT") ?? "SOFT"
          ).toUpperCase();
          const rawQuantity = window.prompt("Cantidad a reservar", String(row.availableQuantity));

          if (!rawQuantity) {
            return;
          }

          const quantity = Number(rawQuantity);

          if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error("Ingresa una cantidad de reserva valida.");
          }

          const input = {
            expiresAt: null,
            inventoryStockId: row.id,
            materialId: row.materialId,
            quantity,
            unit: row.unit,
            warehouseId: row.warehouseId,
          };

          if (reservationType === "FIRM") {
            await inventoryService.createFirmReservation(input);
            return;
          }

          await inventoryService.createSoftReservation(input);
        },
        variant: "custom",
      },
      {
        disabled: (row) => row.availableQuantity <= 0,
        hidden: () => !canDamage,
        icon: AlertTriangle,
        id: "damage",
        invalidateAfterSuccess: true,
        label: "Reportar dano",
        onClick: async (row) => {
          const rawQuantity = window.prompt("Cantidad danada", String(row.availableQuantity));

          if (!rawQuantity) {
            return;
          }

          const quantity = Number(rawQuantity);
          const severity = (
            window.prompt("Severidad: LOW, MEDIUM, HIGH o TOTAL_LOSS", "MEDIUM") ??
            "MEDIUM"
          ).toUpperCase() as "HIGH" | "LOW" | "MEDIUM" | "TOTAL_LOSS";
          const description = window.prompt("Descripcion del dano", "Reportado desde la tabla de stock") ?? null;

          await inventoryService.createDamagedMaterial({
            damageType: "OTHER",
            description,
            inventoryStockId: row.id,
            materialId: row.materialId,
            quantity,
            severity,
            unit: row.unit,
            warehouseId: row.warehouseId,
          });
        },
        variant: "custom",
      },
      {
        disabled: (row) => row.availableQuantity <= 0,
        hidden: () => !canTransfer,
        icon: ArrowRightLeft,
        id: "transfer",
        invalidateAfterSuccess: true,
        label: "Trasladar",
        onClick: async (row) => {
          const warehouseList = (warehousesQuery.data ?? [])
            .filter((warehouse) => warehouse.id !== row.warehouseId)
            .map((warehouse) => `${warehouse.id} · ${warehouse.code} · ${warehouse.name}`)
            .join("\n");
          const targetWarehouseId = window.prompt(
            `Id del almacen destino:\n${warehouseList || "No hay almacenes alternos disponibles."}`,
          );

          if (!targetWarehouseId) {
            return;
          }

          const rawQuantity = window.prompt("Cantidad a trasladar", String(row.availableQuantity));

          if (!rawQuantity) {
            return;
          }

          await inventoryService.transferStock({
            inventoryStockId: row.id,
            locationCode: null,
            quantity: Number(rawQuantity),
            reason: "Trasladado desde la tabla de stock",
            toWarehouseId: targetWarehouseId,
          });
        },
        variant: "custom",
      },
      {
        href: () => INVENTORY_ROUTES.newStock,
        id: "new",
        label: "Nuevo ingreso",
        variant: "view",
      },
    ],
    searchPlaceholder: "Buscar por material, lote, ubicacion, almacen o nota de stock",
  };

  return <DataTable config={tableConfig} endpoint="/inventory/stock" />;
}
