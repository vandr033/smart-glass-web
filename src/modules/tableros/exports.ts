"use client";

import { exportHtmlToPdf, exportRowsToExcel, exportRowsToPdf } from "@/lib/exports";
import type { PanelEjecutivoRecord } from "@/types";

import { formatTableroValue, traducirEtiquetaVisible } from "./ui";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const pdfStyles = `
  body {
    margin: 0;
    background: #f5f7fb;
    color: #111827;
    font-family: "Segoe UI", Arial, sans-serif;
  }

  .page {
    max-width: 1120px;
    margin: 0 auto;
    padding: 28px;
  }

  .hero {
    display: grid;
    gap: 14px;
    border: 1px solid #dce4f2;
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
    line-height: 1.08;
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
    border: 1px solid #e2e8f0;
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
    font-size: 18px;
    font-weight: 700;
  }

  .section {
    display: grid;
    gap: 12px;
    margin-top: 24px;
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
    background: #eef2f7;
    color: #475569;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
`;

const buildIndicadorRows = (data: PanelEjecutivoRecord) =>
  data.indicadores.map((item) => ({
    Categoria: item.categoria,
    Indicador: item.nombre,
    Formula: item.formula,
    Meta:
      item.meta !== null
        ? formatTableroValue(item.meta, item.unidad)
        : "Sin meta",
    Periodo: item.periodo,
    Tendencia:
      item.tendencia === "ALZA"
        ? "Alza"
        : item.tendencia === "BAJA"
          ? "Baja"
          : "Estable",
    Valor: formatTableroValue(item.valorActual, item.unidad),
  }));

const buildDatosBaseRows = (data: PanelEjecutivoRecord) => {
  return [
    ...data.secciones.comercial.ventasPorPeriodo.map((item) => ({
      Area: "Comercial",
      Conjunto: "Ventas por periodo",
      Detalle: item.etiqueta,
      Referencia: item.periodo,
      Valor: formatTableroValue(item.valor, "moneda"),
    })),
    ...data.secciones.comercial.ventasPorCliente.map((item) => ({
      Area: "Comercial",
      Conjunto: "Ventas por cliente",
      Detalle: traducirEtiquetaVisible(item.etiqueta),
      Referencia: item.secundario ?? item.descripcion,
      Valor: formatTableroValue(item.valor, "moneda"),
    })),
    ...data.secciones.comercial.ventasPorVendedor.map((item) => ({
      Area: "Comercial",
      Conjunto: "Ventas por vendedor",
      Detalle: traducirEtiquetaVisible(item.etiqueta),
      Referencia: item.secundario ?? item.descripcion,
      Valor: formatTableroValue(item.valor, "moneda"),
    })),
    ...data.secciones.operaciones.cumplimiento.map((item) => ({
      Area: "Operaciones",
      Conjunto: "Cumplimiento",
      Detalle: traducirEtiquetaVisible(item.etiqueta),
      Referencia: item.detalle,
      Valor: formatTableroValue(item.valor, item.unidad),
    })),
    ...data.secciones.inventario.resumen.map((item) => ({
      Area: "Inventario",
      Conjunto: "Resumen",
      Detalle: traducirEtiquetaVisible(item.etiqueta),
      Referencia: item.detalle,
      Valor: formatTableroValue(item.valor, item.unidad),
    })),
    ...data.secciones.financiero.resumen.map((item) => ({
      Area: "Rentabilidad",
      Conjunto: "Resumen financiero",
      Detalle: traducirEtiquetaVisible(item.etiqueta),
      Referencia:
        item.porcentaje !== null
          ? formatTableroValue(item.porcentaje, "porcentaje")
          : "Sin porcentaje",
      Valor: formatTableroValue(item.valor, "moneda"),
    })),
    ...data.secciones.postventa.resumen.map((item) => ({
      Area: "Postventa",
      Conjunto: "Resumen",
      Detalle: traducirEtiquetaVisible(item.etiqueta),
      Referencia: item.detalle,
      Valor: formatTableroValue(item.valor, item.unidad),
    })),
  ];
};

const buildExecutiveMarkup = (data: PanelEjecutivoRecord) => `
  <main class="page">
    <section class="hero">
      <p class="eyebrow">Vidriera Sebitas ERP</p>
      <h1 class="title">${escapeHtml(data.tablero.nombre)}</h1>
      <p class="description">${escapeHtml(data.tablero.descripcion)}</p>
      <div class="grid">
        ${data.tarjetas
          .slice(0, 8)
          .map(
            (card) => `
              <article class="card">
                <div class="label">${escapeHtml(card.titulo)}</div>
                <div class="value">${escapeHtml(
                  formatTableroValue(card.valor, card.unidad),
                )}</div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>

    <section class="section">
      <h2>Resumen financiero</h2>
      <table>
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Valor</th>
            <th>Referencia</th>
          </tr>
        </thead>
        <tbody>
          ${data.secciones.financiero.resumen
            .map(
              (item) => `
                <tr>
                  <td>${escapeHtml(traducirEtiquetaVisible(item.etiqueta))}</td>
                  <td>${escapeHtml(formatTableroValue(item.valor, "moneda"))}</td>
                  <td>${escapeHtml(
                    item.porcentaje !== null
                      ? formatTableroValue(item.porcentaje, "porcentaje")
                      : "Sin porcentaje",
                  )}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </section>
  </main>
`;

export const exportarPanelEjecutivoPdf = (data: PanelEjecutivoRecord) => {
  exportHtmlToPdf({
    html: buildExecutiveMarkup(data),
    styles: pdfStyles,
    title: "Panel ejecutivo",
  });
};

export const exportarReporteComercialPdf = (data: PanelEjecutivoRecord) => {
  exportRowsToPdf(
    [
      ...data.secciones.comercial.ventasPorPeriodo.map((item) => ({
        Conjunto: "Ventas por periodo",
        Detalle: item.etiqueta,
        Valor: formatTableroValue(item.valor, "moneda"),
      })),
      ...data.secciones.comercial.cotizacionesPorEstado.map((item) => ({
        Conjunto: "Cotizaciones por estado",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "numero"),
      })),
      ...data.secciones.comercial.ventasPorCliente.map((item) => ({
        Conjunto: "Ventas por cliente",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "moneda"),
      })),
      ...data.secciones.comercial.ventasPorVendedor.map((item) => ({
        Conjunto: "Ventas por vendedor",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "moneda"),
      })),
    ],
    {
      fileName: "reporte-comercial",
      subtitle: data.tablero.descripcion,
      title: "Reporte comercial",
    },
  );
};

export const exportarReporteOperativoPdf = (data: PanelEjecutivoRecord) => {
  exportRowsToPdf(
    [
      ...data.secciones.operaciones.cumplimiento.map((item) => ({
        Conjunto: "Cumplimiento",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, item.unidad),
      })),
      ...data.secciones.operaciones.alertasOperativas.map((item) => ({
        Conjunto: "Alertas operativas",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "dias"),
      })),
    ],
    {
      fileName: "reporte-operativo",
      subtitle: data.tablero.descripcion,
      title: "Reporte operativo",
    },
  );
};

export const exportarReporteFinancieroPdf = (data: PanelEjecutivoRecord) => {
  exportRowsToPdf(
    [
      ...data.secciones.financiero.resumen.map((item) => ({
        Conjunto: "Resumen financiero",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "moneda"),
      })),
      ...data.secciones.financiero.proyectosEnPerdida.map((item) => ({
        Conjunto: "Proyectos en perdida",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "moneda"),
      })),
      ...data.secciones.financiero.desviacionProyectos.map((item) => ({
        Conjunto: "Desviacion por proyecto",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "moneda"),
      })),
    ],
    {
      fileName: "reporte-financiero",
      subtitle: data.tablero.descripcion,
      title: "Reporte financiero",
    },
  );
};

export const exportarReportePostventaPdf = (data: PanelEjecutivoRecord) => {
  exportRowsToPdf(
    [
      ...data.secciones.postventa.resumen.map((item) => ({
        Conjunto: "Resumen postventa",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, item.unidad),
      })),
      ...data.secciones.postventa.reclamosPorTipo.map((item) => ({
        Conjunto: "Reclamos por tipo",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "numero"),
      })),
      ...data.secciones.postventa.reclamosPorProyecto.map((item) => ({
        Conjunto: "Reclamos por proyecto",
        Detalle: traducirEtiquetaVisible(item.etiqueta),
        Valor: formatTableroValue(item.valor, "numero"),
      })),
    ],
    {
      fileName: "reporte-postventa",
      subtitle: data.tablero.descripcion,
      title: "Reporte postventa",
    },
  );
};

export const exportarIndicadoresExcel = (data: PanelEjecutivoRecord) => {
  exportRowsToExcel(buildIndicadorRows(data), {
    fileName: "indicadores-ejecutivos",
    subtitle: data.tablero.descripcion,
    title: "Indicadores de gestion",
  });
};

export const exportarDatosBaseExcel = (data: PanelEjecutivoRecord) => {
  exportRowsToExcel(buildDatosBaseRows(data), {
    fileName: "datos-base-bi",
    subtitle: data.tablero.descripcion,
    title: "Datos base de inteligencia de negocio",
  });
};
