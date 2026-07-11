"use client";

import type {
  AlertaRentabilidadRecord,
  CostoProyectoCategoria,
  ProjectType,
  RentabilidadProyectoEstado,
} from "@/types";

import {
  ALERTA_RENTABILIDAD_LABELS,
  COSTO_CATEGORIA_LABELS,
  RENTABILIDAD_ESTADO_LABELS,
  TIPO_PROYECTO_LABELS,
} from "./constants";

const currencyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const percentFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const formatRentabilidadCurrency = (value: number): string =>
  currencyFormatter.format(value);

export const formatRentabilidadPercent = (value: number): string =>
  `${percentFormatter.format(value)}%`;

export const formatRentabilidadNumber = (value: number): string =>
  numberFormatter.format(value);

export const getRentabilidadEstadoBadge = (estado: RentabilidadProyectoEstado) => {
  const label = RENTABILIDAD_ESTADO_LABELS[estado];

  if (estado === "ANALIZADO") {
    return {
      className: "bg-emerald-100 text-emerald-800",
      label,
    };
  }

  if (estado === "CERRADO") {
    return {
      className: "bg-sky-100 text-sky-800",
      label,
    };
  }

  if (estado === "PENDIENTE_DE_CIERRE") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  return {
    className: "bg-stone-100 text-stone-800",
    label,
  };
};

export const getCostoCategoriaBadge = (categoria: CostoProyectoCategoria) => {
  const label = COSTO_CATEGORIA_LABELS[categoria];

  if (categoria === "MATERIALES") {
    return {
      className: "bg-blue-100 text-blue-800",
      label,
    };
  }

  if (categoria === "MANO_DE_OBRA") {
    return {
      className: "bg-violet-100 text-violet-800",
      label,
    };
  }

  if (categoria === "INSTALACION") {
    return {
      className: "bg-orange-100 text-orange-800",
      label,
    };
  }

  if (categoria === "TRANSPORTE") {
    return {
      className: "bg-cyan-100 text-cyan-800",
      label,
    };
  }

  if (categoria === "GARANTIAS") {
    return {
      className: "bg-emerald-100 text-emerald-800",
      label,
    };
  }

  if (categoria === "RECLAMOS") {
    return {
      className: "bg-rose-100 text-rose-800",
      label,
    };
  }

  if (categoria === "REPOSICIONES") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  return {
    className: "bg-stone-100 text-stone-800",
    label,
  };
};

export const getAlertaRentabilidadBadge = (
  alerta: AlertaRentabilidadRecord,
) => {
  const label = ALERTA_RENTABILIDAD_LABELS[alerta.tipo];

  if (alerta.severidad === "ALTA") {
    return {
      className: "bg-rose-100 text-rose-800",
      label,
    };
  }

  if (alerta.severidad === "MEDIA") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  return {
    className: "bg-sky-100 text-sky-800",
    label,
  };
};

export const formatTipoProyecto = (projectType: ProjectType): string =>
  TIPO_PROYECTO_LABELS[projectType];
