"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileSpreadsheet, FileText, Scale, TrendingDown, TrendingUp } from "lucide-react";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import {
  formatDateValue,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
} from "@/modules/commercial/ui";
import { projectProfitabilityService } from "@/services/project-profitability-service";

import {
  exportarRentabilidadExcelComparativo,
  exportarRentabilidadExcelFinanciero,
  exportarRentabilidadPdfDetallado,
  exportarRentabilidadPdfEjecutivo,
} from "../exports";
import {
  COSTO_ORIGEN_LABELS,
  EVENTO_RENTABILIDAD_LABELS,
  RENTABILIDAD_PERMISSIONS,
  RENTABILIDAD_QUERY_KEYS,
  RENTABILIDAD_ROUTES,
} from "../constants";
import {
  formatRentabilidadCurrency,
  formatRentabilidadPercent,
  getAlertaRentabilidadBadge,
  getCostoCategoriaBadge,
  getRentabilidadEstadoBadge,
} from "../ui";

type RentabilidadDetailPageProps = {
  projectId: string;
};

export default function RentabilidadDetailPage({
  projectId,
}: RentabilidadDetailPageProps) {
  const { permissions } = usePermissions();
  const canExport = permissions.includes(RENTABILIDAD_PERMISSIONS.exportar);

  const detailQuery = useQuery({
    queryFn: () =>
      projectProfitabilityService.getProjectProfitabilityByProjectId(projectId),
    queryKey: RENTABILIDAD_QUERY_KEYS.detalle(projectId),
    staleTime: 30_000,
  });

  if (detailQuery.isPending) {
    return <LoadingState cards={6} title="Cargando analisis de rentabilidad" />;
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        description={detailQuery.error.message}
        title="No se pudo cargar el detalle de rentabilidad"
      />
    );
  }

  const detail = detailQuery.data;
  const estado = getRentabilidadEstadoBadge(detail.rentabilidad.estado);

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={RENTABILIDAD_ROUTES.listado}>
              Volver al tablero
            </Link>
            {canExport ? (
              <ExportMenu
                actions={[
                  {
                    icon: FileText,
                    id: "pdf-ejecutivo",
                    label: "PDF ejecutivo",
                    onClick: () => {
                      exportarRentabilidadPdfEjecutivo(detail);
                    },
                  },
                  {
                    icon: FileText,
                    id: "pdf-detallado",
                    label: "PDF detallado",
                    onClick: () => {
                      exportarRentabilidadPdfDetallado(detail);
                    },
                  },
                  {
                    icon: FileSpreadsheet,
                    id: "excel-financiero",
                    label: "Excel financiero",
                    onClick: () => {
                      exportarRentabilidadExcelFinanciero(detail);
                    },
                  },
                  {
                    icon: FileSpreadsheet,
                    id: "excel-comparativo",
                    label: "Excel comparativo",
                    onClick: () => {
                      exportarRentabilidadExcelComparativo(detail);
                    },
                  },
                ]}
                buttonClassName={secondaryButtonClassName}
                label="Exportaciones"
              />
            ) : null}
          </>
        }
        description="Analiza el presupuesto contra el costo real, revisa alertas, compara variaciones y sigue los eventos que afectan el margen del proyecto."
        eyebrow="Rentabilidad"
        title={`${detail.proyecto.code} · ${detail.proyecto.title}`}
      />

      <section className="rounded-md border border-[color:var(--color-border)] bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estado.className}`}
          >
            {estado.label}
          </span>
          <span className="text-sm text-stone-700">
            Cliente: {detail.proyecto.client.displayName}
          </span>
          <span className="text-sm text-stone-500">
            Calculado {formatDateValue(detail.rentabilidad.calculadoEn)}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <StatCard
            description="Venta real tomada de la cotizacion vigente del proyecto."
            icon={TrendingUp}
            label="Venta real"
            value={formatRentabilidadCurrency(detail.rentabilidad.ingresoReal)}
          />
          <StatCard
            description="Costo real acumulado entre compras, consumos y avance operativo."
            icon={TrendingDown}
            label="Costo real"
            value={formatRentabilidadCurrency(detail.rentabilidad.totalCostoReal)}
          />
          <StatCard
            description="Resultado bruto del proyecto antes de categorias adicionales."
            icon={Scale}
            label="Utilidad bruta"
            tone="accent"
            value={formatRentabilidadCurrency(detail.rentabilidad.utilidadBruta)}
          />
          <StatCard
            description="Margen bruto calculado sobre el ingreso real."
            icon={Scale}
            label="Margen bruto"
            value={formatRentabilidadPercent(detail.rentabilidad.margenBruto)}
          />
          <StatCard
            description="Margen neto considerando todos los costos reales registrados."
            icon={Scale}
            label="Margen neto"
            value={formatRentabilidadPercent(detail.indicadores.margenNeto)}
          />
          <StatCard
            description="Desperdicio real reportado en produccion y consumos."
            icon={AlertTriangle}
            label="Desperdicio real"
            value={formatRentabilidadPercent(detail.rentabilidad.desperdicioReal)}
          />
        </div>
      </section>

      <section className={sectionClassName}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
          Metodologia
        </p>
        <div className="mt-4 grid gap-3">
          {detail.metodologia.map((line) => (
            <article
              key={line}
              className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900"
            >
              {line}
            </article>
          ))}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Alertas
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Riesgos y desbordes
            </h2>
          </div>
        </div>

        {detail.alertas.length === 0 ? (
          <EmptyState
            description="No hay alertas activas para este proyecto con la informacion registrada hasta ahora."
            title="Sin alertas activas"
          />
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {detail.alertas.map((alerta) => {
              const badge = getAlertaRentabilidadBadge(alerta);

              return (
                <article
                  key={alerta.id}
                  className="rounded-md border border-stone-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs font-medium text-stone-500">
                      Severidad {alerta.severidad.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-stone-700">{alerta.descripcion}</p>
                  <p className="mt-3 text-sm font-semibold text-stone-950">
                    Impacto {formatRentabilidadCurrency(alerta.impacto)}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
            Variaciones
          </p>
          <div className="mt-4 grid gap-3">
            {[
              detail.variaciones.ingresos,
              detail.variaciones.costos,
              detail.variaciones.materiales,
              detail.variaciones.manoDeObra,
              detail.variaciones.instalacion,
            ].map((variacion) => (
              <article
                key={variacion.etiqueta}
                className="rounded-md border border-stone-200 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">{variacion.etiqueta}</p>
                  <p className="text-sm font-semibold text-stone-950">
                    {formatRentabilidadCurrency(variacion.diferencia)}
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Presupuestado
                    </p>
                    <p className="mt-1 text-sm text-stone-900">
                      {formatRentabilidadCurrency(variacion.presupuestado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Real
                    </p>
                    <p className="mt-1 text-sm text-stone-900">
                      {formatRentabilidadCurrency(variacion.real)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                      Desviacion
                    </p>
                    <p className="mt-1 text-sm text-stone-900">
                      {variacion.porcentaje === null
                        ? "Sin base"
                        : formatRentabilidadPercent(variacion.porcentaje)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
            Indicadores
          </p>
          <div className="mt-4 grid gap-3">
            <article className="rounded-md border border-stone-200 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                Rentabilidad por proyecto
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatRentabilidadCurrency(detail.indicadores.rentabilidadPorProyecto)}
              </p>
            </article>
            <article className="rounded-md border border-stone-200 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                Rentabilidad por m²
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {detail.indicadores.rentabilidadPorMetroCuadrado === null
                  ? "Sin mediciones suficientes"
                  : formatRentabilidadCurrency(
                      detail.indicadores.rentabilidadPorMetroCuadrado,
                    )}
              </p>
            </article>
            <article className="rounded-md border border-stone-200 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                Recuperacion por remanentes
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatRentabilidadCurrency(detail.indicadores.recuperacionPorRemanentes)}
              </p>
            </article>
            <article className="rounded-md border border-stone-200 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                Desperdicio generado
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-950">
                {formatRentabilidadPercent(detail.indicadores.desperdicioGenerado)}
              </p>
            </article>
          </div>
        </section>
      </div>

      <section className={tableWrapperClassName}>
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-950">Detalle de costos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-[0.22em] text-stone-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Fecha</th>
                <th className="px-5 py-4 font-semibold">Categoria</th>
                <th className="px-5 py-4 font-semibold">Origen</th>
                <th className="px-5 py-4 font-semibold">Descripcion</th>
                <th className="px-5 py-4 font-semibold">Monto</th>
              </tr>
            </thead>
            <tbody>
              {detail.costos.map((costo) => {
                const badge = getCostoCategoriaBadge(costo.categoria);

                return (
                  <tr key={costo.id} className="border-t border-stone-200/80 align-top">
                    <td className="px-5 py-4 text-stone-700">
                      {formatDateValue(costo.fecha)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {COSTO_ORIGEN_LABELS[costo.origen]}
                    </td>
                    <td className="px-5 py-4 text-stone-700">{costo.descripcion}</td>
                    <td className="px-5 py-4 font-semibold text-stone-950">
                      {formatRentabilidadCurrency(costo.monto)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={sectionClassName}>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
          Eventos
        </p>
        <div className="mt-4 space-y-3">
          {detail.eventos.map((evento) => (
            <article
              key={evento.id}
              className="rounded-md border border-stone-200 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">
                    {EVENTO_RENTABILIDAD_LABELS[evento.tipo]}
                  </p>
                  <p className="mt-1 text-sm text-stone-700">{evento.descripcion}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500">{formatDateValue(evento.creadoEn)}</p>
                  <p className="mt-1 text-sm font-semibold text-stone-950">
                    {evento.impacto === 0
                      ? "Sin impacto monetario directo"
                      : formatRentabilidadCurrency(evento.impacto)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
