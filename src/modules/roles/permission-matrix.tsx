"use client";

import {
  formatModuleLabel,
  formatPermissionDescription,
  formatPermissionLabel,
} from "@/lib/formatters";
import { PERMISSION_GROUPS } from "@/lib/permission-catalog";
import type { PermissionCatalogGroup } from "@/types";

type PermissionMatrixProps = {
  disabled?: boolean;
  error?: string;
  groups?: PermissionCatalogGroup[];
  helperText?: string;
  lockedPermissionNames?: string[];
  onChange?: (permissionNames: string[]) => void;
  permissionNames: string[];
  readOnly?: boolean;
};

const panelClassName =
  "rounded-lg border border-stone-200/90 bg-white/80 p-4 shadow-[0_8px_24px_rgba(15,47,91,0.04)]";

export function PermissionMatrix({
  disabled = false,
  error,
  groups = PERMISSION_GROUPS,
  helperText,
  lockedPermissionNames = [],
  onChange,
  permissionNames,
  readOnly = false,
}: PermissionMatrixProps) {
  const selectedPermissions = new Set(permissionNames);
  const lockedPermissions = new Set(lockedPermissionNames);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-700">Matriz de permisos</p>
          <p className="text-xs text-stone-500">
            Asigna permisos explícitos por dominio para mantener cada rol auditable
            y listo para futuros módulos.
          </p>
        </div>
        <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          {selectedPermissions.size} habilitados
        </div>
      </div>

      {helperText ? (
        <div className="rounded-md border border-blue-200/80 bg-blue-50/90 px-4 py-3 text-sm text-blue-900">
          {helperText}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.key} className={panelClassName}>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-stone-950">
                {formatModuleLabel(group.label || group.key)}
              </h3>
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
                {group.key.replace(/_/g, " ")}
              </p>
            </div>

            <div className="space-y-3">
              {group.permissions.map((permission) => {
                const isLocked = lockedPermissions.has(permission.key);
                const isChecked = selectedPermissions.has(permission.key);

                return (
                  <label
                    key={permission.key}
                    className={`flex items-start gap-3 rounded-md border px-3 py-3 transition ${
                      isChecked
                        ? "border-blue-300/80 bg-blue-50/70"
                        : "border-stone-200/90 bg-stone-50/60"
                    }`}
                  >
                    <input
                      checked={isChecked}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-[color:var(--color-primary)] focus:ring-blue-300"
                      disabled={disabled || readOnly || isLocked}
                      onChange={(event) => {
                        if (!onChange) {
                          return;
                        }

                        const nextPermissions = event.target.checked
                          ? [...permissionNames, permission.key]
                          : permissionNames.filter((value) => value !== permission.key);

                        onChange(Array.from(new Set(nextPermissions)).sort());
                      }}
                      type="checkbox"
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-semibold text-stone-900">
                        {formatPermissionLabel(permission.key)}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {formatPermissionDescription(permission.key)}
                      </span>
                      <span className="block font-mono text-[11px] text-stone-500">
                        {permission.key}
                      </span>
                      {isLocked ? (
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
                          Protegido
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {error ? (
        <div className="rounded-md border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
