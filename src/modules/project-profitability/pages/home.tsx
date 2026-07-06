"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileChartColumn,
  TrendingUp,
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  formatDateValue,
  secondaryButtonClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from "@/modules/projects/constants";
import { clientService } from "@/services/client-service";
import { projectProfitabilityService } from "@/services/project-profitability-service";

import {
  RENTABILIDAD_PERMISSIONS,
  RENTABILIDAD_QUERY_KEYS,
  RENTABILIDAD_ROUTES,
} from "../constants";
import {
  formatRentabilidadCurrency,
  formatRentabilidadPercent,
  formatTipoProyecto,
  getRentabilidadEstadoBadge,
} from "../ui";

export default function RentabilidadHomePage() {
  const { permissions } = usePermissions();
  const canAnalyze = permissions.includes(RENTABILIDAD_PERMISSIONS.analizar);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [projectType, setProjectType] = useState("");
  const [clientId, setClientId] = useState("");

  const filterParams = {
    clientId: clientId || undefined,
    projectType: projectType || undefined,
    search,
    status: status || undefined,
  };

  const dashboardQuery = useQuery({
    queryFn: () => projectProfitabilityService.getDashboard(filterParams),
    queryKey: RENTABILIDAD_QUERY_KEYS.dashboard(filterParams),
    staleTime: 60_000,
  });

  const profitabilityQuery = useQuery({
    queryFn: () =>
      projectProfitabilityService.listProjectProfitability({
        ...filterParams,
        page,
        perPage: 12,
        sortBy: "margenBruto",
        sortDirection: "desc",
      }),
    queryKey: RENTABILIDAD_QUERY_KEYS.listado({
      ...filterParams,
      page,
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
    queryKey: ["rentabilidad", "clientes"],
    staleTime: 60_000,
  });

  if (dashboardQuery.isPending || profitabilityQuery.isPending) {
    return <LoadingState cards={6} title="Cargando rentabilidad de proyectos" />;
  }

  if (dashboardQuery.isError || profitabilityQuery.isError) {
    return (
      <ErrorState
        description={
          dashboardQuery.error?.message ||
          profitabilityQuery.error?.message ||
          "Ocurrio un error inesperado."
        }
        title="No se pudo cargar el modulo de rentabilidad"
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const records = profitabilityQuery.data.data;
  const pagination = profitabilityQuery.data.pagination;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Compara ingresos presupuestados y reales, sigue costos de compras, inventario, produccion e instalacion, y detecta temprano los proyectos que se estan desviando."
        eyebrow="Finanzas operativas"
        title="Rentabilidad de proyectos"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Proyectos incluidos en el tablero financiero actual."
          icon={FileChartColumn}
          label="Total proyectos"
          value={String(dashboard.totalProyectos)}
        />
        <StatCard
          description="Proyectos con rentabilidad neta positiva dentro del filtro actual."
          icon={TrendingUp}
          label="Proyectos rentables"
          tone="accent"
          value={String(dashboard.proyectosRentables)}
        />
        <StatCard
          description="Utilidad acumulada considerando los costos reales registrados hasta el momento."
          icon={CircleDollarSign}
          label="Utilidad total"
          value={formatRentabilidadCurrency(dashboard.utilidadTotal)}
        />
        <StatCard
          description="Promedio de margen bruto entre los proyectos visibles."
          icon={ChartNoAxesCombined}
          label="Margen promedio"
          value={formatRentabilidadPercent(dashboard.margenPromedio)}
        />
        <StatCard
          description="Desperdicio promedio observado entre produccion y consumo real."
          icon={AlertTriangle}
          label="Desperdicio promedio"
          value={formatRentabilidadPercent(dashboard.desperdicioPromedio)}
        />
      </section>

      <section className="rounded-md border border-[color:var(--color-border)] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Filtros
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Seguimiento financiero por proyecto
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por codigo, proyecto o cliente"
            value={search}
          />

          <select
            className={fieldClassName}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            value={status}
          >
            <option value="">Todos los estados</option>
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
              setProjectType(event.target.value);
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

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-md border border-[color:var(--color-border)] bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Mejores resultados
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Proyectos mas rentables
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {dashboard.proyectosMasRentables.map((item) => {
              const estado = getRentabilidadEstadoBadge(item.rentabilidad.estado);

              return (
                <article
                  key={item.proyecto.id}
                  className="rounded-md border border-stone-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {item.proyecto.code} · {item.proyecto.title}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {item.proyecto.client.displayName} ·{" "}
                        {formatTipoProyecto(item.proyecto.projectType)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.className}`}
                    >
                      {estado.label}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Utilidad
                      </p>
                      <p className="mt-1 font-semibold text-emerald-700">
                        {formatRentabilidadCurrency(item.rentabilidad.utilidadBruta)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Margen
                      </p>
                      <p className="mt-1 font-semibold text-stone-950">
                        {formatRentabilidadPercent(item.rentabilidad.margenBruto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Desperdicio
                      </p>
                      <p className="mt-1 font-semibold text-stone-950">
                        {formatRentabilidadPercent(item.rentabilidad.desperdicioReal)}
                      </p>
                    </div>
                  </div>
                  {canAnalyze ? (
                    <div className="mt-4">
                      <Link
                        className={secondaryButtonClassName}
                        href={RENTABILIDAD_ROUTES.detalle(item.proyecto.id)}
                      >
                        Ver analisis
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-md border border-[color:var(--color-border)] bg-white px-5 py-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Riesgo financiero
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Proyectos menos rentables
              </h2>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {dashboard.proyectosMenosRentables.map((item) => {
              const estado = getRentabilidadEstadoBadge(item.rentabilidad.estado);

              return (
                <article
                  key={item.proyecto.id}
                  className="rounded-md border border-stone-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {item.proyecto.code} · {item.proyecto.title}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {item.proyecto.client.displayName} ·{" "}
                        {formatTipoProyecto(item.proyecto.projectType)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.className}`}
                    >
                      {estado.label}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Utilidad
                      </p>
                      <p className="mt-1 font-semibold text-rose-700">
                        {formatRentabilidadCurrency(item.rentabilidad.utilidadBruta)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Margen
                      </p>
                      <p className="mt-1 font-semibold text-stone-950">
                        {formatRentabilidadPercent(item.rentabilidad.margenBruto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                        Alertas
                      </p>
                      <p className="mt-1 font-semibold text-stone-950">
                        {item.alertas.length}
                      </p>
                    </div>
                  </div>
                  {canAnalyze ? (
                    <div className="mt-4">
                      <Link
                        className={secondaryButtonClassName}
                        href={RENTABILIDAD_ROUTES.detalle(item.proyecto.id)}
                      >
                        Ver analisis
                      </Link>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          {
            rows: dashboard.reportes.porCliente,
            title: "Rentabilidad por cliente",
          },
          {
            rows: dashboard.reportes.porVendedor,
            title: "Rentabilidad por vendedor",
          },
          {
            rows: dashboard.reportes.porTipoProducto,
            title: "Rentabilidad por tipo de producto",
          },
        ].map((section) => (
          <section
            key={section.title}
            className="rounded-md border border-[color:var(--color-border)] bg-white px-5 py-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-stone-950">{section.title}</h2>

            <div className="mt-4 space-y-3">
              {section.rows.slice(0, 5).map((row) => (
                    <article
                      key={`${section.title}-${row.clave}`}
                      className="rounded-md border border-stone-200 px-4 py-3"
                    >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {section.title === "Rentabilidad por tipo de producto"
                          ? PROJECT_TYPE_LABELS[
                              row.nombre as keyof typeof PROJECT_TYPE_LABELS
                            ] ?? row.nombre
                          : row.nombre}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {row.proyectos} proyectos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-950">
                        {formatRentabilidadCurrency(row.utilidadTotal)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        Margen {formatRentabilidadPercent(row.margenPromedio)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {records.length === 0 ? (
        <EmptyState
          description="La rentabilidad aparecera aqui cuando existan proyectos con cotizaciones, costos o ejecucion operativa vinculada."
          title="No hay proyectos para el filtro actual"
        />
      ) : (
        <section className={tableWrapperClassName}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Proyecto</th>
                  <th className="px-5 py-4 font-semibold">Venta real</th>
                  <th className="px-5 py-4 font-semibold">Costo real</th>
                  <th className="px-5 py-4 font-semibold">Utilidad</th>
                  <th className="px-5 py-4 font-semibold">Margen</th>
                  <th className="px-5 py-4 font-semibold">Desperdicio</th>
                  <th className="px-5 py-4 font-semibold">Estado</th>
                  <th className="px-5 py-4 font-semibold">Calculado</th>
                  <th className="px-5 py-4 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const estado = getRentabilidadEstadoBadge(record.rentabilidad.estado);

                  return (
                    <tr
                      key={record.proyecto.id}
                      className="border-t border-stone-200/80 align-top"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-stone-950">
                          {record.proyecto.code} · {record.proyecto.title}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {record.proyecto.client.displayName} ·{" "}
                          {formatTipoProyecto(record.proyecto.projectType)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {formatRentabilidadCurrency(record.rentabilidad.ingresoReal)}
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {formatRentabilidadCurrency(record.rentabilidad.totalCostoReal)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-stone-950">
                        {formatRentabilidadCurrency(record.rentabilidad.utilidadBruta)}
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {formatRentabilidadPercent(record.rentabilidad.margenBruto)}
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {formatRentabilidadPercent(record.rentabilidad.desperdicioReal)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.className}`}
                        >
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-stone-700">
                        {formatDateValue(record.rentabilidad.calculadoEn)}
                      </td>
                      <td className="px-5 py-4">
                        {canAnalyze ? (
                          <Link
                            className={secondaryButtonClassName}
                            href={RENTABILIDAD_ROUTES.detalle(record.proyecto.id)}
                          >
                            Ver detalle
                          </Link>
                        ) : (
                          <span className="text-xs text-stone-500">
                            Solo resumen
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-5 py-4">
            <p className="text-sm text-stone-600">
              Mostrando {records.length} de {pagination.total} proyectos
            </p>
            <div className="flex gap-2">
              <button
                className={secondaryButtonClassName}
                disabled={page <= 1}
                onClick={() => {
                  setPage((current) => Math.max(current - 1, 1));
                }}
                type="button"
              >
                Anterior
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={page * pagination.perPage >= pagination.total}
                onClick={() => {
                  setPage((current) => current + 1);
                }}
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
