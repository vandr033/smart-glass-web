"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  FolderKanban,
  HardHat,
  Paperclip,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  PortalActionButton,
  PortalField,
  PortalInput,
  PortalNotice,
  PortalPageHeader,
  PortalPanel,
  PortalSelect,
  PortalStat,
  PortalStatusPill,
  PortalTextarea,
} from "@/modules/client-portal/portal-components";
import {
  abrirArchivoPortal,
  descargarCotizacionPortal,
  descargarDocumentoPortal,
  descargarGarantiaPortal,
  descargarReporteInstalacionPortal,
} from "@/modules/client-portal/downloads";
import { usePortalSession } from "@/modules/client-portal/portal-shell";
import {
  ACTIVIDAD_POSTVENTA_STATUS_LABELS,
  ACTIVIDAD_POSTVENTA_TIPO_LABELS,
  COTIZACION_STATUS_LABELS,
  GARANTIA_STATUS_LABELS,
  getLabel,
  getPortalTone,
  INCIDENCIA_INSTALACION_SEVERIDAD_LABELS,
  INCIDENCIA_INSTALACION_STATUS_LABELS,
  INCIDENCIA_INSTALACION_TIPO_LABELS,
  INSTALACION_STATUS_LABELS,
  MEDICION_STATUS_LABELS,
  PORTAL_DOCUMENTO_LABELS,
  PORTAL_REMITENTE_LABELS,
  POSTVENTA_STATUS_LABELS,
  PRIORIDAD_LABELS,
  PROYECTO_STATUS_LABELS,
  PROYECTO_TIPO_LABELS,
  TAREA_INSTALACION_STATUS_LABELS,
  TIPO_EVIDENCIA_LABELS,
  TIPO_POSTVENTA_LABELS,
  formatPortalCurrency,
  formatPortalDate,
  formatPortalDateTime,
} from "@/modules/client-portal/ui";
import { clientPortalService } from "@/services/client-portal-service";

const portalQueryKeys = {
  cotizacion: (quotationId: string) =>
    ["portal-cliente", "cotizaciones", quotationId] as const,
  cotizaciones: ["portal-cliente", "cotizaciones"] as const,
  documentos: ["portal-cliente", "documentos"] as const,
  garantias: ["portal-cliente", "garantias"] as const,
  instalaciones: ["portal-cliente", "instalaciones"] as const,
  instalacion: (orderId: string) =>
    ["portal-cliente", "instalaciones", orderId] as const,
  mensajes: (projectId: string) =>
    ["portal-cliente", "mensajes", projectId] as const,
  postventa: ["portal-cliente", "postventa"] as const,
  postventaCaso: (caseId: string) =>
    ["portal-cliente", "postventa", caseId] as const,
  proyecto: (projectId: string) =>
    ["portal-cliente", "proyectos", projectId] as const,
  proyectos: ["portal-cliente", "proyectos"] as const,
  resumen: ["portal-cliente", "resumen"] as const,
};

const primaryGridClassName = "grid gap-4 md:grid-cols-2 xl:grid-cols-3";

const todayValue = new Date().toISOString().slice(0, 10);

const formatDimension = (value: number | null | undefined): string =>
  value ? `${value} mm` : "Sin dato";

const projectLabel = (project: { code: string; title: string } | null | undefined) =>
  project ? `${project.code} · ${project.title}` : "Sin proyecto asociado";

const fileLabel = (value: number | null): string => {
  if (!value) {
    return "Sin tamano disponible";
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 1024)} KB`;
  }

  return `${value} B`;
};

function PortalSectionList({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <PortalPanel title={title}>
      <div className="space-y-3">{children}</div>
    </PortalPanel>
  );
}

function PortalRecord({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <article className="rounded-[1.25rem] border border-[#e6ddd2] bg-[#fffdfa] p-4">
      {children}
    </article>
  );
}

function PortalLoading({ title }: { title: string }) {
  return <LoadingState cards={4} title={title} />;
}

function PortalError({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return <ErrorState description={description} title={title} />;
}

function PortalDocumentButton({
  documentId,
  label = "Descargar",
}: {
  documentId: string;
  label?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      await descargarDocumentoPortal(documentId);
    },
    onError: (downloadError) => {
      setError(downloadError.message);
    },
    onSuccess: () => {
      setError(null);
    },
  });

  return (
    <div className="space-y-2">
      <PortalActionButton
        onClick={() => mutation.mutate()}
        tone="secundario"
      >
        {mutation.isPending ? "Preparando..." : label}
      </PortalActionButton>
      {error ? <p className="text-sm text-[#b6452c]">{error}</p> : null}
    </div>
  );
}

export function PortalDashboardPage() {
  const summaryQuery = useQuery({
    queryFn: clientPortalService.getDashboard,
    queryKey: portalQueryKeys.resumen,
  });

  if (summaryQuery.isPending) {
    return <PortalLoading title="Cargando resumen del portal" />;
  }

  if (summaryQuery.isError) {
    return (
      <PortalError
        description={summaryQuery.error.message}
        title="No se pudo abrir el portal"
      />
    );
  }

  const summary = summaryQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description={`Hola ${summary.cliente.displayName}. Aqui puedes revisar tus cotizaciones, proyectos, instalaciones, garantias, soporte y documentos compartidos.`}
        eyebrow="Vista general"
        title="Portal del Cliente"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PortalStat
          description="Cotizaciones comerciales pendientes de tu decision o revision."
          href="/portal-cliente/cotizaciones"
          label="Cotizaciones pendientes"
          value={summary.contadores.cotizacionesPendientes}
        />
        <PortalStat
          description="Proyectos que siguen avanzando dentro del flujo operativo."
          href="/portal-cliente/proyectos"
          label="Proyectos activos"
          value={summary.contadores.proyectosActivos}
        />
        <PortalStat
          description="Instalaciones proximas ya programadas para este cliente."
          href="/portal-cliente/instalaciones"
          label="Instalaciones proximas"
          value={summary.contadores.instalacionesProximas}
        />
        <PortalStat
          description="Documentos listos para consulta o descarga en el portal."
          href="/portal-cliente/documentos"
          label="Documentos disponibles"
          value={summary.contadores.documentosDisponibles}
        />
        <PortalStat
          description="Garantias vigentes visibles desde tu acceso externo."
          href="/portal-cliente/garantias"
          label="Garantias vigentes"
          value={summary.contadores.garantiasVigentes}
        />
        <PortalStat
          description="Casos postventa que siguen en atencion con el equipo."
          href="/portal-cliente/postventa"
          label="Casos postventa abiertos"
          value={summary.contadores.casosPostventaAbiertos}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PortalSectionList title="Proximas instalaciones">
          {summary.instalacionesProximas.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay instalaciones programadas por ahora.
            </p>
          ) : (
            summary.instalacionesProximas.map((installation) => (
              <PortalRecord key={installation.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#302016]">
                        {installation.code}
                      </p>
                      <PortalStatusPill tone={getPortalTone(installation.status)}>
                        {getLabel(INSTALACION_STATUS_LABELS, installation.status)}
                      </PortalStatusPill>
                    </div>
                    <p className="text-sm text-[#6f6256]">
                      {projectLabel(installation.project)}
                    </p>
                    <p className="text-sm text-[#6f6256]">
                      {formatPortalDate(installation.scheduledDate)} ·{" "}
                      {installation.scheduledStartTime ?? "Por definir"} -{" "}
                      {installation.scheduledEndTime ?? "Por definir"}
                    </p>
                    <p className="text-sm text-[#6f6256]">
                      {installation.address?.address ?? "Direccion pendiente de confirmar"}
                    </p>
                  </div>
                  <PortalActionButton
                    href={`/portal-cliente/instalaciones/${installation.id}`}
                    tone="secundario"
                  >
                    Ver detalle
                  </PortalActionButton>
                </div>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>

        <div className="space-y-6">
          <PortalSectionList title="Cotizaciones recientes">
            {summary.resumenCotizaciones.length === 0 ? (
              <p className="text-sm leading-6 text-[#6f6256]">
                Todavia no hay cotizaciones visibles para este acceso.
              </p>
            ) : (
              summary.resumenCotizaciones.map((quotation) => (
                <PortalRecord key={quotation.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#302016]">{quotation.code}</p>
                      <p className="mt-1 text-sm text-[#6f6256]">
                        {formatPortalCurrency(quotation.totalSale, quotation.currency)}
                      </p>
                    </div>
                    <PortalStatusPill tone={getPortalTone(quotation.status)}>
                      {getLabel(COTIZACION_STATUS_LABELS, quotation.status)}
                    </PortalStatusPill>
                  </div>
                </PortalRecord>
              ))
            )}
          </PortalSectionList>

          <PortalSectionList title="Documentos recientes">
            {summary.resumenDocumentos.length === 0 ? (
              <p className="text-sm leading-6 text-[#6f6256]">
                No hay documentos visibles todavia.
              </p>
            ) : (
              summary.resumenDocumentos.map((document) => (
                <PortalRecord key={document.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[#302016]">{document.name}</p>
                      <p className="mt-1 text-sm text-[#6f6256]">
                        {getLabel(PORTAL_DOCUMENTO_LABELS, document.documentType)}
                      </p>
                    </div>
                    <PortalDocumentButton documentId={document.id} />
                  </div>
                </PortalRecord>
              ))
            )}
          </PortalSectionList>
        </div>
      </section>
    </main>
  );
}

export function PortalQuotationsPage() {
  const quotationsQuery = useQuery({
    queryFn: clientPortalService.listQuotations,
    queryKey: portalQueryKeys.cotizaciones,
  });

  if (quotationsQuery.isPending) {
    return <PortalLoading title="Cargando cotizaciones del cliente" />;
  }

  if (quotationsQuery.isError) {
    return (
      <PortalError
        description={quotationsQuery.error.message}
        title="No se pudieron cargar las cotizaciones"
      />
    );
  }

  const quotations = quotationsQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Consulta el estado de aprobacion, el total comercial y descarga la version PDF compartida de cada cotizacion."
        eyebrow="Comercial"
        title="Cotizaciones"
      />

      {quotations.length === 0 ? (
        <EmptyState
          description="Aun no existen cotizaciones visibles para este acceso."
          icon={ReceiptText}
          title="Sin cotizaciones"
        />
      ) : (
        <section className={primaryGridClassName}>
          {quotations.map((quotation) => (
            <PortalPanel key={quotation.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
                      {quotation.code}
                    </p>
                    <h2 className="mt-2 font-[family:var(--font-display)] text-[1.45rem] font-semibold uppercase tracking-[0.04em] text-[#302016]">
                      {projectLabel(quotation.project)}
                    </h2>
                  </div>
                  <PortalStatusPill tone={getPortalTone(quotation.status)}>
                    {getLabel(COTIZACION_STATUS_LABELS, quotation.status)}
                  </PortalStatusPill>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PortalField label="Total comercial">
                    {formatPortalCurrency(quotation.totalSale, quotation.currency)}
                  </PortalField>
                  <PortalField label="Vigencia">
                    {formatPortalDate(quotation.validUntil)}
                  </PortalField>
                </div>

                <div className="flex flex-wrap gap-3">
                  <PortalActionButton
                    href={`/portal-cliente/cotizaciones/${quotation.id}`}
                  >
                    Ver cotizacion
                  </PortalActionButton>
                  <PortalActionButton
                    onClick={() => void descargarCotizacionPortal(quotation.id)}
                    tone="secundario"
                  >
                    Descargar PDF
                  </PortalActionButton>
                </div>
              </div>
            </PortalPanel>
          ))}
        </section>
      )}
    </main>
  );
}

export function PortalQuotationDetailPage({
  quotationId,
}: {
  quotationId: string;
}) {
  const queryClient = useQueryClient();
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const quotationQuery = useQuery({
    queryFn: () => clientPortalService.getQuotation(quotationId),
    queryKey: portalQueryKeys.cotizacion(quotationId),
  });

  const decisionMutation = useMutation({
    mutationFn: async (values: {
      decision: "ACEPTAR" | "RECHAZAR";
      motivo: string | null;
    }) =>
      clientPortalService.decideQuotation(quotation.id, values),
    onSuccess: async () => {
      setDecisionError(null);
      setMotivo("");
      await queryClient.invalidateQueries({
        queryKey: ["portal-cliente"],
      });
    },
    onError: (error) => {
      setDecisionError(error.message);
    },
  });

  if (quotationQuery.isPending) {
    return <PortalLoading title="Cargando detalle de la cotizacion" />;
  }

  if (quotationQuery.isError) {
    return (
      <PortalError
        description={quotationQuery.error.message}
        title="No se pudo abrir la cotizacion"
      />
    );
  }

  const quotation = quotationQuery.data;
  const canDecide = ["APPROVED", "SENT"].includes(quotation.status);

  return (
    <main className="space-y-6">
      <PortalPageHeader
        actions={
          <PortalActionButton
            onClick={() => void descargarCotizacionPortal(quotation.id)}
            tone="secundario"
          >
            Descargar PDF comercial
          </PortalActionButton>
        }
        description="Vista comercial compartida con el cliente. Este resumen no expone costos internos, margenes, desperdicio ni comparativos de proveedores."
        eyebrow={quotation.code}
        title="Detalle de cotizacion"
      />

      <PortalPanel>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <PortalStatusPill tone={getPortalTone(quotation.status)}>
                {getLabel(COTIZACION_STATUS_LABELS, quotation.status)}
              </PortalStatusPill>
              <span className="text-sm text-[#6f6256]">
                Emitida el {formatPortalDate(quotation.createdAt)}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PortalField label="Cliente">{quotation.client.displayName}</PortalField>
              <PortalField label="Proyecto">{projectLabel(quotation.project)}</PortalField>
              <PortalField label="Vigencia">
                {formatPortalDate(quotation.validUntil)}
              </PortalField>
              <PortalField label="Total comercial">
                {formatPortalCurrency(quotation.totalSale, quotation.currency)}
              </PortalField>
            </div>
            {quotation.notes ? (
              <PortalField label="Observaciones visibles">{quotation.notes}</PortalField>
            ) : null}
          </div>

          <PortalPanel className="bg-[#fff9f0]" title="Decision del cliente">
            {decisionError ? <PortalNotice tone="error">{decisionError}</PortalNotice> : null}
            {!canDecide ? (
              <PortalNotice tone="info">
                Esta cotizacion ya no admite una nueva decision desde el portal.
              </PortalNotice>
            ) : (
              <div className="space-y-4">
                <PortalTextarea
                  label="Motivo opcional o comentario"
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Puedes agregar un comentario para el equipo."
                  value={motivo}
                />
                <div className="flex flex-wrap gap-3">
                  <PortalActionButton
                    onClick={() =>
                      decisionMutation.mutate({
                        decision: "ACEPTAR",
                        motivo: motivo.trim() || null,
                      })
                    }
                  >
                    Aceptar cotizacion
                  </PortalActionButton>
                  <PortalActionButton
                    onClick={() =>
                      decisionMutation.mutate({
                        decision: "RECHAZAR",
                        motivo: motivo.trim() || null,
                      })
                    }
                    tone="secundario"
                  >
                    Rechazar cotizacion
                  </PortalActionButton>
                </div>
              </div>
            )}
          </PortalPanel>
        </div>
      </PortalPanel>

      <PortalSectionList title="Items comerciales">
        {quotation.items.map((item) => (
          <PortalRecord key={item.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-[#302016]">{item.name}</p>
                <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                  {item.description ?? "Sin descripcion adicional."}
                </p>
              </div>
              <div className="text-right text-sm text-[#6f6256]">
                <p>Cantidad: {item.quantity}</p>
                <p className="mt-1 font-semibold text-[#302016]">
                  {formatPortalCurrency(item.subtotalSale, quotation.currency)}
                </p>
              </div>
            </div>
          </PortalRecord>
        ))}
      </PortalSectionList>

      <PortalSectionList title="Historial de estados">
        {quotation.statusHistory.map((item) => (
          <PortalRecord key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#302016]">
                  {getLabel(COTIZACION_STATUS_LABELS, item.toStatus)}
                </p>
                <p className="mt-1 text-sm text-[#6f6256]">
                  {formatPortalDateTime(item.createdAt)}
                </p>
              </div>
              {item.notes ? (
                <p className="max-w-xl text-sm leading-6 text-[#6f6256]">
                  {item.notes}
                </p>
              ) : null}
            </div>
          </PortalRecord>
        ))}
      </PortalSectionList>
    </main>
  );
}

export function PortalProjectsPage() {
  const projectsQuery = useQuery({
    queryFn: clientPortalService.listProjects,
    queryKey: portalQueryKeys.proyectos,
  });

  if (projectsQuery.isPending) {
    return <PortalLoading title="Cargando proyectos del cliente" />;
  }

  if (projectsQuery.isError) {
    return (
      <PortalError
        description={projectsQuery.error.message}
        title="No se pudieron cargar los proyectos"
      />
    );
  }

  const projects = projectsQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Monitorea el estado general del proyecto, las fechas clave, las mediciones aprobadas visibles y las instalaciones relacionadas."
        eyebrow="Seguimiento"
        title="Proyectos"
      />

      {projects.length === 0 ? (
        <EmptyState
          description="Todavia no hay proyectos habilitados para este acceso."
          icon={FolderKanban}
          title="Sin proyectos"
        />
      ) : (
        <section className={primaryGridClassName}>
          {projects.map((project) => (
            <PortalPanel key={project.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
                      {project.code}
                    </p>
                    <h2 className="mt-2 font-[family:var(--font-display)] text-[1.4rem] font-semibold uppercase tracking-[0.04em] text-[#302016]">
                      {project.title}
                    </h2>
                  </div>
                  <PortalStatusPill tone={getPortalTone(project.status)}>
                    {getLabel(PROYECTO_STATUS_LABELS, project.status)}
                  </PortalStatusPill>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-[#6f6256]">
                    <span>Avance general</span>
                    <span>{project.avanceGeneral}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#eee4d7]">
                    <div
                      className="h-2 rounded-full bg-[#0f5bd7]"
                      style={{ width: `${project.avanceGeneral}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PortalField label="Tipo">
                    {getLabel(PROYECTO_TIPO_LABELS, project.projectType)}
                  </PortalField>
                  <PortalField label="Prioridad">
                    {getLabel(PRIORIDAD_LABELS, project.priority)}
                  </PortalField>
                  <PortalField label="Medicion prevista">
                    {formatPortalDate(project.expectedMeasurementDate)}
                  </PortalField>
                  <PortalField label="Instalacion prevista">
                    {formatPortalDate(project.expectedInstallationDate)}
                  </PortalField>
                </div>

                <PortalActionButton href={`/portal-cliente/proyectos/${project.id}`}>
                  Ver proyecto
                </PortalActionButton>
              </div>
            </PortalPanel>
          ))}
        </section>
      )}
    </main>
  );
}

export function PortalProjectDetailPage({
  projectId,
}: {
  projectId: string;
}) {
  const projectQuery = useQuery({
    queryFn: () => clientPortalService.getProject(projectId),
    queryKey: portalQueryKeys.proyecto(projectId),
  });

  if (projectQuery.isPending) {
    return <PortalLoading title="Cargando detalle del proyecto" />;
  }

  if (projectQuery.isError) {
    return (
      <PortalError
        description={projectQuery.error.message}
        title="No se pudo abrir el proyecto"
      />
    );
  }

  const project = projectQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Resumen de estado, cronograma, mediciones aprobadas, instalaciones programadas y archivos visibles compartidos con el cliente."
        eyebrow={project.code}
        title={project.title}
      />

      <PortalPanel>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <PortalStatusPill tone={getPortalTone(project.status)}>
                {getLabel(PROYECTO_STATUS_LABELS, project.status)}
              </PortalStatusPill>
              <span className="text-sm text-[#6f6256]">
                Avance general: {project.avanceGeneral}%
              </span>
            </div>
            {project.description ? (
              <p className="text-sm leading-7 text-[#6f6256]">{project.description}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <PortalField label="Tipo">
                {getLabel(PROYECTO_TIPO_LABELS, project.projectType)}
              </PortalField>
              <PortalField label="Prioridad">
                {getLabel(PRIORIDAD_LABELS, project.priority)}
              </PortalField>
              <PortalField label="Direccion de obra">
                {project.siteAddress ?? "Sin direccion registrada"}
              </PortalField>
              <PortalField label="Entrega prevista">
                {formatPortalDate(project.expectedDeliveryDate)}
              </PortalField>
              <PortalField label="Medicion prevista">
                {formatPortalDate(project.expectedMeasurementDate)}
              </PortalField>
              <PortalField label="Instalacion prevista">
                {formatPortalDate(project.expectedInstallationDate)}
              </PortalField>
            </div>
          </div>

          <PortalSectionList title="Historial visible">
            {project.statusHistory.length === 0 ? (
              <p className="text-sm leading-6 text-[#6f6256]">
                No hay cambios registrados para mostrar.
              </p>
            ) : (
              project.statusHistory.map((item) => (
                <PortalRecord key={item.id}>
                  <p className="font-semibold text-[#302016]">
                    {getLabel(PROYECTO_STATUS_LABELS, item.toStatus)}
                  </p>
                  <p className="mt-1 text-sm text-[#6f6256]">
                    {formatPortalDateTime(item.createdAt)}
                  </p>
                  {item.reason ? (
                    <p className="mt-2 text-sm leading-6 text-[#6f6256]">{item.reason}</p>
                  ) : null}
                </PortalRecord>
              ))
            )}
          </PortalSectionList>
        </div>
      </PortalPanel>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PortalSectionList title="Instalaciones programadas">
          {project.installations.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay instalaciones registradas para este proyecto.
            </p>
          ) : (
            project.installations.map((installation) => (
              <PortalRecord key={installation.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#302016]">{installation.code}</p>
                    <p className="mt-1 text-sm text-[#6f6256]">
                      {formatPortalDate(installation.scheduledDate)}
                    </p>
                  </div>
                  <PortalActionButton
                    href={`/portal-cliente/instalaciones/${installation.id}`}
                    tone="secundario"
                  >
                    Ver instalacion
                  </PortalActionButton>
                </div>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>

        <PortalSectionList title="Documentos y adjuntos">
          {project.attachments.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay archivos visibles asociados a este proyecto.
            </p>
          ) : (
            project.attachments.map((attachment) => (
              <PortalRecord key={attachment.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#302016]">{attachment.fileName}</p>
                    <p className="mt-1 text-sm text-[#6f6256]">
                      {getLabel(PORTAL_DOCUMENTO_LABELS, attachment.attachmentType)}
                    </p>
                    {attachment.description ? (
                      <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                        {attachment.description}
                      </p>
                    ) : null}
                  </div>
                  <PortalActionButton
                    onClick={() => abrirArchivoPortal(attachment.fileUrl)}
                    tone="secundario"
                  >
                    Abrir archivo
                  </PortalActionButton>
                </div>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>
      </section>

      <PortalSectionList title="Mediciones aprobadas visibles">
        {project.approvedMeasurements.length === 0 ? (
          <p className="text-sm leading-6 text-[#6f6256]">
            Aun no existen solicitudes de medicion aprobadas para mostrar.
          </p>
        ) : (
          project.approvedMeasurements.map((request) => (
            <PortalRecord key={request.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#302016]">{request.code}</p>
                    <p className="mt-1 text-sm text-[#6f6256]">
                      Solicitada el {formatPortalDate(request.requestedDate)}
                    </p>
                  </div>
                  <PortalStatusPill tone={getPortalTone(request.status)}>
                    {getLabel(MEDICION_STATUS_LABELS, request.status)}
                  </PortalStatusPill>
                </div>

                {request.visits.map((visit) => (
                  <div
                    className="rounded-[1rem] border border-[#eee4d7] bg-white p-4"
                    key={visit.id}
                  >
                    <p className="text-sm font-semibold text-[#302016]">
                      Visita tecnica
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visit.openings.map((opening) => (
                        <div
                          className="rounded-[0.95rem] border border-[#eee4d7] p-3"
                          key={opening.id}
                        >
                          <p className="font-semibold text-[#302016]">{opening.code}</p>
                          <p className="mt-2 text-sm text-[#6f6256]">
                            Ambiente: {opening.environment}
                          </p>
                          <p className="text-sm text-[#6f6256]">
                            Tipo: {getLabel({}, opening.elementType)}
                          </p>
                          <p className="text-sm text-[#6f6256]">
                            Medidas: {formatDimension(opening.widthMm)} ×{" "}
                            {formatDimension(opening.heightMm)}
                          </p>
                        </div>
                      ))}
                    </div>
                    {visit.evidence.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {visit.evidence.map((evidence) => (
                          <PortalActionButton
                            key={evidence.id}
                            onClick={() => abrirArchivoPortal(evidence.fileUrl)}
                            tone="secundario"
                          >
                            Abrir {getLabel(TIPO_EVIDENCIA_LABELS, evidence.type)}
                          </PortalActionButton>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </PortalRecord>
          ))
        )}
      </PortalSectionList>
    </main>
  );
}

export function PortalInstallationsPage() {
  const installationsQuery = useQuery({
    queryFn: clientPortalService.listInstallations,
    queryKey: portalQueryKeys.instalaciones,
  });

  if (installationsQuery.isPending) {
    return <PortalLoading title="Cargando instalaciones del cliente" />;
  }

  if (installationsQuery.isError) {
    return (
      <PortalError
        description={installationsQuery.error.message}
        title="No se pudieron cargar las instalaciones"
      />
    );
  }

  const installations = installationsQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Revisa la fecha programada, rango horario, direccion, observaciones visibles y acceso al reporte cuando la instalacion este completada."
        eyebrow="Ejecucion"
        title="Instalaciones"
      />

      {installations.length === 0 ? (
        <EmptyState
          description="Aun no existen instalaciones visibles para este acceso."
          icon={HardHat}
          title="Sin instalaciones"
        />
      ) : (
        <section className={primaryGridClassName}>
          {installations.map((installation) => (
            <PortalPanel key={installation.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
                      {installation.code}
                    </p>
                    <h2 className="mt-2 font-[family:var(--font-display)] text-[1.4rem] font-semibold uppercase tracking-[0.04em] text-[#302016]">
                      {projectLabel(installation.project)}
                    </h2>
                  </div>
                  <PortalStatusPill tone={getPortalTone(installation.status)}>
                    {getLabel(INSTALACION_STATUS_LABELS, installation.status)}
                  </PortalStatusPill>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PortalField label="Fecha">
                    {formatPortalDate(installation.scheduledDate)}
                  </PortalField>
                  <PortalField label="Rango horario">
                    {installation.scheduledStartTime ?? "Por definir"} -{" "}
                    {installation.scheduledEndTime ?? "Por definir"}
                  </PortalField>
                  <PortalField label="Direccion">
                    {installation.address?.address ?? "Sin direccion registrada"}
                  </PortalField>
                  <PortalField label="Tipo">
                    {getLabel({}, installation.installationType)}
                  </PortalField>
                </div>
                <div className="flex flex-wrap gap-3">
                  <PortalActionButton
                    href={`/portal-cliente/instalaciones/${installation.id}`}
                  >
                    Ver detalle
                  </PortalActionButton>
                  {installation.status === "COMPLETED" ? (
                    <PortalActionButton
                      onClick={() =>
                        void descargarReporteInstalacionPortal(installation.id)
                      }
                      tone="secundario"
                    >
                      Descargar reporte
                    </PortalActionButton>
                  ) : null}
                </div>
              </div>
            </PortalPanel>
          ))}
        </section>
      )}
    </main>
  );
}

export function PortalInstallationDetailPage({
  orderId,
}: {
  orderId: string;
}) {
  const installationQuery = useQuery({
    queryFn: () => clientPortalService.getInstallation(orderId),
    queryKey: portalQueryKeys.instalacion(orderId),
  });

  if (installationQuery.isPending) {
    return <PortalLoading title="Cargando detalle de la instalacion" />;
  }

  if (installationQuery.isError) {
    return (
      <PortalError
        description={installationQuery.error.message}
        title="No se pudo abrir la instalacion"
      />
    );
  }

  const installation = installationQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        actions={
          installation.status === "COMPLETED" ? (
            <PortalActionButton
              onClick={() => void descargarReporteInstalacionPortal(installation.id)}
              tone="secundario"
            >
              Descargar reporte PDF
            </PortalActionButton>
          ) : undefined
        }
        description="Seguimiento del servicio programado con informacion visible para el cliente y evidencia compartida por el equipo."
        eyebrow={installation.code}
        title="Detalle de instalacion"
      />

      <PortalPanel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PortalField label="Estado">
            <PortalStatusPill tone={getPortalTone(installation.status)}>
              {getLabel(INSTALACION_STATUS_LABELS, installation.status)}
            </PortalStatusPill>
          </PortalField>
          <PortalField label="Proyecto">{projectLabel(installation.project)}</PortalField>
          <PortalField label="Fecha">
            {formatPortalDate(installation.scheduledDate)}
          </PortalField>
          <PortalField label="Horario">
            {installation.scheduledStartTime ?? "Por definir"} -{" "}
            {installation.scheduledEndTime ?? "Por definir"}
          </PortalField>
          <PortalField label="Direccion">
            {installation.address?.address ?? "Sin direccion registrada"}
          </PortalField>
          <PortalField label="Ciudad">
            {installation.address?.city ?? "Sin ciudad registrada"}
          </PortalField>
          <PortalField label="Tipo">
            {getLabel({}, installation.installationType)}
          </PortalField>
        </div>
        {installation.notes ? (
          <div className="mt-5">
            <PortalField label="Observaciones visibles">{installation.notes}</PortalField>
          </div>
        ) : null}
      </PortalPanel>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PortalSectionList title="Tareas">
          {installation.tasks.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay tareas visibles para esta instalacion.
            </p>
          ) : (
            installation.tasks.map((task) => (
              <PortalRecord key={task.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#302016]">{task.title}</p>
                    <p className="mt-1 text-sm text-[#6f6256]">
                      {task.description ?? "Sin descripcion adicional."}
                    </p>
                  </div>
                  <PortalStatusPill tone={getPortalTone(task.status)}>
                    {getLabel(TAREA_INSTALACION_STATUS_LABELS, task.status)}
                  </PortalStatusPill>
                </div>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>

        <PortalSectionList title="Incidencias visibles">
          {installation.issues.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay incidencias registradas para mostrar.
            </p>
          ) : (
            installation.issues.map((issue) => (
              <PortalRecord key={issue.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <PortalStatusPill tone={getPortalTone(issue.severity)}>
                    {getLabel(INCIDENCIA_INSTALACION_SEVERIDAD_LABELS, issue.severity)}
                  </PortalStatusPill>
                  <PortalStatusPill tone={getPortalTone(issue.status)}>
                    {getLabel(INCIDENCIA_INSTALACION_STATUS_LABELS, issue.status)}
                  </PortalStatusPill>
                </div>
                <p className="mt-3 font-semibold text-[#302016]">
                  {getLabel(INCIDENCIA_INSTALACION_TIPO_LABELS, issue.type)}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                  {issue.description}
                </p>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>
      </section>

      <PortalSectionList title="Evidencia compartida">
        {installation.evidence.length === 0 ? (
          <p className="text-sm leading-6 text-[#6f6256]">
            Aun no hay evidencia compartida para esta instalacion.
          </p>
        ) : (
          installation.evidence.map((evidence) => (
            <PortalRecord key={evidence.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[#302016]">{evidence.fileName}</p>
                  <p className="mt-1 text-sm text-[#6f6256]">
                    {getLabel(TIPO_EVIDENCIA_LABELS, evidence.type)} ·{" "}
                    {fileLabel(evidence.sizeBytes)}
                  </p>
                  {evidence.description ? (
                    <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                      {evidence.description}
                    </p>
                  ) : null}
                </div>
                <PortalActionButton
                  onClick={() => abrirArchivoPortal(evidence.fileUrl)}
                  tone="secundario"
                >
                  Abrir archivo
                </PortalActionButton>
              </div>
            </PortalRecord>
          ))
        )}
      </PortalSectionList>
    </main>
  );
}

export function PortalWarrantiesPage() {
  const warrantiesQuery = useQuery({
    queryFn: clientPortalService.listWarranties,
    queryKey: portalQueryKeys.garantias,
  });

  if (warrantiesQuery.isPending) {
    return <PortalLoading title="Cargando garantias vigentes" />;
  }

  if (warrantiesQuery.isError) {
    return (
      <PortalError
        description={warrantiesQuery.error.message}
        title="No se pudieron cargar las garantias"
      />
    );
  }

  const warranties = warrantiesQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Consulta las garantias vigentes, su periodo de cobertura y descarga el certificado compartido para cada una."
        eyebrow="Respaldo"
        title="Garantias"
      />

      {warranties.length === 0 ? (
        <EmptyState
          description="No hay garantias visibles para este acceso."
          icon={ShieldCheck}
          title="Sin garantias"
        />
      ) : (
        <section className={primaryGridClassName}>
          {warranties.map((warranty) => (
            <PortalPanel key={warranty.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-[family:var(--font-display)] text-[1.35rem] font-semibold uppercase tracking-[0.04em] text-[#302016]">
                    {warranty.productType}
                  </h2>
                  <PortalStatusPill tone={getPortalTone(warranty.status)}>
                    {getLabel(GARANTIA_STATUS_LABELS, warranty.status)}
                  </PortalStatusPill>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PortalField label="Proyecto">{projectLabel(warranty.project)}</PortalField>
                  <PortalField label="Inicio">
                    {formatPortalDate(warranty.startDate)}
                  </PortalField>
                  <PortalField label="Fin">
                    {formatPortalDate(warranty.endDate)}
                  </PortalField>
                  <PortalField label="Cobertura">
                    {warranty.estaVigente ? "Vigente" : "Finalizada"}
                  </PortalField>
                </div>
                {warranty.conditions ? (
                  <PortalField label="Condiciones">{warranty.conditions}</PortalField>
                ) : null}
                <PortalActionButton
                  onClick={() => void descargarGarantiaPortal(warranty.id)}
                  tone="secundario"
                >
                  Descargar certificado
                </PortalActionButton>
              </div>
            </PortalPanel>
          ))}
        </section>
      )}
    </main>
  );
}

export function PortalPostventaPage() {
  const session = usePortalSession();
  const queryClient = useQueryClient();
  const [createError, setCreateError] = useState<string | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    descripcion: "",
    installationId: "",
    prioridad: "MEDIA",
    projectId: session.projects[0]?.id ?? "",
    quotationId: "",
    reportedAt: todayValue,
    tipo: "RECLAMO",
    warrantyId: "",
  });

  const casesQuery = useQuery({
    queryFn: clientPortalService.listPostventaCases,
    queryKey: portalQueryKeys.postventa,
  });

  const installationsQuery = useQuery({
    queryFn: clientPortalService.listInstallations,
    queryKey: [...portalQueryKeys.instalaciones, "opciones"],
  });

  const quotationsQuery = useQuery({
    queryFn: clientPortalService.listQuotations,
    queryKey: [...portalQueryKeys.cotizaciones, "opciones"],
  });

  const warrantiesQuery = useQuery({
    queryFn: clientPortalService.listWarranties,
    queryKey: [...portalQueryKeys.garantias, "opciones"],
  });

  const createMutation = useMutation({
    mutationFn: () =>
      clientPortalService.createPostventaCase(
        {
          descripcion: form.descripcion,
          installationId: form.installationId || null,
          prioridad: form.prioridad as "ALTA" | "BAJA" | "CRITICA" | "MEDIA",
          projectId: form.projectId || null,
          quotationId: form.quotationId || null,
          reportedAt: form.reportedAt,
          tipo: form.tipo as
            | "AJUSTE"
            | "FUGA"
            | "GARANTIA"
            | "MALA_INSTALACION"
            | "OTRO"
            | "PRODUCTO_INCOMPLETO"
            | "RECLAMO"
            | "REPOSICION"
            | "ROTURA",
          warrantyId: form.warrantyId || null,
        },
        evidenceFile ?? undefined,
      ),
    onError: (error) => {
      setCreateError(error.message);
    },
    onSuccess: async () => {
      setCreateError(null);
      setEvidenceFile(null);
      setForm((current) => ({
        ...current,
        descripcion: "",
        installationId: "",
        quotationId: "",
        warrantyId: "",
      }));
      await queryClient.invalidateQueries({
        queryKey: ["portal-cliente"],
      });
    },
  });

  const filteredInstallations = useMemo(
    () =>
      (installationsQuery.data ?? []).filter(
        (item) => !form.projectId || item.project?.id === form.projectId,
      ),
    [form.projectId, installationsQuery.data],
  );
  const filteredQuotations = useMemo(
    () =>
      (quotationsQuery.data ?? []).filter(
        (item) => !form.projectId || item.project?.id === form.projectId,
      ),
    [form.projectId, quotationsQuery.data],
  );
  const filteredWarranties = useMemo(
    () =>
      (warrantiesQuery.data ?? []).filter(
        (item) => !form.projectId || item.project?.id === form.projectId,
      ),
    [form.projectId, warrantiesQuery.data],
  );

  if (casesQuery.isPending) {
    return <PortalLoading title="Cargando seguimiento postventa" />;
  }

  if (casesQuery.isError) {
    return (
      <PortalError
        description={casesQuery.error.message}
        title="No se pudo abrir postventa"
      />
    );
  }

  const cases = casesQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Consulta tus casos abiertos, su estado actual, evidencia compartida y registra nuevas solicitudes de soporte o garantia."
        eyebrow="Soporte"
        title="Postventa"
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PortalSectionList title="Casos registrados">
          {cases.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              Aun no hay casos postventa asociados a este acceso.
            </p>
          ) : (
            cases.map((item) => (
              <PortalRecord key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#302016]">{item.code}</p>
                      <PortalStatusPill tone={getPortalTone(item.status)}>
                        {getLabel(POSTVENTA_STATUS_LABELS, item.status)}
                      </PortalStatusPill>
                    </div>
                    <p className="text-sm text-[#6f6256]">
                      {getLabel(TIPO_POSTVENTA_LABELS, item.type)} · Prioridad{" "}
                      {getLabel(PRIORIDAD_LABELS, item.priority)}
                    </p>
                    <p className="text-sm leading-6 text-[#6f6256]">
                      {item.description}
                    </p>
                  </div>
                  <PortalActionButton
                    href={`/portal-cliente/postventa/${item.id}`}
                    tone="secundario"
                  >
                    Ver caso
                  </PortalActionButton>
                </div>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>

        <PortalPanel title="Nueva solicitud postventa">
          {createError ? <PortalNotice tone="error">{createError}</PortalNotice> : null}
          <div className="space-y-4">
            <PortalSelect
              label="Proyecto"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  installationId: "",
                  projectId: event.target.value,
                  quotationId: "",
                  warrantyId: "",
                }))
              }
              value={form.projectId}
            >
              <option value="">Sin proyecto especifico</option>
              {session.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.title}
                </option>
              ))}
            </PortalSelect>
            <div className="grid gap-4 sm:grid-cols-2">
              <PortalSelect
                label="Tipo de solicitud"
                onChange={(event) =>
                  setForm((current) => ({ ...current, tipo: event.target.value }))
                }
                value={form.tipo}
              >
                {[
                  "RECLAMO",
                  "GARANTIA",
                  "AJUSTE",
                  "ROTURA",
                  "FUGA",
                  "MALA_INSTALACION",
                  "PRODUCTO_INCOMPLETO",
                  "REPOSICION",
                  "OTRO",
                ].map((value) => (
                  <option key={value} value={value}>
                    {getLabel(TIPO_POSTVENTA_LABELS, value)}
                  </option>
                ))}
              </PortalSelect>
              <PortalSelect
                label="Prioridad"
                onChange={(event) =>
                  setForm((current) => ({ ...current, prioridad: event.target.value }))
                }
                value={form.prioridad}
              >
                {["BAJA", "MEDIA", "ALTA", "CRITICA"].map((value) => (
                  <option key={value} value={value}>
                    {getLabel(PRIORIDAD_LABELS, value)}
                  </option>
                ))}
              </PortalSelect>
            </div>
            <PortalInput
              label="Fecha del reporte"
              onChange={(event) =>
                setForm((current) => ({ ...current, reportedAt: event.target.value }))
              }
              type="date"
              value={form.reportedAt}
            />
            <PortalTextarea
              label="Descripcion"
              onChange={(event) =>
                setForm((current) => ({ ...current, descripcion: event.target.value }))
              }
              placeholder="Describe claramente la situacion observada."
              value={form.descripcion}
            />
            <PortalSelect
              label="Instalacion relacionada"
              onChange={(event) =>
                setForm((current) => ({ ...current, installationId: event.target.value }))
              }
              value={form.installationId}
            >
              <option value="">Sin instalacion seleccionada</option>
              {filteredInstallations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {formatPortalDate(item.scheduledDate)}
                </option>
              ))}
            </PortalSelect>
            <PortalSelect
              label="Cotizacion relacionada"
              onChange={(event) =>
                setForm((current) => ({ ...current, quotationId: event.target.value }))
              }
              value={form.quotationId}
            >
              <option value="">Sin cotizacion seleccionada</option>
              {filteredQuotations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {formatPortalCurrency(item.totalSale, item.currency)}
                </option>
              ))}
            </PortalSelect>
            <PortalSelect
              label="Garantia relacionada"
              onChange={(event) =>
                setForm((current) => ({ ...current, warrantyId: event.target.value }))
              }
              value={form.warrantyId}
            >
              <option value="">Sin garantia seleccionada</option>
              {filteredWarranties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productType} · {formatPortalDate(item.endDate)}
                </option>
              ))}
            </PortalSelect>

            <label className="block space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
                Evidencia adjunta
              </span>
              <input
                className="w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016]"
                onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            <PortalActionButton
              className="w-full"
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Registrando caso..." : "Crear solicitud"}
            </PortalActionButton>
          </div>
        </PortalPanel>
      </section>
    </main>
  );
}

export function PortalPostventaDetailPage({
  caseId,
}: {
  caseId: string;
}) {
  const caseQuery = useQuery({
    queryFn: () => clientPortalService.getPostventaCase(caseId),
    queryKey: portalQueryKeys.postventaCaso(caseId),
  });

  if (caseQuery.isPending) {
    return <PortalLoading title="Cargando detalle del caso postventa" />;
  }

  if (caseQuery.isError) {
    return (
      <PortalError
        description={caseQuery.error.message}
        title="No se pudo abrir el caso postventa"
      />
    );
  }

  const item = caseQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Detalle completo del caso con estado actual, evidencia, actividades registradas y resolucion visible para el cliente."
        eyebrow={item.code}
        title="Detalle postventa"
      />

      <PortalPanel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PortalField label="Estado">
            <PortalStatusPill tone={getPortalTone(item.status)}>
              {getLabel(POSTVENTA_STATUS_LABELS, item.status)}
            </PortalStatusPill>
          </PortalField>
          <PortalField label="Tipo">{getLabel(TIPO_POSTVENTA_LABELS, item.type)}</PortalField>
          <PortalField label="Prioridad">
            {getLabel(PRIORIDAD_LABELS, item.priority)}
          </PortalField>
          <PortalField label="Reporte">
            {formatPortalDate(item.reportedAt)}
          </PortalField>
          <PortalField label="Proyecto">{projectLabel(item.project)}</PortalField>
          <PortalField label="Compromiso">
            {formatPortalDate(item.commitmentDate)}
          </PortalField>
          <PortalField label="Instalacion">
            {item.installation ? item.installation.code : "Sin instalacion"}
          </PortalField>
          <PortalField label="Garantia">
            {item.warranty ? item.warranty.productType : "Sin garantia"}
          </PortalField>
        </div>
        <div className="mt-5 space-y-4">
          <PortalField label="Descripcion">{item.description}</PortalField>
          {item.proposedSolution ? (
            <PortalField label="Resolucion visible">{item.proposedSolution}</PortalField>
          ) : null}
        </div>
      </PortalPanel>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <PortalSectionList title="Actividades del caso">
          {item.activities.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              Todavia no hay actividades visibles para este caso.
            </p>
          ) : (
            item.activities.map((activity) => (
              <PortalRecord key={activity.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <PortalStatusPill tone={getPortalTone(activity.status)}>
                    {getLabel(ACTIVIDAD_POSTVENTA_STATUS_LABELS, activity.status)}
                  </PortalStatusPill>
                  <span className="text-sm font-semibold text-[#302016]">
                    {getLabel(ACTIVIDAD_POSTVENTA_TIPO_LABELS, activity.type)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#6f6256]">
                  {activity.description}
                </p>
                <p className="mt-2 text-sm text-[#6f6256]">
                  Creada: {formatPortalDateTime(activity.createdAt)}
                </p>
              </PortalRecord>
            ))
          )}
        </PortalSectionList>

        <PortalSectionList title="Historial visible">
          {item.statusHistory.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay cambios registrados para mostrar.
            </p>
          ) : (
            item.statusHistory.map((history) => (
              <PortalRecord key={history.id}>
                <p className="font-semibold text-[#302016]">
                  {getLabel(POSTVENTA_STATUS_LABELS, history.toStatus)}
                </p>
                <p className="mt-1 text-sm text-[#6f6256]">
                  {formatPortalDateTime(history.createdAt)}
                </p>
                {history.notes ? (
                  <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                    {history.notes}
                  </p>
                ) : null}
              </PortalRecord>
            ))
          )}
        </PortalSectionList>
      </section>

      <PortalSectionList title="Evidencia adjunta">
        {item.evidences.length === 0 ? (
          <p className="text-sm leading-6 text-[#6f6256]">
            No hay evidencia visible en este caso.
          </p>
        ) : (
          item.evidences.map((evidence) => (
            <PortalRecord key={evidence.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-[#302016]">{evidence.fileName}</p>
                  <p className="mt-1 text-sm text-[#6f6256]">
                    {fileLabel(evidence.sizeBytes)} ·{" "}
                    {formatPortalDateTime(evidence.uploadedAt)}
                  </p>
                  {evidence.description ? (
                    <p className="mt-2 text-sm leading-6 text-[#6f6256]">
                      {evidence.description}
                    </p>
                  ) : null}
                </div>
                <PortalActionButton
                  onClick={() => abrirArchivoPortal(evidence.fileUrl)}
                  tone="secundario"
                >
                  Abrir evidencia
                </PortalActionButton>
              </div>
            </PortalRecord>
          ))
        )}
      </PortalSectionList>
    </main>
  );
}

export function PortalDocumentsPage() {
  const documentsQuery = useQuery({
    queryFn: clientPortalService.listDocuments,
    queryKey: portalQueryKeys.documentos,
  });

  if (documentsQuery.isPending) {
    return <PortalLoading title="Cargando documentos compartidos" />;
  }

  if (documentsQuery.isError) {
    return (
      <PortalError
        description={documentsQuery.error.message}
        title="No se pudieron cargar los documentos"
      />
    );
  }

  const documents = documentsQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Descarga cotizaciones, contratos, planos, mediciones, reportes de instalacion, garantias y documentos adicionales visibles para el cliente."
        eyebrow="Biblioteca"
        title="Documentos"
      />

      {documents.length === 0 ? (
        <EmptyState
          description="No hay documentos compartidos para este acceso."
          icon={FileText}
          title="Sin documentos"
        />
      ) : (
        <section className="space-y-4">
          {documents.map((document) => (
            <PortalPanel key={document.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="font-semibold text-[#302016]">{document.name}</p>
                  <p className="text-sm text-[#6f6256]">
                    {getLabel(PORTAL_DOCUMENTO_LABELS, document.documentType)}
                  </p>
                  <p className="text-sm text-[#6f6256]">
                    {projectLabel(document.project)} · {formatPortalDate(document.createdAt)}
                  </p>
                </div>
                <PortalDocumentButton documentId={document.id} label="Descargar documento" />
              </div>
            </PortalPanel>
          ))}
        </section>
      )}
    </main>
  );
}

export function PortalMessagesPage() {
  const session = usePortalSession();
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState(session.projects[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesQuery = useQuery({
    queryFn: () => clientPortalService.listMessages(projectId || undefined),
    queryKey: portalQueryKeys.mensajes(projectId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      clientPortalService.createMessage(
        {
          mensaje: message,
          projectId,
        },
        attachment ?? undefined,
      ),
    onError: (error) => {
      setSendError(error.message);
    },
    onSuccess: async () => {
      setAttachment(null);
      setMessage("");
      setSendError(null);
      await queryClient.invalidateQueries({
        queryKey: ["portal-cliente", "mensajes"],
      });
    },
  });

  if (messagesQuery.isPending) {
    return <PortalLoading title="Cargando mensajes del portal" />;
  }

  if (messagesQuery.isError) {
    return (
      <PortalError
        description={messagesQuery.error.message}
        title="No se pudieron cargar los mensajes"
      />
    );
  }

  const messages = messagesQuery.data;

  return (
    <main className="space-y-6">
      <PortalPageHeader
        description="Conversacion por proyecto con archivos adjuntos y notificacion al equipo interno."
        eyebrow="Comunicacion"
        title="Mensajes"
      />

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <PortalPanel title="Nuevo mensaje">
          {sendError ? <PortalNotice tone="error">{sendError}</PortalNotice> : null}
          <div className="space-y-4">
            <PortalSelect
              label="Proyecto"
              onChange={(event) => setProjectId(event.target.value)}
              value={projectId}
            >
              {session.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.title}
                </option>
              ))}
            </PortalSelect>
            <PortalTextarea
              label="Mensaje"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribe tu consulta o comentario para el equipo."
              value={message}
            />
            <label className="block space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a5a1f]">
                Archivo adjunto
              </span>
              <input
                className="w-full rounded-[1rem] border border-[#ddd4c9] bg-[#fffdfa] px-4 py-3 text-sm text-[#302016]"
                onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <PortalActionButton
              className="w-full"
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Enviando mensaje..." : "Enviar mensaje"}
            </PortalActionButton>
          </div>
        </PortalPanel>

        <PortalSectionList title="Conversacion">
          {messages.length === 0 ? (
            <p className="text-sm leading-6 text-[#6f6256]">
              No hay mensajes para el filtro actual.
            </p>
          ) : (
            messages.map((item) => {
              const isClientMessage = item.sentBy === "CLIENTE";

              return (
                <div
                  className={`flex ${isClientMessage ? "justify-end" : "justify-start"}`}
                  key={item.id}
                >
                  <article
                    className={`max-w-2xl rounded-[1.3rem] border px-4 py-4 ${
                      isClientMessage
                        ? "border-[#cfe1ff] bg-[#edf4ff]"
                        : "border-[#e6ddd2] bg-[#fffdfa]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <PortalStatusPill tone={isClientMessage ? "pendiente" : "neutral"}>
                        {getLabel(PORTAL_REMITENTE_LABELS, item.sentBy)}
                      </PortalStatusPill>
                      <span className="text-sm text-[#6f6256]">
                        {projectLabel(item.project)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#302016]">{item.message}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#9a8876]">
                      {formatPortalDateTime(item.createdAt)}
                    </p>
                    {item.fileUrl ? (
                      <button
                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0f5bd7]"
                        onClick={() => abrirArchivoPortal(item.fileUrl)}
                        type="button"
                      >
                        <Paperclip className="h-4 w-4" />
                        {item.attachmentName ?? "Abrir archivo"}
                      </button>
                    ) : null}
                  </article>
                </div>
              );
            })
          )}
        </PortalSectionList>
      </section>
    </main>
  );
}
