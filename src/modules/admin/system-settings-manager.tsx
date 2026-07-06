"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, X } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import { QUERY_KEYS } from "@/lib/constants";
import { systemSettingService } from "@/services/system-setting-service";
import { getApiErrorMessage } from "@/utils";

const formatJson = (value: unknown): string => {
  return JSON.stringify(value, null, 2);
};

const formatUpdatedAt = (value: string): string => {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

type EditingState = {
  description: string;
  key: string;
  valueText: string;
};

export function SystemSettingsManager() {
  const queryClient = useQueryClient();
  const { permissions } = usePermissions();
  const canEdit = permissions.includes("system.settings.update");
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryFn: systemSettingService.getSettings,
    queryKey: QUERY_KEYS.systemSettings,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: EditingState) => {
      const parsedValue = JSON.parse(input.valueText) as unknown;

      return systemSettingService.updateSetting(input.key, {
        description: input.description.trim() || null,
        valueJson: parsedValue,
      });
    },
    onSuccess: async (setting) => {
      setValidationError(null);
      setSaveMessage(`Saved ${setting.key}.`);
      setEditingState(null);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.systemSettings,
      });
    },
    onError: (error) => {
      setValidationError(getApiErrorMessage(error));
      setSaveMessage(null);
    },
  });

  const sortedSettings = useMemo(
    () => [...(settingsQuery.data ?? [])].sort((left, right) => left.key.localeCompare(right.key)),
    [settingsQuery.data],
  );

  if (settingsQuery.isError) {
    return (
      <ErrorState
        action={
          <button
            className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
            onClick={() => {
              void settingsQuery.refetch();
            }}
            type="button"
          >
            Retry
          </button>
        }
        description={settingsQuery.error.message}
        title="System settings could not be loaded"
      />
    );
  }

  return (
    <>
      <section className="rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Configuration Registry
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              System Settings
            </h2>
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
            {sortedSettings.length} keys
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-stone-200/90">
          <table className="min-w-full divide-y divide-stone-200/80">
            <thead className="bg-white/90">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 bg-white/75 text-sm text-stone-700">
              {sortedSettings.map((setting) => (
                <tr key={setting.id}>
                  <td className="px-4 py-4 align-top">
                    <p className="font-mono text-xs font-semibold text-stone-900">
                      {setting.key}
                    </p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    {setting.description || "No description provided."}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <code className="block max-w-[30rem] overflow-hidden text-ellipsis whitespace-nowrap rounded-lg bg-blue-950/95 px-3 py-2 text-xs text-[color:var(--color-primary-contrast)]">
                      {formatJson(setting.valueJson)}
                    </code>
                  </td>
                  <td className="px-4 py-4 align-top text-stone-500">
                    {formatUpdatedAt(setting.updatedAt)}
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <button
                      className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!canEdit}
                      onClick={() => {
                        setValidationError(null);
                        setSaveMessage(null);
                        setEditingState({
                          description: setting.description ?? "",
                          key: setting.key,
                          valueText: formatJson(setting.valueJson),
                        });
                      }}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!canEdit ? (
          <div className="mt-5 rounded-lg border border-blue-200/80 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Your access is read-only. You can review settings here, but only users with
            `system.settings.update` can change them.
          </div>
        ) : null}

        {saveMessage ? (
          <div className="mt-5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}
      </section>

      {editingState ? (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close setting editor"
            className="absolute inset-0 bg-[rgba(24,18,12,0.45)]"
            onClick={() => {
              setEditingState(null);
            }}
            type="button"
          />
          <div className="absolute inset-x-4 top-1/2 mx-auto w-full max-w-3xl -translate-y-1/2 rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(248,251,255,0.99),rgba(226,240,255,0.99))] p-6 shadow-[0_28px_70px_rgba(15,47,91,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
                  Edit Setting
                </p>
                <h2 className="mt-2 font-mono text-xl font-semibold text-stone-950">
                  {editingState.key}
                </h2>
              </div>
              <button
                className="inline-flex rounded-md border border-stone-300 bg-white p-3 text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                onClick={() => {
                  setEditingState(null);
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">Description</span>
                <input
                  className="rounded-md border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
                  onChange={(event) => {
                    setEditingState((current) =>
                      current
                        ? {
                            ...current,
                            description: event.target.value,
                          }
                        : current,
                    );
                  }}
                  value={editingState.description}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-stone-700">JSON Value</span>
                <textarea
                  className="min-h-[20rem] rounded-md border border-stone-200 bg-[var(--color-primary)] px-4 py-4 font-mono text-sm text-[color:var(--color-primary-contrast)] outline-none transition focus:border-[color:var(--color-primary)]"
                  onChange={(event) => {
                    setEditingState((current) =>
                      current
                        ? {
                            ...current,
                            valueText: event.target.value,
                          }
                        : current,
                    );
                    setValidationError(null);
                  }}
                  value={editingState.valueText}
                />
              </label>

              {validationError ? (
                <div className="rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {validationError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    try {
                      JSON.parse(editingState.valueText);
                      updateMutation.mutate(editingState);
                    } catch {
                      setValidationError("valueJson must be valid JSON.");
                    }
                  }}
                  type="button"
                >
                  <Save className="h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save setting"}
                </button>
                <button
                  className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                  onClick={() => {
                    setEditingState(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
