import { formatEnumLabel, formatStatusLabel } from "@/lib/formatters";
import { INSTALLATION_STATUS_LABELS } from "@/modules/installation/constants";
import { POSTVENTA_STATUS_LABELS, POSTVENTA_TYPE_LABELS } from "@/modules/postventa/constants";
import { PRODUCTION_JOB_STATUS_LABELS } from "@/modules/production/constants";
import { QUOTATION_STATUS_LABELS } from "@/modules/quotations/constants";
import type {
  SerieValorRecord,
  TarjetaIndicadorRecord,
  UnidadIndicador,
} from "@/types";

const numberFormatter = new Intl.NumberFormat("es-BO");
const decimalFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const currencyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  style: "currency",
});

export const formatTableroValue = (
  value: number,
  unidad: UnidadIndicador | TarjetaIndicadorRecord["unidad"],
): string => {
  if (unidad === "moneda") {
    return currencyFormatter.format(value);
  }

  if (unidad === "porcentaje") {
    return `${decimalFormatter.format(value * 100)} %`;
  }

  if (unidad === "dias") {
    return `${decimalFormatter.format(value)} dias`;
  }

  if (unidad === "veces") {
    return `${decimalFormatter.format(value)} veces`;
  }

  return numberFormatter.format(value);
};

export const formatTableroCompacto = (
  value: number,
  unidad: UnidadIndicador | TarjetaIndicadorRecord["unidad"],
): string => {
  if (unidad === "porcentaje") {
    return `${decimalFormatter.format(value * 100)} %`;
  }

  if (unidad === "dias") {
    return `${decimalFormatter.format(value)} d`;
  }

  return formatTableroValue(value, unidad);
};

export const formatTendencia = (value: number | null): string => {
  if (value === null) {
    return "Sin referencia";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${decimalFormatter.format(value)}`;
};

export const getTendenciaStyles = (
  tendencia: "ALZA" | "BAJA" | "ESTABLE",
): string => {
  if (tendencia === "ALZA") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (tendencia === "BAJA") {
    return "bg-rose-50 text-rose-700";
  }

  return "bg-stone-100 text-stone-700";
};

export const traducirEtiquetaVisible = (value: string): string => {
  const quotationLabel =
    QUOTATION_STATUS_LABELS[value as keyof typeof QUOTATION_STATUS_LABELS];
  if (quotationLabel) {
    return quotationLabel;
  }

  const productionLabel =
    PRODUCTION_JOB_STATUS_LABELS[value as keyof typeof PRODUCTION_JOB_STATUS_LABELS];
  if (productionLabel) {
    return productionLabel;
  }

  const installationLabel =
    INSTALLATION_STATUS_LABELS[value as keyof typeof INSTALLATION_STATUS_LABELS];
  if (installationLabel) {
    return installationLabel;
  }

  const postventaStatus =
    POSTVENTA_STATUS_LABELS[value as keyof typeof POSTVENTA_STATUS_LABELS];
  if (postventaStatus) {
    return postventaStatus;
  }

  const postventaType = POSTVENTA_TYPE_LABELS[value as keyof typeof POSTVENTA_TYPE_LABELS];
  if (postventaType) {
    return postventaType;
  }

  return formatStatusLabel(value) || formatEnumLabel(value);
};

export const normalizarSerieLabels = (items: SerieValorRecord[]): SerieValorRecord[] => {
  return items.map((item) => ({
    ...item,
    etiqueta: traducirEtiquetaVisible(item.etiqueta),
  }));
};
