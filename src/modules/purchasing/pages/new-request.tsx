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
  secondaryButtonClassName,
  sectionClassName,
  textAreaClassName,
} from "@/modules/commercial/ui";
import { cuttingService } from "@/services/cutting-service";
import { materialService } from "@/services/material-service";
import { purchasingService } from "@/services/purchasing-service";
import { quotationService } from "@/services/quotation-service";
import { supplierService } from "@/services/supplier-service";
import type { CreatePurchaseRequestInput, PurchaseRequestItemInput } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { PURCHASE_REQUEST_SOURCE_LABELS, PURCHASING_ROUTES } from "../constants";

type RequestCreationMode = "MANUAL" | "QUOTATION" | "CUTTING_PLAN" | "INVENTORY_SHORTAGE";

const createEmptyItem = (): PurchaseRequestItemInput => ({
  description: null,
  estimatedUnitCost: null,
  materialId: "",
  preferredSupplierId: null,
  quantity: 1,
  requiredDate: null,
  selectedSupplierId: null,
  unit: "UNIT",
});

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const [mode, setMode] = useState<RequestCreationMode>("MANUAL");
  const [notes, setNotes] = useState("");
  const [quotationId, setQuotationId] = useState("");
  const [cuttingPlanId, setCuttingPlanId] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [manualItems, setManualItems] = useState<PurchaseRequestItemInput[]>([
    createEmptyItem(),
  ]);

  const materialsQuery = useQuery({
    queryFn: async () => {
      const result = await materialService.listMaterials({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["purchasing", "request-form", "materials"],
    staleTime: 60_000,
  });
  const suppliersQuery = useQuery({
    queryFn: async () => {
      const result = await supplierService.listSuppliers({
        page: 1,
        perPage: 200,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["purchasing", "request-form", "suppliers"],
    staleTime: 60_000,
  });
  const quotationsQuery = useQuery({
    queryFn: async () => {
      const result = await quotationService.listQuotations({
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["purchasing", "request-form", "quotations"],
    staleTime: 60_000,
  });
  const cuttingPlansQuery = useQuery({
    queryFn: async () => {
      const result = await cuttingService.listPlans({
        page: 1,
        perPage: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      return result.data;
    },
    queryKey: ["purchasing", "request-form", "cutting-plans"],
    staleTime: 60_000,
  });

  const createManualMutation = useMutation({
    mutationFn: (input: CreatePurchaseRequestInput) =>
      purchasingService.createPurchaseRequest(input),
    onSuccess: (record) => {
      router.push(PURCHASING_ROUTES.requestDetail(record.id));
    },
  });
  const createFromQuotationMutation = useMutation({
    mutationFn: (id: string) => purchasingService.createPurchaseRequestFromQuotation(id),
    onSuccess: (record) => {
      router.push(PURCHASING_ROUTES.requestDetail(record.id));
    },
  });
  const createFromCuttingPlanMutation = useMutation({
    mutationFn: (id: string) => purchasingService.createPurchaseRequestFromCuttingPlan(id),
    onSuccess: (record) => {
      router.push(PURCHASING_ROUTES.requestDetail(record.id));
    },
  });
  const createFromInventoryShortageMutation = useMutation({
    mutationFn: (materialIds: string[]) =>
      purchasingService.createPurchaseRequestFromInventoryShortage({
        materialIds,
        notes: notes.trim() || null,
      }),
    onSuccess: (record) => {
      router.push(PURCHASING_ROUTES.requestDetail(record.id));
    },
  });

  if (
    materialsQuery.isPending ||
    suppliersQuery.isPending ||
    quotationsQuery.isPending ||
    cuttingPlansQuery.isPending
  ) {
    return <LoadingState title="Preparando formulario de solicitud de compra" />;
  }

  if (
    materialsQuery.isError ||
    suppliersQuery.isError ||
    quotationsQuery.isError ||
    cuttingPlansQuery.isError
  ) {
    return (
      <ErrorState
        description={
          materialsQuery.error?.message ||
          suppliersQuery.error?.message ||
          quotationsQuery.error?.message ||
          cuttingPlansQuery.error?.message ||
          "No se pudieron cargar los datos necesarios del formulario de compras."
        }
        title="Formulario de solicitud de compra no disponible"
      />
    );
  }

  const materials = materialsQuery.data;
  const suppliers = suppliersQuery.data;
  const quotations = quotationsQuery.data;
  const cuttingPlans = cuttingPlansQuery.data;

  const mutationError =
    createManualMutation.error ||
    createFromQuotationMutation.error ||
    createFromCuttingPlanMutation.error ||
    createFromInventoryShortageMutation.error;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Create procurement demand manually or derive it from approved quotations, purchase-required cutting plans, and inventory shortage reviews."
        eyebrow="Compras"
        title="Nueva solicitud de compra"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Modo de creación</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setMode(event.target.value as RequestCreationMode);
              }}
              value={mode}
            >
              <option value="MANUAL">{PURCHASE_REQUEST_SOURCE_LABELS.MANUAL}</option>
              <option value="QUOTATION">{PURCHASE_REQUEST_SOURCE_LABELS.QUOTATION}</option>
              <option value="CUTTING_PLAN">{PURCHASE_REQUEST_SOURCE_LABELS.CUTTING_PLAN}</option>
              <option value="INVENTORY_SHORTAGE">
                {PURCHASE_REQUEST_SOURCE_LABELS.INVENTORY_SHORTAGE}
              </option>
            </select>
          </label>

          {(mode === "MANUAL" || mode === "INVENTORY_SHORTAGE") ? (
            <label className="space-y-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-medium text-stone-700">Notes</span>
              <textarea
                className={textAreaClassName}
                onChange={(event) => {
                  setNotes(event.target.value);
                }}
                placeholder="Optional procurement context, constraints, or urgency notes"
                value={notes}
              />
            </label>
          ) : null}
        </div>

        {mutationError ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(mutationError)}
          </div>
        ) : null}
      </section>

      {mode === "MANUAL" ? (
        <section className={sectionClassName}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Manual Intake
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-950">
                Build request lines
              </h2>
            </div>
            <button
              className={secondaryButtonClassName}
              onClick={() => {
                setManualItems((current) => [...current, createEmptyItem()]);
              }}
              type="button"
            >
              Add Line
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {manualItems.map((item, index) => (
              <section
                key={index}
                className="rounded-md border border-stone-200 bg-white px-4 py-4"
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm font-medium text-stone-700">Material</span>
                    <select
                      className={fieldClassName}
                      onChange={(event) => {
                        const material = materials.find(
                          (record) => record.id === event.target.value,
                        );
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  materialId: event.target.value,
                                  unit: material?.purchaseUnit ?? entry.unit,
                                }
                              : entry,
                          ),
                        );
                      }}
                      value={item.materialId}
                    >
                      <option value="">Select material</option>
                      {materials.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.code} · {material.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Quantity</span>
                    <input
                      className={fieldClassName}
                      min="0"
                      onChange={(event) => {
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, quantity: Number(event.target.value) }
                              : entry,
                          ),
                        );
                      }}
                      step="0.0001"
                      type="number"
                      value={item.quantity}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Unit</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  unit: event.target.value as PurchaseRequestItemInput["unit"],
                                }
                              : entry,
                          ),
                        );
                      }}
                      value={item.unit}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">Required date</span>
                    <input
                      className={fieldClassName}
                      onChange={(event) => {
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, requiredDate: event.target.value || null }
                              : entry,
                          ),
                        );
                      }}
                      type="date"
                      value={item.requiredDate ?? ""}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Preferred supplier
                    </span>
                    <select
                      className={fieldClassName}
                      onChange={(event) => {
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, preferredSupplierId: event.target.value || null }
                              : entry,
                          ),
                        );
                      }}
                      value={item.preferredSupplierId ?? ""}
                    >
                      <option value="">No preference</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.commercialName || supplier.legalName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-700">
                      Estimated unit cost
                    </span>
                    <input
                      className={fieldClassName}
                      min="0"
                      onChange={(event) => {
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? {
                                  ...entry,
                                  estimatedUnitCost: parseOptionalNumber(event.target.value),
                                }
                              : entry,
                          ),
                        );
                      }}
                      step="0.0001"
                      type="number"
                      value={item.estimatedUnitCost ?? ""}
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2 xl:col-span-4">
                    <span className="text-sm font-medium text-stone-700">Description</span>
                    <textarea
                      className={textAreaClassName}
                      onChange={(event) => {
                        setManualItems((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, description: event.target.value || null }
                              : entry,
                          ),
                        );
                      }}
                      placeholder="Optional purchasing note for this line"
                      value={item.description ?? ""}
                    />
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    className={secondaryButtonClassName}
                    disabled={manualItems.length === 1}
                    onClick={() => {
                      setManualItems((current) =>
                        current.filter((_, entryIndex) => entryIndex !== index),
                      );
                    }}
                    type="button"
                  >
                    Remove Line
                  </button>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              className={primaryButtonClassName}
              disabled={createManualMutation.isPending}
              onClick={() => {
                void createManualMutation.mutateAsync({
                  items: manualItems,
                  notes: notes.trim() || null,
                  sourceId: null,
                  sourceType: "MANUAL",
                });
              }}
              type="button"
            >
              Create Request
            </button>
          </div>
        </section>
      ) : null}

      {mode === "QUOTATION" ? (
        <section className={sectionClassName}>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Quotation</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setQuotationId(event.target.value);
                }}
                value={quotationId}
              >
                <option value="">Select quotation</option>
                {quotations.map((quotation) => (
                  <option key={quotation.id} value={quotation.id}>
                    {quotation.code} · {quotation.client.displayName} · {quotation.status}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={primaryButtonClassName}
              disabled={!quotationId || createFromQuotationMutation.isPending}
              onClick={() => {
                void createFromQuotationMutation.mutateAsync(quotationId);
              }}
              type="button"
            >
              Create from Quotation
            </button>
          </div>
        </section>
      ) : null}

      {mode === "CUTTING_PLAN" ? (
        <section className={sectionClassName}>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Cutting plan</span>
              <select
                className={fieldClassName}
                onChange={(event) => {
                  setCuttingPlanId(event.target.value);
                }}
                value={cuttingPlanId}
              >
                <option value="">Select cutting plan</option>
                {cuttingPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.code} · {plan.material.name} · {plan.status}
                  </option>
                ))}
              </select>
            </label>

            <button
              className={primaryButtonClassName}
              disabled={!cuttingPlanId || createFromCuttingPlanMutation.isPending}
              onClick={() => {
                void createFromCuttingPlanMutation.mutateAsync(cuttingPlanId);
              }}
              type="button"
            >
              Create from Cutting Plan
            </button>
          </div>
        </section>
      ) : null}

      {mode === "INVENTORY_SHORTAGE" ? (
        <section className={sectionClassName}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Shortage Intake
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Select materials that need replenishment
            </h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => {
              const isSelected = selectedMaterialIds.includes(material.id);

              return (
                <label
                  key={material.id}
                  className="flex items-start gap-3 rounded-md border border-stone-200 bg-white px-4 py-4"
                >
                  <input
                    checked={isSelected}
                    className="mt-1"
                    onChange={(event) => {
                      setSelectedMaterialIds((current) =>
                        event.target.checked
                          ? [...current, material.id]
                          : current.filter((entry) => entry !== material.id),
                      );
                    }}
                    type="checkbox"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-stone-950">
                      {material.code}
                    </span>
                    <span className="mt-1 block text-sm text-stone-600">
                      {material.name}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              className={primaryButtonClassName}
              disabled={
                selectedMaterialIds.length === 0 ||
                createFromInventoryShortageMutation.isPending
              }
              onClick={() => {
                void createFromInventoryShortageMutation.mutateAsync(selectedMaterialIds);
              }}
              type="button"
            >
              Create from Shortage
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
