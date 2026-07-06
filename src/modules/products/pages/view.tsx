"use client";

import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

import {
  PRODUCTS_ROUTES,
} from "../constants";
import { useProducts } from "../hooks/useProducts";

type ProductViewPageProps = {
  productId: string;
};

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

export default function ProductViewPage({
  productId,
}: ProductViewPageProps) {
  const { useProduct } = useProducts();
  const productQuery = useProduct(productId);

  if (productQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void productQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={productQuery.error.message}
        title="Product details could not be loaded"
      />
    );
  }

  if (productQuery.isLoading || !productQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Loading product details...</p>
      </section>
    );
  }

  const record = productQuery.data;

  return (
    <main className="space-y-6">
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
            href={PRODUCTS_ROUTES.edit(record.id)}
          >
            Edit product
          </Link>
        }
        description="Review product metadata from the shared module scaffold without leaving the permission-aware admin workspace."
        eyebrow="Product Record"
        title="Product Details"
      />

      <section className={sectionClassName}>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Name
            </dt>
            <dd className="text-lg font-semibold text-stone-950">{record.name}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Status
            </dt>
            <dd className="text-sm text-stone-700">
              {record.isActive ? "Active" : "Inactive"}
            </dd>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Description
            </dt>
            <dd className="text-sm leading-7 text-stone-700">
              {record.description || "No description provided."}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Created
            </dt>
            <dd className="text-sm text-stone-700">{record.createdAt}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Updated
            </dt>
            <dd className="text-sm text-stone-700">{record.updatedAt}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
