"use client";

import { exportHtmlToPdf } from "@/lib/exports";
import type { MeasurementRequestDetailRecord } from "@/types";

import {
  MEASUREMENT_ELEMENT_LABELS,
  MEASUREMENT_EVIDENCE_TYPE_LABELS,
  MEASUREMENTS_LABELS,
  MEASUREMENT_STATUS_LABELS,
  MEASUREMENT_VISIT_RESULT_LABELS,
  MEASUREMENT_VISIT_STATUS_LABELS,
  TECHNICAL_OBSERVATION_SEVERITY_LABELS,
  TECHNICAL_OBSERVATION_STATUS_LABELS,
  TECHNICAL_OBSERVATION_TYPE_LABELS,
} from "./constants";
import {
  formatMeasurementDateTime,
  formatMeasurementWindow,
} from "./ui";

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const reportStyles = `
  .report-shell {
    display: grid;
    gap: 24px;
  }

  .report-header {
    display: grid;
    gap: 12px;
    border-bottom: 1px solid #d6d3d1;
    padding-bottom: 18px;
  }

  .eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #0f5bd7;
    font-weight: 700;
  }

  .report-title {
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    color: #1c1917;
  }

  .subtitle {
    margin: 0;
    color: #57534e;
    font-size: 13px;
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
    padding: 14px 16px;
    background: #fafaf9;
  }

  .card-label {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #78716c;
  }

  .card-value {
    margin: 8px 0 0;
    font-size: 14px;
    color: #1c1917;
    line-height: 1.55;
  }

  .section {
    display: grid;
    gap: 12px;
  }

  .section h2 {
    margin: 0;
    font-size: 18px;
    color: #1c1917;
  }

  .list {
    display: grid;
    gap: 10px;
  }

  .list-item {
    border: 1px solid #e7e5e4;
    border-radius: 12px;
    padding: 12px 14px;
  }

  .list-item strong {
    display: block;
    margin-bottom: 6px;
    color: #1c1917;
  }

  .muted {
    color: #57534e;
  }

  img.evidence-image {
    width: 100%;
    max-height: 220px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid #d6d3d1;
  }
`;

const renderCard = (label: string, value: string) => `
  <article class="card">
    <p class="card-label">${escapeHtml(label)}</p>
    <p class="card-value">${escapeHtml(value)}</p>
  </article>
`;

const renderHeader = (
  request: MeasurementRequestDetailRecord,
  title: string,
  subtitle: string,
) => `
  <header class="report-header">
    <p class="eyebrow">Vidriera Sebitas ERP</p>
    <h1 class="report-title">${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
    <p class="subtitle">Generado el ${escapeHtml(formatMeasurementDateTime(new Date().toISOString()))}</p>
    <div class="grid">
      ${renderCard("Codigo", request.code)}
      ${renderCard("Estado", MEASUREMENT_STATUS_LABELS[request.status])}
      ${renderCard("Cliente", request.client.displayName)}
      ${renderCard("Horario", formatMeasurementWindow(request.scheduledDate, request.scheduledStartTime, request.scheduledEndTime))}
    </div>
  </header>
`;

const renderOpenings = (request: MeasurementRequestDetailRecord) => `
  <section class="section">
    <h2>Medidas registradas</h2>
    <div class="list">
      ${
        request.visits.flatMap((visit) => visit.openings).length === 0
          ? `<article class="list-item">Sin medidas registradas.</article>`
          : request.visits
              .flatMap((visit) => visit.openings)
              .map(
                (opening) => `
                  <article class="list-item">
                    <strong>${escapeHtml(opening.code)} · ${escapeHtml(opening.environment)}</strong>
                    <div class="muted">Elemento: ${escapeHtml(MEASUREMENT_ELEMENT_LABELS[opening.elementType])}</div>
                    <div class="muted">Dimensiones: ${escapeHtml(`${opening.widthMm} mm × ${opening.heightMm} mm${opening.depthMm ? ` × ${opening.depthMm} mm` : ""}`)}</div>
                    <div class="muted">Cantidad: ${escapeHtml(String(opening.quantity))}</div>
                    <div class="muted">Observaciones: ${escapeHtml(opening.observations || "Sin observaciones")}</div>
                  </article>
                `,
              )
              .join("")
      }
    </div>
  </section>
`;

const renderObservations = (request: MeasurementRequestDetailRecord) => `
  <section class="section">
    <h2>Observaciones tecnicas</h2>
    <div class="list">
      ${
        request.visits.flatMap((visit) => visit.observations).length === 0
          ? `<article class="list-item">Sin observaciones tecnicas.</article>`
          : request.visits
              .flatMap((visit) => visit.observations)
              .map(
                (observation) => `
                  <article class="list-item">
                    <strong>${escapeHtml(TECHNICAL_OBSERVATION_TYPE_LABELS[observation.type])}</strong>
                    <div class="muted">Severidad: ${escapeHtml(TECHNICAL_OBSERVATION_SEVERITY_LABELS[observation.severity])}</div>
                    <div class="muted">Estado: ${escapeHtml(TECHNICAL_OBSERVATION_STATUS_LABELS[observation.status])}</div>
                    <div class="muted">${escapeHtml(observation.description)}</div>
                  </article>
                `,
              )
              .join("")
      }
    </div>
  </section>
`;

const renderEvidence = (request: MeasurementRequestDetailRecord) => `
  <section class="section">
    <h2>Evidencias</h2>
    <div class="list">
      ${
        request.visits.flatMap((visit) => visit.evidence).length === 0
          ? `<article class="list-item">Sin evidencias cargadas.</article>`
          : request.visits
              .flatMap((visit) => visit.evidence)
              .map(
                (evidence) => `
                  <article class="list-item">
                    <strong>${escapeHtml(MEASUREMENT_EVIDENCE_TYPE_LABELS[evidence.type])}</strong>
                    <div class="muted">${escapeHtml(evidence.description || "Sin descripcion")}</div>
                    ${
                      evidence.mimeType?.startsWith("image/")
                        ? `<img class="evidence-image" src="${escapeHtml(evidence.fileUrl)}" alt="${escapeHtml(evidence.fileName)}" />`
                        : `<div class="muted">Archivo: ${escapeHtml(evidence.fileName)}</div>`
                    }
                  </article>
                `,
              )
              .join("")
      }
    </div>
  </section>
`;

const renderVisits = (request: MeasurementRequestDetailRecord) => `
  <section class="section">
    <h2>Visitas tecnicas</h2>
    <div class="list">
      ${
        request.visits.length === 0
          ? `<article class="list-item">Sin visitas tecnicas registradas.</article>`
          : request.visits
              .map(
                (visit) => `
                  <article class="list-item">
                    <strong>${escapeHtml(visit.technician?.name || "Tecnico sin asignar")}</strong>
                    <div class="muted">Estado: ${escapeHtml(MEASUREMENT_VISIT_STATUS_LABELS[visit.status])}</div>
                    <div class="muted">Resultado: ${escapeHtml(MEASUREMENT_VISIT_RESULT_LABELS[visit.result])}</div>
                    <div class="muted">Inicio: ${escapeHtml(formatMeasurementDateTime(visit.startedAt))}</div>
                    <div class="muted">Fin: ${escapeHtml(formatMeasurementDateTime(visit.finishedAt))}</div>
                  </article>
                `,
              )
              .join("")
      }
    </div>
  </section>
`;

const renderTimeline = (request: MeasurementRequestDetailRecord) => `
  <section class="section">
    <h2>Historial</h2>
    <div class="list">
      ${request.statusHistory
        .map(
          (entry) => `
            <article class="list-item">
              <strong>${escapeHtml(MEASUREMENT_STATUS_LABELS[entry.toStatus])}</strong>
              <div class="muted">Fecha: ${escapeHtml(formatMeasurementDateTime(entry.createdAt))}</div>
              <div class="muted">Notas: ${escapeHtml(entry.notes || "Sin notas")}</div>
            </article>
          `,
        )
        .join("")}
    </div>
  </section>
`;

const buildReportMarkup = (
  request: MeasurementRequestDetailRecord,
  variant: "detail" | "internal" | "visit",
) => {
  const subtitle =
    variant === "internal"
      ? "Reporte interno con observaciones tecnicas, alertas y trazabilidad operativa."
      : variant === "visit"
        ? "Visita tecnica con evidencias, medidas registradas y cierre de campo."
        : "Reporte comercial de medicion con medidas consolidadas para cotizacion y produccion.";

  return `
    <main class="report-shell">
      ${renderHeader(request, `${MEASUREMENTS_LABELS.exports.detail} ${request.code}`, subtitle)}
      ${renderVisits(request)}
      ${renderOpenings(request)}
      ${renderEvidence(request)}
      ${variant === "detail" ? "" : renderObservations(request)}
      ${renderTimeline(request)}
    </main>
  `;
};

export const exportMeasurementRequestPdf = (request: MeasurementRequestDetailRecord) => {
  exportHtmlToPdf({
    html: buildReportMarkup(request, "detail"),
    styles: reportStyles,
    title: `${MEASUREMENTS_LABELS.exports.detail} ${request.code}`,
  });
};

export const exportMeasurementInternalPdf = (request: MeasurementRequestDetailRecord) => {
  exportHtmlToPdf({
    html: buildReportMarkup(request, "internal"),
    styles: reportStyles,
    title: `${MEASUREMENTS_LABELS.exports.internal} ${request.code}`,
  });
};

export const exportMeasurementVisitPdf = (request: MeasurementRequestDetailRecord) => {
  exportHtmlToPdf({
    html: buildReportMarkup(request, "visit"),
    styles: reportStyles,
    title: `${MEASUREMENTS_LABELS.exports.visit} ${request.code}`,
  });
};
