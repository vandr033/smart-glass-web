"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateOnlyValue } from "@/lib/formatters";
import type { MaterialListItem } from "@/types";

import {
  MATERIALS_API_ENDPOINT,
  MATERIALS_PERMISSIONS,
  MATERIALS_QUERY_KEYS,
  MATERIALS_ROUTES,
  MATERIAL_STATUS_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from "../constants";
import { useMaterials } from "../hooks/useMaterials";
import {
  BooleanBadge,
  MaterialStatusBadge,
  MaterialTypeBadge,
} from "./MaterialBadges";

const materialColumns: ColumnDef<MaterialListItem>[] = [
  {
    accessorKey: "code",
    cell: ({ row }) => (
      <div className="min-w-[16rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.code}</p>
        <p className="text-sm text-stone-700">{row.original.name}</p>
        <p className="text-xs text-stone-500">
          {row.original.description || row.original.brand || "Sin descriptor secundario"}
        </p>
      </div>
    ),
    header: "Material",
  },
  {
    accessorKey: "category",
    cell: ({ row }) => (
      <div className="min-w-[12rem]">
        <p className="font-medium text-stone-900">{row.original.category.name}</p>
        <p className="text-xs text-stone-500">{row.original.category.slug}</p>
      </div>
    ),
    header: "Categoria",
  },
  {
    accessorKey: "materialType",
    cell: ({ row }) => <MaterialTypeBadge value={row.original.materialType} />,
    header: "Tipo",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => <MaterialStatusBadge value={row.original.status} />,
    header: "Estado",
  },
  {
    accessorKey: "isCuttable",
    cell: ({ row }) => (
      <BooleanBadge
        falseLabel="Sin corte"
        trueLabel="Cortable"
        value={row.original.isCuttable}
      />
    ),
    header: "Corte",
  },
  {
    accessorKey: "isRemnantEligible",
    cell: ({ row }) => (
      <BooleanBadge
        falseLabel="Sin remanentes"
        trueLabel="Remanentes"
        value={row.original.isRemnantEligible}
      />
    ),
    header: "Remanentes",
  },
  {
    accessorKey: "isStockable",
    cell: ({ row }) => (
      <BooleanBadge
        falseLabel="Sin inventario"
        trueLabel="Inventariable"
        value={row.original.isStockable}
      />
    ),
    header: "Inventario",
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

export function MaterialTable() {
  const { permissions } = usePermissions();
  const { useDeleteMaterial, useMaterialCategories } = useMaterials();
  const categoriesQuery = useMaterialCategories();
  const deleteMutation = useDeleteMaterial();
  const canUpdate = permissions.includes(MATERIALS_PERMISSIONS.update);
  const canDelete = permissions.includes(MATERIALS_PERMISSIONS.delete);

  const tableConfig: DataTableConfig<MaterialListItem> = {
    columns: materialColumns,
    csv: {
      columns: [
        {
          header: "Codigo",
          key: "code",
          value: (row) => row.code,
        },
        {
          header: "Nombre",
          key: "name",
          value: (row) => row.name,
        },
        {
          header: "Categoria",
          key: "category",
          value: (row) => row.category.name,
        },
        {
          header: "Tipo",
          key: "materialType",
          value: (row) => row.materialType,
        },
        {
          header: "Estado",
          key: "status",
          value: (row) => row.status,
        },
      ],
      fileName: "materiales.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Prueba limpiando filtros, ampliando la busqueda o creando el primer material para iniciar el catalogo.",
      title: "No hay materiales para esta vista",
    },
    filters: [
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
      {
        id: "materialType",
        label: "Tipo",
        options: MATERIAL_TYPE_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        placeholder: "Todos los tipos",
        type: "select",
      },
      {
        id: "status",
        label: "Estado",
        options: MATERIAL_STATUS_OPTIONS.map((option) => ({
          label: option.label,
          value: option.value,
        })),
        placeholder: "Todos los estados",
        type: "select",
      },
      {
        id: "isCuttable",
        label: "Cortable",
        options: [
          { label: "Si", value: "true" },
          { label: "No", value: "false" },
        ],
        placeholder: "Cualquier estado de corte",
        type: "select",
      },
      {
        id: "isStockable",
        label: "Inventariable",
        options: [
          { label: "Si", value: "true" },
          { label: "No", value: "false" },
        ],
        placeholder: "Cualquier estado de inventario",
        type: "select",
      },
      {
        id: "isRemnantEligible",
        label: "Remanentes",
        options: [
          { label: "Aplica", value: "true" },
          { label: "No aplica", value: "false" },
        ],
        placeholder: "Cualquier estado de remanente",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: MATERIALS_QUERY_KEYS.table,
    rowActions: [
      {
        href: (row) => MATERIALS_ROUTES.view(row.id),
        icon: Eye,
        id: "view",
        label: "Ver",
        variant: "view",
      },
      {
        hidden: () => !canUpdate,
        href: (row) => MATERIALS_ROUTES.edit(row.id),
        icon: Pencil,
        id: "edit",
        label: "Editar",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar material",
          description: (rows) =>
            `Eliminar ${rows[0]?.code ?? "este material"} de las vistas activas y conservar su historial de auditoria.`,
          title: "¿Eliminar material?",
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
    searchPlaceholder: "Buscar por codigo, nombre, descripcion, color, acabado o marca",
  };

  return <DataTable config={tableConfig} endpoint={MATERIALS_API_ENDPOINT} />;
}
