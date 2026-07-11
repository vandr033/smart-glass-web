"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ClipboardList,
  FileImage,
  FileSpreadsheet,
  FileText,
  Package,
  RefreshCcw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { ExportMenu } from "@/components/ui/export-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { usePermissions } from "@/hooks/use-permissions";
import { formatEnumLabel } from "@/lib/formatters";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
  tableWrapperClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { INSTALLATION_ROUTES } from "@/modules/installation/constants";
import { QUOTATIONS_ROUTES } from "@/modules/quotations/constants";
import { RENTABILIDAD_ROUTES } from "@/modules/project-profitability/constants";
import { PROJECTS_ROUTES } from "@/modules/projects/constants";
import { inventoryService } from "@/services/inventory-service";
import { materialService } from "@/services/material-service";
import { postventaService } from "@/services/postventa-service";
import { userService } from "@/services/user-service";
import type {
  PostventaActivityType,
  PostventaCaseType,
  PostventaCostCategory,
  PostventaPriority,
  MaterialUnit,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  exportarCasoPostventaInternoPdf,
  exportarCasoPostventaPdf,
  exportarCierreGarantiaPdf,
  exportarCostosPostventaExcel,
} from "../exports";
import {
  GARANTIAS_PERMISSIONS,
  MATERIAL_UNIT_OPTIONS,
  POSTVENTA_ACTIVITY_STATUS_OPTIONS,
  POSTVENTA_ACTIVITY_TYPE_LABELS,
  POSTVENTA_ACTIVITY_TYPE_OPTIONS,
  POSTVENTA_COST_CATEGORY_OPTIONS,
  POSTVENTA_COST_ORIGIN_OPTIONS,
  POSTVENTA_EVIDENCE_TYPE_OPTIONS,
  POSTVENTA_PERMISSIONS,
  POSTVENTA_PRIORITY_OPTIONS,
  POSTVENTA_QUERY_KEYS,
  POSTVENTA_RESERVATION_TYPE_OPTIONS,
  POSTVENTA_ROUTES,
  POSTVENTA_STATUS_TRANSITION_OPTIONS,
  POSTVENTA_TYPE_OPTIONS,
} from "../constants";
import {
  formatPostventaCurrency,
  formatPostventaDate,
  formatPostventaDateTime,
  formatPostventaPercent,
  getPostventaActivityStatusBadge,
  getPostventaCostCategoryBadge,
  getPostventaPriorityBadge,
  getPostventaStatusBadge,
  getWarrantyStatusBadge,
} from "../ui";

type PostventaDetailPageProps = {
  caseId: string;
};

const buildIsoDate = (value: Date) => value.toISOString().slice(0, 10);

const todayValue = buildIsoDate(new Date());

const defaultEditForm: {
  commitmentDate: string;
  description: string;
  internalNotes: string;
  outsideWarranty: boolean;
  priority: PostventaPriority;
  proposedSolution: string;
  type: PostventaCaseType;
  warrantyId: string;
} = {
  commitmentDate: "",
  description: "",
  internalNotes: "",
  outsideWarranty: false,
  priority: "MEDIA",
  proposedSolution: "",
  type: "RECLAMO",
  warrantyId: "",
};

const defaultActivityForm = {
  description: "",
  executedAt: "",
  responsibleId: "",
  scheduledAt: "",
  status: "PENDIENTE" as const,
  type: "VISITA_REVISION" as PostventaActivityType,
};

const defaultCostForm = {
  amount: "",
  category: "DIAGNOSTICO" as PostventaCostCategory,
  costDate: todayValue,
  description: "",
  origin: "MANUAL" as const,
};

const defaultReservationForm: {
  expiresAt: string;
  inventoryStockId: string;
  materialId: string;
  notes: string;
  quantity: string;
  reservationType: "SOFT" | "FIRM";
  unit: MaterialUnit;
  warehouseId: string;
} = {
  expiresAt: "",
  inventoryStockId: "",
  materialId: "",
  notes: "",
  quantity: "1",
  reservationType: "SOFT",
  unit: "UNIT",
  warehouseId: "",
};

function InfoBlock(props: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
        {props.label}
      </p>
      <div className="mt-2 text-sm text-stone-900">{props.children}</div>
    </div>
  );
}

export default function PostventaDetailPage({ caseId }: PostventaDetailPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canUpdate = permissions.includes(POSTVENTA_PERMISSIONS.actualizar);
  const canAssign = permissions.includes(POSTVENTA_PERMISSIONS.asignar);
  const canClose = permissions.includes(POSTVENTA_PERMISSIONS.cerrar);
  const canExport = permissions.includes(POSTVENTA_PERMISSIONS.exportar);
  const canViewWarranties = permissions.includes(GARANTIAS_PERMISSIONS.ver);

  const [editForm, setEditForm] = useState(defaultEditForm);
  const [assignmentResponsibleId, setAssignmentResponsibleId] = useState("");
  const [statusSelection, setStatusSelection] = useState("EN_REVISION");
  const [statusNotes, setStatusNotes] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closeSolution, setCloseSolution] = useState("");
  const [activityForm, setActivityForm] = useState(defaultActivityForm);
  const [evidenceType, setEvidenceType] = useState<"DOCUMENTO" | "FOTO" | "OTRO" | "VIDEO">(
    "FOTO",
  );
  const [evidenceActivityId, setEvidenceActivityId] = useState("");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [costForm, setCostForm] = useState(defaultCostForm);
  const [reservationForm, setReservationForm] = useState(defaultReservationForm);
  const [consumeDraft, setConsumeDraft] = useState<{
    amount: string;
    category: PostventaCostCategory;
    costDate: string;
    description: string;
    reservationLinkId: string;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [costError, setCostError] = useState<string | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryFn: () => postventaService.getCaseById(caseId),
    queryKey: POSTVENTA_QUERY_KEYS.caso(caseId),
    staleTime: 30_000,
  });
  const detail = detailQuery.data;

  const usersQuery = useQuery({
    enabled: canAssign || canUpdate,
    queryFn: userService.getUserOptions,
    queryKey: ["postventa", "detalle", caseId, "usuarios"],
    staleTime: 60_000,
  });

  const warehousesQuery = useQuery({
    enabled: canUpdate,
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: ["postventa", "detalle", caseId, "almacenes"],
    staleTime: 60_000,
  });

  const materialsQuery = useQuery({
    enabled: canUpdate,
    queryFn: async () => {
      const result = await materialService.listMaterials({
        isStockable: true,
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["postventa", "detalle", caseId, "materiales"],
    staleTime: 60_000,
  });

  const stockQuery = useQuery({
    enabled: canUpdate && Boolean(reservationForm.materialId) && Boolean(reservationForm.warehouseId),
    queryFn: () =>
      inventoryService.listStock({
        materialId: reservationForm.materialId,
        page: 1,
        perPage: 50,
        sortBy: "quantity",
        sortDirection: "desc",
        warehouseId: reservationForm.warehouseId,
      }),
    queryKey: [
      "postventa",
      "detalle",
      caseId,
      "stock",
      reservationForm.materialId,
      reservationForm.warehouseId,
    ],
    staleTime: 30_000,
  });

  const caseWarrantiesQuery = useQuery({
    enabled: canViewWarranties && Boolean(detail?.client.id),
    queryFn: () =>
      postventaService.listWarranties({
        clientId: detail?.client.id,
        page: 1,
        perPage: 100,
        projectId: detail?.project?.id ?? undefined,
        sortBy: "endDate",
        sortDirection: "asc",
      }),
    queryKey: ["postventa", "detalle", caseId, "garantias", detail?.client.id, detail?.project?.id],
    staleTime: 30_000,
  });

  const refreshDetail = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: POSTVENTA_QUERY_KEYS.all,
      }),
      queryClient.invalidateQueries({
        queryKey: ["rentabilidad"],
      }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      postventaService.updateCase(caseId, {
        commitmentDate: editForm.commitmentDate || null,
        description: editForm.description.trim(),
        internalNotes: editForm.internalNotes.trim() || null,
        outsideWarranty: editForm.outsideWarranty,
        priority: editForm.priority,
        proposedSolution: editForm.proposedSolution.trim() || null,
        type: editForm.type,
        warrantyId: editForm.outsideWarranty ? null : editForm.warrantyId || null,
      }),
    onSuccess: async () => {
      setEditError(null);
      await refreshDetail();
    },
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      postventaService.assignCase(caseId, {
        responsibleId: assignmentResponsibleId || null,
      }),
    onSuccess: async () => {
      await refreshDetail();
    },
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      postventaService.changeCaseStatus(caseId, {
        notes: statusNotes.trim() || null,
        status: statusSelection as never,
      }),
    onSuccess: async () => {
      setStatusError(null);
      setStatusNotes("");
      await refreshDetail();
    },
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      postventaService.closeCase(caseId, {
        notes: closeNotes.trim() || null,
        proposedSolution: closeSolution.trim() || null,
      }),
    onSuccess: async () => {
      setStatusError(null);
      await refreshDetail();
    },
  });

  const activityMutation = useMutation({
    mutationFn: () =>
      postventaService.createActivity(caseId, {
        description: activityForm.description.trim(),
        executedAt: activityForm.executedAt || null,
        responsibleId: activityForm.responsibleId || null,
        scheduledAt: activityForm.scheduledAt || null,
        status: activityForm.status,
        type: activityForm.type,
      }),
    onSuccess: async () => {
      setActivityError(null);
      setActivityForm(defaultActivityForm);
      await refreshDetail();
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: (input: {
      activityId: string;
      payload: Parameters<typeof postventaService.updateActivity>[1];
    }) => postventaService.updateActivity(input.activityId, input.payload),
    onSuccess: async () => {
      await refreshDetail();
    },
  });

  const evidenceMutation = useMutation({
    mutationFn: async () => {
      if (!evidenceFile) {
        throw new Error("Debes seleccionar un archivo.");
      }

      return postventaService.uploadEvidence(caseId, {
        activityId: evidenceActivityId || null,
        description: evidenceDescription.trim() || null,
        file: evidenceFile,
        type: evidenceType,
      });
    },
    onSuccess: async () => {
      setEvidenceError(null);
      setEvidenceActivityId("");
      setEvidenceDescription("");
      setEvidenceFile(null);
      await refreshDetail();
    },
  });

  const costMutation = useMutation({
    mutationFn: () =>
      postventaService.createCost(caseId, {
        amount: Number(costForm.amount),
        category: costForm.category,
        costDate: costForm.costDate,
        description: costForm.description.trim(),
        origin: costForm.origin,
        referenceId: null,
      }),
    onSuccess: async () => {
      setCostError(null);
      setCostForm(defaultCostForm);
      await refreshDetail();
    },
  });

  const reservationMutation = useMutation({
    mutationFn: () =>
      postventaService.createReservation(caseId, {
        expiresAt: reservationForm.expiresAt || null,
        inventoryStockId: reservationForm.inventoryStockId || null,
        materialId: reservationForm.materialId,
        notes: reservationForm.notes.trim() || null,
        quantity: Number(reservationForm.quantity),
        reservationType: reservationForm.reservationType,
        unit: reservationForm.unit,
        warehouseId: reservationForm.warehouseId,
      }),
    onSuccess: async () => {
      setReservationError(null);
      setReservationForm(defaultReservationForm);
      await refreshDetail();
    },
  });

  const consumeMutation = useMutation({
    mutationFn: () => {
      if (!consumeDraft) {
        throw new Error("Selecciona una reserva para registrar el consumo.");
      }

      return postventaService.consumeReservation(consumeDraft.reservationLinkId, {
        amount: Number(consumeDraft.amount),
        category: consumeDraft.category,
        costDate: consumeDraft.costDate,
        description: consumeDraft.description.trim(),
      });
    },
    onSuccess: async () => {
      setConsumeDraft(null);
      await refreshDetail();
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (reservationLinkId: string) =>
      postventaService.releaseReservation(reservationLinkId),
    onSuccess: async () => {
      await refreshDetail();
    },
  });

  const selectedMaterial = useMemo(
    () => (materialsQuery.data ?? []).find((item) => item.id === reservationForm.materialId) ?? null,
    [materialsQuery.data, reservationForm.materialId],
  );

  useEffect(() => {
    if (!detail) {
      return;
    }

    // The detail response hydrates the editable draft once it is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditForm({
      commitmentDate: detail.commitmentDate?.slice(0, 10) ?? "",
      description: detail.description,
      internalNotes: detail.internalNotes ?? "",
      outsideWarranty: detail.outsideWarranty,
      priority: detail.priority,
      proposedSolution: detail.proposedSolution ?? "",
      type: detail.type,
      warrantyId: detail.warranty?.id ?? "",
    });
    setAssignmentResponsibleId(detail.responsible?.id ?? "");
    setStatusSelection(
      detail.status === "CERRADO"
        ? "RESUELTO"
        : detail.status,
    );
    setCloseSolution(detail.proposedSolution ?? "");
  }, [detail]);

  useEffect(() => {
    if (!selectedMaterial) {
      return;
    }

    // The selected material determines the unit used by the reservation draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReservationForm((current) => ({
      ...current,
      unit: selectedMaterial.stockUnit,
    }));
  }, [selectedMaterial]);

  if (detailQuery.isPending) {
    return <LoadingState cards={6} title="Cargando caso postventa" />;
  }

  if (
    detailQuery.isError ||
    usersQuery.isError ||
    warehousesQuery.isError ||
    materialsQuery.isError ||
    caseWarrantiesQuery.isError
  ) {
    return (
      <ErrorState
        description={
          detailQuery.error?.message ??
          usersQuery.error?.message ??
          warehousesQuery.error?.message ??
          materialsQuery.error?.message ??
          caseWarrantiesQuery.error?.message ??
          "No se pudo cargar el detalle del caso."
        }
        title="No se pudo abrir el caso postventa"
      />
    );
  }

  if (!detail) {
    return (
      <ErrorState
        description="El caso solicitado no esta disponible."
        title="Caso no encontrado"
      />
    );
  }

  const statusBadge = getPostventaStatusBadge(detail.status);
  const priorityBadge = getPostventaPriorityBadge(detail.priority);
  const warrantyBadge = detail.warranty ? getWarrantyStatusBadge(detail.warranty.status) : null;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link className={secondaryButtonClassName} href={POSTVENTA_ROUTES.listado}>
              Volver a postventa
            </Link>
            {canExport ? (
              <ExportMenu
                actions={[
                  {
                    icon: FileText,
                    id: "pdf-caso",
                    label: "PDF del caso",
                    onClick: () => {
                      exportarCasoPostventaPdf(detail);
                    },
                  },
                  {
                    icon: FileText,
                    id: "pdf-interno",
                    label: "PDF interno",
                    onClick: () => {
                      exportarCasoPostventaInternoPdf(detail);
                    },
                  },
                  {
                    icon: FileText,
                    id: "pdf-cierre-garantia",
                    label: "PDF cierre de garantia",
                    onClick: () => {
                      exportarCierreGarantiaPdf(detail);
                    },
                  },
                  {
                    icon: FileSpreadsheet,
                    id: "excel-costos",
                    label: "Excel de costos",
                    onClick: () => {
                      exportarCostosPostventaExcel(detail);
                    },
                  },
                ]}
                buttonClassName={secondaryButtonClassName}
                label="Exportaciones"
              />
            ) : null}
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                void refreshDetail();
              }}
              type="button"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Actualizar
            </button>
          </>
        }
        description="Coordina actividades, sube evidencia, registra costos y reservas, y cierra el caso dejando trazabilidad completa sobre garantia e impacto financiero."
        eyebrow="Caso postventa"
        title={`${detail.code} · ${detail.client.displayName}`}
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge.className}`}>
            {priorityBadge.label}
          </span>
          {warrantyBadge ? (
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${warrantyBadge.className}`}>
              {warrantyBadge.label}
            </span>
          ) : detail.outsideWarranty ? (
            <span className="inline-flex rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">
              Fuera de garantia
            </span>
          ) : null}
          <span className="text-sm text-stone-600">
            Responsable {detail.responsible?.name ?? "Sin asignar"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <InfoBlock label="Proyecto">
            {detail.project ? (
              <Link
                className="font-medium text-[color:var(--color-primary)]"
                href={PROJECTS_ROUTES.view(detail.project.id)}
              >
                {detail.project.code} · {detail.project.title}
              </Link>
            ) : (
              "Sin proyecto asociado"
            )}
          </InfoBlock>
          <InfoBlock label="Cotizacion">
            {detail.quotation ? (
              <Link
                className="font-medium text-[color:var(--color-primary)]"
                href={QUOTATIONS_ROUTES.view(detail.quotation.id)}
              >
                {detail.quotation.code}
              </Link>
            ) : (
              "Sin cotizacion asociada"
            )}
          </InfoBlock>
          <InfoBlock label="Instalacion">
            {detail.installation ? (
              <Link
                className="font-medium text-[color:var(--color-primary)]"
                href={INSTALLATION_ROUTES.detail(detail.installation.id)}
              >
                {detail.installation.code}
              </Link>
            ) : (
              "Sin instalacion asociada"
            )}
          </InfoBlock>
          <InfoBlock label="Fecha de reporte">
            {formatPostventaDate(detail.reportedAt)}
          </InfoBlock>
          <InfoBlock label="Fecha compromiso">
            {formatPostventaDate(detail.commitmentDate)}
          </InfoBlock>
          <InfoBlock label="Creado por">
            {detail.createdBy?.name ?? "Sistema"}
          </InfoBlock>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          description="Costo acumulado del caso registrado hasta el momento."
          icon={ShieldCheck}
          label="Costo total"
          value={formatPostventaCurrency(detail.financialImpact.costoTotal)}
        />
        <StatCard
          description="Impacto proporcional sobre la venta real del proyecto."
          icon={ClipboardList}
          label="Sobre venta"
          value={formatPostventaPercent(detail.financialImpact.porcentajeSobreVenta)}
        />
        <StatCard
          description="Impacto proporcional sobre la utilidad actual del proyecto."
          icon={ClipboardList}
          label="Sobre utilidad"
          value={formatPostventaPercent(detail.financialImpact.porcentajeSobreUtilidad)}
        />
        <StatCard
          description="Costo clasificado como garantia en este caso."
          icon={FileSpreadsheet}
          label="Costo garantia"
          value={formatPostventaCurrency(detail.financialImpact.costoGarantia)}
        />
        <StatCard
          description="Costo clasificado como reclamo o reposicion."
          icon={FileSpreadsheet}
          label="Reclamo y reposicion"
          value={formatPostventaCurrency(
            detail.financialImpact.costoReclamo + detail.financialImpact.costoReposicion,
          )}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className={sectionClassName}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Descripcion del problema
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Seguimiento del caso
            </h2>
          </div>

          <div className="mt-4 grid gap-3">
            <article className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
              <p className="text-sm leading-6 text-stone-800">{detail.description}</p>
            </article>
            <article className="rounded-md border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Solucion propuesta
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {detail.proposedSolution || "Todavia no se registro una solucion propuesta."}
              </p>
            </article>
            <article className="rounded-md border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Notas internas
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {detail.internalNotes || "Sin notas internas registradas."}
              </p>
            </article>
          </div>

          {canUpdate ? (
            <form
              className="mt-6 space-y-4 rounded-md border border-dashed border-stone-300 bg-white px-4 py-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setEditError(null);

                try {
                  await updateMutation.mutateAsync();
                } catch (error) {
                  setEditError(getApiErrorMessage(error));
                }
              }}
            >
              <div>
                <p className="font-semibold text-stone-950">Actualizar datos del caso</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      type: event.target.value as typeof current.type,
                    }));
                  }}
                  value={editForm.type}
                >
                  {POSTVENTA_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      priority: event.target.value as typeof current.priority,
                    }));
                  }}
                  value={editForm.priority}
                >
                  {POSTVENTA_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      commitmentDate: event.target.value,
                    }));
                  }}
                  type="date"
                  value={editForm.commitmentDate}
                />

                {canViewWarranties ? (
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setEditForm((current) => ({
                        ...current,
                        outsideWarranty: false,
                        warrantyId: event.target.value,
                      }));
                    }}
                    value={editForm.warrantyId}
                  >
                    <option value="">Sin garantia vinculada</option>
                    {(caseWarrantiesQuery.data?.data ?? []).map((warranty) => (
                      <option key={warranty.id} value={warranty.id}>
                        {warranty.productType} · vence {formatPostventaDate(warranty.endDate)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              <label className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                <input
                  checked={editForm.outsideWarranty}
                  onChange={(event) => {
                    setEditForm((current) => ({
                      ...current,
                      outsideWarranty: event.target.checked,
                      warrantyId: event.target.checked ? "" : current.warrantyId,
                    }));
                  }}
                  type="checkbox"
                />
                Marcar caso fuera de garantia
              </label>

              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setEditForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }));
                }}
                value={editForm.description}
              />
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setEditForm((current) => ({
                    ...current,
                    proposedSolution: event.target.value,
                  }));
                }}
                placeholder="Solucion propuesta"
                value={editForm.proposedSolution}
              />
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setEditForm((current) => ({
                    ...current,
                    internalNotes: event.target.value,
                  }));
                }}
                placeholder="Notas internas"
                value={editForm.internalNotes}
              />

              {editError ? <p className="text-sm text-rose-700">{editError}</p> : null}

              <button
                className={primaryButtonClassName}
                disabled={updateMutation.isPending}
                type="submit"
              >
                Guardar cambios
              </button>
            </form>
          ) : null}
        </section>

        <section className="grid gap-6">
          {(canAssign || canUpdate || canClose) ? (
            <section className={sectionClassName}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                  Asignacion y cierre
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                  Control operativo
                </h2>
              </div>

              {canAssign ? (
                <div className="mt-4 space-y-3">
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setAssignmentResponsibleId(event.target.value);
                    }}
                    value={assignmentResponsibleId}
                  >
                    <option value="">Sin responsable</option>
                    {(usersQuery.data ?? []).map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className={secondaryButtonClassName}
                    disabled={assignMutation.isPending}
                    onClick={() => {
                      void assignMutation.mutateAsync();
                    }}
                    type="button"
                  >
                    Asignar responsable
                  </button>
                </div>
              ) : null}

              {canUpdate ? (
                <div className="mt-6 space-y-3">
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setStatusSelection(event.target.value);
                    }}
                    value={statusSelection}
                  >
                    {POSTVENTA_STATUS_TRANSITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setStatusNotes(event.target.value);
                    }}
                    placeholder="Notas del cambio de estado"
                    value={statusNotes}
                  />
                  <button
                    className={secondaryButtonClassName}
                    disabled={statusMutation.isPending}
                    onClick={async () => {
                      setStatusError(null);

                      try {
                        await statusMutation.mutateAsync();
                      } catch (error) {
                        setStatusError(getApiErrorMessage(error));
                      }
                    }}
                    type="button"
                  >
                    Actualizar estado
                  </button>
                </div>
              ) : null}

              {canClose ? (
                <div className="mt-6 space-y-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="font-semibold text-stone-950">Cerrar caso</p>
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setCloseSolution(event.target.value);
                    }}
                    placeholder="Solucion final aplicada"
                    value={closeSolution}
                  />
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setCloseNotes(event.target.value);
                    }}
                    placeholder="Notas de cierre"
                    value={closeNotes}
                  />
                  <button
                    className={primaryButtonClassName}
                    disabled={closeMutation.isPending}
                    onClick={async () => {
                      setStatusError(null);

                      try {
                        await closeMutation.mutateAsync();
                      } catch (error) {
                        setStatusError(getApiErrorMessage(error));
                      }
                    }}
                    type="button"
                  >
                    Cerrar caso
                  </button>
                </div>
              ) : null}

              {statusError ? <p className="mt-4 text-sm text-rose-700">{statusError}</p> : null}
            </section>
          ) : null}

          {detail.project ? (
            <section className={sectionClassName}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                    Rentabilidad
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                    Impacto en el proyecto
                  </h2>
                </div>
                <Link
                  className={secondaryButtonClassName}
                  href={RENTABILIDAD_ROUTES.detalle(detail.project.id)}
                >
                  Ver rentabilidad
                </Link>
              </div>
              <div className="mt-4 grid gap-3">
                <article className="rounded-md border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                    Venta del proyecto
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {detail.financialImpact.ventaProyecto === null
                      ? "No disponible"
                      : formatPostventaCurrency(detail.financialImpact.ventaProyecto)}
                  </p>
                </article>
                <article className="rounded-md border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-stone-500">
                    Utilidad actual
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {detail.financialImpact.utilidadProyecto === null
                      ? "No disponible"
                      : formatPostventaCurrency(detail.financialImpact.utilidadProyecto)}
                  </p>
                </article>
              </div>
            </section>
          ) : null}
        </section>
      </div>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Actividades
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Visitas, diagnosticos y soluciones
            </h2>
          </div>
          <CalendarClock className="h-5 w-5 text-[color:var(--color-primary)]" />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {detail.activities.length === 0 ? (
              <EmptyState
                description="Programa una visita, registra un diagnostico o documenta la solucion aplicada."
                title="Sin actividades"
              />
            ) : (
              detail.activities.map((activity) => {
                const badge = getPostventaActivityStatusBadge(activity.status);

                return (
                  <article
                    key={activity.id}
                    className="rounded-md border border-stone-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {POSTVENTA_ACTIVITY_TYPE_LABELS[activity.type]}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-stone-700">
                          {activity.description}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-stone-600 md:grid-cols-3">
                      <p>Responsable {activity.responsible?.name ?? "Sin asignar"}</p>
                      <p>Programada {formatPostventaDateTime(activity.scheduledAt)}</p>
                      <p>Ejecutada {formatPostventaDateTime(activity.executedAt)}</p>
                    </div>
                    {canUpdate ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activity.status !== "EJECUTADA" ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              void updateActivityMutation.mutateAsync({
                                activityId: activity.id,
                                payload: {
                                  executedAt: new Date().toISOString(),
                                  status: "EJECUTADA",
                                },
                              });
                            }}
                            type="button"
                          >
                            Marcar ejecutada
                          </button>
                        ) : null}
                        {activity.status !== "CANCELADA" && activity.status !== "EJECUTADA" ? (
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              void updateActivityMutation.mutateAsync({
                                activityId: activity.id,
                                payload: {
                                  status: "CANCELADA",
                                },
                              });
                            }}
                            type="button"
                          >
                            Cancelar actividad
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>

          {canUpdate ? (
            <form
              className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setActivityError(null);

                try {
                  await activityMutation.mutateAsync();
                } catch (error) {
                  setActivityError(getApiErrorMessage(error));
                }
              }}
            >
              <p className="font-semibold text-stone-950">Registrar actividad</p>
              <div className="mt-4 grid gap-3">
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setActivityForm((current) => ({
                      ...current,
                      type: event.target.value as typeof current.type,
                    }));
                  }}
                  value={activityForm.type}
                >
                  {POSTVENTA_ACTIVITY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setActivityForm((current) => ({
                      ...current,
                      responsibleId: event.target.value,
                    }));
                  }}
                  value={activityForm.responsibleId}
                >
                  <option value="">Responsable de actividad</option>
                  {(usersQuery.data ?? []).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setActivityForm((current) => ({
                      ...current,
                      status: event.target.value as typeof current.status,
                    }));
                  }}
                  value={activityForm.status}
                >
                  {POSTVENTA_ACTIVITY_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setActivityForm((current) => ({
                      ...current,
                      scheduledAt: event.target.value,
                    }));
                  }}
                  type="datetime-local"
                  value={activityForm.scheduledAt}
                />
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setActivityForm((current) => ({
                      ...current,
                      executedAt: event.target.value,
                    }));
                  }}
                  type="datetime-local"
                  value={activityForm.executedAt}
                />
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setActivityForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }));
                  }}
                  placeholder="Detalle de la actividad, hallazgo o solucion"
                  required
                  value={activityForm.description}
                />
                {activityError ? <p className="text-sm text-rose-700">{activityError}</p> : null}
                <button
                  className={primaryButtonClassName}
                  disabled={activityMutation.isPending}
                  type="submit"
                >
                  Registrar actividad
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Evidencias
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Fotos, videos y documentos
            </h2>
          </div>
          <FileImage className="h-5 w-5 text-[color:var(--color-primary)]" />
        </div>

        {canUpdate ? (
          <form
            className="mt-4 grid gap-3 rounded-md border border-dashed border-stone-300 bg-white px-4 py-4 md:grid-cols-[0.8fr_0.9fr_1fr_auto]"
            onSubmit={async (event) => {
              event.preventDefault();
              setEvidenceError(null);

              try {
                await evidenceMutation.mutateAsync();
              } catch (error) {
                setEvidenceError(getApiErrorMessage(error));
              }
            }}
          >
            <select
              className={fieldClassName}
              onChange={(event) => {
                setEvidenceType(event.target.value as typeof evidenceType);
              }}
              value={evidenceType}
            >
              {POSTVENTA_EVIDENCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setEvidenceActivityId(event.target.value);
              }}
              value={evidenceActivityId}
            >
              <option value="">Sin actividad vinculada</option>
              {detail.activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {POSTVENTA_ACTIVITY_TYPE_LABELS[activity.type]}
                </option>
              ))}
            </select>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setEvidenceFile(event.target.files?.[0] ?? null);
              }}
              type="file"
            />
            <button
              className={primaryButtonClassName}
              disabled={evidenceMutation.isPending}
              type="submit"
            >
              Subir
            </button>
            <textarea
              className="md:col-span-4 min-h-24 rounded-md border border-[color:var(--color-border)] bg-[var(--color-surface-muted)] px-3.5 py-3 text-sm text-[color:var(--color-text)]"
              onChange={(event) => {
                setEvidenceDescription(event.target.value);
              }}
              placeholder="Descripcion de la evidencia"
              value={evidenceDescription}
            />
            {evidenceError ? (
              <p className="md:col-span-4 text-sm text-rose-700">{evidenceError}</p>
            ) : null}
          </form>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {detail.evidences.length === 0 ? (
            <EmptyState
              description="Adjunta fotos del daño, diagnosticos, actas o cualquier respaldo del caso."
              title="Sin evidencias"
            />
          ) : (
            detail.evidences.map((evidence) => (
              <article
                key={evidence.id}
                className="rounded-md border border-stone-200 bg-white px-4 py-4"
              >
                <p className="font-semibold text-stone-950">{evidence.fileName}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {formatEnumLabel(evidence.type)} · {formatPostventaDateTime(evidence.uploadedAt)}
                </p>
                <p className="mt-2 text-sm text-stone-700">
                  {evidence.description || "Sin descripcion"}
                </p>
                {evidence.mimeType?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={evidence.fileName}
                    className="mt-3 h-44 w-full rounded-md border border-stone-200 object-cover"
                    src={evidence.fileUrl}
                  />
                ) : null}
                <Link
                  className="mt-3 inline-flex text-sm font-semibold text-[color:var(--color-primary)]"
                  href={evidence.fileUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir archivo
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className={sectionClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                Costos
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Registro economico
              </h2>
            </div>
            <FileSpreadsheet className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>

          <div className={`mt-4 ${tableWrapperClassName}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50">
                  <tr className="text-left text-xs uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Origen</th>
                    <th className="px-4 py-3">Descripcion</th>
                    <th className="px-4 py-3">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {detail.costs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-stone-500" colSpan={5}>
                        No hay costos registrados.
                      </td>
                    </tr>
                  ) : (
                    detail.costs.map((cost) => {
                      const badge = getPostventaCostCategoryBadge(cost.category);

                      return (
                        <tr key={cost.id}>
                          <td className="px-4 py-3">{formatPostventaDate(cost.costDate)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatEnumLabel(cost.origin)}</td>
                          <td className="px-4 py-3 text-stone-700">{cost.description}</td>
                          <td className="px-4 py-3 font-semibold text-stone-950">
                            {formatPostventaCurrency(cost.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {canUpdate ? (
            <form
              className="mt-4 space-y-3 rounded-md border border-dashed border-stone-300 bg-white px-4 py-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setCostError(null);

                try {
                  await costMutation.mutateAsync();
                } catch (error) {
                  setCostError(getApiErrorMessage(error));
                }
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setCostForm((current) => ({
                      ...current,
                      category: event.target.value as typeof current.category,
                    }));
                  }}
                  value={costForm.category}
                >
                  {POSTVENTA_COST_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setCostForm((current) => ({
                      ...current,
                      origin: event.target.value as typeof current.origin,
                    }));
                  }}
                  value={costForm.origin}
                >
                  {POSTVENTA_COST_ORIGIN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClassName}
                  min="0.01"
                  onChange={(event) => {
                    setCostForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }));
                  }}
                  placeholder="Monto"
                  step="0.01"
                  type="number"
                  value={costForm.amount}
                />
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setCostForm((current) => ({
                      ...current,
                      costDate: event.target.value,
                    }));
                  }}
                  type="date"
                  value={costForm.costDate}
                />
              </div>
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setCostForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }));
                }}
                placeholder="Descripcion del costo"
                value={costForm.description}
              />
              {costError ? <p className="text-sm text-rose-700">{costError}</p> : null}
              <button
                className={primaryButtonClassName}
                disabled={costMutation.isPending}
                type="submit"
              >
                Registrar costo
              </button>
            </form>
          ) : null}
        </section>

        <section className={sectionClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
                Inventario
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Reservas y consumos
              </h2>
            </div>
            <Package className="h-5 w-5 text-[color:var(--color-primary)]" />
          </div>

          {canUpdate ? (
            <form
              className="mt-4 space-y-3 rounded-md border border-dashed border-stone-300 bg-white px-4 py-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setReservationError(null);

                try {
                  await reservationMutation.mutateAsync();
                } catch (error) {
                  setReservationError(getApiErrorMessage(error));
                }
              }}
            >
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setReservationForm((current) => ({
                    ...current,
                    inventoryStockId: "",
                    warehouseId: event.target.value,
                  }));
                }}
                value={reservationForm.warehouseId}
              >
                <option value="">Selecciona un almacen</option>
                {(warehousesQuery.data ?? []).map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} · {warehouse.name}
                  </option>
                ))}
              </select>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setReservationForm((current) => ({
                    ...current,
                    inventoryStockId: "",
                    materialId: event.target.value,
                  }));
                }}
                value={reservationForm.materialId}
              >
                <option value="">Selecciona un material o repuesto</option>
                {(materialsQuery.data ?? []).map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.code} · {material.name}
                  </option>
                ))}
              </select>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setReservationForm((current) => ({
                    ...current,
                    inventoryStockId: event.target.value,
                  }));
                }}
                value={reservationForm.inventoryStockId}
              >
                <option value="">Stock especifico opcional</option>
                {(stockQuery.data?.data ?? []).map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.locationCode || "Sin ubicacion"} · disponible {stock.availableQuantity} {stock.unit.toLowerCase()}
                  </option>
                ))}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className={fieldClassName}
                  min="0.01"
                  onChange={(event) => {
                    setReservationForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }));
                  }}
                  step="0.01"
                  type="number"
                  value={reservationForm.quantity}
                />
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setReservationForm((current) => ({
                      ...current,
                      unit: event.target.value as typeof current.unit,
                    }));
                  }}
                  value={reservationForm.unit}
                >
                  {MATERIAL_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setReservationForm((current) => ({
                      ...current,
                      reservationType: event.target.value as typeof current.reservationType,
                    }));
                  }}
                  value={reservationForm.reservationType}
                >
                  {POSTVENTA_RESERVATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setReservationForm((current) => ({
                      ...current,
                      expiresAt: event.target.value,
                    }));
                  }}
                  type="date"
                  value={reservationForm.expiresAt}
                />
              </div>
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setReservationForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }));
                }}
                placeholder="Notas de la reserva"
                value={reservationForm.notes}
              />
              {reservationError ? (
                <p className="text-sm text-rose-700">{reservationError}</p>
              ) : null}
              <button
                className={primaryButtonClassName}
                disabled={reservationMutation.isPending}
                type="submit"
              >
                Reservar repuesto
              </button>
            </form>
          ) : null}

          <div className="mt-4 space-y-3">
            {detail.inventoryReservations.length === 0 ? (
              <EmptyState
                description="Reserva vidrio, aluminio o accesorios desde inventario para atender este caso."
                title="Sin reservas vinculadas"
              />
            ) : (
              detail.inventoryReservations.map((reservation) => {
                const isActive = reservation.inventoryReservation.status === "ACTIVE";

                return (
                  <article
                    key={reservation.id}
                    className="rounded-md border border-stone-200 bg-white px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">
                          {reservation.inventoryReservation.material.code} ·{" "}
                          {reservation.inventoryReservation.material.name}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {reservation.inventoryReservation.warehouse.code} ·{" "}
                          {reservation.inventoryReservation.quantity}{" "}
                          {reservation.inventoryReservation.unit.toLowerCase()}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                        {formatEnumLabel(reservation.inventoryReservation.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-stone-700">
                      {reservation.notes || "Sin notas de reserva."}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      Vence {formatPostventaDate(reservation.inventoryReservation.expiresAt)}
                    </p>

                    {canUpdate && isActive ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className={secondaryButtonClassName}
                          onClick={() => {
                            setConsumeDraft({
                              amount: "",
                              category: "REPOSICION",
                              costDate: todayValue,
                              description: `Consumo de reserva ${reservation.inventoryReservation.material.code}`,
                              reservationLinkId: reservation.id,
                            });
                          }}
                          type="button"
                        >
                          Registrar consumo
                        </button>
                        <button
                          className={secondaryButtonClassName}
                          disabled={releaseMutation.isPending}
                          onClick={() => {
                            void releaseMutation.mutateAsync(reservation.id);
                          }}
                          type="button"
                        >
                          Liberar reserva
                        </button>
                      </div>
                    ) : null}

                    {consumeDraft?.reservationLinkId === reservation.id ? (
                      <div className="mt-4 grid gap-3 rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            className={fieldClassName}
                            min="0.01"
                            onChange={(event) => {
                              setConsumeDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      amount: event.target.value,
                                    }
                                  : current,
                              );
                            }}
                            placeholder="Monto del consumo"
                            step="0.01"
                            type="number"
                            value={consumeDraft.amount}
                          />
                          <input
                            className={fieldClassName}
                            onChange={(event) => {
                              setConsumeDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      costDate: event.target.value,
                                    }
                                  : current,
                              );
                            }}
                            type="date"
                            value={consumeDraft.costDate}
                          />
                          <select
                            className={fieldClassName}
                            onChange={(event) => {
                              setConsumeDraft((current) =>
                                current
                                  ? {
                                      ...current,
                                      category: event.target.value as PostventaCostCategory,
                                    }
                                  : current,
                              );
                            }}
                            value={consumeDraft.category}
                          >
                            {POSTVENTA_COST_CATEGORY_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          className={textAreaClassName}
                          onChange={(event) => {
                            setConsumeDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    description: event.target.value,
                                  }
                                : current,
                            );
                          }}
                          value={consumeDraft.description}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={primaryButtonClassName}
                            disabled={consumeMutation.isPending}
                            onClick={() => {
                              void consumeMutation.mutateAsync();
                            }}
                            type="button"
                          >
                            Confirmar consumo
                          </button>
                          <button
                            className={secondaryButtonClassName}
                            onClick={() => {
                              setConsumeDraft(null);
                            }}
                            type="button"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-primary)]">
              Historial
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Cambios de estado
            </h2>
          </div>
          <Wrench className="h-5 w-5 text-[color:var(--color-primary)]" />
        </div>

        <div className="mt-4 grid gap-3">
          {detail.statusHistory.length === 0 ? (
            <EmptyState
              description="Los cambios de estado del caso apareceran aqui."
              title="Sin historial"
            />
          ) : (
            detail.statusHistory.map((entry) => (
              <article
                key={entry.id}
                className="rounded-md border border-stone-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-stone-950">
                    {entry.fromStatus ? formatEnumLabel(entry.fromStatus) : "Inicio"} →{" "}
                    {formatEnumLabel(entry.toStatus)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {formatPostventaDateTime(entry.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-stone-700">
                  {entry.notes || "Sin observaciones registradas."}
                </p>
                <p className="mt-2 text-xs text-stone-500">
                  Cambiado por {entry.changedBy?.name ?? "Sistema"}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
