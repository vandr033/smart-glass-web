"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { ActivityLogTableRow } from "@/types";

import { formatLogDateTime, summarizeLogValue } from "./log-formatters";

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  "Invitation accepted": "Invitacion aceptada",
  "Invitation resent": "Invitacion reenviada",
  "Invitation revoked": "Invitacion revocada",
  "Invitation sent": "Invitacion enviada",
  "Login failure": "Inicio de sesion fallido",
  "Login success": "Inicio de sesion exitoso",
  "Logout success": "Cierre de sesion exitoso",
  "Permission changed": "Permiso actualizado",
  "Role assigned": "Rol asignado",
  "Role changed": "Rol modificado",
  "Role created": "Rol creado",
  "Role deleted": "Rol eliminado",
  "Role updated": "Rol actualizado",
  "Settings updated": "Configuracion actualizada",
  "User created": "Usuario creado",
  "User deleted": "Usuario eliminado",
  "User disabled": "Usuario deshabilitado",
  "User enabled": "Usuario habilitado",
  "User updated": "Usuario actualizado",
};

const ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  Authentication: "Autenticacion",
  Invitation: "Invitacion",
  Role: "Rol",
  Setting: "Configuracion",
  User: "Usuario",
};

const ACTIVITY_ACTION_OPTIONS = [
  "Invitation accepted",
  "Invitation resent",
  "Invitation revoked",
  "Invitation sent",
  "Login failure",
  "Login success",
  "Logout success",
  "Permission changed",
  "Role assigned",
  "Role changed",
  "Role created",
  "Role deleted",
  "Role updated",
  "Settings updated",
  "User created",
  "User deleted",
  "User disabled",
  "User enabled",
  "User updated",
] as const;

const ACTIVITY_ENTITY_OPTIONS = [
  "Authentication",
  "Invitation",
  "Role",
  "Setting",
  "User",
] as const;

const formatActivityAction = (value: string) => ACTIVITY_ACTION_LABELS[value] ?? value;
const formatActivityEntity = (value: string) => ACTIVITY_ENTITY_LABELS[value] ?? value;

const activityLogColumns: ColumnDef<ActivityLogTableRow>[] = [
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
      <div className="min-w-[12rem] space-y-1">
        <p className="font-semibold text-stone-950">{formatActivityAction(row.original.action)}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {formatActivityEntity(row.original.entityType)}
        </p>
      </div>
    ),
    header: "Accion",
  },
  {
    accessorKey: "user.name",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{row.original.user?.name ?? "Sistema"}</p>
        <p className="text-sm text-stone-500">
          {row.original.user?.email ?? "Evento automatico"}
        </p>
      </div>
    ),
    enableSorting: false,
    header: "Usuario",
  },
  {
    accessorKey: "entityId",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="text-stone-900">{formatActivityEntity(row.original.entityType)}</p>
        <p className="font-mono text-xs text-stone-500">
          {row.original.entityId ?? "Sin id de entidad"}
        </p>
      </div>
    ),
    header: "Entidad",
  },
  {
    accessorKey: "metadata",
    cell: ({ row }) => (
      <p className="max-w-[28rem] text-sm leading-6 text-stone-600">
        {summarizeLogValue(row.original.metadata)}
      </p>
    ),
    enableSorting: false,
    header: "Detalle",
  },
  {
    accessorKey: "ipAddress",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-stone-600">
        {row.original.ipAddress ?? "Desconocida"}
      </span>
    ),
    header: "Direccion IP",
  },
];

export function ActivityLogTable() {
  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.activityLogUsers,
    staleTime: 60_000,
  });

  const activityLogTableConfig: DataTableConfig<ActivityLogTableRow> = {
    columns: activityLogColumns,
    csv: {
      columns: [
        { header: "Fecha", key: "createdAt", value: (row) => formatLogDateTime(row.createdAt) },
        { header: "Accion", key: "action", value: (row) => formatActivityAction(row.action) },
        { header: "Entidad", key: "entityType", value: (row) => formatActivityEntity(row.entityType) },
        { header: "Usuario", key: "user", value: (row) => row.user?.name ?? "Sistema" },
        { header: "Detalle", key: "metadata", value: (row) => summarizeLogValue(row.metadata) },
        { header: "Direccion IP", key: "ipAddress", value: (row) => row.ipAddress ?? "Desconocida" },
      ],
      fileName: "bitacora-actividad.csv",
    },
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "No hay actividad para la busqueda y filtros actuales. Prueba ampliando el rango de fechas o limpiando algun filtro.",
      title: "No hay registros de actividad para esta vista",
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
        options: ACTIVITY_ENTITY_OPTIONS.map((entityType) => ({
          label: formatActivityEntity(entityType),
          value: entityType.toLowerCase(),
        })),
        placeholder: "Todas las entidades",
        type: "select",
      },
      {
        id: "action",
        label: "Accion",
        options: ACTIVITY_ACTION_OPTIONS.map((action) => ({
          label: formatActivityAction(action),
          value: action,
        })),
        placeholder: "Todas las acciones",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["activity-logs", "table"],
    searchPlaceholder: "Buscar por accion, usuario, ID de entidad o direccion IP",
  };

  return <DataTable config={activityLogTableConfig} endpoint="/activity-logs" />;
}
