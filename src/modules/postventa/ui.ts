"use client";

import type {
  PostventaActivityStatus,
  PostventaCaseStatus,
  PostventaCostCategory,
  PostventaPriority,
  ProductWarrantyStatus,
} from "@/types";

import {
  POSTVENTA_ACTIVITY_STATUS_LABELS,
  POSTVENTA_COST_CATEGORY_LABELS,
  POSTVENTA_PRIORITY_LABELS,
  POSTVENTA_STATUS_LABELS,
  PRODUCT_WARRANTY_STATUS_LABELS,
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

export const formatPostventaCurrency = (value: number): string =>
  currencyFormatter.format(value);

export const formatPostventaPercent = (value: number | null): string =>
  value === null ? "No disponible" : `${percentFormatter.format(value)}%`;

export const formatPostventaDate = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
  }).format(new Date(value));
};

export const formatPostventaDateTime = (value: string | null): string => {
  if (!value) {
    return "No definido";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getPostventaStatusBadge = (status: PostventaCaseStatus) => {
  const label = POSTVENTA_STATUS_LABELS[status];

  if (status === "REPORTADO") {
    return {
      className: "bg-slate-100 text-slate-800",
      label,
    };
  }

  if (status === "EN_REVISION" || status === "VISITA_PROGRAMADA") {
    return {
      className: "bg-blue-100 text-blue-800",
      label,
    };
  }

  if (status === "EN_ATENCION" || status === "PENDIENTE_REPUESTO") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  if (status === "RESUELTO") {
    return {
      className: "bg-emerald-100 text-emerald-800",
      label,
    };
  }

  if (status === "RECHAZADO") {
    return {
      className: "bg-rose-100 text-rose-800",
      label,
    };
  }

  return {
    className: "bg-stone-200 text-stone-800",
    label,
  };
};

export const getPostventaPriorityBadge = (priority: PostventaPriority) => {
  const label = POSTVENTA_PRIORITY_LABELS[priority];

  if (priority === "CRITICA") {
    return {
      className: "bg-rose-100 text-rose-800",
      label,
    };
  }

  if (priority === "ALTA") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  if (priority === "MEDIA") {
    return {
      className: "bg-blue-100 text-blue-800",
      label,
    };
  }

  return {
    className: "bg-stone-100 text-stone-700",
    label,
  };
};

export const getWarrantyStatusBadge = (status: ProductWarrantyStatus) => {
  const label = PRODUCT_WARRANTY_STATUS_LABELS[status];

  if (status === "VIGENTE") {
    return {
      className: "bg-emerald-100 text-emerald-800",
      label,
    };
  }

  if (status === "VENCIDA") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  return {
    className: "bg-stone-200 text-stone-800",
    label,
  };
};

export const getPostventaActivityStatusBadge = (
  status: PostventaActivityStatus,
) => {
  const label = POSTVENTA_ACTIVITY_STATUS_LABELS[status];

  if (status === "EJECUTADA") {
    return {
      className: "bg-emerald-100 text-emerald-800",
      label,
    };
  }

  if (status === "PROGRAMADA") {
    return {
      className: "bg-blue-100 text-blue-800",
      label,
    };
  }

  if (status === "CANCELADA") {
    return {
      className: "bg-rose-100 text-rose-800",
      label,
    };
  }

  return {
    className: "bg-stone-100 text-stone-700",
    label,
  };
};

export const getPostventaCostCategoryBadge = (
  category: PostventaCostCategory,
) => {
  const label = POSTVENTA_COST_CATEGORY_LABELS[category];

  if (category === "GARANTIA") {
    return {
      className: "bg-emerald-100 text-emerald-800",
      label,
    };
  }

  if (category === "RECLAMO") {
    return {
      className: "bg-rose-100 text-rose-800",
      label,
    };
  }

  if (category === "REPOSICION" || category === "MATERIAL") {
    return {
      className: "bg-amber-100 text-amber-800",
      label,
    };
  }

  if (category === "VISITA" || category === "INSTALACION") {
    return {
      className: "bg-blue-100 text-blue-800",
      label,
    };
  }

  if (category === "MANO_DE_OBRA") {
    return {
      className: "bg-violet-100 text-violet-800",
      label,
    };
  }

  return {
    className: "bg-stone-100 text-stone-700",
    label,
  };
};
