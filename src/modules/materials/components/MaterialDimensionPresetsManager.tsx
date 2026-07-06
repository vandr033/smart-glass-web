"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import { getApiErrorMessage } from "@/utils";

import { MATERIALS_PERMISSIONS } from "../constants";
import {
  EMPTY_MATERIAL_DIMENSION_PRESET_FORM_VALUES,
  materialDimensionPresetFormSchema,
  type MaterialDimensionPresetFormValues,
  useMaterials,
} from "../hooks/useMaterials";

type MaterialDimensionPresetsManagerProps = {
  materialId: string;
};

const sectionClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

const fieldClassName =
  "w-full rounded-md border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white";

const labelClassName = "space-y-2";

const formatMeasurement = (value: number | null): string | null => {
  return value === null ? null : `${value} mm`;
};

const formatPresetSummary = (values: {
  heightMm: number | null;
  lengthMm: number | null;
  thicknessMm: number | null;
  widthMm: number | null;
}): string => {
  const parts = [
    values.lengthMm ? `L ${formatMeasurement(values.lengthMm)}` : null,
    values.widthMm ? `W ${formatMeasurement(values.widthMm)}` : null,
    values.heightMm ? `H ${formatMeasurement(values.heightMm)}` : null,
    values.thicknessMm ? `T ${formatMeasurement(values.thicknessMm)}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "No dimensions defined";
};

export function MaterialDimensionPresetsManager({
  materialId,
}: MaterialDimensionPresetsManagerProps) {
  const { permissions } = usePermissions();
  const canUpdate = permissions.includes(MATERIALS_PERMISSIONS.update);
  const {
    useCreateMaterialDimensionPreset,
    useDeleteMaterialDimensionPreset,
    useMaterialDimensionPresets,
    useUpdateMaterialDimensionPreset,
  } = useMaterials();
  const presetsQuery = useMaterialDimensionPresets(materialId);
  const createMutation = useCreateMaterialDimensionPreset();
  const updateMutation = useUpdateMaterialDimensionPreset();
  const deleteMutation = useDeleteMaterialDimensionPreset();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<MaterialDimensionPresetFormValues>(
    EMPTY_MATERIAL_DIMENSION_PRESET_FORM_VALUES,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof MaterialDimensionPresetFormValues, string>>
  >({});

  if (presetsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void presetsQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={presetsQuery.error.message}
        title="Dimension presets could not be loaded"
      />
    );
  }

  const pendingDeletePreset =
    presetsQuery.data?.find((preset) => preset.id === pendingDeleteId) ?? null;

  const closeEditor = () => {
    setEditingPresetId(null);
    setFieldErrors({});
    setFormError(null);
    setFormValues(EMPTY_MATERIAL_DIMENSION_PRESET_FORM_VALUES);
    setIsEditorOpen(false);
  };

  const openCreateEditor = () => {
    setEditingPresetId(null);
    setFieldErrors({});
    setFormError(null);
    setFormValues(EMPTY_MATERIAL_DIMENSION_PRESET_FORM_VALUES);
    setIsEditorOpen(true);
  };

  const openEditEditor = (presetId: string) => {
    const preset = presetsQuery.data?.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    setEditingPresetId(preset.id);
    setFieldErrors({});
    setFormError(null);
    setFormValues({
      heightMm: preset.heightMm === null ? "" : String(preset.heightMm),
      isDefault: preset.isDefault,
      label: preset.label,
      lengthMm: preset.lengthMm === null ? "" : String(preset.lengthMm),
      thicknessMm: preset.thicknessMm === null ? "" : String(preset.thicknessMm),
      widthMm: preset.widthMm === null ? "" : String(preset.widthMm),
    });
    setIsEditorOpen(true);
  };

  return (
    <>
      <section className={sectionClassName}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Dimension Presets
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Reusable size presets
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-stone-700">
              Store recurring stock or sellable dimensions so future price lists, quotes,
              and optimization runs can reference named sizes instead of free-text notes.
            </p>
          </div>

          {canUpdate ? (
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)]"
              onClick={openCreateEditor}
              type="button"
            >
              Add preset
            </button>
          ) : null}
        </div>

        {presetsQuery.data && presetsQuery.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {presetsQuery.data.map((preset) => (
              <article
                key={preset.id}
                className="rounded-lg border border-stone-200/90 bg-white/80 px-5 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-950">{preset.label}</h3>
                      {preset.isDefault ? (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-stone-700">
                      {formatPresetSummary(preset)}
                    </p>
                  </div>
                  {canUpdate ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                        onClick={() => {
                          openEditEditor(preset.id);
                        }}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-md bg-[var(--color-error)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-800"
                        onClick={() => {
                          setPendingDeleteId(preset.id);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Add standard dimensions such as common glass sheets, package sizes, or stock lengths used repeatedly by this material."
            title="No dimension presets yet"
          />
        )}
      </section>

      {isEditorOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close dimension preset editor"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={closeEditor}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-2xl -translate-y-1/2 rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.99),rgba(226,240,255,0.99))] p-6 shadow-[0_28px_70px_rgba(15,47,91,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  {editingPresetId ? "Edit Preset" : "Create Preset"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-950">
                  {editingPresetId ? "Update dimension preset" : "New dimension preset"}
                </h3>
              </div>
              <button
                className="rounded-md border border-stone-300 bg-white p-2 text-stone-600 transition hover:border-stone-400 hover:text-stone-950"
                onClick={closeEditor}
                type="button"
              >
                Close
              </button>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = materialDimensionPresetFormSchema.safeParse(formValues);

                if (!result.success) {
                  const nextFieldErrors: Partial<
                    Record<keyof MaterialDimensionPresetFormValues, string>
                  > = {};

                  result.error.issues.forEach((issue) => {
                    const path = issue.path[0];

                    if (typeof path === "string") {
                      nextFieldErrors[path as keyof MaterialDimensionPresetFormValues] =
                        issue.message;
                    }
                  });

                  setFieldErrors(nextFieldErrors);
                  return;
                }

                try {
                  if (editingPresetId) {
                    await updateMutation.mutateAsync({
                      materialId,
                      presetId: editingPresetId,
                      values: result.data,
                    });
                  } else {
                    await createMutation.mutateAsync({
                      materialId,
                      values: result.data,
                    });
                  }

                  closeEditor();
                } catch (error) {
                  setFormError(getApiErrorMessage(error));
                }
              }}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className={`${labelClassName} md:col-span-2`}>
                  <span className="text-sm font-medium text-stone-700">Label</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        label: event.target.value,
                      }));
                    }}
                    value={formValues.label}
                  />
                  {fieldErrors.label ? (
                    <span className="block text-sm text-rose-700">{fieldErrors.label}</span>
                  ) : null}
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Length (mm)</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        lengthMm: event.target.value,
                      }));
                    }}
                    value={formValues.lengthMm}
                  />
                  {fieldErrors.lengthMm ? (
                    <span className="block text-sm text-rose-700">{fieldErrors.lengthMm}</span>
                  ) : null}
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Width (mm)</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        widthMm: event.target.value,
                      }));
                    }}
                    value={formValues.widthMm}
                  />
                  {fieldErrors.widthMm ? (
                    <span className="block text-sm text-rose-700">{fieldErrors.widthMm}</span>
                  ) : null}
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Height (mm)</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        heightMm: event.target.value,
                      }));
                    }}
                    value={formValues.heightMm}
                  />
                </label>

                <label className={labelClassName}>
                  <span className="text-sm font-medium text-stone-700">Thickness (mm)</span>
                  <input
                    className={fieldClassName}
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        thicknessMm: event.target.value,
                      }));
                    }}
                    value={formValues.thicknessMm}
                  />
                </label>

                <label className="flex items-center gap-3 rounded-md border border-stone-200/90 bg-white/85 px-4 py-4 md:col-span-2">
                  <input
                    checked={formValues.isDefault}
                    className="h-4 w-4 rounded border-stone-300 text-stone-950"
                    onChange={(event) => {
                      setFormValues((current) => ({
                        ...current,
                        isDefault: event.target.checked,
                      }));
                    }}
                    type="checkbox"
                  />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Default preset</p>
                    <p className="text-xs text-stone-600">
                      When enabled, this preset becomes the preferred stock dimension for the
                      material detail view.
                    </p>
                  </div>
                </label>
              </div>

              {formError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                  onClick={closeEditor}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  type="submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : "Save preset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel={deleteMutation.isPending ? "Deleting..." : "Delete preset"}
        description={
          pendingDeletePreset
            ? `Delete ${pendingDeletePreset.label}? This will remove the preset from the material detail view.`
            : "Delete this preset?"
        }
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!pendingDeleteId) {
            return;
          }

          await deleteMutation.mutateAsync({
            materialId,
            presetId: pendingDeleteId,
          });
          setPendingDeleteId(null);
        }}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setPendingDeleteId(null);
          }
        }}
        open={Boolean(pendingDeletePreset)}
        title="Delete preset?"
        tone="danger"
      />
    </>
  );
}
