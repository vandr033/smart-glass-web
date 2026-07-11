"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  FileSpreadsheet,
  FileText,
  Filter,
  Gauge,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ExportMenu } from "@/components/ui/export-menu";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  formatDateValue,
  secondaryButtonClassName,
  sectionClassName,
} from "@/modules/commercial/ui";
import { clientService } from "@/services/client-service";
import { inventoryService } from "@/services/inventory-service";
import { projectService } from "@/services/project-service";
import { tablerosService } from "@/services/tableros-service";
import { userService } from "@/services/user-service";

import {
  BarrasComparativas,
  ChartPanel,
  DonaDistribucion,
  LineaPeriodos,
  RankingListado,
  TablaComparativa,
  TablaIndicadores,
  TarjetasResumen,
} from "../charts";
import {
  INDICADORES_PERMISSIONS,
  REPORTES_BI_PERMISSIONS,
  TABLEROS_PERMISSIONS,
  TABLEROS_QUERY_KEYS,
} from "../constants";
import {
  exportarDatosBaseExcel,
  exportarIndicadoresExcel,
  exportarPanelEjecutivoPdf,
  exportarReporteComercialPdf,
  exportarReporteFinancieroPdf,
  exportarReporteOperativoPdf,
  exportarReportePostventaPdf,
} from "../exports";
import { formatTableroValue, traducirEtiquetaVisible } from "../ui";

type TableroFilters = {
  clientId: string;
  dateFrom: string;
  dateTo: string;
  projectId: string;
  responsibleId: string;
  salesUserId: string;
  status: string;
  warehouseId: string;
};

const buildIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const buildCurrentMonthFilters = (): TableroFilters => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    clientId: "",
    dateFrom: buildIsoDate(monthStart),
    dateTo: buildIsoDate(today),
    projectId: "",
    responsibleId: "",
    salesUserId: "",
    status: "",
    warehouseId: "",
  };
};

const STATUS_OPTIONS = Array.from(
  new Set([
    "LEAD",
    "MEASUREMENT_PENDING",
    "QUOTATION_PENDING",
    "QUOTED",
    "APPROVED",
    "PURCHASE_PENDING",
    "PRODUCTION_PENDING",
    "IN_PRODUCTION",
    "INSTALLATION_PENDING",
    "IN_INSTALLATION",
    "COMPLETED",
    "CANCELLED",
    "ON_HOLD",
    "DRAFT",
    "PENDING_APPROVAL",
    "SENT",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "READY",
    "IN_PROGRESS",
    "PAUSED",
    "SCHEDULED",
    "EN_ROUTE",
    "WITH_OBSERVATIONS",
    "RESCHEDULED",
    "REPORTADO",
    "EN_REVISION",
    "VISITA_PROGRAMADA",
    "EN_ATENCION",
    "PENDIENTE_REPUESTO",
    "RESUELTO",
    "CERRADO",
  ]),
);

function SectionHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
        Analisis
      </p>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-950">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">{description}</p>
      </div>
    </div>
  );
}

export default function TablerosHomePage() {
  const { permissions } = usePermissions();
  const [filters, setFilters] = useState<TableroFilters>(buildCurrentMonthFilters);
  const [appliedFilters, setAppliedFilters] = useState<TableroFilters>(buildCurrentMonthFilters);
  const canExport =
    permissions.includes(TABLEROS_PERMISSIONS.exportar) ||
    permissions.includes(REPORTES_BI_PERMISSIONS.exportar) ||
    permissions.includes(TABLEROS_PERMISSIONS.legadoExportar);
  const canSeeIndicators =
    permissions.includes(TABLEROS_PERMISSIONS.ver) ||
    permissions.includes(INDICADORES_PERMISSIONS.ver) ||
    permissions.includes(REPORTES_BI_PERMISSIONS.ver) ||
    permissions.includes(TABLEROS_PERMISSIONS.legadoVer);

  const panelQuery = useQuery({
    queryFn: () => tablerosService.getPanelEjecutivo(appliedFilters),
    queryKey: TABLEROS_QUERY_KEYS.panel(appliedFilters),
    staleTime: 60_000,
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
    queryKey: ["tableros", "clientes"],
    staleTime: 60_000,
  });

  const projectsQuery = useQuery({
    queryFn: async () => {
      const result = await projectService.listProjects({
        clientId: filters.clientId || undefined,
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["tableros", "proyectos", filters.clientId],
    staleTime: 60_000,
  });

  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["tableros", "usuarios"],
    staleTime: 60_000,
  });

  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses({ status: "ACTIVE" }),
    queryKey: ["tableros", "almacenes"],
    staleTime: 60_000,
  });

  if (panelQuery.isPending) {
    return <LoadingState cards={10} title="Cargando tableros ejecutivos" />;
  }

  if (panelQuery.isError) {
    return (
      <ErrorState
        action={(
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void panelQuery.refetch();
            }}
            type="button"
          >
            Intentar de nuevo
          </button>
        )}
        description={
          panelQuery.error.message ||
          "No se pudo consolidar la informacion gerencial del periodo seleccionado."
        }
        title="No se pudo abrir el panel ejecutivo"
      />
    );
  }

  const data = panelQuery.data;

  if (!canSeeIndicators || data.indicadores.length === 0) {
    return (
      <EmptyState
        description="No se encontraron indicadores para los filtros seleccionados o tu rol actual no tiene visibilidad suficiente."
        title="No hay indicadores disponibles"
      />
    );
  }

  const clients = clientsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];

  const selectedClient =
    clients.find((item) => item.id === data.filtrosAplicados.clientId)?.displayName ??
    "Todos los clientes";
  const selectedProject =
    projects.find((item) => item.id === data.filtrosAplicados.projectId)?.title ??
    (data.filtrosAplicados.projectId ? "Proyecto seleccionado" : "Todos los proyectos");
  const selectedSeller =
    users.find((item) => item.id === data.filtrosAplicados.salesUserId)?.name ??
    "Todos los vendedores";
  const selectedResponsible =
    users.find((item) => item.id === data.filtrosAplicados.responsibleId)?.name ??
    "Todos los responsables";
  const selectedWarehouse =
    warehouses.find((item) => item.id === data.filtrosAplicados.warehouseId)?.name ??
    "Todos los almacenes";
  const selectedStatus = data.filtrosAplicados.status
    ? traducirEtiquetaVisible(data.filtrosAplicados.status)
    : "Todos los estados";

  const reportActionsById = {
    "datos-base-excel": {
      icon: FileSpreadsheet,
      onClick: () => exportarDatosBaseExcel(data),
    },
    "indicadores-excel": {
      icon: FileSpreadsheet,
      onClick: () => exportarIndicadoresExcel(data),
    },
    "reporte-comercial-pdf": {
      icon: FileText,
      onClick: () => exportarReporteComercialPdf(data),
    },
    "reporte-ejecutivo-pdf": {
      icon: FileText,
      onClick: () => exportarPanelEjecutivoPdf(data),
    },
    "reporte-financiero-pdf": {
      icon: FileText,
      onClick: () => exportarReporteFinancieroPdf(data),
    },
    "reporte-operativo-pdf": {
      icon: FileText,
      onClick: () => exportarReporteOperativoPdf(data),
    },
    "reporte-postventa-pdf": {
      icon: FileText,
      onClick: () => exportarReportePostventaPdf(data),
    },
  } as const;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={(
          <>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void panelQuery.refetch();
              }}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              {panelQuery.isFetching ? "Actualizando" : "Actualizar datos"}
            </button>
            {canExport ? (
              <ExportMenu
                actions={data.reportes
                  .map((report) => {
                    const action = reportActionsById[
                      report.id as keyof typeof reportActionsById
                    ];

                    if (!action) {
                      return null;
                    }

                    return {
                      icon: action.icon,
                      id: report.id,
                      label: report.nombre,
                      onClick: action.onClick,
                    };
                  })
                  .filter((action): action is NonNullable<typeof action> => Boolean(action))}
                buttonClassName={secondaryButtonClassName}
                label="Exportar reportes"
              />
            ) : null}
          </>
        )}
        description="Vista consolidada de ventas, cotizaciones, compras, inventario, produccion, instalaciones, rentabilidad, garantias y postventa para seguimiento gerencial."
        eyebrow="Vidriera Sebitas ERP"
        title="Tableros ejecutivos"
      />

      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Filtros globales
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Panel ejecutivo principal
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Ajusta el periodo y el alcance del analisis para comparar indicadores
              comerciales, operativos, financieros, de inventario y postventa.
            </p>
          </div>
          <div className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-stone-600">
            <p className="font-semibold text-stone-900">Ultima consolidacion</p>
            <p className="mt-1">{formatDateValue(data.actualizadoEn)}</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedFilters(filters);
          }}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Fecha desde</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    dateFrom: event.target.value,
                  }));
                }}
                type="date"
                value={filters.dateFrom}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Fecha hasta</span>
              <input
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    dateTo: event.target.value,
                  }));
                }}
                type="date"
                value={filters.dateTo}
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Cliente</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    clientId: event.target.value,
                    projectId: "",
                  }));
                }}
                value={filters.clientId}
              >
                <option value="">Todos los clientes</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Proyecto</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    projectId: event.target.value,
                  }));
                }}
                value={filters.projectId}
              >
                <option value="">Todos los proyectos</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} - {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Vendedor</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    salesUserId: event.target.value,
                  }));
                }}
                value={filters.salesUserId}
              >
                <option value="">Todos los vendedores</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Responsable</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    responsibleId: event.target.value,
                  }));
                }}
                value={filters.responsibleId}
              >
                <option value="">Todos los responsables</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Estado</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value,
                  }));
                }}
                value={filters.status}
              >
                <option value="">Todos los estados</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {traducirEtiquetaVisible(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-stone-700">Sucursal o almacen</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    warehouseId: event.target.value,
                  }));
                }}
                value={filters.warehouseId}
              >
                <option value="">Todos los almacenes</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className={secondaryButtonClassName} type="submit">
              <Filter className="h-4 w-4" />
              Aplicar filtros
            </button>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                const nextFilters = buildCurrentMonthFilters();

                setFilters(nextFilters);
                setAppliedFilters(nextFilters);
              }}
              type="button"
            >
              Limpiar filtros
            </button>
            <p className="text-sm text-stone-500">
              Periodo visible: {data.filtrosAplicados.dateFrom} a {data.filtrosAplicados.dateTo}
            </p>
          </div>
        </form>
      </section>

      <TarjetasResumen cards={data.tarjetas} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartPanel
          description="Resumen del alcance actual del analisis para que gerencia entienda con exactitud que datos se estan comparando."
          title="Cobertura del panel"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {[
              {
                etiqueta: "Cliente",
                valor: selectedClient,
              },
              {
                etiqueta: "Proyecto",
                valor: selectedProject,
              },
              {
                etiqueta: "Vendedor",
                valor: selectedSeller,
              },
              {
                etiqueta: "Responsable",
                valor: selectedResponsible,
              },
              {
                etiqueta: "Estado",
                valor: selectedStatus,
              },
              {
                etiqueta: "Sucursal o almacen",
                valor: selectedWarehouse,
              },
            ].map((item) => (
              <article
                key={item.etiqueta}
                className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  {item.etiqueta}
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-950">{item.valor}</p>
              </article>
            ))}
          </div>
        </ChartPanel>

        <ChartPanel
          description="Catalogo de salidas disponibles para compartir resultados con direccion, operaciones y analisis financiero."
          title="Centro de reportes"
        >
          <div className="space-y-3">
            {data.reportes.map((report) => {
              const action = reportActionsById[
                report.id as keyof typeof reportActionsById
              ];
              const Icon = action?.icon ?? FileText;

              return (
                <article
                  key={report.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--color-border)] bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[color:var(--color-primary)]" />
                      <p className="truncate text-sm font-semibold text-stone-950">
                        {report.nombre}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {report.tipo} - Generado {formatDateValue(report.generadoEn)}
                    </p>
                  </div>
                  <button
                    className={secondaryButtonClassName}
                    disabled={!canExport || !action}
                    onClick={() => {
                      action?.onClick();
                    }}
                    type="button"
                  >
                    Exportar
                  </button>
                </article>
              );
            })}
          </div>
        </ChartPanel>
      </div>

      <section className="space-y-4">
        <SectionHeading
          description="Seguimiento de ventas, cotizaciones, conversion comercial y concentracion por cliente o vendedor."
          title="Indicadores comerciales"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <LineaPeriodos
            data={data.secciones.comercial.ventasPorPeriodo}
            title="Ventas por periodo"
            valueLabel="moneda"
          />
          <DonaDistribucion
            data={data.secciones.comercial.cotizacionesPorEstado}
            title="Cotizaciones por estado"
          />
          <BarrasComparativas
            data={data.secciones.comercial.proyectosResultado}
            title="Resultado de cotizaciones"
            valueUnit="numero"
          />
          <ChartPanel
            description="Relacion entre cotizaciones emitidas y cotizaciones aprobadas en el periodo analizado."
            title="Conversion de cotizaciones"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  detalle: "Cotizaciones emitidas",
                  valor: formatTableroValue(
                    data.secciones.comercial.conversion.emitidas,
                    "numero",
                  ),
                },
                {
                  detalle: "Cotizaciones aprobadas",
                  valor: formatTableroValue(
                    data.secciones.comercial.conversion.aprobadas,
                    "numero",
                  ),
                },
                {
                  detalle: "Tasa de conversion",
                  valor: formatTableroValue(
                    data.secciones.comercial.conversion.tasa,
                    "porcentaje",
                  ),
                },
              ].map((item) => (
                <article
                  key={item.detalle}
                  className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                    {item.detalle}
                  </p>
                  <p className="mt-3 font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.04em] text-stone-950">
                    {item.valor}
                  </p>
                </article>
              ))}
            </div>
          </ChartPanel>
          <RankingListado
            data={data.secciones.comercial.ventasPorCliente}
            title="Ventas por cliente"
            unit="moneda"
          />
          <RankingListado
            data={data.secciones.comercial.ventasPorVendedor}
            title="Ventas por vendedor"
            unit="moneda"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          description="Control de ordenes activas, atrasos, tiempos promedio y cumplimiento de fechas comprometidas."
          title="Indicadores operativos"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <DonaDistribucion
            data={data.secciones.operaciones.ordenesTrabajoPorEstado}
            title="Ordenes de trabajo por estado"
          />
          <DonaDistribucion
            data={data.secciones.operaciones.instalacionesPorEstado}
            title="Instalaciones por estado"
          />
          <TablaComparativa
            data={data.secciones.operaciones.cumplimiento}
            title="Cumplimiento operativo"
          />
          <RankingListado
            data={data.secciones.operaciones.alertasOperativas}
            title="Alertas operativas"
            unit="dias"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          description="Valor del inventario, materiales criticos, remanentes, rotacion y merma acumulada del periodo."
          title="Indicadores de inventario"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <TablaComparativa
            data={data.secciones.inventario.resumen}
            title="Resumen de inventario"
          />
          <BarrasComparativas
            data={data.secciones.inventario.rotacion}
            title="Rotacion y cobertura"
            valueUnit="numero"
          />
          <RankingListado
            data={data.secciones.inventario.materialesCriticos}
            title="Materiales criticos"
            unit="numero"
          />
          <RankingListado
            data={data.secciones.inventario.stockBajo}
            title="Materiales con stock bajo"
            unit="numero"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          description="Comparacion de ingreso presupuestado, ingreso real, costos, utilidad y desviaciones relevantes."
          title="Indicadores financieros"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <BarrasComparativas
            data={data.secciones.financiero.resumen}
            title="Resumen financiero"
            valueUnit="moneda"
          />
          <RankingListado
            data={data.secciones.financiero.proyectosEnPerdida}
            title="Proyectos en perdida"
            unit="moneda"
          />
          <RankingListado
            data={data.secciones.financiero.desviacionProyectos}
            title="Desviacion contra presupuesto"
            unit="moneda"
          />
          <ChartPanel
            description="Lectura ejecutiva sintetica para detectar si los ingresos estan sosteniendo los costos visibles del periodo."
            title="Lectura financiera"
          >
            <div className="space-y-3">
              {data.secciones.financiero.resumen.map((item) => (
                <article
                  key={item.etiqueta}
                  className="flex items-center justify-between gap-4 rounded-md border border-[color:var(--color-border)] bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-950">
                      {traducirEtiquetaVisible(item.etiqueta)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {item.porcentaje !== null
                        ? formatTableroValue(item.porcentaje, "porcentaje")
                        : "Sin referencia porcentual"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-950">
                    {formatTableroValue(item.valor, "moneda")}
                  </p>
                </article>
              ))}
            </div>
          </ChartPanel>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          description="Monitorea casos abiertos, cierres, tiempos de resolucion, reclamos y costos asociados a garantia."
          title="Indicadores de postventa"
        />
        <div className="grid gap-6 xl:grid-cols-2">
          <DonaDistribucion
            data={data.secciones.postventa.estados}
            title="Estado de casos postventa"
          />
          <BarrasComparativas
            data={data.secciones.postventa.reclamosPorTipo}
            title="Reclamos por tipo"
            valueUnit="numero"
          />
          <TablaComparativa
            data={data.secciones.postventa.resumen}
            title="Resumen postventa"
          />
          <RankingListado
            data={data.secciones.postventa.reclamosPorProyecto}
            title="Reclamos por proyecto"
            unit="numero"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <article className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Comercial
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Integrado con ventas, cotizaciones y proyectos ganados o perdidos.
              </p>
            </div>
            <BriefcaseBusiness className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
        </article>
        <article className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Operaciones
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Integra produccion e instalaciones con foco en atrasos y cumplimiento.
              </p>
            </div>
            <Gauge className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
        </article>
        <article className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Inventario
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Considera stock, remanentes, materiales criticos y valor almacenado.
              </p>
            </div>
            <PackageSearch className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
        </article>
        <article className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Rentabilidad
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Cruza compras, costos reales, utilidad y margen bruto consolidado.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
        </article>
        <article className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                Postventa
              </p>
              <p className="mt-3 text-sm leading-6 text-stone-600">
                Sigue garantias, reclamos, resolucion y costo de atencion posterior.
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>
        </article>
      </div>

      <section className="space-y-4">
        <SectionHeading
          description="Vista completa de indicadores, metas y formulas consolidadas para auditar el panel."
          title="Matriz de indicadores"
        />
        <TablaIndicadores data={data.indicadores} />
      </section>

      <ChartPanel
        description="Confirmacion visual de que el panel esta traducido y preparado para entrega gerencial."
        title="Lista de verificacion"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            "Ver panel ejecutivo",
            "Filtrar por rango de fechas",
            "Ver indicadores comerciales",
            "Ver indicadores operativos",
            "Ver indicadores financieros",
            "Ver indicadores de inventario",
            "Ver indicadores de postventa",
            "Exportar PDF",
            "Exportar Excel",
            "Confirmar interfaz 100 % espanol",
          ].map((item) => (
            <div
              key={item}
              className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-medium text-stone-700"
            >
              {item}
            </div>
          ))}
        </div>
      </ChartPanel>
    </main>
  );
}
