"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeDollarSign,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExportMenu } from "@/components/ui/export-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { PROJECTS_ROUTES } from "@/modules/projects/constants";
import { clientService } from "@/services/client-service";
import { projectService } from "@/services/project-service";
import { postventaService } from "@/services/postventa-service";
import { userService } from "@/services/user-service";
import type {
  PostventaCaseStatus,
  PostventaPriority,
  ProductWarrantyStatus,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  exportarCasosPostventaExcel,
  exportarCasosPostventaPdf,
} from "../exports";
import {
  GARANTIAS_PERMISSIONS,
  POSTVENTA_PERMISSIONS,
  POSTVENTA_PRIORITY_OPTIONS,
  POSTVENTA_QUERY_KEYS,
  POSTVENTA_ROUTES,
  POSTVENTA_STATUS_OPTIONS,
  POSTVENTA_TYPE_LABELS,
  PRODUCT_WARRANTY_STATUS_OPTIONS,
} from "../constants";
import {
  formatPostventaCurrency,
  formatPostventaDate,
  getPostventaPriorityBadge,
  getPostventaStatusBadge,
  getWarrantyStatusBadge,
} from "../ui";

const buildIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const todayValue = buildIsoDate(new Date());
const nextYearValue = (() => {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return buildIsoDate(nextYear);
})();

const emptyWarrantyForm: {
  clientId: string;
  conditions: string;
  endDate: string;
  productType: string;
  projectId: string;
  startDate: string;
  status: ProductWarrantyStatus;
} = {
  clientId: "",
  conditions: "",
  endDate: nextYearValue,
  productType: "",
  projectId: "",
  startDate: todayValue,
  status: "VIGENTE",
};

export default function PostventaHomePage() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canCreateCase = permissions.includes(POSTVENTA_PERMISSIONS.crear);
  const canExport = permissions.includes(POSTVENTA_PERMISSIONS.exportar);
  const canCreateWarranty = permissions.includes(GARANTIAS_PERMISSIONS.crear);
  const canUpdateWarranty = permissions.includes(GARANTIAS_PERMISSIONS.actualizar);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | PostventaCaseStatus>("");
  const [priority, setPriority] = useState<"" | PostventaPriority>("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingWarrantyId, setEditingWarrantyId] = useState<string | null>(null);
  const [warrantyError, setWarrantyError] = useState<string | null>(null);
  const [warrantyForm, setWarrantyForm] = useState(emptyWarrantyForm);

  const caseFilters = {
    clientId: clientId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    perPage: 12,
    priority: priority || undefined,
    projectId: projectId || undefined,
    responsibleId: responsibleId || undefined,
    search,
    sortBy: "reportedAt" as const,
    sortDirection: "desc" as const,
    status: status || undefined,
  };

  const casesQuery = useQuery({
    queryFn: () => postventaService.listCases(caseFilters),
    queryKey: POSTVENTA_QUERY_KEYS.casos(caseFilters),
    staleTime: 30_000,
  });

  const warrantiesQuery = useQuery({
    queryFn: () =>
      postventaService.listWarranties({
        clientId: clientId || undefined,
        page: 1,
        perPage: 8,
        projectId: projectId || undefined,
        search,
        sortBy: "endDate",
        sortDirection: "desc",
      }),
    queryKey: POSTVENTA_QUERY_KEYS.garantias({
      clientId,
      projectId,
      search,
    }),
    staleTime: 30_000,
  });

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
    queryKey: ["postventa", "clientes"],
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryFn: async () => {
      const result = await projectService.listProjects({
        clientId: clientId || undefined,
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["postventa", "proyectos", clientId],
    staleTime: 60_000,
  });

  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["postventa", "usuarios"],
    staleTime: 60_000,
  });

  const invalidatePostventa = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: POSTVENTA_QUERY_KEYS.all,
      }),
      queryClient.invalidateQueries({
        queryKey: ["rentabilidad"],
      }),
    ]);
  };

  const warrantyMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: warrantyForm.clientId || null,
        conditions: warrantyForm.conditions.trim() || null,
        endDate: warrantyForm.endDate,
        productType: warrantyForm.productType.trim(),
        projectId: warrantyForm.projectId,
        startDate: warrantyForm.startDate,
        status: warrantyForm.status,
      };

      if (editingWarrantyId) {
        return postventaService.updateWarranty(editingWarrantyId, payload);
      }

      return postventaService.createWarranty(payload);
    },
    onSuccess: async () => {
      setEditingWarrantyId(null);
      setWarrantyError(null);
      setWarrantyForm(emptyWarrantyForm);
      await invalidatePostventa();
    },
  });

  const projects = projectsQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const cases = useMemo(() => casesQuery.data?.data ?? [], [casesQuery.data?.data]);
  const warranties = useMemo(
    () => warrantiesQuery.data?.data ?? [],
    [warrantiesQuery.data?.data],
  );
  const pagination = casesQuery.data?.pagination;

  const stats = useMemo(() => {
    const criticalCount = cases.filter((item) => item.priority === "CRITICA").length;
    const openCount = cases.filter((item) => item.status !== "CERRADO").length;
    const totalCost = cases.reduce((sum, item) => sum + item.totalCost, 0);
    const vigentes = warranties.filter((item) => item.estaVigente).length;

    return {
      criticalCount,
      openCount,
      totalCases: pagination?.total ?? cases.length,
      totalCost,
      vigentes,
    };
  }, [cases, pagination?.total, warranties]);

  if (casesQuery.isPending || warrantiesQuery.isPending) {
    return <LoadingState cards={6} title="Cargando modulo de postventa" />;
  }

  if (casesQuery.isError || warrantiesQuery.isError) {
    return (
      <ErrorState
        description={
          casesQuery.error?.message ??
          warrantiesQuery.error?.message ??
          "No se pudo cargar la informacion de postventa."
        }
        title="No se pudo abrir postventa"
      />
    );
  }

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            {canCreateCase ? (
              <Link className={primaryButtonClassName} href={POSTVENTA_ROUTES.crear}>
                Registrar caso
              </Link>
            ) : null}
            {canExport ? (
              <ExportMenu
                actions={[
                  {
                    icon: FileText,
                    id: "pdf-casos",
                    label: "PDF de casos",
                    onClick: () => {
                      exportarCasosPostventaPdf(cases);
                    },
                  },
                  {
                    icon: FileSpreadsheet,
                    id: "excel-casos",
                    label: "Excel de casos",
                    onClick: () => {
                      exportarCasosPostventaExcel(cases);
                    },
                  },
                ]}
                buttonClassName={secondaryButtonClassName}
                disabled={cases.length === 0}
                label="Exportaciones"
              />
            ) : null}
          </>
        }
        description="Centraliza reclamos, garantias, visitas de revision, costos y reposiciones para cerrar cada caso con trazabilidad e impacto financiero."
        eyebrow="Garantias y postventa"
        title="Postventa"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Casos visibles segun el filtro actual."
          icon={ClipboardCheck}
          label="Casos"
          value={String(stats.totalCases)}
        />
        <StatCard
          description="Casos que todavia requieren seguimiento operativo."
          icon={LifeBuoy}
          label="Abiertos"
          tone="accent"
          value={String(stats.openCount)}
        />
        <StatCard
          description="Casos con prioridad critica dentro del listado actual."
          icon={ShieldCheck}
          label="Criticos"
          value={String(stats.criticalCount)}
        />
        <StatCard
          description="Costo acumulado de los casos listados."
          icon={BadgeDollarSign}
          label="Costo postventa"
          value={formatPostventaCurrency(stats.totalCost)}
        />
        <StatCard
          description="Garantias vigentes visibles en la consulta actual."
          icon={ShieldCheck}
          label="Garantias vigentes"
          value={String(stats.vigentes)}
        />
      </section>

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Seguimiento compacto
            </h2>
          </div>
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setPage(1);
              setSearch("");
              setStatus("");
              setPriority("");
              setClientId("");
              setProjectId("");
              setResponsibleId("");
              setDateFrom("");
              setDateTo("");
            }}
            type="button"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por codigo, cliente o descripcion"
            value={search}
          />
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as "" | PostventaCaseStatus);
            }}
            value={status}
          >
            <option value="">Todos los estados</option>
            {POSTVENTA_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setPriority(event.target.value as "" | PostventaPriority);
            }}
            value={priority}
          >
            <option value="">Todas las prioridades</option>
            {POSTVENTA_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setResponsibleId(event.target.value);
            }}
            value={responsibleId}
          >
            <option value="">Todos los responsables</option>
            {(usersQuery.data ?? []).map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setClientId(event.target.value);
              setProjectId("");
            }}
            value={clientId}
          >
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </select>
          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setProjectId(event.target.value);
            }}
            value={projectId}
          >
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} · {project.title}
              </option>
            ))}
          </select>
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setDateFrom(event.target.value);
            }}
            type="date"
            value={dateFrom}
          />
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setDateTo(event.target.value);
            }}
            type="date"
            value={dateTo}
          />
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Casos activos
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Lista de casos postventa
            </h2>
          </div>
          <p className="text-sm text-stone-500">
            Pagina {pagination?.page ?? 1} de{" "}
            {pagination ? Math.max(Math.ceil(pagination.total / pagination.perPage), 1) : 1}
          </p>
        </div>

        {cases.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              description="Ajusta los filtros o registra un nuevo caso para comenzar el seguimiento postventa."
              title="No hay casos para mostrar"
            />
          </div>
        ) : (
          <div className={`mt-4 ${tableWrapperClassName}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-4 py-3">Caso</th>
                    <th className="px-4 py-3">Cliente y proyecto</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Prioridad</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Garantia</th>
                    <th className="px-4 py-3">Costo</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {cases.map((item) => {
                    const statusBadge = getPostventaStatusBadge(item.status);
                    const priorityBadge = getPostventaPriorityBadge(item.priority);

                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 align-top">
                          <p className="font-semibold text-stone-950">{item.code}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            {POSTVENTA_TYPE_LABELS[item.type]} · Reportado{" "}
                            {formatPostventaDate(item.reportedAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-stone-900">{item.client.displayName}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            {item.project ? (
                              <Link
                                className="font-medium text-[color:var(--color-primary)]"
                                href={PROJECTS_ROUTES.view(item.project.id)}
                              >
                                {item.project.code} · {item.project.title}
                              </Link>
                            ) : (
                              "Sin proyecto asociado"
                            )}
                          </p>
                          <p className="mt-2 max-w-[32ch] text-xs leading-5 text-stone-600">
                            {item.descripcionCorta}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                          <p className="mt-2 text-xs text-stone-500">
                            Pendientes {item.activityPendingCount} · Evidencias {item.evidenceCount}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.className}`}
                          >
                            {priorityBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-stone-700">
                          {item.responsible?.name ?? "Sin asignar"}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {item.warranty ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              {item.warranty.estaVigente ? "Vigente" : "Vencida"}
                            </span>
                          ) : item.outsideWarranty ? (
                            <span className="inline-flex rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">
                              Fuera de garantia
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                              Sin validar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top font-semibold text-stone-950">
                          {formatPostventaCurrency(item.totalCost)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Link className={secondaryButtonClassName} href={POSTVENTA_ROUTES.detalle(item.id)}>
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            className={secondaryButtonClassName}
            disabled={!pagination || pagination.page <= 1}
            onClick={() => {
              setPage((current) => Math.max(current - 1, 1));
            }}
            type="button"
          >
            Anterior
          </button>
          <button
            className={secondaryButtonClassName}
            disabled={!pagination || pagination.page * pagination.perPage >= pagination.total}
            onClick={() => {
              setPage((current) => current + 1);
            }}
            type="button"
          >
            Siguiente
          </button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={sectionClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                Garantias
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Vigencia por proyecto
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {warranties.length === 0 ? (
              <EmptyState
                description="Registra condiciones por proyecto para validar si los nuevos casos entran o no en garantia."
                title="Sin garantias registradas"
              />
            ) : (
              warranties.map((warranty) => {
                const badge = getWarrantyStatusBadge(warranty.status);

                return (
                  <article
                    key={warranty.id}
                    className="rounded-md border border-stone-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {warranty.productType}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {warranty.project?.code ?? "Sin codigo"} ·{" "}
                          {warranty.project?.title ?? "Sin proyecto"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        {canUpdateWarranty ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setEditingWarrantyId(warranty.id);
                              setWarrantyError(null);
                              setWarrantyForm({
                                clientId: warranty.client.id,
                                conditions: warranty.conditions ?? "",
                                endDate: warranty.endDate.slice(0, 10),
                                productType: warranty.productType,
                                projectId: warranty.project?.id ?? "",
                                startDate: warranty.startDate.slice(0, 10),
                                status: warranty.status,
                              });
                            }}
                            type="button"
                          >
                            Editar
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Cliente
                        </p>
                        <p className="mt-1 text-sm text-stone-900">
                          {warranty.client.displayName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Inicio
                        </p>
                        <p className="mt-1 text-sm text-stone-900">
                          {formatPostventaDate(warranty.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                          Fin
                        </p>
                        <p className="mt-1 text-sm text-stone-900">
                          {formatPostventaDate(warranty.endDate)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-700">
                      {warranty.conditions || "Sin condiciones especificas registradas."}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>

        {(canCreateWarranty || canUpdateWarranty) ? (
          <section className={sectionClassName}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                  Registro
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  {editingWarrantyId ? "Editar garantia" : "Nueva garantia"}
                </h2>
              </div>
              {editingWarrantyId ? (
                <button
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setEditingWarrantyId(null);
                    setWarrantyError(null);
                    setWarrantyForm(emptyWarrantyForm);
                  }}
                  type="button"
                >
                  Cancelar
                </button>
              ) : null}
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setWarrantyError(null);

                try {
                  await warrantyMutation.mutateAsync();
                } catch (error) {
                  setWarrantyError(getApiErrorMessage(error));
                }
              }}
            >
              <select
                className={fieldClassName}
                onChange={(event) => {
                  const selectedProject = projects.find((item) => item.id === event.target.value);

                  setWarrantyForm((current) => ({
                    ...current,
                    clientId: selectedProject?.client.id ?? current.clientId,
                    projectId: event.target.value,
                  }));
                }}
                value={warrantyForm.projectId}
              >
                <option value="">Selecciona un proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.title}
                  </option>
                ))}
              </select>

              <select
                className={fieldClassName}
                onChange={(event) => {
                  setWarrantyForm((current) => ({
                    ...current,
                    clientId: event.target.value,
                  }));
                }}
                value={warrantyForm.clientId}
              >
                <option value="">Cliente del proyecto</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName}
                  </option>
                ))}
              </select>

              <input
                className={fieldClassName}
                onChange={(event) => {
                  setWarrantyForm((current) => ({
                    ...current,
                    productType: event.target.value,
                  }));
                }}
                placeholder="Tipo de producto o frente cubierto"
                value={warrantyForm.productType}
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setWarrantyForm((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }));
                  }}
                  type="date"
                  value={warrantyForm.startDate}
                />
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setWarrantyForm((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }));
                  }}
                  type="date"
                  value={warrantyForm.endDate}
                />
              </div>

              <select
                className={fieldClassName}
                onChange={(event) => {
                  setWarrantyForm((current) => ({
                    ...current,
                    status: event.target.value as typeof current.status,
                  }));
                }}
                value={warrantyForm.status}
              >
                {PRODUCT_WARRANTY_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setWarrantyForm((current) => ({
                    ...current,
                    conditions: event.target.value,
                  }));
                }}
                placeholder="Condiciones, exclusiones y alcance de la garantia"
                value={warrantyForm.conditions}
              />

              {warrantyError ? (
                <p className="text-sm text-rose-700">{warrantyError}</p>
              ) : null}

              <button
                className={primaryButtonClassName}
                disabled={warrantyMutation.isPending}
                type="submit"
              >
                {editingWarrantyId ? "Guardar garantia" : "Registrar garantia"}
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}
