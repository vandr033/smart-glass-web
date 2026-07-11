"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { quotationService } from "@/services/quotation-service";
import { clientService } from "@/services/client-service";
import { installationService } from "@/services/installation-service";
import { postventaService } from "@/services/postventa-service";
import { projectService } from "@/services/project-service";
import { userService } from "@/services/user-service";
import type { PostventaCaseType, PostventaPriority } from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  POSTVENTA_PERMISSIONS,
  POSTVENTA_PRIORITY_OPTIONS,
  POSTVENTA_ROUTES,
  POSTVENTA_TYPE_OPTIONS,
} from "../constants";
import { formatPostventaDate, getWarrantyStatusBadge } from "../ui";

const buildIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const emptyForm: {
  clientId: string;
  commitmentDate: string;
  description: string;
  installationId: string;
  internalNotes: string;
  outsideWarranty: boolean;
  priority: PostventaPriority;
  projectId: string;
  proposedSolution: string;
  quotationId: string;
  reportedAt: string;
  responsibleId: string;
  type: PostventaCaseType;
  warrantyId: string;
} = {
  clientId: "",
  commitmentDate: "",
  description: "",
  installationId: "",
  internalNotes: "",
  outsideWarranty: false,
  priority: "MEDIA",
  projectId: "",
  proposedSolution: "",
  quotationId: "",
  reportedAt: buildIsoDate(new Date()),
  responsibleId: "",
  type: "RECLAMO",
  warrantyId: "",
};

type CreateSource = "cliente" | "instalacion" | "manual" | "proyecto";

export default function CreatePostventaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions } = usePermissions();
  const canCreate = permissions.includes(POSTVENTA_PERMISSIONS.crear);
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    clientId: searchParams.get("clientId") ?? "",
    installationId: searchParams.get("installationId") ?? "",
    projectId: searchParams.get("projectId") ?? "",
    quotationId: searchParams.get("quotationId") ?? "",
  }));
  const [submitError, setSubmitError] = useState<string | null>(null);

  const source = (searchParams.get("origen") as CreateSource | null) ?? "manual";

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
    queryKey: ["postventa", "form", "clientes"],
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryFn: async () => {
      const result = await projectService.listProjects({
        clientId: form.clientId || undefined,
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["postventa", "form", "proyectos", form.clientId],
    staleTime: 60_000,
  });

  const quotationsQuery = useQuery({
    queryFn: async () => {
      const result = await quotationService.listQuotations({
        clientId: form.clientId || undefined,
        page: 1,
        perPage: 100,
        projectId: form.projectId || undefined,
        sortBy: "updatedAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["postventa", "form", "cotizaciones", form.clientId, form.projectId],
    staleTime: 60_000,
  });

  const installationsQuery = useQuery({
    queryFn: async () => {
      const result = await installationService.listOrders({
        clientId: form.clientId || undefined,
        page: 1,
        perPage: 100,
        projectId: form.projectId || undefined,
        sortBy: "scheduledDate",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["postventa", "form", "instalaciones", form.clientId, form.projectId],
    staleTime: 60_000,
  });

  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["postventa", "form", "usuarios"],
    staleTime: 60_000,
  });

  const warrantiesQuery = useQuery({
    queryFn: () =>
      postventaService.listWarranties({
        clientId: form.clientId || undefined,
        page: 1,
        perPage: 100,
        projectId: form.projectId || undefined,
        sortBy: "endDate",
        sortDirection: "asc",
        vigente: true,
      }),
    queryKey: ["postventa", "form", "garantias", form.clientId, form.projectId],
    staleTime: 30_000,
  });

  const selectedProject = useMemo(
    () => (projectsQuery.data ?? []).find((item) => item.id === form.projectId) ?? null,
    [form.projectId, projectsQuery.data],
  );
  const selectedQuotation = useMemo(
    () => (quotationsQuery.data ?? []).find((item) => item.id === form.quotationId) ?? null,
    [form.quotationId, quotationsQuery.data],
  );
  const selectedInstallation = useMemo(
    () => (installationsQuery.data ?? []).find((item) => item.id === form.installationId) ?? null,
    [form.installationId, installationsQuery.data],
  );
  const selectedWarranty = useMemo(
    () => (warrantiesQuery.data?.data ?? []).find((item) => item.id === form.warrantyId) ?? null,
    [form.warrantyId, warrantiesQuery.data?.data],
  );

  useEffect(() => {
    if (selectedProject && selectedProject.client.id !== form.clientId) {
      // Selection changes hydrate related fields after the user chooses a project.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((current) => ({
        ...current,
        clientId: selectedProject.client.id,
      }));
    }
  }, [form.clientId, selectedProject]);

  useEffect(() => {
    if (!selectedQuotation) {
      return;
    }

    // Selection changes hydrate related fields after the user chooses a quotation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((current) => ({
      ...current,
      clientId: current.clientId || selectedQuotation.client.id,
      projectId: current.projectId || selectedQuotation.project?.id || "",
    }));
  }, [selectedQuotation]);

  useEffect(() => {
    if (!selectedInstallation) {
      return;
    }

    // Selection changes hydrate related fields after the user chooses an installation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((current) => ({
      ...current,
      clientId: current.clientId || selectedInstallation.client.id,
      projectId: current.projectId || selectedInstallation.project?.id || "",
      quotationId: current.quotationId || selectedInstallation.quotation?.id || "",
    }));
  }, [selectedInstallation]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clientId: form.clientId || null,
        commitmentDate: form.commitmentDate || null,
        description: form.description.trim(),
        installationId: form.installationId || null,
        internalNotes: form.internalNotes.trim() || null,
        outsideWarranty: form.outsideWarranty,
        priority: form.priority,
        projectId: form.projectId || null,
        proposedSolution: form.proposedSolution.trim() || null,
        quotationId: form.quotationId || null,
        reportedAt: form.reportedAt,
        responsibleId: form.responsibleId || null,
        type: form.type,
        warrantyId: form.outsideWarranty ? null : form.warrantyId || null,
      };

      if (source === "instalacion" && form.installationId) {
        return postventaService.createCaseFromInstallation(form.installationId, payload);
      }

      if (source === "proyecto" && form.projectId) {
        return postventaService.createCaseFromProject(form.projectId, payload);
      }

      if (source === "cliente" && form.clientId) {
        return postventaService.createCaseFromClient(form.clientId, payload);
      }

      return postventaService.createCase(payload);
    },
    onSuccess: (createdCase) => {
      router.push(POSTVENTA_ROUTES.detalle(createdCase.id));
    },
  });

  if (!canCreate) {
    return (
      <ErrorState
        description="Tu perfil no tiene permiso para registrar casos postventa."
        title="Sin permiso para crear"
      />
    );
  }

  if (clientsQuery.isPending || projectsQuery.isPending || usersQuery.isPending) {
    return <LoadingState title="Preparando formulario de postventa" />;
  }

  if (clientsQuery.isError || projectsQuery.isError || usersQuery.isError) {
    return (
      <ErrorState
        description={
          clientsQuery.error?.message ??
          projectsQuery.error?.message ??
          usersQuery.error?.message ??
          "No se pudo preparar el formulario."
        }
        title="No se pudo abrir el registro de caso"
      />
    );
  }

  const activeWarranties = warrantiesQuery.data?.data ?? [];
  const warrantyBadge = selectedWarranty
    ? getWarrantyStatusBadge(selectedWarranty.status)
    : null;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <Link className={secondaryButtonClassName} href={POSTVENTA_ROUTES.listado}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a postventa
          </Link>
        }
        description="Registra el reclamo, valida garantia vigente, asigna responsable y conecta el caso con cliente, proyecto, cotizacion e instalacion."
        eyebrow="Nuevo caso"
        title="Registrar caso postventa"
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            Origen {source}
          </span>
          {selectedProject ? (
            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              Proyecto {selectedProject.code}
            </span>
          ) : null}
          {selectedInstallation ? (
            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              Instalacion {selectedInstallation.code}
            </span>
          ) : null}
          {selectedQuotation ? (
            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              Cotizacion {selectedQuotation.code}
            </span>
          ) : null}
        </div>
      </section>

      <form
        className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitError(null);

          try {
            await createMutation.mutateAsync();
          } catch (error) {
            setSubmitError(getApiErrorMessage(error));
          }
        }}
      >
        <section className={sectionClassName}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Contexto
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Asociaciones operativas
            </h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              className={fieldClassName}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  clientId: event.target.value,
                  installationId: "",
                  projectId: "",
                  quotationId: "",
                  warrantyId: "",
                }));
              }}
              value={form.clientId}
            >
              <option value="">Selecciona un cliente</option>
              {(clientsQuery.data ?? []).map((client) => (
                <option key={client.id} value={client.id}>
                  {client.displayName}
                </option>
              ))}
            </select>

            <select
              className={fieldClassName}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  installationId: "",
                  projectId: event.target.value,
                  quotationId: "",
                  warrantyId: "",
                }));
              }}
              value={form.projectId}
            >
              <option value="">Proyecto asociado</option>
              {(projectsQuery.data ?? []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.title}
                </option>
              ))}
            </select>

            <select
              className={fieldClassName}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  quotationId: event.target.value,
                }));
              }}
              value={form.quotationId}
            >
              <option value="">Cotizacion asociada</option>
              {(quotationsQuery.data ?? []).map((quotation) => (
                <option key={quotation.id} value={quotation.id}>
                  {quotation.code} · {quotation.status}
                </option>
              ))}
            </select>

            <select
              className={fieldClassName}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  installationId: event.target.value,
                }));
              }}
              value={form.installationId}
            >
              <option value="">Instalacion asociada</option>
              {(installationsQuery.data ?? []).map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.code} · {installation.status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Clasificacion
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as typeof current.type,
                  }));
                }}
                value={form.type}
              >
                {POSTVENTA_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                className={fieldClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as typeof current.priority,
                  }));
                }}
                value={form.priority}
              >
                {POSTVENTA_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <input
                className={fieldClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    reportedAt: event.target.value,
                  }));
                }}
                type="date"
                value={form.reportedAt}
              />

              <input
                className={fieldClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    commitmentDate: event.target.value,
                  }));
                }}
                type="date"
                value={form.commitmentDate}
              />

              <select
                className={fieldClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    responsibleId: event.target.value,
                  }));
                }}
                value={form.responsibleId}
              >
                <option value="">Responsable del caso</option>
                {(usersQuery.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Descripcion y cierre esperado
            </p>
            <div className="mt-4 space-y-3">
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }));
                }}
                placeholder="Describe el problema reportado por el cliente, el daño observado o la incidencia detectada."
                required
                value={form.description}
              />
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    proposedSolution: event.target.value,
                  }));
                }}
                placeholder="Solucion propuesta o primera hipotesis tecnica"
                value={form.proposedSolution}
              />
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    internalNotes: event.target.value,
                  }));
                }}
                placeholder="Notas internas para coordinacion, observaciones o contexto operativo"
                value={form.internalNotes}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6">
          <section className={sectionClassName}>
            <div className="flex items-center gap-3">
              {selectedWarranty && !form.outsideWarranty ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                  Garantia aplicable
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Validacion de cobertura
                </h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                <input
                  checked={form.outsideWarranty}
                  onChange={(event) => {
                    setForm((current) => ({
                      ...current,
                      outsideWarranty: event.target.checked,
                      warrantyId: event.target.checked ? "" : current.warrantyId,
                    }));
                  }}
                  type="checkbox"
                />
                Marcar caso fuera de garantia
              </label>

              <select
                className={fieldClassName}
                disabled={form.outsideWarranty}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    outsideWarranty: false,
                    warrantyId: event.target.value,
                  }));
                }}
                value={form.warrantyId}
              >
                <option value="">Sin garantia vinculada</option>
                {activeWarranties.map((warranty) => (
                  <option key={warranty.id} value={warranty.id}>
                    {warranty.productType} · vence {formatPostventaDate(warranty.endDate)}
                  </option>
                ))}
              </select>

              {selectedWarranty && !form.outsideWarranty ? (
                <article className="rounded-md border border-stone-200 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-stone-950">
                      {selectedWarranty.productType}
                    </p>
                    {warrantyBadge ? (
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${warrantyBadge.className}`}
                      >
                        {warrantyBadge.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-stone-600">
                    Vigencia {formatPostventaDate(selectedWarranty.startDate)} al{" "}
                    {formatPostventaDate(selectedWarranty.endDate)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-700">
                    {selectedWarranty.conditions || "Sin condiciones adicionales registradas."}
                  </p>
                </article>
              ) : activeWarranties.length === 0 ? (
                <EmptyState
                  description="No se encontro una garantia vigente para la combinacion de cliente y proyecto actual. Puedes marcar el caso fuera de garantia."
                  title="Sin garantia vigente"
                />
              ) : (
                <article className="rounded-md border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  Selecciona la garantia vigente que aplica al caso o marca el caso fuera
                  de garantia si corresponde.
                </article>
              )}
            </div>
          </section>

          <section className={sectionClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Confirmacion
            </p>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <p>
                Cliente: {selectedProject?.client.displayName || selectedInstallation?.client.displayName || "Sin definir"}
              </p>
              <p>
                Proyecto: {selectedProject?.title || selectedInstallation?.project?.title || "Sin definir"}
              </p>
              <p>
                Cotizacion: {selectedQuotation?.code || selectedInstallation?.quotation?.code || "Sin definir"}
              </p>
              <p>
                Instalacion: {selectedInstallation?.code || "Sin definir"}
              </p>
            </div>

            {submitError ? (
              <p className="mt-4 text-sm text-rose-700">{submitError}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={primaryButtonClassName}
                disabled={createMutation.isPending}
                type="submit"
              >
                Crear caso postventa
              </button>
              <Link className={secondaryButtonClassName} href={POSTVENTA_ROUTES.listado}>
                Cancelar
              </Link>
            </div>
          </section>
        </section>
      </form>
    </main>
  );
}
