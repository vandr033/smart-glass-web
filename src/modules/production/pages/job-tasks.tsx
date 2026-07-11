"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import {
  fieldClassName,
  formatDateValue,
  primaryButtonClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { MATERIAL_UNIT_OPTIONS } from "@/modules/materials/constants";
import { inventoryService } from "@/services/inventory-service";
import { productionService } from "@/services/production-service";
import { userService } from "@/services/user-service";
import type {
  MaterialConsumptionSourceType,
  MaterialConsumptionType,
  MaterialUnit,
  ProductionTaskStatus,
} from "@/types";
import { getApiErrorMessage } from "@/utils";

import {
  PRODUCTION_PERMISSIONS,
  PRODUCTION_QUERY_KEYS,
  PRODUCTION_ROUTES,
} from "../constants";
import {
  getProductionTaskStatusBadge,
  getProductionTaskTypeLabel,
} from "../ui";

type ProductionJobTasksPageProps = {
  jobId: string;
};

const TASK_STATUS_OPTIONS: ProductionTaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
  "CANCELLED",
];

const CONSUMPTION_TYPE_OPTIONS: MaterialConsumptionType[] = [
  "ACTUAL",
  "WASTE",
  "SCRAP",
];
const SOURCE_TYPE_OPTIONS: MaterialConsumptionSourceType[] = [
  "MANUAL",
  "INVENTORY_STOCK",
  "REMNANT",
];

const parseOptionalNumber = (value: string): number | null => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const parseRequiredNumber = (value: string): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

export default function ProductionJobTasksPage({
  jobId,
}: ProductionJobTasksPageProps) {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canUpdate = permissions.includes(PRODUCTION_PERMISSIONS.update);
  const canConsume = permissions.includes(
    PRODUCTION_PERMISSIONS.consumeMaterial,
  );

  const [replaceExistingTasks, setReplaceExistingTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<
    Record<
      string,
      {
        assignedToUserId: string;
        description: string;
        sortOrder: string;
        status: ProductionTaskStatus;
        title: string;
      }
    >
  >({});
  const [materialSelectionByTask, setMaterialSelectionByTask] = useState<
    Record<string, string>
  >({});

  const [consumptionType, setConsumptionType] =
    useState<MaterialConsumptionType>("ACTUAL");
  const [sourceType, setSourceType] =
    useState<MaterialConsumptionSourceType>("MANUAL");
  const [inventoryStockId, setInventoryStockId] = useState("");
  const [remnantPieceId, setRemnantPieceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<MaterialUnit>("UNIT");
  const [notes, setNotes] = useState("");
  const [actualWasteAreaM2, setActualWasteAreaM2] = useState("");
  const [scrapQuantity, setScrapQuantity] = useState("");
  const [scrapUnit, setScrapUnit] = useState<MaterialUnit>("UNIT");
  const [createRemnantOutput, setCreateRemnantOutput] = useState(false);
  const [remnantCode, setRemnantCode] = useState("");
  const [remnantWarehouseId, setRemnantWarehouseId] = useState("");
  const [remnantQuantity, setRemnantQuantity] = useState("1");
  const [remnantWidthMm, setRemnantWidthMm] = useState("");
  const [remnantLengthMm, setRemnantLengthMm] = useState("");
  const [remnantThicknessMm, setRemnantThicknessMm] = useState("");
  const [remnantNotes, setRemnantNotes] = useState("");

  const jobQuery = useQuery({
    queryFn: () => productionService.getJobById(jobId),
    queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
    staleTime: 30_000,
  });
  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["production", "job-tasks", jobId, "users"],
    staleTime: 60_000,
  });
  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses({ status: "ACTIVE" }),
    queryKey: ["production", "job-tasks", jobId, "warehouses"],
    staleTime: 60_000,
  });

  const materialOptions = (() => {
    const uniqueMaterials = new Map<
      string,
      { code: string; id: string; name: string }
    >();

    for (const item of jobQuery.data?.items ?? []) {
      if (item.material) {
        uniqueMaterials.set(item.material.id, item.material);
      }
    }

    for (const consumption of jobQuery.data?.materialConsumptions ?? []) {
      if (consumption.material) {
        uniqueMaterials.set(consumption.material.id, consumption.material);
      }
    }

    return Array.from(uniqueMaterials.values());
  })();
  const activeTaskId = selectedTaskId || jobQuery.data?.tasks[0]?.id || "";
  const selectedTask =
    jobQuery.data?.tasks.find((task) => task.id === activeTaskId) ?? null;
  const selectedTaskItem = selectedTask?.productionJobItemId
    ? (jobQuery.data?.items.find(
        (item) => item.id === selectedTask.productionJobItemId,
      ) ?? null)
    : null;
  const taskDraft = (activeTaskId ? taskDrafts[activeTaskId] : undefined) ?? {
    assignedToUserId: selectedTask?.assignedToUser?.id ?? "",
    description: selectedTask?.description ?? "",
    sortOrder: String(selectedTask?.sortOrder ?? 0),
    status: selectedTask?.status ?? "PENDING",
    title: selectedTask?.title ?? "",
  };
  const activeMaterialId =
    (activeTaskId ? materialSelectionByTask[activeTaskId] : undefined) ??
    selectedTaskItem?.material?.id ??
    materialOptions[0]?.id ??
    "";

  const stocksQuery = useQuery({
    enabled: Boolean(activeMaterialId),
    queryFn: async () => {
      const result = await inventoryService.listStock({
        condition: "AVAILABLE",
        materialId: activeMaterialId,
        page: 1,
        perPage: 100,
        sortBy: "quantity",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["production", "job-tasks", jobId, "stock", activeMaterialId],
    staleTime: 30_000,
  });
  const remnantsQuery = useQuery({
    enabled: Boolean(activeMaterialId),
    queryFn: async () => {
      const result = await inventoryService.listRemnants({
        materialId: activeMaterialId,
        page: 1,
        perPage: 100,
        sortBy: "usableAreaM2",
        sortDirection: "desc",
        status: "AVAILABLE",
      });

      return result.data;
    },
    queryKey: ["production", "job-tasks", jobId, "remnants", activeMaterialId],
    staleTime: 30_000,
  });

  const refreshProductionData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["production"],
      }),
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_QUERY_KEYS.jobDetail(jobId),
      }),
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_QUERY_KEYS.jobTasks(jobId),
      }),
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_QUERY_KEYS.jobConsumption(jobId),
      }),
      queryClient.invalidateQueries({
        queryKey: PRODUCTION_QUERY_KEYS.jobWaste(jobId),
      }),
    ]);
  };

  const generateTasksMutation = useMutation({
    mutationFn: () =>
      productionService.generateTasks(jobId, replaceExistingTasks),
    onSuccess: refreshProductionData,
  });
  const updateTaskMutation = useMutation({
    mutationFn: () =>
      productionService.updateTask(activeTaskId, {
        assignedToUserId: taskDraft.assignedToUserId || null,
        description: taskDraft.description.trim() || null,
        sortOrder: Number(taskDraft.sortOrder),
        status: taskDraft.status,
        title: taskDraft.title.trim(),
      }),
    onSuccess: refreshProductionData,
  });
  const startTaskMutation = useMutation({
    mutationFn: () => productionService.startTask(activeTaskId),
    onSuccess: refreshProductionData,
  });
  const completeTaskMutation = useMutation({
    mutationFn: () => productionService.completeTask(activeTaskId),
    onSuccess: refreshProductionData,
  });
  const consumeMutation = useMutation({
    mutationFn: () =>
      productionService.consumeMaterial(activeTaskId, {
        actualWasteAreaM2: parseOptionalNumber(actualWasteAreaM2),
        consumptionType,
        inventoryStockId: inventoryStockId || null,
        materialId: activeMaterialId || null,
        notes: notes.trim() || null,
        quantity: parseRequiredNumber(quantity),
        remnantOutput: createRemnantOutput
          ? {
              code: remnantCode.trim() || null,
              lengthMm: parseOptionalNumber(remnantLengthMm),
              notes: remnantNotes.trim() || null,
              quantity: parseRequiredNumber(remnantQuantity),
              thicknessMm: parseOptionalNumber(remnantThicknessMm),
              unit,
              warehouseId: remnantWarehouseId,
              widthMm: parseOptionalNumber(remnantWidthMm),
            }
          : null,
        remnantPieceId: remnantPieceId || null,
        scrapQuantity: parseOptionalNumber(scrapQuantity),
        scrapUnit: scrapQuantity.trim() ? scrapUnit : null,
        sourceType,
        unit,
      }),
    onSuccess: async () => {
      await refreshProductionData();
      setNotes("");
      setActualWasteAreaM2("");
      setScrapQuantity("");
      setCreateRemnantOutput(false);
      setRemnantCode("");
      setRemnantLengthMm("");
      setRemnantNotes("");
      setRemnantQuantity("1");
      setRemnantThicknessMm("");
      setRemnantWidthMm("");
    },
  });

  if (jobQuery.isPending || usersQuery.isPending || warehousesQuery.isPending) {
    return <LoadingState title="Cargando tareas de producción" />;
  }

  if (jobQuery.isError || usersQuery.isError || warehousesQuery.isError) {
    return (
      <ErrorState
        description={
          jobQuery.error?.message ??
          usersQuery.error?.message ??
          warehousesQuery.error?.message ??
          "No se pudo cargar el espacio de trabajo de tareas de produccion."
        }
        title="Las tareas de produccion no estan disponibles"
      />
    );
  }

  const job = jobQuery.data;
  const selectedStock =
    stocksQuery.data?.find((stock) => stock.id === inventoryStockId) ?? null;
  const selectedRemnant =
    remnantsQuery.data?.find((remnant) => remnant.id === remnantPieceId) ??
    null;
  const activeError =
    generateTasksMutation.error ??
    updateTaskMutation.error ??
    startTaskMutation.error ??
    completeTaskMutation.error ??
    consumeMutation.error;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobDetail(job.id)}
            >
              Resumen de la orden
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobQuality(job.id)}
            >
              Calidad
            </Link>
            <Link
              className={secondaryButtonClassName}
              href={PRODUCTION_ROUTES.jobWaste(job.id)}
            >
              Desperdicios
            </Link>
          </>
        }
        description="Gestiona la cola activa de tareas de esta orden, actualiza asignaciones o secuencias y registra que material se consumio durante la ejecucion."
        eyebrow="Produccion"
        title={`${job.code} Tareas`}
      />

      <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
              Cola de tareas
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Generar o actualizar la secuencia de tareas
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-3 text-sm text-stone-700">
              <input
                checked={replaceExistingTasks}
                onChange={(event) => {
                  setReplaceExistingTasks(event.target.checked);
                }}
                type="checkbox"
              />
              Reemplazar tareas existentes
            </label>
            <button
              className={primaryButtonClassName}
              disabled={generateTasksMutation.isPending || !canUpdate}
              onClick={() => {
                void generateTasksMutation.mutateAsync();
              }}
              type="button"
            >
              Generar tareas
            </button>
          </div>
        </div>

        {activeError ? (
          <div className="mt-5 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(activeError)}
          </div>
        ) : null}
      </section>

      {job.tasks.length === 0 ? (
        <EmptyState
          description="Genera primero la cola de tareas para actualizar la secuencia, iniciar trabajo o registrar consumos."
          title="Aún no hay tareas de producción"
        />
      ) : (
        <>
          <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Selected Task
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Edit task details
              </h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 md:col-span-2 xl:col-span-4">
                <span className="text-sm font-medium text-stone-700">Task</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setSelectedTaskId(event.target.value);
                  }}
                  value={activeTaskId}
                >
                  {job.tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.sortOrder} · {task.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">
                  Title
                </span>
                <input
                  className={fieldClassName}
                  onChange={(event) => {
                    setTaskDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [activeTaskId]: {
                        ...taskDraft,
                        title: event.target.value,
                      },
                    }));
                  }}
                  value={taskDraft.title}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Status
                </span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setTaskDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [activeTaskId]: {
                        ...taskDraft,
                        status: event.target.value as ProductionTaskStatus,
                      },
                    }));
                  }}
                  value={taskDraft.status}
                >
                  {TASK_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Sort order
                </span>
                <input
                  className={fieldClassName}
                  min="0"
                  onChange={(event) => {
                    setTaskDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [activeTaskId]: {
                        ...taskDraft,
                        sortOrder: event.target.value,
                      },
                    }));
                  }}
                  type="number"
                  value={taskDraft.sortOrder}
                />
              </label>

              <label className="space-y-2 md:col-span-2 xl:col-span-4">
                <span className="text-sm font-medium text-stone-700">
                  Assigned user
                </span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setTaskDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [activeTaskId]: {
                        ...taskDraft,
                        assignedToUserId: event.target.value,
                      },
                    }));
                  }}
                  value={taskDraft.assignedToUserId}
                >
                  <option value="">Unassigned</option>
                  {usersQuery.data.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} · {user.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2 xl:col-span-4">
                <span className="text-sm font-medium text-stone-700">
                  Description
                </span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setTaskDrafts((currentDrafts) => ({
                      ...currentDrafts,
                      [activeTaskId]: {
                        ...taskDraft,
                        description: event.target.value,
                      },
                    }));
                  }}
                  value={taskDraft.description}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={primaryButtonClassName}
                disabled={
                  updateTaskMutation.isPending ||
                  !canUpdate ||
                  !taskDraft.title.trim() ||
                  !activeTaskId
                }
                onClick={() => {
                  void updateTaskMutation.mutateAsync();
                }}
                type="button"
              >
                Save Task
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={
                  startTaskMutation.isPending || !canUpdate || !activeTaskId
                }
                onClick={() => {
                  void startTaskMutation.mutateAsync();
                }}
                type="button"
              >
                Start Task
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={
                  completeTaskMutation.isPending || !canUpdate || !activeTaskId
                }
                onClick={() => {
                  void completeTaskMutation.mutateAsync();
                }}
                type="button"
              >
                Complete Task
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                  Floor Queue
                </p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">
                  All tasks for this job
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {job.tasks.map((task) => {
                const badge = getProductionTaskStatusBadge(task.status);

                return (
                  <button
                    key={task.id}
                    className={`rounded-[1.15rem] border px-4 py-4 text-left transition ${
                      activeTaskId === task.id
                        ? "border-[color:var(--color-primary)] bg-blue-50/40"
                        : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                    }`}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                    }}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-950">
                          {task.sortOrder} · {task.title}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {getProductionTaskTypeLabel(task.taskType)} ·{" "}
                          {task.assignedToUser?.name ?? "Unassigned"} ·{" "}
                          {formatDateValue(task.startedAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Material Consumption
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Record what the selected task used
              </h2>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-stone-700">
                  Material
                </span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setMaterialSelectionByTask((currentSelections) => ({
                      ...currentSelections,
                      [activeTaskId]: event.target.value,
                    }));
                    setInventoryStockId("");
                    setRemnantPieceId("");
                  }}
                  value={activeMaterialId}
                >
                  <option value="">Select material</option>
                  {materialOptions.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.code} · {material.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Consumption type
                </span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setConsumptionType(
                      event.target.value as MaterialConsumptionType,
                    );
                  }}
                  value={consumptionType}
                >
                  {CONSUMPTION_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Source type
                </span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    const nextSourceType = event.target
                      .value as MaterialConsumptionSourceType;
                    setSourceType(nextSourceType);

                    if (nextSourceType !== "INVENTORY_STOCK") {
                      setInventoryStockId("");
                    }

                    if (nextSourceType !== "REMNANT") {
                      setRemnantPieceId("");
                    }
                  }}
                  value={sourceType}
                >
                  {SOURCE_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {sourceType === "INVENTORY_STOCK" ? (
                <label className="space-y-2 md:col-span-2 xl:col-span-4">
                  <span className="text-sm font-medium text-stone-700">
                    Inventory stock
                  </span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      const nextStockId = event.target.value;
                      const nextStock =
                        stocksQuery.data?.find(
                          (stock) => stock.id === nextStockId,
                        ) ?? null;

                      setInventoryStockId(nextStockId);
                      setUnit(nextStock?.unit ?? unit);
                    }}
                    value={inventoryStockId}
                  >
                    <option value="">Select stock</option>
                    {(stocksQuery.data ?? []).map((stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.warehouse.code} · Qty {stock.availableQuantity}{" "}
                        {stock.unit}
                        {stock.locationCode ? ` · ${stock.locationCode}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {sourceType === "REMNANT" ? (
                <label className="space-y-2 md:col-span-2 xl:col-span-4">
                  <span className="text-sm font-medium text-stone-700">
                    Remnant piece
                  </span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      const nextRemnantId = event.target.value;
                      const nextRemnant =
                        remnantsQuery.data?.find(
                          (remnant) => remnant.id === nextRemnantId,
                        ) ?? null;

                      setRemnantPieceId(nextRemnantId);
                      setUnit(nextRemnant?.unit ?? unit);
                    }}
                    value={remnantPieceId}
                  >
                    <option value="">Select remnant</option>
                    {(remnantsQuery.data ?? []).map((remnant) => (
                      <option key={remnant.id} value={remnant.id}>
                        {remnant.code} · Qty {remnant.quantity} {remnant.unit}
                        {remnant.usableAreaM2 !== null
                          ? ` · ${remnant.usableAreaM2} m2`
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Quantity
                </span>
                <input
                  className={fieldClassName}
                  min="0.01"
                  onChange={(event) => {
                    setQuantity(event.target.value);
                  }}
                  step="0.01"
                  type="number"
                  value={quantity}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Unit</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setUnit(event.target.value as MaterialUnit);
                  }}
                  value={unit}
                >
                  {MATERIAL_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Actual waste area
                </span>
                <input
                  className={fieldClassName}
                  min="0"
                  onChange={(event) => {
                    setActualWasteAreaM2(event.target.value);
                  }}
                  placeholder="m2"
                  step="0.01"
                  type="number"
                  value={actualWasteAreaM2}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Scrap quantity
                </span>
                <input
                  className={fieldClassName}
                  min="0"
                  onChange={(event) => {
                    setScrapQuantity(event.target.value);
                  }}
                  step="0.01"
                  type="number"
                  value={scrapQuantity}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">
                  Scrap unit
                </span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setScrapUnit(event.target.value as MaterialUnit);
                  }}
                  value={scrapUnit}
                >
                  {MATERIAL_UNIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2 xl:col-span-4">
                <span className="text-sm font-medium text-stone-700">
                  Notes
                </span>
                <textarea
                  className={textAreaClassName}
                  onChange={(event) => {
                    setNotes(event.target.value);
                  }}
                  placeholder="Optional note about actual usage, breakage, or mismatch"
                  value={notes}
                />
              </label>
            </div>

            <div className="mt-5 rounded-[1.15rem] border border-stone-200 bg-stone-50 px-4 py-4">
              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  checked={createRemnantOutput}
                  onChange={(event) => {
                    setCreateRemnantOutput(event.target.checked);
                  }}
                  type="checkbox"
                />
                Create remnant output from this consumption
              </label>

              {createRemnantOutput ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Remnant code
                    </span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setRemnantCode(event.target.value);
                      }}
                      value={remnantCode}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Warehouse
                    </span>
                    <select
                      className={fieldClassName}
                      onChange={(event) => {
                        setRemnantWarehouseId(event.target.value);
                      }}
                      value={remnantWarehouseId}
                    >
                      <option value="">Select warehouse</option>
                      {warehousesQuery.data.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.code} · {warehouse.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Quantity
                    </span>
                    <input
                      className={fieldClassName}
                      min="0.01"
                      onChange={(event) => {
                        setRemnantQuantity(event.target.value);
                      }}
                      step="0.01"
                      type="number"
                      value={remnantQuantity}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Width (mm)
                    </span>
                    <input
                      className={fieldClassName}
                      min="0"
                      onChange={(event) => {
                        setRemnantWidthMm(event.target.value);
                      }}
                      step="0.01"
                      type="number"
                      value={remnantWidthMm}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Length (mm)
                    </span>
                    <input
                      className={fieldClassName}
                      min="0"
                      onChange={(event) => {
                        setRemnantLengthMm(event.target.value);
                      }}
                      step="0.01"
                      type="number"
                      value={remnantLengthMm}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Thickness (mm)
                    </span>
                    <input
                      className={fieldClassName}
                      min="0"
                      onChange={(event) => {
                        setRemnantThicknessMm(event.target.value);
                      }}
                      step="0.01"
                      type="number"
                      value={remnantThicknessMm}
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2 xl:col-span-4">
                    <span className="text-sm font-medium text-stone-700">
                      Remnant notes
                    </span>
                    <textarea
                      className={textAreaClassName}
                      onChange={(event) => {
                        setRemnantNotes(event.target.value);
                      }}
                      value={remnantNotes}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className={primaryButtonClassName}
                disabled={
                  consumeMutation.isPending || !canConsume || !activeTaskId
                }
                onClick={() => {
                  void consumeMutation.mutateAsync();
                }}
                type="button"
              >
                Record Consumption
              </button>
            </div>

            {selectedStock || selectedRemnant ? (
              <div className="mt-5 rounded-[1rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                {selectedStock
                  ? `Using stock from ${selectedStock.warehouse.name} with ${selectedStock.availableQuantity} ${selectedStock.unit} available.`
                  : `Using remnant ${selectedRemnant?.code} with ${selectedRemnant?.quantity} ${selectedRemnant?.unit} available.`}
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-stone-500 uppercase">
                Consumption History
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Recorded entries for this job
              </h2>
            </div>

            <div className="mt-4 space-y-3">
              {job.materialConsumptions.map((consumption) => (
                <div
                  key={consumption.id}
                  className="rounded-[1.15rem] border border-stone-200 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">
                        {consumption.material?.name ?? "Manual material"} ·{" "}
                        {consumption.quantity} {consumption.unit}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {consumption.consumptionType} · {consumption.sourceType}{" "}
                        · {formatDateValue(consumption.consumedAt)}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-stone-500">
                      {consumption.consumedByUser?.name ?? "System"}
                    </p>
                  </div>
                </div>
              ))}

              {job.materialConsumptions.length === 0 ? (
                <EmptyState
                  description="Consumption recorded from stock, remnants, or manual floor use will appear here."
                  title="No consumption recorded yet"
                />
              ) : null}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
