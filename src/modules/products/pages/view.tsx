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
            Reintentar
          </button>
        }
        description={productQuery.error.message}
        title="No se pudo cargar el detalle del producto"
      />
    );
  }

  if (productQuery.isLoading || !productQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Cargando detalle del producto…</p>
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
            Editar producto
          </Link>
        }
        description="Revisa los metadatos del producto desde el módulo compartido sin salir del área administrativa protegida por permisos."
        eyebrow="Registro de producto"
        title="Detalle del producto"
      />

      <section className={sectionClassName}>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Nombre
            </dt>
            <dd className="text-lg font-semibold text-stone-950">{record.name}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Estado
            </dt>
            <dd className="text-sm text-stone-700">
              {record.isActive ? "Activo" : "Inactivo"}
            </dd>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              Descripción
            </dt>
            <dd className="text-sm leading-7 text-stone-700">
              {record.description || "No se proporcionó una descripción."}
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
