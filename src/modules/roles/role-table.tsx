"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { getRoleDescription } from "@/modules/roles/localization";
import { roleService } from "@/services/role-service";
import type { RoleTableRow } from "@/types";

const formatDate = (value: string): string => {
  return format(new Date(value), "MMM d, yyyy");
};

const roleColumns: ColumnDef<RoleTableRow>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-stone-950">{row.original.name}</p>
          {row.original.isAdmin ? (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-900">
              Protegido
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {getRoleDescription(row.original.name, row.original.description)}
        </p>
      </div>
    ),
    header: "Nombre",
  },
  {
    accessorKey: "description",
    cell: ({ row }) => (
      <span className="text-stone-700">
        {getRoleDescription(row.original.name, row.original.description)}
      </span>
    ),
    enableSorting: false,
    header: "Descripcion",
  },
  {
    accessorKey: "usersCount",
    cell: ({ row }) => (
      <span className="font-semibold text-stone-900">{row.original.usersCount}</span>
    ),
    header: "Usuarios",
  },
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.createdAt)}
      </span>
    ),
    header: "Creado",
  },
];

export function RoleTable() {
  const { permissions } = usePermissions();
  const canEdit = permissions.includes("system.roles.update");
  const canDelete = permissions.includes("system.roles.update");

  const roleTableConfig: DataTableConfig<RoleTableRow> = {
    columns: roleColumns,
    defaultSort: {
      desc: false,
      id: "name",
    },
    emptyState: {
      description:
        "Prueba ampliando la busqueda o crea un rol para asignar su matriz de permisos aqui.",
      title: "No hay roles para la vista actual",
    },
    enableSelection: false,
    getRowId: (row) => row.id,
    queryKey: ["roles", "table"],
    rowActions: [
      {
        href: (row) => `/roles/${row.id}`,
        icon: Eye,
        id: "view",
        label: "Ver",
        variant: "view",
      },
      {
        hidden: !canEdit,
        href: (row) => `/roles/${row.id}/edit`,
        icon: Pencil,
        id: "edit",
        label: "Editar",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Eliminar rol",
          description: (rows) =>
            `Eliminar ${rows[0]?.name ?? "este rol"} y retirar sus asignaciones actuales de acceso?`,
          title: "¿Eliminar este rol?",
          tone: "danger",
        },
        disabled: (row) => row.isAdmin,
        hidden: !canDelete,
        icon: Trash2,
        id: "delete",
        invalidateAfterSuccess: true,
        label: "Eliminar",
        onClick: async (row) => {
          await roleService.deleteRole(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar roles por nombre o descripcion",
  };

  return <DataTable config={roleTableConfig} endpoint="/roles" />;
}
