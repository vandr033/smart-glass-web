import axios from "axios";

import type { ApiErrorResponse } from "@/types";

const EXACT_MESSAGE_TRANSLATIONS: Record<string, string> = {
  "An unexpected error occurred.": "Ocurrio un error inesperado.",
  "Client not found.": "Cliente no encontrado.",
  "Material not found.": "Material no encontrado.",
  "Project not found.": "Proyecto no encontrado.",
  "Quotation not found.": "Cotizacion no encontrada.",
  "Some selected permissions are no longer supported by this ERP version.":
    "Algunos permisos seleccionados ya no son compatibles con esta version del ERP.",
  "Supplier not found.": "Proveedor no encontrado.",
  "User not found.": "Usuario no encontrado.",
  "Warehouse not found.": "Almacen no encontrado.",
  "Invalid input: expected nonoptional, received undefined":
    "Falta información requerida para actualizar el estado del proyecto.",
  "Reason is required when moving a project to cancelled or on hold.":
    "Indica un motivo para poner el proyecto en espera o cancelarlo.",
};

const translateValidationMessage = (message: string): string => {
  const normalizedMessage = message.trim();

  if (EXACT_MESSAGE_TRANSLATIONS[normalizedMessage]) {
    return EXACT_MESSAGE_TRANSLATIONS[normalizedMessage];
  }

  const requiredMatch = normalizedMessage.match(/^(.+?) is required\.$/i);
  if (requiredMatch) {
    return `${requiredMatch[1]} es obligatorio.`;
  }

  const validNumberMatch = normalizedMessage.match(
    /^(.+?) must be a valid number\.$/i,
  );
  if (validNumberMatch) {
    return `${validNumberMatch[1]} debe ser un numero valido.`;
  }

  const wholeNumberMatch = normalizedMessage.match(
    /^(.+?) must be a whole number\.$/i,
  );
  if (wholeNumberMatch) {
    return `${wholeNumberMatch[1]} debe ser un numero entero.`;
  }

  const minMatch = normalizedMessage.match(/^(.+?) must be at least (.+)\.$/i);
  if (minMatch) {
    return `${minMatch[1]} debe ser al menos ${minMatch[2]}.`;
  }

  const maxMatch = normalizedMessage.match(/^(.+?) must be at most (.+)\.$/i);
  if (maxMatch) {
    return `${maxMatch[1]} debe ser como maximo ${maxMatch[2]}.`;
  }

  if (/valid email address/i.test(normalizedMessage)) {
    return "Ingresa un correo valido.";
  }

  if (/valid url/i.test(normalizedMessage)) {
    return "Ingresa una URL valida.";
  }

  if (/not found/i.test(normalizedMessage)) {
    return "No se encontro el registro solicitado.";
  }

  if (
    /permission(?:Keys|Names): .*ERP foundation catalog/i.test(
      normalizedMessage,
    ) ||
    /no longer supported by this ERP version/i.test(normalizedMessage)
  ) {
    return "Algunos permisos seleccionados ya no son compatibles con esta version del ERP.";
  }

  if (
    /\b(?:is required|must be|cannot be|could not|not found|already exists|only |selected|available|supported|failed|created|updated|deleted|changed|assigned|enabled|disabled|pending|accepted|expired|revoked|warehouse|supplier|material|quotation|project|purchase|inventory|production|installation|profile|cutting|price list|import|file|quantity|currency|description|name|title|code|date|password|email|role|user|notification|invitation)\b/i.test(
      normalizedMessage,
    )
  ) {
    return "La información enviada no es válida.";
  }

  return normalizedMessage;
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return translateValidationMessage(
      error.response?.data?.message ?? error.message,
    );
  }

  if (error instanceof Error) {
    return translateValidationMessage(error.message);
  }

  return "Ocurrio un error inesperado.";
};
