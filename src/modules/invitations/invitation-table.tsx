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
    return "No aceptada";
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
    header: "Correo electrónico",
  },
  {
    accessorKey: "role.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.role.name}</p>
        <p className="text-sm text-stone-500">
          {row.original.role.description || "No se proporcionó una descripción del rol."}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Rol",
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
    header: "Estado",
  },
  {
    accessorKey: "expiresAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.expiresAt)}
      </span>
    ),
    header: "Fecha de vencimiento",
  },
  {
    accessorKey: "acceptedAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatDate(row.original.acceptedAt)}
      </span>
    ),
    header: "Fecha de aceptación",
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
          header: "Correo electrónico",
          key: "email",
          value: (row) => row.email,
        },
        {
          header: "Rol",
          key: "role",
          value: (row) => row.role.name,
        },
        {
          header: "Creado por",
          key: "createdBy",
          value: (row) => row.createdBy.name,
        },
        {
          header: "Estado",
          key: "status",
          value: (row) => row.status,
        },
        {
          header: "Fecha de vencimiento",
          key: "expiresAt",
          value: (row) => row.expiresAt,
        },
        {
          header: "Fecha de aceptación",
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
        "Prueba ampliando la búsqueda, quitando el filtro de estado o creando una nueva invitación.",
      title: "No hay invitaciones para la vista actual",
    },
    enableSelection: false,
    filters: [
      {
        id: "status",
        label: "Estado",
        options: [
          {
            label: "Pendiente",
            value: "pending",
          },
          {
            label: "Aceptada",
            value: "accepted",
          },
          {
            label: "Vencida",
            value: "expired",
          },
          {
            label: "Revocada",
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
            `Envía un enlace de invitación nuevo a ${rows[0]?.email ?? "esta persona invitada"} y rota inmediatamente el token existente.`,
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
            `Revoca la invitación para ${rows[0]?.email ?? "esta persona invitada"} para que el enlace actual ya no pueda utilizarse.`,
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
