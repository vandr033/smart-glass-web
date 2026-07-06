"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateOnlyValue, formatStatusLabel } from "@/lib/formatters";
import type { SupplierListItem } from "@/types";

import {
  SUPPLIERS_API_ENDPOINT,
  SUPPLIERS_PERMISSIONS,
  SUPPLIERS_QUERY_KEYS,
  SUPPLIERS_ROUTES,
  SUPPLIER_STATUS_OPTIONS,
} from "../constants";
import { useSuppliers } from "../hooks/useSuppliers";

const formatScore = (value: number | null): string => {
  if (value === null) {
    return "Sin puntaje";
  }

  return `${value.toFixed(1)} / 100`;
};

const statusBadgeClassName: Record<SupplierListItem["status"], string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  BLOCKED: "bg-rose-100 text-rose-700",
  INACTIVE: "bg-stone-200 text-stone-700",
};

const supplierColumns: ColumnDef<SupplierListItem>[] = [
  {
    accessorKey: "legalName",
    cell: ({ row }) => (
      <div className="min-w-[16rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.legalName}</p>
        <p className="text-xs text-stone-500">
          {row.original.commercialName || row.original.taxId || row.original.email || "Sin identificador secundario"}
        </p>
      </div>
    ),
    header: "Proveedor",
  },
  {
    accessorKey: "categories",
    cell: ({ row }) => (
      <div className="flex min-w-[12rem] flex-wrap gap-2">
        {row.original.categories.length > 0 ? (
          row.original.categories.map((category) => (
            <span
              key={category.id}
              className="rounded-sm border border-blue-200 bg-[var(--color-primary-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--color-primary-soft-text)]"
            >
              {category.name}
            </span>
          ))
        ) : (
          <span className="text-sm text-stone-500">Sin categoria</span>
        )}
      </div>
    ),
    enableSorting: false,
    header: "Categorias",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-sm px-2 py-1 text-[11px] font-semibold ${statusBadgeClassName[row.original.status]}`}
      >
        {formatStatusLabel(row.original.status)}
      </span>
    ),
    header: "Estado",
  },
  {
    accessorKey: "reliabilityScore",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {formatScore(row.original.reliabilityScore)}
      </span>
    ),
    header: "Confiabilidad",
  },
  {
    accessorKey: "preferenceScore",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {formatScore(row.original.preferenceScore)}
      </span>
    ),
    header: "Preferencia",
  },
  {
    accessorKey: "defaultLeadTimeDays",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {row.original.defaultLeadTimeDays === null
          ? "No definido"
          : `${row.original.defaultLeadTimeDays} dias`}
      </span>
    ),
    header: "Tiempo de entrega",
  },
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm text-stone-700">
        {formatDateOnlyValue(row.original.createdAt)}
      </span>
    ),
    header: "Creado",
  },
];

export function SupplierTable() {
  const { permissions } = usePermissions();
  const { useDeleteSupplier, useSupplierCategories } = useSuppliers();
  const categoriesQuery = useSupplierCategories();
  const deleteMutation = useDeleteSupplier();
  const canUpdate = permissions.includes(SUPPLIERS_PERMISSIONS.update);
  const canDelete = permissions.includes(SUPPLIERS_PERMISSIONS.delete);

  const tableConfig: DataTableConfig<SupplierListItem> = {
    columns: supplierColumns,
    csv: {
      columns: [
        {
          header: "Razon social",
          key: "legalName",
          value: (row) => row.legalName,
        },
        {
          header: "Nombre comercial",
          key: "commercialName",
          value: (row) => row.commercialName ?? "",
        },
        {
          header: "Estado",
          key: "status",
          value: (row) => row.status,
        },
        {
          header: "Confiabilidad",
          key: "reliabilityScore",
          value: (row) => row.reliabilityScore ?? "",
        },
        {
          header: "Preferencia",
          key: "preferenceScore",
          value: (row) => row.preferenceScore ?? "",
        },
      ],
      fileName: "proveedores.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Amplia la busqueda, limpia los filtros o crea el primer proveedor para iniciar comparaciones y compras.",
      title: "No hay proveedores para esta vista",
    },
    filters: [
      {
        id: "status",
        label: "Estado",
        options: SUPPLIER_STATUS_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "categoryId",
        label: "Categoria",
        options: (categoriesQuery.data ?? []).map((category) => ({
          label: category.name,
          value: category.id,
        })),
        placeholder: "Todas las categorias",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: SUPPLIERS_QUERY_KEYS.table,
    rowActions: [
      {
        href: (row) => SUPPLIERS_ROUTES.view(row.id),
        icon: Eye,
        id: "view",
        label: "Ver",
        variant: "view",
      },
      {
        hidden: () => !canUpdate,
        href: (row) => SUPPLIERS_ROUTES.edit(row.id),
        icon: Pencil,
        id: "edit",
        label: "Editar",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar proveedor",
          description: (rows) =>
            `Eliminar ${rows[0]?.legalName ?? "este proveedor"} de las vistas activas y conservar su historial de auditoria.`,
          title: "¿Eliminar proveedor?",
          tone: "danger",
        },
        hidden: () => !canDelete,
        icon: Trash2,
        id: "delete",
        label: "Eliminar",
        onClick: async (row) => {
          await deleteMutation.mutateAsync(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por razon social, nombre comercial, NIT, telefono o correo",
  };

  return <DataTable config={tableConfig} endpoint={SUPPLIERS_API_ENDPOINT} />;
}
