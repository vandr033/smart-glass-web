"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Copy,
  Eye,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { UserTableRow } from "@/types";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Never";
  }

  return format(new Date(value), "MMM d, yyyy");
};

const userColumns: ColumnDef<UserTableRow>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.name}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {row.original.roles.join(" • ") || "No roles assigned"}
        </p>
      </div>
    ),
    header: "Name",
  },
  {
    accessorKey: "email",
    cell: ({ row }) => <span className="text-stone-700">{row.original.email}</span>,
    header: "Email",
  },
  {
    accessorKey: "roles",
    cell: ({ row }) => (
      <span className="text-stone-700">{row.original.roles.join(", ") || "None"}</span>
    ),
    enableSorting: false,
    header: "Role",
  },
  {
    accessorKey: "isActive",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          row.original.isActive
            ? "bg-emerald-100 text-emerald-800"
            : "bg-stone-200 text-stone-700"
        }`}
      >
        {row.original.isActive ? "Active" : "Inactive"}
      </span>
    ),
    header: "Status",
  },
  {
    accessorKey: "lastLoginAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.lastLoginAt)}
      </span>
    ),
    header: "Last Login",
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

export function UserTable() {
  const rolesQuery = useQuery({
    queryFn: userService.getRoleOptions,
    queryKey: QUERY_KEYS.roleOptions,
    staleTime: 60_000,
  });

  const userTableConfig: DataTableConfig<UserTableRow> = {
    bulkActions: [
      {
        confirmation: {
          confirmLabel: "Delete selected",
          description: (rows) =>
            `This will soft-delete ${rows.length} selected user${
              rows.length === 1 ? "" : "s"
            }. These records will leave active views immediately.`,
          title: "Delete selected users?",
          tone: "danger",
        },
        icon: Trash2,
        id: "delete-selected",
        invalidateAfterSuccess: true,
        label: "Delete selected",
        onClick: async (rows) => {
          await userService.bulkDeleteUsers(rows.map((row) => row.id));
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    columns: userColumns,
    csv: {
      columns: [
        {
          header: "Name",
          key: "name",
          value: (row) => row.name,
        },
        {
          header: "Email",
          key: "email",
          value: (row) => row.email,
        },
        {
          header: "Roles",
          key: "roles",
          value: (row) => row.roles.join(", "),
        },
        {
          header: "Status",
          key: "status",
          value: (row) => (row.isActive ? "Active" : "Inactive"),
        },
        {
          header: "Last Login",
          key: "lastLoginAt",
          value: (row) => row.lastLoginAt ?? "",
        },
        {
          header: "Creado",
          key: "createdAt",
          value: (row) => row.createdAt,
        },
      ],
      fileName: "users.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Try broadening the search, clearing filters, or creating a user record for this module.",
      title: "No users matched the current table view",
    },
    filters: [
      {
        id: "isActive",
        label: "Status",
        options: [
          {
            label: "Active",
            value: "true",
          },
          {
            label: "Inactive",
            value: "false",
          },
        ],
        placeholder: "Cualquier Estado",
        type: "select",
      },
      {
        id: "roles",
        label: "Role",
        options: (rolesQuery.data ?? []).map((role) => ({
          label: role.name,
          value: role.name,
        })),
        placeholder: "All roles",
        type: "multi-select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["users", "table"],
    rowActions: [
      {
        href: (row) => `/users/${row.id}`,
        icon: Eye,
        id: "view",
        label: "View",
        variant: "view",
      },
      {
        href: (row) => `/users/${row.id}/edit`,
        icon: Pencil,
        id: "edit",
        label: "Edit",
        variant: "edit",
      },
      {
        confirmation: {
          confirmLabel: "Save status",
          description: (rows) =>
            rows[0]?.isActive
              ? `Disable ${rows[0]?.name ?? "this user"} and remove active access until an admin enables it again.`
              : `Enable ${rows[0]?.name ?? "this user"} and restore active access immediately.`,
          title: "Change user status?",
        },
        icon: Power,
        id: "toggle-active",
        invalidateAfterSuccess: true,
        label: "Toggle status",
        onClick: async (row) => {
          if (row.isActive) {
            await userService.disableUser(row.id);
            return;
          }

          await userService.enableUser(row.id);
        },
        variant: "custom",
      },
      {
        confirmation: {
          confirmLabel: "Delete user",
          description: (rows) =>
            `Delete ${rows[0]?.name ?? "this user"} from active records? This performs a soft delete so the audit trail can stay intact.`,
          title: "Delete user?",
          tone: "danger",
        },
        icon: Trash2,
        id: "delete",
        invalidateAfterSuccess: true,
        label: "Delete",
        onClick: async (row) => {
          await userService.deleteUser(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
      {
        icon: Copy,
        id: "copy-email",
        label: "Copy email",
        onClick: async (row) => {
          await navigator.clipboard.writeText(row.email);
        },
        variant: "custom",
      },
    ],
    searchPlaceholder: "Buscar por nombre o correo",
  };

  if (rolesQuery.isError) {
    userTableConfig.filters = userTableConfig.filters?.filter((filter) => filter.id !== "roles");
  }

  return <DataTable config={userTableConfig} endpoint="/users" />;
}
