"use client";

import { useMemo, useState } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldEllipsis, ShieldPlus } from "lucide-react";

import { DataTable, type DataTableConfig } from "@/components/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { usePermissions } from "@/hooks/use-permissions";
import { QUERY_KEYS } from "@/lib/constants";
import { PermissionMatrix } from "@/modules/roles/permission-matrix";
import { getRoleDescription } from "@/modules/roles/localization";
import { permissionService } from "@/services/permission-service";
import { roleService } from "@/services/role-service";
import type { RoleDetails, RoleTableRow } from "@/types";
import { cn, getApiErrorMessage } from "@/utils";

const formatRoleDate = (value: string) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
  }).format(new Date(value));

const roleColumns: ColumnDef<RoleTableRow>[] = [
  {
    accessorKey: "name",
    cell: ({ row }) => (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-stone-950">{row.original.name}</p>
          {row.original.isAdmin ? (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-900">
              SUPER_ADMIN
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {getRoleDescription(row.original.name, row.original.description)}
        </p>
      </div>
    ),
    header: "Rol",
  },
  {
    accessorKey: "usersCount",
    cell: ({ row }) => (
      <span className="font-semibold text-stone-900">{row.original.usersCount}</span>
    ),
    header: "Usuarios",
  },
  {
    accessorKey: "createdAt",
    cell: ({ row }) => (
      <span className="text-sm text-stone-600">
        {formatRoleDate(row.original.createdAt)}
      </span>
    ),
    header: "Creado",
  },
];

const cardClassName =
  "rounded-lg border border-stone-300/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.95))] p-6 shadow-[0_20px_50px_rgba(15,47,91,0.08)]";

const normalizePermissionKeys = (permissionKeys: string[]): string[] => {
  return Array.from(new Set(permissionKeys)).sort((left, right) =>
    left.localeCompare(right),
  );
};

const arePermissionListsEqual = (
  left: string[],
  right: string[],
): boolean => {
  const normalizedLeft = normalizePermissionKeys(left);
  const normalizedRight = normalizePermissionKeys(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every((permission, index) => permission === normalizedRight[index]);
};

const splitPermissionsByCatalog = (
  permissionKeys: string[],
  catalogPermissionKeys: Set<string>,
): {
  known: string[];
  unknown: string[];
} => {
  if (catalogPermissionKeys.size === 0) {
    return {
      known: normalizePermissionKeys(permissionKeys),
      unknown: [],
    };
  }

  const known: string[] = [];
  const unknown: string[] = [];

  permissionKeys.forEach((permissionKey) => {
    if (catalogPermissionKeys.has(permissionKey)) {
      known.push(permissionKey);
      return;
    }

    unknown.push(permissionKey);
  });

  return {
    known: normalizePermissionKeys(known),
    unknown: normalizePermissionKeys(unknown),
  };
};

const LEGACY_PERMISSION_SAVE_ERROR =
  "Este rol todavía contiene permisos heredados de una configuración anterior del ERP. Revisa la matriz visible y guarda nuevamente para reemplazarlos por el catálogo actual.";

const getRolePermissionSaveError = (error: unknown): string => {
  const message = getApiErrorMessage(error);

  if (
    /permission(?:Keys|Names)/i.test(message) ||
    /foundation catalog/i.test(message) ||
    /no longer supported by this ERP version/i.test(message)
  ) {
    return LEGACY_PERMISSION_SAVE_ERROR;
  }

  return message;
};

export function RolesManager() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, permissions } = usePermissions();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<{
    permissionKeys: string[];
    roleId: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canUpdateRoles = permissions.includes("system.roles.update");

  const permissionCatalogQuery = useQuery({
    queryFn: permissionService.getPermissionCatalog,
    queryKey: QUERY_KEYS.permissionCatalog,
    staleTime: 60_000,
  });

  const permissionCatalogKeySet = useMemo(
    () =>
      new Set(permissionCatalogQuery.data?.permissions.map((permission) => permission.key) ?? []),
    [permissionCatalogQuery.data?.permissions],
  );

  const roleDetailQuery = useQuery({
    enabled: Boolean(selectedRoleId),
    queryFn: () => roleService.getRoleById(selectedRoleId as string),
    queryKey: selectedRoleId
      ? QUERY_KEYS.roleDetails(selectedRoleId)
      : ["roles", "selected"],
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (role: RoleDetails) =>
      roleService.updateRolePermissions(
        role.id,
        normalizePermissionKeys(
          draftState?.roleId === role.id
            ? draftState.permissionKeys
            : splitPermissionsByCatalog(role.permissions, permissionCatalogKeySet).known,
        ),
      ),
    onSuccess: async (role) => {
      setSaveError(null);
      setSaveMessage(
        selectedRole?.id === role.id && hiddenLegacyPermissions.length > 0
          ? `Se actualizaron los permisos de ${role.name}. Los permisos heredados fueron eliminados.`
          : `Se actualizaron los permisos de ${role.name}.`,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roles,
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.roleDetails(role.id),
        }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.authorization,
        }),
      ]);
    },
    onError: (error) => {
      setSaveMessage(null);
      setSaveError(getRolePermissionSaveError(error));
    },
  });

  const selectedRole = roleDetailQuery.data ?? null;
  const selectedRolePermissionState = selectedRole
    ? splitPermissionsByCatalog(selectedRole.permissions, permissionCatalogKeySet)
    : {
        known: [],
        unknown: [],
      };

  const hiddenLegacyPermissions = selectedRolePermissionState.unknown;
  const draftPermissions =
    selectedRole && draftState?.roleId === selectedRole.id
      ? draftState.permissionKeys
      : selectedRolePermissionState.known;
  const isReadOnlyForRole =
    !selectedRole ||
    !canUpdateRoles ||
    (selectedRole.name === "SUPER_ADMIN" && !isSuperAdmin);
  const hasVisibleChanges =
    selectedRole !== null &&
    !arePermissionListsEqual(selectedRolePermissionState.known, draftPermissions);
  const hasUnsavedChanges =
    selectedRole !== null &&
    (hasVisibleChanges || hiddenLegacyPermissions.length > 0);

  const helperText = useMemo(() => {
    if (!selectedRole) {
      return "Selecciona un rol del directorio para revisar o actualizar su matriz de permisos.";
    }

    if (selectedRole.name === "SUPER_ADMIN" && !isSuperAdmin) {
      return "Solo los usuarios SUPER_ADMIN pueden editar el conjunto de permisos de SUPER_ADMIN.";
    }

    if (!canUpdateRoles) {
      return "Puedes revisar los permisos del rol, pero tu acceso es de solo lectura.";
    }

    if (selectedRole.name === "SUPER_ADMIN") {
      return "Los cambios en SUPER_ADMIN se permiten solo porque tu cuenta actual también es SUPER_ADMIN.";
    }

    return "Actualiza la matriz y guarda para cambiar los accesos de este rol.";
  }, [canUpdateRoles, isSuperAdmin, selectedRole]);

  const legacyPermissionMessage = useMemo(() => {
    if (hiddenLegacyPermissions.length === 0) {
      return null;
    }

    const permissionLabel =
      hiddenLegacyPermissions.length === 1 ? "permiso" : "permisos";

    if (isReadOnlyForRole) {
      return `Este rol todavía incluye ${hiddenLegacyPermissions.length} ${permissionLabel} heredado${hiddenLegacyPermissions.length === 1 ? "" : "s"} oculto${hiddenLegacyPermissions.length === 1 ? "" : "s"} en el catálogo actual del ERP. Un usuario con acceso para actualizar roles debe guardar este rol para eliminarlos.`;
    }

    return `Este rol todavía incluye ${hiddenLegacyPermissions.length} ${permissionLabel} heredado${hiddenLegacyPermissions.length === 1 ? "" : "s"} oculto${hiddenLegacyPermissions.length === 1 ? "" : "s"} en el catálogo actual del ERP. Guarda este rol para eliminarlos y mantener la matriz alineada con el conjunto de permisos vigente.`;
  }, [hiddenLegacyPermissions.length, isReadOnlyForRole]);

  const selectedRoleTitle = selectedRole
    ? selectedRole.name
    : selectedRoleId && roleDetailQuery.isLoading
      ? "Cargando rol..."
      : "Selecciona un rol";
  const selectedRoleDescription =
    selectedRole
      ? getRoleDescription(selectedRole.name, selectedRole.description)
      : selectedRoleId && roleDetailQuery.isLoading
        ? "Cargando los detalles del rol seleccionado y su matriz de permisos."
        : "Selecciona un rol del directorio superior para revisar sus accesos y actualizar la matriz de permisos.";
  const saveStateLabel =
    hiddenLegacyPermissions.length > 0
      ? "Los permisos heredados se eliminarán al guardar"
      : hasVisibleChanges
        ? "Cambios sin guardar"
        : "Guardado";

  const tableConfig: DataTableConfig<RoleTableRow> = {
    columns: roleColumns,
    defaultSort: {
      desc: false,
      id: "name",
    },
    emptyState: {
      description: "No se encontraron roles con la búsqueda actual.",
      title: "No hay roles disponibles",
    },
    enableSelection: false,
    getRowId: (row) => row.id,
    queryKey: QUERY_KEYS.roles,
    rowActions: [
      {
        icon: ShieldPlus,
        id: "manage",
        label: "Gestionar permisos",
        onClick: (row) => {
          setSelectedRoleId(row.id);
          setDraftState(null);
          setSaveError(null);
          setSaveMessage(null);
        },
      },
    ],
    searchPlaceholder: "Buscar roles por nombre o descripción",
  };

  return (
    <div className="space-y-6">
      <section className={cardClassName}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Directorio de roles
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
              Roles y permisos
            </h2>
          </div>
          <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
            `GET /api/roles`
          </div>
        </div>

        <DataTable config={tableConfig} endpoint="/roles" />
      </section>

      <section className={cardClassName}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-primary)]">
              Matriz de permisos
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {selectedRoleTitle}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-700">
              {selectedRoleDescription}
            </p>

            {selectedRole ? (
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                    selectedRole.name === "SUPER_ADMIN"
                      ? "bg-blue-100 text-blue-900"
                      : "bg-white/80 text-stone-600",
                  )}
                >
                  {selectedRole.name === "SUPER_ADMIN" ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <ShieldEllipsis className="h-4 w-4" />
                  )}
                  {selectedRole.usersCount} usuarios asignados
                </div>
                <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                  {draftPermissions.length} permisos del catálogo
                </div>
                {hiddenLegacyPermissions.length > 0 ? (
                  <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-900">
                    {hiddenLegacyPermissions.length} heredados ocultos
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[color:var(--color-primary-contrast)] transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={
                !selectedRole ||
                !hasUnsavedChanges ||
                isReadOnlyForRole ||
                updatePermissionsMutation.isPending ||
                permissionCatalogQuery.isLoading ||
                permissionCatalogQuery.isError
              }
              onClick={() => {
                if (!selectedRole) {
                  return;
                }

                updatePermissionsMutation.mutate(selectedRole);
              }}
              type="button"
            >
              <ShieldCheck className="h-4 w-4" />
              {updatePermissionsMutation.isPending ? "Guardando..." : "Guardar permisos"}
            </button>
            {selectedRole ? (
              <span className="text-sm text-stone-500">{saveStateLabel}</span>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          {permissionCatalogQuery.isError ? (
            <ErrorState
              action={
                <button
                className="inline-flex items-center rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                onClick={() => {
                  void permissionCatalogQuery.refetch();
                }}
                type="button"
              >
                  Reintentar
                </button>
              }
              description={permissionCatalogQuery.error.message}
              title="No se pudo cargar el catálogo de permisos"
            />
          ) : !selectedRole ? (
            <div className="rounded-lg border border-dashed border-stone-300/80 bg-white/70 px-6 py-12 text-center text-sm leading-7 text-stone-600">
              {selectedRoleId && roleDetailQuery.isLoading
                ? "Cargando los permisos del rol seleccionado..."
                : "Selecciona un rol del directorio superior para revisar o actualizar sus permisos."}
            </div>
          ) : (
            <div className="space-y-5">
              {legacyPermissionMessage ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {legacyPermissionMessage}
                </div>
              ) : null}

              <PermissionMatrix
                disabled={
                  permissionCatalogQuery.isLoading || updatePermissionsMutation.isPending
                }
                groups={permissionCatalogQuery.data?.groups}
                helperText={helperText}
                onChange={(permissionKeys) => {
                  if (!selectedRole) {
                    return;
                  }

                  setDraftState({
                    permissionKeys,
                    roleId: selectedRole.id,
                  });
                  setSaveError(null);
                  setSaveMessage(null);
                }}
                permissionNames={draftPermissions}
                readOnly={isReadOnlyForRole}
              />
            </div>
          )}
        </div>

        {saveError ? (
          <div className="mt-5 rounded-lg border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {saveError}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="mt-5 rounded-lg border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saveMessage}
          </div>
        ) : null}
      </section>
    </div>
  );
}
