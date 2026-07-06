"use client";

import { useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Eye, X } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { QUERY_KEYS } from "@/lib/constants";
import { userService } from "@/services/user-service";
import type { AuditLogTableRow, LogJsonValue } from "@/types";

import { formatLogDateTime, summarizeLogValue } from "../logs/log-formatters";

const formatJson = (value: LogJsonValue | null): string => {
  return JSON.stringify(value, null, 2) ?? "null";
};

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  role: "Roles",
  system_setting: "Configuración del sistema",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "role.created": "Rol creado",
  "role.deleted": "Rol eliminado",
  "role.permissions.updated": "Permisos del rol actualizados",
  "role.updated": "Rol actualizado",
  "system.setting.updated": "Configuración del sistema actualizada",
};

const formatAuditEntityLabel = (value: string): string => {
  const localizedValue = AUDIT_ENTITY_LABELS[value];

  if (localizedValue) {
    return localizedValue;
  }

  return value
    .split(/[_.-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

const formatAuditActionLabel = (value: string): string => {
  return AUDIT_ACTION_LABELS[value] ?? value.replaceAll(".", " · ");
};

const getAuditDetailValue = (row: AuditLogTableRow): LogJsonValue | null => {
  return row.metadataJson ?? row.afterJson ?? row.beforeJson;
};

const getAuditPreview = (value: LogJsonValue | null): string => {
  const summary = summarizeLogValue(value);
  return summary.length > 180 ? `${summary.slice(0, 177)}...` : summary;
};

const entityOptions = [
  {
    label: "Roles",
    value: "role",
  },
  {
    label: "Configuración del sistema",
    value: "system_setting",
  },
];

const actionOptions = [
  "role.created",
  "role.updated",
  "role.deleted",
  "role.permissions.updated",
  "system.setting.updated",
].map((action) => ({
  label: formatAuditActionLabel(action),
  value: action,
}));

export function AuditLogManager() {
  const [selectedLog, setSelectedLog] = useState<AuditLogTableRow | null>(null);

  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: QUERY_KEYS.auditLogUsers,
    staleTime: 60_000,
  });

  const columns: ColumnDef<AuditLogTableRow>[] = [
    {
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-sm text-stone-700">
          {formatLogDateTime(row.original.createdAt)}
        </span>
      ),
      header: "Fecha",
    },
    {
      accessorKey: "action",
      cell: ({ row }) => (
        <span className="inline-flex max-w-full break-words rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[color:var(--color-primary-contrast)]">
          {formatAuditActionLabel(row.original.action)}
        </span>
      ),
      header: "Acción",
    },
    {
      accessorKey: "actorUser.name",
      cell: ({ row }) => (
        <div className="min-w-0 max-w-[14rem] space-y-1">
          <p className="truncate text-stone-900">{row.original.actorUser?.name ?? "Sistema"}</p>
          <p className="truncate text-sm text-stone-500">
            {row.original.actorUser?.email ?? "Cambio automático"}
          </p>
        </div>
      ),
      header: "Usuario",
    },
    {
      accessorKey: "entityType",
      cell: ({ row }) => (
        <p className="min-w-0 break-words font-medium text-stone-900">
          {formatAuditEntityLabel(row.original.entityType)}
        </p>
      ),
      header: "Módulo",
    },
    {
      accessorKey: "entityId",
      cell: ({ row }) => (
        <p className="font-mono text-xs text-stone-600 break-all">
          {row.original.entityId ?? "Sin recurso"}
        </p>
      ),
      header: "Recurso",
    },
    {
      accessorKey: "ipAddress",
      cell: ({ row }) => (
        <p className="font-mono text-xs text-stone-600 break-all">
          {row.original.ipAddress ?? "Sin IP"}
        </p>
      ),
      header: "IP",
    },
    {
      accessorKey: "metadataJson",
      cell: ({ row }) => (
        <p className="min-w-0 break-words whitespace-normal text-sm leading-6 text-stone-600">
          {getAuditPreview(getAuditDetailValue(row.original))}
        </p>
      ),
      enableSorting: false,
      header: "Detalle",
    },
  ];

  const tableConfig: DataTableConfig<AuditLogTableRow> = {
    columns,
    defaultSort: {
      desc: true,
      id: "createdAt",
    },
    emptyState: {
      description:
        "Cuando se realicen acciones administrativas, aparecerán en este registro.",
      title: "No hay eventos de auditoría registrados.",
    },
    enableSelection: false,
    filters: [
      {
        id: "dateFrom",
        label: "Fecha desde",
        type: "date",
      },
      {
        id: "dateTo",
        label: "Fecha hasta",
        type: "date",
      },
      {
        id: "actorUserId",
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
        label: "Módulo",
        options: entityOptions,
        placeholder: "Todos los módulos",
        type: "select",
      },
      {
        id: "action",
        label: "Acción",
        options: actionOptions,
        placeholder: "Todas las acciones",
        type: "select",
      },
    ],
    getRowId: (row) => row.id,
    queryKey: ["admin", "audit-logs", "table"],
    rowActions: [
      {
        icon: Eye,
        id: "view",
        label: "Ver detalle",
        onClick: (row) => {
          setSelectedLog(row);
        },
      },
    ],
    tableClassName: "table-fixed",
    searchPlaceholder: "Busca por acción, módulo, recurso o usuario",
  };

  return (
    <>
      <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <DataTable config={tableConfig} endpoint="/audit-logs" />
      </section>

      {selectedLog ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Cerrar detalle de auditoría"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={() => {
              setSelectedLog(null);
            }}
            type="button"
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[42rem] overflow-y-auto border-l border-stone-300/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.99),rgba(226,240,255,0.99))] p-6 shadow-[-24px_0_60px_rgba(15,47,91,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Detalle del evento
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
                  {formatAuditActionLabel(selectedLog.action)}
                </h2>
                <p className="break-words text-sm leading-7 text-stone-700">
                  {formatAuditEntityLabel(selectedLog.entityType)}
                  {selectedLog.entityId ? ` • ${selectedLog.entityId}` : ""}
                </p>
              </div>
              <button
                className="inline-flex rounded-md border border-stone-300 bg-white p-3 text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                onClick={() => {
                  setSelectedLog(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Usuario
                </p>
                <p className="mt-2 text-sm font-medium text-stone-900">
                  {selectedLog.actorUser?.name ?? "Sistema"}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {selectedLog.actorUser?.email ?? "Cambio automático"}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Fecha
                </p>
                <p className="mt-2 text-sm text-stone-900">
                  {formatLogDateTime(selectedLog.createdAt)}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {selectedLog.ipAddress ?? "Sin dirección IP"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Recurso
                </p>
                <p className="mt-2 break-all font-mono text-xs text-stone-900">
                  {selectedLog.entityId ?? "Sin recurso"}
                </p>
              </div>
              <div className="rounded-lg border border-stone-200/90 bg-white/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Agente
                </p>
                <p className="mt-2 break-words text-xs text-stone-700">
                  {selectedLog.userAgent ?? "Sin agente de usuario"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <section className="rounded-lg border border-stone-200/90 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Detalle
                </p>
                <pre className="mt-3 max-h-[18rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--color-primary)] p-4 text-xs leading-6 text-[color:var(--color-primary-contrast)]">
                  {formatJson(getAuditDetailValue(selectedLog))}
                </pre>
              </section>

              <section className="rounded-lg border border-stone-200/90 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Antes
                </p>
                <pre className="mt-3 max-h-[18rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--color-primary)] p-4 text-xs leading-6 text-[color:var(--color-primary-contrast)]">
                  {formatJson(selectedLog.beforeJson)}
                </pre>
              </section>

              <section className="rounded-lg border border-stone-200/90 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Despues
                </p>
                <pre className="mt-3 max-h-[18rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--color-primary)] p-4 text-xs leading-6 text-[color:var(--color-primary-contrast)]">
                  {formatJson(selectedLog.afterJson)}
                </pre>
              </section>

              <section className="rounded-lg border border-stone-200/90 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Metadata adicional
                </p>
                <pre className="mt-3 max-h-[18rem] overflow-auto whitespace-pre-wrap break-words rounded-md bg-[var(--color-primary)] p-4 text-xs leading-6 text-[color:var(--color-primary-contrast)]">
                  {formatJson(selectedLog.metadataJson)}
                </pre>
              </section>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
