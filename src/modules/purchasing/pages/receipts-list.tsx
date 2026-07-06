"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import {
  fieldClassName,
  formatDateValue,
  sectionClassName,
} from "@/modules/commercial/ui";
import { inventoryService } from "@/services/inventory-service";
import { purchasingService } from "@/services/purchasing-service";

import { PURCHASING_QUERY_KEYS, PURCHASING_ROUTES } from "../constants";

export default function PurchasingReceiptsListPage() {
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const warehousesQuery = useQuery({
    queryFn: () => inventoryService.listWarehouses(),
    queryKey: ["purchasing", "receipts", "warehouses"],
    staleTime: 60_000,
  });
  const receiptsQuery = useQuery({
    queryFn: () =>
      purchasingService.listPurchaseReceipts({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        perPage: 20,
        search,
        warehouseId: warehouseId || undefined,
      }),
    queryKey: PURCHASING_QUERY_KEYS.receipts({
      dateFrom,
      dateTo,
      page: 1,
      perPage: 20,
      search,
      warehouseId,
    }),
    staleTime: 30_000,
  });

  if (warehousesQuery.isPending || receiptsQuery.isPending) {
    return <LoadingState title="Loading purchase receipts" />;
  }

  if (warehousesQuery.isError || receiptsQuery.isError) {
    return (
      <ErrorState
        description={
          warehousesQuery.error?.message ||
          receiptsQuery.error?.message ||
          "Purchase receipts could not be loaded."
        }
        title="Purchase receipts are unavailable"
      />
    );
  }

  const receipts = receiptsQuery.data.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.orders}
            >
              Purchase Orders
            </Link>
            <Link
              className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={PURCHASING_ROUTES.requests}
            >
              Purchase Requests
            </Link>
          </>
        }
        description="Review receipt history by warehouse, supplier, and purchase order to confirm that inbound purchasing activity created the expected inventory intake."
        eyebrow="Purchasing"
        title="Purchase Receipts"
      />

      <section className={sectionClassName}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 xl:col-span-2">
            <span className="text-sm font-medium text-stone-700">Search</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Buscar por codigo de recepcion, OC o proveedor"
              value={search}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Warehouse</span>
            <select
              className={fieldClassName}
              onChange={(event) => {
                setWarehouseId(event.target.value);
              }}
              value={warehouseId}
            >
              <option value="">Cualquier Almacen</option>
              {warehousesQuery.data.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} · {warehouse.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">From date</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setDateFrom(event.target.value);
              }}
              type="date"
              value={dateFrom}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">To date</span>
            <input
              className={fieldClassName}
              onChange={(event) => {
                setDateTo(event.target.value);
              }}
              type="date"
              value={dateTo}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4">
        {receipts.map((receipt) => (
          <Link
            key={receipt.id}
            className="block rounded-lg border border-stone-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,47,91,0.08)] transition hover:border-stone-300 hover:bg-stone-50"
            href={PURCHASING_ROUTES.orderDetail(receipt.purchaseOrderId)}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-950">{receipt.code}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  {receipt.supplier?.commercialName || receipt.supplier?.legalName || "No supplier"}{" "}
                  · {receipt.warehouse?.name || "No warehouse"} · {receipt.itemCount} item(s)
                </p>
              </div>
              <div className="grid gap-2 text-right text-sm text-stone-600">
                <p>
                  Purchase order:{" "}
                  <span className="font-semibold text-stone-950">
                    {receipt.purchaseOrder.code}
                  </span>
                </p>
                <p>
                  Received by:{" "}
                  <span className="font-semibold text-stone-950">
                    {receipt.receivedByUser?.name || "System"}
                  </span>
                </p>
                <p>
                  Received at:{" "}
                  <span className="font-semibold text-stone-950">
                    {formatDateValue(receipt.receivedAt)}
                  </span>
                </p>
              </div>
            </div>
          </Link>
        ))}

        {receipts.length === 0 ? (
          <EmptyState
            description="Receipts will appear here once confirmed purchase orders are received into a warehouse."
            title="No receipts found"
          />
        ) : null}
      </section>
    </main>
  );
}
