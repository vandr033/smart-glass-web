"use client";

import { exportHtmlToPdf, exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import type { PostventaCaseDetailRecord, PostventaCaseListItem } from "@/types";

import {
  POSTVENTA_ACTIVITY_STATUS_LABELS,
  POSTVENTA_ACTIVITY_TYPE_LABELS,
  POSTVENTA_COST_CATEGORY_LABELS,
  POSTVENTA_COST_ORIGIN_LABELS,
  POSTVENTA_EVIDENCE_TYPE_LABELS,
  POSTVENTA_PRIORITY_LABELS,
  POSTVENTA_STATUS_LABELS,
  POSTVENTA_TYPE_LABELS,
  PRODUCT_WARRANTY_STATUS_LABELS,
} from "./constants";
import {
  formatPostventaCurrency,
  formatPostventaDate,
  formatPostventaDateTime,
  formatPostventaPercent,
} from "./ui";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const documentStyles = `
  body {
    margin: 0;
    background: #f5f7fb;
    color: #1f2937;
    font-family: "Segoe UI", Arial, sans-serif;
  }

  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 28px;
  }

  .hero {
    display: grid;
    gap: 16px;
    border: 1px solid #d6e0f5;
    border-radius: 20px;
    background: linear-gradient(180deg, #ffffff 0%, #eef4ff 100%);
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

  .title {
    margin: 0;
    font-size: 30px;
    line-height: 1.1;
    color: #111827;
  }

  .description {
    margin: 0;
    color: #475569;
    line-height: 1.6;
  }

  .grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    border: 1px solid #dbe4f0;
    border-radius: 14px;
    background: #ffffff;
    padding: 14px 16px;
  }

  .label {
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .value {
    margin-top: 8px;
    color: #111827;
    font-size: 17px;
    font-weight: 700;
  }

  .section {
    display: grid;
    gap: 12px;
    margin-top: 24px;
  }

  .section-title {
    margin: 0;
    font-size: 21px;
    color: #111827;
  }

  .panel {
    border: 1px solid #dbe4f0;
    border-radius: 16px;
    background: #ffffff;
    padding: 16px;
  }

  .list {
    display: grid;
    gap: 10px;
  }

  .item {
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    background: #f8fafc;
    padding: 12px 14px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border: 1px solid #e5e7eb;
    padding: 10px 12px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #eff3f8;
    color: #475569;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

const buildHeroMarkup = (detail: PostventaCaseDetailRecord) => `
  <section class="hero">
    <p class="eyebrow">Vidriera Sebitas ERP</p>
    <h1 class="title">${escapeHtml(detail.code)} · ${escapeHtml(
      POSTVENTA_TYPE_LABELS[detail.type],
    )}</h1>
    <p class="description">${escapeHtml(detail.client.displayName)} · Estado ${escapeHtml(
      POSTVENTA_STATUS_LABELS[detail.status],
    )} · Prioridad ${escapeHtml(POSTVENTA_PRIORITY_LABELS[detail.priority])}</p>
    <div class="grid">
      <article class="card">
        <div class="label">Proyecto</div>
        <div class="value">${escapeHtml(detail.project?.title ?? "Sin proyecto asociado")}</div>
      </article>
      <article class="card">
        <div class="label">Fecha de reporte</div>
        <div class="value">${escapeHtml(formatPostventaDate(detail.reportedAt))}</div>
      </article>
      <article class="card">
        <div class="label">Responsable</div>
        <div class="value">${escapeHtml(detail.responsible?.name ?? "Sin asignar")}</div>
      </article>
      <article class="card">
        <div class="label">Costo acumulado</div>
        <div class="value">${escapeHtml(formatPostventaCurrency(detail.totalCost))}</div>
      </article>
    </div>
  </section>
`;

const buildSummaryMarkup = (detail: PostventaCaseDetailRecord) => `
  <section class="section">
    <h2 class="section-title">Resumen del caso</h2>
    <div class="panel">
      <p class="description"><strong>Problema:</strong> ${escapeHtml(detail.description)}</p>
      <p class="description"><strong>Solucion propuesta:</strong> ${escapeHtml(
        detail.proposedSolution ?? "Sin solucion propuesta",
      )}</p>
      <p class="description"><strong>Garantia:</strong> ${escapeHtml(
        detail.warranty
          ? `${detail.warranty.productType} · ${PRODUCT_WARRANTY_STATUS_LABELS[detail.warranty.status]}`
          : detail.outsideWarranty
            ? "Marcado fuera de garantia"
            : "Sin garantia vinculada",
      )}</p>
      <p class="description"><strong>Instalacion:</strong> ${escapeHtml(
        detail.installation?.code ?? "Sin instalacion asociada",
      )}</p>
      <p class="description"><strong>Cotizacion:</strong> ${escapeHtml(
        detail.quotation?.code ?? "Sin cotizacion asociada",
      )}</p>
    </div>
  </section>
`;

const buildCostsTable = (detail: PostventaCaseDetailRecord) => `
  <section class="section">
    <h2 class="section-title">Costos postventa</h2>
    <div class="panel">
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
          ${
            detail.costs.length === 0
              ? `<tr><td colspan="5">Sin costos registrados.</td></tr>`
              : detail.costs
                  .map(
                    (cost) => `
                      <tr>
                        <td>${escapeHtml(formatPostventaDate(cost.costDate))}</td>
                        <td>${escapeHtml(POSTVENTA_COST_CATEGORY_LABELS[cost.category])}</td>
                        <td>${escapeHtml(POSTVENTA_COST_ORIGIN_LABELS[cost.origin])}</td>
                        <td>${escapeHtml(cost.description)}</td>
                        <td>${escapeHtml(formatPostventaCurrency(cost.amount))}</td>
                      </tr>
                    `,
                  )
                  .join("")
          }
        </tbody>
      </table>
    </div>
  </section>
`;

const buildActivitiesMarkup = (detail: PostventaCaseDetailRecord) => `
  <section class="section">
    <h2 class="section-title">Actividades y evidencias</h2>
    <div class="list">
      ${
        detail.activities.length === 0
          ? `<article class="item">No hay actividades registradas para este caso.</article>`
          : detail.activities
              .map(
                (activity) => `
                  <article class="item">
                    <p class="description"><strong>${escapeHtml(
                      POSTVENTA_ACTIVITY_TYPE_LABELS[activity.type],
                    )}</strong> · ${escapeHtml(activity.description)}</p>
                    <p class="description">Estado: ${escapeHtml(
                      POSTVENTA_ACTIVITY_STATUS_LABELS[activity.status],
                    )} · Responsable: ${escapeHtml(
                      activity.responsible?.name ?? "Sin asignar",
                    )}</p>
                    <p class="description">Programada: ${escapeHtml(
                      formatPostventaDateTime(activity.scheduledAt),
                    )} · Ejecutada: ${escapeHtml(
                      formatPostventaDateTime(activity.executedAt),
                    )}</p>
                  </article>
                `,
              )
              .join("")
      }
      ${
        detail.evidences.length === 0
          ? `<article class="item">No hay evidencias adjuntas.</article>`
          : detail.evidences
              .map(
                (evidence) => `
                  <article class="item">
                    <p class="description"><strong>${escapeHtml(
                      POSTVENTA_EVIDENCE_TYPE_LABELS[evidence.type],
                    )}</strong> · ${escapeHtml(evidence.fileName)}</p>
                    <p class="description">${escapeHtml(
                      evidence.description ?? "Sin descripcion",
                    )}</p>
                    <p class="description">Subido por ${escapeHtml(
                      evidence.uploadedBy?.name ?? "Sistema",
                    )} el ${escapeHtml(formatPostventaDateTime(evidence.uploadedAt))}</p>
                  </article>
                `,
              )
              .join("")
      }
    </div>
  </section>
`;

const buildFinancialMarkup = (detail: PostventaCaseDetailRecord) => `
  <section class="section">
    <h2 class="section-title">Impacto financiero</h2>
    <div class="grid">
      <article class="card">
        <div class="label">Costo total</div>
        <div class="value">${escapeHtml(
          formatPostventaCurrency(detail.financialImpact.costoTotal),
        )}</div>
      </article>
      <article class="card">
        <div class="label">Sobre venta del proyecto</div>
        <div class="value">${escapeHtml(
          formatPostventaPercent(detail.financialImpact.porcentajeSobreVenta),
        )}</div>
      </article>
      <article class="card">
        <div class="label">Sobre utilidad del proyecto</div>
        <div class="value">${escapeHtml(
          formatPostventaPercent(detail.financialImpact.porcentajeSobreUtilidad),
        )}</div>
      </article>
      <article class="card">
        <div class="label">Utilidad actual del proyecto</div>
        <div class="value">${escapeHtml(
          detail.financialImpact.utilidadProyecto === null
            ? "No disponible"
            : formatPostventaCurrency(detail.financialImpact.utilidadProyecto),
        )}</div>
      </article>
    </div>
  </section>
`;

const buildInternalMarkup = (detail: PostventaCaseDetailRecord) => `
  <main class="page">
    ${buildHeroMarkup(detail)}
    ${buildSummaryMarkup(detail)}
    ${buildFinancialMarkup(detail)}
    ${buildCostsTable(detail)}
    <section class="section">
      <h2 class="section-title">Observaciones internas</h2>
      <div class="panel">
        <p class="description">${escapeHtml(detail.internalNotes ?? "Sin notas internas registradas.")}</p>
      </div>
    </section>
    ${buildActivitiesMarkup(detail)}
  </main>
`;

export const exportarCasosPostventaExcel = (rows: PostventaCaseListItem[]) => {
  exportRowsToExcel(rows, {
    columns: [
      { header: "Codigo", value: (row) => row.code },
      { header: "Cliente", value: (row) => row.client.displayName },
      { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
      { header: "Tipo", value: (row) => POSTVENTA_TYPE_LABELS[row.type] },
      { header: "Estado", value: (row) => POSTVENTA_STATUS_LABELS[row.status] },
      { header: "Prioridad", value: (row) => POSTVENTA_PRIORITY_LABELS[row.priority] },
      { header: "Responsable", value: (row) => row.responsible?.name ?? "Sin asignar" },
      { header: "Fecha de reporte", value: (row) => formatPostventaDate(row.reportedAt) },
      { header: "Fecha compromiso", value: (row) => formatPostventaDate(row.commitmentDate) },
      { header: "Costo acumulado", value: (row) => formatPostventaCurrency(row.totalCost) },
    ],
    fileName: "casos-postventa",
    subtitle: "Listado de casos postventa filtrados en Vidriera Sebitas ERP.",
    title: "Casos postventa",
  });
};

export const exportarCasosPostventaPdf = (rows: PostventaCaseListItem[]) => {
  exportRowsToPdf(rows, {
    columns: [
      { header: "Codigo", value: (row) => row.code },
      { header: "Cliente", value: (row) => row.client.displayName },
      { header: "Proyecto", value: (row) => row.project?.title ?? "Sin proyecto" },
      { header: "Tipo", value: (row) => POSTVENTA_TYPE_LABELS[row.type] },
      { header: "Estado", value: (row) => POSTVENTA_STATUS_LABELS[row.status] },
      { header: "Prioridad", value: (row) => POSTVENTA_PRIORITY_LABELS[row.priority] },
      { header: "Responsable", value: (row) => row.responsible?.name ?? "Sin asignar" },
      { header: "Fecha de reporte", value: (row) => formatPostventaDate(row.reportedAt) },
      { header: "Costo acumulado", value: (row) => formatPostventaCurrency(row.totalCost) },
    ],
    fileName: "casos-postventa",
    subtitle: "Resumen operativo de casos postventa.",
    title: "Casos postventa",
  });
};

export const exportarCostosPostventaExcel = (detail: PostventaCaseDetailRecord) => {
  exportRowsToExcel(detail.costs, {
    columns: [
      { header: "Caso", value: () => detail.code },
      { header: "Fecha", value: (row) => formatPostventaDate(row.costDate) },
      { header: "Categoria", value: (row) => POSTVENTA_COST_CATEGORY_LABELS[row.category] },
      { header: "Origen", value: (row) => POSTVENTA_COST_ORIGIN_LABELS[row.origin] },
      { header: "Descripcion", value: (row) => row.description },
      { header: "Monto", value: (row) => formatPostventaCurrency(row.amount) },
    ],
    fileName: `costos-${detail.code.toLowerCase()}`,
    subtitle: `Costos asociados al caso ${detail.code}.`,
    title: "Costos postventa",
  });
};

export const exportarCasoPostventaPdf = (detail: PostventaCaseDetailRecord) => {
  exportHtmlToPdf({
    html: `
      <main class="page">
        ${buildHeroMarkup(detail)}
        ${buildSummaryMarkup(detail)}
        ${buildActivitiesMarkup(detail)}
      </main>
    `,
    styles: documentStyles,
    title: `Caso postventa ${detail.code}`,
  });
};

export const exportarCasoPostventaInternoPdf = (detail: PostventaCaseDetailRecord) => {
  exportHtmlToPdf({
    html: buildInternalMarkup(detail),
    styles: documentStyles,
    title: `Reporte interno ${detail.code}`,
  });
};

export const exportarCierreGarantiaPdf = (detail: PostventaCaseDetailRecord) => {
  exportHtmlToPdf({
    html: `
      <main class="page">
        ${buildHeroMarkup(detail)}
        <section class="section">
          <h2 class="section-title">Cierre de garantia</h2>
          <div class="panel">
            <p class="description"><strong>Garantia:</strong> ${escapeHtml(
              detail.warranty
                ? `${detail.warranty.productType} · ${PRODUCT_WARRANTY_STATUS_LABELS[detail.warranty.status]}`
                : "Caso sin garantia vinculada",
            )}</p>
            <p class="description"><strong>Vigencia:</strong> ${escapeHtml(
              detail.warranty
                ? `${formatPostventaDate(detail.warranty.startDate)} al ${formatPostventaDate(detail.warranty.endDate)}`
                : "No aplica",
            )}</p>
            <p class="description"><strong>Resultado:</strong> ${escapeHtml(
              POSTVENTA_STATUS_LABELS[detail.status],
            )}</p>
            <p class="description"><strong>Solucion aplicada:</strong> ${escapeHtml(
              detail.proposedSolution ?? "Sin solucion registrada",
            )}</p>
            <p class="description"><strong>Fecha de cierre:</strong> ${escapeHtml(
              formatPostventaDateTime(detail.closedAt),
            )}</p>
          </div>
        </section>
        ${buildFinancialMarkup(detail)}
      </main>
    `,
    styles: documentStyles,
    title: `Cierre de garantia ${detail.code}`,
  });
};
