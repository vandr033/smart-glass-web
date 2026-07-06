"use client";

import { useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  formatDateOnlyValue,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { clientService } from "@/services/client-service";

import { ClientStatusBadge, ClientTypeBadge } from "../badges";
import {
  CLIENTS_PERMISSIONS,
  CLIENTS_ROUTES,
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
} from "../constants";
import { useClients } from "../hooks/useClients";

export function ClientTable() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { useDeleteClient } = useClients();
  const deleteMutation = useDeleteClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [clientType, setClientType] = useState<"" | "INDIVIDUAL" | "COMPANY">("");
  const [status, setStatus] = useState<"" | "ACTIVE" | "INACTIVE" | "BLOCKED">("");
  const [clientToDelete, setClientToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const canUpdate = permissions.includes(CLIENTS_PERMISSIONS.update);
  const canDelete = permissions.includes(CLIENTS_PERMISSIONS.delete);

  const clientsQuery = useQuery({
    queryFn: async () =>
      clientService.listClients({
        clientType: clientType || undefined,
        page,
        perPage: 12,
        search,
        sortBy: "createdAt",
        sortDirection: "desc",
        status: status || undefined,
      }),
    queryKey: ["clients", "table", page, search, clientType, status],
  });

  const records = clientsQuery.data?.data ?? [];
  const pagination = clientsQuery.data?.pagination;

  if (clientsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando clientes" />;
  }

  if (clientsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void clientsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={clientsQuery.error.message}
        title="No se pudieron cargar los clientes"
      />
    );
  }

  return (
    <>
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Registros comerciales de clientes
            </h2>
          </div>

          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void clientsQuery.refetch();
            }}
            type="button"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por nombre, NIT, telefono o correo"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setClientType((event.target.value as typeof clientType) ?? "");
            }}
            value={clientType}
          >
            <option value="">Todos los tipos de cliente</option>
            {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus((event.target.value as typeof status) ?? "");
            }}
            value={status}
          >
            <option value="">Todos los estados</option>
            {Object.entries(CLIENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          description="Las empresas y personas apareceran aqui cuando el equipo comercial empiece a registrar cuentas operativas."
          title="No hay clientes para esta vista"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Cliente</th>
                  <th className="px-5 py-4 font-semibold">Tipo</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Contacto</th>
                  <th className="px-5 py-4 font-semibold">Ubicacion</th>
                  <th className="px-5 py-4 font-semibold">Creado</th>
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-stone-200/80 align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-950">{record.displayName}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {record.code || record.taxId || "Sin identificador secundario"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <ClientTypeBadge clientType={record.clientType} />
                    </td>
                    <td className="px-5 py-4">
                      <ClientStatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-stone-900">{record.phone || "Sin telefono"}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {record.email || record.whatsapp || "Sin correo ni WhatsApp"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {[record.city, record.country].filter(Boolean).join(", ") || "No definido"}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateOnlyValue(record.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className={secondaryButtonClassName}
                          href={CLIENTS_ROUTES.view(record.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Link>
                        {canUpdate ? (
                          <Link
                            className={secondaryButtonClassName}
                            href={CLIENTS_ROUTES.edit(record.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        ) : null}
                        {canDelete ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setClientToDelete({
                                id: record.id,
                                name: record.displayName,
                              });
                            }}
                            type="button"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-5 py-4 text-sm text-stone-600">
              <p>
                Pagina {pagination.page} de {Math.max(1, Math.ceil(pagination.total / pagination.perPage))}
              </p>
              <div className="flex gap-2">
                <button
                  className={secondaryButtonClassName}
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((currentPage) => Math.max(1, currentPage - 1));
                  }}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className={secondaryButtonClassName}
                  disabled={pagination.page * pagination.perPage >= pagination.total}
                  onClick={() => {
                    setPage((currentPage) => currentPage + 1);
                  }}
                  type="button"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}

      <ConfirmDialog
        confirmLabel="Eliminar cliente"
        description={`Eliminar ${clientToDelete?.name ?? "este cliente"} de las vistas activas y conservar su historial de auditoria y proyectos relacionados.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!clientToDelete) {
            return;
          }

          void deleteMutation.mutateAsync(clientToDelete.id).then(() => {
            setClientToDelete(null);
            router.refresh();
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setClientToDelete(null);
          }
        }}
        open={Boolean(clientToDelete)}
        title="¿Eliminar cliente?"
      />
    </>
  );
}
