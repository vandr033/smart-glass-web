"use client";

import { exportHtmlToPdf } from "@/lib/exports";
import type {
  PortalCotizacionDetalle,
  PortalGarantiaDocumento,
  PortalInstalacionDetalle,
} from "@/types";
import {
  COTIZACION_STATUS_LABELS,
  GARANTIA_STATUS_LABELS,
  INSTALACION_STATUS_LABELS,
  formatPortalCurrency,
  formatPortalDate,
  getLabel,
} from "./ui";

const card = (title: string, body: string) => `
  <section style="border:1px solid #e7dfd2;border-radius:18px;padding:18px 20px;margin-bottom:16px;">
    <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9a5b1b;font-weight:700;">${title}</p>
    ${body}
  </section>
`;

export const exportarCotizacionPortalPdf = (quotation: PortalCotizacionDetalle) => {
  exportHtmlToPdf({
    html: `
      <header style="margin-bottom:24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a5b1b;font-weight:700;">Vidriera Sebitas ERP</p>
        <h1 style="margin:10px 0 0;font-size:30px;color:#2f2217;">Cotizacion comercial ${quotation.code}</h1>
        <p style="margin:10px 0 0;color:#6f6256;">Estado: ${getLabel(COTIZACION_STATUS_LABELS, quotation.status)}</p>
      </header>
      ${card(
        "Resumen",
        `
          <p style="margin:0 0 8px;"><strong>Cliente:</strong> ${quotation.client.displayName}</p>
          <p style="margin:0 0 8px;"><strong>Proyecto:</strong> ${quotation.project?.title ?? "Sin proyecto asignado"}</p>
          <p style="margin:0 0 8px;"><strong>Valida hasta:</strong> ${formatPortalDate(quotation.validUntil)}</p>
          <p style="margin:0;"><strong>Total:</strong> ${formatPortalCurrency(quotation.totalSale, quotation.currency)}</p>
        `,
      )}
      ${card(
        "Items",
        quotation.items
          .map(
            (item) => `
              <div style="padding:12px 0;border-bottom:1px solid #efe7da;">
                <p style="margin:0;font-weight:700;">${item.name}</p>
                <p style="margin:6px 0 0;color:#6f6256;">${item.description ?? "Sin descripcion adicional."}</p>
                <p style="margin:6px 0 0;color:#6f6256;">Cantidad: ${item.quantity}</p>
                <p style="margin:6px 0 0;color:#2f2217;">Subtotal: ${formatPortalCurrency(item.subtotalSale, quotation.currency)}</p>
              </div>
            `,
          )
          .join(""),
      )}
    `,
    title: `cotizacion-${quotation.code}`,
  });
};

export const exportarReporteInstalacionPortalPdf = (
  installation: PortalInstalacionDetalle,
) => {
  exportHtmlToPdf({
    html: `
      <header style="margin-bottom:24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a5b1b;font-weight:700;">Vidriera Sebitas ERP</p>
        <h1 style="margin:10px 0 0;font-size:30px;color:#2f2217;">Reporte de instalacion ${installation.code}</h1>
        <p style="margin:10px 0 0;color:#6f6256;">Estado: ${getLabel(INSTALACION_STATUS_LABELS, installation.status)}</p>
      </header>
      ${card(
        "Agenda",
        `
          <p style="margin:0 0 8px;"><strong>Fecha:</strong> ${formatPortalDate(installation.scheduledDate)}</p>
          <p style="margin:0 0 8px;"><strong>Horario:</strong> ${installation.scheduledStartTime ?? "Por definir"} - ${installation.scheduledEndTime ?? "Por definir"}</p>
          <p style="margin:0;"><strong>Direccion:</strong> ${installation.address?.address ?? "Sin direccion registrada"}</p>
        `,
      )}
      ${card(
        "Tareas",
        installation.tasks
          .map(
            (task) => `
              <div style="padding:12px 0;border-bottom:1px solid #efe7da;">
                <p style="margin:0;font-weight:700;">${task.title}</p>
                <p style="margin:6px 0 0;color:#6f6256;">${task.description ?? "Sin detalle adicional."}</p>
                <p style="margin:6px 0 0;color:#6f6256;">Estado: ${getLabel(INSTALACION_STATUS_LABELS, task.status)}</p>
              </div>
            `,
          )
          .join(""),
      )}
      ${
        installation.notes
          ? card(
              "Observaciones",
              `<p style="margin:0;color:#302016;">${installation.notes}</p>`,
            )
          : ""
      }
    `,
    title: `reporte-instalacion-${installation.code}`,
  });
};

export const exportarGarantiaPortalPdf = (warranty: PortalGarantiaDocumento) => {
  exportHtmlToPdf({
    html: `
      <header style="margin-bottom:24px;">
        <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9a5b1b;font-weight:700;">Vidriera Sebitas ERP</p>
        <h1 style="margin:10px 0 0;font-size:30px;color:#2f2217;">Certificado de garantia</h1>
        <p style="margin:10px 0 0;color:#6f6256;">Estado: ${getLabel(GARANTIA_STATUS_LABELS, warranty.status)}</p>
      </header>
      ${card(
        "Datos",
        `
          <p style="margin:0 0 8px;"><strong>Cliente:</strong> ${warranty.client.displayName}</p>
          <p style="margin:0 0 8px;"><strong>Proyecto:</strong> ${warranty.project?.title ?? "Sin proyecto asociado"}</p>
          <p style="margin:0 0 8px;"><strong>Producto:</strong> ${warranty.productType}</p>
          <p style="margin:0 0 8px;"><strong>Inicio:</strong> ${formatPortalDate(warranty.startDate)}</p>
          <p style="margin:0;"><strong>Fin:</strong> ${formatPortalDate(warranty.endDate)}</p>
        `,
      )}
      ${card(
        "Condiciones",
        `<p style="margin:0;color:#302016;">${warranty.conditions ?? "Sin condiciones adicionales registradas."}</p>`,
      )}
    `,
    title: `garantia-${warranty.id}`,
  });
};
