"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Boxes, Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";

import { MATERIALS_PERMISSIONS, MATERIALS_ROUTES } from "../constants";
import { useMaterials } from "../hooks/useMaterials";
import { BooleanBadge, MaterialStatusBadge, MaterialTypeBadge } from "./MaterialBadges";
import { MaterialDimensionPresetsManager } from "./MaterialDimensionPresetsManager";
import { SupplierMaterialEquivalencesManager } from "./SupplierMaterialEquivalencesManager";

type MaterialDetailProps = {
  materialId: string;
};

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

const formatDate = (value: string | null): string => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatMillimeter = (value: number | null): string => {
  return value === null ? "Not set" : `${value} mm`;
};

const formatUnitConversion = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "Not defined";
  }

  return JSON.stringify(value, null, 2);
};

export function MaterialDetail({ materialId }: MaterialDetailProps) {
  const router = useRouter();
  const { permissions } = usePermissions();
  const { useDeleteMaterial, useMaterial } = useMaterials();
  const materialQuery = useMaterial(materialId);
  const deleteMutation = useDeleteMaterial();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const canEdit = permissions.includes(MATERIALS_PERMISSIONS.update);
  const canDelete = permissions.includes(MATERIALS_PERMISSIONS.delete);

  if (materialQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void materialQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={materialQuery.error.message}
        title="Material details could not be loaded"
      />
    );
  }

  if (materialQuery.isLoading || !materialQuery.data) {
    return (
      <section className={sectionClassName}>
        <p className="text-sm text-stone-500">Cargando detalle del material…</p>
      </section>
    );
  }

  const material = materialQuery.data;

  return (
    <main className="space-y-6">
      <section className={sectionClassName}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-[var(--color-primary)] p-4 text-blue-100">
              <Boxes className="h-7 w-7" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Material Record
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                  {material.code}
                </h1>
                <p className="mt-2 text-lg text-stone-700">{material.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <MaterialTypeBadge value={material.materialType} />
                <MaterialStatusBadge value={material.status} />
                <span className="rounded-full bg-white/85 px-3 py-1.5 text-xs font-semibold text-stone-700">
                  {material.category.name}
                </span>
              </div>
              <p className="max-w-3xl text-sm leading-7 text-stone-700">
                {material.description ||
                  "No additional description has been saved for this material yet."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
              href={MATERIALS_ROUTES.list}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to materials
            </Link>
            {canEdit ? (
              <Link
                className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-primary-hover)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
                href={MATERIALS_ROUTES.edit(material.id)}
              >
                <Pencil className="h-4 w-4" />
                Edit material
              </Link>
            ) : null}
            {canDelete ? (
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[var(--color-error)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
                onClick={() => {
                  setIsDeleteDialogOpen(true);
                }}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Units
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {material.baseUnit} / {material.purchaseUnit} / {material.stockUnit}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Consumption: {material.consumptionUnit}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Stock Behavior
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BooleanBadge falseLabel="Non-stock" trueLabel="Stockable" value={material.isStockable} />
            <BooleanBadge falseLabel="Not purchasable" trueLabel="Purchasable" value={material.isPurchasable} />
            <BooleanBadge falseLabel="Not sellable" trueLabel="Sellable" value={material.isSellable} />
          </div>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Cutting Profile
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {material.cuttingProfile.strategy.toUpperCase()}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {material.cuttingProfile.isCuttable
              ? "Configured for cutting-aware workflows."
              : "No cutting workflow enabled."}
          </p>
        </article>
        <article className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Remnants
          </p>
          <p className="mt-3 text-lg font-semibold text-stone-950">
            {material.remnantRules.eligible ? "Eligible" : "Not eligible"}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Strategy: {material.remnantRules.strategy.toUpperCase()}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Overview
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Color
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {material.color || "Not provided"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Finish
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {material.finish || "Not provided"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Brand
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {material.brand || "Not provided"}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Thickness
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatMillimeter(material.thicknessMm)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Standard length
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatMillimeter(material.standardLengthMm)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Standard width
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatMillimeter(material.standardWidthMm)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Minimum reusable length
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatMillimeter(material.minimumReusableLengthMm)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Created
              </dt>
              <dd className="mt-2 font-medium text-stone-900">
                {formatDate(material.createdAt)}
              </dd>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Unit conversion JSON
              </dt>
              <dd className="mt-2 overflow-x-auto rounded-[1rem] bg-[var(--color-primary)] px-4 py-3 font-mono text-xs text-[color:var(--color-primary-contrast)]">
                <pre>{formatUnitConversion(material.unitConversionJson)}</pre>
              </dd>
            </div>
          </dl>
        </section>

        <section className={sectionClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
            Behavior Notes
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Active warnings
              </p>
              {material.behaviorValidation.warnings.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-stone-700">
                  {material.behaviorValidation.warnings.map((warning) => (
                    <li key={`${warning.path}:${warning.message}`}>{warning.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-stone-700">
                  No behavior recommendations are currently outstanding.
                </p>
              )}
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Rotation
              </p>
              <p className="mt-3 text-sm text-stone-700">
                {material.allowsRotation
                  ? "Rotation is allowed for future sheet optimization."
                  : "Rotation is disabled for this material."}
              </p>
            </div>
            <div className="rounded-md border border-stone-200/90 bg-white/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Notes
              </p>
              <p className="mt-3 text-sm text-stone-700">
                {material.notes || "No internal notes have been saved for this material yet."}
              </p>
            </div>
          </div>
        </section>
      </section>

      <MaterialDimensionPresetsManager materialId={material.id} />

      <SupplierMaterialEquivalencesManager materialId={material.id} />

      <section className="grid gap-6 xl:grid-cols-3">
        <EmptyState
          description="Future price lists will attach supplier-specific pricing and validity windows directly to this material."
          title="Price list placeholder"
        />
        <EmptyState
          description="Inventory balances, remnants, and reservations will surface here once stock movement modules are implemented."
          title="Inventory placeholder"
        />
        <EmptyState
          description="Quote usage, template references, and downstream demand signals will appear here in a later module."
          title="Quote usage placeholder"
        />
      </section>

      <ConfirmDialog
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete material"}
        description={`Soft delete ${material.code} and preserve its audit history for future reference.`}
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          await deleteMutation.mutateAsync(material.id);
          router.push(MATERIALS_ROUTES.list);
          router.refresh();
        }}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setIsDeleteDialogOpen(false);
          }
        }}
        open={isDeleteDialogOpen}
        title="Delete material?"
        tone="danger"
      />
    </main>
  );
}
