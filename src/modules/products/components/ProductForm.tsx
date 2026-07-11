"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PackagePlus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";

import { ErrorState } from "@/components/ui/error-state";
import { getApiErrorMessage } from "@/utils";

import {
  PRODUCTS_ROUTES,
} from "../constants";
import {
  productFormSchema,
  type ProductFormValues,
  useProducts,
} from "../hooks/useProducts";

type ProductFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      productId: string;
    };

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

export function ProductForm(props: ProductFormProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const { useProduct, useCreateProduct, useUpdateProduct } = useProducts();
  const editingId = props.mode === "edit" ? props.productId : "";
  const productQuery = useProduct(editingId);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    defaultValues: {
      description: "",
      isActive: true,
      name: "",
    },
    resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
  });

  useEffect(() => {
    if (props.mode !== "edit" || !productQuery.data) {
      return;
    }

    form.reset({
      description: productQuery.data.description ?? "",
      isActive: productQuery.data.isActive,
      name: productQuery.data.name,
    });
  }, [form, props.mode, productQuery.data]);

  if (props.mode === "edit" && productQuery.isError) {
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
        title="No se pudo cargar el detalle del producto"
      />
    );
  }

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    productQuery.isLoading;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        try {
          const record =
            props.mode === "create"
              ? await createMutation.mutateAsync(values)
              : await updateMutation.mutateAsync({
                  productId: props.productId,
                  values,
                });

          setSubmitError(null);
          setSubmitMessage(
            props.mode === "create"
              ? "Producto creado correctamente."
              : "Producto actualizado correctamente.",
          );

          router.push(PRODUCTS_ROUTES.view(record.id));
          router.refresh();
        } catch (error) {
          setSubmitMessage(null);
          setSubmitError(getApiErrorMessage(error));
        }
      })}
    >
      <section className={sectionClassName}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              {props.mode === "create" ? "Crear producto" : "Editar producto"}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {props.mode === "create"
                ? "Add a product"
                : `Update ${productQuery.data?.name ?? "product"}`}
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-stone-700">
              Keep future modules consistent by reusing the same validation, logging, and
              permission-aware form foundation.
            </p>
          </div>

          <Link
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            href={props.mode === "create" ? PRODUCTS_ROUTES.list : PRODUCTS_ROUTES.view(props.productId)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-stone-700">Name</span>
            <input
              className="w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy}
              placeholder="Ingrese el nombre del producto"
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <span className="text-sm text-rose-700">
                {form.formState.errors.name.message}
              </span>
            ) : null}
          </label>

          <label className="flex items-center justify-between gap-4 rounded-lg border border-stone-200/90 bg-white/85 px-4 py-4">
            <span className="space-y-1">
              <span className="block text-sm font-medium text-stone-700">Estado activo</span>
              <span className="block text-xs text-stone-500">
                Keep this product visible in active table results.
              </span>
            </span>
            <input
              className="h-5 w-5 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
              disabled={isBusy}
              type="checkbox"
              {...form.register("isActive")}
            />
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-sm font-medium text-stone-700">Description</span>
          <textarea
            className="min-h-40 w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isBusy}
            placeholder="Describe how this product should be used"
            {...form.register("description")}
          />
          {form.formState.errors.description ? (
            <span className="text-sm text-rose-700">
              {form.formState.errors.description.message}
            </span>
          ) : null}
        </label>
      </section>

      {submitError ? (
        <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      {submitMessage ? (
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {submitMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
          type="submit"
        >
          {props.mode === "create" ? <PackagePlus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {isBusy
            ? props.mode === "create"
              ? "Creating product..."
              : "Saving changes..."
            : props.mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
