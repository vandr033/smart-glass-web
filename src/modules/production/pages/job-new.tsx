"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  fieldClassName,
  primaryButtonClassName,
  sectionClassName,
  secondaryButtonClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { cuttingService } from "@/services/cutting-service";
import { materialService } from "@/services/material-service";
import { productionService } from "@/services/production-service";
import { projectService } from "@/services/project-service";
import { quotationService } from "@/services/quotation-service";
import { userService } from "@/services/user-service";
import type { CreateProductionJobInput } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { PRODUCTION_JOB_PRIORITY_LABELS, PRODUCTION_ROUTES } from "../constants";

type DraftProductionItem = NonNullable<CreateProductionJobInput["items"]>[number];

const createEmptyItem = (): DraftProductionItem => ({
  description: null,
  materialId: null,
  metadataJson: null,
  name: "",
  quantity: 1,
  quotationItemId: null,
  status: "PENDING",
});

const parsePositiveNumber = (value: string): number => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
};

export default function NewProductionJobPage() {
  const router = useRouter();

  const [sourceQuotationId, setSourceQuotationId] = useState("");
  const [sourceCuttingPlanId, setSourceCuttingPlanId] = useState("");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [cuttingPlanId, setCuttingPlanId] = useState("");
  const [priority, setPriority] =
    useState<CreateProductionJobInput["priority"]>("NORMAL");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftProductionItem[]>([createEmptyItem()]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryFn: userService.getUserOptions,
    queryKey: ["production", "form", "users"],
    staleTime: 60_000,
  });
  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
        status: "ACTIVE",
      });

      return result.data;
    },
    queryKey: ["production", "form", "materials"],
    staleTime: 60_000,
  });
  const projectsQuery = useQuery({
    queryFn: async () => {
      const result = await projectService.listProjects({
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["production", "form", "projects"],
    staleTime: 60_000,
  });
  const quotationsQuery = useQuery({
    queryFn: async () => {
      const result = await quotationService.listQuotations({
        page: 1,
        perPage: 100,
        sortBy: "updatedAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["production", "form", "quotations"],
    staleTime: 60_000,
  });
  const plansQuery = useQuery({
    queryFn: async () => {
      const result = await cuttingService.listPlans({
        page: 1,
        perPage: 100,
        sortBy: "updatedAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["production", "form", "cutting-plans"],
    staleTime: 60_000,
  });

  const createManualMutation = useMutation({
    mutationFn: (input: CreateProductionJobInput) => productionService.createJob(input),
    onSuccess: (job) => {
      router.push(PRODUCTION_ROUTES.jobDetail(job.id));
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
    },
  });
  const createFromQuotationMutation = useMutation({
    mutationFn: (selectedQuotationId: string) =>
      productionService.createJobFromQuotation(selectedQuotationId),
    onSuccess: (job) => {
      router.push(PRODUCTION_ROUTES.jobDetail(job.id));
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
    },
  });
  const createFromCuttingPlanMutation = useMutation({
    mutationFn: (selectedCuttingPlanId: string) =>
      productionService.createJobFromCuttingPlan(selectedCuttingPlanId),
    onSuccess: (job) => {
      router.push(PRODUCTION_ROUTES.jobDetail(job.id));
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
    },
  });

  if (
    usersQuery.isPending ||
    materialsQuery.isPending ||
    projectsQuery.isPending ||
    quotationsQuery.isPending ||
    plansQuery.isPending
  ) {
    return <LoadingState title="Preparing production job form" />;
  }

  if (
    usersQuery.isError ||
    materialsQuery.isError ||
    projectsQuery.isError ||
    quotationsQuery.isError ||
    plansQuery.isError
  ) {
    return (
      <ErrorState
        description={
          usersQuery.error?.message ??
          materialsQuery.error?.message ??
          projectsQuery.error?.message ??
          quotationsQuery.error?.message ??
          plansQuery.error?.message ??
          "No se pudieron cargar las dependencias del formulario de produccion."
        }
        title="El formulario de produccion no esta disponible"
      />
    );
  }

  const activeError =
    submitError ??
    (createManualMutation.error
      ? getApiErrorMessage(createManualMutation.error)
      : createFromQuotationMutation.error
        ? getApiErrorMessage(createFromQuotationMutation.error)
        : createFromCuttingPlanMutation.error
          ? getApiErrorMessage(createFromCuttingPlanMutation.error)
          : null);

  return (
    <main className="space-y-6">
      <PageHeader
        description="Inicia una orden de produccion desde una cotizacion aceptada, un plan de corte aprobado o crea una orden manual para trabajo de piso con su propia agenda y cola de tareas."
        eyebrow="Produccion"
        title="Nueva orden de produccion"
      />

      <section className={sectionClassName}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Quick Start
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Create from an existing source
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Use quotation or cutting-plan driven job creation when planning data already exists
              and you want planned items or material consumption seeded automatically.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-stone-200 bg-white px-4 py-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Quotation</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setSourceQuotationId(event.target.value);
                }}
                value={sourceQuotationId}
              >
                <option value="">Select quotation</option>
                {quotationsQuery.data.map((quotation) => (
                  <option key={quotation.id} value={quotation.id}>
                    {quotation.code} · {quotation.client.displayName} · {quotation.status}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={`mt-4 ${primaryButtonClassName}`}
              disabled={!sourceQuotationId || createFromQuotationMutation.isPending}
              onClick={() => {
                setSubmitError(null);
                void createFromQuotationMutation.mutateAsync(sourceQuotationId);
              }}
              type="button"
            >
              Create from Quotation
            </button>
          </div>

          <div className="rounded-md border border-stone-200 bg-white px-4 py-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Cutting plan</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setSourceCuttingPlanId(event.target.value);
                }}
                value={sourceCuttingPlanId}
              >
                <option value="">Select cutting plan</option>
                {plansQuery.data.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} · {plan.material.name} · {plan.status}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={`mt-4 ${primaryButtonClassName}`}
              disabled={!sourceCuttingPlanId || createFromCuttingPlanMutation.isPending}
              onClick={() => {
                setSubmitError(null);
                void createFromCuttingPlanMutation.mutateAsync(sourceCuttingPlanId);
              }}
              type="button"
            >
              Create from Cutting Plan
            </button>
          </div>
        </div>
      </section>

      <section className={sectionClassName}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            Manual Job
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Define scheduling and ownership
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Assigned user</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setAssignedToUserId(event.target.value);
              }}
              value={assignedToUserId}
            >
              <option value="">Unassigned</option>
              {usersQuery.data.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Priority</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setPriority(event.target.value as typeof priority);
              }}
              value={priority}
            >
              {Object.entries(PRODUCTION_JOB_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Planned start</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setPlannedStartDate(event.target.value);
              }}
              type="date"
              value={plannedStartDate}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Planned end</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setPlannedEndDate(event.target.value);
              }}
              type="date"
              value={plannedEndDate}
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">Project</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setProjectId(event.target.value);
              }}
              value={projectId}
            >
              <option value="">No project</option>
              {projectsQuery.data.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.title}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">Quotation</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setQuotationId(event.target.value);
              }}
              value={quotationId}
            >
              <option value="">No quotation</option>
              {quotationsQuery.data.map((quotation) => (
                <option key={quotation.id} value={quotation.id}>
                  {quotation.code} · {quotation.client.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-4">
            <span className="text-sm font-medium text-stone-700">Cutting plan</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setCuttingPlanId(event.target.value);
              }}
              value={cuttingPlanId}
            >
              <option value="">No cutting plan</option>
              {plansQuery.data.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.code} · {plan.material.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-4">
            <span className="text-sm font-medium text-stone-700">Notes</span>
            <textarea
              className={textAreaClassName}
              onChange={(event) => {
                setNotes(event.target.value);
              }}
              placeholder="Optional floor instructions, sequencing notes, or packaging requirements"
              value={notes}
            />
          </label>
        </div>

        {activeError ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {activeError}
          </div>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Job Items
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Define what production will build
            </h2>
          </div>

          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setItems((currentItems) => [...currentItems, createEmptyItem()]);
            }}
            type="button"
          >
            Add Item
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div
              key={`production-item-${index}`}
              className="rounded-md border border-stone-200 bg-white px-4 py-4"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-stone-700">Item name</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setItems((currentItems) =>
                        currentItems.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                name: event.target.value,
                              }
                            : currentItem,
                        ),
                      );
                    }}
                    placeholder="Example: Window frame set A"
                    value={item.name}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Quantity</span>
                  <input
                    className={fieldClassName}
                    min="0.01"
                    onChange={(event) => {
                      setItems((currentItems) =>
                        currentItems.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                quantity: parsePositiveNumber(event.target.value),
                              }
                            : currentItem,
                        ),
                      );
                    }}
                    step="0.01"
                    type="number"
                    value={item.quantity}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Material</span>
                  <select
                    className={fieldClassName}
                    onChange={(event) => {
                      setItems((currentItems) =>
                        currentItems.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                materialId: event.target.value || null,
                              }
                            : currentItem,
                        ),
                      );
                    }}
                    value={item.materialId ?? ""}
                  >
                    <option value="">No material</option>
                    {materialsQuery.data.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.code} · {material.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2 xl:col-span-3">
                  <span className="text-sm font-medium text-stone-700">Description</span>
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setItems((currentItems) =>
                        currentItems.map((currentItem, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...currentItem,
                                description: event.target.value || null,
                              }
                            : currentItem,
                        ),
                      );
                    }}
                    placeholder="Optional fabrication or handling notes for this item"
                    value={item.description ?? ""}
                  />
                </label>

                <div className="flex items-end justify-end">
                  <button
                    className={secondaryButtonClassName}
                    disabled={items.length === 1}
                    onClick={() => {
                      setItems((currentItems) =>
                        currentItems.filter((_, currentIndex) => currentIndex !== index),
                      );
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className={primaryButtonClassName}
            disabled={createManualMutation.isPending}
            onClick={() => {
              setSubmitError(null);

              const normalizedItems = items
                .filter((item) => item.name.trim().length > 0)
                .map((item) => ({
                  ...item,
                  description: item.description?.trim() || null,
                  materialId: item.materialId || null,
                  name: item.name.trim(),
                }));

              if (normalizedItems.length === 0) {
                setSubmitError("Add at least one production item before creating the job.");
                return;
              }

              void createManualMutation.mutateAsync({
                assignedToUserId: assignedToUserId || null,
                cuttingPlanId: cuttingPlanId || null,
                items: normalizedItems,
                notes: notes.trim() || null,
                plannedEndDate: plannedEndDate || null,
                plannedStartDate: plannedStartDate || null,
                priority,
                projectId: projectId || null,
                quotationId: quotationId || null,
                tasks: [],
              });
            }}
            type="button"
          >
            Create Manual Job
          </button>

          <button
            className={secondaryButtonClassName}
            onClick={() => {
              router.push(PRODUCTION_ROUTES.jobs);
            }}
            type="button"
          >
            Cancel
          </button>
        </div>
      </section>
    </main>
  );
}
