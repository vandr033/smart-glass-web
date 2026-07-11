"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Camera,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Factory,
  ClipboardCheck,
  Home,
  LocateFixed,
  MapPin,
  PackageCheck,
  PackageSearch,
  QrCode,
  RefreshCw,
  Search,
  ShieldAlert,
  Truck,
  UserRound,
  WifiOff,
  XCircle,
} from "lucide-react";

import { usePermissions } from "@/hooks/use-permissions";
import { cn } from "@/utils";
import { inventoryService } from "@/services/inventory-service";
import { installationService } from "@/services/installation-service";
import { measurementService } from "@/services/measurement-service";
import { notificationService } from "@/services/notification-service";
import { operationalPortalService, type OperationalTask } from "@/services/operational-portal-service";
import { productionService } from "@/services/production-service";

import {
  PORTAL_AREAS,
  PORTAL_ROUTES,
  formatDate,
  formatDateTime,
  formatOperationalLabel,
} from "./constants";

type Section = "inicio" | "tareas" | "escanear" | "almacen" | "movimientos" | "preparaciones" | "produccion" | "mediciones" | "instalaciones" | "incidencias" | "calidad" | "supervision" | "notificaciones" | "perfil";
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type BarcodeDetectorConstructor = new (options?: { formats: string[] }) => BarcodeDetectorLike;

const can = (permissions: string[], area: keyof typeof PORTAL_AREAS) => PORTAL_AREAS[area].some((permission) => permissions.includes(permission));

export function OperationalPage({ section }: { section: Section }) {
  const { permissions } = usePermissions();
  if (section === "inicio") return <HomePage permissions={permissions} />;
  if (section === "tareas") return <TasksPage />;
  if (section === "escanear") return <ScanPage />;
  if (section === "almacen" || section === "movimientos" || section === "preparaciones") return <WarehousePage section={section} />;
  if (section === "produccion") return <ProductionPage />;
  if (section === "mediciones") return <MeasurementsPage />;
  if (section === "instalaciones") return <InstallationsPage />;
  if (section === "incidencias") return <IncidentsPage />;
  if (section === "calidad") return <QualityPage />;
  if (section === "supervision") return <SupervisionPage />;
  if (section === "notificaciones") return <NotificationsPage />;
  if (section === "perfil") return <ProfilePage />;
  return <ComingSoonPage title={section === "incidencias" ? "Incidencias operativas" : section === "calidad" ? "Control de calidad" : "Supervisión"} />;
}

export function OperationalDetailPage({ section }: { section: "produccion" | "mediciones" | "instalaciones" | "calidad" }) {
  const params = useParams<{ id: string }>();
  if (section === "produccion") return <ProductionDetailPage id={params.id} />;
  if (section === "mediciones") return <MeasurementDetailPage id={params.id} />;
  if (section === "calidad") return <QualityDetailPage id={params.id} />;
  return <InstallationDetailPage id={params.id} />;
}

function HomePage({ permissions }: { permissions: string[] }) {
  const summary = useQuery({ queryKey: ["operaciones", "resumen"], queryFn: operationalPortalService.getSummary, staleTime: 30_000 });
  const jobs = useQuery({ queryKey: ["operaciones", "produccion", "inicio"], queryFn: () => productionService.listJobs({ page: 1, perPage: 5, sortBy: "updatedAt", sortDirection: "desc" }), enabled: can(permissions, "produccion") });
  const measurements = useQuery({ queryKey: ["operaciones", "mediciones", "inicio"], queryFn: () => measurementService.listRequests({ page: 1, perPage: 5, sortBy: "scheduledDate", sortDirection: "asc" }), enabled: can(permissions, "mediciones") });
  const installations = useQuery({ queryKey: ["operaciones", "instalaciones", "inicio"], queryFn: () => installationService.listOrders({ page: 1, perPage: 5, sortBy: "scheduledDate", sortDirection: "asc" }), enabled: can(permissions, "instalaciones") });

  return <div className="portal-stack">
    <PageIntro eyebrow="Turno operativo" title="Buenos días, equipo" description="Todo lo que necesita tu jornada, conectado al ERP y ordenado por prioridad." action={<Link className="portal-primary-button" href={PORTAL_ROUTES.escanear}><QrCode size={18} /> Escanear código</Link>} />
    <section className="portal-hero-strip"><div><p className="portal-hero-label">Centro de mando del turno</p><h2>Avanza con claridad.</h2><p>Consulta el siguiente paso, registra evidencia y deja cada operación trazable.</p></div><div className="portal-hero-orbit"><CircleDot size={20} /><span>ERP activo</span></div></section>
    <section className="portal-kpi-grid">
      <KpiCard icon={PackageCheck} label="Tareas asignadas" value={summary.data?.tareasAsignadas ?? "—"} tone="blue" href={PORTAL_ROUTES.tareas} />
      <KpiCard icon={Factory} label="Órdenes de producción" value={summary.data?.ordenesProduccion ?? "—"} tone="amber" href={PORTAL_ROUTES.produccion} />
      <KpiCard icon={MapPin} label="Mediciones programadas" value={summary.data?.mediciones ?? "—"} tone="green" href={PORTAL_ROUTES.mediciones} />
      <KpiCard icon={Truck} label="Instalaciones" value={summary.data?.instalaciones ?? "—"} tone="orange" href={PORTAL_ROUTES.instalaciones} />
    </section>
    <div className="portal-grid-2">
      <section className="portal-panel"><PanelHeading title="Producción en movimiento" subtitle="Órdenes actualizadas recientemente" href={PORTAL_ROUTES.produccion} />{jobs.isPending ? <LoadingRows /> : jobs.data?.data.map((job) => <WorkRow key={job.id} href={`${PORTAL_ROUTES.produccion}/${job.id}`} code={job.code} title={job.project?.title ?? "Orden sin proyecto"} status={job.status} meta={`${job.pendingTaskCount} tareas pendientes`} priority={job.priority} />)}{jobs.data?.data.length === 0 ? <EmptyPanel text="No hay órdenes de producción visibles." /> : null}</section>
      <section className="portal-panel"><PanelHeading title="Agenda próxima" subtitle="Mediciones e instalaciones" href={PORTAL_ROUTES.mediciones} />{measurements.data?.data.slice(0, 3).map((item) => <ScheduleRow key={item.id} icon={MapPin} label="Medición" title={item.project?.title ?? item.client.displayName} date={item.scheduledDate} status={item.status} href={`${PORTAL_ROUTES.mediciones}/${item.id}`} />)}{installations.data?.data.slice(0, 3).map((item) => <ScheduleRow key={item.id} icon={Truck} label="Instalación" title={item.project?.title ?? item.client.displayName} date={item.scheduledDate} status={item.status} href={`${PORTAL_ROUTES.instalaciones}/${item.id}`} />)}{!measurements.data?.data.length && !installations.data?.data.length ? <EmptyPanel text="No hay visitas programadas." /> : null}</section>
    </div>
    <section className="portal-quick-grid"><QuickAction icon={PackageSearch} title="Consultar almacén" text="Existencias, ubicaciones y reservas" href={PORTAL_ROUTES.almacen} /><QuickAction icon={ShieldAlert} title="Reportar incidencia" text="Deja evidencia y asigna atención" href={PORTAL_ROUTES.incidencias} /><QuickAction icon={ClipboardCheck} title="Revisar calidad" text="Controles pendientes del turno" href={PORTAL_ROUTES.calidad} /></section>
  </div>;
}

function TasksPage() {
  const query = useQuery({ queryKey: ["operaciones", "tareas"], queryFn: operationalPortalService.listTasks });
  return <div className="portal-stack"><PageIntro eyebrow="Mi jornada" title="Mis tareas" description="Tu cola de trabajo, ordenada por urgencia y con el siguiente paso siempre visible." /><div className="portal-filter-row"><button className="portal-filter-chip portal-filter-chip--active" type="button">Todas</button><button className="portal-filter-chip" type="button">Pendientes</button><button className="portal-filter-chip" type="button">Atrasadas</button><button className="portal-filter-chip" type="button">Completadas</button></div><section className="portal-panel portal-panel--flush">{query.isPending ? <LoadingRows count={5} /> : query.data?.map((task) => <TaskRow key={task.id} task={task} />)}{!query.isPending && !query.data?.length ? <EmptyPanel text="No tienes tareas asignadas por ahora." /> : null}</section></div>;
}

function TaskRow({ task }: { task: OperationalTask }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({ mutationFn: () => task.status === "IN_PROGRESS" ? productionService.completeTask(task.id) : productionService.startTask(task.id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "tareas"] }) });
  return <div className="portal-task-row"><div className="portal-task-status"><span className={cn("portal-status-dot", task.status === "IN_PROGRESS" ? "portal-status-dot--amber" : task.status === "COMPLETED" ? "portal-status-dot--green" : "portal-status-dot--blue")} /><span>{formatOperationalLabel(task.status)}</span></div><div className="min-w-0 flex-1"><p className="portal-row-title">{task.title}</p><p className="portal-row-meta">{task.productionJob.code} · {formatOperationalLabel(task.taskType)} · vence {formatDate(task.productionJob.plannedEndDate)}</p></div><span className="portal-priority">{formatOperationalLabel(task.productionJob.priority)}</span><button className="portal-row-action" disabled={mutation.isPending || task.status === "COMPLETED"} onClick={() => mutation.mutate()} type="button">{task.status === "IN_PROGRESS" ? "Completar" : "Iniciar"} <ArrowRight size={15} /></button></div>;
}

function ScanPage() {
  const [code, setCode] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof operationalPortalService.resolveScan>> | null>(null);
  const mutation = useMutation({ mutationFn: operationalPortalService.resolveScan, onSuccess: setResult });
  useEffect(() => {
    let stream: MediaStream | null = null;
    let scanTimer: ReturnType<typeof setInterval> | null = null;
    if (!cameraOn) return undefined;
    const videoElement = videoRef.current;
    if (!navigator.mediaDevices?.getUserMedia) { queueMicrotask(() => setCameraError("Este navegador no permite usar la cámara. Usa la búsqueda manual.")); return undefined; }
    void navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }).then((nextStream) => {
      stream = nextStream;
      if (videoElement) videoElement.srcObject = nextStream;
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
      if (Detector && videoElement) {
        const detector = new Detector({ formats: ["qr_code", "code_128", "ean_13", "ean_8"] });
        scanTimer = setInterval(() => {
          if (videoElement.readyState < 2) return;
          void detector.detect(videoElement).then(([detected]) => {
            if (detected?.rawValue) { setCode(detected.rawValue); setCameraOn(false); }
          }).catch(() => undefined);
        }, 650);
      }
    }).catch(() => setCameraError("No se pudo abrir la cámara. Revisa el permiso del navegador o usa la búsqueda manual."));
    return () => { if (scanTimer) clearInterval(scanTimer); stream?.getTracks().forEach((track) => track.stop()); if (videoElement) videoElement.srcObject = null; };
  }, [cameraOn]);
  return <div className="portal-stack"><PageIntro eyebrow="Herramienta de campo" title="Escanear" description="Identifica materiales, órdenes y visitas sin ejecutar movimientos automáticamente." /><div className="portal-scan-layout"><section className="portal-scan-card"><div className={cn("portal-camera-box", cameraOn && "portal-camera-box--active")}>{cameraOn ? <video ref={videoRef} autoPlay className="portal-camera-video" muted playsInline /> : null}<div className="portal-scan-corners" />{cameraError ? <div className="portal-camera-message"><AlertTriangle size={30} /><span>Cámara no disponible</span><small>{cameraError}</small></div> : cameraOn ? <div className="portal-camera-message portal-camera-message--overlay"><span>Apunta al código QR o de barras</span></div> : <div className="portal-camera-message"><QrCode size={40} /><span>Escáner disponible</span><small>Activa la cámara o ingresa el código manualmente</small></div>}</div><div className="portal-scan-actions"><button className="portal-primary-button" onClick={() => { setCameraError(null); setCameraOn((value) => !value); }} type="button"><Camera size={18} /> {cameraOn ? "Apagar cámara" : "Activar cámara"}</button></div></section><section className="portal-panel"><p className="portal-panel-label">Búsqueda manual</p><h2 className="portal-panel-title">Buscar un código</h2><p className="portal-panel-copy">Úsalo cuando el lector no esté disponible o la etiqueta esté dañada.</p><form className="portal-inline-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(code); }}><input className="portal-input" onChange={(event) => setCode(event.target.value)} placeholder="Ej. MAT-00042 o OP-0018" value={code} /><button className="portal-primary-button" disabled={mutation.isPending || code.length < 2} type="submit"><Search size={17} /> Consultar</button></form>{result ? <div className={cn("portal-scan-result", result.encontrado ? "portal-scan-result--ok" : "portal-scan-result--error")}>{result.encontrado ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}<div><p className="font-bold">{result.encontrado ? `Registro encontrado · ${formatOperationalLabel(result.entidad)}` : "Código no encontrado"}</p><p className="text-sm">{result.mensaje ?? "Revisa los datos antes de continuar."}</p></div></div> : null}</section></div><section className="portal-note"><WifiOff size={18} /><p>La cámara es opcional. Los movimientos, confirmaciones y cambios sensibles requieren conexión al servidor.</p></section></div>;
}

function WarehousePage({ section }: { section: "almacen" | "movimientos" | "preparaciones" }) {
  const [search, setSearch] = useState("");
  const stock = useQuery({ queryKey: ["operaciones", "almacen", "stock", search], queryFn: () => inventoryService.listStock({ page: 1, perPage: 50, search, sortBy: "material", sortDirection: "asc" }), enabled: section === "almacen" });
  const movements = useQuery({ queryKey: ["operaciones", "almacen", "movimientos"], queryFn: () => inventoryService.listMovements({ page: 1, perPage: 50, sortBy: "createdAt", sortDirection: "desc" }), enabled: section === "movimientos" });
  const reservations = useQuery({ queryKey: ["operaciones", "almacen", "preparaciones"], queryFn: () => inventoryService.listReservations({ page: 1, perPage: 50, status: "ACTIVE", sortBy: "createdAt", sortDirection: "desc" }), enabled: section === "preparaciones" });
  const title = section === "almacen" ? "Almacén" : section === "movimientos" ? "Movimientos" : "Preparación de materiales";
  return <div className="portal-stack"><PageIntro eyebrow="Operaciones · Almacén" title={title} description={section === "almacen" ? "Consulta existencias reales, reservas y ubicaciones antes de mover material." : section === "movimientos" ? "Historial de entradas, salidas, transferencias y ajustes registrados en el ERP." : "Material reservado para proyectos y órdenes que necesitan atención."} action={section === "almacen" ? <Link className="portal-secondary-button" href={PORTAL_ROUTES.movimientos}><ArrowUpRight size={17} /> Ver movimientos</Link> : undefined} />{section === "almacen" ? <><div className="portal-search-bar"><Search size={18} /><input onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código, material o lote" value={search} /></div><section className="portal-panel portal-panel--flush">{stock.isPending ? <LoadingRows count={6} /> : stock.data?.data.map((item) => <StockRow key={item.id} item={item} />)}{!stock.isPending && !stock.data?.data.length ? <EmptyPanel text="No encontramos existencias con esos criterios." /> : null}</section></> : section === "movimientos" ? <section className="portal-panel portal-panel--flush">{movements.isPending ? <LoadingRows count={6} /> : movements.data?.data.map((item) => <MovementRow key={item.id} item={item} />)}{!movements.isPending && !movements.data?.data.length ? <EmptyPanel text="Aún no hay movimientos para mostrar." /> : null}</section> : <section className="portal-panel portal-panel--flush">{reservations.isPending ? <LoadingRows count={6} /> : reservations.data?.data.map((item) => <ReservationRow key={item.id} item={item} />)}{!reservations.isPending && !reservations.data?.data.length ? <EmptyPanel text="No hay preparaciones activas." /> : null}</section>}</div>;
}

function ProductionPage() {
  const query = useQuery({ queryKey: ["operaciones", "produccion", "lista"], queryFn: () => productionService.listJobs({ page: 1, perPage: 100, sortBy: "plannedEndDate", sortDirection: "asc" }) });
  return <div className="portal-stack"><PageIntro eyebrow="Operaciones · Planta" title="Producción" description="Ordenes, prioridades y avance de fabricación en una vista diseñada para el piso de planta." /><div className="portal-filter-row"><span className="portal-filter-chip portal-filter-chip--active">Todas las órdenes</span><span className="portal-filter-chip">En proceso</span><span className="portal-filter-chip">Urgentes</span><span className="portal-filter-chip">Atrasadas</span></div><section className="portal-panel portal-panel--flush">{query.isPending ? <LoadingRows count={7} /> : query.data?.data.map((job) => <ProductionRow key={job.id} job={job} />)}{!query.isPending && !query.data?.data.length ? <EmptyPanel text="No hay órdenes de producción disponibles." /> : null}</section></div>;
}

function ProductionDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operaciones", "produccion", id], queryFn: () => productionService.getJobById(id) });
  const mutation = useMutation({ mutationFn: async (action: "start" | "pause" | "complete") => action === "start" ? productionService.startJob(id) : action === "pause" ? productionService.pauseJob(id) : productionService.completeJob(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "produccion", id] }) });
  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) return <ErrorPanel text="No se pudo cargar la orden de producción." />;
  const job = query.data;
  return <div className="portal-stack"><BackLink href={PORTAL_ROUTES.produccion} /><PageIntro eyebrow={`Orden ${job.code}`} title={job.project?.title ?? "Trabajo de producción"} description="Ejecuta la orden paso a paso. Cada transición queda registrada con usuario y hora." /><div className="portal-detail-grid"><section className="portal-panel"><PanelHeading title="Estado de la orden" subtitle={`Prioridad ${formatOperationalLabel(job.priority)} · ${formatDate(job.plannedEndDate)}`} /><div className="portal-detail-status"><Badge value={job.status} /><div className="portal-progress"><span style={{ width: `${job.taskCount ? (job.completedTaskCount / job.taskCount) * 100 : 0}%` }} /></div><strong>{job.completedTaskCount}/{job.taskCount} tareas</strong></div><div className="portal-action-row">{job.status === "READY" || job.status === "PAUSED" ? <button className="portal-primary-button" disabled={mutation.isPending} onClick={() => mutation.mutate("start")} type="button"><ArrowRight size={17} /> Iniciar</button> : null}{job.status === "IN_PROGRESS" ? <button className="portal-secondary-button" disabled={mutation.isPending} onClick={() => mutation.mutate("pause")} type="button"><Clock3 size={17} /> Pausar</button> : null}{job.status === "IN_PROGRESS" || job.status === "PAUSED" ? <button className="portal-success-button" disabled={mutation.isPending} onClick={() => mutation.mutate("complete")} type="button"><Check size={17} /> Completar</button> : null}</div></section><section className="portal-panel"><PanelHeading title="Tareas de la orden" subtitle="Secuencia operativa" />{job.tasks.map((task) => <div className="portal-check-row" key={task.id}><span className={cn("portal-check", task.status === "COMPLETED" && "portal-check--done")}>{task.status === "COMPLETED" ? <Check size={14} /> : null}</span><div><p className="font-semibold">{task.title}</p><p className="text-xs text-[color:var(--portal-muted)]">{formatOperationalLabel(task.taskType)} · {formatOperationalLabel(task.status)}</p></div><span className="ml-auto text-xs text-[color:var(--portal-muted)]">{task.assignedToUser?.name ?? "Sin asignar"}</span></div>)}{job.tasks.length === 0 ? <EmptyPanel text="La orden aún no tiene tareas generadas." /> : null}</section></div><section className="portal-panel"><PanelHeading title="Materiales y control" subtitle="Datos disponibles para ejecutar sin exponer costos" /><div className="portal-mini-grid"><MiniMetric label="Materiales consumidos" value={String(job.consumptionCount)} /><MiniMetric label="Controles de calidad" value={String(job.qualityCheckCount)} /><MiniMetric label="Tareas pendientes" value={String(job.pendingTaskCount)} /></div></section></div>;
}

function MeasurementsPage() {
  const query = useQuery({ queryKey: ["operaciones", "mediciones", "lista"], queryFn: () => measurementService.listRequests({ page: 1, perPage: 100, sortBy: "scheduledDate", sortDirection: "asc" }) });
  return <div className="portal-stack"><PageIntro eyebrow="Operaciones · Campo" title="Mediciones" description="Agenda técnica para llegar preparado, capturar medidas en milímetros y enviar a revisión." /><section className="portal-panel portal-panel--flush">{query.isPending ? <LoadingRows count={6} /> : query.data?.data.map((item) => <ScheduleRow key={item.id} icon={MapPin} label={item.client.displayName} title={item.project?.title ?? "Visita técnica"} date={item.scheduledDate} status={item.status} href={`${PORTAL_ROUTES.mediciones}/${item.id}`} meta={`${item.scheduledStartTime ?? ""} ${item.address?.address ?? ""}`} />)}{!query.isPending && !query.data?.data.length ? <EmptyPanel text="No hay mediciones en la agenda." /> : null}</section></div>;
}

function MeasurementDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operaciones", "medicion", id], queryFn: () => measurementService.getRequestById(id) });
  const startMutation = useMutation({ mutationFn: () => measurementService.startVisit(id, { generalObservations: null, locationConfirmed: false }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "medicion", id] }) });
  const submitMutation = useMutation({ mutationFn: () => measurementService.submitForApproval(id, { notes: "Enviado desde Portal Operativo", result: "READY_FOR_APPROVAL" }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "medicion", id] }) });
  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) return <ErrorPanel text="No se pudo cargar la medición." />;
  const item = query.data;
  const mapUrl = item.address?.latitude && item.address?.longitude ? `https://www.google.com/maps/search/?api=1&query=${item.address.latitude},${item.address.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address?.address ?? "")}`;
  return <div className="portal-stack"><BackLink href={PORTAL_ROUTES.mediciones} /><PageIntro eyebrow="Visita técnica" title={item.project?.title ?? item.client.displayName} description={`${item.address?.address ?? "Dirección sin registrar"} · ${formatDate(item.scheduledDate)}`} action={<a className="portal-secondary-button" href={mapUrl} rel="noreferrer" target="_blank"><LocateFixed size={17} /> Abrir ubicación</a>} /><section className="portal-panel"><div className="portal-detail-status"><Badge value={item.status} /><span className="text-sm text-[color:var(--portal-muted)]">Técnico: {item.assignedTechnician?.name ?? "Sin asignar"}</span></div><div className="portal-action-row">{["SCHEDULED", "REQUESTED", "RESCHEDULED"].includes(item.status) ? <button className="portal-primary-button" disabled={startMutation.isPending} onClick={() => startMutation.mutate()} type="button"><MapPin size={17} /> Confirmar llegada</button> : null}{["REGISTERED", "WITH_OBSERVATIONS", "IN_VISIT"].includes(item.status) ? <button className="portal-success-button" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate()} type="button"><ArrowUpRight size={17} /> Enviar a revisión</button> : null}</div></section><div className="portal-grid-2"><section className="portal-panel"><PanelHeading title="Medidas registradas" subtitle="Unidad base: milímetros" />{item.visits?.flatMap((visit) => visit.openings).map((opening) => <div className="portal-measure-row" key={opening.id}><div><p className="font-semibold">{opening.environment} · {formatOperationalLabel(opening.elementType)}</p><p className="text-xs text-[color:var(--portal-muted)]">{opening.code}</p></div><strong>{opening.widthMm} × {opening.heightMm} mm</strong><span className="text-xs">× {opening.quantity}</span></div>)}{!item.visits?.flatMap((visit) => visit.openings).length ? <EmptyPanel text="Agrega la primera medida desde el formulario técnico." /> : null}</section><section className="portal-panel"><PanelHeading title="Evidencias y observaciones" subtitle="El registro acompaña la visita" />{item.visits?.flatMap((visit) => visit.evidence).map((evidence) => <div className="portal-file-row" key={evidence.id}><Camera size={16} /><span>{evidence.fileName}</span><span className="ml-auto text-xs">{formatDate(evidence.uploadedAt)}</span></div>)}{item.visits?.flatMap((visit) => visit.observations).map((observation) => <div className="portal-note-row" key={observation.id}><AlertTriangle size={16} /><span>{observation.description}</span></div>)}{!item.visits?.flatMap((visit) => [...visit.evidence, ...visit.observations]).length ? <EmptyPanel text="Todavía no hay evidencias ni observaciones." /> : null}</section></div></div>;
}

function InstallationsPage() {
  const query = useQuery({ queryKey: ["operaciones", "instalaciones", "lista"], queryFn: () => installationService.listOrders({ page: 1, perPage: 100, sortBy: "scheduledDate", sortDirection: "asc" }) });
  return <div className="portal-stack"><PageIntro eyebrow="Operaciones · Obra" title="Instalaciones" description="Agenda de obra, equipo asignado y acciones de ejecución con evidencias." /><section className="portal-panel portal-panel--flush">{query.isPending ? <LoadingRows count={6} /> : query.data?.data.map((item) => <ScheduleRow key={item.id} icon={Truck} label={item.client.displayName} title={item.project?.title ?? item.code} date={item.scheduledDate} status={item.status} href={`${PORTAL_ROUTES.instalaciones}/${item.id}`} meta={`${item.scheduledStartTime ?? ""} – ${item.scheduledEndTime ?? ""}`} />)}{!query.isPending && !query.data?.data.length ? <EmptyPanel text="No hay instalaciones en la agenda." /> : null}</section></div>;
}

function InstallationDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operaciones", "instalacion", id], queryFn: () => installationService.getOrderById(id) });
  const mutation = useMutation({ mutationFn: (status: "EN_ROUTE" | "IN_INSTALLATION" | "COMPLETED") => installationService.changeOrderStatus(id, { notes: null, status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "instalacion", id] }) });
  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) return <ErrorPanel text="No se pudo cargar la instalación." />;
  const order = query.data;
  return <div className="portal-stack"><BackLink href={PORTAL_ROUTES.instalaciones} /><PageIntro eyebrow={`Orden ${order.code}`} title={order.project?.title ?? order.client.displayName} description={`${order.address?.address ?? "Dirección sin registrar"} · ${formatDate(order.scheduledDate)}`} action={<a className="portal-secondary-button" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address?.address ?? "")}`} rel="noreferrer" target="_blank"><LocateFixed size={17} /> Navegar</a>} /><section className="portal-panel"><div className="portal-detail-status"><Badge value={order.status} /><span className="text-sm text-[color:var(--portal-muted)]">Equipo: {order.assignedTeam?.name ?? "Sin equipo asignado"}</span></div><div className="portal-action-row">{order.status === "SCHEDULED" ? <button className="portal-primary-button" onClick={() => mutation.mutate("EN_ROUTE")} type="button"><Truck size={17} /> En ruta</button> : null}{order.status === "EN_ROUTE" ? <button className="portal-primary-button" onClick={() => mutation.mutate("IN_INSTALLATION")} type="button"><ArrowRight size={17} /> Iniciar instalación</button> : null}{order.status === "IN_INSTALLATION" || order.status === "WITH_OBSERVATIONS" ? <button className="portal-success-button" onClick={() => mutation.mutate("COMPLETED")} type="button"><Check size={17} /> Completar instalación</button> : null}</div></section><div className="portal-grid-2"><section className="portal-panel"><PanelHeading title="Lista de tareas" subtitle="Completa cada paso antes del cierre" />{order.tasks.map((task) => <div className="portal-check-row" key={task.id}><span className={cn("portal-check", task.status === "COMPLETED" && "portal-check--done")}>{task.status === "COMPLETED" ? <Check size={14} /> : null}</span><div><p className="font-semibold">{task.title}</p><p className="text-xs text-[color:var(--portal-muted)]">{formatOperationalLabel(task.status)}</p></div>{task.status !== "COMPLETED" ? <button className="portal-link-button ml-auto" onClick={() => installationService.completeTask(task.id)} type="button">Completar</button> : null}</div>)}</section><section className="portal-panel"><PanelHeading title="Evidencias" subtitle="Fotografías y archivos de la obra" />{order.evidence.map((evidence) => <div className="portal-file-row" key={evidence.id}><Camera size={16} /><span>{evidence.fileName}</span><span className="ml-auto text-xs">{formatDate(evidence.uploadedAt)}</span></div>)}{!order.evidence.length ? <EmptyPanel text="Aún no hay evidencias adjuntas." /> : null}</section></div></div>;
}

function IncidentsPage() {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [description, setDescription] = useState("");
  const orders = useQuery({ queryKey: ["operaciones", "incidencias", "ordenes"], queryFn: () => installationService.listOrders({ page: 1, perPage: 100, sortBy: "createdAt", sortDirection: "desc" }) });
  const create = useMutation({ mutationFn: () => installationService.createIssue(selectedOrderId, { description, severity: "MEDIUM", type: "OTHER" }), onSuccess: () => { setDescription(""); setSelectedOrderId(""); } });
  const openOrders = orders.data?.data.filter((order) => order.openIssueCount > 0) ?? [];
  return <div className="portal-stack"><PageIntro eyebrow="Control operativo" title="Incidencias" description="Reporta problemas de material, acceso o ejecución y mantén el contexto de la orden." /><div className="portal-grid-2"><section className="portal-panel"><PanelHeading title="Incidencias abiertas" subtitle="Órdenes que requieren atención" />{openOrders.map((order) => <Link className="portal-data-row" href={`${PORTAL_ROUTES.instalaciones}/${order.id}`} key={order.id}><span className="portal-data-icon portal-data-icon--amber"><ShieldAlert size={18} /></span><div className="min-w-0 flex-1"><p className="portal-row-title">{order.code} · {order.project?.title ?? order.client.displayName}</p><p className="portal-row-meta">{order.openIssueCount} incidencia(s) · {formatOperationalLabel(order.status)}</p></div><ArrowRight size={16} /></Link>)}{!openOrders.length ? <EmptyPanel text="No hay incidencias abiertas en las instalaciones visibles." /> : null}</section><section className="portal-panel"><PanelHeading title="Reportar incidencia" subtitle="Queda asociada a una orden de instalación" /><form className="portal-form-stack" onSubmit={(event) => { event.preventDefault(); if (selectedOrderId && description.trim()) create.mutate(); }}><label className="portal-field-label">Orden relacionada<select className="portal-input" onChange={(event) => setSelectedOrderId(event.target.value)} required value={selectedOrderId}><option value="">Selecciona una orden</option>{orders.data?.data.map((order) => <option key={order.id} value={order.id}>{order.code} · {order.project?.title ?? order.client.displayName}</option>)}</select></label><label className="portal-field-label">Descripción<textarea className="portal-input portal-textarea" onChange={(event) => setDescription(event.target.value)} placeholder="Describe qué ocurrió y qué atención requiere." required value={description} /></label><button className="portal-primary-button" disabled={create.isPending || !selectedOrderId} type="submit"><ShieldAlert size={17} /> {create.isPending ? "Registrando…" : "Registrar incidencia"}</button></form></section></div></div>;
}

function QualityPage() {
  const query = useQuery({ queryKey: ["operaciones", "calidad", "lista"], queryFn: () => productionService.listJobs({ page: 1, perPage: 100, sortBy: "updatedAt", sortDirection: "desc" }) });
  const jobs = query.data?.data.filter((job) => job.qualityCheckCount > 0 || job.status === "IN_PROGRESS" || job.status === "COMPLETED") ?? [];
  return <div className="portal-stack"><PageIntro eyebrow="Control operativo" title="Control de calidad" description="Revisa controles vinculados a órdenes reales de producción y deja el resultado trazable." /><section className="portal-panel portal-panel--flush">{query.isPending ? <LoadingRows count={6} /> : jobs.map((job) => <Link className="portal-data-row" href={`${PORTAL_ROUTES.calidad}/${job.id}`} key={job.id}><span className="portal-data-icon portal-data-icon--green"><ClipboardCheck size={18} /></span><div className="min-w-0 flex-1"><p className="portal-row-title">{job.code} · {job.project?.title ?? "Orden de producción"}</p><p className="portal-row-meta">{job.qualityCheckCount} control(es) · {job.pendingTaskCount} tareas pendientes</p></div><Badge value={job.status} /><ArrowRight size={16} /></Link>)}{!query.isPending && !jobs.length ? <EmptyPanel text="No hay controles de calidad pendientes o registrados." /> : null}</section></div>;
}

function QualityDetailPage({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["operaciones", "calidad", id], queryFn: () => productionService.getJobById(id) });
  const record = useMutation({ mutationFn: (status: "PASSED" | "FAILED" | "REWORK_REQUIRED") => productionService.recordQualityCheck(id, { status, notes: status === "PASSED" ? "Control conforme desde Portal Operativo" : "Revisar y corregir antes de continuar." }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "calidad", id] }) });
  if (query.isPending) return <LoadingPage />;
  if (query.isError || !query.data) return <ErrorPanel text="No se pudo cargar el control de calidad." />;
  return <div className="portal-stack"><BackLink href={PORTAL_ROUTES.calidad} /><PageIntro eyebrow={`Calidad · ${query.data.code}`} title={query.data.project?.title ?? "Orden de producción"} description="Completa o confirma el resultado del control. Los rechazos mantienen la orden en revisión." /><section className="portal-panel"><PanelHeading title="Controles registrados" subtitle="Historial de ejecución y resultado" />{query.data.qualityChecks.map((check) => <div className="portal-check-row" key={check.id}><span className={cn("portal-check", check.status === "PASSED" && "portal-check--done")}>{check.status === "PASSED" ? <Check size={14} /> : null}</span><div><p className="font-semibold">{formatOperationalLabel(check.status)}</p><p className="text-xs text-[color:var(--portal-muted)]">{check.notes ?? "Sin observaciones"} · {formatDateTime(check.checkedAt ?? check.createdAt)}</p></div></div>)}{!query.data.qualityChecks.length ? <EmptyPanel text="Todavía no hay controles registrados para esta orden." /> : null}<div className="portal-action-row"><button className="portal-success-button" disabled={record.isPending} onClick={() => record.mutate("PASSED")} type="button"><Check size={17} /> Marcar conforme</button><button className="portal-secondary-button" disabled={record.isPending} onClick={() => record.mutate("REWORK_REQUIRED")} type="button"><RefreshCw size={17} /> Solicitar corrección</button><button className="portal-secondary-button" disabled={record.isPending} onClick={() => record.mutate("FAILED")} type="button"><XCircle size={17} /> Marcar no conforme</button></div></section></div>;
}

function SupervisionPage() {
  const summary = useQuery({ queryKey: ["operaciones", "supervision", "resumen"], queryFn: operationalPortalService.getSummary });
  const jobs = useQuery({ queryKey: ["operaciones", "supervision", "produccion"], queryFn: () => productionService.listJobs({ page: 1, perPage: 12, sortBy: "updatedAt", sortDirection: "desc" }) });
  return <div className="portal-stack"><PageIntro eyebrow="Control operativo" title="Supervisión" description="Una vista de carga y alertas operativas para priorizar el turno sin exponer información financiera." /><div className="portal-kpi-grid"><KpiCard icon={UserRound} label="Tareas asignadas" value={summary.data?.tareasAsignadas ?? "—"} tone="blue" href={PORTAL_ROUTES.tareas} /><KpiCard icon={Clock3} label="Tareas pendientes" value={summary.data?.tareasPendientes ?? "—"} tone="amber" href={PORTAL_ROUTES.tareas} /><KpiCard icon={ShieldAlert} label="Avisos sin leer" value={summary.data?.notificaciones ?? "—"} tone="orange" href={PORTAL_ROUTES.notificaciones} /><KpiCard icon={Factory} label="Órdenes activas" value={summary.data?.ordenesProduccion ?? "—"} tone="green" href={PORTAL_ROUTES.produccion} /></div><section className="portal-panel portal-panel--flush"><PanelHeading title="Producción en curso" subtitle="Ordenadas por última actividad" href={PORTAL_ROUTES.produccion} />{jobs.data?.data.map((job) => <ProductionRow key={job.id} job={job} />)}{!jobs.isPending && !jobs.data?.data.length ? <EmptyPanel text="No hay actividad productiva visible." /> : null}</section></div>;
}

function NotificationsPage() {
  const query = useQuery({ queryKey: ["operaciones", "notificaciones"], queryFn: () => notificationService.listNotifications({ page: 1, perPage: 50 }) });
  const queryClient = useQueryClient();
  const mark = useMutation({ mutationFn: notificationService.markRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["operaciones", "notificaciones"] }) });
  return <div className="portal-stack"><PageIntro eyebrow="Centro de avisos" title="Notificaciones" description="Cambios de responsables, tareas urgentes, faltantes y revisiones pendientes." /><section className="portal-panel portal-panel--flush">{query.isPending ? <LoadingRows count={5} /> : query.data?.data.map((item) => <div className={cn("portal-notification-row", !item.isRead && "portal-notification-row--unread")} key={item.id}><div className="portal-notification-icon"><BellIcon type={item.type} /></div><div className="min-w-0 flex-1"><p className="font-bold">{item.title}</p><p className="portal-row-meta">{item.message}</p><p className="mt-2 text-xs text-[color:var(--portal-muted)]">{formatDateTime(item.createdAt)}</p></div>{!item.isRead ? <button className="portal-link-button" onClick={() => mark.mutate(item.id)} type="button">Marcar leída</button> : <span className="text-xs text-[color:var(--portal-muted)]">Leída</span>}</div>)}{!query.isPending && !query.data?.data.length ? <EmptyPanel text="No tienes avisos nuevos." /> : null}</section></div>;
}

function ProfilePage() { return <div className="portal-stack"><PageIntro eyebrow="Cuenta" title="Mi perfil" description="Tu identidad de usuario es la misma del ERP principal." /><section className="portal-profile-card"><div className="portal-profile-avatar"><UserRound size={34} /></div><div><p className="portal-panel-label">Sesión operativa</p><h2 className="portal-panel-title">Perfil administrado desde el ERP</h2><p className="portal-panel-copy">Para cambiar nombre, contraseña o avatar, continúa en el perfil general de tu cuenta.</p><Link className="portal-primary-button" href="/profile">Abrir perfil de cuenta <ArrowRight size={17} /></Link></div></section></div>; }

function ComingSoonPage({ title }: { title: string }) { return <div className="portal-stack"><PageIntro eyebrow="Control operativo" title={title} description="Esta vista se apoya en las entidades existentes del ERP y se habilita según los permisos de tu usuario." /><section className="portal-empty-feature"><ShieldAlert size={26} /><h2>Área protegida por permisos</h2><p>Si necesitas trabajar aquí, solicita el permiso correspondiente a supervisión o administración.</p></section></div>; }

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <header className="portal-page-intro"><div><p className="portal-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="portal-page-description">{description}</p></div>{action ? <div className="portal-intro-action">{action}</div> : null}</header>; }
function PanelHeading({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) { return <div className="portal-panel-heading"><div><h2 className="portal-panel-title">{title}</h2>{subtitle ? <p className="portal-panel-copy">{subtitle}</p> : null}</div>{href ? <Link className="portal-panel-link" href={href}>Ver todo <ArrowRight size={15} /></Link> : null}</div>; }
function KpiCard({ icon: Icon, label, value, tone, href }: { icon: typeof Home; label: string; value: string | number; tone: string; href: string }) { return <Link className={cn("portal-kpi-card", `portal-kpi-card--${tone}`)} href={href}><div className="portal-kpi-icon"><Icon size={19} /></div><div><p>{label}</p><strong>{value}</strong></div><ArrowUpRight className="portal-kpi-arrow" size={17} /></Link>; }
function QuickAction({ icon: Icon, title, text, href }: { icon: typeof Home; title: string; text: string; href: string }) { return <Link className="portal-quick-action" href={href}><span className="portal-quick-icon"><Icon size={19} /></span><span><strong>{title}</strong><small>{text}</small></span><ArrowRight className="ml-auto" size={17} /></Link>; }
function WorkRow({ href, code, title, status, meta, priority }: { href: string; code: string; title: string; status: string; meta: string; priority: string }) { return <Link className="portal-work-row" href={href}><span className="portal-work-code">{code}</span><span className="min-w-0 flex-1"><strong className="truncate">{title}</strong><small>{meta}</small></span><Badge value={priority} /><Badge value={status} /></Link>; }
function ScheduleRow({ icon: Icon, label, title, date, status, href, meta }: { icon: typeof Home; label: string; title: string; date: string | null; status: string; href: string; meta?: string | null }) { return <Link className="portal-schedule-row" href={href}><span className="portal-schedule-icon"><Icon size={18} /></span><span className="min-w-0 flex-1"><small>{label}</small><strong className="truncate">{title}</strong><em>{meta || formatDate(date)}</em></span><Badge value={status} /></Link>; }
function StockRow({ item }: { item: Awaited<ReturnType<typeof inventoryService.listStock>>["data"][number] }) { return <div className="portal-data-row"><span className="portal-data-icon"><Boxes size={18} /></span><div className="min-w-0 flex-1"><p className="portal-row-title">{item.material.name}</p><p className="portal-row-meta">{item.material.code} · {item.warehouse.name} · {item.locationCode ?? "Sin ubicación"}</p></div><div className="text-right"><strong>{item.availableQuantity}</strong><p className="text-xs text-[color:var(--portal-muted)]">{formatOperationalLabel(item.unit)}</p></div><Badge value={item.condition} /></div>; }
function MovementRow({ item }: { item: Awaited<ReturnType<typeof inventoryService.listMovements>>["data"][number] }) { return <div className="portal-data-row"><span className={cn("portal-data-icon", item.movementType === "IN" ? "portal-data-icon--green" : "portal-data-icon--amber")}><ArrowDownToLine size={18} /></span><div className="min-w-0 flex-1"><p className="portal-row-title">{item.material.name}</p><p className="portal-row-meta">{item.warehouse.name} · {item.reason ?? "Sin motivo registrado"}</p></div><strong>{item.quantity} {formatOperationalLabel(item.unit)}</strong><div className="text-right"><Badge value={item.movementType} /><p className="mt-1 text-xs text-[color:var(--portal-muted)]">{formatDateTime(item.createdAt)}</p></div></div>; }
function ReservationRow({ item }: { item: Awaited<ReturnType<typeof inventoryService.listReservations>>["data"][number] }) { return <div className="portal-data-row"><span className="portal-data-icon portal-data-icon--blue"><PackageCheck size={18} /></span><div className="min-w-0 flex-1"><p className="portal-row-title">{item.material.name}</p><p className="portal-row-meta">{item.project?.code ?? "Sin proyecto"} · {item.warehouse.name}</p></div><strong>{item.quantity} {formatOperationalLabel(item.unit)}</strong><Badge value={item.status} /></div>; }
function ProductionRow({ job }: { job: Awaited<ReturnType<typeof productionService.listJobs>>["data"][number] }) { return <Link className="portal-data-row" href={`${PORTAL_ROUTES.produccion}/${job.id}`}><span className="portal-data-icon portal-data-icon--amber"><Factory size={18} /></span><div className="min-w-0 flex-1"><p className="portal-row-title">{job.code} · {job.project?.title ?? "Orden sin proyecto"}</p><p className="portal-row-meta">{job.pendingTaskCount} tareas pendientes · {formatDate(job.plannedEndDate)}</p></div><Badge value={job.priority} /><Badge value={job.status} /><ArrowRight size={16} /></Link>; }
function Badge({ value }: { value: string }) { return <span className={cn("portal-badge", value === "URGENT" || value === "CRITICAL" || value === "FAILED" ? "portal-badge--danger" : value === "COMPLETED" || value === "APPROVED" || value === "IN" ? "portal-badge--success" : value === "IN_PROGRESS" || value === "PAUSED" || value === "HIGH" ? "portal-badge--warning" : "portal-badge--neutral")}>{formatOperationalLabel(value)}</span>; }
function MiniMetric({ label, value }: { label: string; value: string }) { return <div className="portal-mini-metric"><span>{label}</span><strong>{value}</strong></div>; }
function BellIcon({ type }: { type: string }) { return type === "ERROR" || type === "WARNING" ? <AlertTriangle size={17} /> : <Bell size={17} />; }
function BackLink({ href }: { href: string }) { return <Link className="portal-back-link" href={href}><ArrowRight size={15} className="rotate-180" /> Volver al listado</Link>; }
function LoadingRows({ count = 4 }: { count?: number }) { return <div className="portal-loading-list">{Array.from({ length: count }, (_, index) => <div className="portal-skeleton-row" key={index}><span /><div><i /><i /></div><b /></div>)}</div>; }
function LoadingPage() { return <div className="portal-stack"><div className="portal-loading-block" /><LoadingRows count={6} /></div>; }
function EmptyPanel({ text }: { text: string }) { return <div className="portal-empty-panel"><PackageSearch size={22} /><p>{text}</p></div>; }
function ErrorPanel({ text }: { text: string }) { return <div className="portal-empty-panel portal-empty-panel--error"><XCircle size={22} /><p>{text}</p><button className="portal-link-button" onClick={() => window.location.reload()} type="button"><RefreshCw size={15} /> Reintentar</button></div>; }
