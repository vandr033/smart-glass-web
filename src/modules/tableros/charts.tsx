"use client";

import type { ReactNode } from "react";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/utils";
import type {
  ComparativaRecord,
  IndicadorGestionRecord,
  RankingRecord,
  SerieTemporalRecord,
  SerieValorRecord,
  TarjetaIndicadorRecord,
} from "@/types";

import {
  formatTableroCompacto,
  formatTableroValue,
  formatTendencia,
  getTendenciaStyles,
  traducirEtiquetaVisible,
} from "./ui";

type ChartPanelProps = {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
};

export function ChartPanel({ actions, children, description, title }: ChartPanelProps) {
  return (
    <section className="rounded-md border border-[color:var(--color-border)] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
          {description ? (
            <p className="mt-1 max-w-[48ch] text-sm leading-6 text-stone-600">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function TarjetasResumen({ cards }: { cards: TarjetaIndicadorRecord[] }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const TrendIcon =
          card.tendencia === "ALZA"
            ? ArrowUpRight
            : card.tendencia === "BAJA"
              ? ArrowDownRight
              : ArrowRight;

        return (
          <article
            key={card.id}
            className="rounded-md border border-[color:var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-4 py-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  {card.titulo}
                </p>
                <p className="font-[family:var(--font-display)] text-[1.9rem] font-semibold uppercase tracking-[0.04em] text-stone-950">
                  {formatTableroCompacto(card.valor, card.unidad)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  getTendenciaStyles(card.tendencia),
                )}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                {card.tendencia === "ALZA"
                  ? "Alza"
                  : card.tendencia === "BAJA"
                    ? "Baja"
                    : "Estable"}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-600">{card.descripcion}</p>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone-500">
              <span>Meta {card.meta !== null ? formatTableroCompacto(card.meta, card.unidad) : "Sin meta"}</span>
              <span>{formatTendencia(card.variacion)}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function LineaPeriodos({
  data,
  title,
  valueLabel,
}: {
  data: SerieTemporalRecord[];
  title: string;
  valueLabel: "moneda" | "numero";
}) {
  const max = Math.max(...data.map((item) => item.valor), 1);
  const points = data
    .map((item, index) => {
      const x = data.length === 1 ? 32 : (index / (data.length - 1)) * 100;
      const y = 100 - (item.valor / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <ChartPanel
      description="Tendencia consolidada del periodo seleccionado."
      title={title}
    >
      <div className="space-y-4">
        <div className="rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] p-3">
          <svg
            aria-label={title}
            className="h-48 w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {[0, 25, 50, 75, 100].map((line) => (
              <line
                key={line}
                stroke="#d6dde7"
                strokeDasharray="1.2 2.2"
                strokeWidth="0.6"
                x1="0"
                x2="100"
                y1={line}
                y2={line}
              />
            ))}
            <polyline
              fill="none"
              points={points}
              stroke="#0f5bd7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.4"
            />
            {data.map((item, index) => {
              const x = data.length === 1 ? 32 : (index / (data.length - 1)) * 100;
              const y = 100 - (item.valor / max) * 100;

              return (
                <circle
                  key={item.periodo}
                  cx={x}
                  cy={y}
                  fill="#0f5bd7"
                  r="2.6"
                  stroke="#ffffff"
                  strokeWidth="1.4"
                />
              );
            })}
          </svg>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {data.map((item) => (
            <div
              key={item.periodo}
              className="rounded-md border border-[color:var(--color-border)] bg-white px-3 py-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                {item.etiqueta}
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-950">
                {formatTableroValue(item.valor, valueLabel)}
              </p>
              {item.valorSecundario !== undefined ? (
                <p className="mt-1 text-xs text-stone-500">
                  Aprobadas {formatTableroValue(item.valorSecundario, "numero")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  );
}

export function DonaDistribucion({
  data,
  title,
}: {
  data: SerieValorRecord[];
  title: string;
}) {
  const total = Math.max(
    data.reduce((sum, item) => sum + item.valor, 0),
    1,
  );
  const circumference = 2 * Math.PI * 42;
  const segments = data.reduce<Array<{ item: SerieValorRecord; offset: number; segment: number }>>(
    (result, item) => {
      const offset = result.length > 0
        ? result[result.length - 1].offset + result[result.length - 1].segment
        : 0;
      const segment = (item.valor / total) * circumference;

      result.push({ item, offset, segment });
      return result;
    },
    [],
  );

  return (
    <ChartPanel
      description="Distribucion porcentual de los valores visibles en el filtro actual."
      title={title}
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="flex items-center justify-center rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
          <svg className="h-52 w-52 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" fill="none" r="42" stroke="#e7edf5" strokeWidth="18" />
            {segments.map(({ item, offset: currentOffset, segment }) => {
              return (
                <circle
                  key={item.etiqueta}
                  cx="60"
                  cy="60"
                  fill="none"
                  r="42"
                  stroke={item.color}
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={-currentOffset}
                  strokeLinecap="butt"
                  strokeWidth="18"
                />
              );
            })}
          </svg>
        </div>
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.etiqueta}
              className="flex items-center justify-between gap-4 rounded-md border border-[color:var(--color-border)] bg-white px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {traducirEtiquetaVisible(item.etiqueta)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {item.porcentaje !== null
                      ? `${formatTableroCompacto(item.porcentaje, "porcentaje")} del total`
                      : "Sin porcentaje comparativo"}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-stone-900">
                {formatTableroValue(item.valor, "numero")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ChartPanel>
  );
}

export function BarrasComparativas({
  data,
  title,
  valueUnit,
}: {
  data: SerieValorRecord[];
  title: string;
  valueUnit: "moneda" | "numero";
}) {
  const max = Math.max(...data.map((item) => item.valor), 1);

  return (
    <ChartPanel
      description="Comparacion horizontal para resaltar brechas y prioridades."
      title={title}
    >
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.etiqueta} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-stone-700">
                {traducirEtiquetaVisible(item.etiqueta)}
              </span>
              <span className="font-semibold text-stone-950">
                {formatTableroValue(item.valor, valueUnit)}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: item.color,
                  width: `${Math.max((item.valor / max) * 100, 4)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartPanel>
  );
}

export function RankingListado({
  data,
  title,
  unit,
}: {
  data: RankingRecord[];
  title: string;
  unit: "dias" | "moneda" | "numero";
}) {
  const max = Math.max(...data.map((item) => item.valor), 1);

  return (
    <ChartPanel
      description="Ordena los frentes con mayor impacto para enfocar seguimiento."
      title={title}
    >
      <div className="space-y-3">
        {data.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 px-4 py-6 text-sm text-stone-500">
            No hay datos suficientes para construir este ranking.
          </div>
        ) : null}
        {data.map((item, index) => (
          <article
            key={item.id}
            className="rounded-md border border-[color:var(--color-border)] bg-white px-4 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Posicion {index + 1}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-stone-950">
                  {traducirEtiquetaVisible(item.etiqueta)}
                </p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{item.descripcion}</p>
                {item.secundario ? (
                  <p className="mt-1 text-xs text-stone-400">{traducirEtiquetaVisible(item.secundario)}</p>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-stone-950">
                {formatTableroValue(item.valor, unit)}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-[color:var(--color-primary)]"
                style={{ width: `${Math.max((item.valor / max) * 100, 6)}%` }}
              />
            </div>
          </article>
        ))}
      </div>
    </ChartPanel>
  );
}

export function TablaComparativa({
  data,
  title,
}: {
  data: ComparativaRecord[];
  title: string;
}) {
  return (
    <ChartPanel
      description="Tabla comparativa con referencia operativa o meta cuando aplica."
      title={title}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Indicador</th>
              <th className="px-4 py-3 font-semibold">Valor actual</th>
              <th className="px-4 py-3 font-semibold">Meta</th>
              <th className="px-4 py-3 font-semibold">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.etiqueta} className="border-t border-stone-200/80">
                <td className="px-4 py-3 font-medium text-stone-950">
                  {traducirEtiquetaVisible(item.etiqueta)}
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {formatTableroValue(item.valor, item.unidad)}
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {item.meta !== null ? formatTableroValue(item.meta, item.unidad) : "Sin meta"}
                </td>
                <td className="px-4 py-3 text-stone-500">{item.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartPanel>
  );
}

export function TablaIndicadores({
  data,
}: {
  data: IndicadorGestionRecord[];
}) {
  return (
    <ChartPanel
      description="Matriz completa de indicadores, formulas y metas activas del panel."
      title="Indicadores de gestion"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.18em] text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Indicador</th>
              <th className="px-4 py-3 font-semibold">Categoria</th>
              <th className="px-4 py-3 font-semibold">Valor</th>
              <th className="px-4 py-3 font-semibold">Meta</th>
              <th className="px-4 py-3 font-semibold">Tendencia</th>
              <th className="px-4 py-3 font-semibold">Formula</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id} className="border-t border-stone-200/80 align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-stone-950">{item.nombre}</p>
                  <p className="text-xs text-stone-500">{item.descripcion}</p>
                </td>
                <td className="px-4 py-3 text-stone-700">{item.categoria}</td>
                <td className="px-4 py-3 text-stone-700">
                  {formatTableroValue(item.valorActual, item.unidad)}
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {item.meta !== null ? formatTableroValue(item.meta, item.unidad) : "Sin meta"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      getTendenciaStyles(item.tendencia),
                    )}
                  >
                    {item.tendencia === "ALZA"
                      ? "Alza"
                      : item.tendencia === "BAJA"
                        ? "Baja"
                        : "Estable"}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-500">{item.formula}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartPanel>
  );
}
