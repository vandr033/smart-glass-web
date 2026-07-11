"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, UploadCloud } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";
import { priceListService } from "@/services/price-list-service";
import { supplierService } from "@/services/supplier-service";

import {
  PRICE_LIST_CURRENCY_OPTIONS,
  PRICE_LISTS_ROUTES,
} from "../constants";
import {
  fieldClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  sectionClassName,
} from "../ui";

export default function ImportPriceListPage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState("");
  const [currency, setCurrency] = useState("BOB");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const suppliersQuery = useQuery({
    queryFn: async () => {
      const result = await supplierService.listSuppliers({
        page: 1,
        perPage: 100,
        sortBy: "name",
        sortDirection: "asc",
      });

      return result.data;
    },
    queryKey: ["price-lists", "import", "suppliers"],
    staleTime: 60_000,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!supplierId) {
        throw new Error("Choose a supplier before uploading.");
      }

      if (!file) {
        throw new Error("Choose an Excel or CSV file to continue.");
      }

      return priceListService.importPriceList({
        currency,
        file,
        supplierId,
      });
    },
    onError: (error) => {
      setFormError(error.message);
    },
    onSuccess: (createdImport) => {
      router.push(PRICE_LISTS_ROUTES.detail(createdImport.id));
      router.refresh();
    },
  });

  if (suppliersQuery.isLoading) {
    return <LoadingState cards={3} title="Loading suppliers for import" />;
  }

  if (suppliersQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className={secondaryButtonClassName}
            onClick={() => {
              void suppliersQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={suppliersQuery.error.message}
        title="Import setup could not be loaded"
      />
    );
  }

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.list}>
            Back to imports
          </Link>
        }
        description="Upload supplier Excel or CSV files, preserve raw rows, and kick off the mapping workflow that feeds pricing history and future purchasing decisions."
        eyebrow="Import"
        title="New Price List Import"
      />

      <section className={sectionClassName}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                Configuración de carga
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                Bring in the supplier file exactly once
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
                The importer stores every row, including invalid ones, so the team can fix
                mapping and validation issues without losing the original supplier context.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-800">Supplier</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setFormError(null);
                    setSupplierId(event.target.value);
                  }}
                  value={supplierId}
                >
                  <option value="">Seleccione un proveedor</option>
                  {(suppliersQuery.data ?? []).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.legalName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-stone-800">Default currency</span>
                <select
                  className={fieldClassName}
                  onChange={(event) => {
                    setCurrency(event.target.value);
                  }}
                  value={currency}
                >
                  {PRICE_LIST_CURRENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-stone-800">Spreadsheet file</span>
              <div className="rounded-lg border border-dashed border-stone-300 bg-white/70 p-6">
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-md bg-[var(--color-primary)] p-3 text-[color:var(--color-primary-contrast)]">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-950">
                        Accepts `.xlsx`, `.xls`, and `.csv`
                      </p>
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        PDF parsing is intentionally deferred for this MVP.
                      </p>
                    </div>
                  </div>

                  <input
                    accept=".xlsx,.xls,.csv"
                    className="block w-full text-sm text-stone-700 md:max-w-xs"
                    onChange={(event) => {
                      setFormError(null);
                      setFile(event.target.files?.[0] ?? null);
                    }}
                    type="file"
                  />
                </div>

                {file ? (
                  <div className="mt-4 rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-700">
                    <p className="font-semibold text-stone-950">{file.name}</p>
                    <p className="mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · ready to import
                    </p>
                  </div>
                ) : null}
              </div>
            </label>

            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {formError}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                className={primaryButtonClassName}
                disabled={importMutation.isPending}
                onClick={() => {
                  setFormError(null);
                  importMutation.mutate();
                }}
                type="button"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {importMutation.isPending ? "Uploading..." : "Import price list"}
              </button>

              <Link className={secondaryButtonClassName} href={PRICE_LISTS_ROUTES.list}>
                Cancel
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200/80 bg-white/75 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              What happens next
            </p>
            <ol className="mt-4 space-y-4 text-sm leading-7 text-stone-700">
              <li>
                1. The backend stores the raw file metadata and every detected row.
              </li>
              <li>
                2. Header aliases are normalized and price values are parsed row by row.
              </li>
              <li>
                3. Exact and fuzzy matching try to connect supplier items to internal
                materials.
              </li>
              <li>
                4. The mapping workspace highlights unmapped or invalid rows before
                validation.
              </li>
              <li>
                5. Approval closes old current prices and records the change history.
              </li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
