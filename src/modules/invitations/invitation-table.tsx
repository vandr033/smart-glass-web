"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MailCheck, ShieldX } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { usePermissions } from "@/hooks/use-permissions";
import { invitationService } from "@/services/invitation-service";
import type { InvitationStatus, InvitationTableRow } from "@/types";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Not accepted";
  }

  return format(new Date(value), "MMM d, yyyy");
};

const statusClassNames: Record<InvitationStatus, string> = {
  Accepted: "bg-emerald-100 text-emerald-800",
  Expired: "bg-blue-100 text-blue-950",
  Pending: "bg-sky-100 text-sky-900",
  Revoked: "bg-stone-200 text-stone-700",
};

const invitationColumns: ColumnDef<InvitationTableRow>[] = [
  {
    accessorKey: "email",
    cell: ({ row }) => (
      <div className="min-w-[14rem] space-y-1">
        <p className="font-semibold text-stone-950">{row.original.email}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          Created {formatDate(row.original.createdAt)}
        </p>
      </div>
    ),
    header: "Email",
  },
  {
    accessorKey: "role.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.role.name}</p>
        <p className="text-sm text-stone-500">
          {row.original.role.description || "No role description provided."}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Role",
  },
  {
    accessorKey: "createdBy.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.createdBy.name}</p>
        <p className="text-sm text-stone-500">
          Invited on {formatDate(row.original.createdAt)}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Creado por",
  },
  {
    accessorKey: "status",
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[row.original.status]}`}
      >
        {row.original.status}
      </span>
    ),
    enableSorting: false,
    header: "Status",
  },
  {
    accessorKey: "expiresAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.expiresAt)}
      </span>
    ),
    header: "Expires At",
  },
  {
    accessorKey: "acceptedAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.acceptedAt)}
      </span>
    ),
    header: "Accepted At",
  },
];

export function InvitationTable() {
  const { permissions } = usePermissions();
  const canResend = permissions.includes("invitations.edit");
  const canRevoke = permissions.includes("invitations.delete");

  const invitationTableConfig: DataTableConfig<InvitationTableRow> = {
    columns: invitationColumns,
    csv: {
      columns: [
        {
          header: "Email",
          key: "email",
          value: (row) => row.email,
        },
        {
          header: "Role",
          key: "role",
          value: (row) => row.role.name,
        },
        {
          header: "Creado por",
          key: "createdBy",
          value: (row) => row.createdBy.name,
        },
        {
          header: "Status",
          key: "status",
          value: (row) => row.status,
        },
        {
          header: "Expires At",
          key: "expiresAt",
          value: (row) => row.expiresAt,
        },
        {
          header: "Accepted At",
          key: "acceptedAt",
          value: (row) => row.acceptedAt ?? "",
        },
      ],
      fileName: "invitations.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Try broadening the search, clearing the status filter, or creating a new invitation.",
      title: "No invitations matched the current table view",
    },
    enableSelection: false,
    filters: [
      {
        id: "status",
        label: "Status",
        options: [
          {
            label: "Pending",
            value: "pending",
          },
          {
            label: "Accepted",
            value: "accepted",
          },
          {
            label: "Expired",
            value: "expired",
          },
          {
            label: "Revoked",
            value: "revoked",
          },
        ],
        placeholder: "Cualquier Estado",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["invitations", "table"],
    rowActions: [
      {
        confirmation: {
          confirmLabel: "Resend invitation",
          description: (rows) =>
            `Send a fresh invitation link to ${rows[0]?.email ?? "this invitee"} and rotate the existing token immediately.`,
          title: "Resend invitation?",
        },
        disabled: (row) => row.status === "Accepted" || row.status === "Revoked",
        hidden: !canResend,
        icon: MailCheck,
        id: "resend",
        invalidateAfterSuccess: true,
        label: "Resend",
        onClick: async (row) => {
          await invitationService.resendInvitation(row.id);
        },
        variant: "custom",
      },
      {
        confirmation: {
          confirmLabel: "Revoke invitation",
          description: (rows) =>
            `Revoke the invitation for ${rows[0]?.email ?? "this invitee"} so the current link can no longer be used.`,
          title: "Revoke invitation?",
          tone: "danger",
        },
        disabled: (row) => row.status === "Accepted" || row.status === "Revoked",
        hidden: !canRevoke,
        icon: ShieldX,
        id: "revoke",
        invalidateAfterSuccess: true,
        label: "Revoke",
        onClick: async (row) => {
          await invitationService.revokeInvitation(row.id);
        },
        tone: "danger",
        variant: "delete",
      },
    ],
    searchPlaceholder: "Buscar por correo, rol o remitente",
  };

  return <DataTable config={invitationTableConfig} endpoint="/invitations" />;
}
