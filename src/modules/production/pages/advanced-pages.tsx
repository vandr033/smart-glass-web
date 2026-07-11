"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Factory,
  LockKeyhole,
  ShieldCheck,
  Timer,
  Wrench,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import { productionService } from "@/services/production-service";
import { getApiErrorMessage } from "@/utils";

import { PRODUCTION_QUERY_KEYS, PRODUCTION_ROUTES } from "../constants";
import {
  formatProductionBlockType,
  formatProductionWorkCenter,
  getProductionTaskStatusBadge,
  getProductionWorkflowBadge,
} from "../ui";

const dateLabel = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-BO", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Sin programar";
const compactDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-BO", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Sin fecha";

function OperationHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <PageHeader
      actions={action}
      description={description}
      eyebrow={eyebrow}
      title={title}
    />
  );
}

export function ProductionPlanningPage() {
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Planificación"
        title="Planificación de producción"
        description="Programa órdenes con fecha, centro de trabajo y responsables. Cada cambio queda validado y auditado en el servidor."
        action={
          <Link
            className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
            href={PRODUCTION_ROUTES.board}
          >
            Ver tablero
          </Link>
        }
      />
      <div className="grid gap-3 md:grid-cols-3">
        <InfoPanel
          icon={CalendarDays}
          label="Fecha prometida"
          text="Ordena la cola por fecha requerida y prioridad."
        />
        <InfoPanel
          icon={Factory}
          label="Capacidad"
          text="Identifica sobrecarga antes de confirmar una programación."
        />
        <InfoPanel
          icon={ShieldCheck}
          label="Dependencias"
          text="Las transiciones inválidas son rechazadas en backend."
        />
      </div>
      <ProductionPlanningTable />
    </div>
  );
}

export function ProductionOrdersPage() {
  const query = useQuery({
    queryKey: ["production", "advanced-orders"],
    queryFn: () =>
      productionService.listJobs({
        page: 1,
        perPage: 100,
        sortBy: "plannedEndDate",
        sortDirection: "asc",
      }),
    staleTime: 30_000,
  });
  if (query.isPending)
    return <LoadingState title="Cargando órdenes de producción" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar las órdenes"
      />
    );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Órdenes"
        title="Órdenes de trabajo"
        description="Consulta la cola completa de órdenes existente y abre el detalle operativo para ejecutar acciones."
        action={
          <Link
            className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
            href={PRODUCTION_ROUTES.board}
          >
            Ver tablero
          </Link>
        }
      />
      <section className="overflow-x-auto border border-[color:var(--color-border)] bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#eef3f8] text-[10px] tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-3 py-3">Código</th>
              <th className="px-3 py-3">Proyecto</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Prioridad</th>
              <th className="px-3 py-3">Fecha requerida</th>
              <th className="px-3 py-3">Tareas</th>
              <th className="px-3 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {query.data.data.map((job) => (
              <tr key={job.id}>
                <td className="px-3 py-3">
                  <Link
                    className="font-bold text-[color:var(--color-primary)]"
                    href={PRODUCTION_ROUTES.jobDetail(job.id)}
                  >
                    {job.code}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-stone-700">
                  {job.project?.title ?? "Sin proyecto"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-sm px-1.5 py-1 text-[11px] ${getProductionWorkflowBadge(job.status === "READY" ? "READY_TO_START" : job.status === "IN_PROGRESS" ? "IN_PROGRESS" : job.status === "PAUSED" ? "PAUSED" : job.status === "COMPLETED" ? "COMPLETED" : job.status === "CANCELLED" ? "CANCELLED" : "PENDING_PLANNING").className}`}
                  >
                    {job.status === "READY"
                      ? "Lista para producción"
                      : job.status === "IN_PROGRESS"
                        ? "En proceso"
                        : job.status === "PAUSED"
                          ? "Pausada"
                          : job.status === "COMPLETED"
                            ? "Completada"
                            : job.status === "CANCELLED"
                              ? "Cancelada"
                              : "Pendiente de planificación"}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-stone-700">
                  {job.priority === "CRITICAL"
                    ? "Crítica"
                    : job.priority === "URGENT"
                      ? "Urgente"
                      : job.priority === "HIGH"
                        ? "Alta"
                        : job.priority === "LOW"
                          ? "Baja"
                          : "Normal"}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {compactDate(job.plannedEndDate)}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {job.completedTaskCount} / {job.taskCount}
                </td>
                <td className="px-3 py-3">
                  <Link
                    className="text-xs font-semibold text-[color:var(--color-primary)]"
                    href={PRODUCTION_ROUTES.jobDetail(job.id)}
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.data.data.length ? (
          <EmptyState
            description="Las órdenes creadas desde cotizaciones, planes de corte o manualmente aparecerán aquí."
            title="No hay órdenes registradas"
          />
        ) : null}
      </section>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof CalendarDays;
  label: string;
  text: string;
}) {
  return (
    <div className="border border-[color:var(--color-border)] bg-white p-4">
      <Icon className="text-[color:var(--color-primary)]" size={18} />
      <p className="mt-3 text-sm font-bold text-stone-950">{label}</p>
      <p className="mt-1 text-xs leading-5 text-stone-500">{text}</p>
    </div>
  );
}

function ProductionPlanningTable() {
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.board({ planning: true }),
    queryFn: () => productionService.getBoard(),
    staleTime: 30_000,
  });
  if (query.isPending)
    return <LoadingState title="Cargando órdenes para planificar" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar la planificación"
      />
    );
  const jobs = query.data.columns
    .flatMap((column) => column.jobs)
    .filter((job) => !["COMPLETED", "CANCELLED"].includes(job.workflowStatus));
  return (
    <section className="overflow-hidden border border-[color:var(--color-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#eef3f8] text-[10px] tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-3 py-3">Orden</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Fecha requerida</th>
              <th className="px-3 py-3">Centro</th>
              <th className="px-3 py-3">Responsable</th>
              <th className="px-3 py-3">Avance</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-3 py-3">
                  <Link
                    className="font-bold text-[color:var(--color-primary)]"
                    href={PRODUCTION_ROUTES.jobDetail(job.id)}
                  >
                    {job.code}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {job.project?.title ?? "Sin proyecto"}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-sm px-1.5 py-1 text-[11px] ${getProductionWorkflowBadge(job.workflowStatus).className}`}
                  >
                    {getProductionWorkflowBadge(job.workflowStatus).label}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {compactDate(job.plannedEndDate)}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {job.currentWorkCenter?.name ?? "Sin asignar"}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {job.assignedToUser?.name ?? "Sin asignar"}
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-stone-700">
                  {job.progressPercent}%
                </td>
                <td className="px-3 py-3">
                  <Link
                    className="text-xs font-semibold text-[color:var(--color-primary)]"
                    href={PRODUCTION_ROUTES.jobDetail(job.id)}
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!jobs.length ? (
        <EmptyState
          description="Las órdenes pendientes aparecerán aquí cuando existan registros operativos."
          title="No hay órdenes para planificar"
        />
      ) : null}
    </section>
  );
}

export function ProductionCalendarPage() {
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.calendar({}),
    queryFn: () => productionService.getCalendar(),
    staleTime: 30_000,
  });
  if (query.isPending)
    return <LoadingState title="Cargando calendario de producción" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar el calendario"
      />
    );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Agenda"
        title="Calendario de producción"
        description="Tareas programadas por fecha, centro y responsable. Los solapamientos se revisan antes de confirmar cambios."
        action={
          <Link
            className="rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-stone-700"
            href={PRODUCTION_ROUTES.workload}
          >
            Ver carga de trabajo
          </Link>
        }
      />
      <section className="overflow-x-auto border border-[color:var(--color-border)] bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-[#eef3f8] text-[10px] tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-3 py-3">Inicio</th>
              <th className="px-3 py-3">Tarea</th>
              <th className="px-3 py-3">Orden</th>
              <th className="px-3 py-3">Centro</th>
              <th className="px-3 py-3">Responsable</th>
              <th className="px-3 py-3">Duración</th>
              <th className="px-3 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {query.data.map((task) => (
              <tr key={String(task.id)}>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {dateLabel(task.scheduledStart as string | null)}
                </td>
                <td className="px-3 py-3 font-semibold text-stone-900">
                  {String(task.title)}
                </td>
                <td className="px-3 py-3 text-xs text-[color:var(--color-primary)]">
                  {String(
                    (task.productionJob as { code?: string } | null)?.code ??
                      "—",
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {String(
                    (task.workCenter as { name?: string } | null)?.name ??
                      "Sin centro",
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {String(
                    (task.assignedToUser as { name?: string } | null)?.name ??
                      "Sin asignar",
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {Number(task.estimatedMinutes ?? 0)} min
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-sm bg-stone-100 px-1.5 py-1 text-[11px] text-stone-700">
                    {
                      getProductionTaskStatusBadge(String(task.status) as never)
                        .label
                    }
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.data.length ? (
          <EmptyState
            description="Programa tareas desde una orden para verlas aquí."
            title="Calendario sin tareas"
          />
        ) : null}
      </section>
    </div>
  );
}

export function ProductionCentersPage({
  workload = false,
}: {
  workload?: boolean;
}) {
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.centers,
    queryFn: () => productionService.listWorkCenters(),
    staleTime: 30_000,
  });
  if (query.isPending)
    return <LoadingState title="Cargando centros de trabajo" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar los centros"
      />
    );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow={`Producción · ${workload ? "Capacidad" : "Configuración"}`}
        title={workload ? "Carga de trabajo" : "Centros de trabajo"}
        description={
          workload
            ? "Capacidad disponible frente a minutos programados para anticipar saturación."
            : "Estado operativo y capacidad diaria de los centros que reciben tareas de producción."
        }
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {query.data.map((center) => (
          <article
            className="border border-[color:var(--color-border)] bg-white p-4"
            key={center.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.16em] text-stone-500 uppercase">
                  {center.code}
                </p>
                <h2 className="mt-1 text-base font-bold text-stone-950">
                  {center.name}
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  {formatProductionWorkCenter(center.type)}
                </p>
              </div>
              <span
                className={`rounded-sm px-1.5 py-1 text-[10px] font-semibold ${center.status === "AVAILABLE" ? "bg-emerald-50 text-emerald-700" : center.status === "SATURATED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}
              >
                {center.status === "AVAILABLE"
                  ? "Disponible"
                  : center.status === "SATURATED"
                    ? "Saturado"
                    : center.status === "MAINTENANCE"
                      ? "En mantenimiento"
                      : center.status === "INACTIVE"
                        ? "Inactivo"
                        : "Ocupado"}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] tracking-wide text-stone-500 uppercase">
                  Utilización
                </p>
                <p className="mt-1 text-2xl font-bold text-stone-950">
                  {center.utilizationPercent}%
                </p>
              </div>
              <p className="text-right text-xs text-stone-500">
                {center.scheduledMinutes} / {center.availableMinutes || "—"} min
                <br />
                {center.workstationCount} puesto
                {center.workstationCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className={`h-full rounded-full ${center.utilizationPercent > 100 ? "bg-rose-500" : center.utilizationPercent > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{
                  width: `${Math.min(100, center.utilizationPercent)}%`,
                }}
              />
            </div>
          </article>
        ))}
        {!query.data.length ? (
          <EmptyState
            description="Configura centros de trabajo para medir capacidad y asignar tareas."
            title="No hay centros configurados"
          />
        ) : null}
      </section>
    </div>
  );
}

export function ProductionTasksPage() {
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.board({ tasks: true }),
    queryFn: () => productionService.getBoard(),
    staleTime: 30_000,
  });
  const client = useQueryClient();
  const action = useMutation({
    mutationFn: ({
      taskId,
      toStatus,
      action,
    }: {
      taskId: string;
      toStatus: string;
      action: "iniciar" | "completar";
    }) => productionService.transitionTask(taskId, action, toStatus),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["production"] }),
  });
  if (query.isPending)
    return <LoadingState title="Cargando tareas de producción" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar las tareas"
      />
    );
  const jobs = query.data.columns.flatMap((column) => column.jobs);
  const tasks = jobs.flatMap((job) =>
    job.tasks.map((task) => ({ ...task, job })),
  );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Ejecución"
        title="Tareas de producción"
        description="Ejecuta tareas con dependencias, responsable, centro de trabajo y trazabilidad de tiempo."
      />
      <section className="overflow-x-auto border border-[color:var(--color-border)] bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#eef3f8] text-[10px] tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-3 py-3">Tarea</th>
              <th className="px-3 py-3">Orden</th>
              <th className="px-3 py-3">Centro</th>
              <th className="px-3 py-3">Responsable</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {tasks.map(({ job, ...task }) => (
              <tr key={task.id}>
                <td className="px-3 py-3 font-semibold text-stone-900">
                  {task.title}
                </td>
                <td className="px-3 py-3">
                  <Link
                    className="text-xs font-bold text-[color:var(--color-primary)]"
                    href={PRODUCTION_ROUTES.jobDetail(job.id)}
                  >
                    {job.code}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {task.workCenter?.name ?? "Sin centro"}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {task.assignedToUser?.name ?? "Sin asignar"}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-sm px-1.5 py-1 text-[11px] ${getProductionTaskStatusBadge(task.status).className}`}
                  >
                    {getProductionTaskStatusBadge(task.status).label}
                  </span>
                </td>
                <td className="px-3 py-3">
                  {task.status === "PENDING" ? (
                    <button
                      className="text-xs font-semibold text-[color:var(--color-primary)]"
                      onClick={() =>
                        action.mutate({
                          taskId: task.id,
                          action: "iniciar",
                          toStatus: "IN_PROGRESS",
                        })
                      }
                      type="button"
                    >
                      Iniciar
                    </button>
                  ) : task.status === "IN_PROGRESS" ? (
                    <button
                      className="text-xs font-semibold text-emerald-700"
                      onClick={() =>
                        action.mutate({
                          taskId: task.id,
                          action: "completar",
                          toStatus: "COMPLETED",
                        })
                      }
                      type="button"
                    >
                      Completar
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tasks.length ? (
          <EmptyState
            description="Las tareas de las órdenes existentes aparecerán aquí."
            title="No hay tareas visibles"
          />
        ) : null}
      </section>
    </div>
  );
}

export function ProductionBlocksPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.blocks(),
    queryFn: () => productionService.listBlocks(),
    staleTime: 30_000,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const resolve = useMutation({
    mutationFn: (id: string) =>
      productionService.resolveBlock(
        id,
        window.prompt("Describe la resolución del bloqueo") ||
          "Resolución registrada desde el tablero",
      ),
    onSuccess: () => {
      setFeedback("Bloqueo resuelto.");
      void client.invalidateQueries({
        queryKey: PRODUCTION_QUERY_KEYS.blocks(),
      });
    },
    onError: (error) => setFeedback(getApiErrorMessage(error)),
  });
  if (query.isPending) return <LoadingState title="Cargando bloqueos" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar los bloqueos"
      />
    );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Control"
        title="Bloqueos"
        description="Prioriza faltantes, incidencias y restricciones que afectan el flujo de producción."
        action={
          <Link
            className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
            href={PRODUCTION_ROUTES.board}
          >
            Volver al tablero
          </Link>
        }
      />
      {feedback ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {feedback}
        </p>
      ) : null}
      <section className="overflow-x-auto border border-[color:var(--color-border)] bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-[#eef3f8] text-[10px] tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-3 py-3">Severidad</th>
              <th className="px-3 py-3">Tipo</th>
              <th className="px-3 py-3">Registro</th>
              <th className="px-3 py-3">Descripción</th>
              <th className="px-3 py-3">Creado</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {query.data.map((block) => (
              <tr key={block.id}>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-sm px-1.5 py-1 text-[10px] font-bold ${block.severity === "CRITICAL" ? "bg-rose-100 text-rose-800" : block.severity === "HIGH" ? "bg-orange-100 text-orange-800" : "bg-stone-100 text-stone-700"}`}
                  >
                    {block.severity === "CRITICAL"
                      ? "Crítica"
                      : block.severity === "HIGH"
                        ? "Alta"
                        : block.severity === "MEDIUM"
                          ? "Media"
                          : "Baja"}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-stone-700">
                  {formatProductionBlockType(block.type)}
                </td>
                <td className="px-3 py-3 text-xs font-semibold text-[color:var(--color-primary)]">
                  {block.job?.code ?? block.task?.title ?? "Sin vínculo"}
                </td>
                <td className="max-w-sm px-3 py-3 text-xs text-stone-600">
                  {block.description}
                </td>
                <td className="px-3 py-3 text-xs text-stone-500">
                  {compactDate(block.createdAt)}
                </td>
                <td className="px-3 py-3">
                  {block.status !== "RESOLVED" &&
                  block.status !== "DISMISSED" ? (
                    <button
                      className="text-xs font-semibold text-emerald-700"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate(block.id)}
                      type="button"
                    >
                      Resolver
                    </button>
                  ) : (
                    <span className="text-xs text-stone-400">Resuelto</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.data.length ? (
          <EmptyState
            description="Los bloqueos críticos y operativos aparecerán aquí cuando se registren."
            title="No hay bloqueos abiertos"
          />
        ) : null}
      </section>
    </div>
  );
}

export function ProductionQualityPage() {
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.board({ quality: true }),
    queryFn: () => productionService.getBoard(),
    staleTime: 30_000,
  });
  if (query.isPending)
    return <LoadingState title="Cargando control de calidad" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar calidad"
      />
    );
  const jobs = query.data.columns
    .flatMap((column) => column.jobs)
    .filter(
      (job) =>
        job.workflowStatus === "PENDING_QUALITY" ||
        job.qualityStatus === "REJECTED",
    );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Calidad"
        title="Control de calidad"
        description="Revisa las órdenes que no pueden completarse hasta registrar un control conforme."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <InfoPanel
          icon={ShieldCheck}
          label="Aprobación obligatoria"
          text="El cierre se valida en backend cuando existe control requerido."
        />
        <InfoPanel
          icon={LockKeyhole}
          label="No conformidades"
          text="Una no conformidad crítica mantiene la orden bloqueada."
        />
        <InfoPanel
          icon={CheckCircle2}
          label="Trazabilidad"
          text="Cada control conserva ejecutor, fecha y evidencia."
        />
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        {jobs.map((job) => (
          <article
            className="border border-[color:var(--color-border)] bg-white p-4"
            key={job.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  className="font-bold text-[color:var(--color-primary)]"
                  href={PRODUCTION_ROUTES.jobDetail(job.id)}
                >
                  {job.code}
                </Link>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  {job.project?.title ?? "Sin proyecto"}
                </p>
              </div>
              <span className="rounded-sm bg-violet-100 px-1.5 py-1 text-[10px] font-semibold text-violet-800">
                {job.qualityStatus === "REJECTED"
                  ? "Requiere corrección"
                  : "Pendiente de control"}
              </span>
            </div>
            <p className="mt-3 text-xs text-stone-600">
              {job.tasks.filter((task) => task.status !== "COMPLETED").length}{" "}
              tareas abiertas · responsable{" "}
              {job.assignedToUser?.name ?? "sin asignar"}
            </p>
          </article>
        ))}
        {!jobs.length ? (
          <EmptyState
            description="No hay órdenes esperando control de calidad."
            title="Calidad al día"
          />
        ) : null}
      </section>
    </div>
  );
}

export function ProductionWastePage() {
  const query = useQuery({
    queryKey: ["production", "waste", "jobs"],
    queryFn: () =>
      productionService.listJobs({
        page: 1,
        perPage: 100,
        sortBy: "updatedAt",
        sortDirection: "desc",
      }),
    staleTime: 30_000,
  });
  if (query.isPending) return <LoadingState title="Cargando desperdicios" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar desperdicios"
      />
    );
  const jobs = query.data.data.filter((job) => job.wasteReport);
  const estimated = jobs.reduce(
    (sum, job) => sum + (job.wasteReport?.theoreticalWasteAreaM2 ?? 0),
    0,
  );
  const actual = jobs.reduce(
    (sum, job) => sum + (job.wasteReport?.actualWasteAreaM2 ?? 0),
    0,
  );
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Materiales"
        title="Desperdicios y remanentes"
        description="Compara el desperdicio teórico de los planes de corte con el dato real registrado en las órdenes."
        action={
          <Link
            className="rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
            href={PRODUCTION_ROUTES.reports}
          >
            Ver reportes
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="border border-[color:var(--color-border)] bg-white p-4">
          <p className="text-[10px] tracking-wide text-stone-500 uppercase">
            Órdenes con reporte
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-950">
            {jobs.length}
          </p>
        </div>
        <div className="border border-[color:var(--color-border)] bg-white p-4">
          <p className="text-[10px] tracking-wide text-stone-500 uppercase">
            Desperdicio estimado
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-950">
            {estimated.toFixed(2)} m²
          </p>
        </div>
        <div className="border border-[color:var(--color-border)] bg-white p-4">
          <p className="text-[10px] tracking-wide text-stone-500 uppercase">
            Desperdicio real
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-950">
            {actual.toFixed(2)} m²
          </p>
        </div>
      </div>
      <section className="overflow-x-auto border border-[color:var(--color-border)] bg-white">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-[#eef3f8] text-[10px] tracking-wide text-stone-500 uppercase">
            <tr>
              <th className="px-3 py-3">Orden</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3">Estimado</th>
              <th className="px-3 py-3">Real</th>
              <th className="px-3 py-3">Variación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-3 py-3">
                  <Link
                    className="font-bold text-[color:var(--color-primary)]"
                    href={PRODUCTION_ROUTES.jobDetail(job.id)}
                  >
                    {job.code}
                  </Link>
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {job.wasteReport?.cuttingPlan?.code ?? "Sin plan"}
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {job.wasteReport?.theoreticalWasteAreaM2.toFixed(2)} m²
                </td>
                <td className="px-3 py-3 text-xs text-stone-600">
                  {job.wasteReport?.actualWasteAreaM2.toFixed(2)} m²
                </td>
                <td
                  className={`px-3 py-3 text-xs font-semibold ${(job.wasteReport?.varianceAreaM2 ?? 0) > 0 ? "text-rose-700" : "text-emerald-700"}`}
                >
                  {job.wasteReport?.varianceAreaM2.toFixed(2)} m²
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!jobs.length ? (
          <EmptyState
            description="Registra consumos y calcula reportes desde las órdenes de producción."
            title="Aún no hay desperdicios reportados"
          />
        ) : null}
      </section>
    </div>
  );
}

export function ProductionReportsPage() {
  const query = useQuery({
    queryKey: PRODUCTION_QUERY_KEYS.board({ reports: true }),
    queryFn: () => productionService.getBoard(),
    staleTime: 30_000,
  });
  if (query.isPending)
    return <LoadingState title="Cargando indicadores de producción" />;
  if (query.isError)
    return (
      <ErrorState
        description={getApiErrorMessage(query.error)}
        title="No fue posible cargar los reportes"
      />
    );
  const rows = query.data.columns.flatMap((column) => column.jobs);
  const exportConfig = {
    title: "Plan operativo de producción",
    subtitle: "Órdenes visibles en el tablero avanzado.",
    fileName: "plan-produccion",
    columns: [
      {
        header: "Estado",
        value: (row: (typeof rows)[number]) =>
          getProductionWorkflowBadge(row.workflowStatus).label,
      },
      { header: "Código", value: (row: (typeof rows)[number]) => row.code },
      {
        header: "Proyecto",
        value: (row: (typeof rows)[number]) =>
          row.project?.title ?? "Sin proyecto",
      },
      {
        header: "Cliente",
        value: (row: (typeof rows)[number]) =>
          row.project?.clientName ?? "Sin cliente",
      },
      {
        header: "Prioridad",
        value: (row: (typeof rows)[number]) => row.priority,
      },
      {
        header: "Responsable",
        value: (row: (typeof rows)[number]) =>
          row.assignedToUser?.name ?? "Sin asignar",
      },
      {
        header: "Avance",
        value: (row: (typeof rows)[number]) => `${row.progressPercent}%`,
      },
    ],
  };
  return (
    <div className="space-y-4">
      <OperationHeader
        eyebrow="Producción · Reportes"
        title="Reportes operativos"
        description="Exporta el plan filtrado y consulta indicadores consolidados desde el mismo origen de datos del tablero."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-stone-700"
              onClick={() => exportRowsToExcel(rows, exportConfig)}
              type="button"
            >
              <Download size={16} />
              Excel
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white"
              onClick={() => exportRowsToPdf(rows, exportConfig)}
              type="button"
            >
              <Download size={16} />
              PDF
            </button>
          </div>
        }
      />
      <section className="grid gap-3 md:grid-cols-4">
        {[
          {
            label: "Órdenes pendientes",
            value: query.data.metrics.pendingOrders,
          },
          {
            label: "Órdenes atrasadas",
            value: query.data.metrics.overdueOrders,
          },
          {
            label: "Carga utilizada",
            value: `${query.data.metrics.capacityUtilizationPercent}%`,
          },
          { label: "Bloqueos", value: query.data.metrics.blockedOrders },
        ].map((item) => (
          <div
            className="border border-[color:var(--color-border)] bg-white p-4"
            key={item.label}
          >
            <p className="text-[10px] tracking-wide text-stone-500 uppercase">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-stone-950">
              {item.value}
            </p>
          </div>
        ))}
      </section>
      <section className="border border-[color:var(--color-border)] bg-white p-4">
        <p className="text-xs font-bold tracking-[0.16em] text-stone-500 uppercase">
          Reportes disponibles
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <ReportLink
            icon={CalendarDays}
            text="Plan diario y semanal"
            href={PRODUCTION_ROUTES.planning}
          />
          <ReportLink
            icon={Factory}
            text="Carga por centro de trabajo"
            href={PRODUCTION_ROUTES.workload}
          />
          <ReportLink
            icon={Timer}
            text="Tiempos estimados frente a reales"
            href={PRODUCTION_ROUTES.tasks}
          />
          <ReportLink
            icon={Wrench}
            text="Órdenes atrasadas y bloqueadas"
            href={PRODUCTION_ROUTES.blocks}
          />
        </div>
      </section>
    </div>
  );
}

function ReportLink({
  icon: Icon,
  text,
  href,
}: {
  icon: typeof CalendarDays;
  text: string;
  href: string;
}) {
  return (
    <Link
      className="flex items-center gap-3 border border-stone-200 px-3 py-3 text-sm font-semibold text-stone-800 hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
      href={href}
    >
      <Icon size={17} />
      {text}
    </Link>
  );
}

export function ProductionExternalRedirect({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
      href={href}
    >
      Abrir módulo
    </Link>
  );
}
