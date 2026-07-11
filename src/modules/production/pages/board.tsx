"use client";

import Link from "next/link";
import { useState, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CalendarClock, Factory, GripVertical, RefreshCw, Timer, UserRound } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDateOnlyValue } from "@/modules/commercial/ui";
import type { ProductionBoardJob, ProductionJobPriority, ProductionWorkflowStatus } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { PRODUCTION_PERMISSIONS, PRODUCTION_QUERY_KEYS, PRODUCTION_ROUTES } from "../constants";
import { formatProductionWorkCenter, getProductionPriorityBadge, getProductionWorkflowBadge } from "../ui";
import { productionService } from "@/services/production-service";

const minutes = (value: number) => value > 0 ? `${Math.round(value / 60)} h` : "Sin estimar";

const nextStatusForAction: Record<string, ProductionWorkflowStatus> = {
  start: "IN_PROGRESS",
  pause: "PAUSED",
  resume: "IN_PROGRESS",
  quality: "PENDING_QUALITY",
};

function BoardJobCard({ job, onTransition }: { job: ProductionBoardJob; onTransition: (job: ProductionBoardJob, status: ProductionWorkflowStatus) => void }) {
  const status = getProductionWorkflowBadge(job.workflowStatus);
  const priority = getProductionPriorityBadge(job.priority);
  return (
    <article
      className="group rounded-md border border-[color:var(--color-border)] bg-white p-3 shadow-[0_8px_22px_rgba(15,47,91,0.05)] transition hover:border-[color:var(--color-primary)] hover:shadow-[0_12px_28px_rgba(15,47,91,0.1)]"
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/production-job", job.id)}
    >
      <div className="flex items-start gap-2">
        <GripVertical aria-label="Arrastrar orden" className="mt-0.5 shrink-0 text-stone-300" size={16} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link className="text-sm font-bold text-stone-950 hover:text-[color:var(--color-primary)]" href={PRODUCTION_ROUTES.jobDetail(job.id)}>{job.code}</Link>
            <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priority.className}`}>{priority.label}</span>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-stone-700">{job.project?.title ?? "Sin proyecto"}</p>
          <p className="truncate text-[11px] text-stone-500">{job.project?.clientName ?? "Sin cliente"} · {job.product ?? "Producto sin definir"}</p>
        </div>
        <span className={`rounded-sm px-1.5 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-stone-100 pt-3 text-[11px] text-stone-600">
        <span className="flex min-w-0 items-center gap-1.5"><Factory className="shrink-0 text-stone-400" size={13} /><span className="truncate">{job.currentWorkCenter ? formatProductionWorkCenter(job.currentWorkCenter.type) : "Sin centro"}</span></span>
        <span className="flex min-w-0 items-center gap-1.5"><UserRound className="shrink-0 text-stone-400" size={13} /><span className="truncate">{job.assignedToUser?.name ?? "Sin asignar"}</span></span>
        <span className="flex items-center gap-1.5"><CalendarClock className="shrink-0 text-stone-400" size={13} />{job.plannedEndDate ? formatDateOnlyValue(job.plannedEndDate) : "Sin fecha"}</span>
        <span className={`flex items-center gap-1.5 ${job.overdue ? "font-semibold text-rose-700" : ""}`}><AlertTriangle className="shrink-0" size={13} />{job.overdue ? "Atrasada" : `${job.progressPercent}% avance`}</span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-stone-500"><span>Avance</span><span>{job.progressPercent}%</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${Math.min(100, job.progressPercent)}%` }} /></div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-medium">
        <span className={`rounded-sm px-1.5 py-1 ${job.materialStatus === "SHORTAGE" ? "bg-rose-50 text-rose-700" : "bg-stone-100 text-stone-600"}`}>Material: {job.materialStatus === "READY" ? "Listo" : job.materialStatus === "RESERVED" ? "Reservado" : job.materialStatus === "PARTIAL" ? "Parcial" : job.materialStatus === "SHORTAGE" ? "Faltante" : "Sin reserva"}</span>
        <span className={`rounded-sm px-1.5 py-1 ${job.qualityStatus === "APPROVED" ? "bg-emerald-50 text-emerald-700" : job.qualityStatus === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-stone-100 text-stone-600"}`}>Calidad: {job.qualityStatus === "APPROVED" ? "Aprobada" : job.qualityStatus === "REJECTED" ? "Rechazada" : job.qualityStatus === "PENDING" ? "Pendiente" : job.qualityStatus === "IN_REVIEW" ? "En revisión" : "No requerida"}</span>
        {job.openBlockCount > 0 ? <span className="rounded-sm bg-rose-50 px-1.5 py-1 text-rose-700">{job.openBlockCount} bloqueo{job.openBlockCount === 1 ? "" : "s"}</span> : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-2 text-[10px] text-stone-500">
        <span className="flex items-center gap-1"><Timer size={12} />{minutes(job.consumedMinutes)} / {minutes(job.estimatedMinutes)}</span>
        <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
          {job.workflowStatus === "READY_TO_START" ? <button className="rounded-sm px-2 py-1 font-semibold text-[color:var(--color-primary)] hover:bg-[var(--color-primary-soft)]" onClick={() => onTransition(job, nextStatusForAction.start)} type="button">Iniciar</button> : null}
          {job.workflowStatus === "IN_PROGRESS" ? <button className="rounded-sm px-2 py-1 font-semibold text-amber-700 hover:bg-amber-50" onClick={() => onTransition(job, nextStatusForAction.pause)} type="button">Pausar</button> : null}
          {job.workflowStatus === "PAUSED" ? <button className="rounded-sm px-2 py-1 font-semibold text-[color:var(--color-primary)] hover:bg-[var(--color-primary-soft)]" onClick={() => onTransition(job, nextStatusForAction.resume)} type="button">Reanudar</button> : null}
          {job.workflowStatus === "IN_PROGRESS" ? <button className="rounded-sm px-2 py-1 font-semibold text-violet-700 hover:bg-violet-50" onClick={() => onTransition(job, nextStatusForAction.quality)} type="button">Enviar a control</button> : null}
          <Link aria-label={`Abrir ${job.code}`} className="rounded-sm p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-800" href={PRODUCTION_ROUTES.jobDetail(job.id)}><ArrowRight size={14} /></Link>
        </div>
      </div>
    </article>
  );
}

export default function ProductionBoardPage() {
  const { permissions } = usePermissions();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const boardQuery = useQuery({ queryKey: PRODUCTION_QUERY_KEYS.board({ search, priority }), queryFn: () => productionService.getBoard({ search, priority: priority ? priority as ProductionJobPriority : undefined }), staleTime: 30_000 });
  const transitionMutation = useMutation({
    mutationFn: ({ job, status }: { job: ProductionBoardJob; status: ProductionWorkflowStatus }) => productionService.transitionJob(job.id, status, job.version),
    onSuccess: () => { setFeedback("La orden se actualizó correctamente."); void queryClient.invalidateQueries({ queryKey: ["production", "board"] }); },
    onError: (error) => setFeedback(getApiErrorMessage(error)),
  });
  const canExecute = permissions.includes(PRODUCTION_PERMISSIONS.start) || permissions.includes(PRODUCTION_PERMISSIONS.tasksExecute);

  if (boardQuery.isPending) return <LoadingState title="Cargando tablero de producción" />;
  if (boardQuery.isError) return <ErrorState description={getApiErrorMessage(boardQuery.error)} title="No fue posible cargar el tablero" />;
  const board = boardQuery.data;
  const handleTransition = (job: ProductionBoardJob, status: ProductionWorkflowStatus) => {
    if (!canExecute) { setFeedback("No tienes permiso para realizar esta acción."); return; }
    if (["PENDING_QUALITY", "PAUSED"].includes(status) && !window.confirm(`¿Confirmas mover ${job.code} a ${getProductionWorkflowBadge(status).label.toLowerCase()}?`)) return;
    transitionMutation.mutate({ job, status });
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>, targetStatus: ProductionWorkflowStatus) => {
    event.preventDefault();
    const jobId = event.dataTransfer.getData("text/production-job");
    const job = board.columns.flatMap((column) => column.jobs).find((item) => item.id === jobId);
    if (!job || job.workflowStatus === targetStatus) return;
    handleTransition(job, targetStatus);
  };

  return (
    <main className="space-y-4">
      <PageHeader actions={<div className="flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:border-[color:var(--color-primary)]" href={PRODUCTION_ROUTES.planning}>Planificación</Link><Link className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)]" href={PRODUCTION_ROUTES.orders}>Órdenes de trabajo</Link></div>} description="Planifica, prioriza y supervisa la fabricación desde una única cola operativa conectada a las órdenes existentes." eyebrow="Operaciones · Producción" title="Tablero avanzado de producción" />

      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {[{ label: "Pendientes", value: board.metrics.pendingOrders }, { label: "En proceso", value: board.metrics.inProgressOrders }, { label: "Atrasadas", value: board.metrics.overdueOrders }, { label: "Bloqueadas", value: board.metrics.blockedOrders }, { label: "Calidad pendiente", value: board.metrics.pendingQualityTasks }].map((metric) => <div className="border border-[color:var(--color-border)] bg-white px-3 py-3" key={metric.label}><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">{metric.label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-stone-950">{metric.value}</p></div>)}
      </section>

      <section className="flex flex-col gap-2 border-y border-[color:var(--color-border)] bg-[#eef3f8] px-3 py-3 sm:flex-row sm:items-center">
        <input aria-label="Buscar órdenes" className="h-10 min-w-0 flex-1 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[color:var(--color-primary)]" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar código, proyecto o cliente" value={search} />
        <select aria-label="Filtrar por prioridad" className="h-10 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm text-stone-700 outline-none focus:border-[color:var(--color-primary)]" onChange={(event) => setPriority(event.target.value)} value={priority}><option value="">Todas las prioridades</option><option value="CRITICAL">Crítica</option><option value="URGENT">Urgente</option><option value="HIGH">Alta</option><option value="NORMAL">Normal</option><option value="LOW">Baja</option></select>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[color:var(--color-border)] bg-white px-3 text-sm font-semibold text-stone-700 hover:border-[color:var(--color-primary)]" onClick={() => void boardQuery.refetch()} type="button"><RefreshCw size={15} />Actualizar</button>
      </section>
      {feedback ? <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800"><span>{feedback}</span><button aria-label="Cerrar mensaje" onClick={() => setFeedback(null)} type="button">×</button></div> : null}

      <section className="overflow-x-auto pb-2">
        <div className="grid min-w-[1320px] grid-cols-9 gap-2">
          {board.columns.map((column) => <div className="min-w-0" key={column.key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, column.key)}><div className="mb-2 flex items-center justify-between gap-2 border-b-2 border-stone-300 px-1 pb-2"><div><h2 className="text-xs font-bold uppercase tracking-wide text-stone-700">{column.label}</h2><p className="mt-0.5 text-[10px] text-stone-500">{column.jobs.length} órdenes</p></div><span className="rounded-sm bg-white px-1.5 py-0.5 text-[10px] font-bold text-stone-500">{column.jobs.length}</span></div><div className="space-y-2 rounded-md bg-[#e6edf3] p-1.5" style={{ minHeight: 160 }}>{column.jobs.length ? column.jobs.map((job) => <BoardJobCard job={job} key={job.id} onTransition={handleTransition} />) : <div className="flex min-h-32 items-center justify-center px-3 text-center text-[11px] text-stone-400">Suelta aquí una orden válida</div>}</div></div>)}
        </div>
      </section>
      {transitionMutation.isPending ? <p className="text-xs text-stone-500">Guardando transición en el servidor…</p> : null}
    </main>
  );
}
