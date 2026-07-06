"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { AuditLogTableRow } from "@/types";

import { formatLogDateTime, summarizeLogValue } from "./log-formatters";

const AUDIT_ACTION_LABELS: Record<string, string> = {
  Created: "Creado",
  Deleted: "Eliminado",
  Updated: "Actualizado",
};

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Invitation: "Invitacion",
  Role: "Rol",
  Setting: "Configuracion",
  User: "Usuario",
};

const AUDIT_ACTION_OPTIONS = ["Created", "Deleted", "Updated"] as const;
const AUDIT_ENTITY_OPTIONS = ["Invitation", "Role", "Setting", "User"] as const;

const formatAuditAction = (value: string) => AUDIT_ACTION_LABELS[value] ?? value;
const formatAuditEntity = (value: string) => AUDIT_ENTITY_LABELS[value] ?? value;

const auditLogColumns: ColumnDef<AuditLogTableRow>[] = [
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-stone-700">
        {formatLogDateTime(row.original.createdAt)}
      </span>
    ),
    header: "Creado",
  },
  {
    accessorKey: "action",
    cell: ({ row }) => (
      <span className="inline-flex rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary-contrast)]">
        {formatAuditAction(row.original.action)}
      </span>
    ),
    header: "Accion",
  },
  {
    accessorKey: "changedBy.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.changedBy?.name ?? "Sistema"}</p>
        <p className="text-sm text-stone-500">
          {row.original.changedBy?.email ?? "Cambio automatico"}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Modificado por",
  },
  {
    accessorKey: "entityId",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{formatAuditEntity(row.original.entityType)}</p>
        <p className="font-mono text-xs text-stone-500">
          {row.original.entityId ?? "Sin id de entidad"}
        </p>
      </div>
    ),
    header: "Entidad",
  },
  {
    accessorKey: "oldValues",
    cell: ({ row }) => (
      <p className="max-w-[18rem] text-sm leading-6 text-stone-600">
        {summarizeLogValue(row.original.oldValues)}
      </p>
    ),
    enableSorting: false,
    header: "Antes",
  },
  {
    accessorKey: "newValues",
    cell: ({ row }) => (
      <p className="max-w-[18rem] text-sm leading-6 text-stone-600">
        {summarizeLogValue(row.original.newValues)}
      </p>
    ),
    enableSorting: false,
    header: "Despues",
  },
];

export function AuditLogTable() {
  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.auditLogUsers,
    staleTime: 60_000,
  });

  const auditLogTableConfig: DataTableConfig<AuditLogTableRow> = {
    columns: auditLogColumns,
    csv: {
      columns: [
        { header: "Fecha", key: "createdAt", value: (row) => formatLogDateTime(row.createdAt) },
        { header: "Accion", key: "action", value: (row) => formatAuditAction(row.action) },
        { header: "Entidad", key: "entityType", value: (row) => formatAuditEntity(row.entityType) },
        { header: "Modificado por", key: "changedBy", value: (row) => row.changedBy?.name ?? "Sistema" },
        { header: "Antes", key: "oldValues", value: (row) => summarizeLogValue(row.oldValues) },
        { header: "Despues", key: "newValues", value: (row) => summarizeLogValue(row.newValues) },
      ],
      fileName: "bitacora-auditoria.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "No hay cambios auditados para la busqueda y filtros actuales. Prueba limpiando algun filtro de fecha o accion.",
      title: "No hay registros de auditoria para esta vista",
    },
    enableSelection: false,
    filters: [
      {
        id: "dateFrom",
        label: "Desde",
        type: "date",
      },
      {
        id: "dateTo",
        label: "Hasta",
        type: "date",
      },
      {
        id: "userId",
        label: "Usuario",
        options: (usersQuery.data ?? []).map((user) => ({
          label: `${user.name} (${user.email})`,
          value: user.id,
        })),
        placeholder: "Todos los usuarios",
        type: "select",
      },
      {
        id: "entityType",
        label: "Tipo de entidad",
        options: AUDIT_ENTITY_OPTIONS.map((entityType) => ({
          label: formatAuditEntity(entityType),
          value: entityType.toLowerCase(),
        })),
        placeholder: "Todas las entidades",
        type: "select",
      },
      {
        id: "action",
        label: "Accion",
        options: AUDIT_ACTION_OPTIONS.map((action) => ({
          label: formatAuditAction(action),
          value: action,
        })),
        placeholder: "Todas las acciones",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["audit-logs", "table"],
    searchPlaceholder: "Buscar por entidad, ID de registro o usuario que lo modifico",
  };

  return <DataTable config={auditLogTableConfig} endpoint="/audit-logs" />;
}
