"use client";

import type {
  QuotationDetailRecord,
  QuotationItemMaterialRecord,
  QuotationItemRecord,
} from "@/types";

import {
  QUOTATION_ITEM_TYPE_LABELS,
  QUOTATION_STATUS_LABELS,
} from "./constants";
import {
  formatQuotationCurrency,
  formatQuotationDate,
  formatQuotationDateTime,
  formatQuotationPercent,
} from "./ui";

type QuotationPdfVariant = "commercial" | "internal";

const escapeHtml = (value: string): string => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const formatNumber = (value: number): string => value.toLocaleString("es-BO");

const formatWaste = (value: number | null): string => {
  if (value === null) {
    return "No definido";
  }

  return `${value.toFixed(2)}%`;
};

const renderSummaryCard = (label: string, value: string): string => {
  return `
    <article class="card">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <p class="value">${escapeHtml(value)}</p>
    </article>
  `;
};

const renderTotalsCard = (
  label: string,
  value: string,
  tone: "default" | "primary" = "default",
): string => {
  return `
    <article class="total-card ${tone}">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <p class="value">${escapeHtml(value)}</p>
    </article>
  `;
};

const renderItemRow = (
  quotation: QuotationDetailRecord,
  item: QuotationItemRecord,
  includeInternal: boolean,
): string => {
  const cells = [
    `<td>${escapeHtml(item.name)}</td>`,
    `<td>${escapeHtml(QUOTATION_ITEM_TYPE_LABELS[item.itemType])}</td>`,
    `<td>${escapeHtml(formatNumber(item.quantity))}</td>`,
    `<td>${escapeHtml(item.description || "Configurado segun el requerimiento del proyecto.")}</td>`,
    `<td>${escapeHtml(formatQuotationCurrency(item.subtotalSale, quotation.currency))}</td>`,
  ];

  if (includeInternal) {
    cells.splice(
      4,
      0,
      `<td>${escapeHtml(formatQuotationCurrency(item.subtotalCost, quotation.currency))}</td>`,
      `<td>${escapeHtml(formatQuotationPercent(item.marginPercent))}</td>`,
    );
  }

  return `<tr>${cells.join("")}</tr>`;
};

const renderMaterialRow = (
  quotation: QuotationDetailRecord,
  item: QuotationItemRecord,
  material: QuotationItemMaterialRecord,
): string => {
  return `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(material.materialCode ?? "Sin codigo")}</td>
      <td>${escapeHtml(material.materialName)}</td>
      <td>${escapeHtml(`${formatNumber(material.requiredQuantity)} ${material.unit}`)}</td>
      <td>${escapeHtml(formatQuotationCurrency(material.unitCost, quotation.currency))}</td>
      <td>${escapeHtml(formatQuotationCurrency(material.totalCost, quotation.currency))}</td>
      <td>${escapeHtml(formatWaste(material.wastePercent))}</td>
    </tr>
  `;
};

const renderSection = (title: string, subtitle: string, content: string): string => {
  return `
    <section class="section">
      <div class="section-header">
        <p class="section-eyebrow">${escapeHtml(subtitle)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${content}
    </section>
  `;
};

const buildQuotationPrintMarkup = (
  quotation: QuotationDetailRecord,
  variant: QuotationPdfVariant,
): string => {
  const includeInternal = variant === "internal";
  const materialRows = quotation.items.flatMap((item) =>
    item.materials.map((material) => ({ item, material })),
  );

  const itemHeaders = [
    "Producto",
    "Tipo",
    "Cantidad",
    "Descripcion",
    ...(includeInternal ? ["Costo", "Margen"] : []),
    "Total",
  ];

  const itemTable = `
    <table>
      <thead>
        <tr>${itemHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${quotation.items.map((item) => renderItemRow(quotation, item, includeInternal)).join("")}
      </tbody>
    </table>
  `;

  const materialBreakdown =
    includeInternal && materialRows.length > 0
      ? renderSection(
          "Costos y desperdicio",
          "Analisis interno",
          `
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Codigo</th>
                  <th>Material</th>
                  <th>Cantidad requerida</th>
                  <th>Costo unitario</th>
                  <th>Costo total</th>
                  <th>Desperdicio</th>
                </tr>
              </thead>
              <tbody>
                ${materialRows
                  .map(({ item, material }) => renderMaterialRow(quotation, item, material))
                  .join("")}
              </tbody>
            </table>
          `,
        )
      : "";

  const notesSections = [
    renderSection(
      "Condiciones comerciales",
      "Cliente",
      `<p class="body-copy">${escapeHtml(quotation.notes || "Sin condiciones comerciales registradas.")}</p>`,
    ),
    includeInternal
      ? renderSection(
          "Notas internas",
          "Operacion",
          `<p class="body-copy">${escapeHtml(quotation.internalNotes || "Sin notas internas registradas.")}</p>`,
        )
      : "",
  ]
    .filter(Boolean)
    .join("");

  const totals = [
    ...(includeInternal
      ? [
          renderTotalsCard(
            "Subtotal costo",
            formatQuotationCurrency(quotation.subtotalCost, quotation.currency),
          ),
        ]
      : []),
    renderTotalsCard(
      "Subtotal venta",
      formatQuotationCurrency(quotation.subtotalSale, quotation.currency),
    ),
    renderTotalsCard(
      "Descuento",
      formatQuotationCurrency(quotation.discountAmount, quotation.currency),
    ),
    renderTotalsCard(
      "Impuesto",
      formatQuotationCurrency(quotation.taxAmount, quotation.currency),
    ),
    ...(includeInternal
      ? [
          renderTotalsCard(
            "Margen",
            formatQuotationCurrency(quotation.marginAmount, quotation.currency),
          ),
          renderTotalsCard("Rentabilidad", formatQuotationPercent(quotation.marginPercent)),
        ]
      : []),
    renderTotalsCard(
      "Total",
      formatQuotationCurrency(quotation.totalSale, quotation.currency),
      "primary",
    ),
  ].join("");

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(
          `${variant === "commercial" ? "PDF Comercial" : "PDF Interno"} ${quotation.code}`,
        )}</title>
        <style>
          :root {
            color-scheme: light;
            --ink: #1c1917;
            --muted: #57534e;
            --line: #d6d3d1;
            --surface: #fafaf9;
            --panel: #ffffff;
            --primary: #0f5bd7;
            --primary-ink: #ffffff;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            color: var(--ink);
            background: #f5f5f4;
          }
          .page {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px;
          }
          .hero {
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92));
            border: 1px solid #d6d3d1;
            border-radius: 28px;
            padding: 28px;
            box-shadow: 0 22px 60px rgba(15, 47, 91, 0.08);
          }
          .hero-grid {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-end;
            flex-wrap: wrap;
          }
          .hero h1 {
            margin: 10px 0 0;
            font-size: 34px;
            line-height: 1.1;
          }
          .kicker, .section-eyebrow, .eyebrow {
            margin: 0;
            font-size: 11px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            font-weight: 700;
          }
          .kicker, .section-eyebrow {
            color: var(--primary);
          }
          .body-copy {
            margin: 14px 0 0;
            font-size: 14px;
            line-height: 1.8;
            color: var(--muted);
          }
          .summary-grid,
          .totals-grid {
            display: grid;
            gap: 14px;
            margin-top: 24px;
          }
          .summary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .totals-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .card,
          .total-card,
          .section {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 18px;
          }
          .total-card.primary {
            background: var(--primary);
            color: var(--primary-ink);
            border-color: var(--primary);
          }
          .card .value,
          .total-card .value {
            margin: 10px 0 0;
            font-size: 18px;
            font-weight: 700;
          }
          .section {
            margin-top: 18px;
          }
          .section h2 {
            margin: 10px 0 0;
            font-size: 24px;
          }
          .section-header {
            margin-bottom: 18px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          thead th {
            background: var(--surface);
            color: var(--muted);
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-align: left;
          }
          th, td {
            border: 1px solid #e7e5e4;
            padding: 10px 12px;
            vertical-align: top;
            font-size: 13px;
          }
          footer {
            margin-top: 20px;
            color: #78716c;
            font-size: 12px;
          }
          @media print {
            body {
              background: white;
            }
            .page {
              max-width: none;
              padding: 12px;
            }
            .hero {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="hero">
            <div class="hero-grid">
              <div>
                <p class="kicker">${escapeHtml(
                  variant === "commercial" ? "PDF Comercial" : "PDF Interno",
                )}</p>
                <h1>${escapeHtml(quotation.code)}</h1>
                <p class="body-copy">
                  Cliente: ${escapeHtml(quotation.client.displayName)}
                  ${quotation.project ? ` · Proyecto: ${escapeHtml(quotation.project.title)}` : ""}
                </p>
              </div>
              <div class="total-card primary">
                <p class="eyebrow">Total</p>
                <p class="value">${escapeHtml(
                  formatQuotationCurrency(quotation.totalSale, quotation.currency),
                )}</p>
              </div>
            </div>

            <div class="summary-grid">
              ${renderSummaryCard("Cliente", quotation.client.displayName)}
              ${renderSummaryCard(
                "Proyecto",
                quotation.project
                  ? `${quotation.project.code} · ${quotation.project.title}`
                  : "Cotizacion general",
              )}
              ${renderSummaryCard("Estado", QUOTATION_STATUS_LABELS[quotation.status])}
              ${renderSummaryCard("Vigencia", formatQuotationDate(quotation.validUntil))}
              ${renderSummaryCard("Creada", formatQuotationDateTime(quotation.createdAt))}
              ${renderSummaryCard("Actualizada", formatQuotationDateTime(quotation.updatedAt))}
            </div>
          </section>

          ${renderSection("Productos cotizados", "Detalle comercial", itemTable)}

          <section class="section">
            <div class="section-header">
              <p class="section-eyebrow">Resumen</p>
              <h2>Totales</h2>
            </div>
            <div class="totals-grid">${totals}</div>
          </section>

          ${notesSections}
          ${materialBreakdown}

          <footer>
            ${
              includeInternal
                ? "Documento interno para costos, desperdicio y rentabilidad."
                : "Documento comercial listo para compartir con el cliente."
            }
          </footer>
        </main>
      </body>
    </html>
  `;
};

export const exportQuotationPdf = (
  quotation: QuotationDetailRecord,
  variant: QuotationPdfVariant,
) => {
  if (typeof window === "undefined") {
    return;
  }

  const printableWindow = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");

  if (!printableWindow) {
    throw new Error("No se pudo abrir la ventana de impresion para exportar la cotizacion.");
  }

  printableWindow.document.write(buildQuotationPrintMarkup(quotation, variant));
  printableWindow.document.close();
  printableWindow.focus();
  printableWindow.addEventListener(
    "load",
    () => {
      printableWindow.print();
    },
    { once: true },
  );
};
