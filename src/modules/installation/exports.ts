"use client";

import { exportHtmlToPdf } from "@/lib/exports";
import type { InstallationOrderDetailRecord } from "@/types";

import {
  INSTALLATION_EVIDENCE_TYPE_LABELS,
  INSTALLATION_ISSUE_SEVERITY_LABELS,
  INSTALLATION_ISSUE_STATUS_LABELS,
  INSTALLATION_ISSUE_TYPE_LABELS,
  INSTALLATION_LABELS,
  INSTALLATION_STATUS_LABELS,
  INSTALLATION_TASK_STATUS_LABELS,
} from "./constants";
import {
  formatInstallationDateTime,
  formatInstallationScheduleWindow,
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

const renderHeader = (order: InstallationOrderDetailRecord, title: string, subtitle: string) => `
  <header class="report-header">
    <p class="eyebrow">Vidriera Sebitas ERP</p>
    <h1 class="report-title">${escapeHtml(title)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
    <p class="subtitle">Generado el ${escapeHtml(formatInstallationDateTime(new Date().toISOString()))}</p>
    <div class="grid">
      ${renderCard("Codigo", order.code)}
      ${renderCard("Estado", INSTALLATION_STATUS_LABELS[order.status])}
      ${renderCard("Cliente", order.client.displayName)}
      ${renderCard("Horario", formatInstallationScheduleWindow(order.scheduledDate, order.scheduledStartTime, order.scheduledEndTime))}
    </div>
  </header>
`;

const renderTasks = (order: InstallationOrderDetailRecord) => `
  <section class="section">
    <h2>Tareas</h2>
    <div class="list">
      ${order.tasks
        .map(
          (task) => `
            <article class="list-item">
              <strong>${escapeHtml(task.title)}</strong>
              <div class="muted">Estado: ${escapeHtml(INSTALLATION_TASK_STATUS_LABELS[task.status])}</div>
              <div class="muted">Descripcion: ${escapeHtml(task.description || "Sin descripcion")}</div>
              <div class="muted">Completada: ${escapeHtml(formatInstallationDateTime(task.completedAt))}</div>
            </article>
          `,
        )
        .join("")}
    </div>
  </section>
`;

const renderIssues = (order: InstallationOrderDetailRecord) => `
  <section class="section">
    <h2>Observaciones e incidencias</h2>
    <div class="list">
      ${
        order.issues.length === 0
          ? `<article class="list-item">Sin observaciones registradas.</article>`
          : order.issues
              .map(
                (issue) => `
                  <article class="list-item">
                    <strong>${escapeHtml(INSTALLATION_ISSUE_TYPE_LABELS[issue.type])}</strong>
                    <div class="muted">Severidad: ${escapeHtml(INSTALLATION_ISSUE_SEVERITY_LABELS[issue.severity])}</div>
                    <div class="muted">Estado: ${escapeHtml(INSTALLATION_ISSUE_STATUS_LABELS[issue.status])}</div>
                    <div class="muted">${escapeHtml(issue.description)}</div>
                  </article>
                `,
              )
              .join("")
      }
    </div>
  </section>
`;

const renderEvidence = (order: InstallationOrderDetailRecord) => `
  <section class="section">
    <h2>Evidencias</h2>
    <div class="list">
      ${
        order.evidence.length === 0
          ? `<article class="list-item">Sin evidencias cargadas.</article>`
          : order.evidence
              .map(
                (evidence) => `
                  <article class="list-item">
                    <strong>${escapeHtml(INSTALLATION_EVIDENCE_TYPE_LABELS[evidence.type])}</strong>
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

const renderTimeline = (order: InstallationOrderDetailRecord) => `
  <section class="section">
    <h2>Linea de tiempo</h2>
    <div class="list">
      ${order.statusHistory
        .map(
          (entry) => `
            <article class="list-item">
              <strong>${escapeHtml(INSTALLATION_STATUS_LABELS[entry.toStatus])}</strong>
              <div class="muted">Fecha: ${escapeHtml(formatInstallationDateTime(entry.createdAt))}</div>
              <div class="muted">Notas: ${escapeHtml(entry.notes || "Sin notas")}</div>
            </article>
          `,
        )
        .join("")}
    </div>
  </section>
`;

const buildReportMarkup = (
  order: InstallationOrderDetailRecord,
  variant: "order" | "completion" | "internal",
) => {
  const subtitle =
    variant === "completion"
      ? "Documento de cierre con tareas ejecutadas y evidencias de campo."
      : variant === "internal"
        ? "Reporte interno con observaciones, incidencias y notas operativas."
        : "Orden operativa para planificacion, asignacion y ejecucion en campo.";

  return `
    <main class="report-shell">
      ${renderHeader(
        order,
        variant === "completion"
          ? INSTALLATION_LABELS.exports.completion
          : variant === "internal"
            ? INSTALLATION_LABELS.exports.internal
            : INSTALLATION_LABELS.exports.order,
        subtitle,
      )}
      <section class="section">
        <h2>Resumen operativo</h2>
        <div class="grid">
          ${renderCard("Proyecto", order.project?.title ?? "Sin proyecto")}
          ${renderCard("Cotizacion", order.quotation?.code ?? "Sin cotizacion")}
          ${renderCard("Direccion", order.address.address ?? "Sin direccion")}
          ${renderCard("Cuadrilla", order.assignedTeam?.name ?? "Sin cuadrilla")}
        </div>
      </section>
      ${renderTasks(order)}
      ${variant !== "order" ? renderEvidence(order) : ""}
      ${variant !== "completion" ? renderIssues(order) : ""}
      ${variant === "internal" ? renderTimeline(order) : ""}
      <section class="section">
        <h2>Notas internas</h2>
        <article class="list-item">${escapeHtml(order.notes || "Sin notas internas registradas.")}</article>
      </section>
    </main>
  `;
};

export const exportInstallationOrderPdf = (order: InstallationOrderDetailRecord) => {
  exportHtmlToPdf({
    html: buildReportMarkup(order, "order"),
    styles: reportStyles,
    title: `${INSTALLATION_LABELS.exports.order} ${order.code}`,
  });
};

export const exportInstallationCompletionReportPdf = (
  order: InstallationOrderDetailRecord,
) => {
  exportHtmlToPdf({
    html: buildReportMarkup(order, "completion"),
    styles: reportStyles,
    title: `${INSTALLATION_LABELS.exports.completion} ${order.code}`,
  });
};

export const exportInstallationInternalReportPdf = (
  order: InstallationOrderDetailRecord,
) => {
  exportHtmlToPdf({
    html: buildReportMarkup(order, "internal"),
    styles: reportStyles,
    title: `${INSTALLATION_LABELS.exports.internal} ${order.code}`,
  });
};
