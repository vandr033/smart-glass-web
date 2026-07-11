"use client";

import { clientPortalService } from "@/services/client-portal-service";
import { exportarCotizacionPortalPdf, exportarGarantiaPortalPdf, exportarReporteInstalacionPortalPdf } from "./exports";

const abrirArchivo = (fileUrl: string | null) => {
  if (!fileUrl) {
    throw new Error("El archivo solicitado no se encuentra disponible.");
  }

  window.open(fileUrl, "_blank", "noopener,noreferrer");
};

export const descargarCotizacionPortal = async (quotationId: string) => {
  const quotation = await clientPortalService.getQuotationPdfData(quotationId);
  exportarCotizacionPortalPdf(quotation);
};

export const descargarReporteInstalacionPortal = async (orderId: string) => {
  const installation = await clientPortalService.getInstallationReportData(orderId);
  exportarReporteInstalacionPortalPdf(installation);
};

export const descargarGarantiaPortal = async (warrantyId: string) => {
  const warranty = await clientPortalService.getWarrantyPdfData(warrantyId);
  exportarGarantiaPortalPdf(warranty);
};

export const descargarDocumentoPortal = async (documentId: string) => {
  const document = await clientPortalService.getDocumentDownload(documentId);

  if (document.downloadKind === "ARCHIVO") {
    abrirArchivo(document.fileUrl);
    return;
  }

  if (document.downloadKind === "COTIZACION_PDF") {
    await descargarCotizacionPortal(document.referenceId);
    return;
  }

  if (document.downloadKind === "REPORTE_INSTALACION_PDF") {
    await descargarReporteInstalacionPortal(document.referenceId);
    return;
  }

  await descargarGarantiaPortal(document.referenceId);
};

export const abrirArchivoPortal = abrirArchivo;
