"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

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
import { materialService } from "@/services/material-service";
import { purchasingService } from "@/services/purchasing-service";
import { supplierService } from "@/services/supplier-service";
import type { CreatePurchaseOrderInput } from "@/types";
import { getApiErrorMessage } from "@/utils";

import { PURCHASING_ROUTES } from "../constants";
import { formatPurchasingCurrency } from "../ui";

type DraftPurchaseOrderItem = CreatePurchaseOrderInput["items"][number];

const createEmptyItem = (): DraftPurchaseOrderItem => ({
  description: null,
  materialId: "",
  quantity: 1,
  unit: "UNIT",
  unitPrice: 0,
});

const parseOptionalNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseRequestId = searchParams.get("purchaseRequestId");

  const [supplierId, setSupplierId] = useState<string | null | undefined>(undefined);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [currency, setCurrency] = useState("BOB");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [notes, setNotes] = useState<string | null | undefined>(undefined);
  const [items, setItems] = useState<DraftPurchaseOrderItem[]>([]);

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
    queryKey: ["purchasing", "order-form", "suppliers"],
    staleTime: 60_000,
  });
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
    queryKey: ["purchasing", "order-form", "materials"],
    staleTime: 60_000,
  });
  const requestQuery = useQuery({
    enabled: Boolean(purchaseRequestId),
    queryFn: () => purchasingService.getPurchaseRequestById(purchaseRequestId as string),
    queryKey: ["purchasing", "order-form", "request", purchaseRequestId],
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) => purchasingService.createPurchaseOrder(input),
    onSuccess: (record) => {
      router.push(PURCHASING_ROUTES.orderDetail(record.id));
    },
  });

  if (suppliersQuery.isPending || materialsQuery.isPending || requestQuery.isPending) {
    return <LoadingState title="Preparando el formulario de orden de compra" />;
  }

  if (suppliersQuery.isError || materialsQuery.isError || requestQuery.isError) {
    return (
      <ErrorState
        description={
          suppliersQuery.error?.message ||
          materialsQuery.error?.message ||
          requestQuery.error?.message ||
          "No se pudieron cargar las dependencias del formulario de orden de compra."
        }
        title="El formulario de orden de compra no está disponible"
      />
    );
  }

  const suppliers = suppliersQuery.data;
  const materials = materialsQuery.data;
  const derivedRequestItems =
    requestQuery.data?.items.map((item) => ({
      description: item.description,
      materialId: item.materialId,
      metadataJson: item.metadataJson,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.estimatedUnitCost ?? 0,
    })) ?? [];
  const derivedSupplierIds = requestQuery.data
    ? Array.from(
        new Set(
          requestQuery.data.items
            .map((item) => item.selectedSupplierId || item.preferredSupplierId)
            .filter((entry): entry is string => Boolean(entry)),
        ),
      )
    : [];
  const activeItems =
    items.length > 0
      ? items
      : derivedRequestItems.length > 0
        ? derivedRequestItems
        : [createEmptyItem()];
  const activeSupplierId =
    supplierId === undefined
      ? (derivedSupplierIds.length === 1 ? derivedSupplierIds[0] : "")
      : (supplierId ?? "");
  const activeNotes = notes === undefined ? (requestQuery.data?.notes ?? "") : (notes ?? "");
  const subtotal = activeItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const total = subtotal - discountAmount + taxAmount;

  return (
    <main className="space-y-6">
      <PageHeader
        description="Crea una orden de compra manualmente o parte de una solicitud aprobada para dar seguimiento completo a compromisos, costos y recepción."
        eyebrow="Compras"
        title="Nueva orden de compra"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-stone-700">Proveedor</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setSupplierId(event.target.value || null);
              }}
              value={activeSupplierId}
            >
              <option value="">Seleccionar proveedor</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.commercialName || supplier.legalName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Order date</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setOrderDate(event.target.value);
              }}
              type="date"
              value={orderDate}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">
              Expected delivery date
            </span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setExpectedDeliveryDate(event.target.value);
              }}
              type="date"
              value={expectedDeliveryDate}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Moneda</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setCurrency(event.target.value);
              }}
              value={currency}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Importe de descuento</span>
            <input
              className={fieldClassName}
              min="0"
              onChange={(event) => {
                setDiscountAmount(parseOptionalNumber(event.target.value));
              }}
              step="0.01"
              type="number"
              value={discountAmount}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Importe de impuesto</span>
            <input
              className={fieldClassName}
              min="0"
              onChange={(event) => {
                setTaxAmount(parseOptionalNumber(event.target.value));
              }}
              step="0.01"
              type="number"
              value={taxAmount}
            />
          </label>

          <label className="space-y-2 md:col-span-2 xl:col-span-4">
            <span className="text-sm font-medium text-stone-700">Notas</span>
            <textarea
              className={textAreaClassName}
              onChange={(event) => {
                setNotes(event.target.value || null);
              }}
              placeholder="Instrucciones opcionales de entrega, comerciales o de almacén"
              value={activeNotes}
            />
          </label>
        </div>

        {purchaseRequestId && requestQuery.data ? (
          <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            This order is linked to request <strong>{requestQuery.data.code}</strong>.
          </div>
        ) : null}

        {createMutation.error ? (
          <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {getApiErrorMessage(createMutation.error)}
          </div>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
              Order Lines
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              Materials being ordered
            </h2>
          </div>
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              setItems((current) => [...current, createEmptyItem()]);
            }}
            type="button"
          >
            Add Line
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {activeItems.map((item, index) => (
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
                      setItems(
                        activeItems.map((entry, entryIndex) =>
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
                    <option value="">Seleccionar material</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.code} · {material.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Cantidad</span>
                  <input
                    className={fieldClassName}
                    min="0"
                    onChange={(event) => {
                      setItems(
                        activeItems.map((entry, entryIndex) =>
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
                      setItems(
                        activeItems.map((entry, entryIndex) =>
                          entryIndex === index
                            ? {
                                ...entry,
                                unit: event.target.value as DraftPurchaseOrderItem["unit"],
                              }
                            : entry,
                        ),
                      );
                    }}
                    value={item.unit}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-700">Unit price</span>
                  <input
                    className={fieldClassName}
                    min="0"
                    onChange={(event) => {
                      setItems(
                        activeItems.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, unitPrice: parseOptionalNumber(event.target.value) }
                            : entry,
                        ),
                      );
                    }}
                    step="0.0001"
                    type="number"
                    value={item.unitPrice}
                  />
                </label>

                <label className="space-y-2 md:col-span-2 xl:col-span-3">
                  <span className="text-sm font-medium text-stone-700">Descripción</span>
                  <textarea
                    className={textAreaClassName}
                    onChange={(event) => {
                      setItems(
                        activeItems.map((entry, entryIndex) =>
                          entryIndex === index
                            ? { ...entry, description: event.target.value || null }
                            : entry,
                        ),
                      );
                    }}
              placeholder="Nota opcional de la línea de la orden"
                    value={item.description ?? ""}
                  />
                </label>

                <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Line total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-stone-950">
                    {formatPurchasingCurrency(item.quantity * item.unitPrice, currency)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  className={secondaryButtonClassName}
                  disabled={activeItems.length === 1}
                  onClick={() => {
                    setItems(activeItems.filter((_, entryIndex) => entryIndex !== index));
                  }}
                  type="button"
                >
                  Remove Line
                </button>
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Subtotal
            </p>
            <p className="mt-2 text-xl font-semibold text-stone-950">
              {formatPurchasingCurrency(subtotal, currency)}
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Discounts and tax
            </p>
            <p className="mt-2 text-xl font-semibold text-stone-950">
              {formatPurchasingCurrency(-discountAmount + taxAmount, currency)}
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Total
            </p>
            <p className="mt-2 text-xl font-semibold text-stone-950">
              {formatPurchasingCurrency(total, currency)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            className={primaryButtonClassName}
            disabled={createMutation.isPending}
            onClick={() => {
              void createMutation.mutateAsync({
                currency,
                discountAmount,
                expectedDeliveryDate: expectedDeliveryDate || null,
                items: activeItems,
                notes: activeNotes.trim() || null,
                orderDate: orderDate || null,
                purchaseRequestId,
                supplierId: activeSupplierId,
                taxAmount,
              });
            }}
            type="button"
          >
            Create Purchase Order
          </button>
        </div>
      </section>
    </main>
  );
}
