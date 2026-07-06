"use client";

import { useState } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { ExportMenu } from "@/components/ui/export-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { usePermissions } from "@/hooks/use-permissions";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import {
  fieldClassName,
  formatDateOnlyValue,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { clientService } from "@/services/client-service";
import { projectService } from "@/services/project-service";

import { ProjectPriorityBadge, ProjectStatusBadge } from "../badges";
import {
  PROJECTS_PERMISSIONS,
  PROJECTS_ROUTES,
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from "../constants";
import { useProjects } from "../hooks/useProjects";

export function ProjectTable() {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { useDeleteProject } = useProjects();
  const deleteMutation = useDeleteProject();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | keyof typeof PROJECT_STATUS_LABELS>("");
  const [priority, setPriority] = useState<"" | keyof typeof PROJECT_PRIORITY_LABELS>("");
  const [projectType, setProjectType] = useState<"" | keyof typeof PROJECT_TYPE_LABELS>("");
  const [clientId, setClientId] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const canUpdate = permissions.includes(PROJECTS_PERMISSIONS.update);
  const canDelete = permissions.includes(PROJECTS_PERMISSIONS.delete);

  const clientsQuery = useQuery({
    queryFn: async () => {
      const result = await clientService.listClients({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["projects", "client-options"],
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryFn: async () =>
      projectService.listProjects({
        clientId: clientId || undefined,
        page,
        perPage: 12,
        priority: priority || undefined,
        projectType: projectType || undefined,
        search,
        sortBy: "createdAt",
        sortDirection: "desc",
        status: status || undefined,
      }),
    queryKey: ["projects", "table", page, search, status, priority, projectType, clientId],
  });

  const records = projectsQuery.data?.data ?? [];
  const pagination = projectsQuery.data?.pagination;

  if (projectsQuery.isLoading) {
    return <LoadingState cards={4} title="Cargando proyectos" />;
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void projectsQuery.refetch();
            }}
            type="button"
          >
            Reintentar
          </button>
        }
        description={projectsQuery.error.message}
        title="No se pudieron cargar los proyectos"
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
              Registro de proyectos
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <ExportMenu
              buttonClassName={secondaryButtonClassName}
              disabled={records.length === 0}
              onExportExcel={() => {
                exportRowsToExcel(records, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Proyecto", value: (row) => row.title },
                    { header: "Estado", value: (row) => PROJECT_STATUS_LABELS[row.status] },
                    { header: "Prioridad", value: (row) => PROJECT_PRIORITY_LABELS[row.priority] },
                    { header: "Tipo", value: (row) => PROJECT_TYPE_LABELS[row.projectType] },
                    { header: "Cliente", value: (row) => row.client.displayName },
                    {
                      header: "Entrega",
                      value: (row) => formatDateOnlyValue(row.expectedDeliveryDate),
                    },
                  ],
                  fileName: "proyectos.xls",
                  title: "Proyectos",
                });
              }}
              onExportPdf={() => {
                exportRowsToPdf(records, {
                  columns: [
                    { header: "Codigo", value: (row) => row.code },
                    { header: "Proyecto", value: (row) => row.title },
                    { header: "Estado", value: (row) => PROJECT_STATUS_LABELS[row.status] },
                    { header: "Cliente", value: (row) => row.client.displayName },
                    {
                      header: "Entrega",
                      value: (row) => formatDateOnlyValue(row.expectedDeliveryDate),
                    },
                  ],
                  title: "Proyectos",
                });
              }}
            />
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void projectsQuery.refetch();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por codigo, titulo, cliente o direccion"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus((event.target.value as typeof status) ?? "");
            }}
            value={status}
          >
            <option value="">Cualquier Estado</option>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setPriority((event.target.value as typeof priority) ?? "");
            }}
            value={priority}
          >
            <option value="">Todas las prioridades</option>
            {Object.entries(PROJECT_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setProjectType((event.target.value as typeof projectType) ?? "");
            }}
            value={projectType}
          >
            <option value="">Todos los tipos</option>
            {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setClientId(event.target.value);
            }}
            value={clientId}
          >
            <option value="">Todos los clientes</option>
            {(clientsQuery.data ?? []).map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </select>
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          description="Los proyectos apareceran aqui cuando los prospectos avancen por medicion, cotizacion y aprobacion."
          title="No hay proyectos para la vista actual"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Proyecto</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Prioridad</th>
                  <th className="px-5 py-4 font-semibold">Cliente</th>
                  <th className="px-5 py-4 font-semibold">Entrega</th>
                  <th className="px-5 py-4 font-semibold">Responsable</th>
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-stone-200/80 align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-stone-950">
                        {record.code} · {record.title}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {record.siteAddress || "Sin direccion de obra registrada"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <ProjectStatusBadge status={record.status} />
                    </td>
                    <td className="px-5 py-4">
                      <ProjectPriorityBadge priority={record.priority} />
                    </td>
                    <td className="px-5 py-4 text-stone-700">{record.client.displayName}</td>
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateOnlyValue(record.expectedDeliveryDate)}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {record.responsibleUser?.name || record.salesUser?.name || "Sin asignar"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          className={secondaryButtonClassName}
                          href={PROJECTS_ROUTES.view(record.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Link>
                        {canUpdate ? (
                          <Link
                            className={secondaryButtonClassName}
                            href={PROJECTS_ROUTES.edit(record.id)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        ) : null}
                        {canDelete ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setProjectToDelete({
                                id: record.id,
                                name: `${record.code} · ${record.title}`,
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
        confirmLabel="Archivar proyecto"
        description={`Se archivara ${projectToDelete?.name ?? "este proyecto"} preservando ciclo de vida, mediciones, notas y adjuntos en la auditoria.`}
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!projectToDelete) {
            return;
          }

          void deleteMutation.mutateAsync(projectToDelete.id).then(() => {
            setProjectToDelete(null);
            router.refresh();
          });
        }}
        onOpenChange={(open) => {
          if (!open) {
            setProjectToDelete(null);
          }
        }}
        open={Boolean(projectToDelete)}
        title="¿Archivar proyecto?"
      />
    </>
  );
}
