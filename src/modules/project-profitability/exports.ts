"use client";

import { exportHtmlToPdf, exportRowsToExcel } from "@/lib/exports";
import type { RentabilidadProyectoDetailRecord } from "@/types";

import {
  ALERTA_RENTABILIDAD_LABELS,
  COSTO_CATEGORIA_LABELS,
  COSTO_ORIGEN_LABELS,
  RENTABILIDAD_ESTADO_LABELS,
} from "./constants";
import {
  formatRentabilidadCurrency,
  formatRentabilidadPercent,
} from "./ui";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const styles = `
  body {
    margin: 0;
    background: #f5f5f4;
    color: #1c1917;
    font-family: "Segoe UI", Arial, sans-serif;
  }

  .page {
    max-width: 1080px;
    margin: 0 auto;
    padding: 32px;
  }

  .hero {
    display: grid;
    gap: 14px;
    border: 1px solid #d6d3d1;
    border-radius: 18px;
    background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
    padding: 24px;
  }

  .eyebrow {
    margin: 0;
    color: #0f5bd7;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h1, h2 {
    margin: 0;
    color: #1c1917;
  }

  p {
    margin: 0;
    color: #44403c;
    line-height: 1.6;
  }

  .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    border: 1px solid #e7e5e4;
    border-radius: 14px;
    background: #ffffff;
    padding: 14px 16px;
  }

  .label {
    color: #78716c;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .value {
    margin-top: 8px;
    color: #1c1917;
    font-size: 18px;
    font-weight: 700;
  }

  .section {
    display: grid;
    gap: 14px;
    margin-top: 24px;
  }

  .section-list {
    display: grid;
    gap: 10px;
  }

  .list-item {
    border: 1px solid #e7e5e4;
    border-radius: 14px;
    background: #ffffff;
    padding: 12px 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #e7e5e4;
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f5f5f4;
    color: #57534e;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

const buildExecutiveMarkup = (detail: RentabilidadProyectoDetailRecord) => `
  <main class="page">
    <section class="hero">
      <p class="eyebrow">Rentabilidad de proyectos</p>
      <h1>${escapeHtml(detail.proyecto.code)} · ${escapeHtml(detail.proyecto.title)}</h1>
      <p>${escapeHtml(detail.proyecto.client.displayName)} · Estado ${escapeHtml(
        RENTABILIDAD_ESTADO_LABELS[detail.rentabilidad.estado],
      )}</p>
      <div class="grid">
        <article class="card">
          <div class="label">Venta real</div>
          <div class="value">${escapeHtml(
            formatRentabilidadCurrency(detail.rentabilidad.ingresoReal),
          )}</div>
        </article>
        <article class="card">
          <div class="label">Costos reales</div>
          <div class="value">${escapeHtml(
            formatRentabilidadCurrency(detail.rentabilidad.totalCostoReal),
          )}</div>
        </article>
        <article class="card">
          <div class="label">Utilidad bruta</div>
          <div class="value">${escapeHtml(
            formatRentabilidadCurrency(detail.rentabilidad.utilidadBruta),
          )}</div>
        </article>
        <article class="card">
          <div class="label">Margen bruto</div>
          <div class="value">${escapeHtml(
            formatRentabilidadPercent(detail.rentabilidad.margenBruto),
          )}</div>
        </article>
      </div>
    </section>

    <section class="section">
      <h2>Alertas</h2>
      <div class="section-list">
        ${
          detail.alertas.length === 0
            ? '<article class="list-item">Sin alertas activas para este proyecto.</article>'
            : detail.alertas
                .map(
                  (alerta) => `
                    <article class="list-item">
                      <strong>${escapeHtml(ALERTA_RENTABILIDAD_LABELS[alerta.tipo])}</strong>
                      <p>${escapeHtml(alerta.descripcion)}</p>
                      <p>Impacto: ${escapeHtml(formatRentabilidadCurrency(alerta.impacto))}</p>
                    </article>
                  `,
                )
                .join("")
        }
      </div>
    </section>
  </main>
`;

const buildDetailedMarkup = (detail: RentabilidadProyectoDetailRecord) => `
  <main class="page">
    ${buildExecutiveMarkup(detail)}
    <section class="section">
      <h2>Variaciones</h2>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Presupuestado</th>
            <th>Real</th>
            <th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          ${[
            detail.variaciones.ingresos,
            detail.variaciones.costos,
            detail.variaciones.materiales,
            detail.variaciones.manoDeObra,
            detail.variaciones.instalacion,
          ]
            .map(
              (variacion) => `
                <tr>
                  <td>${escapeHtml(variacion.etiqueta)}</td>
                  <td>${escapeHtml(formatRentabilidadCurrency(variacion.presupuestado))}</td>
                  <td>${escapeHtml(formatRentabilidadCurrency(variacion.real))}</td>
                  <td>${escapeHtml(formatRentabilidadCurrency(variacion.diferencia))}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </section>

    <section class="section">
      <h2>Costos</h2>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Categoria</th>
            <th>Origen</th>
            <th>Descripcion</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          ${detail.costos
            .map(
              (costo) => `
                <tr>
                  <td>${escapeHtml(new Date(costo.fecha).toLocaleDateString("es-BO"))}</td>
                  <td>${escapeHtml(COSTO_CATEGORIA_LABELS[costo.categoria])}</td>
                  <td>${escapeHtml(COSTO_ORIGEN_LABELS[costo.origen])}</td>
                  <td>${escapeHtml(costo.descripcion)}</td>
                  <td>${escapeHtml(formatRentabilidadCurrency(costo.monto))}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </section>
  </main>
`;

export const exportarRentabilidadPdfEjecutivo = (
  detail: RentabilidadProyectoDetailRecord,
) => {
  exportHtmlToPdf({
    html: buildExecutiveMarkup(detail),
    styles,
    title: `Rentabilidad ejecutiva ${detail.proyecto.code}`,
  });
};

export const exportarRentabilidadPdfDetallado = (
  detail: RentabilidadProyectoDetailRecord,
) => {
  exportHtmlToPdf({
    html: buildDetailedMarkup(detail),
    styles,
    title: `Rentabilidad detallada ${detail.proyecto.code}`,
  });
};

export const exportarRentabilidadExcelFinanciero = (
  detail: RentabilidadProyectoDetailRecord,
) => {
  exportRowsToExcel(detail.costos, {
    columns: [
      {
        header: "Fecha",
        value: (row) => new Date(row.fecha).toLocaleDateString("es-BO"),
      },
      {
        header: "Categoria",
        value: (row) => COSTO_CATEGORIA_LABELS[row.categoria],
      },
      {
        header: "Origen",
        value: (row) => COSTO_ORIGEN_LABELS[row.origen],
      },
      {
        header: "Descripcion",
        value: (row) => row.descripcion,
      },
      {
        header: "Monto",
        value: (row) => row.monto,
      },
    ],
    fileName: `rentabilidad-financiera-${detail.proyecto.code}.xls`,
    subtitle: `Proyecto ${detail.proyecto.code} · ${detail.proyecto.title}`,
    title: "Rentabilidad financiera",
  });
};

export const exportarRentabilidadExcelComparativo = (
  detail: RentabilidadProyectoDetailRecord,
) => {
  exportRowsToExcel(
    [
      detail.variaciones.ingresos,
      detail.variaciones.costos,
      detail.variaciones.materiales,
      detail.variaciones.manoDeObra,
      detail.variaciones.instalacion,
    ],
    {
      columns: [
        {
          header: "Concepto",
          value: (row) => row.etiqueta,
        },
        {
          header: "Presupuestado",
          value: (row) => row.presupuestado,
        },
        {
          header: "Real",
          value: (row) => row.real,
        },
        {
          header: "Diferencia",
          value: (row) => row.diferencia,
        },
        {
          header: "Desviacion %",
          value: (row) => row.porcentaje ?? "",
        },
      ],
      fileName: `rentabilidad-comparativa-${detail.proyecto.code}.xls`,
      subtitle: `Comparativo presupuestado vs real de ${detail.proyecto.code}`,
      title: "Rentabilidad comparativa",
    },
  );
};
